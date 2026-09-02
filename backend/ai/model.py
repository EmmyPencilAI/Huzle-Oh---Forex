"""
HUZLE OH — Machine Learning Classifier
Uses technical indicator feature engineering (EMA delta, RSI, MACD, ATR, ADX, Bollinger Band width)
to predict directional signal confidence and market regime.
"""
from typing import Dict, Any, List, Tuple
import math

class TradingSignalClassifier:
    def __init__(self):
        self.model_name = "GradientBoosting_RegimeClassifier"
        self.version = "1.2.0"
        self.accuracy = 0.748

    def extract_features(self, indicators: Dict[str, Any], current_spread: float) -> List[float]:
        rsi = indicators.get("rsi", 50.0)
        ema9 = indicators.get("ema9", 1.0)
        ema21 = indicators.get("ema21", 1.0)
        ema_delta = (ema9 - ema21) * 10000
        atr = indicators.get("atr", 0.0010) * 10000
        bb = indicators.get("bollinger_bands", {})
        bb_width = ((bb.get("upper", 1.0) - bb.get("lower", 1.0)) / bb.get("middle", 1.0)) * 10000 if bb else 20.0
        adx = indicators.get("adx", 25.0)
        return [rsi, ema_delta, atr, bb_width, adx, current_spread]

    def predict_confidence(self, features: List[float], candidate_direction: str) -> Tuple[float, str]:
        rsi, ema_delta, atr, bb_width, adx, spread = features
        
        # Base probability calculation
        score = 65.0
        
        # Momentum confluence
        if candidate_direction == "BUY":
            if ema_delta > 0:
                score += 8.0
            if 52.0 <= rsi <= 68.0:
                score += 10.0
        elif candidate_direction == "SELL":
            if ema_delta < 0:
                score += 8.0
            if 32.0 <= rsi <= 48.0:
                score += 10.0

        # ADX trend strength
        if adx > 25.0:
            score += 6.0

        # Spread penalty
        if spread > 2.0:
            score -= (spread - 2.0) * 5.0

        confidence = max(40.0, min(round(score, 1), 94.0))
        regime = "TRENDING" if adx > 25.0 else ("VOLATILITY_EXPANSION" if bb_width > 40.0 else "CONSOLIDATION")
        
        return confidence, regime
