# TradeHub Dashboard & Mainboard Widget Seçenekleri

> 7 TradeHub uygulamasının 234 DocType'ı ve binlerce alanı analiz edilerek oluşturulmuştur.
> Her seçenek, gerçek DocType alanlarına dayalı somut widget önerileridir.

---

## 1. SİPARİŞ YÖNETİMİ (tradehub_commerce)

### 1.1 Marketplace Order (Ana Sipariş)

#### 1.1.1 KPI Kartları
- Toplam Sipariş Sayısı (count of Marketplace Order)
- Toplam Sipariş Tutarı (sum of grand_total)
- Ortalama Sipariş Tutarı (avg of grand_total)
- Bugünkü Sipariş Sayısı (count where order_date = today)
- Bu Haftaki Sipariş Sayısı
- Bu Aydaki Sipariş Sayısı
- Ödenen Toplam Tutar (sum of paid_amount)
- Toplam İndirim Tutarı (sum of discount_amount)
- Toplam Kargo Tutarı (sum of shipping_amount)
- Toplam Vergi Tutarı (sum of tax_amount)
- Toplam Komisyon (sum of total_commission)
- Toplam İade Tutarı (sum of refund_amount)
- Toplam Kupon İndirimi (sum of coupon_discount)
- Toplam Promosyon İndirimi (sum of promotion_discount)
- Satıcı Ödeme Toplamı (sum of seller_payout)
- Benzersiz Alıcı Sayısı (distinct count of buyer)
- Satıcı Sayısı (avg of seller_count per order)
- Ürün Sayısı (sum of item_count)
- Toplam Miktar (sum of total_qty)
- Toplam Ağırlık (sum of total_weight)
- B2B Sipariş Sayısı (count where is_b2b_order = 1)
- Toptan Sipariş Sayısı (count where is_wholesale_order = 1)
- Faturalı Sipariş Sayısı (count where requires_invoice = 1)
- Otomatik Onaylanan Sipariş Sayısı (count where auto_confirm = 1)
- İptal Talep Edilen Sipariş Sayısı (count where cancellation_requested = 1)
- İade Talep Edilen Sipariş Sayısı (count where refund_requested = 1)

#### 1.1.2 Durum Dağılımı (Pasta/Halka Grafik)
- Sipariş Durumu Dağılımı: Pending, Await Payment, Payment Received, Confirmed, Processing, Packed, Shipped, In Transit, Out for Delivery, Delivered, Completed, Cancelled, Refunded, On Hold, Disputed
- Ödeme Durumu Dağılımı: Pending, Await Verification, Processing, Paid, Partially Paid, Failed, Refunded, Partially Refunded, Cancelled, Disputed
- Ödeme Yöntemi Dağılımı: Credit Card, Debit Card, Bank Transfer, Cash on Delivery, Wallet, iyzico, PayTR, Stripe, PayPal, Other
- Ödeme Gateway Dağılımı: iyzico, PayTR, Stripe, PayPal, Manual
- Escrow Durumu Dağılımı: Not Required, Pending, Held, Partially Released, Released, Disputed, Refunded
- Karşılama Durumu Dağılımı: Pending, Partially Packed, Packed, Partially Shipped, Shipped, In Transit, Out for Delivery, Partially Delivered, Delivered, Partially Returned, Returned, Cancelled
- Fatura Tipi Dağılımı: E-Invoice (E-Fatura), E-Archive (E-Arsiv), Paper Invoice
- E-Fatura Durumu Dağılımı: Pending, Queued, Sent, Accepted, Rejected, Cancelled, Error
- Komisyon Durumu Dağılımı: Pending, Calculated, Collected, Partially Collected, Waived
- İptal Nedeni Dağılımı: Changed Mind, Found Better Price, Item Out of Stock, Payment Issues, Address Issue, Order Error, Seller Request, Fraud Suspected, Other
- İade Nedeni Dağılımı: Order Cancelled, Item Returned, Defective Product, Wrong Item, Not as Described, Partial Fulfillment, Other
- İade Durumu Dağılımı: Pending, Approved, Processing, Refunded, Rejected
- Kaynak Kanal Dağılımı: Website, Mobile App, API, POS, Manual, Import
- Alıcı Tipi Dağılımı: Individual, Organization, Guest

#### 1.1.3 Zaman Serisi Grafikleri (Çizgi/Alan)
- Günlük/Haftalık/Aylık Sipariş Sayısı Trendi (order_date)
- Günlük/Haftalık/Aylık Sipariş Tutarı Trendi (grand_total by order_date)
- Ödeme Alınma Trendi (paid_at)
- Onaylama Trendi (confirmed_at)
- İşleme Başlama Trendi (processing_started_at)
- Kargolama Trendi (shipped_at)
- Teslim Trendi (delivered_at)
- Tamamlanma Trendi (completed_at)
- İptal Trendi (cancelled_at)
- İade Trendi (refunded_at)
- Ortalama Sipariş Tutarı Trendi
- Komisyon Toplama Trendi (commission_collected_at)
- İndirim Tutarı Trendi
- Kargo Tutarı Trendi

#### 1.1.4 Çubuk Grafikleri
- Satıcı Bazında Sipariş Sayısı (Top 10/20/50)
- Satıcı Bazında Sipariş Tutarı (Top 10/20/50)
- Ödeme Yöntemi Bazında Sipariş Tutarı
- Kaynak Kanal Bazında Sipariş Sayısı
- Alıcı Tipi Bazında Sipariş Tutarı
- Ülke Bazında Sipariş Sayısı (shipping_country)

#### 1.1.5 Tablo/Liste Widget'ları
- Son 10/20/50 Sipariş Listesi
- En Yüksek Tutarlı Siparişler
- Bekleyen Siparişler (status = Pending)
- Ödeme Bekleyen Siparişler (payment_status = Pending)
- İptal Talep Edilen Siparişler
- İade Talep Edilen Siparişler
- Tartışmalı Siparişler (status = Disputed)
- E-Fatura Hatalı Siparişler (e_invoice_status = Error/Rejected)
- Escrow Bekleyen Siparişler

### 1.2 Sub Order (Alt Sipariş - Satıcı Bazlı)

#### 1.2.1 KPI Kartları
- Toplam Alt Sipariş Sayısı
- Toplam Alt Sipariş Tutarı (sum of grand_total)
- Ortalama Alt Sipariş Tutarı
- Toplam Komisyon Tutarı (sum of commission_amount)
- Toplam Satıcı Ödemesi (sum of seller_payout)
- Toplam İade Tutarı (sum of refund_amount)
- Toplam Kargo Tutarı (sum of shipping_amount)
- Paketlenen Ürün Sayısı (sum of items_packed)
- Kargolanan Ürün Sayısı (sum of items_shipped)
- Teslim Edilen Ürün Sayısı (sum of items_delivered)
- İade Edilen Ürün Sayısı (sum of items_returned)
- Tam Karşılanan Alt Sipariş Oranı (count where fully_fulfilled = 1)
- Fatura Gerektiren Alt Sipariş Sayısı
- İptal Talep Edilen Sayı
- İade Talep Edilen Sayı
- İade Alınan Sayı

#### 1.2.2 Durum Dağılımı (Pasta/Halka Grafik)
- Alt Sipariş Durumu: Pending, Accepted, Processing, Packed, Shipped, In Transit, Out for Delivery, Delivered, Completed, Cancelled, Refunded, On Hold, Disputed
- Ödeme Durumu: Pending, Paid, Partially Paid, Refunded, Partially Refunded, Cancelled, Disputed
- Ödeme Durumu (Payout): Pending, Scheduled, Processing, Paid, Failed, Held, Cancelled
- Escrow Durumu: Not Required, Pending, Held, Partially Released, Released, Disputed, Refunded
- Karşılama Durumu: Pending, Accepted, Processing, Packed, Shipped, In Transit, Out for Delivery, Partially Delivered, Delivered, Returned, Cancelled
- Kargo Firması: Yurtici Kargo, Aras Kargo, MNG Kargo, SuratKargo, PTT Kargo, UPS, DHL, FedEx, Other
- Fatura Tipi: E-Invoice, E-Archive, Paper Invoice
- E-Fatura Durumu: Pending, Queued, Sent, Accepted, Rejected, Cancelled, Error
- İptal Nedeni: Out of Stock, Cannot Fulfill, Buyer Request, Address Issue, Payment Issue, Seller Request, Fraud Suspected, Other
- İade Nedeni: Order Cancelled, Item Returned, Defective Product, Wrong Item, Not as Described, Partial Fulfillment, Other
- İade Durumu: Pending, Approved, Processing, Refunded, Rejected
- İade Nedeni (Return): Changed Mind, Defective Product, Wrong Item, Not as Described, Damaged in Transit, Other
- İade Durumu (Return): Pending, Approved, Shipped Back, Received, Rejected, Completed

#### 1.2.3 Zaman Serisi Grafikleri
- Günlük Alt Sipariş Sayısı Trendi (order_date)
- Günlük Alt Sipariş Tutarı Trendi
- Kabul Etme Trendi (accepted_at)
- İşleme Başlama Trendi (processing_started_at)
- Paketleme Trendi (packed_at)
- Kargolama Trendi (shipped_at)
- Teslim Trendi (delivered_at)
- Tamamlanma Trendi (completed_at)
- İptal Trendi (cancelled_at)
- İade Trendi (refunded_at)
- Komisyon Tutarı Trendi

#### 1.2.4 Çubuk Grafikleri
- Satıcı Bazında Alt Sipariş Sayısı
- Satıcı Bazında Alt Sipariş Tutarı
- Satıcı Bazında Komisyon Tutarı
- Kargo Firması Bazında Alt Sipariş Sayısı
- Ülke Bazında Alt Sipariş Sayısı

#### 1.2.5 Tablo/Liste Widget'ları
- Son Alt Siparişler
- Bekleyen Alt Siparişler
- Ödeme Bekleyen Alt Siparişler
- Tartışmalı Alt Siparişler
- İade Talep Edilen Alt Siparişler
- E-Fatura Hatalı Alt Siparişler

### 1.3 Order (B2B Sipariş)

#### 1.3.1 KPI Kartları
- Toplam B2B Sipariş Sayısı
- Toplam Sipariş Tutarı (sum of total_amount)
- Ortalama Sipariş Tutarı
- Teklif Tutarı Toplamı (sum of quotation_amount)
- Toplam İndirim (sum of discount_amount)
- Toplam Vergi (sum of tax_amount)
- Toplam Kargo Maliyeti (sum of shipping_cost)
- Avans Tutarı Toplamı (sum of advance_amount)
- Ödenen Tutar Toplamı (sum of paid_amount)
- Bakiye Tutarı Toplamı (sum of balance_amount)
- İade Tutarı Toplamı (sum of refund_amount)
- Ortalama Teslimat Süresi (avg of delivery_days)

#### 1.3.2 Durum Dağılımı
- Sipariş Durumu: Draft, Pending, Confirmed, Processing, Ready to Ship, Shipped, Delivered, Completed, Cancelled, Refunded, On Hold
- Sipariş Tipi: Standard, Bulk, Sample, Custom Production, RFQ Order, Repeat Order
- Öncelik: Low, Normal, High, Urgent
- Kaynak Tipi: Direct, RFQ, Quotation, Sample Conversion, Repeat
- Ödeme Durumu: Pending, Advance Received, Partially Paid, Fully Paid, Overdue, Refunded
- Ödeme Koşulları: 30% Advance 70% Before Shipment, 50/50, 100% Advance, LC, Net 30/60/90, Custom
- Ödeme Yöntemi: Bank Transfer, Credit Card, Letter of Credit, PayPal, Other
- Incoterm: EXW, FOB, CIF, DDP, DAP, FCA
- Kargo Yöntemi: Sea Freight, Air Freight, Land Transport, Courier, Multi-Modal
- İptal Eden: Buyer, Seller, System, Admin
- İade Durumu: Not Applicable, Pending, Processing, Completed, Partial

#### 1.3.3 Zaman Serisi Grafikleri
- Günlük/Haftalık/Aylık B2B Sipariş Trendi
- Sipariş Tutarı Trendi
- Onaylama Trendi (confirmed_date)
- Kargolama Trendi (shipped_date)
- Teslim Trendi (delivered_date)
- Tamamlanma Trendi (completed_date)
- İptal Trendi (cancellation_date)

#### 1.3.4 Çubuk Grafikleri
- Alıcı Bazında B2B Sipariş Sayısı
- Satıcı Bazında B2B Sipariş Tutarı
- Incoterm Bazında Sipariş Dağılımı
- Kargo Yöntemi Bazında Sipariş Sayısı
- Ülke Bazında B2B Sipariş (delivery_country)

#### 1.3.5 Tablo Widget'ları
- Son B2B Siparişler
- Vadesi Geçmiş Ödemeler (payment_status = Overdue)
- Yüksek Öncelikli Siparişler
- Bekleyen Siparişler

### 1.4 Sipariş Olayları (Order Event)

#### 1.4.1 KPI Kartları
- Toplam Olay Sayısı
- Hata Olay Sayısı (is_error = 1)
- Sistem Olay Sayısı (is_system_event = 1)
- Bildirim Gönderilen Olay Sayısı

#### 1.4.2 Dağılım Grafikleri
- Olay Tipi Dağılımı (76 farklı event_type)
- Olay Kategorisi Dağılımı: Order, Payment, Fulfillment, Shipping, Return, Refund, Cancellation, Dispute, Communication, Invoice, Commission, Payout, Security, Integration, System, Error, Other
- Önem Derecesi Dağılımı: Debug, Info, Warning, Error, Critical
- Aktör Tipi Dağılımı: System, Buyer, Seller, Admin, Support, API, Integration, Scheduler, Webhook, Unknown
- Kaynak Kanal Dağılımı: Website, Mobile App, API, Admin Panel, Seller Portal, Scheduler, Webhook, Integration, System, Other
- Cihaz Tipi Dağılımı: Desktop, Mobile, Tablet, API Client, Unknown
- Bildirim Tipi: Email, SMS, Push, In-App, Webhook
- Bildirim Durumu: Queued, Sent, Delivered, Failed, Bounced

#### 1.4.3 Zaman Serisi
- Olay Sayısı Trendi (event_timestamp)
- Hata Olay Trendi
- Kategori Bazında Olay Trendi

### 1.5 Sepet (Cart)

#### 1.5.1 KPI Kartları
- Toplam Sepet Sayısı
- Aktif Sepet Sayısı (status = Active)
- Terk Edilmiş Sepet Sayısı (status = Abandoned)
- Dönüştürülen Sepet Sayısı (status = Converted)
- Ortalama Sepet Tutarı (avg of grand_total)
- Toplam Sepet Tutarı (sum of grand_total)
- Ortalama Ürün Sayısı (avg of item_count)
- Toplam İndirim (sum of discount_amount)
- Toplam Kupon İndirimi (sum of coupon_discount)
- Toplam Promosyon İndirimi (sum of promotion_discount)
- B2B Sepet Sayısı (is_b2b_cart = 1)
- Kurtarma E-postası Gönderilen Sepet Sayısı (recovery_email_sent = 1)
- Sepet Dönüşüm Oranı (converted / total)

#### 1.5.2 Dağılım Grafikleri
- Sepet Durumu: Active, Checkout, Converted, Abandoned, Expired, Merged
- Alıcı Tipi: Guest, Individual, Organization
- Organizasyon Tipi: Wholesale, Distributor, Retailer, Manufacturer, Other

#### 1.5.3 Zaman Serisi
- Günlük Sepet Oluşturma Trendi
- Terk Edilme Trendi (abandoned_at)
- Dönüştürülme Trendi (converted_at)
- Checkout Başlama Trendi (checkout_started_at)
- Son Aktivite Trendi (last_activity)

---

## 2. ÖDEME YÖNETİMİ (tradehub_commerce)

### 2.1 Payment Intent (Ödeme Niyeti)

