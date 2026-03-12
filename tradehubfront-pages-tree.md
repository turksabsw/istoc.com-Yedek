# tradehubfront — Sayfa & Bileşen Ağacı

> `src/` dizini altındaki tüm sayfalar, bileşenler ve sekme (tab) yapıları.

---

## SAYFALAR (`src/pages/`)

### Auth (Kimlik Doğrulama)
- `login.ts` — Giriş sayfası
- `register.ts` — Kayıt sayfası
- `forgot-password.ts` — Şifre sıfırlama

### Ürün & Alışveriş
- `products.ts` — Ürün listeleme / arama sonuçları
- `product-detail.ts` — Ürün detay sayfası
  - **Tablar:** Nitelikler · Yorumlar · Tedarikçi · Açıklama
- `cart.ts` — Sepet
- `checkout.ts` — Ödeme adımı
- `payment.ts` — Ödeme yönetimi
  - **Sol Nav Grupları:**
    - Özet → Ödeme yönetimi · İşlemler
    - T/T → Havale hesapları · Havale Takibi
    - Ek hizmetler → Alibaba.com Kart · İşletme İçin Sonra Öde
  - **Alt Tablar (Ödeme yönetimi):** Ödemeler · İadeler
  - **Alt Tablar (İşlemler):** Ödeme · İade
- `order-success.ts` — Sipariş başarılı
- `payment-failed.ts` — Ödeme başarısız
- `payment-processing.ts` — Ödeme işleniyor

### Kullanıcı Paneli
- `buyer-dashboard.ts` — Alıcı ana paneli
  - **Sipariş Tabları:** Tümü · Nakliyeci teklifi bekleniyor · Gönderilecek · Teslim alınacak · İhtilafta
- `orders.ts` — Siparişlerim
  - **Sol Nav:** Tüm Siparişlerim · İadeler ve Satış Sonrası · Yorumlar · Kuponlar ve Krediler · Vergi Bilgileri
  - **Sipariş Durum Tabları:** Tümü · Onaylanıyor · Ödenmemiş · Gönderime Hazırlanıyor · Kargoda · İade/Satış Sonrası · Tamamlanan/Yorum · Kapalı
- `profile.ts` — Profilim
- `settings.ts` — Hesap ayarları
  - **Kartlar (Ana Görünüm):**
    - Hesap Bilgileri → Profilim · Üyeliğim · Bağlı Hesaplar · Vergi Bilgisi
    - Güvenlik → Şifre Değiştir · E-posta Değiştir · Telefon Değiştir · Hesabı Sil
    - Tercihler → Gizlilik Ayarları · E-posta Tercihleri · Reklam Tercihleri
  - **Hash Alt Sayfaları:** `#profilim` · `#vergi` · `#bagli-hesaplar` · `#gizlilik` · `#reklam` · `#eposta` · `#sifre` · `#eposta-degistir` · `#telefon` · `#hesabi-sil`
- `favorites.ts` — Favorilerim
  - **Tablar:** Ürünler · Tedarikçiler
  - **Ürünler altı:** Liste bazlı filtreleme (Tümü · Varsayılan · Özel listeler)
- `messages.ts` — Mesajlar
  - **3 Panel:** Inbox Paneli · Mesaj Listesi · Mesaj İçeriği (Chat)
- `inquiries.ts` — Talepler / Sorgular
  - **Tablar:** Taleplerim · RFQ Talepleri
- `rfq.ts` — RFQ (Teklif İsteği) formu
- `subscription.ts` — Abonelik

### Satıcı
- `sell.ts` — Satıcı ol / tanıtım sayfası
- `sell-pricing.ts` — Satıcı fiyatlandırma planları
- `seller-storefront.ts` — Satıcı mağazası
  - **Mağaza Navigasyonu:** Ana Sayfa · Ürünler (dropdown) · Şirket Profili (dropdown) · İletişim · Kampanyalar
  - **Şirket Profili Alt:** Genel Bakış · Yorumlar
