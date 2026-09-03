# Security Policy & Credential Handling

Huzle Oh is built with defense-in-depth principles to safeguard trading capital and API credentials.

---

## 🛡️ Credential Security Principles

1. **Encryption at Rest**:
   * All broker credentials (Exness MT5 account number, passwords, server details) must be encrypted using AES-256-GCM prior to storage on disk.
   * Encryption keys are supplied via the `ENCRYPTION_KEY` environment variable and never committed to version control.

2. **Zero Ingestion Leakage**:
   * MT5 passwords received via `/api/broker/connect` are sanitized immediately upon verification.
   * Passwords are stripped before returning account objects to the browser.
   * Terminal error messages returned to users are sanitized into actionable human-readable statements (e.g. `MT5 CONNECTION FAILED`) and never echo raw socket or terminal connection strings containing credentials.

3. **No Passwords in LLM Prompts**:
   * When synthesizing market debriefs with Google Gemini or secondary LLMs, only anonymized, high-level market metrics (pair, price, spread, trend, session) are transmitted. Credential state or account numbers are never forwarded to AI models.

4. **Telegram Alert Sanitization**:
   * Real-time notifications dispatched to Telegram contain order tickets, lot sizes, profit targets, and execution status. Account passwords or tokens are strictly omitted.

---

## 🔒 Reporting a Vulnerability

If you discover a potential security vulnerability within Huzle Oh:

1. **Do NOT open a public GitHub issue.**
2. Email our security team with full reproduction details, stack traces, and affected environment versions.
3. We will respond within 24 hours to acknowledge receipt and coordinate a remediation release.