#### 2.1.1 KPI Kartları
- Toplam Ödeme Sayısı
- Toplam Ödeme Tutarı (sum of amount)
- Ortalama Ödeme Tutarı
- Toplam Ücret Tutarı (sum of fee_amount)
- Net Toplam Tutar (sum of net_amount)
- Yakalanan Toplam Tutar (sum of captured_amount)
- İade Edilen Toplam Tutar (sum of refund_amount)
- Taksitli Ödeme Sayısı (has_installments = 1)
- 3D Secure Gerektiren Ödeme Sayısı (requires_3d_secure = 1)
- İşaretlenmiş Ödeme Sayısı (is_flagged = 1)
- Escrow Aktif Ödeme Sayısı (escrow_enabled = 1)
- Ortalama Risk Skoru (avg of risk_score)
- Ortalama Taksit Sayısı (avg of installment_count)
- Toplam Taksit Tutarı (sum of installment_total)
- Webhook Doğrulanmış Sayı (webhook_verified = 1)

#### 2.1.2 Dağılım Grafikleri
- Ödeme Durumu: Created, Pending, Processing, Requires Action, Requires Capture, Authorized, Captured, Paid, Partially Paid, Failed, Cancelled, Expired, Refunded, Partially Refunded, Disputed
- Ödeme Tipi: Checkout, Topup, Subscription, Invoice, Refund, Payout, Manual
- Ödeme Yöntemi: Credit Card, Debit Card, Bank Transfer, Wallet, Cash on Delivery, BNPL, Other
- Ödeme Gateway: iyzico, PayTR, Stripe, PayPal, Manual
- Kart Markası: Visa, Mastercard, Amex, Troy, Discover, Diners, JCB, UnionPay, Other
- 3D Durumu: Pending, Initiated, Challenge Required, Authenticated, Failed, Not Supported, Bypassed
- 3D Versiyonu: 1.0, 2.0, 2.1, 2.2
- Yakalama Yöntemi: Automatic, Manual
- İade Durumu: None, Requested, Pending, Processing, Refunded, Partially Refunded, Failed, Rejected
- İade Nedeni: Customer Request, Order Cancelled, Duplicate Payment, Fraud, Product Not Received, Product Not as Described, Other
- Escrow Durumu: Pending, Held, Partially Released, Released, Disputed, Refunded
- Risk Seviyesi: Low, Medium, High, Critical
- Dolandırıcılık Kontrol Durumu: Not Checked, Pending, Passed, Review Required, Failed
- ERPNext Senkronizasyon Durumu: Not Synced, Pending, Synced, Failed
- Alıcı Tipi: Individual, Organization, Guest

#### 2.1.3 Zaman Serisi
- Günlük Ödeme Sayısı Trendi (created_at)
- Günlük Ödeme Tutarı Trendi
- Yetkilendirme Trendi (authorized_at)
- Yakalama Trendi (captured_at)
- İade Trendi (refunded_at)
- Başarısız Ödeme Trendi (failed_at)
- İptal Trendi (cancelled_at)

#### 2.1.4 Göstergeler (Gauge)
- Ödeme Başarı Oranı (Paid / Total)
- 3D Secure Başarı Oranı
- Dolandırıcılık Tespit Oranı
- İade Oranı

#### 2.1.5 Tablo Widget'ları
- Bekleyen Ödemeler
- Başarısız Ödemeler
- İşaretlenmiş (Flagged) Ödemeler
- Yüksek Riskli Ödemeler
- Taksitli Ödemeler
- İade Bekleyen Ödemeler

### 2.2 Escrow Account (Emanet Hesap)

#### 2.2.1 KPI Kartları
- Toplam Escrow Hesap Sayısı
- Tutulan Toplam Tutar (sum of held_amount)
- Serbest Bırakılan Toplam Tutar (sum of released_amount)
- İade Edilen Toplam Tutar (sum of refunded_amount)
- Bekleyen Serbest Bırakma Tutarı (sum of pending_release_amount)
- Toplam Komisyon Tutarı (sum of commission_amount)
- Toplam Platform Ücreti (sum of platform_fee)
- Toplam İşlem Ücreti (sum of processing_fee)
- Toplam Ücretler (sum of total_fees)
- Net Satıcı Tutarı (sum of net_amount_to_seller)
- Ödeme Tutarı (sum of payout_amount)
- Tartışmalı Tutar (sum where has_dispute = 1)
- Ortalama Otomatik Serbest Bırakma Günü (avg of auto_release_days)
- Uzatma Sayısı (sum of hold_extension_count)

#### 2.2.2 Dağılım Grafikleri
- Escrow Durumu: Pending, Funds Held, Partially Released, Released, Disputed, Dispute Resolved, Refunded, Partially Refunded, Cancelled, Expired
- Escrow Tipi: Order Payment, Auction Payment, Service Payment, Milestone Payment, Deposit, Other
- Serbest Bırakma Koşulu: Delivery Confirmation, Buyer Confirmation, Time-based Auto Release, Milestone Completion, Dispute Resolution, Manual Release
- Serbest Bırakma Tetikleyici: Buyer Confirmed, Auto Released After Delivery, Auto Released After Timeout, Admin Manual Release, Dispute Resolution, Seller Request Approved
- Ödeme Durumu: Pending, Scheduled, Processing, Completed, Failed, Held, Cancelled
- Ödeme Yöntemi: Bank Transfer, iyzico Payout, PayTR Payout, Manual
- Tartışma Durumu: Open, Under Review, Escalated, Resolved, Closed
- Tartışma Kararı: Full Refund to Buyer, Partial Refund to Buyer, Full Release to Seller, Partial Release to Seller, Split Decision
- Uzatma Nedeni: Buyer Request, Seller Request, Dispute Investigation, Quality Issue Investigation, Shipping Delay, Admin Decision
- ERPNext Senkronizasyon: Not Synced, Pending, Synced, Failed

#### 2.2.3 Zaman Serisi
- Günlük Escrow Oluşturma Trendi (created_at)
- Kapanış Trendi (closed_at)
- Serbest Bırakma Trendi (release_approved_at)
- Ödeme Trendi (payout_date)
- Tartışma Açılma Trendi (dispute_opened_at)
- Tartışma Çözülme Trendi (dispute_resolved_at)

#### 2.2.4 Tablo Widget'ları
- Bekleyen Escrow Hesapları
- Tartışmalı Escrow Hesapları
- Serbest Bırakma Zamanı Yaklaşan Hesaplar
- Ödeme Başarısız Hesaplar

### 2.3 Payment Plan (Ödeme Planı)

#### 2.3.1 KPI Kartları
- Toplam Ödeme Planı Sayısı
- Toplam Plan Tutarı (sum of total_amount)
- Ödenen Toplam Tutar (sum of paid_amount)
- Bekleyen Toplam Tutar (sum of pending_amount)
- Ortalama Taksit Sayısı (avg of number_of_installments)
- Toplam Ödenen Taksit (sum of paid_installments)
- Toplam Bekleyen Taksit (sum of pending_installments)
- Toplam Vadesi Geçmiş Taksit (sum of overdue_installments)

#### 2.3.2 Dağılım Grafikleri
- Plan Durumu: Draft, Active, Partially Paid, Completed, Overdue, Defaulted, Cancelled
- Plan Tipi: Standard, 2-12 Installments, Custom
- Taksit Sıklığı: Weekly, Bi-Weekly, Monthly, Quarterly, Custom

#### 2.3.3 Zaman Serisi
- Yeni Plan Oluşturma Trendi
- Ödeme Trendi (last_payment_date)
- Vadesi Geçmiş Taksit Trendi

### 2.4 Payment Method (Ödeme Yöntemi)

#### 2.4.1 KPI Kartları
- Toplam Ödeme Yöntemi Sayısı
- Aktif Yöntem Sayısı (status = Active)
- Toplam İşlenen Tutar (sum of total_amount_processed)
- Toplam İşlem Sayısı (sum of total_transactions)
- Ortalama İşlem Tutarı (avg of average_transaction_amount)
- Ortalama Başarı Oranı (avg of success_rate)
- Ortalama İşlem Süresi (avg of average_processing_time)

#### 2.4.2 Dağılım Grafikleri
- Yöntem Tipi: Card, Bank Transfer, Digital Wallet, Cash on Delivery, Buy Now Pay Later, Credit Terms, Escrow, Letter of Credit, Prepaid, Cryptocurrency, Other
- Durum: Active, Inactive, Maintenance, Deprecated
- Gateway: iyzico, PayTR, Stripe, PayPal, Garanti Pay, Akbank Direct, Yapi Kredi Pay, DenizBank, QNB Finansbank, Manual, Offline
- Kullanılabilirlik: All, All Buyers, Specific Customers, Customer Groups, Buyer Levels, Premium Only, Enterprise Only
- Ücret Tipi: None, Percentage, Fixed, Percentage + Fixed, Tiered
- Ücret Ödeyen: Platform, Seller, Buyer, Split
- Yakalama Yöntemi: Automatic, Manual, Delayed
- PCI Uyumluluk: Level 1-4, SAQ A, SAQ A-EP, SAQ D

### 2.5 Komisyon Planı (Commission Plan)

#### 2.5.1 KPI Kartları
- Toplam Komisyon Planı Sayısı
- Aktif Plan Sayısı
- Ortalama Baz Komisyon Oranı (avg of base_commission_rate)
- Toplam İşlenen GMV (sum of total_gmv_processed)
- Toplam Kazanılan Komisyon (sum of total_commission_earned)
- Ortalama Komisyon Oranı (avg of average_commission_rate)
- Toplam Satıcı Sayısı (sum of total_sellers)
- Mevcut Satıcı Sayısı (sum of current_seller_count)
- Ortalama Min Komisyon (avg of minimum_commission)
- Ortalama Max Komisyon (avg of maximum_commission)
- Ortalama Min Ödeme Tutarı (avg of minimum_payout_amount)

#### 2.5.2 Dağılım Grafikleri
- Plan Tipi: Standard, Premium, Enterprise, Custom, Promotional, New Seller
- Durum: Draft, Active, Suspended, Expired, Archived
- Hesaplama Tipi: Percentage, Fixed, Percentage + Fixed, Tiered Percentage
- Kademe Hesaplama Temeli: GMV, Order Count, Monthly GMV, Monthly Orders
- Kademe Hesaplama Dönemi: Monthly, Quarterly, Yearly, Lifetime
- Ödeme Sıklığı: Daily, Weekly, Bi-Weekly, Monthly
- Satıcı Tipi Kısıtlaması: Individual, Business, Enterprise
- Doğrulama Seviyesi: None, Basic, Identity, Business, Full

### 2.6 Komisyon Kuralı (Commission Rule)

#### 2.6.1 KPI Kartları
- Toplam Kural Sayısı
- Aktif Kural Sayısı
- Ortalama Komisyon Oranı (avg of commission_rate)
- Toplam Üretilen Komisyon (sum of total_commission_generated)
- Ortalama Komisyon Tutarı (avg of average_commission_amount)
- Toplam İşlenen GMV (sum of total_gmv_processed)
- Toplam Kullanım Sayısı (sum of usage_count)

#### 2.6.2 Dağılım Grafikleri
- Kural Tipi: Standard, Category Based, Seller Tier Based, Volume Based, Promotional, Seasonal, Flash Sale, New Seller, VIP Seller, Custom
- Durum: Draft, Active, Suspended, Expired, Archived
- Uygulama Hedefi: All, Category, Seller, Seller Tier, Product Type, Listing, Order Value Range, Quantity Range
- Komisyon Tipi: Percentage, Fixed Amount, Percentage + Fixed, Tiered, Custom Formula
- Hesaplama Temeli: Order Total, Subtotal, Item Price, Net Amount
- Koşul Tipi: Simple, AND, OR, Custom Expression
- Satıcı Tipi: Individual, Business, Enterprise
- Ürün Tipi: Physical, Digital, Service, Subscription

---

## 3. SATICI YÖNETİMİ (tradehub_seller)

### 3.1 Seller Profile (Satıcı Profili)

#### 3.1.1 KPI Kartları
- Toplam Satıcı Sayısı
- Aktif Satıcı Sayısı (status = Active)
- Yeni Satıcı Sayısı (Bu Ay)
- Ortalama Satıcı Skoru (avg of seller_score)
- Ortalama Değerlendirme (avg of average_rating)
- Ortalama Yanıt Süresi (avg of response_time_hours) saat
- Toplam Satış Tutarı (sum of total_sales_amount)
- Toplam Satış Sayısı (sum of total_sales_count)
- Toplam Yorum Sayısı (sum of total_reviews)
- Ortalama Sipariş Karşılama Oranı (avg of order_fulfillment_rate)
- Ortalama Zamanında Teslimat Oranı (avg of on_time_delivery_rate)
- Ortalama İade Oranı (avg of return_rate)
- Ortalama İptal Oranı (avg of cancellation_rate)
- Ortalama Şikayet Oranı (avg of complaint_rate)
- Ortalama Olumlu Geri Bildirim Oranı (avg of positive_feedback_rate)
- Kimlik Doğrulanmış Satıcı Sayısı (identity_verified = 1)
- İşletme Doğrulanmış Sayı (business_verified = 1)
- Banka Doğrulanmış Sayı (bank_verified = 1)
- Tatil Modunda Satıcı Sayısı (vacation_mode = 1)
- Kısıtlı Satıcı Sayısı (is_restricted = 1)
- Öne Çıkan Satıcı Sayısı (is_featured = 1)
- Top Satıcı Sayısı (is_top_seller = 1)
- Premium Satıcı Sayısı (is_premium_seller = 1)
- Ortalama Max Listeleme Limiti (avg of max_listings)
- İade Kabul Eden Satıcı Sayısı (accepts_returns = 1)
- Otomatik Sipariş Kabul Eden (auto_accept_orders = 1)
- E-Fatura Kayıtlı Sayı (e_invoice_registered = 1)

#### 3.1.2 Dağılım Grafikleri
- Satıcı Durumu: Pending, Under Review, Active, Suspended, Blocked, Inactive, Vacation
- Satıcı Tipi: Individual, Business, Enterprise
- Vergi No Tipi: TCKN, VKN
- Doğrulama Durumu: Pending, In Review, Documents Requested, Verified, Rejected
- Ödeme Yöntemi: Bank Transfer, PayPal, iyzico, Papara

#### 3.1.3 Zaman Serisi
- Yeni Satıcı Kayıt Trendi (joined_at)
- Son Aktif Olma Trendi (last_active_at)
- Doğrulama Trendi (verified_at)
- Metrik Güncelleme Trendi (last_metrics_update)
- Öne Çıkan Satıcı Başlangıç Trendi (featured_from)
- Kısıtlama Trendi (restricted_at)

#### 3.1.4 Göstergeler (Gauge)
- Ortalama Satıcı Skoru (0-100)
- Ortalama Değerlendirme (1-5)
- Ortalama Karşılama Oranı (0-100%)
- Ortalama Zamanında Teslimat Oranı (0-100%)
- Ortalama İade Oranı (0-100%)
- Ortalama İptal Oranı (0-100%)
- Ortalama Olumlu Geri Bildirim Oranı (0-100%)

#### 3.1.5 Tablo Widget'ları
- En İyi Satıcılar (seller_score desc)
- En Kötü Performanslı Satıcılar (seller_score asc)
- En Çok Satış Yapan Satıcılar
- En Hızlı Yanıt Veren Satıcılar
- Doğrulama Bekleyen Satıcılar
- Askıya Alınmış Satıcılar
- Engellenen Satıcılar
- Tatil Modundaki Satıcılar
- Yeni Kayıtlı Satıcılar (Son 30 Gün)

### 3.2 Seller Score (Satıcı Puanı)

#### 3.2.1 KPI Kartları
- Ortalama Genel Puan (avg of overall_score)
- Ortalama Karşılama Puanı (avg of fulfillment_score)
- Ortalama Teslimat Puanı (avg of delivery_score)
- Ortalama Kalite Puanı (avg of quality_score)
- Ortalama Hizmet Puanı (avg of service_score)
- Ortalama Uyumluluk Puanı (avg of compliance_score)
- Ortalama Etkileşim Puanı (avg of engagement_score)
- Ortalama Yüzdelik Dilim (avg of percentile_rank)
- Toplam Değerlendirilen Sipariş (sum of orders_evaluated)
- Toplam Değerlendirilen Yorum (sum of reviews_evaluated)
- Ortalama Karşılama Oranı (avg of fulfillment_rate)
- Ortalama Zamanında Teslimat Oranı (avg of on_time_rate)
- Ortalama İade Oranı (avg of return_rate)
- Ortalama İptal Oranı (avg of cancellation_rate)
- Ortalama Dönüşüm Oranı (avg of conversion_rate)
- Toplam Ceza Puanı (sum of penalty_points)
- Toplam Bonus Puanı (sum of bonus_points)
- Ortalama Dönem Satış Tutarı (avg of period_sales_amount)
- Toplam Politika İhlali (sum of policy_violations)
- Toplam Geç Kargo (sum of late_shipments)
- Toplam İptal Edilen Sipariş (sum of cancelled_orders)
- Toplam Tartışmalı Sipariş (sum of disputed_orders)

