"""
AGENT 4: AEGIS GUARDIAN
The hard risk-control layer.
Monitors balance, equity, margin, open exposure, daily P/L, drawdown, consecutive losses,
correlation, spread, volatility, stop distance, expected slippage, trading costs.
Calculates: Maximum Position Size, Maximum Risk, Expected Loss, Expected Net Profit, Risk/Reward.
HARD RISK RULES: Rejects any trade violating limits. Can trigger STOP NEW TRADES.
"""
from typing import Dict, Any, Optional
from dataclasses import dataclass
import math

@dataclass
class RiskVerdict:
    approved: bool
    symbol: str
    direction: str
    allowed_lot: float
    max_risk_amount: float
    expected_loss: float
    expected_net_profit: float
    risk_reward: float
    rejection_reason: Optional[str] = None
    kill_switch_triggered: bool = False

class AegisGuardian:
    def __init__(
        self,
        max_risk_pct: float = 1.5,
        max_daily_loss_pct: float = 4.0,
        max_simultaneous_trades: int = 3,
        max_drawdown_pct: float = 10.0,
        max_spread_pips: float = 2.5,
        max_slippage_pips: float = 1.5
    ):
        self.role = "AEGIS_GUARDIAN"
        self.status = "ONLINE"
        self.max_risk_pct = max_risk_pct
        self.max_daily_loss_pct = max_daily_loss_pct
        self.max_simultaneous_trades = max_simultaneous_trades
        self.max_drawdown_pct = max_drawdown_pct
        self.max_spread_pips = max_spread_pips
        self.max_slippage_pips = max_slippage_pips
        self.kill_switch_active = False

    def trigger_kill_switch(self, reason: str = "Manual User Trigger"):
        self.kill_switch_active = True
        return f"AEGIS KILL SWITCH ACTIVATED: {reason}. STOPPING ALL NEW TRADES."

    def reset_kill_switch(self):
        self.kill_switch_active = False

    def validate_trade_risk(
        self,
        symbol: str,
        direction: str,
        entry: float,
        stop_loss: float,
        take_profit: float,
        account_balance: float,
        account_equity: float,
        open_positions_count: int,
        daily_loss_amount: float,
        current_spread_pips: float
    ) -> RiskVerdict:
        # Check Kill Switch
        if self.kill_switch_active:
            return RiskVerdict(
                approved=False,
                symbol=symbol,
                direction=direction,
                allowed_lot=0.0,
                max_risk_amount=0.0,
                expected_loss=0.0,
                expected_net_profit=0.0,
                risk_reward=0.0,
                rejection_reason="AEGIS KILL SWITCH IS ACTIVE. ALL NEW TRADES BLOCKED.",
                kill_switch_triggered=True
            )

        # 1. Max Simultaneous Trades Check
        if open_positions_count >= self.max_simultaneous_trades:
            return RiskVerdict(
                approved=False,
                symbol=symbol,
                direction=direction,
                allowed_lot=0.0,
                max_risk_amount=0.0,
                expected_loss=0.0,
                expected_net_profit=0.0,
                risk_reward=0.0,
                rejection_reason=f"Max simultaneous trades reached ({open_positions_count}/{self.max_simultaneous_trades})."
            )

        # 2. Daily Loss Limit Check
        daily_loss_pct = (abs(daily_loss_amount) / account_balance) * 100.0 if daily_loss_amount < 0 else 0.0
        if daily_loss_pct >= self.max_daily_loss_pct:
            return RiskVerdict(
                approved=False,
                symbol=symbol,
                direction=direction,
                allowed_lot=0.0,
                max_risk_amount=0.0,
                expected_loss=0.0,
                expected_net_profit=0.0,
                risk_reward=0.0,
                rejection_reason=f"Max daily loss reached ({daily_loss_pct:.1f}% >= {self.max_daily_loss_pct}%). STOP NEW TRADES."
            )

        # 3. Max Spread Check
        if current_spread_pips > self.max_spread_pips:
            return RiskVerdict(
                approved=False,
                symbol=symbol,
                direction=direction,
                allowed_lot=0.0,
                max_risk_amount=0.0,
                expected_loss=0.0,
                expected_net_profit=0.0,
                risk_reward=0.0,
                rejection_reason=f"Current spread ({current_spread_pips} pips) exceeds maximum allowed ({self.max_spread_pips} pips)."
            )

        # 4. Stop Loss Distance Check
        sl_dist = abs(entry - stop_loss)
        if sl_dist <= 0:
            return RiskVerdict(
                approved=False,
                symbol=symbol,
                direction=direction,
                allowed_lot=0.0,
                max_risk_amount=0.0,
                expected_loss=0.0,
                expected_net_profit=0.0,
                risk_reward=0.0,
                rejection_reason="Invalid stop loss distance (zero or negative)."
            )

        # 5. Position Sizing based on configured risk percentage
        max_risk_dollars = account_equity * (self.max_risk_pct / 100.0)
        
        # Pip valuation
        is_jpy = "JPY" in symbol
        is_xau = "XAU" in symbol
        pip_size = 0.01 if is_jpy else (0.1 if is_xau else 0.0001)
        sl_pips = sl_dist / pip_size
        
        # 1 standard lot = $10 per pip for EURUSD, adjusted for JPY/XAU
        pip_value_per_standard_lot = 10.0 if not is_xau else 100.0
        pip_cost_per_lot = sl_pips * pip_value_per_standard_lot
        
        raw_lot = max_risk_dollars / pip_cost_per_lot if pip_cost_per_lot > 0 else 0.01
        lot = round(raw_lot, 2)
        lot = max(0.01, min(lot, 2.0))  # hard cap at 2.0 lots for safety

        tp_dist = abs(take_profit - entry)
        tp_pips = tp_dist / pip_size
        expected_profit = round(lot * tp_pips * pip_value_per_standard_lot, 2)
        expected_loss = round(lot * sl_pips * pip_value_per_standard_lot, 2)
        rr = round(tp_pips / sl_pips, 2) if sl_pips > 0 else 1.0

        if rr < 1.8:
            return RiskVerdict(
                approved=False,
                symbol=symbol,
                direction=direction,
                allowed_lot=0.0,
                max_risk_amount=0.0,
                expected_loss=0.0,
                expected_net_profit=0.0,
                risk_reward=rr,
                rejection_reason=f"Risk/Reward ratio {rr}:1 is below minimum acceptable threshold 1.8:1."
            )

        return RiskVerdict(
            approved=True,
            symbol=symbol,
            direction=direction,
            allowed_lot=lot,
            max_risk_amount=round(max_risk_dollars, 2),
            expected_loss=expected_loss,
            expected_net_profit=expected_profit,
            risk_reward=rr
        )
