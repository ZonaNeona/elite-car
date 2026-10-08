#!/usr/bin/env bash
set -euo pipefail
cd /var/www/elite-car
.venv/bin/python -m compileall -q app
if [ ! -f dist/index.html ]; then NODE_OPTIONS=--max-old-space-size=850 RAYON_NUM_THREADS=1 npm run build; fi
chown -R elitecar:elitecar /var/www/elite-car /var/lib/elite-car
runuser -u elitecar -- .venv/bin/alembic upgrade head
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save
cat > /etc/nginx/sites-available/elite-car <<'NGINX'
server {
 listen 80;
 server_name elite-car.shvarev-demo.ru;
 root /var/www/elite-car/dist;
 client_max_body_size 9m;
 add_header X-Content-Type-Options nosniff;
 add_header Referrer-Policy same-origin;
 location /api/ {
   proxy_pass http://127.0.0.1:3008;
   proxy_set_header Host $host;
   proxy_set_header X-Forwarded-Proto $scheme;
   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   proxy_buffering off;
   proxy_read_timeout 120s;
 }
 location / { try_files $uri $uri/ /index.html; }
 location ~ /\. { deny all; }
}
NGINX
ln -sfn /etc/nginx/sites-available/elite-car /etc/nginx/sites-enabled/elite-car
nginx -t
systemctl reload nginx
certbot --nginx -d elite-car.shvarev-demo.ru --non-interactive --agree-tos --register-unsafely-without-email --redirect
printf 'Deployment ready\n'
