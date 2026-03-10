// ======================================================
// TradeHub B2B - Navigation Data (from index2.html)
// All sidebar sections, groups, and menu items
// ======================================================

export const railSections = [
  { id: 'dashboard', icon: 'house', label: 'Ana Sayfa' },
  { id: 'sales', icon: 'shopping-cart', label: 'Satış' },
  { id: 'products', icon: 'box', label: 'Ürünler' },
  { id: 'customers', icon: 'users', label: 'Müşteri' },
  { id: 'finance', icon: 'coins', label: 'Finans' },
  { id: 'logistics', icon: 'truck', label: 'Lojistik' },
  { id: 'marketing', icon: 'rocket', label: 'Pazarlama' },
  { id: 'analytics', icon: 'chart-column', label: 'Analiz' },
  { id: 'messaging', icon: 'message-square', label: 'Mesajlar' },
  { id: 'settings', icon: 'settings', label: 'Ayarlar' },
]

export const sectionTitles = {
  dashboard: 'Genel Bakış',
  sales: 'Satış & Sipariş',
  products: 'Ürün & Katalog',
  customers: 'Müşteri / Bayi',
  finance: 'Finans & Muhasebe',
  logistics: 'Lojistik & Depo',
  marketing: 'Pazarlama',
  analytics: 'Analiz & Raporlama',
  messaging: 'Mesajlar & İletişim',
  settings: 'Mağaza Ayarları',
}

/**
 * panelSections: Each section has groups of menu items
 * Structure: { sectionId: [ { title, items: [{ label, icon, doctype?, report?, route? }] } ] }
 */
