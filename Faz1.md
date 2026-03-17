Sen bir kod analiz uzmanısın. Görevin iki ayrı repo içindeki mevcut auth sistemini eksiksiz analiz etmek ve karşılaştırmalı bir dokümantasyon üretmek.

## KURALLAR
- Bu fazda HİÇBİR dosya değiştirilmez, sadece okunur.
- Kod yazma, refactor önerme. Sadece analiz et ve belgele.
- Emin olmadığın bir şeyi tahmin etme; dosyayı aç, oku, sonra yaz.

## REPO YAPISI
İki ayrı repo mevcut:
1. `/home/ali/Masaüstü/istoc.com-Yedek/tradehubfront/` → Vue.js 3 + Tailwind storefront
2. `/home/ali/Masaüstü/istoc.com-Yedek/Frappe_Marketplace/` → Frappe backend (frappe-bench altındaki custom app'ler: tradehub_core, tradehub_seller, tradehub_commerce, tradehub_catalog, tradehub_compliance, tradehub_logistics, tradehub_marketing, tr_tradehub, tr_consent_center, tr_contract_center)

## GÖREV ADIMLARI

### Adım 1 — Storefront Auth Taraması
`/home/ali/Masaüstü/istoc.com-Yedek/tradehubfront/` altında şunları tara ve listele:
- Login, register, forgot password, reset password, email verification ile ilgili tüm `.vue`, `.js`, `.ts` dosyaları
- `router/` içindeki auth guard'ları ve auth route'ları
- `store/` veya `stores/` içindeki auth Pinia store'ları
- `composables/` veya `utils/` içindeki auth yardımcı fonksiyonları
- `api/` veya `services/` içindeki auth API çağrıları
- `.env` veya config dosyalarındaki auth endpoint tanımları

Her dosya için şunları not et:
- Dosya yolu
- İçerdiği form field'ları (name, email, password, phone vb.)
- Yapılan API çağrıları (endpoint URL, method, payload)
- Eksik/TODO/placeholder olarak işaretlenmiş alanlar

### Adım 2 — Backend Auth Taraması
`/home/ali/Masaüstü/istoc.com-Yedek/Frappe_Marketplace/` altında her custom app için şunları tara:
- `*.py` dosyalarında `@frappe.whitelist()` ile işaretlenmiş auth endpoint'leri
- DocType tanımları içinde kullanıcı kaydı, profil, rol ataması ile ilgili alanlar
- `hooks.py` içindeki auth hook'ları (on_login, on_logout, after_insert vb.)
- Email template dosyaları (doğrulama maili, şifre sıfırlama vb.)
- Frappe'nin built-in auth mekanizmalarının kullanıldığı yerler

Her endpoint için şunları not et:
- Endpoint adı ve tam yolu
- Beklenen parametreler
- Döndürdüğü response yapısı
- Bağlı olduğu DocType

### Adım 3 — Karşılaştırmalı Analiz
Topladığın bilgileri üç kategoriye ayır:

**Kategori A:** Backend'de VAR → Storefront'ta YOK
- Hangi endpoint'ler storefront tarafından hiç çağrılmıyor?
- Hangi DocType field'ları storefront formlarında yok?

**Kategori B:** Storefront'ta VAR → Backend'de YOK
- Hangi form field'ları backend'e gönderilmiyor veya karşılığı yok?
- Hangi UI akışları backend desteğinden yoksun?

**Kategori C:** Her iki tarafta da VAR ama UYUMSUZ
- Field adı farklı olanlar (örn. storefront `firstName`, backend `first_name`)
- Veri tipi uyumsuzlukları
- Eksik validasyon

### Adım 4 — Buyer/Seller Ayrımı
Mevcut sistemde buyer (alıcı) ve seller (satıcı) ayrımı var mı? Varsa:
- Nasıl implement edilmiş?
- Hangi rol veya DocType kullanılmış?
- Kayıt akışları farklı mı?

Yoksa: "Mevcut sistemde buyer/seller ayrımı bulunmuyor" olarak not et.

## ÇIKTI

Analiz tamamlandığında `/home/ali/Masaüstü/istoc.com-Yedek/auth-sistemi-var-olanlar.md` dosyasını oluştur.

Dosya yapısı şu şekilde olmalı:

---
# Auth Sistemi — Mevcut Durum Analizi
_Tarih: [tarih]_

## 1. Storefront Auth Bileşenleri
[Bulunan dosyalar, field'lar, API çağrıları — tablo formatında]

## 2. Backend Auth Bileşenleri
[Bulunan endpoint'ler, DocType'lar, hook'lar — tablo formatında]

## 3. Kategori A — Backend'de Var, Storefront'ta Yok
[Madde madde liste]

## 4. Kategori B — Storefront'ta Var, Backend'de Yok
[Madde madde liste]

## 5. Kategori C — Her İkisinde Var ama Uyumsuz
[Madde madde liste]

## 6. Buyer/Seller Ayrımı Durumu
[Mevcut durum açıklaması]

## 7. Kritik Eksikler (Özet)
[En önemli 5-10 madde — öncelik sırasına göre]
---

Dosyayı oluşturduktan sonra bana dosyanın kaç satır olduğunu ve "Kategori A", "Kategori B", "Kategori C" başlıklarında kaçar madde olduğunu söyle. Başka hiçbir değişiklik yapma.