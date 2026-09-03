# Contributing to Huzle Oh — Agentic Trader

Thank you for your interest in contributing to **Huzle Oh — Agentic Trader**! We are committed to maintaining a clean, deterministic, and highly disciplined codebase.

---

## 📐 Core Engineering Principles

1. **Deterministic Risk Inviolability**:
   * The **Aegis Guardian** agent maintains absolute veto power over all orders.
   * Under no circumstances may risk settings (stop loss caps, daily drawdown limits, max open positions) be bypassed or relaxed without strict programmatic validation.
2. **Strict Verification Over Guesses**:
   * Never display a guessed balance. Never fall back to demo data in Live mode. Never display test data when connected to real Exness servers.
   * If terminal connectivity is lost, mark the state as `DISCONNECTED` or `ERROR` and set `balance: null`.
3. **Zero Credential Leaks**:
   * Never output MT5 passwords, Telegram tokens, or encryption keys in console logs, API JSON responses, or error traces.
   * Encrypt credentials at rest.
4. **Separation of Concerns for Workers**:
   * Background workers and cron jobs are strictly for **health monitoring and keep-alive watchdogs**. They must never execute trades or run the autonomous agent pipeline.
5. **Aesthetic Consistency**:
   * Maintain the "Huzle Oh" design identity: Deep Black (`#0B0B0B`), Technical Dark (`#151515`), Huzle Orange (`#FF7A00`), Emerald (`#10B981`), and Crisp White.
   * Typography: Plus Jakarta Sans for body text, JetBrains Mono for financial figures/order tickets, and Orbitron for branding.

---

## 🧪 Development Workflow

### 1. Branching
* Branch from `main`: `feature/your-feature-name` or `fix/your-bug-fix`.

### 2. Testing
Before submitting any pull request, ensure all tests compile and pass:
```bash
# Run linting check
npm run lint

# Run automated test suite
npm test

# Verify production build compilation
npm run build
```

### 3. Pull Request Guidelines
* Explain the rationale for the change.
* Verify that no sensitive keys or passwords appear in modified files or test fixtures.
* Adhere strictly to TypeScript type safety without using loose `any` casts in core trading logic.
