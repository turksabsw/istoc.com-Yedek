---
# Yeni Auth Sistemi — Mimari Doküman
_Tarih: 2026-03-16_
_Baz alınan analiz: auth-sistemi-var-olanlar.md_

---

## 1. Mimari Özet ve Alınan Kararlar

Bu doküman, mevcut auth sistemi analizini (`auth-sistemi-var-olanlar.md`) baz alarak buyer/seller ayrımlı yeni auth akışlarını tasarlar. Frappe'nin built-in user/role sistemi temel alınır; sıfırdan kullanıcı sistemi icat edilmez.

### Karar 1 — Kayıt Doğrulama: Email OTP

| Alan | Detay |
|---|---|
| **Yöntem** | 6 haneli OTP kodu, email ile gönderim |
| **Storefront UI** | Mevcut `EmailVerification.ts` bileşeni KORUNUR |
| **Yeni Backend Endpoint'leri** | `send_registration_otp(email)` + `verify_registration_otp(email, code)` |
| **OTP Geçerlilik Süresi** | 10 dakika |
| **Token Mekanizması** | OTP doğrulandıktan sonra `registration_token` döner; bu token `register_user()` çağrısına eklenir |
| **Email Gönderim** | `frappe.sendmail()` kullanılır (SMS değil) |
| **Mevcut verify_email(key)** | Bu akışta KULLANILMAZ (kayıt sonrası arka plan doğrulama olarak korunur) |

**Neden:** Storefront'ta zaten tam implement edilmiş 6 haneli OTP UI bileşeni var. Backend'e OTP endpoint'leri eklemek, mevcut UI'ı sıfırdan değiştirmekten çok daha verimli. Link tabanlı doğrulama kayıt akışında kötü UX sunar (kullanıcı tarayıcı/email arasında geçiş yapmak zorunda kalır).

### Karar 2 — Şifre Sıfırlama: Email Link

| Alan | Detay |
|---|---|
| **Yöntem** | Email ile şifre sıfırlama linki |
| **Backend** | Mevcut `forgot_password(email)` + `reset_password(key, new_password)` AYNEN korunur |
| **Storefront Akışı** | 3 adımlı OTP akışı → 2 ekranlı link akışına dönüştürülür |
| **Ekran 1** | Email girişi → `forgot_password()` çağrısı → "Email'inize link gönderdik" bilgi ekranı |
| **Ekran 2** | Yeni sayfa: `/pages/auth/reset-password.html?key=...` → `reset_password(key, new_password)` |
| **EmailVerification.ts** | Şifre sıfırlama akışında KULLANILMAZ |

**Neden:** Backend'de zaten çalışan ve güvenli bir email link + key sistemi mevcut. Bu sistemi yeniden yazmak gereksiz iş ve risk. Storefront'u backend'e uyumlu hale getirmek yeterli.

---

## 2. Kullanıcı Tipleri ve Roller

### Buyer (Alıcı)

| Alan | Detay |
|---|---|
| **Tanım** | Platforma kayıt olur, ürünleri görüntüler, sipariş verir |
| **Frappe Rolü** | `Buyer` (Desk Access: Hayır) |
| **Rol Atanma Zamanı** | `register_user()` çağrısında otomatik |
| **İlgili DocType'lar** | User, Buyer Profile |
| **Erişim Alanı** | Storefront ürün listeleri, sipariş takibi, profil yönetimi |

### Seller (Satıcı)

| Alan | Detay |
|---|---|
| **Tanım** | Platforma kayıt olur, başvuru yapar, onaylanırsa ürün listeler |
| **Frappe Rolleri** | Kayıt anında: `Buyer` → Admin onayı sonrası: `Buyer` + `Seller` (Desk Access: Hayır) |
| **İlgili DocType'lar** | User, Seller Application (kayıt anında draft), Seller Profile (onay sonrası) |
| **Erişim Alanı** | Seller dashboard, ürün yönetimi, sipariş yönetimi |

### Admin

| Alan | Detay |
|---|---|
| **Frappe Rolü** | `System Manager` / `Marketplace Admin` (Desk Access: Evet) |
| **Rol Atanma** | Manuel |
| **Erişim Alanı** | Frappe Desk (`/app/tradehub`) |

### Satıcı Başvuru Yaşam Döngüsü

```
Kayıt (account_type="supplier")
  → User oluşturulur + Buyer rolü atanır
  → Draft Seller Application oluşturulur
  → complete_registration_application() ile form tamamlanır
  → Kimlik belgesi yüklenir (upload_file)
  → Status: Draft → Submitted → Under Review
  → Admin onayı → Approved
  → Seller Profile oluşturulur + Seller rolü atanır
  → Status: Active
```

---

## 3. Auth Akış Diyagramları

### 3a. Buyer Kayıt Akışı

```
[Storefront]                                        [Backend]
    │
    1. AccountTypeSelector: "buyer" seç
    │
    2. Email gir, "Devam Et" butonuna tıkla
    │
    ├─── check_email_exists(email) ─────────────────────►
    ◄─── { success, exists: false } ────────────────────┤
    │                                                    │
    │  [exists: true ise]                                │
    │  → HATA: "Bu email ile kayıtlı hesap var.         │
    │    Giriş yapmak ister misiniz?" + login linki      │
    │  → DUR                                             │
    │                                                    │
    ├─── send_registration_otp(email) ──────────────────►
    │                                     6 haneli OTP üret
    │                                     Cache: registration_otp:{email}
    │                                       = {code, attempts: 0}
    │                                     TTL: 600sn (10dk)
    │                                     frappe.sendmail() ile gönder
    ◄─── { success, expires_in_minutes: 10 } ──────────┤
    │
    3. EmailVerification.ts UI gösterilir
       60sn geri sayım başlar
       Kullanıcı 6 haneyi girer
    │
    ├─── verify_registration_otp(email, code) ──────────►
    │                                     Cache'den registration_otp:{email} oku
    │                                     [bulunamadıysa] → "Kod süresi dolmuş"
    │                                     [attempts >= 5] → "Çok fazla yanlış deneme"
    │                                     [kod eşleşmiyorsa] → attempts++, "Yanlış kod"
    │                                     [eşleştiyse]:
    │                                       registration_token üret (32 char hash)
    │                                       Cache: registration_token:{token} = email
    │                                       TTL: 1800sn (30dk)
    │                                       OTP cache key'ini sil
    ◄─── { success, registration_token } ──────────────┤
    │
    4. registration_token Alpine state'ine kaydedilir
    │
    5. AccountSetupForm gösterilir
       (firstName, lastName, country, password, terms)
       Kullanıcı formu doldurur, "Hesap Oluştur" tıklar
    │
    ├─── register_user(                    ─────────────►
    │      email, password, first_name,
    │      last_name, account_type="buyer",
    │      phone="", country,
    │      accept_terms, accept_kvkk,
    │      registration_token              )
    │                                     Cache'den registration_token:{token} doğrula
    │                                     [geçersiz/süresi dolmuş] → hata
    │                                     [token email ≠ request email] → hata
    │                                     User + Buyer rolü oluştur
    │                                     Buyer Profile oluştur
    │                                     _create_email_verification() (arka plan)
    │                                     registration_token cache key'ini sil
    ◄─── { success, user, account_type: "buyer" } ────┤
    │
    6. login(email, password) → auto-login
    7. getSessionUser() → rol bazlı yönlendirme → "/"
```

