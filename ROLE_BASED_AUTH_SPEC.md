# TradeHub — Rol Bazlı Kimlik Doğrulama & Erişim Kontrolü Spec

## 1. GENEL BAKIŞ

Bu spec, 3 ayrı panele erişimi yöneten rol tabanlı auth sisteminin tam implementasyon planıdır.

### 1.1 Paneller ve Erişim Tablosu

| Panel | URL | Kimler Erişebilir |
|-------|-----|-------------------|
| **Storefront** | `localhost:5173` | Alıcı, Tedarikçi, Misafir |
| **Satıcı Dashboard** | `localhost:5173/seller` veya ayrı port | Tedarikçi (onaylı Seller Profile) |
| **Süper Admin** | `marketplace.local:8000/app/tradehub` | Sadece System Manager / Administrator |

### 1.2 Kullanıcı Rolleri

| Rol | Frappe Role Adı | Açıklama |
|-----|-----------------|----------|
| Süper Admin | `System Manager` | Tüm sistemi yönetir, Frappe /app erişimi |
| Tedarikçi | `Seller` | Storefront + Satıcı Dashboard erişimi |
| Alıcı | `Buyer` | Sadece Storefront erişimi |
| Misafir | — | Sadece public sayfalar |

---

## 2. MİMARİ

```
┌─────────────────────────────────────────────────────────────────────┐
│                        KULLANICI GİRİŞ AKIŞI                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Login Form                                                          │
│      │                                                               │
│      ▼                                                               │
│  Frappe API → /api/method/login                                      │
│      │                                                               │
│      ▼                                                               │
│  get_session_user() → roles: ["Seller"] / ["Buyer"] / ["System..."] │
│      │                                                               │
│      ├─ System Manager → /app/tradehub (Frappe admin)               │
│      ├─ Seller         → /seller/dashboard                           │
│      └─ Buyer          → / (storefront)                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       KAYIT AKIŞI                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Register Form (AccountType: buyer | supplier)                       │
│      │                                                               │
│      ├─ buyer    → Frappe User (rol: Buyer) → Storefront'a yönlendir │
│      │                                                               │
│      └─ supplier → Frappe User (rol: Buyer başlangıçta)             │
│                     → Seller Application formu doldur                │
│                     → Admin onaylar                                  │
│                     → Rol: Seller atanır                             │
│                     → Satıcı Dashboard erişimi açılır                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. DOSYA KONUMLARI

### 3.1 Storefront Frontend (Alpine.js + TypeScript)
```
/home/bora/Masaüstü/istoc.com/tradehubfront/
├── src/
│   ├── utils/
│   │   ├── auth.ts              ← GÜNCELLENECEk: mock → gerçek API
│   │   └── auth-guard.ts        ← GÜNCELLENECEk: rol kontrolü ekle
│   ├── alpine/
│   │   └── auth.ts              ← GÜNCELLENECEk: backend entegrasyonu
│   ├── components/auth/
│   │   ├── AccountTypeSelector.ts  ← MEVCUT: buyer/supplier seçimi
│   │   ├── RegisterPage.ts         ← GÜNCELLENECEk: supplier için özel form
│   │   └── AccountSetupForm.ts     ← GÜNCELLENECEk: supplier alanları ekle
│   └── pages/
│       ├── login.ts             ← GÜNCELLENECEk: rol bazlı redirect
│       └── register.ts          ← GÜNCELLENECEk: supplier flow
```

### 3.2 Satıcı Dashboard Frontend (Vue 3 + Pinia)
```
/home/bora/Masaüstü/istoc.com/Frappe_Marketplace/frappe-bench/apps/tr_tradehub/frontend/
├── src/
│   ├── stores/
│   │   └── auth.js              ← GÜNCELLENECEk: rol kontrolü ekle
│   ├── router/
│   │   └── index.js             ← GÜNCELLENECEk: Seller role guard
│   └── views/auth/
│       └── LoginView.vue        ← GÜNCELLENECEk: rol bazlı redirect
```

### 3.3 Frappe Backend
```
/home/bora/Masaüstü/istoc.com/Frappe_Marketplace/frappe-bench/apps/
├── tr_tradehub/tr_tradehub/api/v1/
│   ├── auth.py                  ← MEVCUT: SSO endpoints
│   └── identity.py              ← MEVCUT: 2000+ satır identity API
├── tradehub_seller/tradehub_seller/tradehub_seller/doctype/
│   └── seller_application/
│       ├── seller_application.json   ← MEVCUT: DocType schema
│       ├── seller_application.py     ← GÜNCELLENECEk: onay hook'u
│       └── seller_application.js     ← MEVCUT: form script
└── tradehub_core/tradehub_core/tradehub_core/doctype/
    └── keycloak_settings/            ← Rol mapping config