- `seller/application-form.ts` — Satıcı başvuru formu
- `seller/application-pending.ts` — Başvuru beklemede

### Keşif & Kategori
- `categories.ts` — Kategoriler
- `manufacturers.ts` — Üreticiler / Tedarikçiler
- `top-deals.ts` — En İyi Fırsatlar
  - **Kategori Tabları:** (Dinamik kategori tabları)
- `top-ranking.ts` — En Yüksek Puanlı
  - **Kategori Tabları:** (Dinamik kategori tabları)
- `tailored-selections.ts` — Kişiselleştirilmiş Seçimler
- `dropshipping.ts` — Dropshipping
- `logistics.ts` — Lojistik

### Yardım & Destek
- `help-center.ts` — Yardım Merkezi
  - **Kategori Tabları:** (Dinamik, Alpine.js ile yönetilen yardım kategorileri)
- `faq.ts` — Sıkça Sorulan Sorular
- `help-tickets.ts` — Destek Talepleri Listesi
- `help-ticket-new.ts` — Yeni Destek Talebi
- `contact.ts` — İletişim
- `contacts.ts` — İletişim (alternatif)
- `about.ts` — Hakkımızda

### Yasal
- `terms.ts` — Kullanım Koşulları
- `privacy.ts` — Gizlilik Politikası
- `cookies.ts` — Çerez Politikası
- `returns.ts` — İade Politikası

### Sistem
- `404.ts` — Sayfa Bulunamadı
- `order-success.ts` — Sipariş Başarılı
- `payment-failed.ts` — Ödeme Başarısız
- `payment-processing.ts` — Ödeme İşleniyor

---

## BİLEŞENLER (`src/components/`)