#### 3.2.2 Dağılım Grafikleri
- Puan Durumu: Draft, Calculating, Pending Review, Finalized, Appealed, Revised
- Puan Tipi: Periodic, Daily, Weekly, Monthly, Quarterly, Annual, Lifetime, Manual
- Puan Trendi: Rising, Stable, Declining

#### 3.2.3 Zaman Serisi
- Ortalama Puan Trendi (calculation_date)
- Kategori Bazında Puan Trendi (fulfillment, delivery, quality, service, compliance, engagement)
- Ceza Puanı Trendi
- Bonus Puanı Trendi
- Satış Tutarı Trendi

#### 3.2.4 Radar/Örümcek Grafik
- Satıcı Performans Radarı: Fulfillment, Delivery, Quality, Service, Compliance, Engagement (6 eksen)

#### 3.2.5 Histogram
- Puan Dağılımı (0-10, 10-20, ..., 90-100 aralıkları)
- Yüzdelik Dilim Dağılımı

### 3.3 Seller KPI (Satıcı KPI)

#### 3.3.1 KPI Kartları
- Toplam KPI Kayıt Sayısı
- Aktif KPI Sayısı
- Hedefi Aşan KPI Sayısı (status = Exceeding)
- Risk Altındaki KPI Sayısı (status = At Risk)
- Kritik KPI Sayısı (status = Critical)
- Hedef Altındaki KPI Sayısı (status = Below Target)
- Ortalama Hedef Değeri (avg of target_value)
- Ortalama Gerçekleşen Değer (avg of actual_value)
- Ortalama Hedefe Ulaşma Yüzdesi (avg of percentage_of_target)
- Ortalama Eş Ortalaması (avg of peer_average)
- Ortalama Platform Ortalaması (avg of platform_average)
- Aksiyon Gereken KPI Sayısı (action_required = 1)

#### 3.3.2 Dağılım Grafikleri
- KPI Durumu: Draft, Active, On Track, At Risk, Below Target, Critical, Exceeding, Paused, Expired
- KPI Tipi: Order Fulfillment Rate, On-Time Delivery Rate, Return Rate, Cancellation Rate, Response Time, Customer Satisfaction, Complaint Rate, Dispute Rate, Refund Rate, Shipment Tracking Rate, Review Response Rate, Listing Quality Score, Inventory Accuracy, Order Acceptance Rate, Processing Time, Packaging Quality, Shipping Label Accuracy, Communication Rating, Product Accuracy, Policy Compliance
- KPI Kategorisi: Fulfillment, Delivery, Quality, Service, Compliance, Engagement, Financial
- Dönem Tipi: Daily, Weekly, Bi-Weekly, Monthly, Quarterly, Half-Yearly, Annually, Rolling 7/30/90 Days, Custom
- Hedef Tipi: Higher is Better, Lower is Better, Closer to Target, Within Range
- Değer Trendi: Improving, Stable, Declining, Volatile, New
- Değerlendirme Durumu: Pending, Exceeding Target, Meeting Target, Within Acceptable Range, Below Warning Threshold, Below Critical Threshold, Not Applicable
- Performans Notu: Not Graded, A+, A, A-, B+, B, B-, C+, C, C-, D, F

#### 3.3.3 Zaman Serisi
- KPI Değer Trendi (period_start / period_end)
- Hedefe Ulaşma Oranı Trendi
- Kategori Bazında KPI Trendi
- Uyarı Sayısı Trendi

### 3.4 Seller Metrics (Satıcı Metrikleri)

#### 3.4.1 KPI Kartları
- Ortalama İptal Oranı (avg of cancellation_rate)
- Ortalama İade Oranı (avg of return_rate)
- Ortalama Zamanında Teslimat Oranı
- Ortalama Olumlu Yorum Oranı
- Ortalama Şikayet Oranı
- Ortalama Tekrar Müşteri Oranı (avg of repeat_customer_rate)
- Toplam Sipariş (sum of total_orders)
- Toplam Yorum (sum of total_reviews)
- Ortalama Değerlendirme (avg of avg_rating)
- Ortalama Yanıt Süresi (avg of avg_response_time_hours)
- Ortalama Listeleme Sayısı (avg of listing_count)
- Ortalama Aktif Listeleme (avg of active_listing_count)
- Toplam Satış Tutarı (sum of total_sales_amount)
- Premium Satıcı Sayısı (premium_seller = 1)

#### 3.4.2 Zaman Serisi
- Metrik Trendi (calculation_date)
- Oran Trendi (cancellation, return, delivery, review, complaint)
- Sipariş Sayısı Trendi

### 3.5 Seller Level (Satıcı Seviyesi)

#### 3.5.1 KPI Kartları
- Toplam Seviye Sayısı
- Aktif Seviye Sayısı
- Her Seviyedeki Satıcı Sayısı (seller_count)
- Ortalama Komisyon Oranı (avg of commission_rate)
- Ortalama Komisyon İndirimi (avg of commission_reduction)
- Ortalama Min Satış Tutarı (avg of min_sales_amount)
- Ortalama Max Ürün Limiti (avg of max_product_limit)

#### 3.5.2 Dağılım Grafikleri
- Seviye Durumu: Active, Inactive, Deprecated
- Yeterlilik Tipi: Sales Amount, Order Count, Performance Score, Manual Assignment, Combined
- Eşik Dönemi: Lifetime, Yearly, Quarterly, Monthly

#### 3.5.3 Çubuk Grafik
- Seviye Bazında Satıcı Sayısı
- Seviye Bazında Komisyon Oranı
- Seviye Bazında Ürün Limiti

### 3.6 Seller Tier (Satıcı Kademesi)

#### 3.6.1 KPI Kartları
- Toplam Kademe Sayısı
- Aktif Kademe Sayısı
- Her Kademedeki Satıcı Sayısı (total_sellers, active_sellers)
- Ortalama Min Satıcı Skoru (avg of min_seller_score)
- Ortalama Min Değerlendirme (avg of min_average_rating)
- Ortalama Komisyon İndirim Oranı (avg of commission_discount_percent)
- Ortalama Satıcı Performansı (avg of avg_seller_performance)

#### 3.6.2 Dağılım Grafikleri
- Kademe Durumu: Active, Inactive, Deprecated

#### 3.6.3 Çubuk Grafik
- Kademe Bazında Satıcı Sayısı
- Kademe Bazında Performans
- Kademe Bazında Komisyon İndirimi

### 3.7 Seller Application (Satıcı Başvurusu)

#### 3.7.1 KPI Kartları
- Toplam Başvuru Sayısı
- Bekleyen Başvuru Sayısı
- Onaylanan Başvuru Sayısı
- Reddedilen Başvuru Sayısı
- Bu Aydaki Başvuru Sayısı
- Ortalama İnceleme Süresi (submitted_at to reviewed_at)

#### 3.7.2 Dağılım Grafikleri
- Başvuru Durumu: Draft, Submitted, Under Review, Documents Requested, Revision Required, Approved, Rejected, Cancelled
- Satıcı Tipi: Individual, Business, Enterprise
- Öncelik: Low, Normal, High, Urgent
- Kimlik Belgesi: National ID Card, Passport, Driver License
- Vergi No Tipi: TCKN, VKN
- Beklenen Aylık Ürün: 1-50, 51-200, 201-500, 501-1000, 1000+
- Beklenen Aylık Satış: 0-1000, 1000-5000, 5000-25000, 25000-100000, 100000+
- Satış Deneyimi: None, <1 year, 1-3 years, 3-5 years, >5 years
- İnceleme Durumu: Not Started, In Progress, Pending Documents, Pending Verification, Completed
- Red Nedeni: Incomplete Documents, Invalid Tax ID, Failed Verification, Prohibited Category, Previous Violations, Duplicate Application, Suspicious Activity, Other

#### 3.7.3 Zaman Serisi
- Günlük/Haftalık Başvuru Trendi (submitted_at)
- Onaylama Trendi (approved_at)
- İnceleme Başlama Trendi (review_started_at)
- Red Trendi

#### 3.7.4 Huni Grafik
- Başvuru Hunisi: Draft → Submitted → Under Review → Approved/Rejected

### 3.8 Seller Balance (Satıcı Bakiyesi)

#### 3.8.1 KPI Kartları
- Toplam Kullanılabilir Bakiye (sum of available_balance)
- Toplam Bekleyen Bakiye (sum of pending_balance)
- Toplam Tutulan Bakiye (sum of held_balance)
- Toplam Rezerv Bakiye (sum of reserved_balance)
- Toplam Bakiye (sum of total_balance)
- Toplam Ömür Boyu Kazanç (sum of lifetime_earnings)
- Toplam Ömür Boyu Ödeme (sum of lifetime_payouts)
- Toplam Ömür Boyu Komisyon (sum of lifetime_commissions)
- Toplam Ömür Boyu İade (sum of lifetime_refunds)
- Net Ömür Boyu Kazanç (sum of net_lifetime_earnings)
- Ortalama Sipariş Değeri (avg of average_order_value)
- Toplam Komisyon Ödenen (sum of total_commission_paid)
- Toplam Vergi Kesintisi (sum of total_tax_withheld)
- Bekleyen Ödeme Sayısı (sum of pending_payout_count)
- Ödeme Sorunlu Satıcı Sayısı (has_payment_issue = 1)
- Ödeme Askıda Satıcı Sayısı (payout_suspended = 1)

#### 3.8.2 Dağılım Grafikleri
- Bakiye Durumu: Active, Pending Verification, Suspended, Closed
- Ödeme Yöntemi: Bank Transfer, iyzico Payout, PayTR Payout, Manual
- Ödeme Sıklığı: Daily, Weekly, Bi-Weekly, Monthly, On Demand

#### 3.8.3 Zaman Serisi
- Bakiye Trendi (last_updated)
- Ödeme Trendi (last_payout_date)
- Komisyon Trendi

### 3.9 Listing (Listeleme/İlan)

#### 3.9.1 KPI Kartları
- Toplam Listeleme Sayısı
- Aktif Listeleme Sayısı (status = Active)
- Ortalama Satış Fiyatı (avg of selling_price)
- Ortalama Baz Fiyat (avg of base_price)
- Toplam Stok (sum of stock_qty)
- Toplam Kullanılabilir Stok (sum of available_qty)
- Ortalama Değerlendirme (avg of average_rating)
- Ortalama Kalite Skoru (avg of quality_score)
- Ortalama Sıralama Skoru (avg of ranking_score)
- Toplam Görüntülenme (sum of view_count)
- Toplam İstek Listesi (sum of wishlist_count)
- Toplam Sipariş (sum of order_count)
- Toplam Yorum (sum of review_count)
- Ortalama Dönüşüm Oranı (avg of conversion_rate)
- Ortalama Tıklama Oranı (avg of click_through_rate)
- Ortalama Vergi Oranı (avg of tax_rate)
- Öne Çıkan Listeleme Sayısı (is_featured = 1)
- En Çok Satan Listeleme Sayısı (is_best_seller = 1)
- Yeni Gelen Listeleme Sayısı (is_new_arrival = 1)
- İndirimli Listeleme Sayısı (is_on_sale = 1)
- Ücretsiz Kargo Listeleme Sayısı (is_free_shipping = 1)
- Varyantlı Listeleme Sayısı (has_variants = 1)
- B2B Aktif Listeleme Sayısı (b2b_enabled = 1)
- Toplu Fiyatlandırma Aktif Sayısı (bulk_pricing_enabled = 1)
- Açık Artırma Listeleme Sayısı (is_auction = 1)
- Yetişkin İçerik Sayısı (is_adult_only = 1)
- Düşük Stok Sayısı (stock_qty < low_stock_threshold)

#### 3.9.2 Dağılım Grafikleri
- Listeleme Durumu: Draft, Pending Review, Active, Paused, Out of Stock, Sold Out, Suspended, Rejected, Archived
- Listeleme Tipi: Fixed Price, Auction, Best Offer, RFQ Only
- Kargo Sınıfı: Standard, Bulky, Fragile, Hazardous, Perishable
- Moderasyon Durumu: Pending, In Review, Approved, Rejected, Flagged
- Barkod Tipi: EAN, UPC, ISBN, Code-39, Code-128, GTIN, Other

#### 3.9.3 Zaman Serisi
- Yeni Listeleme Trendi (published_at)
- Satış Trendi (last_sold_at)
- Görüntülenme Trendi
- Sipariş Trendi
- Sıralama Güncelleme Trendi (ranking_updated_at)
- Moderasyon Trendi (moderated_at)

#### 3.9.4 Çubuk Grafik
- Kategori Bazında Listeleme Sayısı
- Satıcı Bazında Listeleme Sayısı (Top 20)
- Fiyat Aralığına Göre Listeleme Dağılımı
- En Çok Görüntülenen Listelelemeler (Top 20)
- En Çok Sipariş Edilen Listelelemeler (Top 20)
- En Yüksek Dönüşüm Oranlı Listelelemeler (Top 20)

#### 3.9.5 Tablo Widget'ları
- En Çok Satan Listelemeleri
- En Düşük Stoklu Listelelemeler
- Moderasyon Bekleyen Listelelemeler
- Stokta Olmayan Listelelemeler
- En Yeni Listelelemeler
- İndirimli Listelelemeler
- Açık Artırma Listelemeleri

### 3.10 SKU & SKU Product

#### 3.10.1 KPI Kartları
- Toplam SKU Sayısı
- Aktif SKU Sayısı
- Toplam SKU Product Sayısı
- Toplam Stok (sum of stock_qty)
- Toplam Kullanılabilir Stok (sum of available_qty)
- Toplam Satış (sum of total_sold)
- Toplam Alım (sum of total_received)
- Ortalama Devir Oranı (avg of turnover_rate)
- Ortalama Kar Marjı (avg of profit_margin)
- Düşük Stoklu SKU Sayısı
- Stokta Olmayan SKU Sayısı

#### 3.10.2 Dağılım Grafikleri
- SKU Durumu: Active, Inactive, Out of Stock, Discontinued, Pending
- Ürün Tipi: Listing, Variant, Standalone
- Barkod Tipi: EAN, UPC, ISBN, Code-39, Code-128, GTIN, Other
- SKU Product Durumu: Draft, Active, Passive, Archive

### 3.11 Buy Box Entry

#### 3.11.1 KPI Kartları
- Toplam Buy Box Giriş Sayısı
- Kazanan Sayısı (is_winner = 1)
- Ortalama Teklif Fiyatı (avg of offer_price)
- Ortalama Buy Box Skoru (avg of buy_box_score)
- Ortalama Fiyat Skoru (avg of price_score)
- Ortalama Teslimat Skoru (avg of delivery_score)
- Ortalama Değerlendirme Skoru (avg of rating_score)
- Ortalama Stok Skoru (avg of stock_score)
- Ortalama Zamanında Teslimat Oranı (avg of seller_on_time_delivery_rate)
- Ortalama Yanıt Oranı (avg of seller_response_rate)
- Ortalama İade Oranı (avg of seller_refund_rate)
- Ortalama Buy Box Kazanma Oranı (avg of seller_buy_box_win_rate)
- Ortalama Teslimat Günü (avg of delivery_days)

#### 3.11.2 Dağılım Grafikleri
- Durum: Active, Inactive, Suspended, Expired
- Kargo Yöntemi: Standard, Express, Economy, Freight, Seller Delivery

### 3.12 Seller Store (Satıcı Mağazası)

#### 3.12.1 KPI Kartları
- Toplam Mağaza Sayısı
- Yayınlanmış Mağaza Sayısı (is_published = 1)
- Toplam Sayfa Görüntüleme (sum of page_views)
- Ortalama Sayfa Başına Ürün (avg of products_per_page)

