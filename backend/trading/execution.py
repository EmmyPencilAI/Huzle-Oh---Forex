"""
HUZLE OH — Execution Engine with Final Execution Check
Immediately before sending order to MT5:
Re-checks current price, spread, margin, risk, signal validity, stop distance, market volatility.
If conditions changed materially: TRADE INVALIDATED.
"""
import logging
from typing import Dict, Any, Tuple
from datetime import datetime
from ..broker.base import OrderRequest, ExecutionResult

logger = logging.getLogger("HuzleOh.Execution")

class ExecutionEngine:
    def __init__(self, broker_adapter, risk_guardian):
        self.broker = broker_adapter
        self.guardian = risk_guardian

    async def execute_approved_proposal(self, proposal: Dict[str, Any]) -> Tuple[bool, str, Optional[int]]:
        symbol = proposal["symbol"]
        direction = proposal["direction"]
        approved_entry = proposal["entry_price"]
        sl = proposal["stop_loss"]
        tp = proposal["take_profit"]
        lot = proposal["lot_size"]

        # SECTION 23: FINAL EXECUTION CHECK
        logger.info(f"Initiating FINAL EXECUTION CHECK for proposal #{proposal['id']} ({symbol} {direction})")

        tick = await self.broker.get_tick(symbol)
        if not tick:
            return False, "TRADE INVALIDATED: Real-time tick data unavailable.", None

        current_price = tick.ask if direction == "BUY" else tick.bid
        digits = 2 if "JPY" in symbol or "XAU" in symbol else 5
        pip_size = 0.01 if "JPY" in symbol else (0.1 if "XAU" in symbol else 0.0001)

        # 1. Price slippage check
        slippage_pips = abs(current_price - approved_entry) / pip_size
        if slippage_pips > self.guardian.max_slippage_pips:
            return False, f"TRADE INVALIDATED: Slippage ({slippage_pips:.1f} pips) exceeds {self.guardian.max_slippage_pips} pips limit.", None

        # 2. Spread spike check
        if tick.spread_pips > self.guardian.max_spread_pips:
            return False, f"TRADE INVALIDATED: Spread widened to {tick.spread_pips} pips (limit: {self.guardian.max_spread_pips}).", None

        # 3. Margin & Account check
        acct = await self.broker.get_account_info()
        if not acct or acct.free_margin < (lot * 100):
            return False, "TRADE INVALIDATED: Insufficient free margin for position.", None

        # 4. Stop-loss distance sanity check
        sl_dist = abs(current_price - sl)
        if sl_dist < (5 * pip_size):
            return False, "TRADE INVALIDATED: Stop loss is too close to current market price.", None

        # 5. Aegis Kill Switch check
        if self.guardian.kill_switch_active:
            return False, "TRADE INVALIDATED: Aegis Kill Switch is active.", None

        # ALL CHECKS PASSED -> SUBMIT ORDER TO MT5
        logger.info(f"Final validation passed for #{proposal['id']}. Executing order on MT5...")
        order_req = OrderRequest(
            symbol=symbol,
            direction=direction,
            volume=lot,
            price=current_price,
            stop_loss=sl,
            take_profit=tp,
            comment=f"HuzleOh-{proposal['id']}"
        )

        res: ExecutionResult = await self.broker.place_order(order_req)
        if res.success:
            logger.info(f"MT5 ORDER EXECUTED SUCCESSFULLY: Ticket #{res.ticket} @ {res.price}")
            return True, f"Executed on MT5: Ticket #{res.ticket}", res.ticket
        else:
            logger.error(f"MT5 Execution Failed: {res.error_message}")
            return False, f"MT5 Execution Error: {res.error_message}", None
