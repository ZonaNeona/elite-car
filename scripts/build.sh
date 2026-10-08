#!/usr/bin/env bash
set -euo pipefail
cd /var/www/elite-car
# One build at a time; keep the existing services running on the shared host.
exec 9>/var/lock/elite-car-build.lock
flock -n 9
ulimit -c 0
NODE_OPTIONS=--max-old-space-size=512 nice -n 10 npm run build