```

---

## 4. BACKEND YAPILACAKLAR

### 4.1 Frappe'de Özel Roller Oluştur

Frappe Admin Panel'de (`/app/role`) şu rolleri oluştur:

```
Rol Adı: Buyer
  - Desk Access: 0 (admin paneline giremesin)

Rol Adı: Seller
  - Desk Access: 0 (admin paneline giremesin)
```

### 4.2 `get_session_user` API Endpoint'i

**Dosya:** `tr_tradehub/tr_tradehub/api/v1/auth.py`

Mevcut endpoint'e şunu ekle/güncelle:

```python
@frappe.whitelist(allow_guest=True)
def get_session_user():
    """Mevcut oturum kullanıcısı ve rollerini döndür"""
    if frappe.session.user == "Guest":
        return {"user": None, "roles": [], "is_guest": True}

    user = frappe.session.user
    roles = frappe.get_roles(user)

    # Seller profile var mı kontrol et
    has_seller_profile = frappe.db.exists("Seller Profile", {"user": user})

    # Pending seller application var mı?
    pending_application = frappe.db.exists(
        "Seller Application",
        {"applicant_user": user, "status": ["not in", ["Approved", "Rejected", "Cancelled"]]}
    )

    return {
        "user": user,
        "full_name": frappe.db.get_value("User", user, "full_name"),
        "roles": roles,
        "is_admin": "System Manager" in roles,
        "is_seller": "Seller" in roles or bool(has_seller_profile),
        "is_buyer": "Buyer" in roles,
        "has_seller_profile": bool(has_seller_profile),
        "pending_seller_application": bool(pending_application),
        "seller_profile": has_seller_profile
    }
```

### 4.3 Kullanıcı Kayıt API Endpoint'i

**Dosya:** `tr_tradehub/tr_tradehub/api/v1/identity.py` (mevcut dosyaya ekle)

```python
@frappe.whitelist(allow_guest=True)
def register_user(email, password, full_name, account_type="buyer", phone=None, country="TR"):
    """
    Yeni kullanıcı kaydı.
    account_type: "buyer" | "supplier"
    """
    # Email zaten var mı?
    if frappe.db.exists("User", email):
        frappe.throw("Bu e-posta adresi zaten kullanılıyor.")

    # Kullanıcı oluştur
    user = frappe.new_doc("User")
    user.email = email
    user.first_name = full_name.split()[0]
    user.last_name = " ".join(full_name.split()[1:]) if len(full_name.split()) > 1 else ""
    user.new_password = password
    user.user_type = "Website User"
    user.send_welcome_email = 0

    # Rol ata
    user.append("roles", {"role": "Buyer"})  # Her zaman Buyer başlangıçta

    user.insert(ignore_permissions=True)
    frappe.db.commit()

    # Buyer Profile oluştur (tradehub_core)
    if frappe.db.exists("DocType", "Buyer Profile"):
        buyer_profile = frappe.new_doc("Buyer Profile")
        buyer_profile.user = email
        buyer_profile.full_name = full_name
        buyer_profile.phone = phone
        buyer_profile.country = country
        buyer_profile.insert(ignore_permissions=True)

    # Supplier ise Seller Application oluştur
    seller_application_name = None
    if account_type == "supplier":
        app = frappe.new_doc("Seller Application")
        app.applicant_user = email
        app.status = "Draft"
        app.insert(ignore_permissions=True)
        seller_application_name = app.name

    frappe.db.commit()

    return {
        "success": True,
        "user": email,
        "account_type": account_type,
        "seller_application": seller_application_name
    }


@frappe.whitelist(allow_guest=True)
def check_email_exists(email):
    """Email adresi kullanımda mı kontrol et"""
    exists = frappe.db.exists("User", email)
    return {"exists": bool(exists)}
