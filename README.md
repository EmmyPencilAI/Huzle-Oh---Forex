# Huzle Oh — Agentic Trader

> **Institutional-grade Autonomous Multi-Agent Trading Terminal for Exness & MetaTrader 5**

![Version](https://img.shields.io/badge/version-2.5.0-orange.svg)
![Status](https://img.shields.io/badge/deploy-Render--Ready-brightgreen.svg)
![Architecture](https://img.shields.io/badge/architecture-5--Agent%20Swarm-black.svg)
![Security](https://img.shields.io/badge/security-AES--256--GCM-red.svg)

Huzle Oh is a lightweight, production-ready agentic trading command center designed to connect real **Exness** accounts with **MetaTrader 5 (MT5)**. The platform features an autonomous 5-agent coordinated decision hierarchy, deterministic capital protection via the **Aegis Risk Guardian**, dynamic trailing profit capture ($3–$8 target per trade), and real-time Telegram alerts.

---

## 🏛️ System Architecture

```
                                  [ MARKET DATA / MT5 FEED ]
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │     AGENT 1: QUANTUM SCOUT       │
                              │   Scans EMA 9/21 crosses & RSI   │
                              └────────────────┬─────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │      AGENT 2: SETUP HUNTER       │
                              │ Calculates Entry, SL, TP (≥1:2)  │
                              └────────────────┬─────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │    AGENT 3: MARKET SENTINEL      │
                              │  Validates Spread & Liquidity    │
                              └────────────────┬─────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │     AGENT 4: AEGIS GUARDIAN      │
                              │ Deterministic Risk & Veto Gate   │
                              └────────────────┬─────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │     AGENT 5: HEAD OF DESK        │
                              │  Autonomous Execution or Review │
                              └────────────────┬─────────────────┘
                                               │
                      ┌────────────────────────┴────────────────────────┐
                      ▼                                                 ▼
          [ AUTO TRADING = ON ]                             [ AUTO TRADING = OFF ]
        Instant MT5 Direct Execution                      30s Interactive Proposal
          + Telegram Alert Dispatch                       Awaiting Operator Approval
```

---

## 🚀 Key Features

* **Real Exness MT5 Connection**: Direct authentication with Exness MT5 servers (e.g., `Exness-MT5Real`, `Exness-MT5Trial`). Displays verified live balances, equity, and margin levels. Zero fake or demo balances in Live Trading mode.
* **Strict Verification Pipeline**:
  $$\text{Credentials} \longrightarrow \text{MT5 Gateway} \longrightarrow \text{Account Auth} \longrightarrow \text{Data Retrieval} \longrightarrow \text{Live Display}$$
  If verification fails, balance display is blocked with an informative, user-friendly troubleshooting guide.
* **Aegis Guardian Risk Veto**: Deterministic risk enforcement. Caps risk at 1.0% equity per trade, enforces a minimum 1:2.0 Risk-to-Reward ratio, and restricts maximum open positions.
* **Dynamic Profit Capture**: Locks partial profit at normal target ($3.00–$5.00) and trails the remainder with an adaptive trailing stop toward extended targets ($5.00–$8.00).
* **Render-Ready Topology**: Out-of-the-box support for Render Web Service (FastAPI / Express + React), Background Watchdog Worker, and zero-downtime health monitoring.
* **Credential Protection**: Credentials encrypted at rest using AES-256-GCM. Passwords are never logged, never returned in frontend API responses, and never sent to LLMs.

---

## ☁️ Render Deployment Quickstart

The repository includes a complete Render Blueprint specification (`render.yaml`).

### 1. One-Click Blueprint Deployment
1. Push this repository to your GitHub or GitLab account.
2. In your [Render Dashboard](https://dashboard.render.com/), navigate to **Blueprints** and select **New Blueprint Instance**.
3. Connect your repository. Render will automatically detect `render.yaml` and provision:
   * **Web Service (`huzle-oh-web`)**: Serves the API, frontend, and `/health` probe.
   * **Background Worker (`huzle-oh-worker`)**: Continuously monitors MT5 connection health and keeps the service active.

### 2. Configure Environment Variables
Under your service settings in Render, populate the following secrets:

| Variable | Description |
| :--- | :--- |
| `EXNESS_MT5_LOGIN` | Your Exness MT5 Account / Login Number |
| `EXNESS_MT5_PASSWORD` | Your Exness MT5 Master / Trading Password |
| `EXNESS_MT5_SERVER` | Server name from Exness Personal Area (e.g., `Exness-MT5Real`) |
| `GEMINI_API_KEY` | Google Gemini API key for Head of Desk reasoning synthesis |
| `TELEGRAM_BOT_TOKEN`| Bot token obtained from Telegram `@BotFather` |
| `TELEGRAM_CHAT_ID` | Your Telegram user or channel chat ID |
| `ENCRYPTION_KEY` | 32-byte hexadecimal key for AES-256-GCM encryption at rest |

> **Crucial Rule**: The background worker/cron job is a **health and keep-alive mechanism only**. It must NOT execute trades, scan markets, or run autonomous trading agents.

---

## 💾 Storage & Persistence Notice (Render Ephemeral Filesystem)

Render web services run in stateless, ephemeral container environments. Any local SQLite database files (such as `huzle_oh.db`) written to the local filesystem are reset whenever the service redeploys, restarts, or scales.

* **For stateless / paper trading sessions**: The built-in in-memory state engine handles live tracking effortlessly.
* **For permanent trade history persistence**: Attach a **Render Persistent Disk** mounted at `/data`, or configure an external database (e.g., Cloud SQL PostgreSQL, Supabase, or Firebase Firestore).

See [`docs/render-deployment.md`](docs/render-deployment.md) for full setup instructions.

---

## 🛠️ Local Development

### Prerequisites
* Node.js 20+
* npm 10+

### Installation & Run
```bash
# 1. Clone repository
git clone https://github.com/your-org/huzle-oh.git
cd huzle-oh

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env

# 4. Run automated test suite
npm test

# 5. Start dev server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🔒 Security Policy

Please review [`SECURITY.md`](SECURITY.md) for vulnerability disclosure and credential protection details.

## 📄 License
MIT License. © 2026 Huzle Oh Trading Technologies.
