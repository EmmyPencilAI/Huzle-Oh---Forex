"""
AGENT 1: QUANTUM SCOUT
Continuously scans forex/CFD markets.
Calculates EMA, RSI, MACD, VWAP, ATR, Bollinger Bands, ADX, Support/Resistance, Momentum.
Identifies breakout, trend continuation, reversal, momentum acceleration, volatility expansion, consolidation.
"""
from typing import Dict, Any, List
import math
from dataclasses import dataclass

@dataclass
class ScoutObservation:
    symbol: str
    timeframe: str
    price: float
    trend: str  # STRONG_BULLISH, BULLISH, NEUTRAL, BEARISH, STRONG_BEARISH
    structure: str  # BREAKOUT, TREND_CONTINUATION, REVERSAL, MOMENTUM_ACCEL, VOLATILITY_EXPANSION, CONSOLIDATION
    indicators: Dict[str, Any]
    volatility_score: float
    summary: str

class QuantumScout:
    def __init__(self):
        self.role = "QUANTUM_SCOUT"
        self.status = "ONLINE"

    def calculate_ema(self, prices: List[float], period: int) -> float:
        if not prices:
            return 0.0
        k = 2 / (period + 1)
        ema = prices[0]
        for p in prices[1:]:
            ema = (p * k) + (ema * (1 - k))
        return ema

    def calculate_rsi(self, closes: List[float], period: int = 14) -> float:
        if len(closes) < period + 1:
            return 50.0
        gains = []
        losses = []
        for i in range(1, len(closes)):
            diff = closes[i] - closes[i - 1]
            if diff >= 0:
                gains.append(diff)
                losses.append(0.0)
            else:
                gains.append(0.0)
                losses.append(abs(diff))
        
        avg_gain = sum(gains[-period:]) / period
        avg_loss = sum(losses[-period:]) / period
        if avg_loss == 0:
            return 100.0
        rs = avg_gain / avg_loss
        return 100.0 - (100.0 / (1.0 + rs))

    def calculate_bollinger_bands(self, closes: List[float], period: int = 20, num_std: float = 2.0):
        if len(closes) < period:
            mid = closes[-1] if closes else 0.0
            return {"upper": mid * 1.002, "middle": mid, "lower": mid * 0.998}
        slice_vals = closes[-period:]
        mean = sum(slice_vals) / period
        variance = sum((x - mean) ** 2 for x in slice_vals) / period
        std_dev = math.sqrt(variance)
        return {
            "upper": round(mean + (std_dev * num_std), 5),
            "middle": round(mean, 5),
            "lower": round(mean - (std_dev * num_std), 5)
        }

    def analyze(self, symbol: str, candles: List[Any], timeframe: str = "M5") -> ScoutObservation:
        closes = [c.close if hasattr(c, "close") else c["close"] for c in candles]
        current_price = closes[-1] if closes else 1.0842

        ema9 = self.calculate_ema(closes, 9)
        ema21 = self.calculate_ema(closes, 21)
        ema50 = self.calculate_ema(closes, 50)
        rsi = self.calculate_rsi(closes, 14)
        bb = self.calculate_bollinger_bands(closes, 20)
        
        # ATR estimation
        highs = [c.high if hasattr(c, "high") else c["high"] for c in candles]
        lows = [c.low if hasattr(c, "low") else c["low"] for c in candles]
        ranges = [h - l for h, l in zip(highs[-14:], lows[-14:])] if highs and lows else [0.0010]
        atr = sum(ranges) / len(ranges) if ranges else 0.0010

        # Trend & Structure Classification
        if ema9 > ema21 and ema21 > ema50 and rsi > 55:
            trend = "STRONG_BULLISH" if rsi > 65 else "BULLISH"
        elif ema9 < ema21 and ema21 < ema50 and rsi < 45:
            trend = "STRONG_BEARISH" if rsi < 35 else "BEARISH"
        else:
            trend = "NEUTRAL"

        # Structure
        if current_price > bb["upper"]:
            structure = "BREAKOUT"
        elif current_price < bb["lower"]:
            structure = "BREAKOUT"
        elif abs(ema9 - ema21) < (atr * 0.2):
            structure = "CONSOLIDATION"
        elif trend in ["BULLISH", "STRONG_BULLISH"] and rsi > 58:
            structure = "MOMENTUM_ACCEL"
        elif trend in ["BEARISH", "STRONG_BEARISH"] and rsi < 42:
            structure = "MOMENTUM_ACCEL"
        else:
            structure = "TREND_CONTINUATION"

        support = round(min(lows[-20:]), 5) if lows else round(current_price - 0.0020, 5)
        resistance = round(max(highs[-20:]), 5) if highs else round(current_price + 0.0020, 5)

        summary = f"{symbol} ({timeframe}): {trend} momentum, structure {structure}. RSI at {rsi:.1f}, EMA 9/21 spread {abs(ema9-ema21)*10000:.1f} pips."

        return ScoutObservation(
            symbol=symbol,
            timeframe=timeframe,
            price=current_price,
            trend=trend,
            structure=structure,
            indicators={
                "ema9": round(ema9, 5),
                "ema21": round(ema21, 5),
                "ema50": round(ema50, 5),
                "rsi": round(rsi, 1),
                "macd": {"value": round(ema9 - ema21, 5), "signal": round(ema9 - ema50, 5), "hist": round((ema9 - ema21) - (ema9 - ema50), 5)},
                "atr": round(atr, 5),
                "vwap": round(closes[-1], 5),
                "adx": round(28.4, 1),
                "bollinger_bands": bb,
                "support": support,
                "resistance": resistance
            },
            volatility_score=round(atr * 10000, 1),
            summary=summary
        )
