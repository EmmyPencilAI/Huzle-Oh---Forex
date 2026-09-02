"""
HUZLE OH — Position Monitor & Lifecycle Manager
Monitors open positions, calculates live P/L, tracks trailing stops,
detects when Target or Stop is approaching, and compiles trade closure audits.
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger("HuzleOh.PositionMonitor")

class PositionMonitor:
    def __init__(self, broker_adapter, telegram_bot=None):
        self.broker = broker_adapter
        self.telegram = telegram_bot

    async def update_positions(self) -> List[Dict[str, Any]]:
        positions = await self.broker.get_open_positions()
        updated = []

        for p in positions:
            symbol = p["symbol"]
            tick = await self.broker.get_tick(symbol)
            if not tick:
                continue

            curr = tick.bid if p["direction"] == "BUY" else tick.ask
            p["current_price"] = curr
            
            is_jpy = "JPY" in symbol
            is_xau = "XAU" in symbol
            pip_size = 0.01 if is_jpy else (0.1 if is_xau else 0.0001)
            pip_val = 10.0 if not is_xau else 100.0

            if p["direction"] == "BUY":
                pnl_pips = (curr - p["entry_price"]) / pip_size
            else:
                pnl_pips = (p["entry_price"] - curr) / pip_size

            pnl_dollars = pnl_pips * p["volume"] * pip_val
            p["pnl"] = round(pnl_dollars, 2)
            p["pnl_pips"] = round(pnl_pips, 1)

            # Check SL / TP Proximity Alerts
            sl_distance_pips = abs(curr - p["sl"]) / pip_size
            tp_distance_pips = abs(curr - p["tp"]) / pip_size

            if tp_distance_pips <= 3.0 and not p.get("tp_alert_sent"):
                p["tp_alert_sent"] = True
                logger.info(f"TARGET APPROACHING on #{p['ticket']} {symbol} ({tp_distance_pips:.1f} pips away)")

            if sl_distance_pips <= 3.0 and not p.get("sl_alert_sent"):
                p["sl_alert_sent"] = True
                logger.warning(f"STOP APPROACHING on #{p['ticket']} {symbol} ({sl_distance_pips:.1f} pips away)")

            updated.append(p)

        return updated
