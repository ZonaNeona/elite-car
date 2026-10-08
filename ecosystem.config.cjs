module.exports = {
  apps: [
    {
      name: "demo-elite-car-api",
      cwd: "/var/www/elite-car",
      script: ".venv/bin/uvicorn",
      args: "app.api:app --host 127.0.0.1 --port 3008 --workers 1 --proxy-headers",
      interpreter: "none",
      uid: "elitecar",
      gid: "elitecar",
      max_memory_restart: "350M",
      env: { ELITE_ENV: "/etc/elite-car.env" },
    },
    {
      name: "demo-elite-car-worker",
      cwd: "/var/www/elite-car",
      script: ".venv/bin/python",
      args: "-m app.worker",
      interpreter: "none",
      uid: "elitecar",
      gid: "elitecar",
      max_memory_restart: "300M",
      env: { ELITE_ENV: "/etc/elite-car.env" },
    },
  ],
};
