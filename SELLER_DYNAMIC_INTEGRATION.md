# Satıcı Kayıt → Dinamik Görüntüleme Entegrasyonu

## Genel Bakış

Satıcı olarak kayıt olan bir kullanıcının bilgileri şu iki sayfada dinamik olarak yansımalı:
1. **Üreticiler Listesi** → `tradehubfront/src/pages/manufacturers.ts` (`/pages/manufacturers.html`)
2. **Satıcı Mağaza Vitrini** → `tradehubfront/src/pages/seller-storefront.ts` (`/pages/seller/seller-storefront.html`)

---

## Klasör Yapısı

```
tradehubfront/                          → Storefront (alıcı yüzü)
  src/
    pages/
      manufacturers.ts                  → Üreticiler listeleme sayfası
      seller-storefront.ts              → Satıcı mağaza vitrini
    utils/
      api.ts                            → API çağrı yardımcısı
      seller/interactions.ts            → Satıcı vitrin etkileşimleri
    stores/
      favorites.ts                      → Favori mağazalar store

Frappe_Marketplace/frappe-bench/        → Backend (Frappe/ERPNext)
  apps/
    tr_tradehub/
      tr_tradehub/api/v1/seller.py      → Satıcı API endpoint'leri (1652 satır)
    tradehub_seller/
      doctype/
        seller_profile/                 → Seller Profile DocType
        seller_application/             → Seller Application DocType

Frappe_Marketplace/frappe-bench/apps/tr_tradehub/frontend/
                                        → Satıcı paneli (seller dashboard)
```

---

## Bölüm 1: Üreticiler Sayfası Dinamik Entegrasyonu

### Görsel Referans (image1, image2, image3)

Her satıcı kartında şu alanlar görünüyor:

| Ekrandaki Alan | Backend Kaynak | Frappe Field |
|---|---|---|
| Şirket logosu | Seller Profile | `logo` (attachment) |
| Şirket adı | Seller Profile | `display_name` veya `organization` |
| Doğrulanmış rozeti (mavi tik) | Seller Profile | `verification_status == "Verified"` |
| Kaç yıllık (ör. "2 yıl") | Seller Profile | `joined_at` → şimdiki yıldan hesapla |
| Personel sayısı (ör. "100+ personel") | Seller Profile | `employee_count` (StoreFront veya Company) |
| Alan (ör. "10.000+ m²") | Seller Profile / Storefront | `factory_area` |
| Ciro (ör. "$70 B+") | Seller Profile / Storefront | `annual_revenue` |
| Puan (ör. "4.9/5") | Seller Profile | `average_rating` |
| Değerlendirme sayısı (ör. "90 değerlendirmeler") | Seller Profile | `total_reviews` |
| Yanıt süresi (ör. "≤1h") | Seller Profile | `response_time_hours` |
| Zamanında teslimat (ör. "100.0%") | Seller Profile | `on_time_delivery_rate` |
| Sertifikalar (ISO, CE, CPC rozeti) | Storefront / Seller Profile | `certificates` child table |
| Ürün görselleri (4 adet) | Listing | `item_image` → seller'ın son 4 ürünü |
| Ürün fiyat aralığı (ör. "$0,66-1,39") | Listing | `price_min`, `price_max` |
| Min sipariş (ör. "Min. sipariş: 5 Adet") | Listing | `minimum_order_qty`, `uom` |
| Fabrika görseli (sağdaki büyük alan) | Storefront | `factory_images` carousel |
| "Hemen sohbet edin" butonu | — | `chat_url` veya inline chat |
| "Bize Ulaşın" butonu | — | contact form → seller email/phone |

---

### 1.1 Backend: Üreticiler Liste API'si

**Dosya:** `tr_tradehub/api/v1/seller.py`

Eklenecek yeni endpoint:

```python
@frappe.whitelist(allow_guest=True)
def get_manufacturers_list(
    category=None,
    filters=None,       # "Düşük MOQ", "Numunelerden", "Kalite kontrol", "Küçük özelleştirme"
    sort_by="rating",   # "rating" | "newest" | "popular" | "fast_response"
    page=1,
    page_size=10
):
    """
    Üreticiler listeleme sayfası için satıcı listesini döndürür.
    Her satıcı kaydı; şirket adı, logo, puan, ürünler, fabrika bilgisi içerir.
    """
    # 1. Seller Profile tablosundan filtrele
    # 2. Her satıcı için son 4 ürününü (Listing) çek
    # 3. Fabrika resimlerini (Storefront) çek
    # 4. Response formatını aşağıdaki şemaya göre döndür
    pass
```

