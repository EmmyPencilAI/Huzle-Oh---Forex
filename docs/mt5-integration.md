# Real Exness MT5 Integration Guide

This document details how **Huzle Oh — Agentic Trader** authenticates and interacts with the Exness MetaTrader 5 trading infrastructure.

---

## 🔒 Security & Credential Rules

1. **Direct Terminal Authentication**:
   * Users authenticate with their MT5 Login Number, Trading Password, and MT5 Server name directly from the application interface or server environment variables.
2. **Strict Verification Flow**:
   $$\text{Input Credentials} \longrightarrow \text{Terminal Handshake} \longrightarrow \text{Account Verification} \longrightarrow \text{Data Query} \longrightarrow \text{Render Real Balance}$$
3. **No Fallbacks to Fake Balances**:
   * In Live Trading mode, if authentication fails or the terminal is unreachable, the application **strictly blocks the balance display** and renders:
     ```
     🔴 MT5 CONNECTION FAILED
     Unable to retrieve your Exness account.
     Balance unavailable.
     ```
   * It **never** falls back to demo data, guessed amounts, or stale balances in live mode.
4. **Actionable User-Friendly Error Messages**:
   * Technical exceptions (e.g. `ConnectionRefusedError: [Errno 111]`) are intercepted and transformed into actionable troubleshooting steps:
     ```
     MT5 CONNECTION FAILED
     The trading terminal could not be reached.
     Check:
     • MT5 terminal status
     • Account number
     • Password
     • Server
     • VPS/worker connection
     ```

---

## 🛰️ Exness Server Mapping

Exness provides dedicated server clusters for live and trial accounts:

| Environment | Server Name | Description |
| :--- | :--- | :--- |
| **Live MT5** | `Exness-MT5Real` | Primary Live Trading Server |
| **Live MT5 (Cluster 2)** | `Exness-MT5Real2` | High-frequency / Secondary Live Cluster |
| **Live MT5 (Cluster 3)** | `Exness-MT5Real3` | Redundant Live Cluster |
| **Trial / Demo** | `Exness-MT5Trial` | Practice & Strategy Simulation Cluster |

You can locate your specific server name inside your **Exness Personal Area** under account details.

---

## 🔄 Lifecycle of a Trade on Exness MT5

1. **Consensus**: All 5 agents approve a setup with $\ge 1:2.0$ Risk-to-Reward ratio.
2. **Order Dispatch**: If Auto Trading is enabled, an order is transmitted to the MT5 execution bridge with calculated Stop Loss and Take Profit levels.
3. **Target 1 Execution**: When the trade reaches $+\$3.00\text{ to }+\$5.00$ profit, the engine executes a 50% partial close and activates the dynamic trailing stop.
4. **Target 2 Trailing**: The remaining 50% position trails market momentum toward extended profits ($+\$5.00\text{ to }+\$8.00$).
5. **Capital Protection Gate**: If the MT5 connection status drops or becomes unhealthy, new order execution is automatically halted.
