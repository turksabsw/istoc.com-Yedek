# AUTH SİSTEMİ — VibeCoding Prompt Dosyası

## PROJE YAPISI

- **Frontend (Storefront):** `/home/bora/Masaüstü/istoc.com/tradehubfront`
  - Vite 7 + Alpine.js 3 + Tailwind CSS 4 + i18next
  - Multi-entry HTML build (her sayfa ayrı entry point)
  - Mevcut auth bileşenleri: `src/components/auth/`

- **Backend:** `/home/bora/Masaüstü/istoc.com/Frappe_Marketplace/frappe-bench`
  - Frappe v15 (Python) — Site: `marketplace.local`
  - Custom app: `tr_tradehub` → `apps/tr_tradehub/tr_tradehub/`
  - Mevcut SSO/Keycloak API: `api/v1/auth.py`

---

## MEVCUT DURUM ANALİZİ

### Frontend Auth Dosyaları (Mevcut)
```
src/components/auth/
├── AuthLayout.ts          → Split-screen layout (promo banner + form)
├── LoginPage.ts           → Email/şifre login formu
├── RegisterPage.ts        → 4 adımlı kayıt sihirbazı (Alpine.js state)
├── AccountTypeSelector.ts → Adım 1: Alıcı/Tedarikçi seçimi
├── EmailVerification.ts   → 6 haneli OTP (auto-focus, paste, 60s countdown)
├── AccountSetupForm.ts    → Ülke seçici, isim, şifre (4 şart)
├── ForgotPasswordPage.ts  → 3 adımlı şifre sıfırlama
└── SocialLoginButtons.ts  → Keycloak SSO düğmeleri

src/utils/
├── auth.ts        → MOCK (localStorage tabanlı, token YOK)
├── auth-guard.ts  → requireAuth() → login'e yönlendir
└── api.ts         → Bearer token header (ama token mock)

pages/auth/
├── login.html
├── register.html
└── forgot-password.html
```

### Backend Auth Dosyaları (Mevcut)
```
apps/tr_tradehub/tr_tradehub/api/v1/auth.py
  → get_sso_status()         GET  guest  Keycloak aktif mi?
  → get_login_url()          GET  guest  Keycloak auth URL üret
  → sso_callback()           GET  guest  OAuth2 callback, user oluştur
  → get_session_user()       GET  auth   Mevcut kullanıcı bilgisi
  → refresh_token()          POST auth   Token yenile
  → logout()                 POST auth   Frappe + Keycloak logout
  → check_email_exists()     GET  guest  Email kayıtlı mı?
  → get_social_providers()   GET  guest  SSO provider listesi

apps/frappe/frappe/
  → auth.py        → LoginManager (login, authenticate, 2FA, CSRF)
  → sessions.py    → Redis session yönetimi
  → oauth.py       → OAuth2/OIDC RFC 6749
  → core/doctype/user/user.py → reset_password(), validate_email()
```

### Kritik Sorun
**Frontend auth tamamen MOCK** — localStorage'da sadece user objesi var, gerçek JWT token yok.
Backend SSO altyapısı hazır ama frontend bağlı değil.

---

## YAPILACAKLAR — AUTH SİSTEMİ ENTEGRASYONU

### 1. SAYFALAR VE ROTALAR

| Sayfa | Rota | Kategori | Özellikler |
|-------|------|----------|------------|
| Yeni Kullanıcı Hoş Geldin | `/welcome` | HOME/Onboarding | İlk giriş rehberi, adım adım platform tanıtımı |
| Kayıt Ol / Sign Up | `/register` | AUTH | Email/Telefon, Social Login, şirket formu |
| Giriş Yap / Login | `/login` | AUTH | Email/şifre, 2FA, şifre sıfırlama linki |
| Şifremi Unuttum | `/forgot-password` | AUTH | Email/telefon ile şifre sıfırlama |
| Email / Telefon Doğrulama | `/verify` | AUTH | Doğrulama kodu / link sonuç sayfası |

---

## VİBECODİNG PROMPT

> Aşağıdaki prompt'u bir vibecoding oturumunda kullan.
> Tüm değişiklikler önce frontend (`tradehubfront`), sonra backend (`tr_tradehub`) sırasıyla yapılmalı.

---

### PROMPT BAŞLANGICI