**Response Şeması:**

```json
{
  "data": [
    {
      "seller_id": "SELLER-00001",
      "storefront_slug": "jingmen-tanmeng",
      "logo": "/files/logo.png",
      "display_name": "Jingmen Tanmeng Technology Co., Ltd.",
      "is_verified": true,
      "years_active": 2,
      "employee_count": "100+",
      "factory_area": "10.000+",
      "annual_revenue": "$70 B+",
      "average_rating": 4.9,
      "total_reviews": 90,
      "response_time_hours": 1,
      "on_time_delivery_rate": 100.0,
      "certificates": ["ISO", "CE", "CPC"],
      "capabilities": ["Küçük özelleştirme", "Numunelerden özelleştirme"],
      "top_products": [
        {
          "item_image": "/files/p1.jpg",
          "price_min": 0.66,
          "price_max": 1.39,
          "currency": "USD",
          "min_order_qty": 5,
          "uom": "Adet"
        }
      ],
      "factory_images": ["/files/factory1.jpg", "/files/factory2.jpg"],
      "chat_url": "/chat/SELLER-00001",
      "contact_url": "/contact/SELLER-00001"
    }
  ],
  "total": 150,
  "page": 1,
  "page_size": 10
}
```

---

### 1.2 Frontend: Manufacturers Sayfası

**Dosya:** `tradehubfront/src/pages/manufacturers.ts`

Mevcut mock data yerine API çağrısı ekle:

```typescript
// tradehubfront/src/utils/api.ts üzerinden
import { api } from "../utils/api";

interface ManufacturerProduct {
  item_image: string;
  price_min: number;
  price_max: number;
  currency: string;
  min_order_qty: number;
  uom: string;
}

interface Manufacturer {
  seller_id: string;
  storefront_slug: string;
  logo: string;
  display_name: string;
  is_verified: boolean;
  years_active: number;
  employee_count: string;
  factory_area: string;
  annual_revenue: string;
  average_rating: number;
  total_reviews: number;
  response_time_hours: number;
  on_time_delivery_rate: number;
  certificates: string[];
  capabilities: string[];
  top_products: ManufacturerProduct[];
  factory_images: string[];
  chat_url: string;
  contact_url: string;
}

async function loadManufacturers(params: {
  category?: string;
  filters?: string[];
  sort_by?: string;
  page?: number;
}) {
  const response = await api<{ data: Manufacturer[]; total: number }>(
    "/api/method/tr_tradehub.api.v1.seller.get_manufacturers_list",
    { method: "GET", params }
  );
  return response;
}
```

**HTML Şablonu (her satıcı kartı için):**

```html
<!-- Üreticiler listesindeki her satıcı kartı -->
<div class="manufacturer-card border rounded-lg p-4 mb-4">
  <!-- Üst başlık -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <img src="{logo}" alt="{display_name}" class="w-12 h-12 rounded object-cover" />
      <div>
        <h3 class="font-semibold text-gray-900">{display_name}</h3>
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <!-- Doğrulanmış rozeti -->
          {#if is_verified}
          <span class="text-blue-500 flex items-center gap-1">
            <svg><!-- checkmark icon --></svg> Doğrulanmış
          </span>
          {/if}
          <span>{years_active} yıl</span>
          <span>·</span>
          <span>{employee_count} personel</span>
          <span>·</span>
          <span>{factory_area} m²</span>
          <span>·</span>
          <span>{annual_revenue}</span>
        </div>
      </div>
    </div>
    <div class="flex gap-2">
      <button class="border rounded-full px-4 py-1.5 text-sm" onclick="openChat('{seller_id}')">
        Hemen sohbet edin
      </button>
      <button class="border rounded-full px-4 py-1.5 text-sm" onclick="openContact('{seller_id}')">
        Bize Ulaşın
      </button>
    </div>
  </div>

  <!-- Orta içerik -->
  <div class="flex gap-4 mt-4">
    <!-- Sol: Puan ve fabrika kapasitesi -->
    <div class="w-48 flex-shrink-0">
      <p class="text-sm font-medium text-gray-700">Sıralama ve değerlendirmeler</p>
      <p class="text-sm text-blue-600">{average_rating}/5 ({total_reviews} değerlendirmeler)</p>

      <p class="text-sm font-medium text-gray-700 mt-3">Fabrika kapasitesi</p>
      <ul class="text-sm text-gray-600 space-y-1">
        <li>· Yanıt süresi ≤{response_time_hours}h</li>
        <li>· Zamanında teslimat {on_time_delivery_rate}%</li>
        <li>· Sertifikalar:
          {#each certificates as cert}
          <span class="border text-xs px-1 rounded">{cert}</span>
          {/each}
        </li>
      </ul>
    </div>

    <!-- Orta: Ürün görselleri (4 adet) -->
    <div class="flex gap-2 flex-1">
      {#each top_products as product}
      <div class="w-32">
        <img src="{product.item_image}" alt="" class="w-32 h-32 object-cover rounded" />
        <p class="text-sm font-semibold mt-1">
          ${product.price_min}-{product.price_max}
        </p>
        <p class="text-xs text-gray-500">
          Min. sipariş: {product.min_order_qty} {product.uom}
        </p>
      </div>
      {/each}
    </div>

    <!-- Sağ: Fabrika görseli (carousel) -->
    <div class="w-40 flex-shrink-0 relative">
      <div class="swiper factory-swiper h-32">
        <div class="swiper-wrapper">
          {#each factory_images as img}
          <div class="swiper-slide">
            <img src="{img}" class="w-full h-full object-cover rounded" />
          </div>
          {/each}
        </div>
        <div class="swiper-button-prev"></div>
        <div class="swiper-button-next"></div>
        <div class="image-count">{factory_images.length}/1</div>
      </div>
    </div>
  </div>
</div>
```