**Hata Durumları:**

| Nokta | Hata | Kullanıcı Mesajı |
|---|---|---|
| check_email_exists | exists: true | "Bu email ile kayıtlı hesap var. Giriş yapmak ister misiniz?" |
| send_registration_otp | rate limit | "Çok fazla istek gönderdiniz. Lütfen birkaç dakika bekleyin." |
| send_registration_otp | geçersiz email formatı | "Lütfen geçerli bir email adresi girin." |
| verify_registration_otp | yanlış kod | "Doğrulama kodu hatalı. Lütfen tekrar deneyin." (OTP inputları temizlenir) |
| verify_registration_otp | süre dolmuş | "Kodun süresi doldu. Lütfen yeni kod gönderin." |
| verify_registration_otp | 5+ başarısız deneme | "Çok fazla yanlış deneme. Lütfen yeni kod isteyin." |
| register_user | geçersiz token | "Doğrulama süresi dolmuş. Lütfen kaydı baştan başlatın." |
| register_user | şifre kurallarına uymaz | Backend şifre hata mesajları gösterilir |

### 3b. Seller Kayıt Akışı

```
[Storefront]                                        [Backend]
    │
    1-4. Buyer akışı ile AYNI
       (AccountTypeSelector: "supplier" seç → Email →
        check_email_exists → send_registration_otp →
        OTP UI → verify_registration_otp → registration_token)
    │
    5. SupplierSetupForm gösterilir (4 alt adım)
       Alt Adım 1: Temel Bilgiler (firstName, lastName, businessName,
                    sellerType, country)
       Alt Adım 2: Vergi & İletişim (taxIdType, taxId, taxOffice,
                    contactPhone, addressLine1, city)
       Alt Adım 3: Banka (bankName, iban, accountHolderName)
       Alt Adım 4: Kimlik & Şifre (identityDocumentType, documentNumber,
                    documentExpiryDate, dosya yükleme, password, terms)
    │
    ├─── register_user(                    ─────────────►
    │      email, password, first_name,
    │      last_name, account_type="supplier",
    │      phone, country,
    │      accept_terms, accept_kvkk,
    │      registration_token              )
    │                                     Token doğrula (aynı mekanizma)
    │                                     User + Buyer rolü oluştur
    │                                     Draft Seller Application oluştur
    ◄─── { success, user, account_type: "supplier",
    │      seller_application: "SA-00001" } ───────────┤
    │
    6. login(email, password) → auto-login
    │
    ├─── complete_registration_application(  ───────────►
    │      application_name, business_name,
    │      seller_type, tax_id_type, tax_id,
    │      tax_office, contact_phone,
    │      address_line_1, city, country,
    │      bank_name, iban, account_holder_name,
    │      identity_document, identity_document_number,
    │      identity_document_expiry,
    │      terms_accepted, privacy_accepted,
    │      kvkk_accepted, commission_accepted,
    │      return_policy_accepted           )
    ◄─── { success, application_name } ────────────────┤
    │
    ├─── upload_file (kimlik belgesi) ──────────────────►
    │      FormData: doctype="Seller Application",
    │      is_private=1
    ◄─── { file_url } ────────────────────────────────┤
    │
    7. Yönlendir → /pages/seller/application-pending.html
```

**Ek Hata Durumları (Buyer akışına ek):**

| Nokta | Hata | Kullanıcı Mesajı |
|---|---|---|
| complete_registration_application | geçersiz application_name | "Başvuru bulunamadı. Lütfen tekrar deneyin." |
| upload_file | dosya boyutu aşımı | "Dosya boyutu çok büyük. Maksimum 5MB." |
| upload_file | geçersiz format | "Desteklenmeyen dosya formatı. PDF, JPG veya PNG yükleyin." |

### 3c. Login Akışı

```
[Storefront]                                        [Backend]
    │
    1. Email + şifre gir, "Giriş Yap" tıkla
    │
    ├─── POST /api/method/login ────────────────────────►
    │      { usr: email, pwd: password }
    │                                     Frappe built-in login
    │                                     Oturum cookie set edilir
    ◄─── 200 OK ───────────────────────────────────────┤
    │
    │  [Login response kontrolü - utils/auth.ts]
    │
    │  Durum A: requires_2fa: true
    │  → console.warn("[Auth] 2FA gerekli — henüz implement edilmedi")
    │  → Kullanıcıya bilgi mesajı göster (ileride: 2FA doğrulama ekranı)
    │
    │  Durum B: requires_consent_renewal: true
    │  → console.warn("[Auth] Consent yenileme gerekli")
    │  → Normal akışa devam et (geçici çözüm)
    │
    │  Durum C: Normal başarılı giriş
    │
    ├─── GET get_session_user() ────────────────────────►
    ◄─── { logged_in, user {                           │
    │       email, full_name, roles,                    │
    │       is_admin, is_seller, is_buyer,              │
    │       has_seller_profile,                         │
    │       pending_seller_application,                 │
    │       seller_profile                              │
    │     } } ─────────────────────────────────────────┤
    │
    2. Rol bazlı yönlendirme matrisi uygula (Bölüm 7)
```

**Hata Durumları:**

| Nokta | Hata | Kullanıcı Mesajı |
|---|---|---|
| login | yanlış email/şifre | "Geçersiz email veya şifre." |
| login | hesap devre dışı | "Hesabınız devre dışı bırakılmış. Destek ile iletişime geçin." |
| login | rate limit (10/5dk) | "Çok fazla giriş denemesi. Lütfen birkaç dakika bekleyin." |

### 3d. Şifremi Unuttum Akışı (Email Link)

