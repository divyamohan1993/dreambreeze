#!/usr/bin/env bash
# =============================================================================
# DreamBreeze - autoconfig.sh
# =============================================================================
# Fully idempotent deployment script for blank Ubuntu.
# Installs all dependencies, builds the app, configures nginx + systemd + ufw,
# and optionally provisions SSL via certbot.
#
# All configuration is read from .env in the same directory as this script.
# Safe to rerun -- checks state before acting, rotates secrets on each run.
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/autoconfig.log"

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  echo "$msg" | tee -a "$LOG_FILE"
}

fail() {
  log "FATAL: $1"
  exit 1
}

# ---------------------------------------------------------------------------
# Load .env defaults
# ---------------------------------------------------------------------------
ENV_FILE="${SCRIPT_DIR}/.env"

if [ ! -f "$ENV_FILE" ]; then
  log "WARNING: .env file not found at $ENV_FILE -- using defaults"
fi

# Source .env if it exists (skip lines starting with # or empty)
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source <(grep -E '^[A-Za-z_][A-Za-z_0-9]*=' "$ENV_FILE" | sed 's/\r$//')
  set +a
fi

APP_NAME="${APP_NAME:-dreambreeze}"
DOMAIN="${DOMAIN:-}"
APP_PORT="${PORT:-3000}"
NODE_ENV="${NODE_ENV:-production}"
APP_USER="${APP_USER:-dreambreeze}"
NVM_VERSION="${NVM_VERSION:-0.40.1}"
NODE_VERSION="${NODE_VERSION:-20}"

log "=========================================="
log "DreamBreeze autoconfig starting"
log "=========================================="
log "APP_NAME    = $APP_NAME"
log "DOMAIN      = ${DOMAIN:-<not set>}"
log "APP_PORT    = $APP_PORT"
log "NODE_ENV    = $NODE_ENV"
log "SCRIPT_DIR  = $SCRIPT_DIR"

# ---------------------------------------------------------------------------
# Phase 1: System packages
# ---------------------------------------------------------------------------
log "--- Phase 1: System packages ---"

export DEBIAN_FRONTEND=noninteractive

if ! command -v nginx &>/dev/null || ! command -v fail2ban-server &>/dev/null || ! command -v ufw &>/dev/null; then
  log "Installing system packages..."
  apt-get update -y
  apt-get install -y --no-install-recommends \
    nginx \
    ufw \
    fail2ban \
    curl \
    ca-certificates \
    gnupg \
    logrotate
  log "System packages installed."
else
  log "System packages already present -- skipping install."
fi

# Ensure fail2ban is running
if ! systemctl is-active --quiet fail2ban; then
  systemctl enable fail2ban
  systemctl start fail2ban
  log "fail2ban enabled and started."
else
  log "fail2ban already running."
fi

# ---------------------------------------------------------------------------
# Phase 2: Install Node.js 20 via nvm
# ---------------------------------------------------------------------------
log "--- Phase 2: Node.js runtime ---"

export NVM_DIR="/root/.nvm"

if [ ! -d "$NVM_DIR" ]; then
  log "Installing nvm ${NVM_VERSION}..."
  curl -o- "https://raw.githubusercontent.com/nvm-sh/nvm/v${NVM_VERSION}/install.sh" | bash
else
  log "nvm already installed."
fi

# Load nvm into current shell
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

if ! nvm ls "$NODE_VERSION" &>/dev/null; then
  log "Installing Node.js ${NODE_VERSION}..."
  nvm install "$NODE_VERSION"
else
  log "Node.js ${NODE_VERSION} already installed."
fi

nvm use "$NODE_VERSION"
nvm alias default "$NODE_VERSION"
log "Node.js $(node -v) active."

# ---------------------------------------------------------------------------
# Phase 3: App dependencies
# ---------------------------------------------------------------------------
log "--- Phase 3: App dependencies ---"

cd "$SCRIPT_DIR"
log "Running npm ci..."
npm ci --ignore-scripts
log "Dependencies installed."

# ---------------------------------------------------------------------------
# Phase 4: Database setup (skipped -- Supabase cloud)
# ---------------------------------------------------------------------------
log "--- Phase 4: Database setup ---"
log "App uses Supabase cloud -- no local database needed. Skipping."

