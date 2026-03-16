# Auth Sistemi — Mevcut Durum Analizi

_Tarih: 2026-03-16_

---

## 1. Storefront Auth Bileşenleri

### 1.1 Dosya Envanteri

| Dosya Yolu | Açıklama |
|---|---|
| `tradehubfront/src/pages/login.ts` | Login sayfa entry |
| `tradehubfront/src/pages/register.ts` | Register sayfa entry |
| `tradehubfront/src/pages/forgot-password.ts` | Şifre sıfırlama sayfa entry |
| `tradehubfront/src/components/auth/LoginPage.ts` | Login formu bileşeni |
| `tradehubfront/src/components/auth/RegisterPage.ts` | Kayıt akışı ana bileşeni |
| `tradehubfront/src/components/auth/ForgotPasswordPage.ts` | Şifre sıfırlama bileşeni |
| `tradehubfront/src/components/auth/AccountTypeSelector.ts` | Buyer/Supplier seçim kartları |
| `tradehubfront/src/components/auth/EmailVerification.ts` | 6 haneli OTP doğrulama bileşeni |
| `tradehubfront/src/components/auth/AccountSetupForm.ts` | Buyer kayıt formu (adım 4) |
| `tradehubfront/src/components/auth/SupplierSetupForm.ts` | Supplier kayıt formu (4 iç adım) |
| `tradehubfront/src/components/auth/AuthLayout.ts` | Auth sayfa düzeni |
| `tradehubfront/src/components/auth/SocialLoginButtons.ts` | Sosyal giriş butonları |
| `tradehubfront/src/alpine/auth.ts` | Alpine.js `registerPage` + `forgotPasswordPage` data |
| `tradehubfront/src/utils/auth.ts` | Auth API yardımcı fonksiyonları |
| `tradehubfront/src/utils/auth-guard.ts` | Route guard'ları |
| `tradehubfront/src/utils/api.ts` | Genel API wrapper |
| `tradehubfront/src/components/settings/SettingsChangePassword.ts` | Ayarlar şifre değiştirme |
| `tradehubfront/pages/auth/login.html` | Login HTML entry |
| `tradehubfront/pages/auth/register.html` | Register HTML entry |
| `tradehubfront/pages/auth/forgot-password.html` | Forgot password HTML entry |

### 1.2 Login Sayfası

| Alan | Detay |
|---|---|
| **Dosya** | `src/components/auth/LoginPage.ts` + `src/alpine/auth.ts` |
| **Form Field'lar** | `email` (type=email, required), `password` (type=password, required) |
| **API Çağrıları** | `POST /api/method/login` → `{ usr, pwd }` |
| | `GET /api/method/tr_tradehub.api.v1.auth.get_session_user` |
| **Yönlendirme** | Admin → `/app/tradehub`, Seller (profilli) → VITE_SELLER_PANEL_URL, Pending seller → `/pages/seller/application-pending.html`, Buyer → `/` |
| **Validasyon** | Email format + password zorunlu |
| **Eksikler** | SSO/Keycloak login butonu UI'da yok, 2FA akışı yok, "beni hatırla" yok |

### 1.3 Kayıt Sayfası (Multi-Step)

**Akış:** Hesap Tipi Seçimi → Email Girişi → OTP Doğrulama → Hesap Kurulumu

#### Adım 1: Hesap Tipi Seçimi

| Alan | Detay |
|---|---|
| **Dosya** | `src/components/auth/AccountTypeSelector.ts` |
| **Form Field'lar** | `accountType`: `buyer` \| `supplier` (radio kartlar) |
| **API Çağrıları** | Yok |

#### Adım 2: Email Girişi

| Alan | Detay |
|---|---|
| **Dosya** | `src/alpine/auth.ts` (registerPage.submitEmail) |
| **Form Field'lar** | `email` (type=email, required) |
| **Validasyon** | Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| **API Çağrıları** | Yok — **backend'e email doğrulama isteği gönderilmiyor** |
| **Eksikler** | `check_email_exists` endpoint'i çağrılmıyor, OTP gönderim API çağrısı yok |

#### Adım 3: OTP Doğrulama

