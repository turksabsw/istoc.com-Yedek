Sen bir yazılım mimarısın. Elimde daha önce yapılmış bir auth sistemi analizi var.
Bu analizi baz alarak buyer/seller ayrımlı, Frappe backend uyumlu yeni bir auth sistemi tasarlayacaksın.

## KURALLAR
- Bu fazda KOD YAZMA. Sadece mimari dokümantasyon üret.
- Storefront'un mevcut component yapısını ve UI/UX estetiğini bozmayan çözümler öner.
- Frappe'nin built-in user/role sistemini temel al, sıfırdan kullanıcı sistemi icat etme.
- Her karar için kısa bir "neden" açıklaması ekle.

## BAĞLAM DOSYASI
Önce şu dosyayı oku ve içselleştir:
`/home/ali/Masaüstü/istoc.com-Yedek/auth-sistemi-var-olanlar.md`

---

## ÖNCEDENVERİLMİŞ MİMARİ KARARLAR
Bu kararlar kesinleşmiştir. Tartışma, alternatif öneri veya soru sorma.
Tasarımını bu kararlara göre yap.

### Karar 1 — Kayıt Doğrulama: Email OTP (Backend'e Yeni Endpoint Yazılacak)
- Storefront'taki 6 haneli OTP UI bileşeni (EmailVerification.ts) KORUNACAK.
- Backend'e kayıt akışı için iki yeni endpoint tasarlanacak:
  - send_registration_otp(email) → 6 haneli kodu email ile gönderir, 10 dakika geçerli
  - verify_registration_otp(email, code) → kodu doğrular; doğruysa kayıt adımına registration_token döner
- Mevcut verify_email(key) link mekanizması bu akışta KULLANILMAYACAK (başka amaçlarla korunabilir).
- OTP yalnızca email üzerinden gönderilecek (SMS değil). Frappe frappe.sendmail() kullanılacak.
- OTP doğrulandıktan sonra storefront bir registration_token alacak; bu token adım 4'te register_user() çağrısına eklenecek.

### Karar 2 — Şifre Sıfırlama: Email Link (Mevcut Backend Sistemi Korunacak)
- Backend'deki forgot_password(email) + reset_password(key, new_password) endpoint'leri AYNEN kullanılacak.
- Storefront'taki 3 adımlı OTP şifre sıfırlama akışı (email → OTP → yeni şifre) DEĞİŞTİRİLECEK.
- Yeni storefront akışı yalnızca 2 ekrandan oluşacak:
  1. Email giriş ekranı → forgot_password() çağrısı → "Email'inize link gönderdik" bilgi ekranı
  2. Şifre sıfırlama ekranı → URL'deki ?key=... parametresi okunacak → reset_password(key, new_password) çağrısı
- EmailVerification.ts bileşeni şifre sıfırlama akışında KULLANILMAYACAK.
- ForgotPasswordPage.ts bileşenindeki OTP adımı kaldırılacak, "link gönderildi" bilgi ekranıyla değiştirilecek.

---

## KULLANICI TİPLERİ

### Buyer (Alıcı)
- Platforma kayıt olur, ürünleri görüntüler, sipariş verir
- Frappe'de karşılığı: mevcut Buyer Profile DocType (tradehub_core)
- Erişebileceği sayfalar: storefront ürün listeleri, sipariş takibi, profil yönetimi
- Frappe rolü: Buyer (kayıt anında otomatik atanır)

### Seller (Satıcı)
- Platforma kayıt olur, başvuru yapar, onaylanırsa ürün listeler
- Frappe'de karşılığı: mevcut Seller Application + Seller Profile DocType'ları (tradehub_seller)
- Erişebileceği sayfalar: seller dashboard, ürün yönetimi, sipariş yönetimi, ileride admin panel
- Frappe rolü: Seller (admin onayı sonrası atanır)

---

## TASARIM GÖREVLERİ

