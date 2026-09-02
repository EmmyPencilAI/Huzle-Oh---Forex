"""
AGENT 2: SETUP HUNTER
Receives Scout observations.
Determines whether a genuine trade setup exists.
Calculates symbol, direction, entry, SL, TP, lot size, risk/reward, confidence, strategy, timeframe, expected duration, invalidation condition.
ALLOWED TO RETURN: NO TRADE.
"""
from typing import Optional, Dict, Any
from dataclasses import dataclass
from .scout import ScoutObservation

@dataclass
class SetupCandidate:
    has_setup: bool
    symbol: str
    direction: Optional[str] = None  # BUY or SELL
    entry: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    risk_reward: Optional[float] = None
    confidence: Optional[float] = None
    strategy: Optional[str] = None
    timeframe: Optional[str] = None
    expected_duration: Optional[str] = None
    invalidation_condition: Optional[str] = None
    reason: Optional[str] = None

class SetupHunter:
    def __init__(self):
        self.role = "SETUP_HUNTER"
        self.status = "ONLINE"

    def evaluate(self, obs: ScoutObservation) -> SetupCandidate:
        # If market is consolidating or weak ADX, return NO TRADE immediately
        if obs.structure == "CONSOLIDATION" or obs.trend == "NEUTRAL":
            return SetupCandidate(
                has_setup=False,
                symbol=obs.symbol,
                reason=f"No clear structural setup in {obs.symbol}. Market is consolidating (RSI: {obs.indicators['rsi']}). Preserving capital."
            )

        digits = 2 if "JPY" in obs.symbol or "XAU" in obs.symbol else 5
        pip_mult = 0.01 if "JPY" in obs.symbol else (0.1 if "XAU" in obs.symbol else 0.0001)
        price = obs.price
        atr = obs.indicators["atr"]
        sl_distance = max(atr * 1.5, 10 * pip_mult)
        tp_distance = sl_distance * 2.2  # minimum 1:2.2 R:R

        # Check Bullish Setup
        if obs.trend in ["STRONG_BULLISH", "BULLISH"] and obs.structure in ["BREAKOUT", "MOMENTUM_ACCEL", "TREND_CONTINUATION"]:
            if obs.indicators["rsi"] < 75:  # Not dangerously overbought
                entry = price
                sl = round(entry - sl_distance, digits)
                tp = round(entry + tp_distance, digits)
                rr = round(tp_distance / sl_distance, 2)
                conf = 88.0 if obs.trend == "STRONG_BULLISH" else 81.0

                return SetupCandidate(
                    has_setup=True,
                    symbol=obs.symbol,
                    direction="BUY",
                    entry=round(entry, digits),
                    stop_loss=sl,
                    take_profit=tp,
                    risk_reward=rr,
                    confidence=conf,
                    strategy="Breakout Momentum Scalp" if obs.structure == "BREAKOUT" else "Trend Continuation",
                    timeframe=obs.timeframe,
                    expected_duration="12 to 25 minutes",
                    invalidation_condition=f"Candle closes below {sl} or RSI breaks below 48.0",
                    reason=f"Bullish alignment: EMA 9 > 21 > 50 with healthy RSI ({obs.indicators['rsi']}) and favorable R:R {rr}:1."
                )

        # Check Bearish Setup
        if obs.trend in ["STRONG_BEARISH", "BEARISH"] and obs.structure in ["BREAKOUT", "MOMENTUM_ACCEL", "TREND_CONTINUATION"]:
            if obs.indicators["rsi"] > 25:  # Not dangerously oversold
                entry = price
                sl = round(entry + sl_distance, digits)
                tp = round(entry - tp_distance, digits)
                rr = round(tp_distance / sl_distance, 2)
                conf = 87.0 if obs.trend == "STRONG_BEARISH" else 80.0

                return SetupCandidate(
                    has_setup=True,
                    symbol=obs.symbol,
                    direction="SELL",
                    entry=round(entry, digits),
                    stop_loss=sl,
                    take_profit=tp,
                    risk_reward=rr,
                    confidence=conf,
                    strategy="Breakout Momentum Scalp" if obs.structure == "BREAKOUT" else "Trend Continuation",
                    timeframe=obs.timeframe,
                    expected_duration="10 to 20 minutes",
                    invalidation_condition=f"Candle closes above {sl} or RSI recovers above 52.0",
                    reason=f"Bearish momentum acceleration confirmed on {obs.timeframe} with strict {rr}:1 R:R."
                )

        # Default: NO TRADE
        return SetupCandidate(
            has_setup=False,
            symbol=obs.symbol,
            reason=f"Risk-to-reward or momentum clarity insufficient for {obs.symbol}. NO TRADE."
        )