#### 3.12.2 Dağılım Grafikleri
- Mağaza Durumu: Draft, Active, Inactive, Suspended
- Tema: Default, Modern, Classic, Minimal, Bold, Elegant, Custom
- Düzen: Grid, List, Masonry, Carousel
- Dil: tr, en, de, fr, es, ar, ru, zh

### 3.13 Seller Tag & Tag Assignment

#### 3.13.1 KPI Kartları
- Toplam Etiket Sayısı
- Aktif Etiket Sayısı
- Toplam Atama Sayısı
- Kural Bazlı Atama Sayısı
- Manuel Atama Sayısı

#### 3.13.2 Dağılım Grafikleri
- Etiket Tipi: Achievement, Badge, Certification, Warning, Special
- Etiket Durumu: Active, Inactive
- Atama Kaynağı: Manual, Rule
- Geçersiz Kılma Durumu: None, ForcedOn, ForcedOff

### 3.14 KPI Template (KPI Şablonu)

#### 3.14.1 KPI Kartları
- Toplam Şablon Sayısı
- Aktif Şablon Sayısı
- Ortalama Geçme Puanı (avg of passing_score)
- Ortalama Toplam Ağırlık (avg of total_weight)
- Toplam Kullanım Sayısı (sum of usage_count)

#### 3.14.2 Dağılım Grafikleri
- Şablon Durumu: Draft, Active, Inactive, Deprecated
- Hedef Tipi: Seller, Buyer, Both
- Değerlendirme Dönemi: Daily, Weekly, Monthly, Quarterly, Yearly, Custom
- Değerlendirme Sıklığı: Daily, Weekly, Monthly, On Demand
- Puanlama Eğrisi: Linear, Bell Curve, Exponential, Step

### 3.15 Premium Seller

#### 3.15.1 KPI Kartları
- Toplam Premium Satıcı Sayısı
- Aktif Premium Sayısı
- Ortalama Premium Skoru (avg of premium_score)
- Ortalama Yanıt Süresi (avg of average_response_time_hours)
- Ortalama Hata Oranı (avg of defect_rate)
- Ortalama İade Oranı (avg of return_rate)
- Ortalama İhracat Yüzdesi (avg of export_percentage)
- Ortalama Yanıt Oranı (avg of response_rate)
- Ortalama Zamanında Teslimat Oranı (avg of on_time_delivery_rate)
- Ortalama Tekrar Alıcı Oranı (avg of repeat_buyer_rate)
- Ortalama Sorgu Dönüşüm Oranı (avg of inquiry_conversion_rate)
- Fabrikası Olan Sayısı (has_factory = 1)
- Ar-Ge Yeteneği Olan Sayısı (r_and_d_capability = 1)
- OEM Hizmeti Veren Sayısı (oem_service = 1)
- ODM Hizmeti Veren Sayısı (odm_service = 1)
- Platform Doğrulaması Olan Sayısı (verified_by_platform = 1)
- Yerinde Doğrulama Olan Sayısı (on_site_verified = 1)

#### 3.15.2 Dağılım Grafikleri
- Durum: Pending, Active, Suspended, Expired, Cancelled
- Abonelik Durumu: Active, Pending Payment, Grace Period, Expired, Cancelled
- Yıllık Gelir Aralığı: Below $100K ... Above $100M
- Çalışan Sayısı Aralığı: 1-10, 11-50, 51-100, 101-500, 501-1000, 1001-5000, Above 5000
- İşletme Tipi: Manufacturer, Trading Company, Manufacturer & Trading Company, Distributor/Wholesaler, Agent, Buying Office, Service Provider
- Kalite Yönetim Sistemi: ISO 9001, ISO 14001, ISO 45001, ISTS 16949, AS9100, Other
- Doğrulama Seviyesi: Basic, Standard, Advanced, Premium, Enterprise
- API Erişim Seviyesi: None, Basic, Standard, Advanced, Enterprise

---

## 4. ALICI YÖNETİMİ (tradehub_core)

### 4.1 Buyer Profile (Alıcı Profili)

#### 4.1.1 KPI Kartları
- Toplam Alıcı Sayısı
- Aktif Alıcı Sayısı
- Toplam Harcama (sum of total_spent)
- Ortalama Sipariş Değeri (avg of average_order_value)
- Toplam Sipariş Sayısı (sum of total_orders)
- Toplam Taahhüt Tutarı (sum of total_commitment_amount)
- Toplam Alım Değeri (sum of total_purchase_value)
- Toplam Grup Alım Sayısı (sum of total_group_buys)
- Başarılı Grup Alım Sayısı (sum of successful_group_buys)
- Ortalama Zamanında Ödeme Oranı (avg of payment_on_time_rate)
- E-Posta Doğrulanmış Alıcı Sayısı (email_verified = 1)
- Telefon Doğrulanmış Alıcı Sayısı (phone_verified = 1)
- Kimlik Doğrulanmış Alıcı Sayısı (identity_verified = 1)
- Pazarlama İzni Veren Sayı (receives_marketing = 1)
- E-Fatura İsteyen Sayı (wants_e_invoice = 1)

#### 4.1.2 Dağılım Grafikleri
- Alıcı Tipi: Individual, Business, Wholesaler
- Durum: Active, Inactive, Suspended, Blocked
- Vergi No Tipi: TCKN, VKN
- Tercih Edilen Ödeme: Credit Card, Debit Card, Bank Transfer, Digital Wallet, Cash on Delivery
- Doğrulama Durumu: Pending, Verified, Rejected, Suspended

#### 4.1.3 Zaman Serisi
- Yeni Alıcı Kayıt Trendi (joined_at)
- Son Sipariş Trendi (last_order_date)
- Son Aktif Olma Trendi (last_active_at)

#### 4.1.4 Çubuk Grafik
- En Çok Harcayan Alıcılar (Top 20)
- En Çok Sipariş Veren Alıcılar (Top 20)
- Kategori Bazında Alıcı İlgisi

#### 4.1.5 Tablo Widget'ları
- En Değerli Alıcılar
- İnaktif Alıcılar (>90 gün)
- Askıya Alınmış Alıcılar
- Yeni Alıcılar (Son 30 Gün)

### 4.2 Buyer Level (Alıcı Seviyesi)

#### 4.2.1 KPI Kartları
- Toplam Seviye Sayısı
- Her Seviyedeki Alıcı Sayısı (buyer_count)
- Ortalama Eşik Değeri (avg of threshold_value)
- Ortalama Min Sipariş Tutarı (avg of min_order_amount)

#### 4.2.2 Dağılım Grafikleri
- Durum: Active, Inactive, Deprecated
- Yeterlilik Tipi: Purchase Amount, Order Count, Points, Manual Assignment, Combined
- Eşik Dönemi: Lifetime, Yearly, Quarterly, Monthly

#### 4.2.3 Çubuk Grafik
- Seviye Bazında Alıcı Sayısı

### 4.3 Buyer Category (Alıcı Kategorisi)

#### 4.3.1 KPI Kartları
- Toplam Kategori Sayısı
- Her Kategorideki Alıcı Sayısı (buyer_count)
- Ortalama İndirim Yüzdesi (avg of discount_percentage)
- Ortalama Min Sipariş Tutarı (avg of min_order_amount)
- Ortalama Uzatılmış Kredi Günü (avg of extended_credit_days)

#### 4.3.2 Dağılım Grafikleri
- Durum: Active, Inactive, Deprecated
- Yeterlilik Tipi: Manual Assignment, Purchase Amount, Order Count, Industry, Application

### 4.4 Premium Buyer

#### 4.4.1 KPI Kartları
- Toplam Premium Alıcı Sayısı
- Aktif Premium Sayısı
- Ortalama Alıcı Skoru (avg of buyer_score)
- Ortalama Yıllık Tedarik Bütçesi (avg of annual_procurement_budget)
- Ortalama Sipariş Değeri (avg of average_order_value)
- Ortalama Kredi Limiti (avg of credit_limit)
- Ortalama Ödeme Güvenilirlik Oranı (avg of payment_reliability_rate)
- Ortalama İade Oranı (avg of return_rate)
- Ortalama Tekrar Alım Oranı (avg of repeat_purchase_rate)
- Toplam Alım Tutarı (sum of total_purchase_amount)
- Ortalama Sipariş Sıklığı (avg of average_order_frequency_days) gün

#### 4.4.2 Dağılım Grafikleri
- Alıcı Tipi: Individual, Business, Enterprise, Government, Non-Profit
- Durum: Pending, Active, Suspended, Expired, Cancelled
- Abonelik Durumu: Active, Pending Payment, Grace Period, Expired, Cancelled
- Sektör: Retail, Wholesale, Manufacturing, Construction, Technology, Healthcare, Education, Hospitality, Transportation, Agriculture, Finance, Real Estate, Professional Services, Other
- Çalışan Sayısı Aralığı: 1-10 ... Above 5000
- Yıllık Gelir Aralığı: Below $100K ... Above $100M
- Tedarik Sıklığı: Daily, Weekly, Bi-Weekly, Monthly, Quarterly, As Needed
- Tercih Edilen Ödeme Koşulları: Immediate, Net 15/30/45/60/90, LC, COD
- Doğrulama Seviyesi: Basic, Standard, Advanced, Premium, Enterprise
- API Erişim Seviyesi: None, Basic, Standard, Advanced, Enterprise

### 4.5 Organization (Organizasyon)

#### 4.5.1 KPI Kartları
- Toplam Organizasyon Sayısı
- Aktif Organizasyon Sayısı
- Doğrulanmış Organizasyon Sayısı
- Toplam Kredi Limiti (sum of credit_limit)
- E-Fatura Kayıtlı Sayı
- E-Arşiv Aktif Sayı
- Onaylı Alıcı Sayısı (is_approved_buyer = 1)
- Onaylı Satıcı Sayısı (is_approved_seller = 1)

#### 4.5.2 Dağılım Grafikleri
- Organizasyon Tipi: Company, Sole Proprietorship, Partnership, LLC, Joint Stock Company, Cooperative, Association, Foundation, Public Institution, Other
- Durum: Pending Verification, Active, Suspended, Blocked, Inactive
- Doğrulama Durumu: Pending, In Review, Documents Requested, Verified, Rejected
- Çalışan Sayısı: 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+
- Yıllık Gelir: Under 1M, 1M-5M, 5M-25M, 25M-100M, 100M-500M, 500M+

### 4.6 KYC Profile

#### 4.6.1 KPI Kartları
- Toplam KYC Profil Sayısı
- Doğrulanmış Profil Sayısı
- Reddedilen Profil Sayısı
- Askıdaki Profil Sayısı
- Ortalama Risk Skoru (avg of risk_score)
- Kimlik Doğrulanmış Sayı (id_verified = 1)
- Adres Doğrulanmış Sayı (address_verified = 1)
- Canlılık Doğrulanmış Sayı (liveness_verified = 1)
- KVKK Onayı Veren Sayı (kvkk_consent_given = 1)

#### 4.6.2 Dağılım Grafikleri
- Profil Tipi: Individual, Sole Proprietor, Freelancer
- Durum: Draft, Pending Review, In Review, Documents Required, Verified, Rejected, Expired, Suspended
- Risk Seviyesi: Not Assessed, Low, Medium, High, Very High
- Kimlik Tipi: National ID, Passport, Driver's License, Residence Permit
- Doğrulama Yöntemi: Manual, Automatic, Hybrid, Third Party
- AML Kontrol Durumu: Not Checked, Pending, Cleared, Hit Found, Manual Review
- PEP Durumu: Unknown, Not PEP, PEP, PEP Relative/Associate
- Yaptırım Durumu: Not Checked, Cleared, Match Found, Pending Review
- Olumsuz Medya Durumu: Not Checked, Cleared, Match Found, Pending Review
- Red Nedeni: Invalid ID Document, Expired Document, Poor Image Quality, Information Mismatch, Fraud Suspected, Underage, Sanctions Match, PEP - High Risk, Incomplete Information, Failed Liveness Check, Other

### 4.7 Tenant (Kiracı/Pazar Yeri)

#### 4.7.1 KPI Kartları
- Toplam Tenant Sayısı
- Aktif Tenant Sayısı
- Ortalama Komisyon Oranı (avg of commission_rate)
- Toplam Max Satıcı (sum of max_sellers)
- Toplam Max Listeleme/Satıcı (sum of max_listings_per_seller)

#### 4.7.2 Dağılım Grafikleri
- Durum: Pending, Active, Suspended, Cancelled
- Abonelik Kademesi: Free, Basic, Professional, Enterprise

---

## 5. ÜRÜN & KATALOG YÖNETİMİ (tradehub_catalog)

### 5.1 PIM Product (Ana Ürün)

#### 5.1.1 KPI Kartları
- Toplam Ürün Sayısı
- Yayınlanan Ürün Sayısı (is_published = 1)
- Onaylanan Ürün Sayısı (status = Approved/Published)
- Taslak Ürün Sayısı (status = Draft)
- Ortalama Baz Fiyat (avg of base_price)
- Ortalama Maliyet Fiyatı (avg of cost_price)
- Ortalama Tamamlanma Skoru (avg of completeness_score)
- Tam Tamamlanmış Ürün Sayısı (completeness_status = Complete/Enriched)
- Numune Mevcut Ürün Sayısı (sample_available = 1)
- Tehlikeli Ürün Sayısı (is_hazardous = 1)
- CE İşaretli Ürün Sayısı (ce_marked = 1)
- RoHS Uyumlu Sayı (rohs_compliant = 1)
- REACH Uyumlu Sayı (reach_compliant = 1)
- ERPNext Senkronize Sayı (sync_to_erpnext = 1)
- Amazon FBA Aktif Sayı (amazon_fba_enabled = 1)
- Ortalama MOQ (avg of moq)
- Ortalama Teslim Süresi (avg of lead_time_days)

#### 5.1.2 Dağılım Grafikleri
- Ürün Durumu: Draft, Pending Review, Approved, Published, Archived, Discontinued, Out of Stock, Hidden
- Tamamlanma Durumu: Incomplete, Partial, Complete, Enriched
- Oluşturma Kaynağı: Manual, Import, API, Migration, Duplicate, Variant Generation
- Tedarik Birimi: Per Day, Per Week, Per Month, Per Quarter, Per Year
- Incoterms: EXW, FCA, CPT, CIP, DAP, DPU, DDP, FAS, FOB, CFR, CIF
- Ambalaj Tipi: Box, Carton, Pallet, Bag, Pouch, Tube, Blister, Clamshell, Bulk, Custom
- Amazon Durum: New, Refurbished, Used conditions...
- eBay Listeleme Tipi: FixedPriceItem, Auction, StoreInventory
- Hepsiburada Durumu: Active, Inactive, Pending, Rejected
- Tehlike Sınıfı: Class 1-9 (Explosives through Miscellaneous)
- Yaş Kısıtlaması: None, 3+, 6+, 12+, 16+, 18+, 21+
- Schema Tipi: Product, Service, SoftwareApplication, Book, Event, Offer

#### 5.1.3 Zaman Serisi
- Ürün Oluşturma Trendi (creation)
- Onaylama Trendi (approved_on)
- Yayınlama Trendi (published_on)
- Son Senkronizasyon Trendi (last_sync)
- Tamamlanma Kontrol Trendi (last_completeness_check)

#### 5.1.4 Göstergeler (Gauge)
- Ortalama Tamamlanma Skoru (0-100%)
- Yayınlama Oranı (Published / Total)
- ERPNext Senkronizasyon Oranı

#### 5.1.5 Çubuk Grafik
- Aile Bazında Ürün Sayısı (product_family)
- Sınıf Bazında Ürün Sayısı (product_class)
- Marka Bazında Ürün Sayısı (brand)
- Kategori Bazında Ürün Sayısı (primary_category)
- Menşe Ülke Bazında Ürün Sayısı (country_of_origin)

#### 5.1.6 Tablo Widget'ları
- İnceleme Bekleyen Ürünler
- Tamamlanması Düşük Ürünler (<50%)
- Fiyatı Olmayan Ürünler
- Görseli Olmayan Ürünler
- ERPNext Senkron Hatası Olan Ürünler
- Yeni Eklenen Ürünler

### 5.2 PIM Product Variant