### Görev 1 — Auth Akış Diyagramları (metin formatında)
Her akış için adım adım metin diyagramı çiz. Yukarıdaki mimari kararları tam yansıt.

1a — Buyer Kayıt Akışı:
Hesap tipi seç (buyer) → Email gir → check_email_exists() → send_registration_otp()
→ OTP UI (EmailVerification.ts) → verify_registration_otp() → registration_token al
→ Buyer form (isim, ülke, şifre, koşullar) → register_user(account_type="buyer", registration_token=...)
→ Buyer Profile oluşur → Auto-login → Ana sayfa

1b — Seller Kayıt Akışı:
Hesap tipi seç (supplier) → Email gir → check_email_exists() → send_registration_otp()
→ OTP UI → verify_registration_otp() → registration_token al
→ Supplier 4 adımlı form → register_user(account_type="supplier", registration_token=...)
→ Draft Seller Application oluşur → Auto-login
→ complete_registration_application() → Belge yükle → Application-pending sayfası

1c — Login Akışı:
Email + şifre gir → login(usr, pwd) → Response kontrol:
  requires_2fa: true → [ileride: 2FA ekranı — şimdilik log'a yaz]
  requires_consent_renewal: true → [ileride: consent ekranı — şimdilik log'a yaz]
  Normal → get_session_user() → Rol bazlı yönlendirme matrisi

1d — Şifremi Unuttum Akışı (Karar 2 — Email Link):
Email gir → forgot_password(email) → "Email'inize link gönderdik" bilgi ekranı
→ [Kullanıcı email'deki linke tıklar] → /pages/auth/reset-password.html?key=...
→ Yeni şifre formu → reset_password(key, new_password) → Başarı → Login sayfasına yönlendir

1e — Email Doğrulama Akışı (Kayıt Sonrası — Arka Plan):
Kayıt tamamlanır → Backend verify_email linki gönderir (arka planda, bilgi amaçlı)
→ Kullanıcı maildeki linke tıklar → verify_email(key) → email_verified = true

Her diyagram için: başarı yolu, hata durumları (yanlış OTP, süresi dolmuş token,
kayıtlı email vb.) ve kullanıcıya gösterilen mesajları belirt.

### Görev 2 — Yeni Backend Endpoint'leri (Tasarım)
Mevcut auth-sistemi-var-olanlar.md'deki Kategori A ve Kategori B maddelerini dikkate alarak
SADECE yeni yazılacak ya da değiştirilecek endpoint'leri tasarla.

Şu endpoint'leri mutlaka dahil et:

| Endpoint | Dosya | Guest | Payload | Response | Açıklama |
|---|---|---|---|---|---|
| send_registration_otp | identity.py | Evet | { email } | { success, expires_in_minutes } | Kayıt OTP gönder |
| verify_registration_otp | identity.py | Evet | { email, code } | { success, registration_token } | OTP doğrula |
| register_user (güncelle) | identity.py | Evet | mevcut + registration_token | mevcut | Token kontrolü ekle |
| forgot_password | identity.py | Evet | { email } | { success, message } | Mevcut — değişmez |
| reset_password | identity.py | Evet | { key, new_password } | { success, message } | Mevcut — değişmez |
| check_email_exists | auth.py | Evet | { email } | { success, exists } | Mevcut — değişmez |
| get_session_user | auth.py | Evet | — | mevcut | Mevcut — değişmez |

Her yeni endpoint için: rate limit önerisi, hata kodları, OTP için cache stratejisi (Frappe cache/Redis).

### Görev 3 — Storefront Değişiklik Planı
auth-sistemi-var-olanlar.md'deki mevcut dosya envanterini baz al.
Tüm dosya yollarını tam olarak yaz (src/components/auth/... formatında).

Yeni oluşturulacak dosyalar:
Her dosya için: dosya yolu, amacı, içereceği UI öğeleri, çağıracağı endpoint.
En az şunları dahil et:
- Şifre sıfırlama landing sayfası (reset-password.html + bileşeni) — URL'deki key parametresini okur

Güncellenecek mevcut dosyalar:
Her dosya için: mevcut davranış → yeni davranış (kod değil açıklama).
En az şunları dahil et:
- EmailVerification.ts → onResend: send_registration_otp() çağır; doğrulama: verify_registration_otp() çağır, registration_token sakla
- ForgotPasswordPage.ts → OTP adımını kaldır; adım 2'yi "link gönderildi" bilgi ekranına dönüştür; submitReset() kaldır
- alpine/auth.ts → registerPage.submitEmail(): check_email_exists() + send_registration_otp() çağır
- AccountSetupForm.ts → register_user() çağrısına registration_token ekle
- SupplierSetupForm.ts → register_user() çağrısına registration_token ekle
- utils/auth.ts → login() response'da requires_2fa ve requires_consent_renewal kontrol et (console.warn ile logla, ileride implement edilecek)
- ForgotPasswordPage.ts → şifre kurallarını backend standardına hizala (8+ karakter, büyük, küçük, rakam)

Değişmeyecek dosyalar: Neden dokunulmayacağını belirt.

### Görev 4 — Şifre Politikası Uyumu
Storefront'ta iki farklı kural seti var ve bunlar backend ile uyumsuz.
Tek bir birleşik kural seti belirle: backend kurallarını baz al (8+ karakter, 1 büyük, 1 küçük, 1 rakam).
Bu kuralın kayıt formu, şifre değiştirme ve şifre sıfırlama ekranlarında nasıl uygulanacağını yaz.
Storefront'ta kuralı uygulayan regex/fonksiyon merkezi bir yerde mi (utils) olmalı, açıkla.

### Görev 5 — Role Bazlı Yönlendirme Matrisi
get_session_user() response'undaki alanları kullanarak tam matrisi oluştur:

| Kullanıcı Durumu | is_buyer | is_seller | pending | is_admin | Yönlendirme |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... |

Mevcut auth-guard.ts dosyasına ne eklenmeli/değişmeli, açıkla.

### Görev 6 — Güvenlik Notları
- OTP brute-force koruması: kaç deneme sonrası kilit, kilit süresi?
- registration_token nasıl saklanacak (Frappe cache, TTL kaç dakika)?
- reset_password key süresi kaç dakika?
- Şifre sıfırlama key'i tek kullanımlık olmalı mı — nasıl sağlanacak?
- HTTPS zorunluluğu reset link'inde nasıl garantilenir?

## ÇIKTI

Tüm görevler tamamlandığında /home/ali/Masaüstü/istoc.com-Yedek/yeni-auth-sistemi.md dosyasını oluştur.

Dosya yapısı:

---
# Yeni Auth Sistemi — Mimari Doküman
_Tarih: [tarih]_
_Baz alınan analiz: auth-sistemi-var-olanlar.md_

## 1. Mimari Özet ve Alınan Kararlar
## 2. Kullanıcı Tipleri ve Roller
## 3. Auth Akış Diyagramları
### 3a. Buyer Kayıt
### 3b. Seller Kayıt
### 3c. Login
### 3d. Şifremi Unuttum (Email Link)
### 3e. Email Doğrulama (Kayıt Sonrası — Arka Plan)
## 4. Yeni / Güncellenen Backend Endpoint'leri
## 5. Storefront Değişiklik Planı
### 5a. Yeni Oluşturulacak Dosyalar
### 5b. Güncellenecek Dosyalar
### 5c. Değişmeyecek Dosyalar
## 6. Şifre Politikası (Birleşik)
## 7. Role Bazlı Yönlendirme Matrisi
## 8. Güvenlik Notları
## 9. Uygulama Öncelik Sırası
---

Dosyayı oluşturduktan sonra sadece şunu söyle:
- Toplam kaç backend endpoint tasarlandı (yeni + güncellenen)
- Storefront'ta kaç yeni dosya öneriliyor
- Storefront'ta kaç mevcut dosya güncellenmeli
Başka hiçbir değişiklik yapma.