# ---------------------------------------------------------------------------
# Phase 5: Build
# ---------------------------------------------------------------------------
log "--- Phase 5: Build ---"

export NODE_ENV="$NODE_ENV"
log "Running npm run build..."
npm run build
log "Build complete."

# ---------------------------------------------------------------------------
# Phase 6: Nginx reverse proxy
# ---------------------------------------------------------------------------
log "--- Phase 6: Nginx reverse proxy ---"

NGINX_CONF="/etc/nginx/sites-available/${APP_NAME}"
NGINX_LINK="/etc/nginx/sites-enabled/${APP_NAME}"

# Cloudflare IP ranges for real-ip restoration
CF_IPV4=(
  "173.245.48.0/20"
  "103.21.244.0/22"
  "103.22.200.0/22"
  "103.31.4.0/22"
  "141.101.64.0/18"
  "108.162.192.0/18"
  "190.93.240.0/20"
  "188.114.96.0/20"
  "197.234.240.0/22"
  "198.41.128.0/17"
  "162.158.0.0/15"
  "104.16.0.0/13"
  "104.24.0.0/14"
  "172.64.0.0/13"
  "131.0.72.0/22"
)

CF_IPV6=(
  "2400:cb00::/32"
  "2606:4700::/32"
  "2803:f800::/32"
  "2405:b500::/32"
  "2405:8100::/32"
  "2a06:98c0::/29"
  "2c0f:f248::/32"
)

SERVER_NAME="${DOMAIN:-_}"

cat > "$NGINX_CONF" <<NGINXEOF
# DreamBreeze nginx config -- auto-generated by autoconfig.sh
# Regenerated on: $(date '+%Y-%m-%d %H:%M:%S')

upstream dreambreeze_app {
    server 127.0.0.1:${APP_PORT};
    keepalive 64;
}

# Trust Cloudflare IPs for real client IP
$(for ip in "${CF_IPV4[@]}"; do echo "set_real_ip_from ${ip};"; done)
$(for ip in "${CF_IPV6[@]}"; do echo "set_real_ip_from ${ip};"; done)
real_ip_header CF-Connecting-IP;

