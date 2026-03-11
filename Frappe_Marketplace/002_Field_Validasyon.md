# TradeHub B2B — Master Implementation Prompt

Sen bir Frappe/ERPNext uzman geliştiricisisin. Aşağıda sana verilen 5 plan belgesi,
TradeHub B2B Marketplace platformunun tamamlanmamış, eksik veya yanlış çalışan
alanlarını ve yeni geliştirme gereksinimlerini tanımlamaktadır. Her belgeyi eksiksiz
uygulamanız beklenmektedir.

---

## 📋 PROJE BAĞLAMI (CLAUDE.md)

Bu bölüm projenin gerçek yapısını, kurallarını ve cross-app referanslarını içerir.
Recovery veya context kaybı durumunda bu bölüm tek başına yeterli bağlamı sağlar.

---

### 1. PROJE KİMLİĞİ

- **Platform:** B2B Marketplace (İstoç Ticaret Merkezi bazlı)
- **Framework:** Frappe v15 (Python 3.12 + Client-side JS/jQuery)
- **Monorepo root:** `/home/ali/Masaüstü/Frappe_Marketplace` (tüm app'ler tek git repo)
- **Bench dizini:** frappe-bench/
- **Site:** marketplace.local
- **App sayısı:** 7 custom app + 3 yardımcı app (tr_tradehub, tr_consent_center, tr_contract_center)
- **Mimari:** Katmanlı bağımlılık zinciri (aşağıda)

---

### 2. APP BAĞIMLILIK ZİNCİRİ

```
tradehub_core (TEMEL — bağımlılığı yok)
├── tradehub_catalog (PIM katmanı → core)
│   ├── tradehub_commerce (Sipariş/Ödeme → core + catalog)
│   │   ├── tradehub_logistics (Kargo → core + commerce)
│   │   └── tradehub_marketing (Pazarlama → core + catalog + commerce)
│   └── tradehub_seller (Satıcı → core + catalog)
└── tradehub_compliance (Uyum/Sözleşme → core)
```

**Kural:** Bir app, yalnızca required_apps listesindeki app'lerin DocType'larına Link verebilir.
Yukarı yönde referans YAPILAMAZ (ör: tradehub_core → tradehub_seller referans veremez).

---

### 3. APP DETAYLARI

---

#### 3.1 tradehub_core
- **Açıklama:** Temel platform altyapısı — multi-tenant izolasyon, ECA rule engine, Buyer, Organization, KYC, Coğrafi veriler
- **App dizini:** apps/tradehub_core/tradehub_core/
- **Modül dizini:** apps/tradehub_core/tradehub_core/tradehub_core/
- **DocType dizini:** apps/tradehub_core/tradehub_core/tradehub_core/doctype/
- **Bağımlılıklar:** Yok (temel katman)

**Aktif hooks.py:**
- doc_events["*"] → before_insert + validate: tradehub_core.utils.tenant.validate_tenant
- doc_events["*"] → on_update + on_submit + on_cancel + after_insert + on_trash: tradehub_core.eca.dispatcher.evaluate_rules
- doc_events["Customer"] → ERPNext reverse sync (on_update, after_insert, on_trash)
- scheduler_events: Yok (henüz aktif değil)

**DocType'lar (30):** Tenant, Buyer Profile, Buyer Category (is_tree), Buyer Interest Category (child), Buyer Level, Buyer Level Benefit (child), Organization, Organization Member (child), Premium Buyer, KYC Profile, KYC Document, City, District, Neighborhood, Commercial Region, Phone Code, Address Item (child), Location Item (child), ECA Rule, ECA Rule Action (child), ECA Rule Condition (child), ECA Rule Log, ECA Action Template, Analytics Settings, ERPNext Integration Settings, Keycloak Settings, Import Job, Import Job Error (child), File Attachment (child), Notification Template

**Utility modüller:** tradehub_core/utils/tenant.py, tradehub_core/utils/erpnext_sync.py, tradehub_core/utils/seller_payout.py, tradehub_core/eca/dispatcher.py, tradehub_core/webhooks/erpnext_hooks.py, tradehub_core/permissions.py

---

#### 3.2 tradehub_catalog
- **Açıklama:** Product Information Management (PIM) — Ürün, Kategori, Attribute, Brand, Media, Variant, Ranking
- **App dizini:** apps/tradehub_catalog/tradehub_catalog/
- **Modül dizini:** apps/tradehub_catalog/tradehub_catalog/tradehub_catalog/
- **DocType dizini:** apps/tradehub_catalog/tradehub_catalog/tradehub_catalog/doctype/
- **Bağımlılıklar:** ["tradehub_core"]

**Aktif hooks.py:**
- doc_events: Yok (Product on_update yorumda)
- scheduler_events: hourly → media_processor, daily → ranking

**DocType'lar (52):**
*Temel Katalog:* Product, Product Variant (JS), Category (is_tree, JS + tree JS), Product Category (child), Brand, Brand Gating, Sales Channel
*Attribute Sistemi:* Attribute (JS), Attribute Value (child), Attribute Set, Attribute Set Item (child), Attribute Label Override (child), Product Attribute, Product Attribute Group, Product Attribute Value (child)
*PIM:* PIM Attribute, PIM Attribute Group, PIM Attribute Option (child), PIM Product, PIM Product Attribute Value (child), PIM Product Category Link (child), PIM Product Class Field Value (child), PIM Product Description (child), PIM Product Media (child), PIM Product Price (child), PIM Product Relation (child), PIM Product Variant, PIM Variant Axis Value (child), PIM Variant Media (child)
*Product Class:* Product Class, Product Class Allowed Status (child), Product Class Attribute Group (child), Product Class Display Field (child), Product Class Field (child), Product Class Role Permission (child), Product Class Search Config (child), Product Family, Family Attribute (child), Family Default Value (child)
*Diğer:* Product Pricing Tier (child), Variant Axis, Media Asset, Media Library, Required Image Angle (child), SEO Meta (child), Filter Config, Category Display Schema (child), Channel Field Mapping (child), Completeness Rule (child), Translatable Attribute Flag (child), Ranking Weight Config, Virtual Category Rule

**Utility modüller:** tradehub_catalog/pim/api.py, pim/channel_export.py, pim/completeness.py, pim/erpnext_sync.py, pim/variant_generator.py, tasks.py

---

#### 3.3 tradehub_commerce
- **Açıklama:** Sipariş, ödeme, teklif, komisyon ve escrow yönetimi
- **App dizini:** apps/tradehub_commerce/tradehub_commerce/
- **Modül dizini:** apps/tradehub_commerce/tradehub_commerce/tradehub_commerce/
- **DocType dizini:** apps/tradehub_commerce/tradehub_commerce/tradehub_commerce/doctype/
- **Bağımlılıklar:** ["tradehub_core", "tradehub_catalog"]

**Aktif hooks.py:**
- doc_events["Sales Order"] → ERPNext reverse sync (on_update, after_insert, on_trash)
- scheduler_events: daily → seller_payout

**DocType'lar (40):**
*Sipariş:* Order (JS), Order Item (child), Order Event, Marketplace Order (JS), Marketplace Order Item (child), Sub Order (JS), Sub Order Item (child)
*Sepet:* Cart (JS), Cart Item (child), Cart Line (child)
*Ödeme:* Payment Intent, Payment Installment (child), Payment Method, Payment Method Customer (child), Payment Plan, Account Action
*Komisyon/Escrow:* Commission Plan, Commission Plan Rate (child), Commission Rule (child), Escrow Account, Escrow Event (child)
*RFQ:* RFQ (JS), RFQ Item (child), RFQ Attachment (child), RFQ Message (child), RFQ Message Thread, RFQ NDA Link (JS), RFQ Quote (JS), RFQ Quote Item (child), RFQ Quote Link (child), RFQ Quote Revision (child), RFQ Target Category (child), RFQ Target Seller (child), RFQ View Log, Quotation, Quotation Item (child)
*Fiyat/Vergi:* Price Break (child), Incoterm Price (child), Tax Rate, Tax Rate Category (child)

**Utility modüller:** tradehub_commerce/rfq_utils/api.py, rfq_utils/nda_integration.py, rfq_utils/tasks.py, integrations/iyzico.py, integrations/paytr.py, webhooks/erpnext_hooks.py, tasks.py

---

#### 3.4 tradehub_seller
- **Açıklama:** Satıcı yaşam döngüsü — profil, başvuru, performans, bakiye, mağaza, listeleme, SKU
- **App dizini:** apps/tradehub_seller/tradehub_seller/
- **Modül dizini:** apps/tradehub_seller/tradehub_seller/tradehub_seller/
- **DocType dizini:** apps/tradehub_seller/tradehub_seller/tradehub_seller/doctype/
- **Bağımlılıklar:** ["tradehub_core", "tradehub_catalog"]

**Aktif hooks.py:**
- doc_events["Supplier"] → ERPNext reverse sync (on_update, after_insert, on_trash)
- scheduler_events: hourly → buybox_rotation, daily → kpi_tasks + tier_tasks

**DocType'lar (33):**
*Profil:* Seller Profile (JS), Seller Store, Seller Application (JS), Seller Application Category (child), Seller Application Document (child), Seller Application History (child), Premium Seller
*Performans:* Seller KPI (JS), Seller Score, Seller Metrics, Seller Tier, Seller Level, Seller Level Benefit (child), Seller Badge
*Finansal:* Seller Balance, Seller Bank Account, Seller Certification
*Etiketleme:* Seller Tag, Seller Tag Assignment, Seller Tag Rule, Seller Tag Rule Condition (child)
*Listeleme/SKU:* Listing (JS), Listing Attribute Value (child), Listing Bulk Pricing Tier (child), Listing Image (child), Listing Variant (child), Listing Variant Attribute (child), Related Listing Product (child), SKU, SKU Product (JS), Buy Box Entry, KPI Template, KPI Template Item (child)

**Utility modüller:** tradehub_seller/seller_tags/rule_engine.py, seller_tags/seller_metrics.py, seller_tags/tasks.py, webhooks/erpnext_hooks.py, tasks.py

---

#### 3.5 tradehub_logistics
- **Açıklama:** Kargo, teslimat, shipping rule, tracking
- **App dizini:** apps/tradehub_logistics/tradehub_logistics/
- **Modül dizini:** apps/tradehub_logistics/tradehub_logistics/tradehub_logistics/
- **DocType dizini:** apps/tradehub_logistics/tradehub_logistics/tradehub_logistics/doctype/
- **Bağımlılıklar:** ["tradehub_core", "tradehub_commerce"]

**Aktif hooks.py:**
- doc_events["Shipment"] → on_update + after_insert: tradehub_logistics.handlers
- scheduler_events: hourly → shipment_tracking

**DocType'lar (10):** Carrier, Logistics Provider, Marketplace Shipment (JS), Shipment, Shipping Rule, Shipping Zone, Shipping Zone Rate (child), Shipping Rate Tier (child), Lead Time, Tracking Event

**Utility modüller:** tradehub_logistics/handlers.py, tasks.py, integrations/carriers/aras.py, integrations/carriers/yurtici.py

---

#### 3.6 tradehub_marketing
- **Açıklama:** Kampanya, kupon, grup alım, abonelik, toptan teklif, mağaza vitrin
- **App dizini:** apps/tradehub_marketing/tradehub_marketing/
- **Modül dizini:** apps/tradehub_marketing/tradehub_marketing/tradehub_marketing/
- **DocType dizini:** apps/tradehub_marketing/tradehub_marketing/tradehub_marketing/doctype/
- **Bağımlılıklar:** ["tradehub_core", "tradehub_catalog", "tradehub_commerce"]

**Aktif hooks.py:**
- doc_events["Campaign"] → on_update + after_insert: tradehub_marketing.handlers
- scheduler_events: daily → campaign_tasks

**DocType'lar (13):** Campaign, Coupon (JS), Coupon Category Item (child), Coupon Product Item (child), Group Buy, Group Buy Commitment (child), Group Buy Payment (child), Group Buy Tier (child), Storefront, Subscription, Subscription Package, Wholesale Offer, Wholesale Offer Product (child)

**Utility modüller:** tradehub_marketing/handlers.py, tasks.py, groupbuy/api.py, groupbuy/pricing.py, groupbuy/tasks.py

---

#### 3.7 tradehub_compliance
- **Açıklama:** Uyum, sözleşme, onay, e-imza, review, moderasyon, risk skoru, mesajlaşma
- **App dizini:** apps/tradehub_compliance/tradehub_compliance/
- **Modül dizini:** apps/tradehub_compliance/tradehub_compliance/tradehub_compliance/
- **DocType dizini:** apps/tradehub_compliance/tradehub_compliance/tradehub_compliance/doctype/
- **Bağımlılıklar:** ["tradehub_core"]

**Aktif hooks.py:**
- doc_events: Yok (henüz aktif değil)
- scheduler_events: daily → certificate_alerts

**DocType'lar (25):** Certificate, Certificate Type, Contract Template, Contract Instance, Contract Revision, Contract Rule, Contract Rule Condition (child), Marketplace Contract Template, Marketplace Contract Instance, Consent Record, Marketplace Consent Record, Consent Topic, Consent Text, Consent Channel, Consent Method, Consent Audit Log, ESign Provider, ESign Transaction, Review (JS), Moderation Case, Risk Score, Risk Score Factor (child), Sample Request, Message, Message Thread

**Utility modüller:** tradehub_compliance/reviews/api.py, reviews/moderation.py, reviews/review_manager.py, reviews/tasks.py, tasks.py

---

### 4. CROSS-APP REFERANS HARİTASI

Bir app'te çalışırken başka app'lerin DocType'larına Link vermeniz gerektiğinde:

| Kaynak App | Hedef DocType | Hedef App | Kullanım |
|------------|--------------|-----------|----------|
| seller | Tenant | core | Seller → Tenant izolasyonu |
| seller | Category | catalog | Listing → Category bağlantısı |
| seller | Product | catalog | Listing → Product bağlantısı |
| commerce | Buyer Profile | core | Order → Buyer bağlantısı |
| commerce | Tenant | core | Order → Tenant izolasyonu |
| commerce | Product | catalog | Order Item → Product |
| commerce | Category | catalog | RFQ Target Category |
| logistics | Order / Sub Order | commerce | Shipment → Order bağlantısı |
| marketing | Product | catalog | Coupon Product Item → Product |
| marketing | Category | catalog | Coupon Category Item → Category |
| marketing | Order | commerce | Campaign satış etkisi |

**ERPNext DocType Referansları (Frappe/ERPNext core'dan):**
- Customer → tradehub_core dinliyor
- Supplier → tradehub_seller dinliyor
- Sales Order → tradehub_commerce dinliyor
- Shipment → tradehub_logistics dinliyor
- Country, Currency, Industry Type → Frappe core, tüm app'ler kullanabilir

---

### 5. FRAPPE MODÜL SİSTEMİ — KRİTİK YAPI (DOKUNMA!)

#### ⚠️ Bu bölüm en kritik kuraldır. İhlal edilirse TÜM uygulama çöker.

Frappe v15, her app için **triple-nested dizin yapısı** kullanır. Bu yapı "duplicate" veya "gereksiz tekrar" DEĞİLDİR — Frappe'nin modül çözümleme mekanizmasının zorunlu parçasıdır.

#### 5.1 Yapı Şeması

```
apps/tradehub_core/                    ← Git repo / app kök dizini
├── setup.py                           ← __version__ import eder
├── tradehub_core/                     ← Python PACKAGE (pip install ile yüklenen)
│   ├── __init__.py                    ← ZORUNLU: __version__ = "0.0.1" içermeli
│   ├── hooks.py                       ← App hook tanımları
│   ├── modules.txt                    ← "TradeHub Core" (modül adı)
│   ├── eca/                           ← Utility modüller (package seviyesinde)
│   ├── utils/                         ← Utility modüller (package seviyesinde)
│   └── tradehub_core/                 ← MODULE dizini (modules.txt'ten türetilir)
│       ├── __init__.py                ← Boş olabilir ama OLMALI
│       ├── doctype/                   ← DocType'lar BURADA
│       │   ├── tenant/
│       │   │   ├── __init__.py
│       │   │   ├── tenant.json
│       │   │   ├── tenant.py
│       │   │   └── tenant.js
│       │   └── buyer_profile/
│       │       └── ...
│       ├── config/
│       └── workspace/
```

#### 5.2 Neden Triple-Nested?

Frappe şu adımlarla modül çözümler:

1. `modules.txt` okunur → `"TradeHub Core"`
2. Scrub edilir → `tradehub_core` (boşluk → `_`, küçük harf)
3. Python import yapılır → `import tradehub_core.tradehub_core`
   - Birinci `tradehub_core` = Python package
   - İkinci `tradehub_core` = Module dizini
4. DocType controller → `from tradehub_core.tradehub_core.doctype.tenant.tenant import Tenant`

**Eğer orta katman (module dizini) silinirse:**
```
ModuleNotFoundError: No module named 'tradehub_core.tradehub_core'
→ bench migrate PATLAR
→ Tüm DocType'lar yüklenemez
→ Site tamamen çalışmaz hale gelir
```

#### 5.3 Tüm App'ler İçin Module Dizin Haritası

| App | Package | Module Dizini | modules.txt |
|-----|---------|---------------|-------------|
| tradehub_core | `tradehub_core/` | `tradehub_core/tradehub_core/` | TradeHub Core |
| tradehub_catalog | `tradehub_catalog/` | `tradehub_catalog/tradehub_catalog/` | TradeHub Catalog |
| tradehub_commerce | `tradehub_commerce/` | `tradehub_commerce/tradehub_commerce/` | TradeHub Commerce |
| tradehub_seller | `tradehub_seller/` | `tradehub_seller/tradehub_seller/` | TradeHub Seller |
| tradehub_logistics | `tradehub_logistics/` | `tradehub_logistics/tradehub_logistics/` | TradeHub Logistics |
| tradehub_marketing | `tradehub_marketing/` | `tradehub_marketing/tradehub_marketing/` | TradeHub Marketing |
| tradehub_compliance | `tradehub_compliance/` | `tradehub_compliance/tradehub_compliance/` | TradeHub Compliance |

#### 5.4 MUTLAK YASAK

- ❌ Module dizinini silme, taşıma veya yeniden adlandırma
- ❌ DocType'ları module dizininden yukarı taşıma
- ❌ Triple-nested yapıyı "düzleştirme" veya "optimize etme"
- ❌ `__init__.py` dosyalarını silme veya boşaltma
- ❌ `modules.txt` içeriğini değiştirme
- ❌ Bu yapıyı "duplicate/gereksiz tekrar" olarak değerlendirme

---

### 6. FRAPPE GELİŞTİRME KURALLARI

#### 6.1 DocType Oluşturma Pattern
```
Dizin: apps/{APP}/{APP}/{MODULE}/doctype/{snake_case_name}/
Dosyalar:
  {name}.json        → DocType schema
  {name}.py          → Python controller (class Name(Document))
  __init__.py         → Boş init
  {name}.js           → Client-side form script (opsiyonel)
  test_{name}.py      → Test (opsiyonel)
```

#### 6.2 Child Table
- JSON'da "istable": 1
- Parent DocType'ta: "fieldtype": "Table", "options": "Child DocType Name"
- parent field otomatik oluşur — elle ekleme

#### 6.3 hooks.py Altın Kuralları
1. ASLA hooks.py'yi silme/üzerine yazma — mevcut dict'lere SADECE ekle
2. doc_events["*"] wildcard tradehub_core'da — TÜM DocType'ları etkiler
3. Yeni doc_events eklerken wildcard'ı geçersiz kılma
4. scheduler_events → hourly, daily, weekly, monthly, cron
5. app_include_js → Global JS, her sayfa yüklemesinde çalışır

#### 6.4 Python API
```python
doc = frappe.get_doc("DocType", name)
doc = frappe.new_doc("DocType")
frappe.get_list("DocType", filters={...}, fields=[...])
frappe.db.get_value("DocType", name, "field")
frappe.db.set_value("DocType", name, "field", value)
@frappe.whitelist()
def fn(param): ...
frappe.throw(_("Hata"))    # i18n zorunlu
frappe.enqueue("path.fn")  # async
```

#### 6.5 Client-Side JS
```javascript
frappe.ui.form.on('DocType', {
    setup(frm) {},
    refresh(frm) {},
    field_name(frm) {}
});
frm.set_query('field', () => ({ filters: { key: val } }));
```

#### 6.6 Migration Patch
```python
# {app}/patches/patch_name.py
import frappe
def execute():
    # idempotent olmalı
    frappe.db.commit()
```
patches.txt'e kayıt: {app_name}.patches.patch_name

---

### 7. DOKUNULMAZ DOSYA VE DİZİNLER

Aşağıdaki dosya ve dizinler **hiçbir koşulda** değiştirilmez, silinmez veya taşınmaz:

| Dosya/Dizin | Neden |
|-------------|-------|
| `apps/frappe/` | Frappe core — ASLA değiştirme |
| `apps/erpnext/` | ERPNext core — ASLA değiştirme |
| `{app}/{app}/__init__.py` | `__version__` tanımı, silme/boşaltma yasak |
| `{app}/{app}/modules.txt` | Modül adı tanımı, değiştirme yasak |
| `{app}/{app}/{module}/` | Module dizini, taşıma/silme/yeniden adlandırma yasak |
| `{app}/{app}/{module}/doctype/` | DocType kök dizini, taşıma yasak |
| `{app}/{app}/{module}/doctype/*/__init__.py` | Python package marker, silme yasak |
| `{app}/{app}/hooks.py` | Sadece EKLE, silme/üzerine yazma yasak |

**Geçmiş hata:** Auto-claude `833c532` commit'inde module dizinini "duplicate" sanarak sildi → 750+ dosya kayboldu, tüm app'ler çöktü. Bu yapı Frappe'nin zorunlu modül çözümleme mekanizmasıdır (Bölüm 5'e bakın).

---

### 8. KESİNLİKLE YAPILMAMASI GEREKENLER

#### Kod Kuralları
1. Raw SQL yazma → Frappe ORM kullan
2. DocType adlarını hardcode etme → grep/find ile tespit et
3. Deprecated v13/v14 API → v15 API kullan
4. hooks.py silme/üzerine yazma → sadece ekle
5. Field'ları DB'den doğrudan silme → patches.txt ile migration
6. String interpolation SQL → %(param)s kullan
7. i18n'siz mesaj → _("...") zorunlu
8. Senkron uzun işlem → frappe.enqueue() kullan
9. Mevcut validate() override → ek çağrı ekle
10. Mevcut test silme → sadece ekle
11. Yukarı yönde cross-app referans → bağımlılık zincirini takip et
12. Wildcard doc_events geçersiz kılma → core'daki "*" tüm DocType'ları etkiler

#### Yapısal Kurallar (KRİTİK — ihlal sistemi çökertir)
13. Frappe/ERPNext core dosyalarını değiştirme → `apps/frappe/` ve `apps/erpnext/` dokunulmaz
14. Triple-nested modül dizin yapısını düzleştirme/taşıma/silme → Bölüm 5'e bak
15. `__init__.py` dosyalarını silme veya boşaltma → özellikle `__version__` içerenler
16. Tek task'ta 10'dan fazla dosya silme veya taşıma → böl, onay al
17. Dizin yapısını "optimize", "düzleştir" veya "duplicate kaldır" diye değerlendirme → yapı Frappe zorunluluğu
18. Commit öncesi `bench --site marketplace.local migrate` çalıştırmadan commit atma

---

### 9. BENCH KOMUTLARI

```bash
bench --site marketplace.local migrate
bench build --app {app_name}
bench --site marketplace.local run-tests --app {app_name}
bench --site marketplace.local clear-cache
bench --site marketplace.local console
bench --site marketplace.local run-tests --doctype "DocType Name"
```

---

### 10. AUTO-CLAUDE TASK YAZIM KURALLARI

#### Atomik task kuralı
- 1-3 dosya → --complexity simple
- 4-8 dosya → --complexity standard
- 9+ dosya → BÖLÜN

#### QA kriterleri (zorunlu, commit öncesi)
✅ dosya mevcut, grep pattern, py_compile hatasız
✅ `bench --site marketplace.local migrate` başarılı (HER COMMIT ÖNCESİ ZORUNLU)
✅ `__init__.py` dosyaları sağlam (silinmemiş, boşaltılmamış)
✅ Triple-nested yapı bozulmamış (`{app}/{app}/{module}/doctype/` mevcut)
❌ "formda dropdown çalışıyor" (site gerektirir)
❌ Toplu dosya silme/taşıma (10+ dosya tek task'ta yasak)
❌ Frappe/ERPNext core dosyalarında değişiklik

#### Yapısal değişiklik tespiti
Eğer task sonucunda aşağıdakilerden biri etkileniyorsa, TASK'I DURDUR ve kullanıcıya sor:
- Herhangi bir `__init__.py` silme veya boşaltma
- Herhangi bir dizin silme veya yeniden adlandırma
- `hooks.py`, `modules.txt`, `patches.txt` üzerinde büyük değişiklik
- `apps/frappe/` veya `apps/erpnext/` altında herhangi bir değişiklik

#### Hedef app belirtin
```
HEDEF APP: tradehub_seller
DocType dizini: apps/tradehub_seller/tradehub_seller/tradehub_seller/doctype/
hooks.py: apps/tradehub_seller/tradehub_seller/hooks.py
patches.txt: apps/tradehub_seller/tradehub_seller/patches.txt
```

---
---

## 📄 Kaynak Belgeler

- @108 → Child Table Hesaplama Fonksiyonları Planı
- @112 → Rol Tabanlı Alan Yetkilendirme Planı
- @124 → Kademeli (Cascading) İndirim Sistemi Planı
- @128 → JSON Alanlarından Child Table'a Migrasyon Planı
- @134 → Otomatik Doldurma (fetch_from) ve Read-Only Alan Planı

---

## 🎯 Görev 1 — @108 · Child Table Hesaplama Katmanları

Önce @108 belgesindeki **§7.1 Complete Matrix** tablosunu esas al.

1. JS durumu **TODO** veya **Partial** olan her DocType için:
   - `frappe.ui.form.on()` ile child table field change, `items_add` ve `items_remove`
     event handler'larını yaz.
   - `calculate_totals(frm)` fonksiyonunu `order.js` canonical pattern'ına birebir
     uygun olarak implement et.
   - Tüm numeric işlemler `flt()` kullanmalı; JS ve Python formülleri özdeş olmalı.

2. Python durumu **TODO** veya **Partial** olan her DocType için:
   - `validate()` hook'una bağlı `calculate_totals(self)` metodunu yaz.
   - Tüm değerler `flt(value, precision)` ile hesaplanmalı.
   - Bottom-up aggregation: önce row-level, sonra parent aggregation.

3. Öncelik sırası @108 §7.2'deki P0→P1→P2→P3 sırasını takip etmeli.

4. Her implementation sonrası: `bench build`, `bench migrate`, `bench clear-cache`.

---

## 🎯 Görev 2 — @112 · Rol Tabanlı Alan Yetkilendirme

@112 belgesindeki tüm 124 parent DocType için:

1. **Kategori (a) — SYSTEM-GENERATED / LOCKED:**
   - Her alanın DocType JSON schema'sına `"read_only": 1` ekle.
   - Python `validate()` içinde `has_value_changed(field)` guard'ı koy;
     izinsiz değişikliği `frappe.throw()` ile engelle.

2. **Kategori (b) — ADMIN-EDITABLE:**
   - Karma izinli DocType'larda (hem user hem admin erişimi olan) ilgili alanlara
     `"permlevel": 1` ekle.
   - `frm.set_df_property(fieldname, "read_only", 1)` ile non-admin kullanıcılar
     için JS'te gizle veya kilitle.
   - `admin_notes`, `internal_notes` gibi alanları non-admin'den `hidden` yap.

3. **Kategori (c) — USER-EDITABLE:**
   - Bu alanlar `permlevel: 0` (default) kalacak; dokunma.

4. **set_only_once** → @112 §7.5'teki tablodaki tüm referans alanlarına
   (`buyer`, `seller`, `rfq`, `order`, vb.) `"set_only_once": 1` ekle.

5. **Tenant güvenliği:** `tenant_name` alanı her zaman
   `read_only: 1` + `fetch_from: "tenant.tenant_name"` olmalı.
   Turkish rol isimlerini (`Satici`, `Satici Admin`, `Alici Admin`, `Alici Editor`,
   `Marka Sahibi`) yetkilendirme mantığına dahil et.

---

## 🎯 Görev 3 — @124 · Cascading Discount Sistemi

@124 belgesini temel alarak mevcut tekli indirim modelini 3 kademeli
(cascading) indirim sistemiyle değiştir.

1. **Schema değişiklikleri** (@124 Appendix A'daki tüm dosyalar için):
   - `discount_percentage` → `discount_1` olarak yeniden adlandır.
   - Yeni alanlar ekle: `discount_2`, `discount_3` (Percent, editable).
   - Read-only tutar alanları ekle: `discount_1_amount`, `discount_2_amount`,
     `discount_3_amount`, `total_discount_amount` (Currency).
   - `effective_discount_pct` (Percent, read_only) ve
     `show_discount_tiers` (Check) ekle.

2. **Formül (Python ve JS'te özdeş):**
   ```
   price_after_d1 = base_price * (1 - discount_1 / 100)
   price_after_d2 = price_after_d1 * (1 - discount_2 / 100)
   final_price    = price_after_d2 * (1 - discount_3 / 100)
   total_discount_amount = base_price - final_price
   effective_discount_pct = (total_discount_amount / base_price) * 100
   ```
   - Tüm hesaplamalar `flt()` kullanmalı.
   - Sıfır bölme koruması (`subtotal == 0` durumu) olmalı.
   - `discount_1/2/3 > 100` → `frappe.throw()`.

3. **cart_line.py:** `calculate_discount()` metodunu
   `calculate_cascading_discount()` ile değiştir.

4. **Kupon ve promosyon indirimleri** cascading indirimlerden SONRA uygulanmalı
   (ayrı katman).

5. **Data migration patch** oluştur:
   - Mevcut `discount_percentage` → `discount_1`'e taşı.
   - Fixed Amount discount'ları: `discount_1 = (fixed_amount / unit_price) * 100`
     formülüyle dönüştür.
   - `patches.txt`'e kaydet.

6. **UI:** Varsayılan olarak sadece Discount 1 görünür;
   `show_discount_tiers` checkbox ile D2/D3 açılır.

---

## 🎯 Görev 4 — @128 · JSON → Child Table Migrasyonu

@128 belgesindeki **MIGRATE** kategorisindeki 25 JSON alanı için:

1. **§10.1'deki 19 yeni Child DocType'ı oluştur:**
   - Her birinin tam alan tanımını (field definitions) belgeden al.
   - İlgili parent DocType JSON schema'sına child table field ekle.
   - Deprecated JSON alanları (`Listing.attributes`, `Listing.images`,
     `Listing.bulk_pricing_tiers`, `Seller Profile.badges`) temizle/kaldır.

2. **Python güncellemeleri** (@128 §10.2'deki ~12 dosya için):
   - `json.loads()` / `json.dumps()` kullanımlarını child table
     okuma/yazma işlemleriyle değiştir.
   - `commission_rule.py`: 6 JSON alan → child table read.
   - `seller_balance.py`, `review.py`, `moderation.py`:
     ilgili pattern'ları child table operasyonlarına dönüştür.

3. **Migration patch** her MIGRATE alanı için:
   - JSON içeriğini parse et → child table row'larına yaz.
   - Patch'leri `patches.txt`'e kaydet.
   - @128 §6.2'deki 4 fazlı execution sırasını takip et.

4. **KEEP alanlarına dokunma** — bunlar JSON olarak kalacak.

---

## 🎯 Görev 5 — @134 · fetch_from ve Auto-fill Tamamlama

@134 belgesindeki eksik ve kısmi `fetch_from` ilişkilerini tamamla.

1. **Priority 1 (HIGH)** — @134 Appendix E checklist'indeki tüm P1 maddelerini uygula:
   - Product/SKU → Category, Brand
   - Seller Profile → tenant_name, tier_name, district_name, neighborhood_name,
     organization_name
   - Buyer Profile → buyer_category_name, tenant_name, organization_name
   - Listing → seller_name, category_name, tenant_name
   - Cart Line → listing_title, listing_image, seller_name
   - Sub Order / Sub Order Item → ilgili fetch_from alanları
   - Marketplace Order Item → listing_title, seller_name
   - RFQ / RFQ Quote → buyer_name, seller_name, tenant_name
   - Contract Instance → template_title, contract_type, tenant_name

2. **Her fetch_from alanı için zorunlu kurallar:**
   - `"read_only": 1` her zaman var olmalı.
   - Field placement: kaynak Link field'ın hemen altına ekle.
   - Field type kaynak ile eşleşmeli (Data→Data, Select→Data, Link→Link).
   - `"description"` ile kaynağı belirt.

3. **JS Change Handlers:**
   - `city → district → neighborhood` cascade (Seller Profile üzerinde).
   - `category → subcategory` cascade (Listing üzerinde).
   - Bağımlı fetch_from alanlarını Link field değişince `""` ile temizle,
     ardından `frm.refresh_fields()` çağır.
   - Tüm tenant-aware formlarda Link field'lara
     `frm.set_query(field, () => ({ filters: { tenant: frm.doc.tenant } }))` ekle.

4. **Server-side validate():**
   - Key denormalized alanları kaynak'tan yenile.
   - Cross-document link'lerde tenant boundary kontrolü yap.
   - `set_only_once` → `buyer` (Order), `seller` (Listing) gibi primary Link'lere uygula.

5. **Yasaklı durumlar:**
   - `amended_from` alanlarına asla `fetch_from` ekleme.
   - Circular fetch_from zinciri oluşturma.
   - `fetch_if_empty` sadece override edilebilir alanlarda kullan.

6. **Priority 2 ve 3** maddelerini P1 tamamlandıktan sonra işle.

---

## ⚙️ Genel Kurallar (Tüm Görevler için)

- **Dual-layer zorunlu:** Hesaplama ve doğrulama her zaman hem JS (UX)
  hem Python (authoritative) katmanında olmalı.
- **`flt()` zorunlu:** Tüm numeric işlemlerde `flt(value, precision)` kullan.
- **Multi-tenant:** Hiçbir değişiklik tenant izolasyonunu bozmamalı.
- **Sonrası:** Her schema değişikliğinin ardından sırayla çalıştır:
  ```
  bench --site marketplace.local migrate
  bench build
  bench --site marketplace.local clear-cache
  ```
- **Test:** Her DocType için create/edit/save senaryosunu çalıştır;
  hesaplamalar hem client hem server'da doğrulanmalı.
- **Öncelik sırası:** @108 P0→P1→P2→P3, @134 HIGH→MEDIUM→LOW,
  @128 faz sırası, @112 sistem alanları önce.
