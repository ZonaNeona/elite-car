#!/usr/bin/env bash
set -euo pipefail
cd /var/www/elite-car
# Caller uploads the reviewed source and locally-built assets before running this script.
.venv/bin/python scripts/setup_integrations.py
.venv/bin/alembic upgrade head
PYTHONPATH=. .venv/bin/python scripts/build_kb.py
node n8n/build-workflows.mjs
mkdir -p /var/lib/elite-car/backups
.venv/bin/python -c "import sqlite3,os,time; p='/var/lib/elite-car/backups/n8n-before-under-'+time.strftime('%Y%m%dT%H%M%S')+'.sqlite'; a=sqlite3.connect('file:/var/www/lookin-n8n/data/.n8n/database.sqlite?mode=ro',uri=True); b=sqlite3.connect(p); a.backup(b); b.close();a.close();os.chmod(p,0o600)"
(
  cd /var/www/lookin-n8n
  set -a
  source .env
  set +a
  ./node_modules/.bin/n8n import:credentials --input=/var/lib/elite-car/n8n-credentials.json
  ./node_modules/.bin/n8n import:workflow --separate --input=/var/www/elite-car/n8n/out/
  for task_source in 1c yandex-pro fines telematics; do
    ./node_modules/.bin/n8n update:workflow --id="elitecar-$task_source" --active=true
  done
)
if pm2 describe demo-elite-car-n8n-reader >/dev/null 2>&1; then
  pm2 restart demo-elite-car-n8n-reader
else
  pm2 start scripts/n8n-reader.mjs --name demo-elite-car-n8n-reader --node-args=--disable-warning=ExperimentalWarning --max-memory-restart 100M
fi
pm2 restart lookin-n8n
pm2 restart demo-elite-car-api demo-elite-car-worker
pm2 save --silent
PYTHONPATH=. .venv/bin/python scripts/runtime_check.py
