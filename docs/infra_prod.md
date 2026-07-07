# Récapitulatif — mise en prod de lasolution.org sur VPS Ionos

## 1. Préparation du serveur

```bash
sudo apt update && sudo apt upgrade -y
```

Installation de Node.js 20 (après avoir nettoyé une install Node 18 incomplète sans npm) :

```bash
sudo apt remove -y nodejs npm libnode-dev libnode72
sudo apt autoremove -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Outils système :

```bash
sudo apt install -y nginx postgresql postgresql-contrib redis-server certbot python3-certbot-nginx git ufw
sudo npm install -g pm2
```

## 2. Base de données

Création de la DB et de l'utilisateur :

```bash
sudo -u postgres psql -d lasolution
```

```sql
CREATE DATABASE lasolution;
CREATE USER lasolution_user WITH ENCRYPTED PASSWORD 'xxx';
GRANT ALL PRIVILEGES ON DATABASE lasolution TO lasolution_user;
GRANT ALL ON SCHEMA public TO lasolution_user;
ALTER SCHEMA public OWNER TO lasolution_user;
```

Redis : laissé en config par défaut (écoute sur `127.0.0.1`, pas de mot de passe, suffisant en localhost).

## 3. DNS (chez Ionos)

- Désactivé le mode **Redirection** du domaine `lasolution.org`
- **A** `@` → `212.227.160.123` (IP du VPS)
- **A** `www` → `212.227.160.123`
- Conservé intacts : MX, CNAME DKIM, TXT SPF/DMARC (emails)

## 4. Déploiement du code

```bash
git clone https://github.com/MrGosO5/Lasolution.git
mv Lasolution /var/www/lasolution
cd /var/www/lasolution
```

Fichier `.env.local` créé à la racine (`/var/www/lasolution/.env.local`) avec `DATABASE_URL`, `REDIS_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `API_JWT_SECRET`, `AUTH_ENV_FALLBACK=false`, `STRIPE_SECRET_KEY`, clés Turnstile, `DATA_ENCRYPTION_KEY`, clés EmailJS, `SITE_PREVIEW_*`.

Installation des dépendances :

```bash
npm install
npm --prefix backend install
```

Migrations Prisma :

```bash
npm --prefix backend run db:migrate
```

Build du frontend :

```bash
npm run build
```

## 5. Process manager (PM2)

Fichier `/var/www/lasolution/ecosystem.config.js` :

```javascript
module.exports = {
  apps: [
    {
      name: "lasolution-frontend",
      cwd: "/var/www/lasolution",
      script: "node_modules/.bin/next",
      args: "start -p 3001",
      env: { NODE_ENV: "production" },
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
    },
    {
      name: "lasolution-backend",
      cwd: "/var/www/lasolution/backend",
      script: "src/server.js",
      env: { NODE_ENV: "production", PORT: 4000 },
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
    },
    {
      name: "lasolution-worker",
      cwd: "/var/www/lasolution/backend",
      script: "src/worker.js",
      env: { NODE_ENV: "production" },
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
    },
  ],
};
```

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup        # puis exécuter la commande affichée (systemctl enable pm2-root)
```

## 6. Nginx (reverse proxy)

Fichier `/etc/nginx/sites-available/lasolution` :

```nginx
server {
    listen 80;
    server_name lasolution.org www.lasolution.org;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/lasolution /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default     # site par défaut désactivé
nginx -t
systemctl reload nginx
```

> **Note :** le backend Express tourne en interne sur le port 4000 et n'est appelé que côté serveur par Next.js — jamais exposé via Nginx.

## 7. HTTPS

```bash
certbot --nginx -d lasolution.org -d www.lasolution.org
```

Certificat Let's Encrypt valide jusqu'au **21/09/2026**, renouvellement automatique configuré.

En-têtes de sécurité recommandés au niveau Nginx (en plus de Next.js) :

```nginx
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

Mise à jour ensuite de `NEXTAUTH_URL="https://lasolution.org"` dans `.env.local`, puis `pm2 restart all`.

## 8. Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

## 9. Reste à faire (non bloquant)

- Passer `STRIPE_SECRET_KEY` en `sk_live_...` quand prêt pour les vrais paiements
- Configurer le webhook Stripe vers `https://lasolution.org/api/...`

## Commandes en cas de mise à jour du code

```bash
cd /var/www/lasolution

# 1. Récupérer le nouveau code
git pull

# 2. Réinstaller les dépendances (si package.json a changé)
npm install
npm --prefix backend install

# 3. Appliquer les nouvelles migrations Prisma si besoin
npm --prefix backend run db:migrate

# 4. Rebuilder le frontend
npm run build

# 5. Redémarrer tous les process
pm2 restart all

# 6. Vérifier que tout est bien reparti
pm2 status
pm2 logs --lines 30
```