#### 5.2.1 KPI Kartları
- Toplam Varyant Sayısı
- Aktif Varyant Sayısı (is_active = 1)
- Stokta Olan Sayı (is_in_stock = 1)
- Ortalama Stok Miktarı (avg of stock_qty)
- Ortalama Fiyat (avg of price_override)
- Toplam Stok Değeri
- Ön Sipariş İzni Olan Sayı (backorder_allowed = 1)

#### 5.2.2 Çubuk Grafik
- Ürün Bazında Varyant Sayısı
- Amazon FBA Stok Dağılımı
- Kanal Bazında Fiyat Karşılaştırması

### 5.3 Category (Kategori - Ağaç Yapısı)

#### 5.3.1 KPI Kartları
- Toplam Kategori Sayısı
- Aktif Kategori Sayısı
- Kök Kategori Sayısı
- Ortalama Komisyon Oranı (avg of commission_rate)
- Ortalama Min Komisyon (avg of min_commission)
- Ortalama Max Komisyon (avg of max_commission)

#### 5.3.2 Ağaç Haritası (Treemap)
- Kategori Hiyerarşisi Görselleştirmesi (lft, rgt, parent_category)

#### 5.3.3 Çubuk Grafik
- Kategori Bazında Ürün Sayısı
- Kategori Bazında Komisyon Oranı

### 5.4 Brand (Marka)

#### 5.4.1 KPI Kartları
- Toplam Marka Sayısı
- Aktif Marka Sayısı (enabled = 1)
- Doğrulanmış Marka Sayısı (verification_status = Verified)
- Global Marka Sayısı (is_global = 1)
- Öne Çıkan Marka Sayısı (featured = 1)
- Toplam Ürün Sayısı (sum of product_count)

#### 5.4.2 Dağılım Grafikleri
- Doğrulama Durumu: Pending, Under Review, Verified, Rejected

#### 5.4.3 Çubuk Grafik
- Marka Bazında Ürün Sayısı (Top 20)
- Menşe Ülke Bazında Marka Sayısı

### 5.5 Brand Gating (Marka Yetkilendirme)

#### 5.5.1 KPI Kartları
- Toplam Yetkilendirme Sayısı
- Onaylanan Yetkilendirme Sayısı
- Münhasır Yetkilendirme Sayısı (is_exclusive = 1)
- Ortalama Fiyat Tabanı (avg of price_floor)
- Ortalama Fiyat Tavanı (avg of price_ceiling)
- Buy Box Uygun Satıcı Sayısı (eligible_for_buybox = 1)

#### 5.5.2 Dağılım Grafikleri
- Yetkilendirme Durumu: Pending, Under Review, Approved, Rejected, Suspended, Expired, Revoked
- Yetkilendirme Tipi: Standard Reseller, Authorized Distributor, Exclusive Distributor, Official Partner, Manufacturer Direct
- Ürün Kapsamı: All Products, Specific Categories, Specific Products

### 5.6 Product Class (Ürün Sınıfı)

#### 5.6.1 KPI Kartları
- Toplam Sınıf Sayısı
- Aktif Sınıf Sayısı
- Onay Gerektiren Sınıf Sayısı (require_approval = 1)
- Varyant İzni Olan Sayı (allow_variants = 1)
- Stok Takipli Sayı (require_stock_tracking = 1)
- ERPNext Senkronize Sayı (sync_to_erpnext = 1)
- Ortalama Min Marj Yüzdesi (avg of min_margin_percent)
- Ortalama Max İndirim Yüzdesi (avg of max_discount_percent)

#### 5.6.2 Dağılım Grafikleri
- Fiyatlandırma Stratejisi: Simple, Tiered, Volume, Customer Group, Channel Based, Dynamic
- Fiyat Yuvarlama Kuralı: None, Nearest 0.01...0.05...0.10...0.50...1.00...5.00...10.00, Custom

### 5.7 Product Family (Ürün Ailesi)

#### 5.7.1 KPI Kartları
- Toplam Aile Sayısı
- Aktif Aile Sayısı
- Ortalama Min Görsel Sayısı (avg of min_images)
- Ortalama Max Görsel Sayısı (avg of max_images)

### 5.8 Sales Channel (Satış Kanalı)

#### 5.8.1 KPI Kartları
- Toplam Kanal Sayısı
- Aktif Kanal Sayısı
- Varsayılan Kanal Sayısı

#### 5.8.2 Dağılım Grafikleri
- Kanal Tipi: Marketplace, Webstore, B2B-Portal, Feed, API
- Platform: Amazon, eBay, Alibaba, Trendyol, Hepsiburada, N11, GittiGidiyor, CicekSepeti, Shopify, WooCommerce, Magento, Prestashop, OpenCart, Custom

### 5.9 Media Asset (Medya Varlığı)

#### 5.9.1 KPI Kartları
- Toplam Medya Varlığı Sayısı
- Aktif Varlık Sayısı
- Toplam Dosya Boyutu (sum of file_size)
- Optimize Edilmiş Toplam Boyut (sum of optimized_file_size)
- Optimizasyon Tasarrufu
- CDN Aktif Varlık Sayısı (cdn_enabled = 1)
- Toplam Kullanım Sayısı (sum of usage_count)
- Moderasyon Bekleyen Sayı (moderation_status = Pending)

#### 5.9.2 Dağılım Grafikleri
- Varlık Tipi: Image, Video, Document, 360 View, AR Model
- Durum: Pending, Processing, Active, Failed, Archived, Deleted
- Moderasyon Durumu: Pending, In Review, Approved, Rejected, Flagged
- Depolama Sağlayıcı: Local, AWS S3, Google Cloud Storage, Azure Blob, Backblaze B2
- CDN Sağlayıcı: Cloudflare, AWS CloudFront, Bunny CDN, Fastly, Akamai
- CDN Durumu: Pending, Uploading, Active, Failed, Purged
- Varlık Sahibi Tipi: Listing, Listing Variant, Storefront, Seller Profile, Category, Review, Organization, Banner, Promotion
- Optimizasyon Durumu: Pending, Processing, Completed, Failed, Skipped
- Thumbnail Durumu: Pending, Processing, Generated, Failed

### 5.10 PIM Attribute (PIM Nitelik)

#### 5.10.1 KPI Kartları
- Toplam Nitelik Sayısı
- Aktif Nitelik Sayısı
- Filtrelenebilir Nitelik Sayısı (is_filterable = 1)
- Aranabilir Nitelik Sayısı (is_searchable = 1)
- Varyant İçin Kullanılan Sayı (use_for_variant = 1)
- Amazon Kullanılan Sayı (used_by_amazon = 1)
- eBay Kullanılan Sayı (used_by_ebay = 1)
- Alibaba Kullanılan Sayı (used_by_alibaba = 1)
- Trendyol Kullanılan Sayı (used_by_trendyol = 1)
- Hepsiburada Kullanılan Sayı (used_by_hepsiburada = 1)
- N11 Kullanılan Sayı (used_by_n11 = 1)

#### 5.10.2 Dağılım Grafikleri
- Nitelik Tipi: Text, Long Text, HTML, Int, Float, Currency, Check, Select, Multiselect, Color, Size, Date, Datetime, Link, Image, File, Measurement, URL, JSON, Table, Rating, Percent
- Ölçüm Birimi: mm, cm, m, km, in, ft, yd, mg, g, kg, lb, oz, ml, l, gal, qt, pt, sq_m, sq_ft, cubic_m, cubic_ft

### 5.11 Filter Config (Filtre Yapılandırması)

#### 5.11.1 KPI Kartları
- Toplam Filtre Sayısı
- Aktif Filtre Sayısı
- Toplam Kullanım Sayısı (sum of usage_count)

#### 5.11.2 Dağılım Grafikleri
- Filtre Tipi: Attribute, Price, Brand, Seller, Certificate, Rating, Stock Status, Custom Field
- Filtre Kaynağı: Product Attribute, Product Field, Variant Field, Custom
- Görüntüleme Tipi: Checkbox, Radio Button, Dropdown, Multi-Select Dropdown, Range Slider, Price Range, Color Swatch, Image Swatch, Button Group, Text Search

### 5.12 Ranking Weight Config (Sıralama Ağırlık Yapılandırması)

#### 5.12.1 KPI Kartları
- Toplam Yapılandırma Sayısı
- Aktif Yapılandırma Sayısı
- Ortalama Satış Ağırlığı (avg of sales_weight)
- Ortalama Dönüşüm Ağırlığı (avg of conversion_weight)
- Ortalama Değerlendirme Ağırlığı (avg of rating_weight)
- Ortalama Satıcı Skoru Ağırlığı (avg of seller_score_weight)
- Ortalama Yenilik Ağırlığı (avg of recency_weight)
- Ortalama Stok Ağırlığı (avg of stock_weight)
- Ortalama Öne Çıkan Artışı (avg of featured_boost)
- Ortalama En Çok Satan Artışı (avg of bestseller_boost)
- Ortalama Yeni Gelen Artışı (avg of new_arrival_boost)
- Ortalama İndirim Artışı (avg of sale_boost)
- Stokta Yok Cezası (avg of out_of_stock_penalty)
- Düşük Değerlendirme Cezası (avg of low_rating_penalty)

---

## 6. LOJİSTİK YÖNETİMİ (tradehub_logistics)

### 6.1 Marketplace Shipment (Pazar Yeri Kargosu)

#### 6.1.1 KPI Kartları
- Toplam Kargo Sayısı
- Teslim Edilen Kargo Sayısı (status = Delivered)
- Bekleyen Kargo Sayısı (status = Pending)
- Transit Kargo Sayısı (status = In Transit)
- Başarısız Teslimat Sayısı (status = Failed Delivery)
- İade Kargo Sayısı (is_return = 1)
- Toplam Beyan Değeri (sum of declared_value)
- Toplam Kargo Maliyeti (sum of shipping_cost)
- Toplam Sigorta Maliyeti (sum of insurance_cost)
- Toplam Ek Masraf (sum of additional_charges)
- Toplam Toplam Maliyet (sum of total_cost)
- Toplam Ağırlık (sum of total_weight)
- Toplam Hacimsel Ağırlık (sum of volumetric_weight)
- Ortalama Paket Sayısı (avg of package_count)
- Toplam Teslimat Denemesi (sum of delivery_attempts)
- Kırılacak İçerikli Kargo Sayısı (contains_fragile = 1)
- Tehlikeli Madde İçerikli Sayı (contains_hazmat = 1)
- İmza Gerektiren Sayı (requires_signature = 1)
- Etiket Oluşturulmuş Sayı (label_generated = 1)
- POD Doğrulanmış Sayı (pod_verified = 1)

#### 6.1.2 Dağılım Grafikleri
- Kargo Durumu: Pending, Label Generated, Pickup Scheduled, Picked Up, In Transit, Out for Delivery, Delivered, Failed Delivery, Returning, Returned, Exception, Cancelled
- Kargo Tipi: Standard, Express, Same Day, Next Day, Economy, International
- Kargo Firması: Yurtici Kargo, Aras Kargo, MNG Kargo, SuratKargo, PTT Kargo, UPS, DHL, FedEx, Trendyol Express, HepsiJet, Other
- Teslimat Durumu: Pending, Attempted, Delivered, Failed, Refused, Returning, Returned
- Etiket Formatı: PDF, ZPL, PNG, GIF
- Ağırlık Birimi: kg, lb, g
- Boyut Birimi: cm, in, m

#### 6.1.3 Zaman Serisi
- Günlük Kargo Oluşturma Trendi (created_at)
- Teslim Alma Trendi (picked_up_at)
- Transit Başlangıç Trendi (in_transit_at)
- Dağıtıma Çıkma Trendi (out_for_delivery_at)
- Teslim Trendi (delivered_at)
- İstisna Trendi (exception_at)
- Son Senkronizasyon Trendi (last_sync_at)

#### 6.1.4 Çubuk Grafik
- Kargo Firması Bazında Kargo Sayısı
- Kargo Firması Bazında Toplam Maliyet
- Kargo Tipi Bazında Sayı
- Varış Ülkesi Bazında Kargo Sayısı
- Satıcı Bazında Kargo Sayısı

#### 6.1.5 Harita Widget'ları
- Çıkış ve Varış Ülke Haritası (origin_country, destination_country)
- Aktif Kargo Konumları

#### 6.1.6 Gantt Grafik
- Kargo Yaşam Döngüsü: Created → Picked Up → In Transit → Out for Delivery → Delivered

#### 6.1.7 Tablo Widget'ları
- Bekleyen Kargolar
- Transit Kargolar
- Başarısız Teslimatlar
- İstisna Durumundaki Kargolar
- İade Kargoları
- Bugün Teslim Edilecek Kargolar
- Geciken Kargolar (expected vs actual delivery)

### 6.2 Shipment (Genel Kargo - B2B)

#### 6.2.1 KPI Kartları
- Toplam Kargo Sayısı
- Toplam Sipariş Değeri (sum of order_total)
- Toplam Kargo Maliyeti (sum of total_shipping_cost)
- Toplam Sigorta Değeri (sum of insurance_value)
- Toplam Gümrük Değeri (sum of customs_value)
- Toplam Gümrük Vergisi (sum of customs_duty_amount + customs_tax_amount)
- Ortalama Toplam Ağırlık (avg of total_weight)
- Ortalama Toplam Hacim (avg of total_volume)
- Gümrük Gerektiren Kargo Sayısı (requires_customs = 1)
- Sigortalı Kargo Sayısı (is_insured = 1)
- Tehlikeli Kargo Sayısı (is_hazardous = 1)
- İstisna Durumlu Kargo Sayısı (has_exception = 1)

#### 6.2.2 Dağılım Grafikleri
- Kargo Durumu: Draft, Pending Pickup, Picked Up, In Transit, At Customs, Customs Cleared, Out for Delivery, Delivered, Exception, Returned, Cancelled
- Kargo Tipi: Standard, Express, Overnight, Economy, Freight, Sea Freight, Air Freight, Rail Freight
- Öncelik: Low, Normal, High, Urgent
- Kargo Yöntemi: Air, Sea, Road, Rail, Courier, Multi-Modal
- Gümrük Durumu: Not Required, Pending, In Progress, Cleared, Held, Rejected
- Incoterm: EXW, FOB, CIF, DDP, DAP, FCA, CPT, CIP, DAT, DPU

#### 6.2.3 Zaman Serisi
- Kargo Oluşturma Trendi (shipment_date)
- Teslim Trendi (actual_delivery_date)
- Gümrük İşlem Trendi (customs_clearance_date)
- Son Takip Güncelleme Trendi (last_tracking_update)

### 6.3 Tracking Event (Takip Olayı)

#### 6.3.1 KPI Kartları
- Toplam Takip Olayı Sayısı
- Kilometre Taşı Olay Sayısı (is_milestone = 1)
- İstisna Olay Sayısı (is_exception = 1)
- Bildirim Gönderilen Sayı (notification_sent = 1)

#### 6.3.2 Dağılım Grafikleri
- Kargo Firması: Yurtici, Aras, MNG, Surat, PTT, UPS, DHL, FedEx, Trendyol Express, HepsiJet, Other
- Olay Durumu: Pending, Label Created, Picked Up, In Transit, At Hub, At Customs, Out for Delivery, Delivered, Exception, Returned (14 seçenek)
- Olay Tipi: 40+ detaylı takip olay tipi
- Önem Derecesi: Info, Warning, Error, Critical
- İstisna Tipi: 19 farklı istisna
- Kaynak: Carrier API, Manual Entry, Webhook, Import, Scraping, Third Party API, System

#### 6.3.3 Zaman Serisi
- Olay Sayısı Trendi (event_timestamp)
- İstisna Trendi
- Kargo Firması Bazında Olay Trendi
- Bildirim Gönderme Trendi

### 6.4 Logistics Provider (Lojistik Sağlayıcı)

#### 6.4.1 KPI Kartları
- Toplam Sağlayıcı Sayısı
- Aktif Sağlayıcı Sayısı
- Ortalama Zamanında Teslimat Oranı (avg of on_time_delivery_rate)
- Ortalama Hasar Oranı (avg of damage_rate)
- Ortalama Teslimat Günü (avg of average_delivery_days)
- Toplam Kargo Sayısı (sum of total_shipments)
- Toplam Sorun Sayısı (sum of total_issues)
- API Aktif Sağlayıcı Sayısı (api_enabled = 1)
- Takip Destekleyen Sayı (supports_tracking = 1)
- Ekspres Destekleyen Sayı (supports_express = 1)
- Aynı Gün Destekleyen Sayı (supports_same_day = 1)
- Kapıda Ödeme Destekleyen Sayı (supports_cod = 1)