```
Sen bir full-stack geliştiricisin. Aşağıda detaylı olarak açıklanan auth sistemini implemente edeceksin.

FRONTEND: /home/bora/Masaüstü/istoc.com/tradehubfront
  - Vite 7 + Alpine.js 3 + Tailwind CSS 4 + i18next + Flowbite
  - Her HTML sayfasının ayrı TypeScript entry point'i var (vite.config.ts'te tanımlı)
  - Bileşenler src/components/auth/ altında TypeScript sınıfları olarak yazılıyor
  - State yönetimi Alpine.js x-data ile yapılıyor
  - API base URL: import.meta.env.VITE_API_URL

BACKEND: /home/bora/Masaüstü/istoc.com/Frappe_Marketplace/frappe-bench
  - Frappe v15 (Python), site: marketplace.local
  - Custom app: apps/tr_tradehub/tr_tradehub/
  - Mevcut API: api/v1/auth.py (@frappe.whitelist ile tanımlı endpoint'ler)
  - Frappe endpoint URL formatı: /api/method/tr_tradehub.api.v1.auth.<fonksiyon_adı>
  - Kullanıcı DocType: frappe.core.doctype.user.User
  - Session: Redis tabanlı, HTTP-only cookie (sid)
  - Şifre: frappe.utils.password.check_password() ve set_encrypted_password()

---

## GÖREV 1: AUTH STATE YÖNETİMİ (Frontend)

`src/utils/auth.ts` dosyasını MOCK'tan gerçek implementasyona çevir:

```typescript
// src/utils/auth.ts - YENİ IMPLEMENTASYON

interface AuthTokens {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  expires_at: number; // Date.now() + expires_in * 1000
}

interface AuthUser {
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  roles: string[];
  user_type: 'buyer' | 'supplier' | 'admin';
  is_verified: boolean;
  has_completed_onboarding: boolean;
}

const TOKEN_KEY = 'tradehub_tokens';
const USER_KEY = 'tradehub_user';

export function getTokens(): AuthTokens | null {
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  const tokens: AuthTokens = JSON.parse(raw);
  if (Date.now() > tokens.expires_at) {
    clearAuth();
    return null;
  }
  return tokens;
}

export function setTokens(tokens: Omit<AuthTokens, 'expires_at'>): void {
  const withExpiry: AuthTokens = {
    ...tokens,
    expires_at: Date.now() + tokens.expires_in * 1000
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(withExpiry));
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function isLoggedIn(): boolean {
  return getTokens() !== null;
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
```

---

## GÖREV 2: API WRAPPER (Frontend)

`src/utils/api.ts` dosyasını güncelle — Frappe backend ile uyumlu:

```typescript
// src/utils/api.ts - FRAPPE UYUMLU

const BASE_URL = import.meta.env.VITE_API_URL; // http://localhost:8000

interface FrappeResponse<T> {
  message: T;
  exc?: string;
}

export async function apiGet<T>(method: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}/api/method/${method}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const tokens = getTokens();
  const res = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      ...(tokens ? { 'Authorization': `Bearer ${tokens.access_token}` } : {}),
    },
    credentials: 'include', // Frappe HTTP-only cookie (sid) için
  });

  if (res.status === 403) {
    clearAuth();
    window.location.href = '/pages/auth/login.html';
  }

  const data: FrappeResponse<T> = await res.json();
  if (!res.ok || data.exc) throw new Error(data.exc || 'API Error');
  return data.message;
}