```

### 4.4 Seller Application Onay Hook'u

**Dosya:** `tradehub_seller/tradehub_seller/tradehub_seller/doctype/seller_application/seller_application.py`

```python
# on_update metoduna ekle:
def on_update(self):
    if self.status == "Approved":
        self._assign_seller_role()

def _assign_seller_role(self):
    """Onay sonrası kullanıcıya Seller rolü ata"""
    user = frappe.get_doc("User", self.applicant_user)

    # Seller rolü zaten var mı?
    existing_roles = [r.role for r in user.roles]
    if "Seller" not in existing_roles:
        user.append("roles", {"role": "Seller"})
        user.save(ignore_permissions=True)

    frappe.db.commit()
```

### 4.5 Frappe Login API

Frappe'nin yerleşik login endpoint'ini kullan:

```
POST /api/method/login
Body: { "usr": "email@example.com", "pwd": "password123" }
Response: { "message": "Logged In", "home_page": "/", "full_name": "..." }
```

---

## 5. STOREFRONT FRONTEND YAPILACAKLAR (tradehubfront)

### 5.1 `src/utils/auth.ts` — Gerçek API Entegrasyonu

**Mevcut:** Mock localStorage implementasyonu
**Hedef:** Frappe API çağrıları

```typescript
// YENİ auth.ts yapısı

const FRAPPE_BASE = 'http://marketplace.local:8000';

export interface AuthUser {
  email: string;
  full_name: string;
  roles: string[];
  is_admin: boolean;
  is_seller: boolean;
  is_buyer: boolean;
  has_seller_profile: boolean;
  pending_seller_application: boolean;
  seller_profile: string | null;
}

/** Frappe session cookie ile giriş yap */
export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${FRAPPE_BASE}/api/method/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Frappe-CSRF-Token': 'fetch' },
    credentials: 'include',
    body: JSON.stringify({ usr: email, pwd: password })
  });

  if (!res.ok) throw new Error('Giriş başarısız. E-posta veya şifre hatalı.');

  return await getSessionUser();
}

/** Mevcut oturum kullanıcısını getir */
export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch(
      `${FRAPPE_BASE}/api/method/tr_tradehub.api.v1.auth.get_session_user`,
      { credentials: 'include' }
    );
    const data = await res.json();
    if (data.message?.is_guest) return null;
    return data.message;
  } catch {
    return null;
  }
}

/** Kullanıcı rolüne göre yönlendirme URL'si */
export function getRedirectUrl(user: AuthUser): string {
  if (user.is_admin) return 'http://marketplace.local:8000/app/tradehub';
  if (user.is_seller) return '/pages/seller/seller-storefront.html'; // veya seller dashboard
  return '/'; // storefront
}

/** Çıkış */
export async function logout(): Promise<void> {
  await fetch(`${FRAPPE_BASE}/api/method/logout`, {
    method: 'POST',
    credentials: 'include'
  });
}

/** Oturum açık mı? */
export async function isLoggedIn(): Promise<boolean> {
  const user = await getSessionUser();
  return user !== null;
}

/** Yeni kullanıcı kaydı */
export async function register(params: {
  email: string;
  password: string;
  full_name: string;
  account_type: 'buyer' | 'supplier';
  phone?: string;
  country?: string;
}): Promise<{ success: boolean; account_type: string; seller_application?: string }> {
  const res = await fetch(
    `${FRAPPE_BASE}/api/method/tr_tradehub.api.v1.identity.register_user`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Frappe-CSRF-Token': 'fetch' },
      credentials: 'include',
      body: JSON.stringify(params)
    }
  );

  const data = await res.json();
  if (data.exc) throw new Error(data.exc_type || 'Kayıt başarısız');
  return data.message;
}
```

### 5.2 `src/utils/auth-guard.ts` — Rol Bazlı Guard

```typescript
import { getSessionUser } from './auth';

/** Oturum açık değilse login'e yönlendir */
export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    window.location.href = '/pages/auth/login.html';
    return null;
  }
  return user;
}

/** Seller rolü gerektiren sayfalar için */
export async function requireSeller() {
  const user = await requireAuth();
  if (!user) return;

  if (!user.is_seller) {
    // Pending application varsa bilgi sayfasına yönlendir
    if (user.pending_seller_application) {
      window.location.href = '/pages/seller/application-pending.html';
    } else {
      window.location.href = '/';
    }
  }
  return user;
}