```
[Storefront]                                        [Backend]
    │
    EKRAN 1: ForgotPasswordPage (step: 'find-account')
    │
    1. Email gir, "Devam Et" tıkla
    │
    ├─── forgot_password(email) ────────────────────────►
    │                                     [email yok] → yine success döner
    │                                       (enumeration koruması)
    │                                     [email var] →
    │                                       reset_key üret (32 char hash)
    │                                       User.reset_password_key = reset_key
    │                                       User.last_reset_password_key_generated_on = now()
    │                                       Expiry: 24 saat
    │                                       Email gönder:
    │                                         link = {site_url}/pages/auth/
    │                                                reset-password.html?key={key}
    ◄─── { success, message } ─────────────────────────┤
    │      (her zaman success — enumeration koruması)
    │
    EKRAN 2: ForgotPasswordPage (step: 'link-sent')
    │
    → Başlık: "Email Gönderildi"
    → İçerik: "Şifre sıfırlama linki [maskelenmiş email] adresine
       gönderildi. Lütfen gelen kutunuzu kontrol edin."
    → "Giriş sayfasına dön" butonu
    → "Email gelmediyse tekrar gönderin" linki
       (forgot_password() tekrar çağrılır)
    │
    ══════ KULLANICI EMAIL'DEKİ LİNKE TIKLAR ══════
    │
    EKRAN 3: /pages/auth/reset-password.html?key=abc123...
    ResetPasswordPage bileşeni
    │
    2. URL'den key parametresini URLSearchParams ile oku
    │
    │  [key yoksa]
    │  → "Geçersiz şifre sıfırlama linki" uyarısı
    │  → forgot-password sayfasına yönlendir
    │
    3. Yeni şifre gir (birleşik kural seti: 8+ char, upper, lower, digit)
       Şifre kuralları göstergesi canlı güncellenir
    4. "Şifreyi Sıfırla" tıkla
    │
    ├─── reset_password(key, new_password) ─────────────►
    │                                     User bul: reset_password_key = key
    │                                     [bulunamadı] → "Geçersiz link"
    │                                     [24 saat dolmuş] → "Link süresi dolmuş"
    │                                     Şifre kurallarını kontrol et
    │                                     Şifreyi güncelle
    │                                     reset_password_key = null (tek kullanımlık)
    ◄─── { success, message } ─────────────────────────┤
    │
    5. Başarı mesajı göster: "Şifreniz başarıyla sıfırlandı"
    6. 2 saniye sonra login sayfasına yönlendir
```

**Hata Durumları:**

| Nokta | Hata | Kullanıcı Mesajı |
|---|---|---|
| forgot_password | her zaman | Her zaman success döner (email enumeration koruması) |
| forgot_password | rate limit (3/saat) | "Çok fazla istek. Lütfen bir süre bekleyin." |
| reset_password | geçersiz key | "Geçersiz veya süresi dolmuş şifre sıfırlama linki." |
| reset_password | 24 saat dolmuş | "Bu linkin süresi dolmuş. Lütfen yeni link isteyin." + forgot-password linki |
| reset_password | şifre kurallara uymaz | Backend şifre hata mesajları gösterilir |
| URL'de key yok | — | "Geçersiz şifre sıfırlama linki." + forgot-password sayfasına yönlendirme |

### 3e. Email Doğrulama Akışı (Kayıt Sonrası — Arka Plan)

```
[Backend — register_user() içinde]
    │
    1. Kayıt tamamlanır (User oluşturulur)
    2. _create_email_verification(email) çağrılır (MEVCUT MEKANİZMA)
    3. verification_key üretilir (32 char hash)
    4. Cache: email_verification:{key} = email, TTL 24 saat
    5. Email gönderilir:
       link = {site_url}/api/method/tr_tradehub.api.v1.identity.verify_email?key={key}
    │
    [Kullanıcı mail'deki linke tıklarsa]
    │
    6. verify_email(key) çağrılır
    7. Cache'den email bulunur
    8. User.email_verified = 1
    9. Cache key silinir
```

**Not:** Bu tamamen arka plan akışıdır. Kayıt OTP doğrulamasından BAĞIMSIZ çalışır. OTP → email sahipliğini kayıt anında doğrular. Email verification link → hesabın email doğrulama durumunu kaydeder. Storefront'ta "email'inizi doğrulayın" uyarı sayfası henüz kapsam dışıdır. İleride Buyer/Seller dashboard'da bir banner ile hatırlatma yapılabilir.

---

## 4. Yeni / Güncellenen Backend Endpoint'leri

### Yeni Endpoint: `send_registration_otp`

| Alan | Detay |
|---|---|
| **Fonksiyon** | `send_registration_otp(email)` |
| **Dosya** | `Frappe_Marketplace/frappe-bench/apps/tr_tradehub/tr_tradehub/api/v1/identity.py` |
| **Dekoratör** | `@frappe.whitelist(allow_guest=True)` |
| **HTTP** | `POST /api/method/tr_tradehub.api.v1.identity.send_registration_otp` |
| **Payload** | `{ email: str }` |
| **Başarılı Response** | `{ success: true, expires_in_minutes: 10 }` |
| **Rate Limit** | `verification` kategorisi: 5 istek / 5 dakika / IP |

**İş Mantığı:**
1. Email format doğrulama (`validate_email_format()` — mevcut yardımcı fonksiyon)
2. `frappe.db.exists("User", email)` kontrolü — varsa hata: `"Bu email ile kayıtlı hesap var."`
3. 6 haneli rastgele OTP kodu üret: `"".join([str(secrets.randbelow(10)) for _ in range(6)])`
4. Redis cache'e kaydet (aynı email için önceki OTP varsa üstüne yazar):
   - Key: `registration_otp:{email}`
   - Value: `{"code": "123456", "attempts": 0}`
   - TTL: 600 saniye (10 dakika)
5. `frappe.sendmail()` ile OTP'yi gönder
   - Konu: "iSTOC — Kayıt Doğrulama Kodu"
   - İçerik: "Doğrulama kodunuz: {code}. Bu kod 10 dakika geçerlidir."

**Hata Kodları:**

| Durum | HTTP | Mesaj |
|---|---|---|
| Geçersiz email formatı | 400 | "Lütfen geçerli bir email adresi girin." |
| Email zaten kayıtlı | 409 | "Bu email ile kayıtlı hesap var." |
| Rate limit aşımı | 429 | "Çok fazla istek. Lütfen birkaç dakika bekleyin." |

**Neden ayrı endpoint:** `check_email_exists` ve OTP gönderimini tek endpoint'te birleştirmek, email kontrolünü bağımsız kullanma esnekliğini ortadan kaldırır. İki ayrı endpoint, storefront'a daha anlamlı hata mesajları gösterme imkanı verir.

### Yeni Endpoint: `verify_registration_otp`