| Alan | Detay |
|---|---|
| **Dosya** | `src/components/auth/EmailVerification.ts` |
| **Form Field'lar** | 6 adet tek haneli OTP input (id: otp-input-0..5) |
| **Özellikler** | Auto-focus, paste desteği, ok tuşları, 60 sn geri sayım, auto-submit |
| **API Çağrıları** | **YOK — Tamamen placeholder** |
| **Eksikler** | `onResend` callback'i boş (`// In production, resend OTP via backend`). Backend'e OTP gönderim isteği yapılmıyor. OTP doğrulama API çağrısı yok. 6 hane girilince doğrudan adım 4'e geçiyor. |

#### Adım 4A: Buyer Hesap Kurulumu

| Alan | Detay |
|---|---|
| **Dosya** | `src/components/auth/AccountSetupForm.ts` |
| **Form Field'lar** | `country` (select, 27 ülke, required), `firstName` (text, required), `lastName` (text, required), `password` (toggle, required), `terms` (checkbox, required) |
| **Şifre Kuralları** | 8+ karakter, en az 1 büyük harf, 1 küçük harf, 1 rakam |
| **API Çağrıları** | `POST /api/method/tr_tradehub.api.v1.identity.register_user` → `{ email, password, first_name, last_name, account_type: "buyer", phone: "", country, accept_terms: true, accept_kvkk: true }` |
| | `POST /api/method/login` → `{ usr: email, pwd: password }` (auto-login) |
| **Eksikler** | `phone` boş gönderiliyor, `marketing_consent` gönderilmiyor |

#### Adım 4B: Supplier Hesap Kurulumu (4 Alt Adım)

