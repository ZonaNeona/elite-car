"""Run as root on the authorized host; never writes credentials into the repository."""

import os, secrets, json, hmac, hashlib
from pathlib import Path
from dotenv import dotenv_values

path = Path("/etc/elite-car-integrations.env")
if not path.exists():
    path.write_text("INTEGRATION_SECRET=" + secrets.token_hex(32) + "\n")
os.chmod(path, 0o640)
import shutil

shutil.chown(path, user="root", group="elitecar")
key = dotenv_values(path)["INTEGRATION_SECRET"]
creds = []
for source in ["1c", "yandex-pro", "fines", "telematics"]:
    value = hmac.new(
        key.encode(),
        json.dumps(
            {"schedule": source}, sort_keys=True, separators=(",", ":")
        ).encode(),
        hashlib.sha256,
    ).hexdigest()
    creds.append(
        {
            "id": "elitecar-schedule-" + source,
            "name": "EliteCar scheduler " + source,
            "type": "httpHeaderAuth",
            "data": {"name": "X-Elite-Scheduler", "value": value},
        }
    )
target = Path("/var/lib/elite-car/n8n-credentials.json")
target.write_text(json.dumps(creds))
os.chmod(target, 0o600)
print(
    "Dedicated integration secret and scheduler credentials prepared outside repository"
)
nginx = Path("/etc/nginx/sites-available/elite-car")
if nginx.exists() and "location /api/mock/" not in nginx.read_text():
    backup = Path("/etc/nginx/sites-available/elite-car.before-under")
    if not backup.exists():
        shutil.copy2(nginx, backup)
    content = nginx.read_text().replace(
        " location /api/ {", " location /api/mock/ { return 404; }\n location /api/ {"
    )
    nginx.write_text(content)
    import subprocess

    subprocess.run(["nginx", "-t"], check=True)
    subprocess.run(["systemctl", "reload", "nginx"], check=True)