/** Admin girişini engelle — storefront sayfalarında kullan */
export async function blockAdmin() {
  const user = await getSessionUser();
  if (user?.is_admin) {
    window.location.href = 'http://marketplace.local:8000/app/tradehub';
  }
  return user;
}
```

### 5.3 `src/alpine/auth.ts` — Register Akışı Güncelleme

`registerPage` Alpine component'ine eklenecekler:

```typescript
// goToStep 'setup' case'ine ekle:
case 'setup': {
  const container = this.$refs.setupContainer;
  if (container) {
    // Supplier için genişletilmiş form render et
    container.innerHTML = this.accountType === 'supplier'
      ? SupplierSetupForm('TR')
      : AccountSetupForm('TR');
  }
  // ... form init
  break;
}

// onComplete callback'ine ekle:
onComplete: async (formData) => {
  try {
    const result = await register({
      email: this.email,
      password: formData.password,
      full_name: formData.fullName,
      account_type: this.accountType, // 'buyer' | 'supplier'
      phone: formData.phone,
      country: formData.country || 'TR'
    });

    // Login yap
    const user = await login(this.email, formData.password);

    // Rol bazlı yönlendir
    if (this.accountType === 'supplier') {
      // Seller Application sayfasına yönlendir
      window.location.href = '/pages/seller/application-form.html';
    } else {
      window.location.href = '/'; // storefront
    }
  } catch (err) {
    showToast({ message: err.message, type: 'error' });
  }
}
```

### 5.4 Login Sayfası — Rol Bazlı Yönlendirme

**Dosya:** `src/pages/login.ts` veya `src/alpine/auth.ts` içindeki login handler

```typescript
// Login submit handler
async function handleLogin(email: string, password: string) {
  try {
    const user = await login(email, password);

    if (user.is_admin) {
      // Admin → Frappe admin paneline yönlendir
      window.location.href = 'http://marketplace.local:8000/app/tradehub';
    } else if (user.is_seller) {
      // Seller → Seller dashboard + storefront erişimi
      // Seller dashboard'a yönlendir (tr_tradehub frontend)
      window.location.href = 'http://localhost:PORT/'; // seller dashboard URL
    } else {
      // Buyer → storefront
      window.location.href = '/';
    }
  } catch (err) {
    showToast({ message: 'Giriş başarısız. E-posta veya şifre hatalı.', type: 'error' });
  }
}
```

### 5.5 Supplier Kayıt Formu Bileşeni

**Yeni dosya:** `src/components/auth/SupplierSetupForm.ts`

Alıcı formuna ek olarak şu alanları içerir:

```typescript
export function SupplierSetupForm(defaultCountry = 'TR'): string {
  return `
    <!-- Standart alanlar (buyer formuyla aynı) -->
    <div class="form-group">
      <label>Ad Soyad *</label>
      <input type="text" name="fullName" required />
    </div>

    <div class="form-group">
      <label>Şifre *</label>
      <input type="password" name="password" required />
    </div>

    <div class="form-group">
      <label>Telefon *</label>
      <input type="tel" name="phone" required />
    </div>

    <!-- Tedarikçiye özel alanlar -->
    <div class="form-group">
      <label>Şirket Adı *</label>
      <input type="text" name="businessName" required
             placeholder="Marketplace'de görünecek ad" />
    </div>

    <div class="form-group">
      <label>Satıcı Türü *</label>
      <select name="sellerType" required>
        <option value="Individual">Bireysel</option>
        <option value="Business">Kurumsal</option>
        <option value="Enterprise">Enterprise</option>
      </select>
    </div>

    <div class="form-group">
      <label>Vergi No / TCKN *</label>
      <input type="text" name="taxId" required />
    </div>

    <div class="form-group">
      <label>Ülke</label>
      <select name="country">
        <option value="TR" selected>Türkiye</option>
        <!-- diğer ülkeler -->
      </select>
    </div>

    <button type="submit">Devam Et</button>

    <p class="info-text">
      Tedarikçi başvurunuz incelendikten sonra
      satıcı paneline erişiminiz açılacaktır.
    </p>
  `;
}
```

---

## 6. SATICI DASHBOARD FRONTEND YAPILACAKLAR (tr_tradehub/frontend)

### 6.1 `src/router/index.js` — Seller Guard

```javascript
// router/index.js navigation guard'ına ekle:
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      await authStore.fetchUser();
    }

    if (!authStore.isAuthenticated) {
      return next('/login');
    }

    // Seller rolü kontrolü — admin paneli değil, seller dashboard
    const roles = authStore.user?.roles || [];
    const isSeller = roles.includes('Seller') || authStore.user?.has_seller_profile;

    if (!isSeller) {
      // Seller değilse storefront'a yönlendir
      window.location.href = 'http://localhost:5173/';
      return;
    }
  }

  next();
});
```

### 6.2 `src/stores/auth.js` — Rol Bilgisi Ekle

```javascript
// fetchUser fonksiyonunu güncelle:
async function fetchUser() {
  try {
    const data = await api.call(
      'tr_tradehub.api.v1.auth.get_session_user'
    );
    user.value = data;
  } catch {
    user.value = null;
  }
}