#### 6.4.2 Dağılım Grafikleri
- Sağlayıcı Tipi: Carrier, Courier, Freight, Post, Dropship, Fulfillment, Last Mile
- Durum: Active, Inactive, Suspended, Testing
- Hizmet Tipi: Domestic Only, International Only, Both
- Ücret Hesaplama: Weight Based, Volumetric, Higher of Weight/Volume, Flat Rate, Distance Based, API Based
- Etiket Formatı: PDF, ZPL, PNG, EPL, DPL

### 6.5 Carrier (Taşıyıcı)

#### 6.5.1 KPI Kartları
- Toplam Taşıyıcı Sayısı
- Aktif Taşıyıcı Sayısı
- Toplam Kargo Sayısı (sum of shipment_count)
- Ortalama Transit Günü (avg of default_transit_days)
- API Entegre Taşıyıcı Sayısı (has_api_integration = 1)
- Öne Çıkan Taşıyıcı Sayısı (featured = 1)

#### 6.5.2 Dağılım Grafikleri
- Taşıyıcı Tipi: Courier, Freight, Postal, Express, Specialized, Local Delivery, Other
- API Durumu: Unknown, Online, Offline, Error, Maintenance
- API Ortamı: Sandbox, Production

### 6.6 Shipping Rule (Kargo Kuralı)

#### 6.6.1 KPI Kartları
- Toplam Kural Sayısı
- Aktif Kural Sayısı
- Ortalama Baz Ücret (avg of base_rate)
- Ortalama Ücretsiz Kargo Eşiği (avg of free_shipping_threshold)
- Ekspres Mevcut Sayı (express_available = 1)
- Ücretsiz Kargo Aktif Sayı (free_shipping_enabled = 1)

#### 6.6.2 Dağılım Grafikleri
- Kural Tipi: Standard, Flat Rate, Weight Based, Price Based, Item Based, Free Shipping, Local Pickup, Express
- Hesaplama Yöntemi: Fixed, Weight Based, Price Percentage, Item Count, Weight Tiered, Price Tiered, Combined

---

## 7. UYUMLULUK & GÜVENLİK (tradehub_compliance)

### 7.1 Review (Değerlendirme/Yorum)

#### 7.1.1 KPI Kartları
- Toplam Yorum Sayısı
- Yayınlanan Yorum Sayısı (status = Published)
- Bekleyen Yorum Sayısı (status = Pending Review)
- Ortalama Genel Değerlendirme (avg of rating)
- Ortalama Ürün Kalitesi Değerlendirmesi (avg of product_quality_rating)
- Ortalama Fiyat/Performans Değerlendirmesi (avg of value_for_money_rating)
- Ortalama Kargo Değerlendirmesi (avg of shipping_rating)
- Ortalama Satıcı İletişimi Değerlendirmesi (avg of seller_communication_rating)
- Ortalama Doğruluk Değerlendirmesi (avg of accuracy_rating)
- Ortalama Faydalılık Skoru (avg of helpfulness_score)
- Toplam Faydalı Oy (sum of helpful_count)
- Toplam Faydasız Oy (sum of unhelpful_count)
- Toplam Rapor (sum of report_count)
- Doğrulanmış Alım Yorum Sayısı (is_verified_purchase = 1)
- Anonim Yorum Sayısı (is_anonymous = 1)
- Öne Çıkan Yorum Sayısı (is_featured = 1)
- Satıcı Yanıtı Olan Sayı (has_seller_response = 1)

#### 7.1.2 Dağılım Grafikleri
- Yorum Durumu: Draft, Pending Review, Published, Rejected, Hidden, Removed
- Yorum Tipi: Product, Seller, Order Experience
- Yorumcu Tipi: Individual, Business, Organization
- Moderasyon Durumu: Pending, Approved, Rejected, Flagged, Under Review
- Red Nedeni: Spam, Inappropriate Content, Fake Review, Off-topic, Violates Guidelines, Seller Manipulation, Conflict of Interest, Other

#### 7.1.3 Zaman Serisi
- Günlük Yorum Trendi (submitted_at)
- Yayınlama Trendi (published_at)
- Moderasyon Trendi (moderated_at)
- Satıcı Yanıt Trendi (seller_response_at)

#### 7.1.4 Histogram
- Değerlendirme Dağılımı (1-5 yıldız)
- Kategori Bazında Değerlendirme Dağılımı (product_quality, value_for_money, shipping, communication, accuracy)

#### 7.1.5 Çubuk Grafik
- Satıcı Bazında Ortalama Değerlendirme (Top/Bottom 20)
- Listeleme Bazında Ortalama Değerlendirme
- Kategori Bazında Ortalama Değerlendirme

#### 7.1.6 Tablo Widget'ları
- Moderasyon Bekleyen Yorumlar
- En Faydalı Yorumlar
- Raporlanan Yorumlar
- Satıcı Yanıtı Bekleyen Yorumlar
- En Düşük Değerlendirmeli Ürünler
- En Yüksek Değerlendirmeli Ürünler

### 7.2 Moderation Case (Moderasyon Vakası)

#### 7.2.1 KPI Kartları
- Toplam Vaka Sayısı
- Açık Vaka Sayısı (status = Open)
- İnceleme Altında Sayı (status = In Review)
- Çözülmüş Vaka Sayısı (status = Resolved)
- Tırmanmış Vaka Sayısı (is_escalated = 1)
- İtiraz Edilen Vaka Sayısı (appeal_status != Not Appealed)
- Otomatik Tespit Edilen Sayı (is_auto_detected = 1)
- Tekrar Suç Sayısı (is_repeat_offense = 1)
- Ortalama Bekleme Süresi (avg of wait_time_hours) saat
- Ortalama Çözüm Süresi (avg of resolution_time_hours) saat
- Ortalama İnceleme Süresi (avg of review_time_seconds) saniye
- Ortalama Tespit Güveni (avg of detection_confidence)
- SLA İhlali Sayısı (sla_status = Breached)

#### 7.2.2 Dağılım Grafikleri
- Vaka Tipi: Content Report, Content Review, Appeal Review, Proactive Review, Quality Audit, Compliance Check, IP Infringement, Counterfeit Report, Safety Concern, Legal Request
- Öncelik: Critical, High, Medium, Low
- Durum: Open, Assigned, In Review, Pending Info, Escalated, Resolved, Closed, Appealed, Reopened
- Rapor Kaynağı: User Report, Seller Report, Auto Detection, Admin Review, External Report, Legal Request, Government Request, Brand Protection, QA Audit
- Raportör Tipi: Buyer, Seller, Competitor, Brand Owner, General Public, Employee, Partner
- Rapor Nedeni: Prohibited Content, Counterfeit Product, IP Violation, Misleading Information, Fraud/Scam, Inappropriate Content, Harassment, Spam, Price Manipulation, Fake Reviews, Policy Violation, Safety Concern, Legal Issue, Privacy Violation, Hate Speech, Violent Content, Adult Content, Other
- Rapor Kategorisi: Product Listing, Product Image, Product Description, Review, Seller Profile, Storefront, Message, User Profile, Other
- İhlal Tipi: No Violation, Minor, Moderate, Severe, Critical
- İhlal Edilen Politika: Community Guidelines, Prohibited Items Policy, IP Policy, Counterfeit Policy, Listing Standards, Review Guidelines, Seller Conduct Policy, Anti-Fraud Policy, Price Policy, Content Policy, Privacy Policy, Safety Policy, Terms of Service, Local Laws, Multiple Policies
- Tespit Yöntemi: Image Recognition, Text Analysis, ML Classification, Keyword Filter, Pattern Matching, Behavior Analysis, External API, Hash Matching, Price Anomaly, Duplicate Detection
- Karar: Approved, Rejected, Removed, Edits Required, Warning Issued, Account Action, No Action Needed, Escalate, Pending Legal
- Alınan Aksiyon: None, Content Removed, Content Hidden, Content Edited, Content Flagged, Warning Sent, Account Warning, Account Restriction, Account Suspension, Account Ban, Listing Delisted, Listing Modified, Review Rejected, Multiple Actions
- İtiraz Durumu: Not Appealed, Appeal Submitted, Under Review, Approved, Rejected, Partially Approved
- Tırmanma Seviyesi: Level 1 - Team Lead, Level 2 - Senior Moderator, Level 3 - Manager, Level 4 - Legal, Level 5 - Executive
- SLA Durumu: On Track, At Risk, Breached, Exempt

#### 7.2.3 Zaman Serisi
- Vaka Oluşturma Trendi (creation_date)
- Atama Trendi (assigned_at)
- İnceleme Başlama Trendi (review_started_at)
- İnceleme Tamamlama Trendi (review_completed_at)
- İtiraz Trendi (appeal_submitted_at)
- İtiraz Karar Trendi (appeal_decided_at)
- Tırmanma Trendi (escalated_at)

#### 7.2.4 Huni Grafik
- Moderasyon Hunisi: Open → Assigned → In Review → Resolved/Closed
- İtiraz Hunisi: Appeal Submitted → Under Review → Approved/Rejected

#### 7.2.5 Tablo Widget'ları
- Acil Vakalar (priority = Critical)
- Atanmamış Vakalar
- SLA İhlali Riski Olan Vakalar
- İtiraz Bekleyen Vakalar
- Tırmanmış Vakalar
- En Çok Vaka Olan Satıcılar

### 7.3 Risk Score (Risk Skoru)

#### 7.3.1 KPI Kartları
- Toplam Risk Profili Sayısı
- Aktif Profil Sayısı
- Ortalama Risk Skoru (avg of risk_score)
- Yüksek Riskli Profil Sayısı (risk_level = High/Very High/Critical)
- Düşük Riskli Profil Sayısı (risk_level = Low/Very Low)
- Toplam Kredi Limiti (sum of credit_limit)
- Ortalama Pozitif Faktör (avg of positive_factors_count)
- Ortalama Negatif Faktör (avg of negative_factors_count)
- Kritik Faktör Sayısı (sum of critical_factors_count)
- Uyarı Sayısı (sum of alert_count)
- Otomatik Onay Sayısı (credit_decision = Auto Approve)
- Red Sayısı (credit_decision = Reject)
- Askıya Alma Sayısı (credit_decision = Suspend)

#### 7.3.2 Dağılım Grafikleri
- Profil Tipi: Seller, Buyer
- Durum: Draft, Active, Expired, Suspended, Under Review
- Risk Seviyesi: Very Low, Low, Medium, High, Very High, Critical
- Risk Kategorisi: Financial, Fraud, Compliance, Operational, Credit, Reputation, Identity, Transaction, Mixed
- Skor Trendi: Improving, Stable, Worsening
- Güven Seviyesi: Very Low, Low, Medium, High, Very High
- Kredi Kararı: Auto Approve, Approve, Approve with Conditions, Review, Review with Caution, Reject, Suspend
- İnceleme Sıklığı: Weekly, Bi-Weekly, Monthly, Quarterly, Semi-Annually, Annually, On Event

#### 7.3.3 Göstergeler (Gauge)
- Platform Ortalama Risk Skoru (0-100)
- Yüksek Risk Oranı
- Otomatik Onay Oranı

#### 7.3.4 Isı Haritası
- Satıcı x Risk Kategorisi Isı Haritası
- Zaman x Risk Seviyesi Isı Haritası

### 7.4 Certificate (Sertifika)

#### 7.4.1 KPI Kartları
- Toplam Sertifika Sayısı
- Aktif Sertifika Sayısı (status = Active)
- Doğrulanmış Sertifika Sayısı (verification_status = Verified)
- Süresi Yaklaşan Sertifika Sayısı (expiry_status = Expiring Soon)
- Süresi Geçmiş Sertifika Sayısı (expiry_status = Expired)
- Yenileme Gerektiren Sayı (requires_renewal = 1)
- Yenileme Hatırlatıcısı Gönderilen Sayı (renewal_reminder_sent = 1)
- Ortalama Süre Sonu Günü (avg of days_until_expiry)

#### 7.4.2 Dağılım Grafikleri
- Sertifika Durumu: Pending Verification, Under Review, Verified, Rejected, Active, Expired, Suspended, Revoked
- Süre Sonu Durumu: Valid, Expiring Soon, Expired, No Expiry
- Doğrulama Durumu: Pending, In Progress, Verified, Failed, Not Applicable

#### 7.4.3 Zaman Serisi
- Sertifika Verme Trendi (issue_date)
- Süre Sonu Trendi (expiry_date)
- Doğrulama Trendi (verification_date)

### 7.5 Certificate Type (Sertifika Tipi)

#### 7.5.1 KPI Kartları
- Toplam Sertifika Tipi Sayısı
- Zorunlu Sertifika Sayısı (is_mandatory = 1)
- Fiziksel Denetim Gerektiren Sayı (requires_physical_audit = 1)
- Toplam Sertifika Sayısı (sum of certificate_count)

#### 7.5.2 Dağılım Grafikleri
- Sertifika Kategorisi: Compliance, Quality, Environmental, Social, Safety, Organic, Sustainability, Industry Specific, Other
- Uygulanabilirlik: Product, Seller, Both

### 7.6 Consent Record (Onay Kaydı)

#### 7.6.1 KPI Kartları
- Toplam Onay Kaydı Sayısı
- Aktif Onay Sayısı (status = Active)
- İptal Edilen Onay Sayısı (status = Revoked)
- Süresi Geçmiş Onay Sayısı (status = Expired)
- Doğrulanmış Onay Sayısı (is_verified = 1)
- Çift Onay Tamamlanan Sayı (double_opt_in_completed = 1)

#### 7.6.2 Dağılım Grafikleri
- Onay Durumu: Pending, Active, Revoked, Expired
- Doğrulama Yöntemi: Email Link, SMS Code, Phone Call, Manual

### 7.7 Marketplace Consent Record

#### 7.7.1 KPI Kartları
- Toplam Pazar Yeri Onay Sayısı
- Aktif Onay Sayısı
- İptal Edilen Onay Sayısı
- Doğrulanmış Onay Sayısı
- Veri Silme Talebi Olan Sayı (data_deletion_requested = 1)
- Üçüncü Taraf İçeren Sayı (involves_third_party = 1)
- Otomatik Yenileme Aktif Sayı (auto_renew = 1)

#### 7.7.2 Dağılım Grafikleri
- Onay Tipi: Data Processing, Marketing Communications, Third Party Sharing, International Transfer, Profiling, Automated Decision Making, Cookies, Analytics, Newsletter, SMS/Push/Email Notifications, Phone Calls, Location Tracking, Biometric Data, Health Data, Financial Data, KYC Verification, Payment Processing, Other
- Durum: Pending Verification, Active, Withdrawn, Expired, Superseded, Invalid
- Hukuki Dayanak: Consent, Contract Performance, Legal Obligation, Vital Interests, Public Interest, Legitimate Interest
- Veriliş Yolu: Web Form, Mobile App, API, Checkbox, Verbal, Written Document, Email/SMS Confirmation, Double Opt-in, Implicit, Other
- Doğrulama Yöntemi: Email Link, SMS Code, Phone Call, Manual Review, Automatic, Not Required
- Transfer Güvenceleri: Adequacy Decision, Standard Contractual Clauses, Binding Corporate Rules, Explicit Consent, etc.

### 7.8 Contract Template & Instance

#### 7.8.1 KPI Kartları
- Toplam Sözleşme Şablonu Sayısı
- Yayınlanan Şablon Sayısı
- Toplam Sözleşme Örneği Sayısı
- İmzalanan Sözleşme Sayısı (status = Signed)
- Bekleyen İmza Sayısı (status = Pending Signature)
- Reddedilen Sözleşme Sayısı (status = Rejected)
- Süresi Geçmiş Sözleşme Sayısı (status = Expired)

#### 7.8.2 Dağılım Grafikleri (Template)
- Şablon Durumu: Draft, Published, Archived
- Sözleşme Tipi: Terms of Service, Privacy Policy, Seller Agreement, Buyer Agreement, NDA, Partnership Agreement, Other
- İmza Yöntemi: Any, Digital Only, Wet Only

