/**
 * HUZLE OH — AGENTIC TRADER
 * Background Monitoring Worker
 * 
 * Strict Architectural Rule:
 * The worker is a health/keep-alive mechanism and connection watchdog only.
 * It must NOT be responsible for executing trades, scanning markets, or running agents.
 */

import http from 'http';
import https from 'https';

const PING_INTERVAL_MS = parseInt(process.env.HEALTH_CHECK_INTERVAL_MS || '60000', 10);
const TARGET_URL = process.env.WEB_SERVICE_URL || `http://localhost:${process.env.PORT || 3000}`;

console.log('[Huzle Oh Worker] Background Health Watchdog Initialized');
console.log(`[Huzle Oh Worker] Target URL: ${TARGET_URL}/health`);
console.log(`[Huzle Oh Worker] Ping Interval: ${PING_INTERVAL_MS / 1000}s`);

function pingHealthCheck() {
  const url = `${TARGET_URL}/health`;
  const client = url.startsWith('https') ? https : http;

  const req = client.get(url, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      try {
        const data = JSON.parse(rawData);
        const timestamp = new Date().toISOString();
        if (res.statusCode === 200 && data.status === 'ok') {
          console.log(`[${timestamp}] [WATCHDOG OK] Service Healthy | MT5 Connection: ${data.mt5_connection?.status || 'UNKNOWN'} | Health: ${data.mt5_connection?.health || 'UNKNOWN'} | Uptime: ${Math.round(data.uptime)}s`);
        } else {
          console.warn(`[${timestamp}] [WATCHDOG WARN] Unexpected response: ${res.statusCode}`, data);
        }
      } catch (err) {
        console.error(`[WATCHDOG ERROR] Failed to parse health payload:`, err);
      }
    });
  });

  req.on('error', (err) => {
    console.error(`[WATCHDOG FAIL] Health check ping failed: ${err.message}`);
  });

  req.setTimeout(10000, () => {
    req.destroy();
    console.error('[WATCHDOG TIMEOUT] Health check request timed out after 10s');
  });
}

// Initial ping
pingHealthCheck();

// Periodic monitor
setInterval(pingHealthCheck, PING_INTERVAL_MS);