export const panelSections = {
  dashboard: [
    {
      title: null, // No title = non-collapsible quick nav
      items: [
        { label: 'Genel Bakış', icon: 'layout-grid', route: '/dashboard' },
      ],
    },
    {
      title: 'Performans Metrikleri',
      items: [
        { label: 'Satıcı KPI', icon: 'gauge', route: '/app/seller-kpi-list' },
        { label: 'Satıcı Puanı', icon: 'star', route: '/app/seller-score-list' },
        { label: 'Satıcı Metrikleri', icon: 'chart-column', route: '/app/seller-metrics-list' },
      ],
    },
    {
      title: 'KPI Şablonları',
      items: [
        { label: 'KPI Şablonu', icon: 'file-text', route: '/app/kpi-template-list' },
      ],
    },
  ],

  sales: [
    {
      title: 'Teklif Talepleri (RFQ)',
      items: [
        { label: 'RFQ', icon: 'file-text', route: '/app/rfq-list' },
        { label: 'RFQ Kalemleri', icon: 'list', doctype: 'RFQ Item' },
        { label: 'RFQ Teklifleri', icon: 'file-check', doctype: 'RFQ Quote' },
        { label: 'RFQ Teklif Kalemleri', icon: 'list-checks', doctype: 'RFQ Quote Item' },
        { label: 'RFQ Teklif Revizyonları', icon: 'git-branch', doctype: 'RFQ Quote Revision' },
        { label: 'RFQ Mesajları', icon: 'message-circle', doctype: 'RFQ Message' },
        { label: 'RFQ Ekleri', icon: 'paperclip', doctype: 'RFQ Attachment' },
        { label: 'RFQ Görüntüleme Kaydı', icon: 'eye', doctype: 'RFQ View Log' },
      ],
    },
    {
      title: 'Siparişler',
      items: [
        { label: 'Sipariş', icon: 'shopping-bag', doctype: 'Order' },
        { label: 'Sipariş Kalemleri', icon: 'list', doctype: 'Order Item' },
        { label: 'Sipariş Olayları', icon: 'activity', doctype: 'Order Event' },
        { label: 'Alt Sipariş', icon: 'git-branch', doctype: 'Sub Order' },
        { label: 'Alt Sipariş Kalemleri', icon: 'list', doctype: 'Sub Order Item' },
        { label: 'Pazar Yeri Siparişi', icon: 'store', doctype: 'Marketplace Order' },
        { label: 'Pazar Yeri Sipariş Kalemleri', icon: 'list', doctype: 'Marketplace Order Item' },
      ],
    },
    {
      title: 'Teklifler',
      items: [
        { label: 'Teklif', icon: 'file-text', doctype: 'Quotation' },
        { label: 'Teklif Kalemleri', icon: 'list', doctype: 'Quotation Item' },
      ],
    },
    {
      title: 'İade Yönetimi',
      items: [
        { label: 'Ödeme İadesi', icon: 'undo', doctype: 'Payment Refund' },
      ],
    },
  ],

  products: [
    {
      title: 'Ürün Listelemeleri',
      items: [
        { label: 'Listeleme', icon: 'list', doctype: 'Listing' },
        { label: 'Listeleme Varyantı', icon: 'git-branch', doctype: 'Listing Variant' },
        { label: 'Listeleme Görseli', icon: 'image', doctype: 'Listing Image' },
        { label: 'Listeleme Özellik Değeri', icon: 'sliders-horizontal', doctype: 'Listing Attribute Value' },
        { label: 'Toplu Fiyat Kademesi', icon: 'layers', doctype: 'Listing Bulk Pricing Tier' },
        { label: 'İlişkili Ürün', icon: 'link', doctype: 'Related Listing Product' },
      ],
    },
    {
      title: 'Stok Birimi (SKU)',
      items: [
        { label: 'SKU', icon: 'barcode', doctype: 'SKU' },
        { label: 'SKU Ürün', icon: 'package', doctype: 'SKU Product' },
        { label: 'Buy Box Girişi', icon: 'trophy', doctype: 'Buy Box Entry' },
      ],
    },
    {
      title: 'Katalog Yönetimi',
      items: [
        { label: 'Ürün', icon: 'package', doctype: 'Product' },
        { label: 'Ürün Kategorisi', icon: 'folder', doctype: 'Product Category' },
        { label: 'Ürün Varyantı', icon: 'git-branch', doctype: 'Product Variant' },
        { label: 'Ürün Özelliği', icon: 'sliders-horizontal', doctype: 'Product Attribute' },
        { label: 'Ürün Özellik Değeri', icon: 'tags', doctype: 'Product Attribute Value' },
        { label: 'Kategori', icon: 'folder-tree', doctype: 'Category' },
        { label: 'Marka', icon: 'tag', doctype: 'Brand' },
        { label: 'Özellik Seti', icon: 'table', doctype: 'Attribute Set' },
      ],
    },
    {
      title: 'Toplu Fiyatlandırma',
      items: [
        { label: 'Ürün Fiyat Kademesi', icon: 'layers', doctype: 'Product Pricing Tier' },
        { label: 'Toplu Fiyat Kademesi', icon: 'layers', doctype: 'Listing Bulk Pricing Tier' },
      ],
    },
    {
      title: 'PIM Yönetimi',
      items: [
        { label: 'PIM Ürün', icon: 'database', doctype: 'PIM Product' },
        { label: 'PIM Ürün Varyantı', icon: 'git-branch', doctype: 'PIM Product Variant' },
        { label: 'PIM Özellik', icon: 'sliders-horizontal', doctype: 'PIM Attribute' },
        { label: 'PIM Özellik Grubu', icon: 'group', doctype: 'PIM Attribute Group' },
      ],
    },
    {
      title: 'Medya Kütüphanesi',
      items: [
        { label: 'Medya Varlığı', icon: 'image', doctype: 'Media Asset' },
        { label: 'Medya Kütüphanesi', icon: 'film', doctype: 'Media Library' },
        { label: 'PIM Ürün Medyası', icon: 'file-image', doctype: 'PIM Product Media' },
      ],
    },
    {
      title: 'Stok & Envanter',
      items: [
        { label: 'Depo', icon: 'warehouse', doctype: 'Warehouse' },
        { label: 'Stok Hareketi', icon: 'arrow-left-right', doctype: 'Stock Entry' },
        { label: 'Stok Seviyesi', icon: 'boxes', doctype: 'Stock Level' },
        { label: 'Stok Uyarısı', icon: 'bell', doctype: 'Stock Alert' },
        { label: 'Envanter Mutabakatı', icon: 'clipboard-check', doctype: 'Inventory Reconciliation' },
      ],
    },
  ],

  customers: [
    {
      title: 'Müşteri Profilleri',
      items: [
        { label: 'Alıcı Profili', icon: 'user', doctype: 'Buyer Profile' },
        { label: 'Premium Alıcı', icon: 'crown', doctype: 'Premium Buyer' },
        { label: 'Alıcı İlgi Kategorisi', icon: 'heart', doctype: 'Buyer Interest Category' },
      ],
    },
    {
      title: 'Müşteri Kategorileri',
      items: [
        { label: 'Alıcı Kategorisi', icon: 'users', doctype: 'Buyer Category' },
        { label: 'Alıcı Seviyesi', icon: 'layers', doctype: 'Buyer Level' },
        { label: 'Alıcı Seviye Avantajı', icon: 'gift', doctype: 'Buyer Level Benefit' },
      ],
    },
    {
      title: 'Fiyat Listeleri',
      items: [
        { label: 'Fiyat Kırılımı', icon: 'percent', doctype: 'Price Break' },
        { label: 'Ürün Fiyat Kademesi', icon: 'layers', doctype: 'Product Pricing Tier' },
      ],
    },
    {
      title: 'Özel Fiyatlandırma',
      items: [
        { label: 'Incoterm Fiyatı', icon: 'globe', doctype: 'Incoterm Price' },
      ],
    },
    {
      title: 'Alıcı Doğrulama',
      items: [
        { label: 'Alıcı Doğrulama', icon: 'user-check', doctype: 'Buyer Verification' },
        { label: 'Ticari Referans', icon: 'handshake', doctype: 'Trade Reference' },
        { label: 'Alıcı Kredi Puanı', icon: 'trending-up', doctype: 'Buyer Credit Score' },
      ],
    },
    {
      title: 'CRM & İlişki Yönetimi',
      items: [
        { label: 'Kişi', icon: 'contact', doctype: 'Contact' },
        { label: 'Firma', icon: 'building-2', doctype: 'Company' },
        { label: 'Potansiyel Müşteri', icon: 'user-plus', doctype: 'Lead' },
        { label: 'Aktivite Kaydı', icon: 'history', doctype: 'Activity Log' },
        { label: 'Not', icon: 'sticky-note', doctype: 'Note' },
      ],
    },
    {
      title: 'Bölge Yönetimi',
      items: [
        { label: 'Bölge / Territory', icon: 'map-pin', doctype: 'Territory' },
        { label: 'Ülke Grubu', icon: 'globe', doctype: 'Country Group' },
        { label: 'Bölgesel Fiyat Listesi', icon: 'banknote', doctype: 'Region Price List' },
      ],
    },
  ],

  finance: [
    {
      title: 'Bakiye ve Hak Edişler',
      items: [
        { label: 'Satıcı Bakiyesi', icon: 'wallet', doctype: 'Seller Balance' },
        { label: 'Satıcı Banka Hesabı', icon: 'landmark', doctype: 'Seller Bank Account' },
      ],
    },
    {
      title: 'Komisyonlar',
      items: [
        { label: 'Komisyon Planı', icon: 'percent', doctype: 'Commission Plan' },
        { label: 'Komisyon Plan Oranı', icon: 'chart-column', doctype: 'Commission Plan Rate' },
        { label: 'Komisyon Kuralı', icon: 'scale', doctype: 'Commission Rule' },
      ],
    },
    {
      title: 'Ödeme Yönetimi',
      items: [
        { label: 'Ödeme Planı', icon: 'credit-card', doctype: 'Payment Plan' },
        { label: 'Ödeme Taksiti', icon: 'calendar-check', doctype: 'Payment Installment' },
        { label: 'Ödeme Niyeti', icon: 'hand-coins', doctype: 'Payment Intent' },
        { label: 'Ödeme Yöntemi', icon: 'receipt', doctype: 'Payment Method' },
      ],
    },
    {
      title: 'Emanet Hesapları',
      items: [
        { label: 'Emanet Hesabı', icon: 'lock', doctype: 'Escrow Account' },
        { label: 'Emanet Olayı', icon: 'activity', doctype: 'Escrow Event' },
        { label: 'Hesap Aksiyonu', icon: 'zap', doctype: 'Account Action' },
      ],
    },
    {
      title: 'Vergi Ayarları',
      items: [
        { label: 'Vergi Oranı', icon: 'receipt', doctype: 'Tax Rate' },
        { label: 'Vergi Oranı Kategorisi', icon: 'folder', doctype: 'Tax Rate Category' },
      ],
    },
    {
      title: 'Çoklu Para Birimi',
      items: [
        { label: 'Para Birimi', icon: 'coins', doctype: 'Currency' },
        { label: 'Döviz Kuru', icon: 'arrow-left-right', doctype: 'Exchange Rate' },
        { label: 'Kur Dönüşüm Kuralı', icon: 'sliders-horizontal', doctype: 'Currency Conversion Rule' },
        { label: 'Satıcı Döviz Hesabı', icon: 'wallet', doctype: 'Seller Currency Account' },
      ],
    },
    {
      title: 'e-Fatura / e-Arşiv',
      items: [
        { label: 'e-Fatura', icon: 'file-text', doctype: 'E Invoice' },
        { label: 'e-Arşiv Fatura', icon: 'file-archive', doctype: 'E Archive Invoice' },
        { label: 'e-İrsaliye', icon: 'truck', doctype: 'E Waybill' },
        { label: 'GİB Entegrasyon Kaydı', icon: 'server', doctype: 'GIB Integration Log' },
      ],
    },
    {
      title: 'Akreditif & Dış Ticaret',
      items: [
        { label: 'Akreditif (L/C)', icon: 'signature', doctype: 'Letter of Credit' },
        { label: 'Banka Teminat Mektubu', icon: 'shield', doctype: 'Bank Guarantee' },
        { label: 'Ticaret Finansmanı', icon: 'landmark', doctype: 'Trade Finance Application' },
        { label: 'Havale / SWIFT', icon: 'landmark', doctype: 'Wire Transfer' },
      ],
    },
    {
      title: 'Mutabakat',
      items: [
        { label: 'Hak Ediş Ödemesi', icon: 'send', doctype: 'Payout' },
        { label: 'Ödeme Takvimi', icon: 'calendar', doctype: 'Payout Schedule' },
        { label: 'Mutabakat', icon: 'check-check', doctype: 'Reconciliation' },
      ],
    },
  ],

  logistics: [
    {
      title: 'Gönderi Yönetimi',
      items: [
        { label: 'Gönderi', icon: 'truck', doctype: 'Shipment' },
        { label: 'Pazar Yeri Gönderisi', icon: 'package-check', doctype: 'Marketplace Shipment' },
      ],
    },
    {
      title: 'Kargo Firmaları',
      items: [
        { label: 'Kargo Firması', icon: 'truck', doctype: 'Carrier' },
        { label: 'Lojistik Sağlayıcı', icon: 'warehouse', doctype: 'Logistics Provider' },
      ],
    },
    {
      title: 'Teslimat Bölgeleri',
      items: [
        { label: 'Teslimat Bölgesi', icon: 'map', doctype: 'Shipping Zone' },
        { label: 'Teslimat Bölgesi Ücreti', icon: 'banknote', doctype: 'Shipping Zone Rate' },
        { label: 'Teslimat Kuralı', icon: 'scale', doctype: 'Shipping Rule' },
        { label: 'Teslimat Ücreti Kademesi', icon: 'layers', doctype: 'Shipping Rate Tier' },
      ],
    },
    {
      title: 'Gönderi Takibi',
      items: [
        { label: 'Takip Olayı', icon: 'map-pin', doctype: 'Tracking Event' },
        { label: 'Teslimat Süresi', icon: 'clock', doctype: 'Lead Time' },
      ],
    },
    {
      title: 'Gümrük & Sınır Ötesi',
      items: [
        { label: 'Gümrük Beyannamesi', icon: 'book-open', doctype: 'Customs Declaration' },
        { label: 'Gümrük Vergisi', icon: 'percent', doctype: 'Customs Duty' },
        { label: 'İhracat Belgesi', icon: 'file-output', doctype: 'Export Document' },
        { label: 'İthalat İzni', icon: 'file-input', doctype: 'Import Permit' },
        { label: 'Çeki Listesi', icon: 'package', doctype: 'Packing List' },
        { label: 'Konşimento (B/L)', icon: 'ship', doctype: 'Bill of Lading' },
        { label: 'Hava Konşimentosu', icon: 'plane', doctype: 'Air Waybill' },
      ],
    },
    {
      title: 'Serbest Bölge',
      items: [
        { label: 'Serbest Bölge', icon: 'building', doctype: 'Free Zone' },
        { label: 'Serbest Bölge Stok', icon: 'boxes', doctype: 'Free Zone Stock' },
        { label: 'Sınır Ötesi Rota', icon: 'route', doctype: 'Cross Border Route' },
      ],
    },
    {
      title: 'Depo Yönetimi',
      items: [
        { label: 'Depo / Fulfillment', icon: 'warehouse', doctype: 'Fulfillment Center' },
        { label: 'Raf Konumu', icon: 'crosshair', doctype: 'Bin Location' },
        { label: 'Toplama-Paketleme', icon: 'package-open', doctype: 'Pick Pack Ship' },
      ],
    },
  ],

  marketing: [
    {
      title: 'Kampanyalar',
      items: [
        { label: 'Kampanya', icon: 'megaphone', doctype: 'Campaign' },
      ],
    },
    {
      title: 'Kuponlar',
      items: [
        { label: 'Kupon', icon: 'ticket', doctype: 'Coupon' },
        { label: 'Kupon Ürün Öğesi', icon: 'package', doctype: 'Coupon Product Item' },
        { label: 'Kupon Kategori Öğesi', icon: 'folder', doctype: 'Coupon Category Item' },
      ],
    },
    {
      title: 'Toplu Satış Teklifleri',
      items: [
        { label: 'Toplu Satış Teklifi', icon: 'handshake', doctype: 'Wholesale Offer' },
        { label: 'Toplu Satış Teklif Ürünü', icon: 'package', doctype: 'Wholesale Offer Product' },
      ],
    },
    {
      title: 'Grup Alımları',
      items: [
        { label: 'Grup Alımı', icon: 'users', doctype: 'Group Buy' },
        { label: 'Grup Alımı Kademesi', icon: 'layers', doctype: 'Group Buy Tier' },
        { label: 'Grup Alımı Taahhütü', icon: 'file-pen', doctype: 'Group Buy Commitment' },
        { label: 'Grup Alımı Ödemesi', icon: 'receipt', doctype: 'Group Buy Payment' },
      ],
    },
    {
      title: 'Mağaza Vitrinleri',
      items: [
        { label: 'Vitrin', icon: 'store', doctype: 'Storefront' },
        { label: 'Abonelik', icon: 'repeat', doctype: 'Subscription' },
        { label: 'Abonelik Paketi', icon: 'package-open', doctype: 'Subscription Package' },
      ],
    },
    {
      title: 'Numune Yönetimi',
      items: [
        { label: 'Numune Talebi', icon: 'flask-conical', doctype: 'Sample Request' },
        { label: 'Numune Gönderimi', icon: 'send', doctype: 'Sample Shipment' },
      ],
    },
  ],

  analytics: [
    {
      title: 'Performans Raporları',
      items: [
        { label: 'Satış Performans Raporu', icon: 'trending-up', report: 'Sales Performance Report' },
        { label: 'Ürün Performans Raporu', icon: 'chart-bar', report: 'Product Performance Report' },
        { label: 'Sipariş Analizi Raporu', icon: 'chart-pie', report: 'Order Analysis Report' },
        { label: 'Gelir Analizi Raporu', icon: 'chart-area', report: 'Revenue Analysis Report' },
      ],
    },
    {
      title: 'KPI Takibi',
      items: [
        { label: 'Satıcı KPI', icon: 'gauge', doctype: 'Seller KPI' },
        { label: 'KPI Şablonu', icon: 'file-text', doctype: 'KPI Template' },
        { label: 'KPI Özet Raporu', icon: 'file-chart-column', report: 'KPI Summary Report' },
      ],
    },
    {
      title: 'Satıcı Metrikleri',
      items: [
        { label: 'Satıcı Puanı', icon: 'star', doctype: 'Seller Score' },
        { label: 'Satıcı Metrikleri', icon: 'chart-column', doctype: 'Seller Metrics' },
        { label: 'Performans Karşılaştırma', icon: 'git-compare', report: 'Performance Comparison Report' },
      ],
    },
    {
      title: 'İş Zekası',
      items: [
        { label: 'Trend Analizi Raporu', icon: 'trending-up', report: 'Trend Analysis Report' },
        { label: 'Müşteri Davranış Raporu', icon: 'users', report: 'Customer Behavior Report' },
        { label: 'Tahminsel Analiz Raporu', icon: 'brain', report: 'Predictive Analysis Report' },
      ],
    },
  ],

  messaging: [
    {
      title: 'Mesajlaşma',
      items: [
        { label: 'Gelen Kutusu', icon: 'inbox', route: '/messaging/inbox' },
        { label: 'Gönderilenler', icon: 'send', route: '/messaging/sent' },
        { label: 'RFQ Mesajları', icon: 'message-circle', doctype: 'RFQ Message' },
      ],
    },
    {
      title: 'Bildirimler',
      items: [
        { label: 'Bildirim Ayarları', icon: 'bell', route: '/messaging/notification-settings' },
        { label: 'E-posta Şablonları', icon: 'mail', doctype: 'Email Template' },
      ],
    },
    {
      title: 'Uyuşmazlık Yönetimi',
      items: [
        { label: 'Uyuşmazlık', icon: 'triangle-alert', doctype: 'Dispute' },
        { label: 'Destek Talepleri', icon: 'headphones', doctype: 'Support Ticket' },
      ],
    },
  ],

  settings: [
    {
      title: 'Mağaza Profili',
      items: [
        { label: 'Satıcı Profili', icon: 'id-card', doctype: 'Seller Profile' },
        { label: 'Satıcı Mağazası', icon: 'store', doctype: 'Seller Store' },
        { label: 'Satıcı Başvurusu', icon: 'file-pen-line', doctype: 'Seller Application' },
      ],
    },
    {
      title: 'Banka Hesapları',
      items: [
        { label: 'Satıcı Banka Hesabı', icon: 'landmark', doctype: 'Seller Bank Account' },
      ],
    },
    {
      title: 'Seviye ve Rozetler',
      items: [
        { label: 'Satıcı Seviyesi', icon: 'layers', doctype: 'Seller Level' },
        { label: 'Satıcı Kademesi', icon: 'trending-up', doctype: 'Seller Tier' },
        { label: 'Satıcı Rozeti', icon: 'medal', doctype: 'Seller Badge' },
      ],
    },
    {
      title: 'Sertifikalar',
      items: [
        { label: 'Satıcı Sertifikası', icon: 'award', doctype: 'Seller Certification' },
        { label: 'Sertifika Tipi', icon: 'stamp', doctype: 'Certificate Type' },
      ],
    },
    {
      title: 'Sözleşmeler',
      items: [
        { label: 'Sözleşme Şablonu', icon: 'signature', doctype: 'Marketplace Contract Template' },
        { label: 'Sözleşme Revizyonu', icon: 'git-branch', doctype: 'Contract Revision' },
        { label: 'Onay Konusu', icon: 'check-check', doctype: 'Consent Topic' },
        { label: 'E-İmza İşlemi', icon: 'pen-tool', doctype: 'ESign Transaction' },
      ],
    },
    {
      title: 'KYC ve Doğrulama',
      items: [
        { label: 'KYC Profili', icon: 'shield', doctype: 'KYC Profile' },
        { label: 'KYC Belgesi', icon: 'file-lock', doctype: 'KYC Document' },
      ],
    },
    {
      title: 'Ekip Yönetimi',
      items: [
        { label: 'Organizasyon', icon: 'building-2', doctype: 'Organization' },
        { label: 'Organizasyon Üyesi', icon: 'user-plus', doctype: 'Organization Member' },
        { label: 'Rol', icon: 'shield-check', doctype: 'Role' },
        { label: 'Yetki', icon: 'key', doctype: 'Permission' },
      ],
    },
    {
      title: 'Yerelleştirme',
      items: [
        { label: 'Dil & Bölge Ayarı', icon: 'globe', doctype: 'Locale Setting' },
        { label: 'Para Birimi Ayarı', icon: 'coins', doctype: 'Currency Setting' },
        { label: 'Zaman Dilimi', icon: 'clock', doctype: 'Timezone Setting' },
        { label: 'Sayı Formatı', icon: 'hash', doctype: 'Number Format' },
        { label: 'Çeviri Yönetimi', icon: 'languages', doctype: 'Translation' },
      ],
    },
    {
      title: 'Ticaret Uyumu',
      items: [
        { label: 'Yaptırım Listesi', icon: 'ban', doctype: 'Sanctions List' },
        { label: 'Ambargo Ülkeleri', icon: 'flag', doctype: 'Embargo Country' },
        { label: 'Ticaret Anlaşması', icon: 'handshake', doctype: 'Trade Agreement' },
        { label: 'Uyum Kontrol Kaydı', icon: 'clipboard-check', doctype: 'Compliance Check Log' },
        { label: 'Çift Kullanım Kontrolü', icon: 'shield', doctype: 'Dual Use Check' },
      ],
    },
    {
      title: 'API & Entegrasyonlar',
      items: [
        { label: 'API Anahtarı', icon: 'key', doctype: 'API Key' },
        { label: 'Webhook', icon: 'link', doctype: 'Webhook' },
        { label: 'Entegrasyon Kaydı', icon: 'server', doctype: 'Integration Log' },
        { label: '3. Parti Bağlantı', icon: 'plug', doctype: 'Third Party Connector' },
      ],
    },
    {
      title: 'Denetim',
      items: [
        { label: 'Denetim İzi', icon: 'footprints', doctype: 'Audit Trail' },
        { label: 'Giriş Geçmişi', icon: 'log-in', doctype: 'Login History' },
        { label: 'Veri Dışa Aktarım', icon: 'file-output', doctype: 'Data Export Log' },
      ],
    },
  ],
}

// Global search data (flattened from all sections)
export const searchData = Object.entries(panelSections).flatMap(([sectionId, groups]) =>
  groups.flatMap(group =>
    group.items.map(item => ({
      ...item,
      section: sectionId,
      sectionTitle: sectionTitles[sectionId],
      groupTitle: group.title,
    }))
  )
)