```
components/
├── 404/               → ExploreDeals, NotFoundSection
├── about/             → AboutPageLayout
├── auth/              → LoginPage, RegisterPage, ForgotPasswordPage,
│                         AccountSetupForm, AccountTypeSelector,
│                         EmailVerification, SocialLoginButtons, SupplierSetupForm
├── buyer-dashboard/   → BuyerDashboardLayout, UserInfoCard, OrdersSection,
│                         OrdersTabs, OrdersContent, OperationSlider,
│                         NewBuyerInfo, OtherServicesLayout
├── cart/
│   ├── atoms/         → Checkbox, PriceDisplay, QuantityInput
│   ├── molecules/     → BatchSelectBar, ProductItem, SkuRow
│   ├── organisms/     → BuffTaskArrow, CartHeader, SupplierCard
│   ├── overlay/       → SharedCartDrawer
│   ├── page/          → CartPage, CartSummary
│   └── state/         → CartStore
├── categories/        → CategoryFilterSidebar, CategoryGrid
├── checkout/          → CheckoutLayout, CheckoutHeader, ShippingAddressForm,
│                         ItemsDeliverySection, PaymentMethodSection,
│                         OrderSummary, OrderProtectionModal, OrderReviewModal,
│                         AddressAutocomplete
├── contacts/          → ContactsLayout
├── dropshipping/      → DropshippingLayout
├── favorites/         → FavoritesLayout, FavoritesDropdown
├── floating/          → FloatingPanel, BottomNav
├── footer/            → FooterGroup, FooterLinks, FooterPolicy
├── header/            → TopBar, SearchArea, StickyHeaderSearch,
│                         MegaMenu, SubHeader, PromoBanner
├── help-center/       → HelpCenterLayout, HelpCenterHeader, FAQPageLayout,
│                         ContactPageLayout, TicketForm, TicketsListLayout
├── hero/              → HeroSideBannerSlider, CategoryBrowse,
│                         MobileCategoryBar, ProductGrid,
│                         RecommendationSlider, TailoredSelections,
│                         TopDeals, TopRanking
├── inquiries/         → InquiriesLayout
├── legal/             → LegalPageLayout, CookieConsentUI,
│                         ReturnFAQ, ReturnProcessSteps
├── logistics/         → LogisticsLayout
├── manufacturers/     → ManufacturersHero, ManufacturerList,
│                         HorizontalCategoryBar
├── messages/          → MessagesLayout, InboxPanel, MessageList, MessageContent
├── orders/
│   ├── state/         → OrderStore, CouponStore
│   └──               → OrdersPageLayout
├── payment/
│   ├── state/         → PaymentCardStore
│   └──               → PaymentLayout
├── product/           → ProductInfo, ProductImageGallery, ProductTitleBar,
│                         ProductTabs, ProductDescription, AttributesTabContent,
│                         ProductAttributes, ProductFAQ, ProductReviews,
│                         ReviewsModal, CompanyProfile, SupplierCard,
│                         RelatedProducts, CartDrawer, MobileLayout,
│                         Breadcrumb, LoginModal
├── products/          → SearchHeader, FilterSidebar, FilterChips,
│                         ProductListingGrid, ListingCartDrawer, filterEngine
├── profile/           → ProfileLayout
├── right-panel/       → BrowsingHistorySection, FavoritesSection,
│                         PromotionSection
├── sell/              → SellPageLayout, PricingPageLayout
├── seller/            → StoreHeader, StoreNav, HeroBanner, HotProducts,
│                         CategoryGrid, CategoryProductListing,
│                         CompanyIntroduction, CompanyInfo, CompanyProfile,
│                         Gallery, Certificates, WhyChooseUs,
│                         ContactForm, FloatingActions
├── settings/          → SettingsLayout, SettingsAccountEdit, SettingsTaxInfo,
│                         SettingsLinkedAccounts, SettingsPrivacy,
│                         SettingsAdPreferences, SettingsEmailPreferences,
│                         SettingsChangePassword, SettingsChangeEmail,
│                         SettingsChangePhone, SettingsDeleteAccount
├── shared/            → ProductCard, Breadcrumb, EmptyState, SectionHeader,
│                         SectionCard, StatCard, StepIndicator, DotIndicator,
│                         ContactMethodCard, PromotionBanner, PricingTable,
│                         TicketCard
├── sidebar/           → Sidebar, SidebarFlyout, SidebarMenuItem
├── subscription/      → SubscriptionLayout
├── tailored-selections/ → TailoredSelectionsHero, TailoredProductGrid
├── theme/             → ThemeEditorPanel
├── top-deals/         → TopDealsHero, TopDealsGrid, TopDealsCategoryTabs,
│                         TopDealsPromoBar, TopDealsSubFilters
└── top-ranking/       → TopRankingHero, TopRankingGrid, TopRankingCategoryTabs,
                          TopRankingFilters, TopRankingSortPills
```

---

## YARDIMCI KATMANLAR

```
alpine/          → auth, cart, checkout, coupons, help, legal,
                   messages, orders, product, products-filter,
                   remittance, seller, settings, shared, sidebar

i18n/
├── index.ts
└── locales/     → en.ts, tr.ts

stores/          → favorites.ts

utils/           → api, auth, auth-guard, currency, sanitize,
                   toast, url, animatedPlaceholder, stickyHeights,
                   themePresets, themeStorage, themeTokens
                   seller/interactions

types/           → buyerDashboard, cart, checkout, messages,
                   navigation, order, product, productListing, rfq
                   seller/manufacturer, seller/types

data/            → categories, legalContent,
                   mock: Cart, BuyerDashboard, Checkout, Dropshipping,
                         Messages, Product, ProductListing,
                         TailoredSelections, Tickets, TopDeals, TopRanking
                   rfq-mock-data
                   seller: mockData, staticConfig
```

---

## ÖZET İSTATİSTİK

| Kategori | Adet |
|---|---|
| Toplam sayfa | 43 |
| Bileşen klasörü | 34 |
| Alpine store | 15 |
| Tip tanımı | 10 |
| Mock veri dosyası | 13 |
| i18n dili | 2 (TR / EN) |