server {
    listen 80;
    listen [::]:80;
    server_name ${SERVER_NAME};

    # Security headers
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    # Gzip
    gzip on;
    gzip_types text/plain application/json application/javascript text/css image/svg+xml;
    gzip_min_length 256;

    location / {
        proxy_pass http://dreambreeze_app;
        proxy_http_version 1.1;

        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_buffering off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Static assets -- long cache
    location /_next/static/ {
        proxy_pass http://dreambreeze_app;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
NGINXEOF

log "Nginx config written to $NGINX_CONF"

# Enable site, disable default if still active
if [ -L /etc/nginx/sites-enabled/default ]; then
  rm /etc/nginx/sites-enabled/default
  log "Removed default nginx site."
fi

if [ ! -L "$NGINX_LINK" ]; then
  ln -s "$NGINX_CONF" "$NGINX_LINK"
  log "Enabled nginx site: $APP_NAME"
else
  log "Nginx site already enabled."
fi

nginx -t 2>&1 | tee -a "$LOG_FILE"
systemctl reload nginx
log "Nginx reloaded."

# ---------------------------------------------------------------------------
# Phase 7: Systemd service
# ---------------------------------------------------------------------------
log "--- Phase 7: Systemd service ---"

SERVICE_FILE="/etc/systemd/system/${APP_NAME}.service"
NODE_PATH="$(which node)"

cat > "$SERVICE_FILE" <<SVCEOF
# DreamBreeze systemd service -- auto-generated by autoconfig.sh
# Regenerated on: $(date '+%Y-%m-%d %H:%M:%S')
[Unit]
Description=DreamBreeze Next.js Application
Documentation=https://github.com/dreambreeze
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${SCRIPT_DIR}
EnvironmentFile=${ENV_FILE}
Environment=NODE_ENV=${NODE_ENV}
Environment=PORT=${APP_PORT}
Environment=HOSTNAME=0.0.0.0
ExecStart=${NODE_PATH} ${SCRIPT_DIR}/.next/standalone/server.js
Restart=on-failure
RestartSec=5
StartLimitIntervalSec=60
StartLimitBurst=5

# Hardening
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=${SCRIPT_DIR}
ProtectHome=true
PrivateTmp=true

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${APP_NAME}

[Install]
WantedBy=multi-user.target
SVCEOF

log "Systemd service written to $SERVICE_FILE"

systemctl daemon-reload
systemctl enable "$APP_NAME"
systemctl restart "$APP_NAME"
log "Service $APP_NAME enabled and (re)started."

# ---------------------------------------------------------------------------
# Phase 8: UFW firewall
# ---------------------------------------------------------------------------
log "--- Phase 8: UFW firewall ---"

ufw --force reset >/dev/null 2>&1
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment "SSH"
ufw allow 80/tcp comment "HTTP"
ufw allow 443/tcp comment "HTTPS"
ufw --force enable
log "UFW configured: allow 22, 80, 443."

# ---------------------------------------------------------------------------
# Phase 9: SSL via certbot (if DOMAIN is set)
# ---------------------------------------------------------------------------
log "--- Phase 9: SSL ---"

if [ -n "$DOMAIN" ]; then
  if ! command -v certbot &>/dev/null; then
    log "Installing certbot..."
    apt-get install -y --no-install-recommends certbot python3-certbot-nginx
  fi

  log "Requesting SSL certificate for $DOMAIN..."
  certbot --nginx \
    -d "$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --redirect \
    --email "admin@${DOMAIN}" \
    --keep-until-expiring
  log "SSL configured for $DOMAIN."
else
  log "DOMAIN not set in .env -- skipping SSL. Set DOMAIN to enable HTTPS."
fi

# ---------------------------------------------------------------------------
# Secret rotation: NEXTAUTH_SECRET
# ---------------------------------------------------------------------------
log "--- Secret rotation ---"

NEW_SECRET="$(openssl rand -base64 32)"

if grep -q '^NEXTAUTH_SECRET=' "$ENV_FILE" 2>/dev/null; then
  sed -i "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=${NEW_SECRET}|" "$ENV_FILE"
  log "Rotated NEXTAUTH_SECRET in .env"
else
  echo "NEXTAUTH_SECRET=${NEW_SECRET}" >> "$ENV_FILE"
  log "Added NEXTAUTH_SECRET to .env"
fi

# Restart service to pick up new secret
systemctl restart "$APP_NAME"
log "Service restarted with rotated secret."

# ---------------------------------------------------------------------------
# Phase 10: Health check
# ---------------------------------------------------------------------------
log "--- Phase 10: Health check ---"

HEALTH_URL="http://localhost:${APP_PORT}/api/health"
RETRIES=10
DELAY=3

for i in $(seq 1 $RETRIES); do
  log "Health check attempt $i/$RETRIES..."
  HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' "$HEALTH_URL" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" = "200" ]; then
    HEALTH_BODY=$(curl -s "$HEALTH_URL" 2>/dev/null)
    log "Health check PASSED (HTTP 200)"
    log "Response: $HEALTH_BODY"
    break
  fi
  if [ "$i" -eq "$RETRIES" ]; then
    fail "Health check failed after $RETRIES attempts (last HTTP code: $HTTP_CODE)"
  fi
  sleep "$DELAY"
done

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
PUBLIC_IP=$(curl -s --max-time 5 https://ifconfig.me 2>/dev/null || echo "<unknown>")

log ""
log "=========================================="
log "DreamBreeze deployment complete"
log "=========================================="
log "App name     : $APP_NAME"
log "Node.js      : $(node -v)"
log "Domain       : ${DOMAIN:-<not configured>}"
log "Public IP    : $PUBLIC_IP"
log "App port     : $APP_PORT"
log "Nginx        : active (port 80 -> localhost:$APP_PORT)"
log "Systemd      : $APP_NAME.service (enabled)"
log "Firewall     : UFW (22, 80, 443)"
log "SSL          : $([ -n "$DOMAIN" ] && echo "certbot ($DOMAIN)" || echo "not configured")"
log "Health       : $HEALTH_URL -> 200 OK"
log "Log file     : $LOG_FILE"
log "=========================================="