// Yeni computed ekle:
const isSeller = computed(() =>
  user.value?.is_seller || user.value?.roles?.includes('Seller')
);

const isAdmin = computed(() =>
  user.value?.is_admin || user.value?.roles?.includes('System Manager')
);
```

---

## 7. SÜPER ADMIN PANELİ YÖNETİMİ (Frappe /app)

Süper admin aşağıdaki DocType'lar üzerinden tüm sistemi yönetir:

### 7.1 Kullanıcı Yönetimi

**Frappe Admin → Users (Kullanıcılar)**

| İşlem | Yol |
|-------|-----|
| Kullanıcıları listele | `/app/user` |
| Rol ata/kaldır | User kaydı → Roles bölümü |
| Kullanıcıyı deaktive et | User → `Enabled: 0` |

### 7.2 Seller Application Yönetimi

**Frappe Admin → TradeHub Seller → Seller Application**

Onay akışı:
```
Draft → Submitted → Under Review → Approved ✓
                                → Rejected ✗
                                → Documents Requested
```

**Onay sonrası otomatik:** Kullanıcıya `Seller` rolü atanır (hook ile — bkz. 4.4)

### 7.3 Admin Paneline Erişim Engeli

Login sonrası `Buyer` ve `Seller` rolündeki kullanıcıların `/app` adresine erişimini engellemek için:

**Frappe Admin → Role → Buyer/Seller:**
- `Desk Access: 0` yap

Bu ayar ile Buyer/Seller rolündeki kullanıcılar `/app` adresine gittiğinde otomatik olarak engellenir.

---

## 8. SELLER APPLICATION SAYFASI (Yeni Sayfa)

**Konum:** `tradehubfront/pages/seller/application-form.html`

Bu sayfa, tedarikçi kaydı yapan kullanıcıların Seller Application bilgilerini tamamladığı formdur.

### Sayfa Akışı:
```
Tedarikçi Kaydı → application-form.html → Frappe'ye gönder
                                        → "Başvurunuz alındı" mesajı
                                        → application-pending.html
                                          (admin onayını bekle)
                                        → Onay → Seller Dashboard erişimi
```

### Seller Application Form Alanları:

```html
<!-- Temel Bilgiler -->
- business_name: Şirket / Mağaza Adı
- seller_type: Bireysel / Kurumsal / Enterprise
- tax_id: Vergi No veya TCKN

<!-- Kimlik Belgesi -->
- identity_document_type: Kimlik / Pasaport / Sürücü Belgesi
- identity_document_file: Dosya yükleme

<!-- İşletme Belgeleri (Kurumsal için) -->
- trade_registry: Ticaret Sicil Gazetesi
- tax_certificate: Vergi Levhası
- signature_circular: İmza Sirküleri

<!-- Banka Bilgileri -->
- iban: IBAN numarası
- bank_name: Banka adı
- account_holder: Hesap sahibi adı

