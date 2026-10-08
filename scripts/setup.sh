#!/usr/bin/env bash
set -euo pipefail
cd /var/www/elite-car
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends libpangoft2-1.0-0 fonts-dejavu-core
id elitecar >/dev/null 2>&1 || useradd --system --home /var/lib/elite-car --create-home --shell /usr/sbin/nologin elitecar
install -d -o elitecar -g elitecar /var/lib/elite-car/files /var/backups/elite-car
python3 -m venv .venv
.venv/bin/pip install -q -r requirements.txt
.venv/bin/python scripts/provision.py
chown -R elitecar:elitecar /var/www/elite-car
runuser -u elitecar -- .venv/bin/alembic upgrade head
npm install --no-audit --no-fund
printf 'Dependencies and database ready\n'