---

## Bölüm 2: Satıcı Mağaza Vitrini Dinamik Entegrasyonu

### Görsel Referans (image4)

**Dosya:** `tradehubfront/src/pages/seller-storefront.ts`

#### Ekrandaki Tüm Dinamik Alanlar

| Ekrandaki Alan | Backend Kaynak | Frappe Field |
|---|---|---|
| Şirket adı (başlık) | Seller Profile | `display_name` |
| Verified rozeti | Seller Profile | `verification_status` |
| Kaç yıllık | Seller Profile | `joined_at` → hesapla |
| Şehir, Ülke | Seller Profile | `city`, `country` |
| Ana kategoriler | Seller Application / Storefront | `preferred_categories` |
| E-posta | Seller Profile | `contact_email` |
| Rozetler (Hızlı Teslimat, Sertifikalı Tedarikçi) | Seller Profile | `seller_badges` |
| Doğrulayan kurum + tarih | Seller Profile | `verified_by`, `verified_at` |
| "Tedarikçiyle iletişime geçin" butonu | — | → iletişim formu |
| "Şimdi sohbet et" butonu | — | → chat sistemi |
| Puan (4.7/5) | Seller Profile | `average_rating` |
| Değerlendirme sayısı (87) | Seller Profile | `total_reviews` |
| Ortalama yanıt süresi | Seller Profile | `response_time_hours` |
| Zamanında teslimat oranı | Seller Profile | `on_time_delivery_rate` |
| Sipariş sayısı | Seller Profile | `total_sales_count` |
| Fabrika videosu | Storefront | `factory_video_url` |
| Tedarikçi kapasitesi (checkboxlar) | Storefront | `capabilities` child table |
| Tedarikçiye Ulaş (sidebar) | — | bağlı seller_id |

---

### 2.1 Backend: Satıcı Vitrin API'si

**Dosya:** `tr_tradehub/api/v1/seller.py`

Mevcut `get_storefront()` endpoint'ini genişlet:

```python
@frappe.whitelist(allow_guest=True)
def get_seller_storefront_data(storefront_slug: str):
    """
    Satıcı vitrin sayfası için tüm verileri tek seferde döndürür.
    seller-storefront.html sayfasının ihtiyacı olan tüm alanları içerir.
    """
    # storefront_slug → Storefront kaydını bul
    # Storefront → Seller Profile'a bağlan
    # Tüm alanları birleştirip döndür
    pass
```

**Response Şeması:**

