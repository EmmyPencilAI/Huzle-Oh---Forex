# Render Deployment Guide

This guide details how to deploy **Huzle Oh — Agentic Trader** to [Render](https://render.com) using Infrastructure-as-Code via `render.yaml`.

---

## 🏗️ Architecture on Render

A production deployment consists of two coordinated services:

1. **Web Service (`huzle-oh-web`)**:
   * Runs the main API, serves the Vite frontend bundle, exposes `/health`, and coordinates the multi-agent trading engine.
   * Auto-provisions the dynamic `$PORT` provided by Render.
   * Exposes zero-downtime health probes on `/health`.

2. **Background Worker (`huzle-oh-worker`)**:
   * Runs as a persistent watchdog process (`npm run start:worker`).
   * Pings `https://${WEB_SERVICE_URL}/health` every 60 seconds.
   * Keeps the connection link validated and monitors MT5 terminal availability.
   * **STRICT RULE**: The worker is a monitoring and keep-alive watchdog only. It does **NOT** execute trades, scan markets, or run agents.

---

## 🚀 Step-by-Step Blueprint Deployment

### Step 1: Connect Repository
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Select **New +** → **Blueprint**.
3. Link your GitHub or GitLab repository containing `render.yaml`.

### Step 2: Configure Environment Variables
Render will detect the service definitions in `render.yaml` and prompt you to input the secret values:

* `EXNESS_MT5_LOGIN`: Your Exness trading account number.
* `EXNESS_MT5_PASSWORD`: Your Exness account terminal trading password.
* `EXNESS_MT5_SERVER`: Server hostname (e.g., `Exness-MT5Real` or `Exness-MT5Trial`).
* `GEMINI_API_KEY`: API key from Google AI Studio.
* `TELEGRAM_BOT_TOKEN`: Telegram bot token from `@BotFather`.
* `TELEGRAM_CHAT_ID`: Your chat or channel ID.
* `ENCRYPTION_KEY`: 32-byte hex string (e.g. `openssl rand -hex 32`).

### Step 3: Deploy & Verify
1. Click **Apply**.
2. Render builds both services concurrently using `npm install && npm run build`.
3. Once deployed, verify that:
   * Web service returns `200 OK` on `https://your-service.onrender.com/health`.
   * Background worker logs show `[WATCHDOG OK] Service Healthy`.

---

## 💾 Storage & Persistence on Render (Ephemeral Filesystem)

### The Ephemeral Filesystem Constraint
Render web services run in Docker containers with ephemeral disk storage:
* Any local file created in the container filesystem (including SQLite files such as `huzle_oh.db`) is **wiped** whenever the service:
  * Restarts due to a configuration update or code deployment.
  * Spins down or moves between host nodes.
  * Automatically scales.

### Solutions for Persistent State

#### Option A: In-Memory / Stateless Engine (Default)
For live execution directly connected to MT5, the broker terminal serves as the single source of truth for open positions, balance, and margin. Position tracking resyncs automatically on reconnect.

#### Option B: Render Persistent Disk
To persist SQLite trade history files across redeploys:
1. In `render.yaml` or Render dashboard under `huzle-oh-web`, add a disk:
```yaml
disk:
  name: huzle-data
  mountPath: /data
  sizeGB: 1
```
2. Point your SQLite connection string to `/data/huzle_oh.db`.

#### Option C: Cloud Database Integration (Recommended for Multi-Instance)
For distributed setups:
* **PostgreSQL / Cloud SQL**: Connect via standard connection string `DATABASE_URL`.
* **Firebase Firestore**: Connect via `set_up_firebase` for persistent real-time document sync.

---

## 🩺 Health Check & Monitoring Contract

The `/health` endpoint responds to HTTP GET requests without requiring authentication or triggering trade logic:

```json
{
  "status": "ok",
  "timestamp": "2026-09-02T15:47:00.000Z",
  "uptime": 3612.4,
  "service": "huzle-oh-agentic-trader",
  "environment": "production",
  "mt5_connection": {
    "status": "CONNECTED",
    "server": "Exness-MT5Real",
    "health": "HEALTHY",
    "is_live": true,
    "last_sync": 1756828020000
  }
}
```
