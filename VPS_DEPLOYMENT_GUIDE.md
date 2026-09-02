# Masuma ERP & B2B Wholesale System - VPS & Production Deployment Manual

This comprehensive guide covers deploying and hosting the **Masuma POS, ERP & B2B Wholesale Operating Suite** across any Virtual Private Server (VPS) or cloud hosting platform, including **Contabo with CloudPanel**, **cPanel/WHM**, **Standard Ubuntu/Debian Linux VPS with Nginx**, and **Docker**.

---

## Table of Contents
1. [Architecture Overview & Prerequisites](#1-architecture-overview--prerequisites)
2. [Option A: Deploying on Contabo with CloudPanel (Recommended)](#2-option-a-deploying-on-contabo-with-cloudpanel)
3. [Option B: Deploying on cPanel / WHM](#3-option-b-deploying-on-cpanel--whm)
4. [Option C: Deploying on a Raw Linux VPS (Ubuntu 22.04 / 24.04 + Nginx + Let's Encrypt)](#4-option-c-deploying-on-a-raw-linux-vps-ubuntu-nginx)
5. [Option D: Deploying with Docker & Docker Compose](#5-option-d-deploying-with-docker--docker-compose)
6. [Essential Production Web Server Configurations](#6-essential-production-web-server-configurations)
7. [Automated CI/CD & GitHub Deployments](#7-automated-cicd--github-deployments)
8. [Troubleshooting Common Production Issues](#8-troubleshooting-common-production-issues)

---

## 1. Architecture Overview & Prerequisites

### Architecture
- **Framework**: React 18+ (Single Page Application) with TypeScript & Vite.
- **Styling**: Tailwind CSS with dark/light themes.
- **Build Output**: Optimized static assets in the `/dist` directory (`index.html`, javascript bundles, css stylesheets, and assets).
- **Client-Side Routing**: Handled by React Router (Requires Nginx or Apache URL rewrite rules to avoid `404 Not Found` when refreshing sub-pages like `/pos` or `/inventory`).

### Domain & DNS Setup
Before starting:
1. Point your domain or subdomain (e.g. `erp.masuma.co.ke` or `pos.yourdomain.com`) to your VPS server's public IP address using an **A Record** in your DNS manager (Cloudflare, Namecheap, GoDaddy, Contabo DNS, etc.).
2. TTL: Set to `Auto` or `300 seconds`.

---

## 2. Option A: Deploying on Contabo with CloudPanel

CloudPanel is a free, high-performance PHP/NodeJS server management panel that runs on Contabo, Hetzner, AWS, or DigitalOcean with built-in Nginx, Let's Encrypt SSL, and multi-user support.

### Step 1: Install CloudPanel on your Contabo VPS (If not already installed)
If you purchased a fresh Contabo Ubuntu 22.04/24.04 VPS:
```bash
# Connect via SSH
ssh root@YOUR_SERVER_IP

# Update packages and install CloudPanel
apt update && apt upgrade -y && curl -sS https://installer.cloudpanel.io/ce/v2/install.sh -o install.sh && bash install.sh
```
Access CloudPanel in your browser at: `https://YOUR_SERVER_IP:8443`

---

### Step 2: Create a Static HTML / React Site in CloudPanel
1. In CloudPanel dashboard, navigate to **Sites** → click **+ Add Site**.
2. Select **Create a Static HTML / JavaScript Site** (or **NodeJS Site**).
3. Fill in the site details:
   - **Domain Name**: `erp.masuma.co.ke` (or your domain)
   - **Site User**: Create a new user (e.g. `masuma-admin`)
   - Click **Create**.

---

### Step 3: Build and Upload the Application

#### Method 1: Build Locally & Upload via CloudPanel File Manager
1. In your local development machine:
   ```bash
   npm install
   npm run build
   ```
2. Compress the contents of the generated `dist` folder into a `dist.zip` file:
   ```bash
   cd dist && zip -r ../dist.zip . && cd ..
   ```
3. In CloudPanel:
   - Go to **Sites** → click `erp.masuma.co.ke` → **File Manager**.
   - Navigate to `/home/masuma-admin/htdocs/erp.masuma.co.ke/`.
   - Delete the placeholder `index.html`.
   - Click **Upload File** and select `dist.zip`.
   - Extract `dist.zip` directly in the root directory.

#### Method 2: Clone and Build Directly on VPS via SSH
```bash
# Navigate to your site root directory
cd /home/masuma-admin/htdocs/erp.masuma.co.ke

# Clone your repository or extract your code
git clone https://github.com/your-org/masuma-pos.git .

# Install dependencies and build
npm install
npm run build

# Copy build artifacts to the webroot
cp -r dist/* .
```

---

### Step 4: Configure CloudPanel Nginx Vhost for React Router SPA
To ensure pages like `/inventory`, `/pos`, or `/settings` do not return a 404 when directly loaded or refreshed:

1. In CloudPanel, open **Sites** → `erp.masuma.co.ke` → **Vhost** tab.
2. Ensure the `location /` directive includes `try_files $uri $uri/ /index.html;`:

```nginx
server {
  listen 80;
  listen [::]:80;
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name erp.masuma.co.ke;
  root /home/masuma-admin/htdocs/erp.masuma.co.ke;

  index index.html;

  # SSL certificates managed by CloudPanel
  ssl_certificate /etc/nginx/ssl-certificates/erp.masuma.co.ke.crt;
  ssl_certificate_key /etc/nginx/ssl-certificates/erp.masuma.co.ke.key;

  # Security Headers
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "no-referrer-when-downgrade" always;

  # Gzip Compression for Ultra-Fast POS Loading
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

  # React SPA Route Fallback
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Cache static assets (images, fonts, scripts)
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 30d;
    add_header Cache-Control "public, no-transform";
  }

  # Block access to hidden files
  location ~ /\. {
    deny all;
  }
}
```
3. Click **Save**.

---

### Step 5: Issue Free Let's Encrypt SSL Certificate
1. In CloudPanel, click the **SSL/TLS** tab.
2. Click **New Let's Encrypt Certificate**.
3. Check your domain name and click **Create and Install**.
4. Enable **Force HTTPS**.

---

## 3. Option B: Deploying on cPanel / WHM

If you are using cPanel on a VPS or shared hosting account:

### Step 1: Build the App Locally
Run the production build command on your workstation:
```bash
npm install
npm run build
```
This generates the standalone `/dist` folder.

### Step 2: Upload to cPanel `public_html`
1. Log in to your **cPanel** account.
2. Open **File Manager**.
3. Navigate to `public_html` (or your subdomain directory, e.g. `public_html/erp`).
4. Upload all files and folders located **inside** your local `dist` folder:
   - `index.html`
   - `assets/` (folder containing bundled JS and CSS)
   - `vite.svg` or any images

### Step 3: Add `.htaccess` for React Router Rewrite Rules
In cPanel File Manager:
1. Click **Settings** (top right) → check **Show Hidden Files (dotfiles)** → click **Save**.
2. If `.htaccess` does not exist in `public_html`, click **+ File** and create `.htaccess`.
3. Edit `.htaccess` and paste the following configuration:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Force HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # Don't rewrite real existing files or directories
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l

  # Route all other URLs to index.html for React Router
  RewriteRule . /index.html [L]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-XSS-Protection "1; mode=block"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Browser Caching for Production Performance
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```
4. Save changes.

### Step 4: Enable SSL in cPanel
1. Go to **cPanel** → **SSL/TLS Status**.
2. Select your domain and click **Run AutoSSL**.

---

## 4. Option C: Deploying on a Raw Linux VPS (Ubuntu / Debian + Nginx)

For developers deploying directly onto a clean Ubuntu 22.04 or 24.04 LTS server:

### Step 1: Initial Server Hardening & Dependencies
```bash
# SSH into your VPS
ssh root@YOUR_SERVER_IP

# Update system
apt update && apt upgrade -y

# Install Nginx, Git, Node.js 20.x, and UFW Firewall
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nginx git ufw nodejs

# Configure Firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

---

### Step 2: Clone and Build the Application
```bash
# Create deployment directory
mkdir -p /var/www/masuma-erp
cd /var/www/masuma-erp

# Clone your project repository
git clone https://github.com/your-username/masuma-pos.git .

# Install dependencies and build static output
npm install
npm run build

# Ensure correct permissions for Nginx user
chown -R www-data:www-data /var/www/masuma-erp/dist
chmod -R 755 /var/www/masuma-erp/dist
```

---

### Step 3: Create Nginx Server Block
Create `/etc/nginx/sites-available/masuma-erp.conf`:
```bash
nano /etc/nginx/sites-available/masuma-erp.conf
```

Paste the following Nginx server block:
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name erp.masuma.co.ke www.erp.masuma.co.ke;

    root /var/www/masuma-erp/dist;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json image/svg+xml;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # SPA Routing Fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static Assets Caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
        access_log off;
    }

    # Block access to hidden files (.env, .git, etc.)
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

Enable the configuration and reload Nginx:
```bash
ln -s /etc/nginx/sites-available/masuma-erp.conf /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

### Step 4: Install Free SSL with Certbot
```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Obtain and install SSL Certificate
certbot --nginx -d erp.masuma.co.ke -d www.erp.masuma.co.ke

# Certbot automatically configures auto-renewal via systemd timer
systemctl status certbot.timer
```

---

## 5. Option D: Deploying with Docker & Docker Compose

If your VPS runs Docker and Docker Compose (e.g. via Portainer, Coolify, or CLI):

### 1. Dockerfile
Create a `Dockerfile` in the root of your project:
```dockerfile
# Stage 1: Build the React Application
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with Lightweight Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. Custom Nginx config for Docker (`nginx.conf`)
```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
}
```

### 3. `docker-compose.yml`
```yaml
version: '3.8'

services:
  masuma-erp:
    build: .
    container_name: masuma-erp-prod
    restart: always
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=production
```

Run container:
```bash
docker compose up -d --build
```
You can then place Nginx, Traefik, or Cloudflare Tunnel in front of port `8080` for SSL termination.

---

## 6. Essential Production Web Server Configurations

### 1. Daily / Weekly Automated Data Backup Script
To ensure your local database, settings, and transaction ledgers stored in the persistent database are backed up automatically, create a simple cronjob script `/root/backup_erp.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/root/erp_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

# Backup webroot files
tar -czf "$BACKUP_DIR/erp_static_$TIMESTAMP.tar.gz" -C /var/www/masuma-erp dist/

# Retain only last 14 days of backups
find "$BACKUP_DIR" -type f -name "*.tar.gz" -mtime +14 -exec rm {} \;

echo "Backup completed successfully at $TIMESTAMP"
```
Add to crontab (`crontab -e`):
```cron
0 3 * * * /bin/bash /root/backup_erp.sh >> /var/log/erp_backup.log 2>&1
```

---

## 7. Automated CI/CD & GitHub Deployments

If you push updates to GitHub, you can automate deployments to your VPS using **GitHub Actions**.

Create `.github/workflows/deploy.yml`:
```yaml
name: Production Deployment to VPS

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout Code
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 20
        cache: 'npm'

    - name: Install & Build
      run: |
        npm ci
        npm run build

    - name: Deploy to VPS via SSH rsync
      uses: easingthemes/ssh-deploy@main
      env:
        SSH_PRIVATE_KEY: ${{ secrets.VPS_SSH_PRIVATE_KEY }}
        ARGS: "-rltgoDzvO --delete"
        SOURCE: "dist/"
        REMOTE_HOST: ${{ secrets.VPS_IP }}
        REMOTE_USER: ${{ secrets.VPS_USER }}
        TARGET: "/var/www/masuma-erp/dist"
```

---

## 8. Troubleshooting Common Production Issues

### Issue 1: Page Refresh returns 404 (e.g. `erp.domain.com/inventory` shows 404 Not Found)
- **Root Cause**: The web server is looking for a physical `/inventory/index.html` file on the filesystem instead of routing to React Router.
- **Solution**:
  - In **Nginx**: Add `try_files $uri $uri/ /index.html;` inside `location / { ... }`.
  - In **cPanel/Apache**: Ensure `.htaccess` has `RewriteRule . /index.html [L]`.

### Issue 2: Mixed Content or Insecure Warnings
- **Root Cause**: HTTP requests inside an HTTPS site.
- **Solution**: Ensure Let's Encrypt SSL is active and HTTP-to-HTTPS redirect is enabled in your panel/Nginx configuration.

### Issue 3: Permission Denied (`403 Forbidden`)
- **Root Cause**: Web server user (`www-data` or `nobody`) lacks read access.
- **Solution**:
  ```bash
  chown -R www-data:www-data /var/www/masuma-erp/dist
  chmod -R 755 /var/www/masuma-erp/dist
  ```

---

### 🎉 Your Masuma Enterprise POS & ERP System is now live, secure, and production-ready!
For updates or questions, consult your system administrator or repository documentation.