| Alan | Detay |
|---|---|
| **Fonksiyon** | `verify_registration_otp(email, code)` |
| **Dosya** | `identity.py` |
| **Dekoratör** | `@frappe.whitelist(allow_guest=True)` |
| **HTTP** | `POST /api/method/tr_tradehub.api.v1.identity.verify_registration_otp` |
| **Payload** | `{ email: str, code: str }` |
| **Başarılı Response** | `{ success: true, registration_token: "a1b2c3..." }` |
| **Rate Limit** | `verification` kategorisi: 5 istek / 5 dakika / IP |

**İş Mantığı:**
1. Cache'den `registration_otp:{email}` oku
2. Bulunamazsa → hata: "Doğrulama kodu bulunamadı veya süresi dolmuş."
3. `attempts` değerini kontrol et:
   - `attempts >= 5` → OTP cache key'ini sil → hata: "Çok fazla yanlış deneme. Lütfen yeni kod isteyin."
4. Kodu karşılaştır:
   - Eşleşmiyorsa → `attempts` artır, cache güncelle → hata: "Yanlış doğrulama kodu."
5. Eşleşiyorsa:
   - `registration_token = frappe.generate_hash(length=32)` üret
   - Cache'e kaydet: `registration_token:{token}` = email, TTL 1800sn (30dk)
   - OTP cache key'ini sil (tek kullanımlık)
   - Token'ı döndür

**Hata Kodları:**

| Durum | HTTP | Mesaj |
|---|---|---|
| OTP bulunamadı / süresi dolmuş | 404 | "Doğrulama kodu bulunamadı veya süresi dolmuş." |
| Yanlış kod | 401 | "Yanlış doğrulama kodu." |
| 5+ başarısız deneme | 429 | "Çok fazla yanlış deneme. Lütfen yeni kod isteyin." |
| Rate limit aşımı | 429 | "Çok fazla istek. Lütfen birkaç dakika bekleyin." |

**Cache Stratejisi (Özet):**

| Cache Key | Value | TTL | Tek Kullanım |
|---|---|---|---|
| `registration_otp:{email}` | `{code, attempts}` | 600sn (10dk) | Doğrulama veya 5 hatalı deneme sonrası silinir |
| `registration_token:{token}` | `email` | 1800sn (30dk) | `register_user()` başarılı olunca silinir |

### Güncellenen Endpoint: `register_user`

| Alan | Detay |
|---|---|
| **Dosya** | `identity.py` |
| **Değişiklik** | `registration_token` parametresi eklenir (zorunlu) |

**Eklenen İş Mantığı (mevcut validasyonlardan SONRA):**
1. `cache_key = f"registration_token:{registration_token}"` oluştur
2. `cached_email = frappe.cache().get_value(cache_key)` oku
3. `cached_email` yoksa → hata: "Geçersiz veya süresi dolmuş doğrulama token'ı. Lütfen kaydı baştan başlatın."
4. `cached_email != email` ise → hata: "Doğrulama token'ı bu email ile eşleşmiyor."
5. Başarılı kayıt sonrası: `frappe.cache().delete_value(cache_key)` (tek kullanımlık)

**Neden token zorunlu:** OTP doğrulanmamış kayıtları engellemek için. Token olmadan `register_user()` çağrısı başarısız olmalı — bu, bot kayıtlarını ve OTP bypass girişimlerini engeller.

### Değişmeyen Endpoint'ler (Referans)

| Endpoint | Dosya | Neden Değişmez |
|---|---|---|
| `forgot_password(email)` | identity.py | Karar 2 gereği: mevcut email link sistemi korunacak. Zaten enumeration koruması ve rate limiting mevcut. |
| `reset_password(key, new_password)` | identity.py | Karar 2 gereği: mevcut key tabanlı mekanizma yeterli ve güvenli. 24 saat expiry, tek kullanımlık. |
| `check_email_exists(email)` | auth.py | Mevcut haliyle kayıt akışında kullanılacak. Değişiklik gerektirmiyor. |
| `get_session_user()` | auth.py | Mevcut haliyle yeterli. Tüm gerekli alanlar (is_buyer, is_seller, has_seller_profile, pending_seller_application) zaten dönüyor. |
| `verify_email(key)` | identity.py | Arka plan email doğrulama olarak korunacak. Kayıt OTP akışından bağımsız. |
| `login(usr, pwd, device_id, remember_me)` | identity.py | Mevcut haliyle korunacak. Storefront tarafında response handling güncellenecek. |
| `change_password(current_password, new_password)` | identity.py | Mevcut haliyle korunacak. |

---

## 5. Storefront Değişiklik Planı

### 5a. Yeni Oluşturulacak Dosyalar

#### 1. `tradehubfront/pages/auth/reset-password.html`

