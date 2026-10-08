#!/usr/bin/env bash
set -euo pipefail
cd /var/www/elite-car
bash scripts/backup.sh
task_release=/var/www/elite-car/releases/$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p "$task_release"
cp -a app dist web public docs tests migrations scripts README.md requirements.txt requirements.lock package.json package-lock.json alembic.ini ecosystem.config.cjs "$task_release/"
if [ -d n8n ]; then cp -a n8n "$task_release/"; fi
printf '%s\n' "$task_release" > /var/www/elite-car/LAST_RELEASE
chmod -R go-w "$task_release"
printf '20 1 * * * root /bin/bash /var/www/elite-car/scripts/backup.sh >> /var/log/elite-car-backup.log 2>&1\n' > /etc/cron.d/elite-car-backup