```json
{
  "seller": {
    "seller_id": "SELLER-00001",
    "display_name": "Anadolu Endüstriyel Ölçüm Sistemleri A.Ş.",
    "logo": "/files/logo.png",
    "is_verified": true,
    "verification_label": "Verified",
    "verified_by": "TÜVRheinland",
    "verified_at": "2025-06-15",
    "years_active": 12,
    "city": "Ankara",
    "country": "Türkiye",
    "contact_email": "info@anadoluolcum.com.tr",
    "categories": ["Elektrik Sayaçları", "Su Sayaçları", "Gaz Sayaçları"],
    "badges": [
      { "label": "Hızlı Teslimat", "type": "fast_delivery" },
      { "label": "Sertifikalı Tedarikçi", "type": "certified" }
    ]
  },
  "performance": {
    "average_rating": 4.7,
    "total_reviews": 87,
    "response_time_hours": 3,
    "on_time_delivery_rate": 98.5,
    "total_orders": 154
  },
  "storefront": {
    "factory_video_url": "https://...",
    "factory_images": ["/files/f1.jpg"],
    "capabilities": [
      "Küçük özelleştirme",
      "Çizime göre özelleştirme",
      "Nihai ürün denetimi",
      "Garanti seçenekleri mevcut"
    ],
    "capability_verified_by": "Intertek"
  },
  "tabs": {
    "products_count": 54,
    "categories_count": 8,
    "campaigns_count": 2
  }
}
```

---

### 2.2 Frontend: Seller Storefront Sayfası

**Dosya:** `tradehubfront/src/pages/seller-storefront.ts`

Mevcut `getSellerData()` mock'unu API çağrısıyla değiştir:

```typescript
import { api } from "../utils/api";

// URL'den storefront slug'ı al: /pages/seller/seller-storefront.html?store=anadolu-endustriyel
const urlParams = new URLSearchParams(window.location.search);
const storefrontSlug = urlParams.get("store") ?? "";

async function loadStorefrontData(slug: string) {
  const data = await api<SellerStorefrontData>(
    "/api/method/tr_tradehub.api.v1.seller.get_seller_storefront_data",
    { method: "GET", params: { storefront_slug: slug } }
  );
  return data;
}

// Sayfa yüklendiğinde
document.addEventListener("DOMContentLoaded", async () => {
  const data = await loadStorefrontData(storefrontSlug);
  renderStorefront(data);
});
```

**Render Fonksiyonu (DOM güncellemeleri):**

```typescript
function renderStorefront(data: SellerStorefrontData) {
  const { seller, performance, storefront } = data;

  // --- Başlık alanı ---
  document.querySelector("[data-seller-name]")!.textContent = seller.display_name;
  document.querySelector("[data-seller-logo]")!.setAttribute("src", seller.logo);

  // Verified rozeti
  if (seller.is_verified) {
    document.querySelector("[data-verified-badge]")!.classList.remove("hidden");
  }

  // Yıl, Şehir, Ülke
  document.querySelector("[data-years]")!.textContent = `${seller.years_active}yrs`;
  document.querySelector("[data-location]")!.textContent =
    `${seller.city}, ${seller.country}`;

  // Kategoriler
  document.querySelector("[data-categories]")!.textContent =
    `Ana kategoriler: ${seller.categories.join(", ")}`;

  // E-posta
  document.querySelector("[data-email]")!.textContent = seller.contact_email;

  // Rozetler (Hızlı Teslimat, Sertifikalı)
  const badgeContainer = document.querySelector("[data-badges]")!;
  badgeContainer.innerHTML = seller.badges
    .map((b) => `<span class="badge">${b.label}</span>`)
    .join("");

  // Doğrulayan kurum + tarih
  document.querySelector("[data-verified-by]")!.textContent =
    `Verified by ${seller.verified_by} — ${seller.verified_at}`;

  // --- Performans ---
  document.querySelector("[data-rating]")!.textContent =
    performance.average_rating.toFixed(1);
  document.querySelector("[data-reviews-count]")!.textContent =
    `${performance.total_reviews} değerlendirmeler`;
  document.querySelector("[data-response-time]")!.textContent =
    `≤${performance.response_time_hours}h`;
  document.querySelector("[data-delivery-rate]")!.textContent =
    `${performance.on_time_delivery_rate}%`;
  document.querySelector("[data-total-orders]")!.textContent =
    `${performance.total_orders}+`;

  // --- Fabrika Videosu ---
  const video = document.querySelector<HTMLVideoElement>("[data-factory-video]");
  if (video && storefront.factory_video_url) {
    video.src = storefront.factory_video_url;
  }

  // --- Tedarikçi Kapasitesi ---
  const capList = document.querySelector("[data-capabilities]")!;
  capList.innerHTML = storefront.capabilities
    .map(
      (cap) => `
      <li class="flex items-center gap-2">
        <svg class="text-blue-500"><!-- check icon --></svg>
        <span>${cap}</span>
      </li>`
    )
    .join("");

  // Capability verified by
  document.querySelector("[data-capability-verifier]")!.textContent =
    `Doğrulandı by ${storefront.capability_verified_by}`;

  // --- Sidebar: Tedarikçiye Ulaş ---
  document.querySelector("[data-sidebar-name]")!.textContent = seller.display_name;
  document.querySelector("[data-sidebar-logo]")!.setAttribute("src", seller.logo);
}
```