#### 7.8.3 Dağılım Grafikleri (Instance)
- Örnek Durumu: Draft, Sent, Pending Signature, Signed, Rejected, Expired
- İmza Yöntemi: Digital, Wet

#### 7.8.4 Zaman Serisi
- Sözleşme Oluşturma Trendi (created_at)
- Gönderme Trendi (sent_at)
- İmzalama Trendi (signed_at)

### 7.9 Contract Rule (Sözleşme Kuralı)

#### 7.9.1 KPI Kartları
- Toplam Kural Sayısı
- Aktif Kural Sayısı
- Engelleme Aksiyonlu Kural Sayısı (blocking_action = 1)
- Toplam Tetikleme Sayısı (sum of trigger_count)
- Toplam Kabul Sayısı (sum of acceptance_count)
- Toplam Red Sayısı (sum of rejection_count)

#### 7.9.2 Dağılım Grafikleri
- Durum: Active, Inactive, Draft, Archived
- Tetikleme Noktası: Registration, First Order, First Sale, Profile Update, Subscription Change, Level Upgrade, Verification Complete, Document Upload, Payment Method Add, Manual
- Uygulama Hedefi: All Users, Sellers Only, Buyers Only, Specific User Type, Specific Level
- Eşleşme Tipi: All, Any

### 7.10 Moderation (Hesap Aksiyonu - Account Action)

#### 7.10.1 KPI Kartları
- Toplam Aksiyon Sayısı
- Aktif Aksiyon Sayısı (status = Active)
- Kalıcı Aksiyon Sayısı (is_permanent = 1)
- İtiraz Edilebilir Aksiyon Sayısı (is_appealable = 1)
- Tırmanmış Aksiyon Sayısı (escalation_level > 1)
- Satış Kısıtlamalı Sayı (restrict_selling = 1)
- Alım Kısıtlamalı Sayı (restrict_buying = 1)
- Mesaj Kısıtlamalı Sayı (restrict_messaging = 1)
- Yorum Kısıtlamalı Sayı (restrict_reviews = 1)
- Tüm Aktivite Kısıtlamalı Sayı (restrict_all_activity = 1)

#### 7.10.2 Dağılım Grafikleri
- Aksiyon Tipi: Warning, Restriction, Suspension, Temporary Ban, Permanent Ban, Account Termination, Probation, Fine, Commission Increase, Feature Limitation
- Önem Derecesi: Low, Medium, High, Critical
- Durum: Draft, Pending Approval, Active, Expired, Lifted, Appealed, Overturned, Escalated, Cancelled
- Hedef Tipi: User, Seller Profile, Organization
- Neden Kodu: Policy Violation, Fraud, Counterfeit Products, IP Violation, Prohibited Items, Misleading Information, Poor Service Quality, Late Delivery, Order Cancellation Abuse, Review Manipulation, Payment Issues, Identity Fraud, Spam, Harassment, Security Breach, KYC Failure, AML Violation, Tax Compliance, Dispute Abuse, Refund Abuse, Other
- İhlal Tipi: First Offense, Repeat Offense, Escalated Offense, Severe Violation, Pattern Violation
- İtiraz Durumu: Not Appealed, Appeal Submitted, Under Review, Approved, Rejected, Partially Approved

### 7.11 Message & Message Thread (Mesajlaşma)

#### 7.11.1 KPI Kartları
- Toplam Mesaj Sayısı
- Toplam Mesaj Konusu Sayısı
- Aktif Konu Sayısı
- Okunmamış Mesaj Sayısı (sum of unread_count)
- Toplam Mesaj Sayısı (sum of message_count)
- Gönderilen Mesaj Sayısı (status = Sent)
- Teslim Edilen Mesaj Sayısı (status = Delivered)
- Okunan Mesaj Sayısı (status = Read)
- Başarısız Mesaj Sayısı (status = Failed)
- Ek İçeren Mesaj Sayısı (has_attachments = 1)
- Sistem Mesajı Sayısı (is_system_message = 1)
- İşaretlenmiş Mesaj Sayısı (is_flagged = 1)

#### 7.11.2 Dağılım Grafikleri
- Mesaj Tipi: Text, Rich Text, System Notification, Auto Reply, Quotation Response, RFQ Response, Order Update, Shipping Update
- Mesaj Durumu: Draft, Sent, Delivered, Read, Failed
- Gönderen Tipi: Buyer, Seller, System, Support
- Konu Durumu: Active, Pending, Closed, Archived
- Konu Tipi: General, RFQ Discussion, Order Inquiry, Sample Discussion, Quotation Discussion, Support, Negotiation, Complaint, Feedback
- Öncelik: Low, Normal, High, Urgent
- Başlatıcı Tipi: Buyer, Seller, System

#### 7.11.3 Zaman Serisi
- Günlük Mesaj Trendi (sent_at)
- Konu Oluşturma Trendi
- Son Mesaj Trendi (last_message_date)

### 7.12 Sample Request (Numune Talebi)

#### 7.12.1 KPI Kartları
- Toplam Numune Talebi Sayısı
- Onaylanan Talep Sayısı
- Teslim Edilen Sayı
- Tamamlanan Sayı
- Toplam Numune Maliyeti (sum of total_cost)
- Toplam Kargo Maliyeti (sum of shipping_cost)
- Ortalama Kalite Değerlendirmesi (avg of quality_rating)
- Siparişe Çevrilen Numune Sayısı (credit_to_order = 1)

#### 7.12.2 Dağılım Grafikleri
- Durum: Requested, Under Review, Approved, Rejected, In Production, Ready to Ship, Shipped, Delivered, Completed, Cancelled
- Numune Tipi: Standard, Custom, Prototype, Pre-production
- Öncelik: Low, Normal, High, Urgent
- Ödeme Durumu: Pending, Paid, Refunded, Waived
- Ödeme Yöntemi: Bank Transfer, Credit Card, PayPal, Other
- Kargo Yöntemi: Standard, Express, Overnight, Pick Up
- Onay Kararı: Approved for Production, Requires Modifications, Rejected

### 7.13 ESign Transaction (E-İmza İşlemi)

#### 7.13.1 KPI Kartları
- Toplam E-İmza İşlem Sayısı
- Tamamlanan İşlem Sayısı (status = Completed)
- Bekleyen İşlem Sayısı (status = Pending)
- Başarısız İşlem Sayısı (status = Failed)

#### 7.13.2 Dağılım Grafikleri
- Durum: Initiated, Pending, Completed, Rejected, Expired, Failed

---

## 8. PAZARLAMA YÖNETİMİ (tradehub_marketing)

### 8.1 Campaign (Kampanya)

#### 8.1.1 KPI Kartları
- Toplam Kampanya Sayısı
- Aktif Kampanya Sayısı (status = Active)
- Planlanmış Kampanya Sayısı (status = Scheduled)
- Toplam Bütçe (sum of total_budget)
- Harcanan Tutar (sum of spent_amount)
- Kalan Bütçe (sum of remaining_budget)
- Toplam Gelir (sum of revenue_generated)
- Bütçe Kullanım Oranı (spent / budget)
- ROI (revenue / spent)
- Toplam Kullanım (sum of total_usage)
- Toplam Benzersiz Kullanıcı (sum of unique_users)
- Toplam Görüntülenme (sum of views_count)
- Toplam Tıklama (sum of clicks_count)
- Toplam Sipariş (sum of orders_count)
- Tıklama/Görüntülenme Oranı (CTR)
- Sipariş/Tıklama Oranı (Conversion Rate)
- Ortalama İndirim Değeri (avg of discount_value)
- Ortalama Max İndirim Tutarı (avg of max_discount_amount)
- Ortalama Min Sipariş Tutarı (avg of min_order_amount)
- Öne Çıkan Kampanya Sayısı (is_featured = 1)
- Otomatik Kupon Oluşturan Kampanya (auto_generate_coupon = 1)

#### 8.1.2 Dağılım Grafikleri
- Kampanya Tipi: Discount, Flash Sale, Seasonal, Clearance, Buy X Get Y, Free Shipping, Bundle Deal, Loyalty, Referral, New Customer, Holiday, Other
- Durum: Draft, Scheduled, Active, Paused, Ended, Cancelled
- İndirim Tipi: Percentage, Fixed Amount, Free Shipping, Buy X Get Y, Bundle Price, No Discount
- Uygulama Hedefi: All Products, Specific Categories, Specific Sellers, Specific Products
- Hedef Kitle: All Customers, New Customers, Returning Customers, VIP Customers, Inactive Customers, Specific Levels

#### 8.1.3 Zaman Serisi
- Kampanya Başlangıç Trendi (start_date)
- Kampanya Bitiş Trendi (end_date)
- Kullanım Trendi
- Gelir Trendi

#### 8.1.4 Göstergeler (Gauge)
- Bütçe Kullanım Oranı (0-100%)
- ROI Göstergesi
- Dönüşüm Oranı

### 8.2 Coupon (Kupon)

#### 8.2.1 KPI Kartları
- Toplam Kupon Sayısı
- Aktif Kupon Sayısı (status = Active)
- Süresi Geçmiş Kupon Sayısı (status = Expired)
- Tükenmiş Kupon Sayısı (status = Used Up)
- Toplam Kullanım (sum of used_count)
- Toplam Kullanım Limiti (sum of usage_limit)
- Kullanım Oranı (used / limit)
- Ortalama İndirim Değeri (avg of discount_value)
- Ortalama Max İndirim Tutarı (avg of max_discount_amount)
- Ortalama Min Sipariş Tutarı (avg of min_order_amount)
- Birleştirilebilir Kupon Sayısı (stackable = 1)
- Yeni Müşteriye Özel Kupon Sayısı (new_customers_only = 1)

#### 8.2.2 Dağılım Grafikleri
- Kupon Durumu: Draft, Active, Expired, Used Up, Deactivated
- İndirim Tipi: Percentage, Fixed Amount, Free Shipping, Buy X Get Y
- Uygulama Hedefi: All Products, Specific Categories, Specific Products

#### 8.2.3 Zaman Serisi
- Kupon Oluşturma Trendi
- Geçerlilik Başlangıç/Bitiş Trendi (valid_from, valid_until)
- Kullanım Trendi

### 8.3 Group Buy (Grup Alım)

#### 8.3.1 KPI Kartları
- Toplam Grup Alım Sayısı
- Aktif Grup Alım Sayısı (status = Active)
- Finanse Edilen Sayı (status = Funded)
- Tamamlanan Sayı (status = Completed)
- Süresi Geçmiş Sayı (status = Expired)
- Toplam Hedef Miktar (sum of target_quantity)
- Toplam Mevcut Miktar (sum of current_quantity)
- Hedef Ulaşma Oranı (current / target)
- Toplam Katılımcı (sum of participant_count)
- Toplam Taahhüt Tutarı (sum of total_commitment_amount)
- Ortalama Fiyat (avg of current_price)
- En İyi Fiyat (min of best_price)
- Ortalama Görüntülenme (avg of view_count)
- Öne Çıkan Sayı (is_featured = 1)
- Doğrulanmış Sayı (is_verified = 1)

#### 8.3.2 Dağılım Grafikleri
- Durum: Draft, Pending Approval, Scheduled, Active, Funded, Completed, Expired, Cancelled
- Grup Alım Tipi: Standard, Flash, Pre-Order, Bulk
- Dönem Tipi: Fixed, Open-Ended, Target-Based
- Kargo Tipi: Seller Ships, Platform Ships, Buyer Pickup
- Görünürlük: Public, Private, Invite Only

#### 8.3.3 Zaman Serisi
- Grup Alım Oluşturma Trendi (created_at)
- Finanse Edilme Trendi (funded_at)
- Tamamlanma Trendi (completed_at)
- Başlangıç/Bitiş Trendi (start_date, end_date)

#### 8.3.4 Göstergeler
- Ortalama Hedef Ulaşma Oranı (0-100%)
- Aktif/Toplam Oranı
- Başarı Oranı (Completed / Total)

### 8.4 Group Buy Commitment & Payment

#### 8.4.1 KPI Kartları
- Toplam Taahhüt Sayısı
- Aktif Taahhüt Sayısı
- Ödeme Yapılmış Taahhüt Sayısı
- İptal Edilen Taahhüt Sayısı
- Toplam Taahhüt Tutarı (sum of total_amount)
- Toplam İade Tutarı (sum of refund_amount)
- Toplam Ödeme Sayısı
- Tamamlanan Ödeme Sayısı
- Toplam Ödeme Tutarı (sum of amount)
- Toplam Platform Ücreti (sum of platform_fee)
- Toplam Net Tutar (sum of net_amount)

#### 8.4.2 Dağılım Grafikleri
- Taahhüt Durumu: Active, Payment Pending, Paid, Cancelled, Refunded, Expired
- Ödeme Durumu: Pending, Processing, Completed, Failed, Refunded, Partially Refunded, Cancelled
- Ödeme Yöntemi: Credit Card, Debit Card, Bank Transfer, Digital Wallet, Cash on Delivery, Other
- İade Durumu: None, Requested, Processing, Completed, Failed

### 8.5 Subscription & Subscription Package (Abonelik)

#### 8.5.1 KPI Kartları
- Toplam Abonelik Sayısı
- Aktif Abonelik Sayısı (status = Active)
- Deneme Sürümündeki Sayı (status = Trial)
- Askıda Olan Sayı (status = Suspended/Grace Period)
- İptal Edilen Sayı (status = Cancelled)
- Toplam Faturalanan (sum of total_billed)
- Toplam Ödenen (sum of total_paid)
- Toplam Bakiye (sum of outstanding_amount)
- Ortalama Mevcut Fiyat (avg of current_price)
- Ortalama Ürün Limiti (avg of max_products)
- Toplam Mevcut Ürün Sayısı (sum of current_product_count)
- Otomatik Yenileme Aktif Sayı (auto_renew = 1)
- Toplam Başarısız Yenileme Denemesi (sum of failed_renewal_attempts)
- Toplam Yeniden Aktivasyon (sum of reactivation_count)

#### 8.5.2 Dağılım Grafikleri
- Abonelik Durumu: Draft, Trial, Active, Pending Payment, Grace Period, Suspended, Cancelled, Expired
- Abone Tipi: Seller, Buyer, Organization
- Askıya Alma Tipi: Payment Overdue, Manual, Policy Violation, Fraud, Other

#### 8.5.3 Paket KPI
- Toplam Paket Sayısı
- Aktif Paket Sayısı
- Toplam Abone Sayısı (sum of subscriber_count)
- Aktif Abone Sayısı (sum of active_subscriber_count)
- Toplam Gelir (sum of total_revenue)
- Ortalama Fiyat (avg of price)
- Ortalama Komisyon Oranı (avg of commission_rate)

#### 8.5.4 Paket Dağılım
- Paket Durumu: Active, Inactive, Deprecated
- Faturalama Dönemi: Monthly, Quarterly, Semi-Annual, Annual, Lifetime
- Hedef Kitle: Small Business, Medium Business, Enterprise, Individual Sellers

#### 8.5.5 Zaman Serisi
- Yeni Abonelik Trendi (start_date)
- İptal Trendi (cancellation_date)
- Yenileme Trendi
- Gelir Trendi (total_revenue by month)

### 8.6 Wholesale Offer (Toptan Teklif)

#### 8.6.1 KPI Kartları
- Toplam Teklif Sayısı
- Aktif Teklif Sayısı
- Toplam Teklif Değeri (sum of total_value)
- Toplam Ürün Sayısı (sum of total_products)
- Ortalama İndirim Yüzdesi (avg of discount_percentage)
- Toplam Kullanım (sum of current_usage)
- Kullanım Oranı (current / limit)

#### 8.6.2 Dağılım Grafikleri
- Durum: Draft, Pending Review, Active, Expired, Paused, Cancelled, Completed
- Fiyatlandırma Tipi: Fixed Price, Discount Percentage, Fixed Discount Amount

### 8.7 Storefront (Vitrin)

#### 8.7.1 KPI Kartları
- Toplam Vitrin Sayısı
- Yayınlanmış Vitrin Sayısı (is_published = 1)
- Öne Çıkan Vitrin Sayısı (is_featured = 1)
- Toplam Görüntülenme (sum of total_views)
- Toplam Takipçi (sum of total_followers)
- Toplam Yorum (sum of total_reviews)
- Toplam Satış (sum of total_sales)
- Ortalama Değerlendirme (avg of average_rating)
- Toplam Ürün Sayısı (sum of total_products)

