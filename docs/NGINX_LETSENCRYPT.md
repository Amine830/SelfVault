# Nginx Reverse Proxy + Let's Encrypt SSL Guide

This guide explains how to set up Nginx as a reverse proxy with automatic SSL certificates from Let's Encrypt for your SelfVault deployment.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Option 1: Docker with Nginx Proxy Manager](#option-1-docker-with-nginx-proxy-manager)
4. [Option 2: Docker with Traefik](#option-2-docker-with-traefik)
5. [Option 3: Native Nginx + Certbot](#option-3-native-nginx--certbot)
6. [SSL Configuration Best Practices](#ssl-configuration-best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
                    ┌────────────────────────────────────────────────────────┐
                    │                     Your Server                        │
                    │                                                        │
Internet ──────────>│  ┌─────────────────┐                                   │
   :443 (HTTPS)     │  │  Nginx/Traefik  │                                   │
                    │  │  Reverse Proxy  │                                   │
                    │  │  + Let's Encrypt│                                   │
                    │  └────────┬────────┘                                   │
                    │           │                                            │
                    │     ┌─────┴─────┐                                      │
                    │     ▼           ▼                                      │
                    │  ┌─────────┐ ┌─────────┐                               │
                    │  │Frontend │ │ Backend │                               │
                    │  │  :80    │ │  :8080  │                               │
                    │  └─────────┘ └─────────┘                               │
                    │                                                        │
                    └────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- A server with a public IP address
- A domain name pointing to your server (A record)
- Docker and Docker Compose installed
- Ports 80 and 443 open in your firewall

```bash
# Verify DNS is properly configured
dig +short your-domain.com
# Should return your server's IP

# Open firewall ports (Ubuntu/Debian with ufw)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

---

## Option 1: Docker with Nginx Proxy Manager

The easiest option with a web UI for managing certificates.

### Step 1: Create docker-compose.ssl.yml

```yaml
# docker-compose.ssl.yml
version: '3.8'

services:
  # Nginx Proxy Manager
  npm:
    image: 'jc21/nginx-proxy-manager:latest'
    container_name: nginx-proxy-manager
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
      - '81:81'  # Admin UI
    volumes:
      - npm_data:/data
      - npm_letsencrypt:/etc/letsencrypt
    networks:
      - selfvault-network

  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: selfvault-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: selfvault
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: selfvault
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - selfvault-network

  # MinIO
  minio:
    image: minio/minio:latest
    container_name: selfvault-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
    networks:
      - selfvault-network

  # Backend
  backend:
    build: ./backend
    container_name: selfvault-backend
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://selfvault:${POSTGRES_PASSWORD}@postgres:5432/selfvault
      DIRECT_URL: postgresql://selfvault:${POSTGRES_PASSWORD}@postgres:5432/selfvault
      STORAGE_PROVIDER: s3
      S3_ENDPOINT: http://minio:9000
      S3_REGION: us-east-1
      S3_BUCKET: selfvault
      S3_ACCESS_KEY_ID: ${MINIO_ROOT_USER:-minioadmin}
      S3_SECRET_ACCESS_KEY: ${MINIO_ROOT_PASSWORD}
      S3_FORCE_PATH_STYLE: "true"
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    depends_on:
      - postgres
      - minio
    networks:
      - selfvault-network

  # Frontend
  frontend:
    build: ./frontend
    container_name: selfvault-frontend
    restart: unless-stopped
    networks:
      - selfvault-network

volumes:
  npm_data:
  npm_letsencrypt:
  postgres_data:
  minio_data:

networks:
  selfvault-network:
    driver: bridge
```

### Step 2: Start Services

```bash
# Create .env file
cat > .env << EOF
POSTGRES_PASSWORD=your-secure-postgres-password
MINIO_ROOT_PASSWORD=your-secure-minio-password
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
EOF

# Start all services
docker compose -f docker-compose.ssl.yml up -d
```

### Step 3: Configure Nginx Proxy Manager

1. Access the admin UI at `http://your-server-ip:81`
2. Default credentials: `admin@example.com` / `changeme`
3. Change the default password

4. Add Proxy Host for Frontend:
   - Domain: `your-domain.com`
   - Scheme: `http`
   - Forward Hostname: `frontend`
   - Forward Port: `80`
   - Enable "Block Common Exploits"
   - SSL Tab: Request new SSL certificate with Let's Encrypt
   - Enable "Force SSL" and "HTTP/2 Support"

5. Add Proxy Host for Backend API:
   - Domain: `api.your-domain.com` (or use path-based routing)
   - Scheme: `http`
   - Forward Hostname: `backend`
   - Forward Port: `8080`
   - Advanced Tab: Add custom Nginx config:
     ```nginx
     proxy_set_header X-Real-IP $remote_addr;
     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
     client_max_body_size 100M;
     ```

---

## Option 2: Docker with Traefik

A more automated approach with automatic certificate management.

### Step 1: Create docker-compose.traefik.yml

```yaml
# docker-compose.traefik.yml
version: '3.8'

services:
  traefik:
    image: traefik:v3.0
    container_name: traefik
    restart: unless-stopped
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--entrypoints.web.http.redirections.entryPoint.to=websecure"
      - "--entrypoints.web.http.redirections.entryPoint.scheme=https"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=${ACME_EMAIL}"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik_letsencrypt:/letsencrypt
    networks:
      - selfvault-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=Host(`traefik.${DOMAIN}`)"
      - "traefik.http.routers.dashboard.service=api@internal"
      - "traefik.http.routers.dashboard.tls.certresolver=letsencrypt"
      - "traefik.http.routers.dashboard.middlewares=auth"
      - "traefik.http.middlewares.auth.basicauth.users=${TRAEFIK_USERS}"

  postgres:
    image: postgres:15-alpine
    container_name: selfvault-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: selfvault
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: selfvault
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - selfvault-network

  minio:
    image: minio/minio:latest
    container_name: selfvault-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
    networks:
      - selfvault-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.minio-console.rule=Host(`minio.${DOMAIN}`)"
      - "traefik.http.routers.minio-console.tls.certresolver=letsencrypt"
      - "traefik.http.routers.minio-console.service=minio-console"
      - "traefik.http.services.minio-console.loadbalancer.server.port=9001"

  backend:
    build: ./backend
    container_name: selfvault-backend
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://selfvault:${POSTGRES_PASSWORD}@postgres:5432/selfvault
      DIRECT_URL: postgresql://selfvault:${POSTGRES_PASSWORD}@postgres:5432/selfvault
      STORAGE_PROVIDER: s3
      S3_ENDPOINT: http://minio:9000
      S3_REGION: us-east-1
      S3_BUCKET: selfvault
      S3_ACCESS_KEY_ID: ${MINIO_ROOT_USER:-minioadmin}
      S3_SECRET_ACCESS_KEY: ${MINIO_ROOT_PASSWORD}
      S3_FORCE_PATH_STYLE: "true"
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    depends_on:
      - postgres
      - minio
    networks:
      - selfvault-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`${DOMAIN}`) && PathPrefix(`/api`)"
      - "traefik.http.routers.backend.tls.certresolver=letsencrypt"
      - "traefik.http.services.backend.loadbalancer.server.port=8080"

  frontend:
    build: ./frontend
    container_name: selfvault-frontend
    restart: unless-stopped
    networks:
      - selfvault-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`${DOMAIN}`)"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
      - "traefik.http.services.frontend.loadbalancer.server.port=80"

volumes:
  traefik_letsencrypt:
  postgres_data:
  minio_data:

networks:
  selfvault-network:
    driver: bridge
```

### Step 2: Configure Environment

```bash
# Create .env file
cat > .env << EOF
DOMAIN=your-domain.com
ACME_EMAIL=your-email@example.com
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
MINIO_ROOT_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
# Generate with: htpasswd -nb admin secure-password
TRAEFIK_USERS=admin:\$apr1\$xyz...
EOF

# Start services
docker compose -f docker-compose.traefik.yml up -d

# Check certificates
docker compose -f docker-compose.traefik.yml logs traefik | grep -i certificate
```

---

## Option 3: Native Nginx + Certbot

For non-Docker deployments or when you prefer native installation.

### Step 1: Install Nginx and Certbot

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install -y nginx certbot python3-certbot-nginx
```

### Step 2: Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/selfvault
```

```nginx
# /etc/nginx/sites-available/selfvault

# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# Upstream definitions
upstream frontend {
    server 127.0.0.1:3000;  # Or Docker container IP
}

upstream backend {
    server 127.0.0.1:8080;
}

# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS - Main server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com;

    # SSL certificates (will be created by Certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL configuration
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern TLS configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # Max upload size
    client_max_body_size 100M;

    # API routes
    location /api {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts for file uploads
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Frontend routes
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # SPA fallback
        try_files $uri $uri/ /index.html;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Step 3: Enable Site and Obtain Certificate

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/selfvault /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Create webroot for ACME challenges
sudo mkdir -p /var/www/certbot

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Reload Nginx
sudo systemctl reload nginx
```

### Step 4: Setup Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot auto-renewal is usually set up automatically
# Check with:
sudo systemctl status certbot.timer

# Or add a cron job manually
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo tee -a /etc/crontab
```

---

## SSL Configuration Best Practices

### Test Your SSL Configuration

```bash
# Use SSL Labs
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com

# Or use testssl.sh locally
docker run --rm -ti drwetter/testssl.sh your-domain.com
```

### OCSP Stapling (Optional Enhancement)

Add to your Nginx SSL configuration:

```nginx
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/letsencrypt/live/your-domain.com/chain.pem;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
```

### Content Security Policy (Optional)

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://api.your-domain.com;" always;
```

---

## Troubleshooting

### Certificate Not Renewing

```bash
# Check certificate status
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# Check logs
sudo journalctl -u certbot
```

### 502 Bad Gateway

```bash
# Check if backend is running
docker compose ps

# Check backend logs
docker compose logs backend

# Verify upstream is reachable
curl http://localhost:8080/api/health
```

### SSL Certificate Errors

```bash
# Verify certificate chain
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Check certificate expiry
echo | openssl s_client -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Rate Limiting by Let's Encrypt

Let's Encrypt has rate limits:
- 50 certificates per registered domain per week
- 5 duplicate certificates per week
- 5 failed validations per hour

For testing, use the staging environment:

```bash
certbot --nginx --staging -d your-domain.com
```

### Nginx Reload Without Downtime

```bash
# Test configuration first
sudo nginx -t

# Graceful reload
sudo nginx -s reload
```

---

## Quick Start Checklist

- [ ] DNS A record points to your server IP
- [ ] Ports 80 and 443 are open
- [ ] Choose deployment option (NPM, Traefik, or Native)
- [ ] Configure environment variables
- [ ] Start services
- [ ] Obtain SSL certificate
- [ ] Test HTTPS access
- [ ] Verify auto-renewal
- [ ] Test SSL configuration with SSL Labs

---

## Additional Resources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