export async function apiPost<T>(method: string, body: Record<string, unknown>): Promise<T> {
  const tokens = getTokens();
  // Frappe CSRF token'ı cookie'den al
  const csrfToken = document.cookie
    .split(';')
    .find(c => c.trim().startsWith('csrf_token='))
    ?.split('=')[1];

  const res = await fetch(`${BASE_URL}/api/method/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Frappe-CSRF-Token': csrfToken || '',
      ...(tokens ? { 'Authorization': `Bearer ${tokens.access_token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  if (res.status === 403) {
    clearAuth();
    window.location.href = '/pages/auth/login.html';
  }

  const data: FrappeResponse<T> = await res.json();
  if (!res.ok || data.exc) throw new Error(data.exc || 'API Error');
  return data.message;
}
```

---

## GÖREV 3: MIDDLEWARE (Frontend)

`src/utils/middleware.ts` oluştur:

```typescript
// src/utils/middleware.ts - YENİ DOSYA

/**
 * Auth middleware - sayfa yüklenirken çalışır
 * Her protected sayfanın entry point'inde import edilmeli
 */

// Public rotalar (auth gerektirmez)
const PUBLIC_PATHS = [
  'login.html', 'register.html', 'forgot-password.html', 'verify.html'
];

// Auth gerektiren ama onboarding gerektirmeyen rotalar
const SKIP_ONBOARDING_PATHS = ['welcome.html'];

export function authMiddleware(): void {
  const currentPath = window.location.pathname;
  const isPublicPage = PUBLIC_PATHS.some(p => currentPath.includes(p));

  if (isPublicPage) return;

  const tokens = getTokens();
  if (!tokens) {
    // Token yok → login'e yönlendir
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `/pages/auth/login.html?return=${returnUrl}`;
    return;
  }

  // Token süresi dolmak üzere ise yenile (5 dakika kala)
  if (tokens.expires_at - Date.now() < 5 * 60 * 1000) {
    refreshAuthToken().catch(() => {
      clearAuth();
      window.location.href = '/pages/auth/login.html';
    });
  }

  const user = getUser();
  const skipOnboarding = SKIP_ONBOARDING_PATHS.some(p => currentPath.includes(p));

  if (user && !user.has_completed_onboarding && !skipOnboarding) {
    // Onboarding tamamlanmamış → welcome'a yönlendir
    window.location.href = '/pages/welcome.html';
    return;
  }
}

export async function refreshAuthToken(): Promise<void> {
  const result = await apiPost<{ access_token: string; expires_in: number }>(
    'tr_tradehub.api.v1.auth.refresh_token', {}
  );
  setTokens({ ...result, token_type: 'Bearer' });
}

// Sayfa yüklendiğinde otomatik çalıştır (tüm entry point'lerde import edilmeli)
authMiddleware();
```

---

## GÖREV 4: BACKEND — YENİ AUTH ENDPOİNT'LERİ

`apps/tr_tradehub/tr_tradehub/api/v1/auth.py` dosyasına aşağıdaki endpoint'leri ekle:

### 4.1 Kayıt (Register)

```python
@frappe.whitelist(allow_guest=True)
def register(
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    user_type: str,          # 'buyer' veya 'supplier'
    phone: str = None,
    company_name: str = None,
    company_tax_id: str = None,
    country: str = "TR"
) -> dict:
    """
    Yeni kullanıcı kaydı.
    1. Email var mı kontrol et
    2. Frappe User oluştur (user_type=Website User)
    3. Doğrulama emaili gönder (Frappe'nin send_verification_email)
    4. Başarı durumunda kullanıcı bilgilerini döndür (token olmadan)

    Döndürdüğü:
    {
        "user": "email@example.com",
        "message": "Doğrulama emaili gönderildi",
        "verification_required": true
    }
    """

    # Email kontrolü
    if frappe.db.exists("User", email):
        frappe.throw("Bu email adresi zaten kayıtlı", frappe.DuplicateEntryError)

    # User oluştur
    user = frappe.get_doc({
        "doctype": "User",
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
        "full_name": f"{first_name} {last_name}",
        "phone": phone,
        "enabled": 1,
        "user_type": "Website User",
        "send_welcome_email": 0,  # Biz özel email göndereceğiz
        # Custom fields (tr_tradehub User DocType genişlemesi):
        "tradehub_user_type": user_type,  # buyer/supplier
        "company_name": company_name,
        "company_tax_id": company_tax_id,
        "country": country,
        "has_completed_onboarding": 0,
        "is_email_verified": 0,
    })
    user.new_password = password
    user.insert(ignore_permissions=True)

    # 6 haneli OTP oluştur ve Redis'e kaydet
    otp = generate_verification_otp(email)

    # Doğrulama emaili gönder
    send_verification_email(email, otp, first_name)

    return {
        "user": email,
        "message": "Doğrulama kodu email adresinize gönderildi",
        "verification_required": True
    }


def generate_verification_otp(email: str) -> str:
    """6 haneli OTP üret ve 10 dakika Redis'e kaydet"""
    import random
    otp = str(random.randint(100000, 999999))
    cache_key = f"trade_hub:verify:otp:{email}"
    frappe.cache().set_value(cache_key, otp, expires_in_sec=600)  # 10 dakika
    return otp


def send_verification_email(email: str, otp: str, first_name: str) -> None:
    """Doğrulama OTP emaili gönder"""
    frappe.sendmail(
        recipients=[email],
        subject="TradeHub - Email Doğrulama",
        template="email_verification",  # templates/email_verification.html
        args={
            "first_name": first_name,
            "otp": otp,
            "expires_in": "10 dakika"
        }
    )
```

### 4.2 Email Doğrulama

```python
@frappe.whitelist(allow_guest=True)
def verify_email(email: str, otp: str) -> dict:
    """
    Email doğrulama kodu kontrolü.
    Başarılı olursa session başlatır ve token döndürür.

    Döndürdüğü:
    {
        "access_token": "...",
        "expires_in": 3600,
        "token_type": "Bearer",
        "user": { email, full_name, roles, user_type, has_completed_onboarding }
    }
    """
    cache_key = f"trade_hub:verify:otp:{email}"
    stored_otp = frappe.cache().get_value(cache_key)

    if not stored_otp or stored_otp != otp:
        frappe.throw("Geçersiz veya süresi dolmuş doğrulama kodu", frappe.AuthenticationError)

    # OTP'yi invalidate et (tek kullanım)
    frappe.cache().delete_key(cache_key)

    # Kullanıcıyı doğrulanmış olarak işaretle
    frappe.db.set_value("User", email, "is_email_verified", 1)
    frappe.db.commit()

    # Frappe session başlat
    frappe.local.login_manager.login_as(email)
    frappe.local.response["set_cookie"] = 1

    # Token oluştur
    from frappe.auth import CookieManager
    token = generate_auth_token(email)

    user_doc = frappe.get_doc("User", email)

    return {
        "access_token": token,
        "expires_in": 3600,
        "token_type": "Bearer",
        "user": {
            "email": email,
            "full_name": user_doc.full_name,
            "first_name": user_doc.first_name,
            "last_name": user_doc.last_name,
            "roles": [r.role for r in user_doc.roles],
            "user_type": user_doc.get("tradehub_user_type", "buyer"),
            "is_verified": True,
            "has_completed_onboarding": bool(user_doc.get("has_completed_onboarding"))
        }
    }
```

### 4.3 Giriş (Login)

```python
@frappe.whitelist(allow_guest=True)
def login(email: str, password: str) -> dict:
    """
    Email/şifre ile giriş.
    2FA aktifse OTP adımını tetikler.

    Başarılı login döndürdüğü:
    {
        "access_token": "...",
        "expires_in": 3600,
        "token_type": "Bearer",
        "requires_2fa": false,
        "user": { ... }
    }

    2FA gerekirse döndürdüğü:
    {
        "requires_2fa": true,
        "two_fa_method": "email" | "totp",
        "session_id": "..."  # 2FA tamamlamak için gerekli temp session
    }
    """
    from frappe.utils.password import check_password
    from frappe.twofactor import should_run_2fa, authenticate_for_2factor

    # Kullanıcı var mı?
    if not frappe.db.exists("User", email):
        frappe.throw("Geçersiz email veya şifre", frappe.AuthenticationError)

    user_doc = frappe.get_doc("User", email)

    # Email doğrulanmış mı?
    if not user_doc.get("is_email_verified"):
        # Yeni OTP gönder
        otp = generate_verification_otp(email)
        send_verification_email(email, otp, user_doc.first_name)
        frappe.throw(
            "Email adresiniz doğrulanmamış. Yeni doğrulama kodu gönderildi.",
            title="email_not_verified"
        )

    # Şifre kontrolü
    try:
        check_password(email, password)
    except frappe.AuthenticationError:
        frappe.throw("Geçersiz email veya şifre", frappe.AuthenticationError)

    # 2FA kontrolü
    if should_run_2fa(email):
        temp_session_id = authenticate_for_2factor(email)
        return {
            "requires_2fa": True,
            "two_fa_method": get_2fa_method(email),
            "session_id": temp_session_id
        }

    # Session başlat ve token döndür
    frappe.local.login_manager.login_as(email)
    token = generate_auth_token(email)

    return {
        "access_token": token,
        "expires_in": 3600,
        "token_type": "Bearer",
        "requires_2fa": False,
        "user": {
            "email": email,
            "full_name": user_doc.full_name,
            "first_name": user_doc.first_name,
            "last_name": user_doc.last_name,
            "roles": [r.role for r in user_doc.roles],
            "user_type": user_doc.get("tradehub_user_type", "buyer"),
            "is_verified": True,
            "has_completed_onboarding": bool(user_doc.get("has_completed_onboarding"))
        }
    }
```

### 4.4 2FA Doğrulama

```python
@frappe.whitelist(allow_guest=True)
def verify_2fa(email: str, otp: str, session_id: str) -> dict:
    """
    2FA kodu doğrula ve login tamamla.
    """
    from frappe.twofactor import confirm_otp_token

    # 2FA doğrula (Frappe twofactor modülü)
    if not confirm_otp_token_for_session(session_id, otp):
        frappe.throw("Geçersiz 2FA kodu", frappe.AuthenticationError)

    frappe.local.login_manager.login_as(email)
    token = generate_auth_token(email)

    user_doc = frappe.get_doc("User", email)

    return {
        "access_token": token,
        "expires_in": 3600,
        "token_type": "Bearer",
        "user": {
            "email": email,
            "full_name": user_doc.full_name,
            "roles": [r.role for r in user_doc.roles],
            "user_type": user_doc.get("tradehub_user_type", "buyer"),
            "is_verified": True,
            "has_completed_onboarding": bool(user_doc.get("has_completed_onboarding"))
        }
    }
```

### 4.5 Şifre Sıfırlama

```python
@frappe.whitelist(allow_guest=True)
def forgot_password(email_or_phone: str) -> dict:
    """
    Şifre sıfırlama başlat.
    Email veya telefon ile kullanıcıyı bul, OTP gönder.
    """
    # Email mi yoksa telefon mu?
    if "@" in email_or_phone:
        user = frappe.db.get_value("User", {"email": email_or_phone}, "name")
    else:
        # Telefon ile ara (custom field)
        user = frappe.db.get_value("User", {"phone": email_or_phone}, "name")

    if not user:
        # Güvenlik: Kullanıcı yoksa da başarılı döndür (user enumeration önleme)
        return {"message": "Eğer bu hesap mevcutsa, sıfırlama kodu gönderildi"}

    otp = generate_password_reset_otp(user)
    user_doc = frappe.get_doc("User", user)

    # Email veya SMS gönder
    if "@" in email_or_phone:
        send_password_reset_email(user, otp, user_doc.first_name)
    else:
        send_password_reset_sms(email_or_phone, otp)

    return {"message": "Şifre sıfırlama kodu gönderildi"}


def generate_password_reset_otp(email: str) -> str:
    """6 haneli OTP üret, 15 dakika Redis'e kaydet"""
    import random
    otp = str(random.randint(100000, 999999))
    cache_key = f"trade_hub:pwd_reset:otp:{email}"
    frappe.cache().set_value(cache_key, otp, expires_in_sec=900)  # 15 dakika
    return otp


@frappe.whitelist(allow_guest=True)
def verify_reset_otp(email: str, otp: str) -> dict:
    """Şifre sıfırlama OTP'sini doğrula, reset token döndür"""
    cache_key = f"trade_hub:pwd_reset:otp:{email}"
    stored_otp = frappe.cache().get_value(cache_key)

    if not stored_otp or stored_otp != otp:
        frappe.throw("Geçersiz veya süresi dolmuş kod", frappe.AuthenticationError)

    # OTP'yi sil
    frappe.cache().delete_key(cache_key)

    # Tek kullanımlık reset token oluştur (10 dakika)
    import secrets
    reset_token = secrets.token_urlsafe(32)
    frappe.cache().set_value(
        f"trade_hub:pwd_reset:token:{reset_token}",
        email,
        expires_in_sec=600
    )

    return {"reset_token": reset_token}


@frappe.whitelist(allow_guest=True)
def reset_password(reset_token: str, new_password: str) -> dict:
    """Yeni şifre belirle"""
    cache_key = f"trade_hub:pwd_reset:token:{reset_token}"
    email = frappe.cache().get_value(cache_key)

    if not email:
        frappe.throw("Geçersiz veya süresi dolmuş sıfırlama bağlantısı", frappe.AuthenticationError)

    # Token'ı invalidate et
    frappe.cache().delete_key(cache_key)

    # Şifreyi güncelle
    from frappe.utils.password import update_password
    update_password(email, new_password)

    return {"message": "Şifreniz başarıyla güncellendi"}
```

### 4.6 Onboarding Tamamlama

```python
@frappe.whitelist()
def complete_onboarding(steps_completed: list = None) -> dict:
    """
    Kullanıcının onboarding adımlarını tamamladığını işaretle.
    /welcome sayfasında çağrılır.
    """
    email = frappe.session.user
    frappe.db.set_value("User", email, "has_completed_onboarding", 1)
    frappe.db.commit()

    return {"message": "Onboarding tamamlandı", "redirect": "/"}
```

---

## GÖREV 5: FRONTEND — SAYFA IMPLEMENTASYONLARI

### 5.1 /login Sayfası — LoginPage.ts Güncellemesi

Mevcut `src/components/auth/LoginPage.ts` dosyasını güncelle:

- Form submit'te `apiPost('tr_tradehub.api.v1.auth.login', {email, password})` çağır
- `requires_2fa: true` gelirse 2FA adımını göster
- Başarıda `setTokens()` ve `setUser()` çağır
- `return` URL parametresi varsa oraya, yoksa kullanıcı tipine göre yönlendir:
  - Alıcı → `/pages/buyer-dashboard.html`
  - Tedarikçi → `/pages/supplier-dashboard.html`
- Hata durumunda: email doğrulanmamışsa → `/pages/auth/verify.html?email=xxx`
- "Şifremi Unuttum" linki → `/pages/auth/forgot-password.html`
- Sosyal login düğmeleri: `apiGet('tr_tradehub.api.v1.auth.get_login_url', {redirect_uri, success_url})` çağır

### 5.2 /register Sayfası — RegisterPage.ts Güncellemesi

Mevcut 4 adımlı RegisterPage.ts'i gerçek API ile bağla:

**Adım 1:** Alıcı/Tedarikçi seçimi (AccountTypeSelector - değişiklik yok)

**Adım 2:** Email girişi
- Email blur/submit'te: `apiGet('tr_tradehub.api.v1.auth.check_email_exists', {email})` çağır
- Sosyal login: `get_social_providers()` ile SSO seçeneklerini göster

**Adım 3:** Email doğrulama (EmailVerification - mevcut OTP UI kullan)
- Adım 2'den sonra kayıt API'sini ÇAĞIRMA — sadece email'i kaydet (state'de)
- Devam butonunda `apiPost('tr_tradehub.api.v1.auth.register', {email, ...})` çağır
  - Bu hem user oluşturur hem OTP gönderir
- OTP submit'te: `apiPost('tr_tradehub.api.v1.auth.verify_email', {email, otp})` çağır
- Başarıda token'ı kaydet, Adım 4'e geç

**Adım 4:** Hesap Kurulumu (AccountSetupForm)
- Bu adım KAYIT SONRASI kişiselleştirme: isim, şirket bilgisi (register'da zaten alındıysa skip)
- veya ilk giriş tercihlerini kaydet
- Tamamlandığında `/pages/welcome.html`'e yönlendir

### 5.3 /forgot-password Sayfası — ForgotPasswordPage.ts Güncellemesi

Mevcut 3 adımlı ForgotPasswordPage.ts:

**Adım 1:** Email/Telefon girişi
- Submit: `apiPost('tr_tradehub.api.v1.auth.forgot_password', {email_or_phone})` çağır

**Adım 2:** OTP girişi (EmailVerification bileşenini yeniden kullan)
- Submit: `apiPost('tr_tradehub.api.v1.auth.verify_reset_otp', {email, otp})` çağır
- Başarıda `reset_token`'ı state'e kaydet

**Adım 3:** Yeni şifre (AccountSetupForm'dan şifre bölümünü yeniden kullan)
- Submit: `apiPost('tr_tradehub.api.v1.auth.reset_password', {reset_token, new_password})` çağır
- Başarıda → `/pages/auth/login.html?message=password_reset_success`

### 5.4 /verify Sayfası — YENİ SAYFA

`pages/auth/verify.html` ve `src/components/auth/VerifyPage.ts` oluştur:

**Kullanım senaryoları:**
1. Kayıt sonrası email doğrulama (email parametresi URL'de)
2. Login'de email doğrulanmamış hata (email parametresi URL'de)
3. Link ile doğrulama (token parametresi URL'de)

```typescript
// src/components/auth/VerifyPage.ts
// Alpine.js x-data: verifyPage()
// - URL'den email/token parametresini al
// - OTP modu: EmailVerification bileşenini göster
// - Token modu: Otomatik verify_email çağır, başarı/hata mesajı göster
// - Yeniden gönder butonu: apiPost('tr_tradehub.api.v1.auth.resend_verification_otp')
// - Başarıda: setTokens() + setUser() → user tipine göre dashboard'a yönlendir
```

**Backend'e ekle:**
```python
@frappe.whitelist(allow_guest=True)
def resend_verification_otp(email: str) -> dict:
    """Doğrulama OTP'sini yeniden gönder (rate limit: 60s)"""
    rate_limit_key = f"trade_hub:verify:rate:{email}"
    if frappe.cache().get_value(rate_limit_key):
        frappe.throw("Lütfen 60 saniye bekleyin", frappe.RateLimitExceededError)

    frappe.cache().set_value(rate_limit_key, 1, expires_in_sec=60)

    user_doc = frappe.get_doc("User", email)
    otp = generate_verification_otp(email)
    send_verification_email(email, otp, user_doc.first_name)

    return {"message": "Doğrulama kodu yeniden gönderildi"}
```

### 5.5 /welcome Sayfası — YENİ SAYFA (Onboarding)

`pages/welcome.html` ve `src/components/onboarding/WelcomePage.ts` oluştur:

**İlk Giriş Rehberi — Adım Adım Platform Tanıtımı:**

```typescript
// src/components/onboarding/WelcomePage.ts
// Alpine.js x-data: welcomePage()
// Gereksinimleri:
// - Kullanıcı tipine göre farklı onboarding adımları (buyer vs supplier)
// - authMiddleware() import et (giriş yapmamışları login'e yönlendir)
// - Animasyonlu progress bar
// - Her adımda "Sonraki" ve "Atla" butonu
// - Son adımda: complete_onboarding() çağır → dashboard'a yönlendir

// ALICI (buyer) onboarding adımları:
const BUYER_STEPS = [
  {
    title: "Hoş Geldiniz, {first_name}!",
    description: "TradeHub'da tedarikçi bulmak çok kolay. Size hızlıca başlamayı gösterelim.",
    icon: "👋",
    action: null
  },
  {
    title: "Arama ve Filtrele",
    description: "Binlerce tedarikçi arasında kategori, lokasyon ve sertifikaya göre arama yapın.",
    icon: "🔍",
    action: { label: "İlk Aramanı Yap", href: "/pages/search.html" }
  },
  {
    title: "Teklif İste",
    description: "Beğendiğin tedarikçilerden tek tıkla teklif isteyin, karşılaştırın.",
    icon: "📋",
    action: null
  },
  {
    title: "Mesajlaş",
    description: "Tedarikçilerle doğrudan platform üzerinden iletişim kurun.",
    icon: "💬",
    action: null
  },
  {
    title: "Hazırsınız!",
    description: "Profilinizi tamamlayarak güven puanınızı artırın.",
    icon: "✅",
    action: { label: "Profile Git", href: "/pages/profile.html" }
  }
];

// TEDARİKÇİ (supplier) onboarding adımları:
const SUPPLIER_STEPS = [
  {
    title: "Hoş Geldiniz, {first_name}!",
    description: "TradeHub'da alıcılara ulaşmak ve siparişler almak çok kolay.",
    icon: "👋",
    action: null
  },
  {
    title: "Şirket Profilinizi Tamamlayın",
    description: "Logo, açıklama ve sertifikalarınızı ekleyin. Görünürlüğünüzü artırın.",
    icon: "🏢",
    action: { label: "Profili Düzenle", href: "/pages/company-profile.html" }
  },
  {
    title: "Ürün/Hizmet Ekleyin",
    description: "Kataloğunuzu oluşturun. Alıcılar ürünlerinizi katalogda görsün.",
    icon: "📦",
    action: { label: "Ürün Ekle", href: "/pages/products/new.html" }
  },
  {
    title: "Tekliflere Yanıt Verin",
    description: "Alıcıların teklif isteklerine hızlı yanıt verin, sipariş alın.",
    icon: "⚡",
    action: null
  },
  {
    title: "Hazırsınız!",
    description: "İlk siparişinizi bekliyoruz.",
    icon: "🚀",
    action: { label: "Dashboard'a Git", href: "/pages/supplier-dashboard.html" }
  }
];
```

---

## GÖREV 6: FRAPPE DOKTIPLERI — CUSTOM ALANLAR

`apps/tr_tradehub/tr_tradehub/` altına User DocType için custom field fixture ekle:

```json
// fixtures/custom_field__user.json
[
  {
    "doctype": "Custom Field",
    "dt": "User",
    "fieldname": "tradehub_user_type",
    "fieldtype": "Select",
    "options": "buyer\nsupplier\nadmin",
    "label": "TradeHub Kullanıcı Tipi",
    "default": "buyer"
  },
  {
    "doctype": "Custom Field",
    "dt": "User",
    "fieldname": "is_email_verified",
    "fieldtype": "Check",
    "label": "Email Doğrulandı",
    "default": "0"
  },
  {
    "doctype": "Custom Field",
    "dt": "User",
    "fieldname": "has_completed_onboarding",
    "fieldtype": "Check",
    "label": "Onboarding Tamamlandı",
    "default": "0"
  },
  {
    "doctype": "Custom Field",
    "dt": "User",
    "fieldname": "company_name",
    "fieldtype": "Data",
    "label": "Şirket Adı"
  },
  {
    "doctype": "Custom Field",
    "dt": "User",
    "fieldname": "company_tax_id",
    "fieldtype": "Data",
    "label": "Vergi Kimlik No"
  },
  {
    "doctype": "Custom Field",
    "dt": "User",
    "fieldname": "phone",
    "fieldtype": "Data",
    "label": "Telefon"
  }
]
```

hooks.py'ye ekle:
```python
fixtures = [
    {"dt": "Custom Field", "filters": [["dt", "=", "User"]]},
    "Keycloak Settings",
]
```

---

## GÖREV 7: VITE CONFIG GÜNCELLEMESİ

`vite.config.ts`'e yeni sayfaları ekle:

```typescript
// vite.config.ts — input'a eklenecekler:
{
  // Mevcut:
  'auth/login': 'pages/auth/login.html',
  'auth/register': 'pages/auth/register.html',
  'auth/forgot-password': 'pages/auth/forgot-password.html',

  // YENİ:
  'auth/verify': 'pages/auth/verify.html',
  'welcome': 'pages/welcome.html',
}
```

---

## GÖREV 8: ENV DOSYASI GÜNCELLEMESİ

```bash
# .env.development
VITE_API_URL=http://marketplace.local:8000

# .env.production
VITE_API_URL=https://api.tradehub.com
```

---

## GÖREV 9: AUTH TOKEN ÜRETME (Backend Yardımcı Fonksiyon)

`auth.py`'e ekle:

```python
def generate_auth_token(email: str) -> str:
    """
    Frappe API token üret (veya mevcut Keycloak token'ını döndür).

    NOT: Frappe native olarak "Token Based Authentication" destekler.
    User için API Key + API Secret oluşturup Base64 encode edilmiş halini döndür.
    Frontend bunu Authorization: Token {token} header'ında kullanır.
    """
    user_doc = frappe.get_doc("User", email)

    # Kullanıcının API anahtarı yoksa oluştur
    if not user_doc.api_key:
        user_doc.api_key = frappe.generate_hash(length=15)
        user_doc.api_secret = frappe.generate_hash(length=15)
        user_doc.save(ignore_permissions=True)
        frappe.db.commit()

    # Token: base64(api_key:api_secret)
    import base64
    token = base64.b64encode(
        f"{user_doc.api_key}:{user_doc.get_password('api_secret')}".encode()
    ).decode()

    return token


# NOT: Frontend'de Authorization header formatı:
# Authorization: Token {base64_token}
# api.ts'te bunu "Bearer" yerine "Token" olarak güncelle!
```

---

## GÖREV 10: ERROR HANDLING & TOAST BİLDİRİMLERİ

`src/utils/toast.ts` oluştur:

```typescript
// src/utils/toast.ts
// Flowbite toast bileşenini kullanarak hata/başarı bildirimleri

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export function showToast(message: string, type: ToastType = 'info', duration = 4000): void {
  // Mevcut toast varsa kaldır
  document.getElementById('tradehub-toast')?.remove();

  const colors = {
    success: 'text-green-500 bg-white',
    error: 'text-red-500 bg-white',
    warning: 'text-orange-500 bg-white',
    info: 'text-blue-500 bg-white',
  };

  const toast = document.createElement('div');
  toast.id = 'tradehub-toast';
  toast.className = `fixed bottom-4 right-4 z-50 flex items-center w-full max-w-xs p-4 mb-4 rounded-lg shadow ${colors[type]}`;
  toast.innerHTML = `
    <div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg ${colors[type]}">
      ${getIcon(type)}
    </div>
    <div class="ms-3 text-sm font-normal">${message}</div>
    <button type="button" onclick="this.closest('#tradehub-toast').remove()"
      class="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8">
      <span class="sr-only">Kapat</span>
      <svg class="w-3 h-3" fill="none" viewBox="0 0 14 14">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
      </svg>
    </button>
  `;

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}
```

---

## ENTEGRASYON AKIŞI (Flow Diyagramı)

```
KAYIT AKIŞI:
1. /register → Tip seç (alıcı/tedarikçi)
2. /register → Email gir + sosyal login seçenekleri
3. /register → API: register() → User oluştur + OTP gönder
4. /verify   → 6 haneli OTP gir
5. /verify   → API: verify_email() → token al + user kaydet
6. /register → İsim/şirket bilgisi gir (AccountSetupForm)
7. /welcome  → Onboarding adımları
8. Dashboard (alıcı veya tedarikçi)

GİRİŞ AKIŞI:
1. /login    → Email + şifre gir
2. /login    → API: login() →
   a. 2FA gerekiyorsa → 2FA adımı göster → API: verify_2fa()
   b. Email doğrulanmamışsa → /verify?email=xxx
   c. Başarılı → token kaydet →
      - has_completed_onboarding false → /welcome
      - true → dashboard
3. /login    → Sosyal login → API: get_login_url() → Keycloak → sso_callback()

ŞİFRE SIFIRLAMA AKIŞI:
1. /forgot-password → Email veya telefon gir
2. /forgot-password → API: forgot_password()
3. /forgot-password → OTP gir → API: verify_reset_otp() → reset_token al
4. /forgot-password → Yeni şifre gir → API: reset_password()
5. /login    → Başarı mesajı ile yönlendir

MIDDLEWARE AKIŞI (Her protected sayfada):
1. authMiddleware() çalışır
2. Token var mı? Hayır → /login
3. Token süresi dolmak üzere mi? Evet → refresh_token()
4. has_completed_onboarding false mi? Evet → /welcome
5. Sayfa yükle
```

---

## ÖNEMLİ NOTLAR

1. **CSRF Token:** Frappe oturumu açıldığında `csrf_token` cookie'sini set eder. Tüm POST isteklerinde `X-Frappe-CSRF-Token` header'ı gönderilmeli.

2. **Token Formatı:** Frappe'nin token auth'u `Token {api_key}:{api_secret}` formatını kullanır (Bearer değil). `api.ts`'teki `Authorization` header'ını buna göre güncelle.

3. **CORS:** `site_config.json`'a ekle:
   ```json
   {
     "allow_cors": "http://localhost:5173",
     "cors_headers": "Authorization,X-Frappe-CSRF-Token,Content-Type"
   }
   ```

4. **Custom Fields:** Frappe'de User DocType'a eklenen custom field'lar için `bench migrate` çalıştırılmalı.

5. **Email Şablonları:** `apps/tr_tradehub/tr_tradehub/templates/email/` altında oluşturulmalı.

6. **Rate Limiting:** OTP endpoint'lerine rate limit ekle (Redis tabanlı, yukarıda `resend_verification_otp`'de gösterildiği gibi).

7. **Telefon Doğrulama:** SMS entegrasyonu için (ileride) Twilio veya Netgsm hook'u eklenebilir. Şimdilik sadece email kullan.
```

---

## DOSYA DEĞİŞİKLİK ÖZETİ

### Frontend — Değiştirilecek Dosyalar
| Dosya | Değişiklik |
|-------|-----------|
| `src/utils/auth.ts` | Mock → gerçek token yönetimi |
| `src/utils/api.ts` | Frappe uyumlu token auth |
| `src/components/auth/LoginPage.ts` | Gerçek API bağlantısı, 2FA, SSO |
| `src/components/auth/RegisterPage.ts` | Gerçek API bağlantısı, OTP flow |
| `src/components/auth/ForgotPasswordPage.ts` | Gerçek API bağlantısı |
| `vite.config.ts` | Yeni sayfa entry point'leri |
| `.env.development` | API URL güncelle |

### Frontend — Yeni Dosyalar
| Dosya | İçerik |
|-------|--------|
| `src/utils/middleware.ts` | Auth middleware |
| `src/utils/toast.ts` | Toast bildirimleri |
| `src/components/auth/VerifyPage.ts` | Email doğrulama sayfası |
| `src/components/onboarding/WelcomePage.ts` | Onboarding sayfası |
| `pages/auth/verify.html` | Verify HTML |
| `pages/welcome.html` | Welcome/Onboarding HTML |
| `src/pages/verify.ts` | Verify entry point |
| `src/pages/welcome.ts` | Welcome entry point |

### Backend — Değiştirilecek Dosyalar
| Dosya | Değişiklik |
|-------|-----------|
| `apps/tr_tradehub/tr_tradehub/api/v1/auth.py` | Yeni endpoint'ler ekle |
| `apps/tr_tradehub/tr_tradehub/hooks.py` | Fixtures ekle |

### Backend — Yeni Dosyalar
| Dosya | İçerik |
|-------|--------|
| `fixtures/custom_field__user.json` | User custom field'ları |
| `templates/email/email_verification.html` | OTP email şablonu |
| `templates/email/password_reset.html` | Şifre sıfırlama email şablonu |