---

## Bölüm 3: Satıcı Paneli → Storefront Veri Akışı

**Satıcı paneli:** `Frappe_Marketplace/frappe-bench/apps/tr_tradehub/frontend/`

Satıcı bu panelden şu bilgileri doldurmalı ve kaydetmeli:

### 3.1 Satıcı Paneli Formu Alanları

Satıcı panelinde şu sekmelerin olması gerekiyor:

#### Şirket Profili Sekmesi
```
- Logo yükle (attachment)
- Şirket adı (display_name)
- Yıl (joined_at otomatik, ama kuruluş yılı ayrı olabilir)
- Şehir + Ülke (city, country)
- E-posta (contact_email)
- Web sitesi (website)
- Ana kategoriler (preferred_categories - multi select)
```

#### Fabrika & Kapasite Sekmesi
```
- Personel sayısı (employee_count)
- Fabrika alanı m² (factory_area)
- Yıllık ciro (annual_revenue)
- Fabrika görselleri (factory_images - multiple attachments)
- Fabrika videosu URL (factory_video_url)
- Sertifikalar (certificates - checklist: ISO, CE, CPC, RoHS, FCC, vb.)
- Kapasite özellikleri (capabilities - checklist):
    ☑ Küçük özelleştirme
    ☑ Çizime göre özelleştirme
    ☑ Numunelerden özelleştirme
    ☑ Nihai ürün denetimi
    ☑ Garanti seçenekleri mevcut
    ☑ Kalite kontrol sertifikalı
```

#### Vitrin Ayarları Sekmesi
```
- Storefront slug (URL için: "anadolu-endustriyel")
- Mağaza adı
- Yayınla / Yayından kaldır butonu
- Kampanyalar
```

---

### 3.2 Backend: Storefront DocType Ek Alanlar

Mevcut Storefront DocType'a eklenecek alanlar (eğer yoksa):

```json
{
  "fields_to_add": [
    { "fieldname": "factory_video_url",   "fieldtype": "Data",        "label": "Fabrika Video URL" },
    { "fieldname": "factory_images",      "fieldtype": "Table",       "label": "Fabrika Görselleri", "options": "Storefront Image" },
    { "fieldname": "employee_count",      "fieldtype": "Data",        "label": "Personel Sayısı" },
    { "fieldname": "factory_area",        "fieldtype": "Data",        "label": "Fabrika Alanı (m²)" },
    { "fieldname": "annual_revenue",      "fieldtype": "Data",        "label": "Yıllık Ciro" },
    { "fieldname": "certificates",        "fieldtype": "Table",       "label": "Sertifikalar", "options": "Storefront Certificate" },
    { "fieldname": "capabilities",        "fieldtype": "Table",       "label": "Kapasite Özellikleri", "options": "Storefront Capability" },
    { "fieldname": "capability_verified_by", "fieldtype": "Data",     "label": "Kapasiteyi Doğrulayan" },
    { "fieldname": "storefront_slug",     "fieldtype": "Data",        "label": "URL Slug" }
  ]
}
```

---

## Bölüm 4: Üreticiler Sayfası Kategori Filtreleme

### Üst Kategori Tabları (image1)
```
Tüm kategoriler | Valiz & Çanta & Kılıf | Spor Giyim... | ...
```
→ Backend: `get_categories()` endpoint → Frappe `Item Group` veya custom `Category` DocType

### Filtre Etiketleri
```
Düşük MOQ ile özelleştirme | Numunelerden özelleştirme | Kalite kontrol sertifikalı | Küçük özelleştirme
```
→ Backend `get_manufacturers_list()` `filters` parametresiyle → Seller `capabilities` alanında eşleştir