#### 8.7.2 Dağılım Grafikleri
- Durum: Draft, Pending Review, Active, Suspended, Archived
- Tema: Default, Modern, Classic, Minimal, Bold, Elegant, Custom
- Düzen: Grid, List, Masonry, Carousel

---

## 9. TEKLİF YÖNETİMİ (tradehub_commerce)

### 9.1 RFQ (Teklif Talebi)

#### 9.1.1 KPI Kartları
- Toplam RFQ Sayısı
- Yayınlanan RFQ Sayısı (status = Published)
- Teklif Alınan RFQ Sayısı (status = Quoting)
- Müzakere Aşamasındaki RFQ (status = Negotiation)
- Kabul Edilen RFQ Sayısı (status = Accepted)
- Siparişe Dönüşen RFQ Sayısı (status = Ordered)
- Kapatılan RFQ Sayısı (status = Closed)
- İptal Edilen RFQ Sayısı (status = Cancelled)
- Ortalama Bütçe Min (avg of budget_min)
- Ortalama Bütçe Max (avg of budget_max)
- Toplam Miktar (sum of quantity)
- Ortalama Teklif Sayısı (avg of quote_count)
- NDA Gerektiren RFQ Sayısı (requires_nda = 1)
- Kısmi Teklif İzni Olan RFQ Sayısı (allow_partial_quotes = 1)
- Görüntüleme Limitli RFQ Sayısı (is_view_limited = 1)
- Toplam Görüntülenme (sum of current_views)
- RFQ-to-Order Dönüşüm Oranı

#### 9.1.2 Dağılım Grafikleri
- RFQ Durumu: Draft, Published, Quoting, Negotiation, Accepted, Ordered, Closed, Cancelled
- Hedef Tipi: Public, Category, Selected

#### 9.1.3 Zaman Serisi
- RFQ Oluşturma Trendi (created_date)
- Yayınlama Trendi (published_at)
- Kapanış Trendi (closed_at)
- Son Teslim Tarihi Trendi (deadline)

#### 9.1.4 Huni Grafik
- RFQ Hunisi: Draft → Published → Quoting → Negotiation → Accepted → Ordered

#### 9.1.5 Tablo Widget'ları
- Açık RFQ'lar
- Son Tarihi Yaklaşan RFQ'lar
- Teklif Bekleyen RFQ'lar
- En Yüksek Bütçeli RFQ'lar
- Kategorisine Göre RFQ'lar

### 9.2 RFQ Quote (RFQ Teklifi)

#### 9.2.1 KPI Kartları
- Toplam Teklif Sayısı
- Gönderilen Teklif Sayısı (status = Submitted)
- İnceleme Altındaki Sayı (status = Under Review)
- Kısa Listeye Alınan Sayı (status = Shortlisted)
- Kabul Edilen Teklif Sayısı (status = Accepted)
- Reddedilen Teklif Sayısı (status = Rejected)
- Geri Çekilen Sayı (status = Withdrawn)
- Ortalama Teklif Tutarı (avg of total_amount)
- Ortalama Birim Fiyat (avg of unit_price)
- Ortalama Teslimat Günü (avg of delivery_days)
- Ortalama Revizyon Sayısı (avg of revision_count)
- Toplam Final Tutar (sum of final_amount)
- Kabul Oranı (Accepted / Total)

#### 9.2.2 Dağılım Grafikleri
- Teklif Durumu: Submitted, Under Review, Shortlisted, Accepted, Rejected, Withdrawn

#### 9.2.3 Zaman Serisi
- Teklif Gönderim Trendi (submitted_at)
- Kabul Trendi (accepted_at)
- Red Trendi (rejected_at)
- Revizyon Trendi (last_revised_at)

#### 9.2.4 Çubuk Grafik
- Satıcı Bazında Teklif Sayısı
- Satıcı Bazında Kabul Oranı
- Satıcı Bazında Ortalama Teklif Tutarı

### 9.3 Quotation (B2B Teklif)

#### 9.3.1 KPI Kartları
- Toplam Teklif Sayısı
- Gönderilen Teklif Sayısı
- Seçilen Teklif Sayısı (status = Selected)
- Reddedilen Teklif Sayısı
- Süresi Geçmiş Teklif Sayısı (status = Expired)
- Ortalama Toplam Tutar (avg of total_amount)
- Ortalama İndirim Yüzdesi (avg of discount_percentage)
- Ortalama Teslimat Günü (avg of delivery_days)
- Ortalama Üretim Süresi (avg of production_time_days)
- Ortalama Min Sipariş Miktarı (avg of minimum_order_quantity)
- Ortalama Aylık Kapasite (avg of capacity_per_month)
- Toplam Avans Tutarı (sum of advance_amount)

#### 9.3.2 Dağılım Grafikleri
- Teklif Durumu: Draft, Submitted, Under Review, Selected, Rejected, Expired, Cancelled
- Incoterm: EXW, FOB, CIF, DDP, DAP, FCA
- Kargo Yöntemi: Sea Freight, Air Freight, Land Transport, Courier, Multi-Modal
- Ödeme Koşulları: 30/70, 50/50, 100% Advance, LC, Net 30/60/90, Custom

#### 9.3.3 Zaman Serisi
- Teklif Oluşturma Trendi (created_date)
- Gönderim Trendi (submitted_date)
- İnceleme Trendi (reviewed_date)
- Karar Trendi (decided_date)

### 9.4 RFQ Message Thread (RFQ Mesaj Konusu)

#### 9.4.1 KPI Kartları
- Toplam Mesaj Konusu Sayısı
- Açık Konu Sayısı (status = Open)
- Kapalı Konu Sayısı (status = Closed)
- Toplam Okunmamış Mesaj (sum of unread_count)

#### 9.4.2 Zaman Serisi
- Son Mesaj Trendi (last_message_at)

### 9.5 Incoterm Price (Incoterm Fiyatlandırma)

#### 9.5.1 KPI Kartları
- Toplam Incoterm Fiyat Kaydı
- Aktif Kayıt Sayısı
- Ortalama Baz Fiyat (avg of base_price)
- Ortalama Transit Gün (avg of estimated_transit_days)
- Navlun Dahil Sayısı (freight_included = 1)
- Sigorta Dahil Sayısı (insurance_included = 1)
- Gümrük Vergisi Dahil Sayısı (customs_duties_included = 1)

#### 9.5.2 Dağılım Grafikleri
- Incoterm: EXW, FOB, CIF, DDP
- Durum: Active, Inactive, Expired

---

## 10. SİSTEM & ENTEGRASYON (tradehub_core)

### 10.1 ECA Rule (Event-Condition-Action Kuralları)

#### 10.1.1 KPI Kartları
- Toplam Kural Sayısı
- Aktif Kural Sayısı
- Toplam Günlük Çalıştırma Limiti (sum of max_daily_executions)
- Loglama Aktif Kural Sayısı (enable_logging = 1)

#### 10.1.2 Dağılım Grafikleri
- Olay Tipi: before_insert, after_insert, validate, before_save, after_save, on_update, on_submit, on_cancel, on_trash, on_update_after_submit, before_rename, after_rename, on_change
- Koşul Mantığı: AND, OR, Custom
- Zamanlama Tipi: Event-based, Cron
- Kategori: Commerce, Communication, Compliance, Integration, Notification, Workflow, Custom

#### 10.1.3 Zaman Serisi
- Son Çalıştırma Trendi (last_execution)

### 10.2 ECA Rule Log (ECA Kural Logları)

#### 10.2.1 KPI Kartları
- Toplam Log Sayısı
- Başarılı Çalıştırma Sayısı (status = Success)
- Başarısız Çalıştırma Sayısı (status = Failed/Error)
- Atlanan Çalıştırma Sayısı (status = Skipped)
- Ortalama Çalıştırma Süresi (avg of execution_time_ms) ms
- Toplam Başarılı Aksiyon (sum of actions_succeeded)
- Toplam Başarısız Aksiyon (sum of actions_failed)

#### 10.2.2 Dağılım Grafikleri
- Log Durumu: Success, Partial, Failed, Skipped, Error

#### 10.2.3 Zaman Serisi
- Tetikleme Trendi (trigger_time)
- Hata Trendi

### 10.3 ERPNext Integration Settings

#### 10.3.1 KPI Kartları
- Bağlantı Durumu (connection_status)
- Toplam Senkronize Ürün (total_synced_products)
- Toplam Senkronize Sipariş (total_synced_orders)
- Senkron Hata Sayısı (sync_error_count)
- Son Senkronizasyon Zamanı (last_sync_time)

#### 10.3.2 Göstergeler
- Bağlantı Durumu: Not Tested, Connected, Failed
- Senkron Sıklığı: Every 15/30 Minutes, Hourly, Daily, Weekly

### 10.4 Import Job (Veri İçe Aktarma)

#### 10.4.1 KPI Kartları
- Toplam İçe Aktarma Sayısı
- İşlenen Sayı (status = Completed)
- Hatalı Tamamlanan Sayı (status = Completed with Errors)
- Başarısız Sayı (status = Failed)
- Toplam İşlenen Satır (sum of processed_rows)
- Toplam Başarılı Satır (sum of successful_rows)
- Toplam Başarısız Satır (sum of failed_rows)
- Toplam Atlanan Satır (sum of skipped_rows)
- Ortalama İşlem Hızı (avg of rows_per_second)
- Ortalama İlerleme (avg of progress_percent)
- Ortalama Süre (avg of duration_seconds)
- Başarı Oranı (successful / total rows)

#### 10.4.2 Dağılım Grafikleri
- İçe Aktarma Tipi: Listing, Listing Variant, SKU, Category, Media Asset, Inventory Update, Price Update
- Durum: Pending, Validating, Queued, Processing, Paused, Completed, Completed with Errors, Failed, Cancelled
- Dosya Formatı: CSV, Excel (XLSX), Excel (XLS), JSON
- Öncelik: Low, Medium, High, Critical
- Varsayılan Durum: Draft, Pending Review, Active

#### 10.4.3 Zaman Serisi
- İçe Aktarma Başlama Trendi (started_at)
- Tamamlama Trendi (completed_at)
- Hata Trendi

### 10.5 Notification Template (Bildirim Şablonu)

#### 10.5.1 KPI Kartları
- Toplam Şablon Sayısı
- Aktif Şablon Sayısı
- Toplam Gönderim (sum of sent_count)
- Toplam Teslim (sum of delivered_count)
- Toplam Başarısız (sum of failed_count)
- Teslim Oranı (delivered / sent)

#### 10.5.2 Dağılım Grafikleri
- Bildirim Kanalı: Email, Push Notification, SMS, In-App, Webhook
- Olay Tipi: General, Order Created/Confirmed/Shipped/Delivered/Cancelled, Payment Received/Failed/Reminder, RFQ Created/Response Received/Expired, Quotation Received/Accepted/Rejected, Sample Request events, Message Received, Verification events, Certificate events, Stock/Price/Product alerts, Welcome Email, Password Reset, Account Deactivated
- Öncelik: Low, Normal, High, Urgent
- Zamanlama: Immediate, Delayed, Scheduled Window

### 10.6 Keycloak Settings

#### 10.6.1 KPI Kartları
- Bağlantı Durumu
- Toplam Senkronize Kullanıcı (total_users_synced)
- Son Senkronizasyon Tarihi (last_sync_date)
- Aktif Sosyal Giriş Sayısı (Google, Facebook, Apple, LinkedIn)

---

## 11. ÇAPRAZ ANALİZ & KARŞILAŞTIRMA WİDGET'LARI

### 11.1 Satıcı Performans Karşılaştırma
- Satıcı Skoru vs Sipariş Sayısı (Scatter Plot)
- Satıcı Değerlendirmesi vs İade Oranı (Scatter Plot)
- Satıcı Seviyesi vs Ortalama Sipariş Tutarı (Grouped Bar)
- Satıcı Tier vs Komisyon Oranı (Grouped Bar)
- Satıcı Yanıt Süresi vs Müşteri Memnuniyeti (Scatter Plot)
- Premium vs Standard Satıcı Performans Karşılaştırma (Dual Axis)

### 11.2 Ürün & Kategori Analizi
- Kategori Bazında Gelir Dağılımı (Treemap)
- Marka Bazında Satış Performansı (Bar + Line)
- Ürün Tamamlanma Skoru vs Satış (Scatter Plot)
- Kanal Bazında Ürün Dağılımı (Stacked Bar)
- Fiyat Aralığı vs Satış Hacmi (Bubble Chart)
- Kategori Komisyon Oranı vs Satış Hacmi (Scatter Plot)

### 11.3 Sipariş & Ödeme Akışı
- Sipariş Durumu Sankey Diagramı (status transitions)
- Ödeme Yöntemi vs Başarı Oranı (Grouped Bar)
- Sipariş Kaynağı vs Ortalama Tutar (Grouped Bar)
- Escrow Yaşam Döngüsü (Waterfall Chart)
- Sipariş → Kargo → Teslim Süre Analizi (Box Plot)
- İade Nedeni vs Ürün Kategorisi (Heat Map)

### 11.4 Lojistik Performans
- Kargo Firması vs Zamanında Teslimat Oranı (Bar)
- Kargo Firması vs Ortalama Maliyet (Bar)
- Kargo Tipi vs Teslimat Süresi (Box Plot)
- Bölge vs Teslimat Performansı (Choropleth Map)
- Kargo Firması Karşılaştırma Radarı (Radar Chart)

### 11.5 Uyumluluk & Risk
- Risk Skoru Dağılımı - Satıcı vs Alıcı (Dual Histogram)
- Moderasyon Vaka Tipi vs Çözüm Süresi (Box Plot)
- Sertifika Durumu Heatmap (Kategori x Durum)
- KYC Doğrulama Hunisi (Funnel)
- Onay Tipi Dağılımı (Sunburst Chart)

### 11.6 Pazarlama Etkinliği
- Kampanya ROI Karşılaştırma (Bar + Line)
- Kupon Kullanım Oranı vs İndirim Değeri (Scatter)
- Grup Alım Başarı Oranı Trendi (Line)
- Abonelik Churn Oranı (Line)
- Promosyon Kanalı vs Dönüşüm Oranı (Grouped Bar)

---

## ÖZET İSTATİSTİKLER

| Metrik | Değer |
|--------|-------|
| **Toplam Uygulama** | 7 |
| **Toplam DocType** | 234 |
| **Standalone DocType** | 127 |
| **Child Table DocType** | 107 |
| **Toplam Ana Kategori** | 11 |
| **Toplam Alt Kategori** | ~95 |
| **Toplam Widget Alt Bölümü** | ~380 |
| **Toplam Widget Seçeneği** | ~3.200+ |

### Uygulama Bazında DocType Dağılımı

| Uygulama | DocType Sayısı |
|----------|---------------|
| tradehub_catalog | 54 |
| tradehub_commerce | 52 |
| tradehub_seller | 39 |
| tradehub_compliance | 32 |
| tradehub_core | 31 |
| tradehub_marketing | 14 |
| tradehub_logistics | 12 |

### Widget Tipi Dağılımı

| Widget Tipi | Yaklaşık Sayı |
|-------------|--------------|
| KPI Kartları | ~850 |
| Dağılım Grafikleri (Pasta/Halka) | ~650 |
| Zaman Serisi Grafikleri | ~380 |
| Çubuk Grafikleri | ~280 |
| Tablo/Liste Widget'ları | ~320 |
| Göstergeler (Gauge) | ~120 |
| Huni Grafikleri | ~40 |
| Isı Haritaları | ~30 |
| Radar/Örümcek Grafikleri | ~20 |
| Scatter/Bubble Grafikleri | ~80 |
| Diğer (Gantt, Harita, Treemap, Sankey, vb.) | ~50 |

---

> Bu dosya, TradeHub platformunun 7 uygulamasındaki 234 DocType ve binlerce alanın detaylı analizi sonucunda oluşturulmuştur. Her widget seçeneği, gerçek veritabanı alanlarına dayalı somut önerilerdir ve doğrudan Frappe Dashboard API'si ile implemente edilebilir.

---

END OF FILE.
