FROM python:3.12-slim-bookworm

# Sistem bağımlılıkları
RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl wget build-essential \
    mariadb-client libmariadb-dev libmariadb-dev-compat \
    libffi-dev liblcms2-dev libldap2-dev libsasl2-dev \
    libtiff5-dev libwebp-dev tcl8.6-dev tk8.6-dev \
    libcairo2 libpango-1.0-0 libpangocairo-1.0-0 \
    redis-tools xvfb libfontconfig sudo \
    && rm -rf /var/lib/apt/lists/*

# Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g yarn \
    && rm -rf /var/lib/apt/lists/*

# wkhtmltopdf
RUN wget -q https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6.1-3/wkhtmltox_0.12.6.1-3.bookworm_amd64.deb \
    && dpkg -i wkhtmltox_0.12.6.1-3.bookworm_amd64.deb 2>/dev/null || apt-get install -f -y \
    && rm -f wkhtmltox_0.12.6.1-3.bookworm_amd64.deb

# frappe kullanıcısı (host UID ile eşleştir)
RUN useradd -m -s /bin/bash -u 1000 frappe \
    && echo "frappe ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

USER frappe
ENV PATH="/home/frappe/.local/bin:${PATH}"

# bench kur
RUN pip install --user --break-system-packages frappe-bench

WORKDIR /home/frappe/frappe-bench

COPY --chown=frappe:frappe entrypoint.sh /home/frappe/entrypoint.sh
RUN chmod +x /home/frappe/entrypoint.sh

EXPOSE 8000 9000

ENTRYPOINT ["/home/frappe/entrypoint.sh"]
CMD ["bench", "start"]