| Alan | Detay |
|---|---|
| **Amaç** | Şifre sıfırlama landing sayfası HTML entry point'i |
| **UI Öğeleri** | Standart HTML yapısı (login.html pattern'i takip eder) |
| **Çağırdığı Script** | `src/pages/reset-password.ts` |
| **Neden** | Kullanıcı email'deki şifre sıfırlama linkine tıkladığında bu sayfaya gelir. URL'de `?key=...` parametresi bulunur. Mevcut forgot-password.html bu amaç için uygun değil çünkü farklı bir akış barındırıyor. |

#### 2. `tradehubfront/src/pages/reset-password.ts`

| Alan | Detay |
|---|---|
| **Amaç** | Reset password sayfası entry point (TypeScript) |
| **UI Öğeleri** | `AuthLayout` içinde `ResetPasswordPage` bileşeni render eder |
| **İş Mantığı** | URL'den `key` parametresini `new URLSearchParams(window.location.search).get('key')` ile okur. Key yoksa hata gösterir ve forgot-password'a yönlendirir. |
| **Çağırdığı Endpoint** | `reset_password(key, new_password)` |
| **Neden** | Ayrı entry point, Vite'ın multi-page build yapısıyla uyumlu. Mevcut sayfa dosyalarıyla aynı pattern. |

#### 3. `tradehubfront/src/components/auth/ResetPasswordPage.ts`

| Alan | Detay |
|---|---|
| **Amaç** | Yeni şifre formu UI bileşeni |
| **UI Öğeleri** | Başlık ("Yeni Şifre Belirleyin"), şifre input (toggle göster/gizle), şifre kuralları göstergesi (canlı güncelleme), "Şifreyi Sıfırla" butonu, hata/başarı mesajları |
| **Dışa Aktarım** | `ResetPasswordPage(key: string): string` (HTML template) + `initResetPasswordPage(options): void` (Alpine init) |
| **Çağırdığı Endpoint** | `resetPassword(key, newPassword)` (`utils/auth.ts`'den) |
| **Şifre Doğrulama** | `password-validation.ts`'den `validatePassword()` ve `isPasswordValid()` import eder |
| **Pattern** | `ForgotPasswordPage.ts`'nin header + card layout'unu takip eder (AuthLayout ile tutarlılık) |
| **Neden** | Mevcut ForgotPasswordPage'e eklemek yerine ayrı bileşen, çünkü: (a) farklı URL ve entry point gerekli (?key= parametresi), (b) sorumluluk ayrımı (forgot = email gir, reset = şifre gir). |

#### 4. `tradehubfront/src/utils/password-validation.ts`

| Alan | Detay |
|---|---|
| **Amaç** | Merkezi şifre doğrulama fonksiyonları |
| **Dışa Aktarım** | `validatePassword(password): PasswordValidation` + `isPasswordValid(password): boolean` |
| **Kurallar** | 8+ karakter, 1+ büyük harf (`/[A-Z]/`), 1+ küçük harf (`/[a-z]/`), 1+ rakam (`/[0-9]/`) |
| **Tüketici Dosyalar** | `AccountSetupForm.ts`, `SupplierSetupForm.ts`, `ResetPasswordPage.ts`, `SettingsChangePassword.ts` |
| **Neden** | Şu anda `AccountSetupForm.ts` içinde tanımlı `validatePassword()` fonksiyonu doğru kuralları uyguluyor ancak sadece o dosyadan erişilebilir. Merkezi dosya, tüm ekranlarda tutarlı kuralları garanti eder. İleride backend'de `require_special` aktif edilirse tek bir yerde değişiklik yeterli olur. |

### 5b. Güncellenecek Dosyalar

#### 1. `tradehubfront/src/alpine/auth.ts`

**Mevcut Davranış (registerPage):**
- `submitEmail()`: Sadece client-side email regex doğrulama yapıp OTP adımına geçiyor. Backend'e hiçbir çağrı yok.
- OTP doğrulama: 6 hane girilince direkt setup adımına geçiyor.
- Setup adımı: `register()` çağrısında `registration_token` yok.

**Yeni Davranış (registerPage):**
- `registration_token: string` state değişkeni eklenir (Alpine reactive)
- `submitEmail()`:
  1. Email regex doğrulama (mevcut, korunur)
  2. Loading state göster
  3. `checkEmailExists(email)` çağır → exists: true ise hata göster ve dur
  4. `sendRegistrationOtp(email)` çağır → başarılıysa `goToStep('otp')`
  5. Rate limit hatası → toast ile "Çok fazla istek" göster
  6. Loading state kapat
- OTP onComplete callback'i: `verifyRegistrationOtp(email, code)` çağırır → başarılıysa `registration_token` kaydeder → `goToStep('setup')`
- OTP onResend callback'i: `sendRegistrationOtp(email)` çağırır
- Setup onSubmit (buyer ve supplier): `register()` çağrısına `registration_token` eklenir

**Mevcut Davranış (forgotPasswordPage):**
- 3 adımlı: `find-account` → `verify-code` → `reset-password`
- `submitFindAccount()`: Backend'e çağrı yapmıyor, direkt adım değiştiriyor
- `submitReset()`: Backend'e çağrı yapmıyor, toast gösterip login'e yönlendiriyor
- OTP state'leri: `otp[]`, `countdown`, `otpError`, vb.

**Yeni Davranış (forgotPasswordPage):**
- 2 adımlı: `find-account` → `link-sent`
- `submitFindAccount()`:
  1. Email trim + doğrulama
  2. Loading state
  3. `forgotPassword(email)` çağır (yeni `utils/auth.ts` fonksiyonu)
  4. Her zaman success → `step = 'link-sent'`
  5. Rate limit hatası → toast göster
- `resendLink()`: `forgotPassword(email)` tekrar çağır, toast: "Link tekrar gönderildi"
- **Kaldırılacaklar:** `otp[]`, `countdown`, `otpError`, `handleOtpInput`, `handleOtpPaste`, `handleOtpKeydown`, `resendCode`, `startCountdown`, `stopCountdown`, `validatePassword`, `reqLength`, `reqChars`, `reqEmoji`, `showPassword`, `passwordValid`, `submitReset`, `reqStyle` — tümü artık gereksiz

#### 2. `tradehubfront/src/components/auth/EmailVerification.ts`

**Mevcut Davranış:**
- `onComplete` callback: 6 hane girilince direkt tetiklenir (backend çağrısı yok)
- `onResend` callback: Boş placeholder (`// In production, resend OTP via backend`)
- 60 saniye geri sayım timer'ı mevcut

**Yeni Davranış:**
- `initEmailVerification` options'a yeni callback eklenir: `onVerify?: (otp: string) => Promise<void>`
- `onComplete` tetiklendiğinde (6 hane girilince):
  - Loading state göster (inputları disable et)
  - `onVerify(otp)` çağır (bu callback alpine/auth.ts tarafında sağlanır, `verifyRegistrationOtp()` çağrısını yapar)
  - Başarılıysa → üst bileşen (`alpine/auth.ts`) `goToStep('setup')` tetikler
  - Başarısızsa → OTP inputları temizlenir, hata mesajı gösterilir, loading kalkar
- `onResend` callback'i artık fonksiyonel: alpine/auth.ts tarafında `sendRegistrationOtp(email)` çağrısı sağlanır

**Not:** EmailVerification.ts bileşeninin kendisi API çağrısı yapmaz — callback pattern'i korunur. Bu, bileşenin ileride başka akışlarda da (ör. telefon doğrulama) kullanılabilmesini sağlar.

#### 3. `tradehubfront/src/components/auth/ForgotPasswordPage.ts`

**Mevcut Davranış:**
- 3 adım UI: `StepFindAccount()` → `StepVerifyCode()` → `StepResetPassword()`
- `ForgotPasswordStep` type: `'find-account' | 'verify-code' | 'reset-password'`
- Şifre kuralları (6-20 char, 2+ tür, emoji yasak) — backend ile uyumsuz

**Yeni Davranış:**
- 2 adım UI: `StepFindAccount()` → `StepLinkSent()`
- `ForgotPasswordStep` type güncellenir: `'find-account' | 'link-sent'`
- **Kaldırılacak fonksiyonlar:** `StepVerifyCode()`, `StepResetPassword()`
- **Yeni fonksiyon:** `StepLinkSent()`:
  - Başlık: "Email Gönderildi"
  - Açıklama: "Şifre sıfırlama linki **{maskelenmiş email}** adresine gönderildi. Lütfen gelen kutunuzu kontrol edin."
  - "Giriş sayfasına dön" butonu → `/pages/auth/login.html`
  - "Email gelmediyse tekrar gönderin" linki → `resendLink()` çağırır
- Şifre kuralları, şifre inputu ve ilgili validasyon fonksiyonları tamamen kaldırılır (artık bu sayfada şifre girişi yok)

#### 4. `tradehubfront/src/utils/auth.ts`

**Mevcut Davranış:**
- `login()`: Response body'yi kontrol etmiyor, direkt `getSessionUser()` çağırıyor
- `register()`: `registration_token` parametresi yok
- OTP veya forgot password ile ilgili fonksiyon yok

**Yeni Davranış:**
- `login()` fonksiyonuna eklenen kontrol:
  - Response body'yi parse et
  - `requires_2fa: true` → `console.warn('[Auth] 2FA gerekli — henüz implement edilmedi', response)` + Error fırlatarak üst katmana bildir
  - `requires_consent_renewal: true` → `console.warn('[Auth] Consent yenileme gerekli', response)` + normal akışa devam (geçici)
- `register()` fonksiyonuna `registration_token: string` parametresi eklenir, API body'ye dahil edilir
- **Yeni fonksiyonlar:**
  - `sendRegistrationOtp(email: string): Promise<{success: boolean, expires_in_minutes: number}>` — `POST /api/method/tr_tradehub.api.v1.identity.send_registration_otp`
  - `verifyRegistrationOtp(email: string, code: string): Promise<{success: boolean, registration_token: string}>` — `POST /api/method/tr_tradehub.api.v1.identity.verify_registration_otp`
  - `forgotPassword(email: string): Promise<{success: boolean, message: string}>` — `POST /api/method/tr_tradehub.api.v1.identity.forgot_password`
  - `resetPassword(key: string, newPassword: string): Promise<{success: boolean, message: string}>` — `POST /api/method/tr_tradehub.api.v1.identity.reset_password`

#### 5. `tradehubfront/src/components/auth/AccountSetupForm.ts`

**Mevcut Davranış:** `onSubmit` callback'inde `register()` çağrısı `registration_token` içermiyor.

**Yeni Davranış:** Bileşenin kendisi değişmez. Değişiklik `alpine/auth.ts`'deki buyer `onSubmit` callback'inde yapılır: `register()` çağrısına `registration_token` state değişkeni eklenir. `validatePassword()` ve `isPasswordValid()` fonksiyonları `password-validation.ts`'den import edilir (mevcut inline tanım kaldırılır).

#### 6. `tradehubfront/src/components/auth/SupplierSetupForm.ts`

**Mevcut Davranış:** `onSubmit` callback'inde `register()` çağrısı `registration_token` içermiyor.

**Yeni Davranış:** Bileşenin kendisi değişmez. Değişiklik `alpine/auth.ts`'deki supplier `onSubmit` callback'inde yapılır: `register()` çağrısına `registration_token` state değişkeni eklenir.

#### 7. `tradehubfront/src/utils/auth.ts` — `login()` response handling

(Yukarıda detaylandırıldı — `requires_2fa` ve `requires_consent_renewal` kontrolü.)

#### 8. `tradehubfront/src/components/settings/SettingsChangePassword.ts`

**Mevcut Davranış:** Kendi şifre doğrulama kuralları olabilir.

**Yeni Davranış:** Birleşik şifre kural setini kullanmalı — `password-validation.ts`'den `validatePassword()` ve `isPasswordValid()` import eder. Mevcut inline şifre doğrulama varsa kaldırılır.

### 5c. Değişmeyecek Dosyalar

| Dosya | Neden Değişmez |
|---|---|
| `src/components/auth/LoginPage.ts` | Login formu UI'ı değişmiyor. Email + şifre input'ları aynı kalıyor. Login response handling `utils/auth.ts`'de ve `alpine/auth.ts`'de yapılıyor, LoginPage sadece UI render eder. |
| `src/components/auth/AccountTypeSelector.ts` | Buyer/Supplier seçim kartları değişmiyor. Mevcut `buyer` \| `supplier` değerleri korunuyor. |
| `src/components/auth/RegisterPage.ts` | Multi-step kayıt sayfasının HTML iskelet yapısı değişmiyor. Adımlar aynı kalıyor (account-type → email → otp → setup). İş mantığı `alpine/auth.ts`'de. |
| `src/components/auth/AuthLayout.ts` | Auth sayfaları ortak düzeni (split-screen desktop, mobile card) değişmiyor. Yeni `ResetPasswordPage` de bu layout'u kullanacak. |
| `src/components/auth/SocialLoginButtons.ts` | SSO/sosyal giriş bu fazın kapsamı dışında. Mevcut UI korunur. |
| `src/utils/auth-guard.ts` | Mevcut guard'lar (`requireAuth`, `requireSeller`, `blockAdmin`) yeterli. `getRedirectUrl()` fonksiyonu zaten doğru matrisi uyguluyor. İleride `requireEmailVerified()` eklenebilir ama şu an kapsam dışı. |
| `src/utils/api.ts` | Genel API wrapper. Auth'a özgü değişiklik yok. |
| `src/pages/login.ts` | Login sayfa entry point değişmiyor. |
| `src/pages/register.ts` | Register sayfa entry point değişmiyor. |
| `src/pages/forgot-password.ts` | Forgot password entry point değişmiyor. ForgotPasswordPage bileşeni içten değişir ama bu dosya aynı kalır. |
| `pages/auth/login.html` | HTML entry point değişmiyor. |
| `pages/auth/register.html` | HTML entry point değişmiyor. |
| `pages/auth/forgot-password.html` | HTML entry point değişmiyor. |

---

## 6. Şifre Politikası (Birleşik)

### Tek Kural Seti (Backend Standardı)

| Kural | Açıklama | Regex / Kontrol |
|---|---|---|
| Minimum uzunluk | 8 karakter | `password.length >= 8` |
| Büyük harf | En az 1 büyük harf | `/[A-Z]/.test(password)` |
| Küçük harf | En az 1 küçük harf | `/[a-z]/.test(password)` |
| Rakam | En az 1 rakam | `/[0-9]/.test(password)` |
| Özel karakter | Opsiyonel (zorunlu değil) | — |

**Kaynak:** Backend `identity.py` → `PASSWORD_MIN_LENGTH = 8`, `require_uppercase = True`, `require_lowercase = True`, `require_digit = True`, `require_special = False`.

### Mevcut Durum ve Gerekli Değişiklikler

| Ekran | Mevcut Kurallar | Yeni Kurallar | Değişiklik |
|---|---|---|---|
| Buyer kayıt (`AccountSetupForm.ts`) | 8+ char, upper, lower, digit | 8+ char, upper, lower, digit | YOK (zaten doğru) — fonksiyonlar `password-validation.ts`'ye taşınır |
| Supplier kayıt (`SupplierSetupForm.ts`) | AccountSetupForm'dan kopyalanmış | Aynı | `password-validation.ts`'den import edilir |
| Şifremi unuttum (`ForgotPasswordPage.ts`) | 6-20 char, 2+ tür, emoji yasak | — | KALDIRILIR (bu sayfada artık şifre girişi yok) |
| Şifre sıfırlama (`ResetPasswordPage.ts`) | Yeni dosya | 8+ char, upper, lower, digit | YENİ: `password-validation.ts`'den import |
| Şifre değiştirme (`SettingsChangePassword.ts`) | Kontrol edilecek | 8+ char, upper, lower, digit | GÜNCELLENİR: `password-validation.ts`'den import |

### Merkezi Doğrulama Fonksiyonu

**Dosya:** `tradehubfront/src/utils/password-validation.ts`

```typescript
// Tip tanımı
interface PasswordValidation {
  minLength: boolean;    // 8+ karakter
  hasUppercase: boolean; // A-Z
  hasLowercase: boolean; // a-z
  hasNumber: boolean;    // 0-9
}

// Ana doğrulama fonksiyonu
function validatePassword(password: string): PasswordValidation

// Tüm kurallar sağlanıyor mu?
function isPasswordValid(password: string): boolean
```

**Neden merkezi:** Tek bir yerde değişiklik yapmak tüm ekranları etkiler. İleride backend'de `require_special = True` yapılırsa sadece `password-validation.ts` dosyası güncellenir. Ayrıca, şu anki durumda `ForgotPasswordPage.ts`'deki farklı kurallar (6-20 char, 2+ tür) gibi tutarsızlıklar bir daha oluşamaz.

---

## 7. Role Bazlı Yönlendirme Matrisi

### `get_session_user()` Response Alanları

```json
{
  "logged_in": true,
  "user": {
    "email": "user@example.com",
    "full_name": "Ad Soyad",
    "roles": ["Buyer", "Seller"],
    "is_admin": false,
    "is_seller": true,
    "is_buyer": true,
    "has_seller_profile": true,
    "pending_seller_application": false,
    "seller_profile": "SP-00001"
  }
}
```

### Yönlendirme Matrisi

| # | Kullanıcı Durumu | is_admin | is_buyer | is_seller | has_seller_profile | pending_seller_application | Yönlendirme |
|---|---|---|---|---|---|---|---|
| 1 | Admin | `true` | * | * | * | * | `{FRAPPE_BASE}/app/tradehub` |
| 2 | Aktif Seller (profilli) | `false` | `true` | `true` | `true` | `false` | `VITE_SELLER_PANEL_URL` |
| 3 | Onay bekleyen Seller | `false` | `true` | `false` | `false` | `true` | `/pages/seller/application-pending.html` |
| 4 | Normal Buyer | `false` | `true` | `false` | `false` | `false` | `/` (ana sayfa) |
| 5 | Guest (oturum yok) | — | — | — | — | — | `/pages/auth/login.html` |

**Öncelik sırası:** Admin > Seller (profilli) > Seller (pending) > Buyer > Guest

### Mevcut `getRedirectUrl()` Fonksiyonu (auth.ts)

```typescript
export function getRedirectUrl(user: AuthUser): string {
  if (user.is_admin) return `${FRAPPE_BASE}/app/tradehub`;
  if (user.is_seller && user.has_seller_profile)
    return import.meta.env.VITE_SELLER_PANEL_URL ?? 'http://localhost:8082/';
  if (user.pending_seller_application)
    return '/pages/seller/application-pending.html';
  return '/';
}
```

Bu fonksiyon yukarıdaki matrisi zaten doğru şekilde uyguluyor. **Değişiklik gerekmiyor.**

### `auth-guard.ts` Durumu

Mevcut guard'lar:

| Guard | Davranış | Değişiklik |
|---|---|---|
| `requireAuth()` | Oturum yoksa → login sayfasına yönlendir | YOK |
| `requireSeller()` | Oturum yoksa → login; pending ise → application-pending; seller değilse → home | YOK |
| `blockAdmin()` | Admin ise → Frappe Desk'e yönlendir | YOK |

**Değişiklik gerekmiyor.** Mevcut guard'lar yeterli. İleride eklenebilecek guard'lar (kapsam dışı):
- `requireEmailVerified()` — email doğrulama zorunlu sayfalar için
- `require2FA()` — 2FA zorunluluğu olan sayfalar için
- `requireConsentValid()` — KVKK consent durumu kontrolü

---

## 8. Güvenlik Notları

### 1. OTP Brute-Force Koruması

| Parametre | Değer | Neden |
|---|---|---|
| **Maksimum yanlış deneme** | 5 | 6 haneli OTP için 10^6 olası kombinasyon var. 5 denemeyle kaba kuvvet saldırısı pratikte imkansız (5/1.000.000 = %0.0005 başarı şansı). |
| **Deneme aşıldıktan sonra** | OTP geçersiz sayılır (cache key silinir) | Saldırganın mevcut OTP'yi denemeye devam etmesi engellenir. |
| **Yeni OTP gönderme** | Kullanıcı "Tekrar Gönder" butonu ile yeni kod alabilir | Meşru kullanıcı deneyimi korunur. |
| **send_registration_otp rate limit** | 5 istek / 5 dakika / IP | Aynı IP'den OTP spam'i önlenir. |
| **verify_registration_otp rate limit** | 5 istek / 5 dakika / IP | Mevcut `verification` rate limit kategorisi kullanılır. |

**Uygulama mekanizması:**
- Her yanlış denemede `attempts` sayacı artırılır ve cache güncellenir
- 5. yanlış denemede cache key tamamen silinir (OTP geçersiz olur)
- Kullanıcı ancak yeni OTP talep ederek devam edebilir
- Yeni OTP gönderimi de rate limit'e tabi (5/5dk)

### 2. registration_token Saklama

| Parametre | Değer | Neden |
|---|---|---|
| **Saklama yeri** | Frappe cache (Redis) — sunucu tarafı | Token sadece sunucuda doğrulanır. Client tarafında sadece opak string saklanır. |
| **TTL** | 1800 saniye (30 dakika) | Kullanıcının kayıt formunu doldurması için yeterli süre. Supplier formunun 4 alt adımı düşünüldüğünde 10dk az olabilir. |
| **Format** | `frappe.generate_hash(length=32)` — 32 karakter hex hash | 16^32 = 3.4×10^38 olası kombinasyon. Tahmin edilemez. |
| **Tek kullanımlık** | Evet — `register_user()` başarılı olunca cache'den silinir | Aynı token ile birden fazla hesap açılması engellenir. |
| **Email eşleştirme** | Token value'su = email adresi. `register_user()`'da email eşleşmesi kontrol edilir | Bir kullanıcının OTP doğrulamasıyla alınan token'ın başka bir email için kullanılması engellenir. |
| **Storefront'ta saklama** | Alpine.js reactive state (bellekte) | `localStorage` veya `sessionStorage` kullanılmaz (XSS riski). Sayfa yenilenirse token kaybolur → kullanıcı kaydı baştan başlatır (kabul edilebilir UX). |

### 3. reset_password Key Süresi

| Parametre | Değer | Kaynak |
|---|---|---|
| **Geçerlilik süresi** | 24 saat (86400 saniye) | identity.py: `key_age.total_seconds() > 86400` kontrolü |
| **Saklama yeri** | `User.reset_password_key` field'i (veritabanı) | identity.py: `user.reset_password_key = reset_key` |
| **Zaman damgası** | `User.last_reset_password_key_generated_on` | Expiry hesaplamasında kullanılır |
| **Tek kullanımlık** | **Evet** | `reset_password()` başarılı olunca `reset_password_key = None` yapılır |

**Mekanizma:** `forgot_password()` çağrıldığında `frappe.generate_hash(length=32)` ile key üretilir, User doc'a yazılır ve email ile gönderilir. `reset_password()` çağrıldığında key bulunur, 24 saat kontrolü yapılır, şifre güncellenir ve key null'a çevrilir. Aynı key ile ikinci kullanım mümkün değildir.

### 4. HTTPS Zorunluluğu

| Konu | Çözüm |
|---|---|
| **Reset link URL'i** | `frappe.utils.get_url()` fonksiyonu `site_config.json`'daki `host_name` değerini kullanır. Production'da bu değer `https://` ile başlamalı. |
| **Ek kontrol önerisi** | `forgot_password()` içinde `reset_url = get_url(...)` zaten bu mekanizmayı kullanıyor. Ek güvenlik: `if not reset_url.startswith("https") and not frappe.conf.developer_mode: frappe.log_error("Reset URL is not HTTPS")` |
| **HSTS Header** | Reverse proxy (nginx) seviyesinde `Strict-Transport-Security: max-age=31536000; includeSubDomains` header'ı zorunlu. |
| **Cookie güvenliği** | Frappe session cookie `Secure` ve `HttpOnly` flag'leri ile set edilmeli. Frappe'nin varsayılan davranışı bunu sağlar (production'da `http_only_cookie = True`). |

### 5. Email Enumeration Koruması

| Endpoint | Mevcut Koruma | Durum |
|---|---|---|
| `forgot_password()` | Her zaman `success: true` döner, email var/yok ayrımı yapmaz | KORUNUYOR |
| `check_email_exists()` | `{ exists: true/false }` döner | RİSK — kayıt akışında gerekli ancak saldırgan da kullanabilir |
| `send_registration_otp()` | Email kayıtlıysa hata döner | RİSK — tasarım gereği |

**Azaltma stratejisi:**
- Her iki riskli endpoint için rate limiting uygulanır (5/5dk/IP)
- `check_email_exists()` zaten mevcut rate limit'e tabi
- `send_registration_otp()` → `verification` rate limit kategorisi
- Ek olarak, response süreleri sabit tutulmalı (timing attack önlemi): email var olsa da olmasa da aynı sürede yanıt dönülmeli. Bu `send_registration_otp()` için önemli — email kayıtlıysa hızlı hata dönmek yerine, olmayan email'e de aynı sürede yanıt verilmeli (veya kısa bir `time.sleep()` eklenebilir).

---

## 9. Uygulama Öncelik Sırası

| Öncelik | Görev | Dosya(lar) | Bağımlılık | Açıklama |
|---|---|---|---|---|
| **P0** | Backend: `send_registration_otp()` + `verify_registration_otp()` endpoint'leri | `identity.py` | Yok | Yeni endpoint'ler. OTP üretim, cache, email gönderim, doğrulama mantığı. |
| **P0** | Backend: `register_user()` token kontrolü | `identity.py` | P0 endpoint'leri | `registration_token` parametresi ve cache doğrulama eklenir. |
| **P1** | Storefront: `utils/auth.ts` yeni API fonksiyonları | `utils/auth.ts` | P0 backend | `sendRegistrationOtp`, `verifyRegistrationOtp`, `forgotPassword`, `resetPassword` fonksiyonları + `register()` token parametresi + `login()` response handling. |
| **P1** | Storefront: `password-validation.ts` merkezi fonksiyon | `utils/password-validation.ts` (yeni) | Yok | `validatePassword()` ve `isPasswordValid()` merkezi dosyaya taşınır. |
| **P2** | Storefront: `alpine/auth.ts` kayıt akışı güncelleme | `alpine/auth.ts` | P1 | `registerPage.submitEmail()` → `check_email_exists` + `send_registration_otp`. OTP callback'leri. `registration_token` state. |
| **P2** | Storefront: `ForgotPasswordPage.ts` 2-adım akışı | `ForgotPasswordPage.ts` + `alpine/auth.ts` | P1 | OTP adımları kaldırılır, "link gönderildi" bilgi ekranı eklenir. |
| **P3** | Storefront: Reset password sayfası | `reset-password.html` + `ResetPasswordPage.ts` + `reset-password.ts` (3 yeni dosya) | P1 | URL'den key okuma, şifre formu, `reset_password()` çağrısı. |
| **P3** | Storefront: Login response handling | `alpine/auth.ts` (loginPage kısmı) | Yok | `requires_2fa` ve `requires_consent_renewal` console.warn ile loglanır. |
| **P4** | Storefront: `SettingsChangePassword.ts` şifre kuralı uyumu | `SettingsChangePassword.ts` | P1 | Birleşik şifre kurallarını `password-validation.ts`'den import eder. |
| **P4** | Storefront: `EmailVerification.ts` callback güncellemesi | `EmailVerification.ts` | P2 | `onVerify` callback eklenir, loading/error state'leri. |

---

_Bu doküman `auth-sistemi-var-olanlar.md` analizi baz alınarak hazırlanmıştır. Tüm tasarım kararları Frappe'nin built-in user/role sistemi üzerine inşa edilmiştir._
