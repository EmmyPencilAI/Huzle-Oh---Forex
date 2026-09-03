# Multi-Agent Architecture & Decision Hierarchy

Huzle Oh utilizes an institutional 5-agent swarm architecture designed around the core principle:

> **"PROTECT CAPITAL -> FIND OPPORTUNITY -> VERIFY -> EXECUTE -> LEARN"**

---

## 🤖 The 5-Agent Swarm

### 1. Quantum Scout (Market Radar)
* **Responsibility**: Scans technical structures across Forex majors and Gold (`EURUSD`, `GBPUSD`, `USDJPY`, `XAUUSD`, `USDCAD`).
* **Indicators**: Exponential Moving Averages (M5 EMA 9/21 cross), Relative Strength Index (RSI 14), and session volume profiles.
* **Output**: Identifies structural market momentum confluence.

### 2. Setup Hunter (Tactical Modeler)
* **Responsibility**: Formulates precise entry, Stop Loss, and Take Profit coordinates.
* **Hard Rule**: Enforces a minimum **1:2.0 Risk-to-Reward (R:R)** ratio.
* **Output**: Formulates structured trade candidate parameters.

### 3. Market Sentinel (Risk Environmentalist)
* **Responsibility**: Inspects macro liquidity conditions, spreads, and session overlaps (London/NY overlap).
* **Hard Rule**: Rejects setups if current spread exceeds `maxSpreadPips` (default 2.0 pips) or if high-impact macroeconomic news is imminent.
* **Output**: Spread and liquidity clearance.

### 4. Aegis Guardian (Deterministic Risk Gate)
* **Responsibility**: Pure deterministic mathematics and absolute risk veto power.
* **Hard Rules**:
  * Max risk per trade capped at 1.0% account equity.
  * Max simultaneous positions capped at 2 trades.
  * Max daily loss capped at 3.0% equity.
  * Absolute veto over all other agents if any condition fails.
* **Output**: VETO or APPROVE with deterministic lot sizing.

### 5. Head of Desk (Autonomous Executive)
* **Responsibility**: Coordinates consensus synthesis.
* **Execution Pathways**:
  * **Auto Trading ON**: Directly executes verified setups on Exness MT5 within sub-second latency and dispatches Telegram alerts.
  * **Auto Trading OFF (Manual Review)**: Queues a 30-second interactive proposal card for operator approval in the command center.

---

## 📊 State Management & Event Pipeline

* All agent actions generate immutable events logged in the central event stream.
* Operator interventions (Manual Close, Kill Switch activation) take immediate precedence over automated logic.
* Trailing stops and partial profit locks execute synchronously on every price tick tick.