### "En iyi sıramalı üreticiler" (image1 sol üst widget)
```
En popüler | En çok satanlar | Lider fabrikalar | Hızlı yanıtlama
```
→ Backend `sort_by` parametresi ile:
- `popular` → `average_rating DESC`
- `best_seller` → `total_sales_count DESC`
- `leader` → `seller_tier = "Enterprise"` veya `is_top_seller = 1`
- `fast_response` → `response_time_hours ASC`

---

## Bölüm 5: Uygulama Sırası (Checklist)

### Faz 1: Backend API
- [ ] `get_manufacturers_list()` endpoint'i yaz
- [ ] `get_seller_storefront_data()` endpoint'ini genişlet
- [ ] Storefront DocType'a eksik alanları ekle (factory_video_url, capabilities, vb.)
- [ ] API response şemalarını test et

### Faz 2: Satıcı Paneli (Seller Dashboard)
- [ ] Satıcı panelinde "Vitrin Düzenle" sayfası aç
- [ ] Fabrika görseli upload alanı ekle
- [ ] Fabrika videosu URL alanı ekle
- [ ] Sertifikalar ve kapasite checklist formu ekle
- [ ] Storefront'u yayınla butonu ekle

### Faz 3: Storefront Frontend
- [ ] `seller-storefront.ts` içindeki mock datayı kaldır
- [ ] URL'den `?store=slug` paramını oku
- [ ] `get_seller_storefront_data()` API çağrısını ekle
- [ ] `renderStorefront()` fonksiyonu ile DOM'u doldur
- [ ] HTML şablonuna `data-*` attribute'larını ekle

### Faz 4: Manufacturers Frontend
- [ ] `manufacturers.ts` içindeki mock datayı kaldır
- [ ] `get_manufacturers_list()` API çağrısını ekle
- [ ] Her satıcı kartı için HTML şablonunu render et
- [ ] Swiper/carousel ile fabrika resimlerini göster
- [ ] Kategori ve filtre etiketlerini bağla
- [ ] Sayfalama (pagination) ekle

### Faz 5: Test & Polish
- [ ] Yeni satıcı kaydolduğunda üreticiler listesinde göründüğünü test et
- [ ] Satıcı panel bilgilerini güncellediğinde vitrin sayfasına yansıdığını doğrula
- [ ] Görsel tasarımın image1-4 ile birebir örtüştüğünü kontrol et
- [ ] Mobil uyumluluğu kontrol et

---

## Bölüm 6: Teknik Notlar

### API URL Formatı (Frappe)
```
GET /api/method/tr_tradehub.api.v1.seller.get_manufacturers_list
    ?category=Elektronik&sort_by=rating&page=1&page_size=10

GET /api/method/tr_tradehub.api.v1.seller.get_seller_storefront_data
    ?storefront_slug=anadolu-endustriyel
```

### Auth
- Guest erişimi: `@frappe.whitelist(allow_guest=True)` ile açık
- Giriş yapmış kullanıcı için kişisel aksiyon butonları (favori, chat) token ile korunur
- `tradehubfront/src/utils/api.ts` → `Authorization: Bearer <token>` header'ı otomatik ekler

### URL Yapısı (Storefront Sayfası)
```
/pages/seller/seller-storefront.html?store={storefront_slug}
```
Üreticiler listesindeki satıcı adına tıklanınca bu URL'ye yönlendir.

### Slug Oluşturma (Backend)
```python
import re

def generate_slug(display_name: str) -> str:
    slug = display_name.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'\s+', '-', slug.strip())
    return slug
```

### Zaman Damgasından Yıl Hesaplama (Frontend)
```typescript
function yearsActive(joinedAt: string): number {
  const joined = new Date(joinedAt);
  const now = new Date();
  return now.getFullYear() - joined.getFullYear();
}
```

---

## Referans Dosyalar

| Dosya | Yol |
|---|---|
| Storefront sayfası | `tradehubfront/src/pages/seller-storefront.ts` |
| Üreticiler sayfası | `tradehubfront/src/pages/manufacturers.ts` |
| API yardımcısı | `tradehubfront/src/utils/api.ts` |
| Satıcı etkileşimleri | `tradehubfront/src/utils/seller/interactions.ts` |
| Seller API (backend) | `tr_tradehub/tr_tradehub/api/v1/seller.py` |
| Seller Profile DocType | `tradehub_seller/doctype/seller_profile/seller_profile.json` |
| Seller Application DocType | `tradehub_seller/doctype/seller_application/seller_application.json` |
