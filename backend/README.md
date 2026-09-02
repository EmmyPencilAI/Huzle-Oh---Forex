# HUZLE OH — AGENTIC TRADER
## 24/7 Production Deployment Guide for Ubuntu VPS

HUZLE OH is an AI-powered quantitative trading command center connecting Exness through MetaTrader 5 (MT5). It features a coordinated 5-agent architecture, strict Aegis risk limits, Telegram trade proposals with inline approvals, and continuous market scanning.

---

### Architecture Overview

```
Exness Broker
     ↑
MetaTrader 5 (MT5)
     ↑
BrokerAdapter → MT5Adapter
     ↑
Quantum Scout → Setup Hunter → Market Sentinel → Aegis Guardian → Head of Desk
     ↑
Trading Engine (Risk Validation & Execution)
     ↑
Telegram Bot + Android-First PWA Command Center
```

---

### System Requirements

- **OS:** Ubuntu 22.04 LTS or 24.04 LTS VPS
- **CPU:** 2 vCPU minimum (4 vCPU recommended)
- **RAM:** 4GB minimum
- **Storage:** 20GB SSD
- **Python:** 3.12+
- **Database:** SQLite with WAL mode (`huzle_oh.db`)

---

### 1. Installation on Ubuntu VPS

```bash
# Update packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv sqlite3 git curl

# Clone or copy Huzle Oh repository
cd /opt
sudo git clone <your-repo> huzle-oh
cd /opt/huzle-oh

# Set up Python Virtual Environment
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

---

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
nano .env
```

Set:
- `EXNESS_MT5_LOGIN`
- `EXNESS_MT5_PASSWORD`
- `EXNESS_MT5_SERVER` (e.g. `Exness-MT5Real`)
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `GROK_API_KEY` or `GEMINI_API_KEY`

---

### 3. Running as a systemd Service (24/7 Auto-Restart)

Create systemd service file:

```bash
sudo nano /etc/systemd/system/huzle-oh.service
```

Paste:

```ini
[Unit]
Description=HUZLE OH Agentic Trader Engine
After=network.target

[Service]
User=root
WorkingDirectory=/opt/huzle-oh
EnvironmentFile=/opt/huzle-oh/.env
ExecStart=/opt/huzle-oh/venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable huzle-oh
sudo systemctl start huzle-oh
sudo systemctl status huzle-oh
```

---

### 4. Verification & Health Check

```bash
curl http://localhost:8000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "mt5_connected": true,
  "engine_active": true,
  "agents": {
    "scout": "ONLINE",
    "hunter": "ONLINE",
    "sentinel": "ONLINE",
    "guardian": "ONLINE",
    "head_of_desk": "ONLINE"
  }
}
```