<!-- Tercih Edilen Kategoriler -->
- preferred_categories: Çoklu seçim (Category tree'den)
```

### API Endpoint:

```typescript
// Seller Application oluştur / güncelle
POST /api/resource/Seller Application
Body: {
  "applicant_user": "user@email.com",
  "business_name": "...",
  "seller_type": "Business",
  "status": "Submitted"
  // ... diğer alanlar
}
```

---

## 9. UYGULAMA SIRASI (Öncelik Sırasına Göre)

### Sprint 1 — Temel Auth (Backend + Login/Register)
- [ ] Frappe'de `Buyer` ve `Seller` rolleri oluştur (Desk Access: 0)
- [ ] `get_session_user` endpoint'ini güncelle (rol + seller_profile bilgisi)
- [ ] `register_user` endpoint'ini yaz
- [ ] `seller_application.py` → onay hook'u ekle
- [ ] `tradehubfront/src/utils/auth.ts` → gerçek API'ye geç
- [ ] Login sayfasında rol bazlı yönlendirme

### Sprint 2 — Register Akışı
- [ ] Supplier kayıt formu (ek alanlar: businessName, taxId, sellerType)
- [ ] Register → API çağrısı → otomatik login → yönlendirme
- [ ] `application-form.html` sayfası oluştur
- [ ] Seller Application → Frappe API'ye gönder

### Sprint 3 — Seller Dashboard Güvenliği
- [ ] `tr_tradehub/frontend` router guard güncelle
- [ ] Auth store'a `isSeller` computed ekle
- [ ] Pending application sayfası (`application-pending.html`)

### Sprint 4 — Admin Panel Refinement
- [ ] Süper admin login testi
- [ ] Buyer/Seller → `/app` erişim engeli test
- [ ] Seller Application onay workflow testi

---

## 10. CORS VE SESSION KONFİGÜRASYONU

### Frappe CORS Ayarları

**Dosya:** `frappe-bench/sites/marketplace.local/site_config.json`'a ekle:

```json
{
  "allow_cors": "http://localhost:5173",
  "cors_origins": ["http://localhost:5173", "http://localhost:5174"],
  "ignore_csrf_errors_for_api": 1
}
```

### Session Cookie (Cross-Origin)

```javascript
// Tüm API isteklerinde credentials: 'include' kullan
fetch(url, {
  credentials: 'include',        // Session cookie'yi gönder
  headers: {
    'X-Frappe-CSRF-Token': 'fetch'  // Frappe CSRF token
  }
})
```

---

## 11. TEST SENARYOLARI

### 11.1 Admin Login Testi
1. `administrator` / `yenisifre123` ile giriş yap
2. Storefront'ta login formu aracılığıyla giriş
3. **Beklenen:** `http://marketplace.local:8000/app/tradehub` yönlendirmesi

### 11.2 Alıcı Kaydı Testi
1. Kayıt formunda "Alıcı" seç
2. Formu tamamla
3. **Beklenen:** Storefront anasayfasına yönlendirme
4. **Beklenen:** Satıcı dashboard erişimi YOK

### 11.3 Tedarikçi Kaydı → Onay Akışı
1. Kayıt formunda "Tedarikçi" seç
2. Seller Application formu doldur
3. Admin panelden başvuruyu onayla
4. **Beklenen:** Kullanıcıya `Seller` rolü atanır
5. Kullanıcı tekrar giriş yapar
6. **Beklenen:** Seller Dashboard + Storefront erişimi

### 11.4 Yetkisiz Erişim Testi
1. Buyer olarak giriş yap
2. Seller Dashboard URL'sine doğrudan git
3. **Beklenen:** Storefront'a yönlendirme

---

## 12. NOTLAR VE KISITLAMALAR

1. **Keycloak Entegrasyonu:** Mevcut sistemde Keycloak SSO hazır. Başlangıçta Frappe native login kullanılabilir, sonra Keycloak'a migrate edilir.

2. **CSRF Token:** Frappe API'lerine istek yaparken `X-Frappe-CSRF-Token: fetch` header'ı zorunlu.

3. **Cookie Domain:** Storefront (localhost:5173) ve Frappe (marketplace.local:8000) farklı origin'de. `credentials: 'include'` ile session cookie paylaşımı yapılır. Frappe'nin `allow_cors` ayarı doğru yapılandırılmalı.

4. **AccountType değeri:** Mevcut `AccountTypeSelector.ts`'te `'buyer' | 'supplier'` tipleri kullanılıyor. Register flow'da `account_type` parametresi olarak Frappe'ye geçilecek.

5. **Seller Dashboard URL:** `tr_tradehub/frontend` için build output URL'si belirlenmeli ve `getRedirectUrl()` fonksiyonuna eklenmeli.

6. **hosts dosyası:** `marketplace.local` için `/etc/hosts`'a `127.0.0.1 marketplace.local` ekli olmalı.