| Alt Adım | Form Field'lar |
|---|---|
| **1 — Temel Bilgiler** | `firstName`, `lastName`, `businessName`, `sellerType` (individual\|business\|enterprise), `country` (Frappe Country'den çekilir) |
| **2 — Vergi & İletişim** | `taxIdType` (TCKN\|VKN), `taxId`, `taxOffice`, `contactPhone`, `addressLine1`, `city` |
| **3 — Banka** | `bankName`, `iban`, `accountHolderName` |
| **4 — Kimlik & Şifre** | `identityDocumentType` (national_id\|passport\|drivers_license), `documentNumber`, `documentExpiryDate`, `identityDocumentAttachment` (file: image/\*,.pdf), `password`, `terms` |

| Alan | Detay |
|---|---|
| **API Çağrıları** | 1. `POST /api/method/tr_tradehub.api.v1.identity.register_user` → `{ account_type: "supplier", ... }` |
| | 2. `POST /api/method/login` (auto-login) |
| | 3. `POST /api/method/tr_tradehub.api.v1.seller.complete_registration_application` → `{ application_name, business_name, seller_type, tax_id_type, tax_id, tax_office, contact_phone, address_line_1, city, country, bank_name, iban, account_holder_name, identity_document, identity_document_number, identity_document_expiry, terms_accepted: 1, privacy_accepted: 1, kvkk_accepted: 1, commission_accepted: 1, return_policy_accepted: 1 }` |
| | 4. `POST /api/method/upload_file` → FormData (doctype: "Seller Application", is_private: 1) |
| **Yönlendirme** | `/pages/seller/application-pending.html` |

### 1.4 Şifre Sıfırlama Sayfası (3 Adım)

| Adım | Form Field'lar | API Çağrısı | Eksik |
|---|---|---|---|
| **1 — Hesabı Bul** | `email` (text, required) | **YOK** | Backend'e `forgot_password` çağrısı yapılmıyor |
| **2 — OTP Doğrula** | 6 haneli OTP | **YOK** | Backend OTP mekanizması yok; şifre sıfırlamada OTP değil, email link tabanlı key sistemi var |
| **3 — Yeni Şifre** | `newPassword` (toggle) | **YOK** | Backend'e `reset_password` çağrısı yapılmıyor. `submitReset()` sadece toast gösterip login'e yönlendiriyor |

**Şifre Kuralları (Forgot Password):**
- 6-20 karakter
- En az 2 farklı karakter türü (harf, rakam, özel karakter)
- Emoji yasak

### 1.5 Auth Guard'lar

| Guard | Dosya | Davranış |
|---|---|---|
| `requireAuth()` | `src/utils/auth-guard.ts` | Oturum yoksa → `/pages/auth/login.html` |
| `requireSeller()` | `src/utils/auth-guard.ts` | Oturum yoksa → login; pending ise → application-pending; seller değilse → home |
| `blockAdmin()` | `src/utils/auth-guard.ts` | Admin ise → `FRAPPE_BASE/app/tradehub` |

### 1.6 Auth Utility

| Fonksiyon | Dosya | Açıklama |
|---|---|---|
| `login(email, password)` | `src/utils/auth.ts` | POST /api/method/login |
| `logout()` | `src/utils/auth.ts` | POST /api/method/logout |
| `register(...)` | `src/utils/auth.ts` | POST register_user |
| `getSessionUser()` | `src/utils/auth.ts` | GET get_session_user |
| `getRedirectUrl(user)` | `src/utils/auth.ts` | Rol bazlı yönlendirme URL'i |
| `isLoggedIn()` | `src/utils/auth.ts` | Senkron cache kontrolü |
| `getUser()` | `src/utils/auth.ts` | Senkron cache'li kullanıcı bilgisi |

### 1.7 Ortam Değişkenleri

| Değişken | .env.development | .env.production |
|---|---|---|
| `VITE_FRAPPE_BASE` | (boş — Vite proxy) | (belirtilmemiş) |
| `VITE_API_URL` | (boş — Vite proxy) | `https://api.tradehub.com` |
| `VITE_SELLER_PANEL_URL` | `http://localhost:8082` | (belirtilmemiş) |

---

## 2. Backend Auth Bileşenleri

### 2.1 identity.py — Kayıt, Giriş, Şifre, Doğrulama, Profil Endpoint'leri

**Dosya:** `Frappe_Marketplace/frappe-bench/apps/tr_tradehub/tr_tradehub/api/v1/identity.py`

#### Kayıt Endpoint'leri

| Endpoint | Parametreler | Response | İlgili DocType | Guest |
|---|---|---|---|---|
| `register()` | email, password, first_name, last_name, phone, account_type, accept_terms, accept_kvkk, marketing_consent, tenant_id | `{ success, message, user, requires_verification, verification_sent }` | User, Buyer Profile, Consent Record | Evet |
| `register_user()` | email, password, first_name, last_name, account_type ("buyer"/"supplier"), phone, country, accept_terms, accept_kvkk | `{ success, message, user, account_type, seller_application?, seller_application_status? }` | User, Seller Application, Consent Record | Evet |
| `register_organization()` | email, password, first_name, last_name, organization_name, tax_id, phone, organization_type, accept_terms, accept_kvkk, marketing_consent, tenant_id | `{ success, message, organization, user }` | User, Organization, Organization Member, Consent Record | Evet |

#### Giriş Endpoint'leri

| Endpoint | Parametreler | Response | İlgili DocType | Guest |
|---|---|---|---|---|
| `login()` | usr, pwd, device_id, remember_me | `{ success, user, requires_2fa?, otp_id? }` veya `{ requires_consent_renewal, consent_types }` | User, Account Action | Evet |
| `verify_2fa()` | usr, otp_code, otp_id, device_id, trust_device | `{ success, message, session_id, backup_codes? }` | User, Trusted Device | Evet |

#### Şifre Yönetimi Endpoint'leri

| Endpoint | Parametreler | Response | İlgili DocType | Guest |
|---|---|---|---|---|
| `forgot_password()` | email | `{ success, message }` (her zaman success — enumeration koruması) | User | Evet |
| `reset_password()` | key, new_password | `{ success, message }` | User | Evet |
| `change_password()` | current_password, new_password | `{ success, message }` | User | Hayır |

#### Email/Telefon Doğrulama Endpoint'leri

| Endpoint | Parametreler | Response | İlgili DocType | Guest |
|---|---|---|---|---|
| `verify_email()` | key | `{ success, message, user }` | User | Evet |
| `resend_verification_email()` | — | `{ success, message }` | User | Hayır |
| `send_phone_verification()` | phone (opsiyonel) | `{ success, verification_id, message, expires_in_minutes }` | User | Hayır |
| `verify_phone()` | verification_id, code | `{ success, message }` | User | Hayır |

#### 2FA Yönetimi Endpoint'leri

| Endpoint | Parametreler | Response | Guest |
|---|---|---|---|
| `enable_2fa()` | method ("totp"/"sms") | `{ success, secret, qr_code, backup_codes }` | Hayır |
| `confirm_2fa_setup()` | code | `{ success, message, backup_codes }` | Hayır |
| `disable_2fa()` | password | `{ success, message }` | Hayır |
| `regenerate_backup_codes()` | password | `{ success, backup_codes }` | Hayır |

#### Profil ve Oturum Endpoint'leri

| Endpoint | Parametreler | Response | Guest |
|---|---|---|---|
| `get_profile()` | — | `{ success, user{ ... } }` | Hayır |
| `update_profile()` | first_name, last_name, phone, company_name, preferred_language, vb. | `{ success, message, user }` | Hayır |
| `get_active_sessions()` | — | `{ success, sessions[] }` | Hayır |
| `terminate_session()` | session_id | `{ success, message }` | Hayır |
| `logout()` | — | `{ success, message }` | Hayır |
| `logout_all_sessions()` | — | `{ success, message }` | Hayır |

### 2.2 auth.py — SSO/Keycloak ve Oturum Endpoint'leri

**Dosya:** `Frappe_Marketplace/frappe-bench/apps/tr_tradehub/tr_tradehub/api/v1/auth.py`

| Endpoint | Parametreler | Response | Guest |
|---|---|---|---|
| `get_sso_status()` | — | `{ success, enabled, realm, features }` | Evet |
| `get_login_url()` | redirect_uri, success_url, tenant | `{ success, authorization_url, state }` | Evet |
| `sso_callback()` | code, state, error, error_description | HTTP redirect | Evet |
| `get_session_user()` | — | `{ logged_in, user{ email, full_name, roles, is_admin, is_seller, is_buyer, has_seller_profile, pending_seller_application, seller_profile } }` | Evet |
| `refresh_token()` | — | `{ success, expires_in, token_type }` | Hayır |
| `logout()` | redirect_url, logout_from_keycloak | `{ success, keycloak_logout_url? }` | Hayır |
| `check_email_exists()` | email | `{ success, exists }` | Evet |
| `get_social_providers()` | — | `{ success, providers[] }` | Evet |
| `get_sso_debug_info()` | — | `{ success, debug_info }` | Hayır (System Manager) |
| `test_keycloak_connection()` | — | `{ success, issuer, endpoints }` | Hayır (System Manager) |
| `invalidate_user_sessions()` | user | `{ success, message }` | Hayır (System Manager) |

### 2.3 seller.py — Satıcı Başvuru Endpoint'i

**Dosya:** `Frappe_Marketplace/frappe-bench/apps/tr_tradehub/tr_tradehub/api/v1/seller.py`

| Endpoint | Parametreler | Response |
|---|---|---|
| `complete_registration_application()` | application_name, business_name, seller_type, tax_id_type, tax_id, tax_office, contact_phone, address_line_1, city, country, bank_name, iban, account_holder_name, identity_document, identity_document_number, identity_document_expiry, terms_accepted, privacy_accepted, kvkk_accepted, commission_accepted, return_policy_accepted | `{ success, message, application_name }` |

### 2.4 Consent API (tr_consent_center)

**Dosya:** `Frappe_Marketplace/frappe-bench/apps/tr_consent_center/tr_consent_center/api.py`

| Endpoint | Parametreler | Açıklama |
|---|---|---|
| `grant_consent()` | party_type, party, topic, method, channel, consent_text, requires_verification | Onay kaydı oluştur |
| `revoke_consent()` | consent_record veya (party_type, party, topic), reason | Onayı iptal et |
| `get_consents()` | party_type, party, topic, status, include_expired | Onay kayıtlarını listele |
| `get_current_text()` | topic, language | Güncel onay metnini al (guest) |
| `verify_consent()` | consent_record, verification_token | Double opt-in doğrula |
| `check_consent()` | party_type, party, topic, method | Onay durumunu kontrol et |
| `get_audit_trail()` | consent_record | Denetim kaydını al |

### 2.5 İlgili DocType'lar

| DocType | App | Anahtar Alanlar | Açıklama |
|---|---|---|---|
| **Buyer Profile** | tradehub_core | user (Link→User, unique), buyer_name, buyer_type (Individual/Business/Wholesaler), status, email_verified, phone_verified, identity_verified, kyc_profile, tenant, verification_status | Alıcı profili |
| **Seller Profile** | tradehub_seller | user (Link→User, unique), seller_name, seller_type, status, verification_status, identity_verified, business_verified, bank_verified, tax_id, kyc_profile, tenant | Satıcı profili |
| **Seller Application** | tradehub_seller | applicant_user, business_name, seller_type, contact_email, contact_phone, status (Draft/Submitted/Under Review/Approved/Rejected) | Satıcı başvurusu |
| **KYC Profile** | tradehub_core | Kimlik doğrulama belgeleri, durum, verified_at, verified_by | KYC doğrulama |
| **Consent Record** | tradehub_compliance | party_type, party, consent_topic, consent_method, status (Pending/Active/Revoked), is_verified, granted_at | KVKK/GDPR onay kaydı |
| **Consent Topic** | tradehub_compliance | topic_name, description, is_mandatory | Onay konusu tanımı |
| **Account Action** | tradehub_commerce | Hesap kısıtlamaları (uyarı, ban vb.) | Hesap eylemi |

### 2.6 hooks.py Auth İlişkili Hook'lar

| App | Hook | Açıklama |
|---|---|---|
| **tr_tradehub** | `fixtures: [{ dt: "Role", filters: [["name", "in", ["Buyer", "Seller"]]] }]` | Buyer ve Seller rolleri fixture olarak tanımlı |
| **tr_tradehub** | `after_install / after_migrate: create_marketplace_roles.execute` | Install/migrate sonrası rolleri oluştur (Desk Access: 0) |
| **tradehub_core** | `doc_events["*"]["validate"]: validate_tenant` | Tüm DocType'larda tenant doğrulama |

### 2.7 Şifre Gereksinimleri (Backend)

```
PASSWORD_MIN_LENGTH = 8
require_uppercase = True
require_lowercase = True
require_digit = True
require_special = False (opsiyonel)
```

### 2.8 Rate Limiting (Backend)

| Aksiyon | Limit | Pencere |
|---|---|---|
| register | 50 / saat / IP | 3600 sn |
| login | 10 / 5 dk | 300 sn |
| password_reset | 3 / saat | 3600 sn |
| verification | 5 / 5 dk | 300 sn |
| 2fa_verify | 5 / 5 dk | 300 sn |

---

## 3. Kategori A — Backend'de Var, Storefront'ta Yok

1. **SSO/Keycloak Giriş Akışı** — Backend `get_login_url()`, `sso_callback()`, `refresh_token()`, `get_sso_status()`, `get_social_providers()` endpoint'leri mevcut. Storefront'ta SSO butonu veya Keycloak yönlendirmesi yok.

2. **2FA (İki Faktörlü Doğrulama) Akışı** — Backend `enable_2fa()`, `confirm_2fa_setup()`, `disable_2fa()`, `regenerate_backup_codes()`, `verify_2fa()` endpoint'leri mevcut. Login sırasında `requires_2fa` flag'i dönüyor. Storefront'ta 2FA kurulumu, doğrulama ekranı veya yedek kod yönetimi yok.

3. **Email Doğrulama (Link Tabanlı)** — Backend `verify_email(key)` ve `resend_verification_email()` endpoint'leri mevcut. Email ile doğrulama linki gönderiliyor. Storefront'ta doğrulama link'i yakalama veya "email'inizi doğrulayın" hatırlatma sayfası yok.

4. **Telefon Doğrulama** — Backend `send_phone_verification()` ve `verify_phone()` endpoint'leri mevcut (SMS OTP). Storefront'ta telefon doğrulama UI'ı yok.

5. **`register()` Endpoint'i** — identity.py'de hem `register()` hem `register_user()` var. `register()` fonksiyonu ek olarak `tenant_id` ve `marketing_consent` parametreleri kabul ediyor ve Buyer Profile oluşturuyor. Storefront sadece `register_user()` kullanıyor.

6. **`register_organization()` Endpoint'i** — Organizasyon/B2B kaydı için backend endpoint mevcut. Storefront'ta kurumsal kayıt formu yok.

7. **Profil Yönetimi** — Backend `get_profile()` ve `update_profile()` endpoint'leri mevcut. Storefront'ta profil düzenleme sayfası auth bağlamında analiz kapsamında tespit edilmedi.

8. **Oturum Yönetimi** — Backend `get_active_sessions()`, `terminate_session()`, `logout_all_sessions()` endpoint'leri mevcut. Storefront'ta aktif oturum listesi veya tekil oturum sonlandırma UI'ı yok.

9. **`check_email_exists()` Endpoint'i** — Backend'de email kayıtlı mı kontrolü var. Storefront kayıt sırasında bu kontrolü yapmıyor (email adım 2'de sadece regex ile doğrulanıyor).

10. **KVKK Consent Renewal** — Backend login'de `requires_consent_renewal` döndürebiliyor. Storefront'ta consent yenileme akışı yok.

11. **Account Action (Hesap Kısıtlama)** — Backend login sırasında Account Action kontrolü yapıyor (uyarı, ban). Storefront'ta kısıtlama bildirim UI'ı yok.

12. **Şifre Değiştirme** — Backend `change_password()` endpoint'i mevcut. Storefront'ta `SettingsChangePassword.ts` mevcut ancak backend entegrasyonu tam değil.

13. **Consent API** — Backend'de tam KVKK/GDPR consent yönetim sistemi mevcut (grant, revoke, verify, audit trail). Storefront'ta sadece kayıt sırasında checkbox var, ayrı consent yönetim UI'ı yok.

---

## 4. Kategori B — Storefront'ta Var, Backend'de Yok

1. **OTP Tabanlı Kayıt Doğrulama** — Storefront'ta kayıt akışında 6 haneli OTP doğrulama UI'ı tam olarak implement edilmiş (adım 3). Backend'de kayıt sırasında OTP gönderme/doğrulama endpoint'i yok. Backend email ile **link tabanlı doğrulama** (verify_email + key) kullanıyor. **Mimari uyumsuzluk:** Storefront OTP bekliyor, backend link gönderiyor.

2. **OTP Tabanlı Şifre Sıfırlama** — Storefront'ta forgot password akışı 3 adımlı: email → OTP → yeni şifre. Backend'de `forgot_password()` **email linki** gönderiyor (`reset_key` + URL), OTP sistemi yok. `reset_password(key, new_password)` **URL key** ile çalışıyor. **Tam uyumsuzluk:** Storefront OTP doğrulama yapıyor, backend key tabanlı çalışıyor.

3. **Forgot Password Şifre Kuralları** — Storefront'ta forgot password sayfasında farklı şifre kuralları uygulanıyor: 6-20 karakter, 2+ farklı karakter türü, emoji yasak. Backend ise 8+ karakter, büyük harf, küçük harf, rakam gereksinimi uyguluyor. **İki tarafta farklı kurallar.**

4. **Forgot Password submitReset()** — Storefront'ta `submitReset()` fonksiyonu backend'e hiçbir API çağrısı yapmıyor. Sadece toast mesajı gösterip login sayfasına yönlendiriyor. **Tamamen placeholder.**

---

## 5. Kategori C — Her İkisinde Var ama Uyumsuz

1. **Şifre Gereksinimleri (Kayıt) — KURAL UYUMSUZLUĞU**
   - **Storefront (Buyer/Supplier kayıt):** 8+ karakter, 1 büyük harf, 1 küçük harf, 1 rakam
   - **Backend:** 8+ karakter, 1 büyük harf, 1 küçük harf, 1 rakam, özel karakter opsiyonel
   - **Storefront (Forgot password):** 6-20 karakter, 2+ farklı tür, emoji yasak
   - **Sonuç:** Kayıt formundaki kurallar backend ile uyumlu. Ancak forgot password sayfası **tamamen farklı kurallar** kullanıyor (6 min vs 8 min, farklı karmaşıklık kuralları).

2. **Kayıt Sonrası Email Doğrulama — MEKANİZMA UYUMSUZLUĞU**
   - **Storefront:** Kayıt adım 3'te OTP doğrulama UI'ı gösteriyor. OTP girilince direkt adım 4'e geçiyor (backend çağrısı yok).
   - **Backend:** `register_user()` fonksiyonu `_create_email_verification(email)` ile email link'i gönderiyor. `verify_email(key)` link tıklamasıyla çalışıyor.
   - **Sonuç:** İki farklı doğrulama mekanizması. Storefront OTP, backend link.

3. **`phone` Parametresi — BOŞLUK**
   - **Storefront (Buyer kayıt):** `phone: ""` (boş string) gönderiliyor.
   - **Backend `register_user()`:** `phone` opsiyonel, normalize ve validate ediyor. Ancak User DocType'ta mobile_no unique constraint olduğundan DB'ye yazmıyor; Seller Application'daki contact_phone'a yazıyor.
   - **Sonuç:** Buyer kaydında telefon hiç toplanmıyor. Backend telefon doğrulama mekanizması buyer'lar için kullanılamaz.

4. **`marketing_consent` Parametresi — EKSİK**
   - **Storefront:** Kayıt formunda marketing consent checkbox'ı yok. `register()` çağrısında `marketing_consent` gönderilmiyor.
   - **Backend `register_user()`:** `marketing_consent` parametresi yok (sadece `register()` endpoint'inde var).
   - **Backend `register()`:** `marketing_consent` parametresi var ama storefront bu endpoint'i kullanmıyor.
   - **Sonuç:** Marketing consent hiçbir akışta toplanmıyor.

5. **Seller Type Mapping — DEĞER DÖNÜŞÜMÜ**
   - **Storefront:** `sellerType` dropdown değerleri: `individual`, `business`, `enterprise` (camelCase/lowercase)
   - **Backend:** Seller Application'da beklenen: `Individual`, `Business`, `Enterprise` (PascalCase)
   - **Storefront çözüm:** `sellerTypeMap` ile dönüşüm yapılıyor — ÇALIŞIYOR, ancak hardcoded.

6. **Identity Document Type Mapping — DEĞER DÖNÜŞÜMÜ**
   - **Storefront:** `national_id`, `passport`, `drivers_license`
   - **Backend:** `National ID Card`, `Passport`, `Driver License`
   - **Storefront çözüm:** `identityDocMap` ile dönüşüm yapılıyor — ÇALIŞIYOR, ancak hardcoded ve `drivers_license` → `Driver License` (tekil/çoğul farkı dikkat çekici).

7. **Login `device_id` ve `remember_me` — EKSİK**
   - **Storefront:** `POST /api/method/login` → `{ usr, pwd }` gönderiyor.
   - **Backend `login()`:** `device_id` ve `remember_me` parametreleri de kabul ediyor. Bunlar 2FA trusted device ve oturum süresi için kullanılıyor.
   - **Sonuç:** Storefront bu parametreleri göndermiyor, 2FA trusted device özelliği kullanılamaz.

8. **Login Response Handling — EKSİK**
   - **Storefront:** Login sonrası sadece `get_session_user()` çağrısı yapıyor. `login()` response'u kontrol edilmiyor.
   - **Backend `login()`:** `requires_2fa`, `requires_consent_renewal`, `session_id`, `tenant_id` gibi ek bilgiler dönüyor.
   - **Sonuç:** Storefront 2FA gereksinimi, consent yenileme veya tenant bilgisini yakalayamıyor.

9. **Country Listesi — VERİ KAYNAĞI FARKI**
   - **Storefront (Buyer formu):** 27 ülke hardcoded liste (TR, US, DE, GB, FR, IT, ES, NL, BE, AT, CH, PL, SE, NO, DK, FI, RU, CN, JP, KR, IN, AE, SA, AU, CA, BR, MX)
   - **Storefront (Supplier formu):** `GET /api/resource/Country` ile Frappe'den dinamik çekilir
   - **Sonuç:** Buyer formunda sınırlı hardcoded liste, supplier formunda tam dinamik liste. Tutarsız yaklaşım.

---

## 6. Buyer/Seller Ayrımı Durumu

### Mevcut Durum: AYRIM MEVCUT VE AKTİF

#### Frontend Akışı
1. Kayıt sayfasının ilk adımında `AccountTypeSelector` bileşeni ile kullanıcı **Buyer** veya **Supplier** seçiyor (radio kartlar).
2. Seçime göre adım 4'te farklı form gösteriliyor:
   - **Buyer** → `AccountSetupForm` (isim, ülke, şifre, koşullar)
   - **Supplier** → `SupplierSetupForm` (4 alt adımlı kapsamlı form: temel bilgi, vergi/iletişim, banka, kimlik/şifre)
3. Login sonrası `getRedirectUrl(user)` ile rol bazlı yönlendirme yapılıyor.

#### Backend Akışı
1. `register_user(account_type="buyer"|"supplier")` endpoint'i her iki tip için de kullanılıyor.
2. **Tüm kullanıcılar** `Buyer` rolüne atanıyor (supplier dahil).
3. `account_type == "supplier"` ise ek olarak draft `Seller Application` DocType'ı oluşturuluyor.
4. Supplier, `complete_registration_application()` ile başvurusunu tamamlıyor.
5. Admin onayı sonrası `Seller Profile` oluşturuluyor ve `Seller` rolü atanıyor.

#### Roller

| Rol | Atanma Zamanı | Desk Access |
|---|---|---|
| **Buyer** | Kayıt anında (tüm kullanıcılar) | Hayır |
| **Seller** | Admin onayı sonrası | Hayır |
| **Marketplace Buyer** | Organizasyon kaydında | Hayır |
| **Organization Admin** | Organizasyon kaydında | Hayır |
| **System Manager** | Manuel | Evet |
| **Marketplace Admin** | Manuel | Evet |

#### Satıcı Başvuru Yaşam Döngüsü

```
Kayıt (account_type=supplier)
  → Draft Seller Application oluşturulur
  → complete_registration_application() ile form tamamlanır
  → Dosya yüklenir (kimlik belgesi)
  → Status: Draft → Submitted → Under Review
  → Admin onayı → Approved
  → Seller Profile oluşturulur + Seller rolü atanır
  → Status: Active
```

#### İlgili DocType'lar

| DocType | Buyer | Seller |
|---|---|---|
| User | ✅ | ✅ |
| Buyer Profile | ✅ (register ile) | ❌ |
| Seller Application | ❌ | ✅ (register_user ile draft) |
| Seller Profile | ❌ | ✅ (onay sonrası) |
| KYC Profile | ✅ (link) | ✅ (link) |
| Consent Record | ✅ | ✅ |

#### `get_session_user()` Response'unda Ayrım

```json
{
  "is_buyer": true,
  "is_seller": false,
  "has_seller_profile": false,
  "pending_seller_application": true,
  "seller_profile": null
}
```

---

## 7. Kritik Eksikler (Özet)

Aşağıdaki maddeler öncelik sırasına göre listelenmiştir:

1. **Şifre Sıfırlama Akışı Tamamen Kırık** — Storefront'ta forgot password sayfası hiçbir backend API çağrısı yapmıyor. `submitFindAccount()` backend'e email göndermiyor, OTP doğrulama tamamen sahte (client-side), `submitReset()` şifreyi güncellemeden sadece toast gösterip login'e yönlendiriyor. Backend'de ise email link + key tabanlı (`forgot_password` + `reset_password`) tam çalışan bir mekanizma var. **İki taraf birbirinden tamamen bağımsız ve uyumsuz.**

2. **Kayıt OTP Doğrulama Backend Entegrasyonu Yok** — Storefront kayıt adım 3'te OTP UI'ı gösteriyor ama backend'e OTP gönderim/doğrulama çağrısı yapılmıyor. `onResend` callback placeholder. 6 hane girilince doğrudan form adımına geçiliyor. Backend ise email link doğrulama kullanıyor. **OTP mekanizması backend'de mevcut değil (kayıt bağlamında).**

3. **2FA Akışı Frontend'de Hiç Yok** — Backend tam 2FA desteği sunuyor (TOTP, SMS, backup codes, trusted devices). Storefront'ta ne 2FA kurulum UI'ı ne de login sırasında 2FA doğrulama ekranı var. Backend `requires_2fa` dönse bile storefront bunu yakalayamıyor.

4. **SSO/Keycloak Entegrasyonu Frontend'de Yok** — Backend'de tam OAuth2/OIDC Keycloak entegrasyonu mevcut. Storefront'ta SSO giriş butonu, Keycloak yönlendirmesi veya callback handling yok.

5. **Şifre Kuralları Uyumsuzluğu** — Kayıt formu ve forgot password formu farklı şifre kuralları uyguluyor. Kayıt: 8+ karakter, büyük/küçük harf, rakam. Forgot password: 6-20 karakter, 2+ farklı tür, emoji yasak. Backend hep aynı kuralı uyguluyor (8+, uppercase, lowercase, digit).

6. **Login Response İşlenmiyor** — Storefront login sonrası `login()` response'u kontrol etmeden direkt `getSessionUser()` çağırıyor. Backend'in döndürdüğü `requires_2fa`, `requires_consent_renewal`, `session_id`, `tenant_id` bilgileri görmezden geliniyor.

7. **Email Doğrulama Akışı Kopuk** — Backend kayıt sonrası doğrulama email'i gönderiyor ama storefront'ta "email'inizi doğrulayın" hatırlatma sayfası, doğrulama link'i yakalama veya doğrulama durumu kontrolü yok.

8. **Telefon Doğrulama Frontend'de Yok** — Backend'de SMS OTP ile telefon doğrulama mevcut. Buyer kaydında telefon toplanmıyor. Supplier kaydında telefon alınıyor ama doğrulama akışı yok.

9. **Organizasyon Kaydı Frontend'de Yok** — Backend `register_organization()` endpoint'i B2B kurumsal kayıt için hazır. Storefront'ta kurumsal kayıt formu bulunmuyor.

10. **Consent Yönetimi Eksik** — Backend'de KVKK/GDPR consent yönetim API'si tam (grant, revoke, verify, audit). Storefront'ta sadece kayıt sırasında checkbox var. Consent yenileme, iptal veya yönetim UI'ı yok.
