import secrets, subprocess, os
from pathlib import Path
from dotenv import dotenv_values

env = Path("/etc/elite-car.env")
if not env.exists():
    pwd = secrets.token_hex(24)

    def sql(query):
        return subprocess.run(
            ["runuser", "-u", "postgres", "--", "psql", "-v", "ON_ERROR_STOP=1", "-Atc", query],
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()

    if not sql("SELECT 1 FROM pg_roles WHERE rolname='elite_car'"):
        sql(f"CREATE ROLE elite_car LOGIN PASSWORD '{pwd}'")
    else:
        raise SystemExit("Role already exists without app env; inspect before replacing credentials")
    if not sql("SELECT 1 FROM pg_database WHERE datname='elite_car'"):
        sql("CREATE DATABASE elite_car OWNER elite_car")
    subprocess.run(
        [
            "runuser",
            "-u",
            "postgres",
            "--",
            "psql",
            "-d",
            "elite_car",
            "-c",
            "CREATE EXTENSION IF NOT EXISTS btree_gist",
        ],
        check=True,
        capture_output=True,
    )
    shared = dotenv_values("/etc/canapeclub.env")
    values = {
        "DATABASE_URL": f"postgresql+psycopg://elite_car:{pwd}@127.0.0.1/elite_car",
        "PUBLIC_URL": "https://elite-car.shvarev-demo.ru",
        "DAILY_BUDGET": "0.50",
        "TEXT_MODELS": "deepseek/deepseek-v4.1-flash,qwen/qwen3.8-flash",
        "VISION_MODEL": "google/gemini-2.5-flash-lite",
        "TELEGRAM_WEBHOOK_SECRET": secrets.token_urlsafe(32),
    }
    for key in ("OPENROUTER_API_KEY", "OPENROUTER_BASE_URL"):
        if shared.get(key):
            values[key] = shared[key]
    env.write_text("\n".join(k + "=" + str(v) for k, v in values.items()) + "\n")
    import pwd as pw, grp

    os.chown(env, 0, grp.getgrnam("elitecar").gr_gid)
    os.chmod(env, 0o640)
print("Isolated database and environment configured; secrets not displayed")
