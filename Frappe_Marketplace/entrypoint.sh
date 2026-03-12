#!/bin/bash
set -e

BENCH_DIR="/home/frappe/frappe-bench"
cd "$BENCH_DIR"

# ─── MariaDB hazır olana kadar bekle ───
wait_for_mariadb() {
    echo "⏳ MariaDB bekleniyor..."
    local max_tries=30
    local count=0
    while ! mariadb -h mariadb -u root -p"${MARIADB_ROOT_PASSWORD:-frappe123}" -e "SELECT 1" > /dev/null 2>&1; do
        count=$((count + 1))
        if [ $count -ge $max_tries ]; then
            echo "❌ MariaDB baglanti zaman asimi!"
            exit 1
        fi
        sleep 2
    done
    echo "✅ MariaDB hazir!"
}

# ─── Redis hazır olana kadar bekle ───
wait_for_redis() {
    echo "⏳ Redis bekleniyor..."
    local max_tries=15
    local count=0
    while ! redis-cli -h redis-cache -p 6379 ping > /dev/null 2>&1; do
        count=$((count + 1))
        if [ $count -ge $max_tries ]; then
            echo "❌ Redis baglanti zaman asimi!"
            exit 1
        fi
        sleep 1
    done
    echo "✅ Redis hazir!"
}

# ─── Python venv oluştur ve app'leri kur ───
setup_venv() {
    if [ -d "$BENCH_DIR/env" ] && [ -f "$BENCH_DIR/env/bin/activate" ]; then
        echo "✅ Python venv mevcut, atlanıyor."
        return
    fi

    echo "📦 Python virtual environment oluşturuluyor..."
    python -m venv "$BENCH_DIR/env"
    source "$BENCH_DIR/env/bin/activate"

    pip install -U pip setuptools wheel

    # Frappe framework'ü kur (ilk sırada olmalı)
    if [ -d "$BENCH_DIR/apps/frappe" ]; then
        echo "📦 frappe kuruluyor..."
        pip install -e "$BENCH_DIR/apps/frappe"
    fi

    # Diğer tüm app'leri apps.txt sırasına göre kur
    if [ -f "$BENCH_DIR/sites/apps.txt" ]; then
        while IFS= read -r app || [ -n "$app" ]; do
            app=$(echo "$app" | tr -d '[:space:]')
            [ -z "$app" ] && continue
            [ "$app" = "frappe" ] && continue
            if [ -d "$BENCH_DIR/apps/$app" ]; then
                echo "📦 $app kuruluyor..."
                pip install -e "$BENCH_DIR/apps/$app" 2>/dev/null || echo "⚠️  $app kurulumu basarisiz, devam ediliyor..."
            fi
        done < "$BENCH_DIR/sites/apps.txt"
    fi

    # Frappe Node.js bağımlılıkları
    if [ -f "$BENCH_DIR/apps/frappe/package.json" ]; then
        echo "📦 Frappe node modulleri kuruluyor..."
        cd "$BENCH_DIR/apps/frappe" && yarn install --production 2>/dev/null || npm install --production 2>/dev/null || true
        cd "$BENCH_DIR"
    fi

    echo "✅ Venv kurulumu tamamlandi!"
}

# ─── config/ dizini oluştur (bench CLI bunu arar) ───
setup_bench_config() {
    mkdir -p "$BENCH_DIR/config/pids"

    # Redis config dosyaları (bench dizin tespiti için gerekli)
    if [ ! -f "$BENCH_DIR/config/redis_cache.conf" ]; then
        cat > "$BENCH_DIR/config/redis_cache.conf" << 'CONF'
# Docker: Redis cache ayrı container'da çalışıyor
# Bu dosya sadece bench CLI dizin tespiti için mevcut
CONF
    fi
    if [ ! -f "$BENCH_DIR/config/redis_queue.conf" ]; then
        cat > "$BENCH_DIR/config/redis_queue.conf" << 'CONF'
# Docker: Redis queue ayrı container'da çalışıyor
# Bu dosya sadece bench CLI dizin tespiti için mevcut
CONF
    fi
    echo "✅ config/ dizini hazir."
}

# ─── common_site_config.json oluştur ───
setup_site_config() {
    mkdir -p "$BENCH_DIR/sites"
    cat > "$BENCH_DIR/sites/common_site_config.json" << EOF
{
    "db_host": "mariadb",
    "db_port": 3306,
    "redis_cache": "redis://redis-cache:6379/0",
    "redis_queue": "redis://redis-queue:6379/0",
    "redis_socketio": "redis://redis-cache:6379/1",
    "socketio_port": 9000,
    "webserver_port": 8000,
    "developer_mode": 1,
    "frappe_user": "frappe",
    "auto_update": false,
    "serve_default_site": true
}
EOF
    echo "✅ common_site_config.json olusturuldu."
}

# ─── Docker uyumlu Procfile oluştur (redis yok, hardcoded yol yok) ───
setup_procfile() {
    cat > "$BENCH_DIR/Procfile" << 'EOF'
web: bench serve --port 8000
socketio: node apps/frappe/socketio.js
watch: bench watch
schedule: while true; do bench schedule; sleep 60; done
worker: bench worker 1>> logs/worker.log 2>> logs/worker.error.log
EOF
    echo "✅ Docker Procfile olusturuldu."
}

# ─── Site oluştur (yoksa) ───
setup_site() {
    local SITE_NAME="${FRAPPE_SITE_NAME:-marketplace.local}"

    if [ -f "$BENCH_DIR/sites/$SITE_NAME/site_config.json" ]; then
        echo "✅ Site '$SITE_NAME' zaten mevcut."
        return
    fi

    echo "🌐 Site olusturuluyor: $SITE_NAME"
    source "$BENCH_DIR/env/bin/activate"
    bench new-site "$SITE_NAME" \
        --mariadb-root-password "${MARIADB_ROOT_PASSWORD:-frappe123}" \
        --admin-password "${FRAPPE_ADMIN_PASSWORD:-admin}" \
        --no-mariadb-socket \
        || echo "⚠️  Site olusturulamadi, devam ediliyor..."

    # App'leri siteye yükle
    if [ -f "$BENCH_DIR/sites/apps.txt" ]; then
        while IFS= read -r app || [ -n "$app" ]; do
            app=$(echo "$app" | tr -d '[:space:]')
            [ -z "$app" ] && continue
            [ "$app" = "frappe" ] && continue
            echo "📦 $app siteye yukleniyor..."
            bench --site "$SITE_NAME" install-app "$app" 2>/dev/null || true
        done < "$BENCH_DIR/sites/apps.txt"
    fi
}

# ═══════════════════════════════════════════
#  ANA AKIŞ
# ═══════════════════════════════════════════
wait_for_mariadb
wait_for_redis
setup_venv
setup_bench_config
setup_site_config
setup_procfile
setup_site

mkdir -p "$BENCH_DIR/logs"

echo ""
echo "🚀 Frappe baslatiliyor..."
echo ""

exec "$@"
