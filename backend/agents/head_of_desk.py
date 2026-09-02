"""
AGENT 5: HEAD OF DESK
Receives Scout, Hunter, Sentinel, Guardian reports, AI model score, and LLM reasoning.
Outputs: TRADE CANDIDATE, WAIT, REJECT.
CANNOT OVERRIDE AEGIS GUARDIAN.
"""
from typing import Dict, Any, Optional
from dataclasses import dataclass
from .scout import ScoutObservation
from .hunter import SetupCandidate
from .sentinel import SentinelReport
from .guardian import RiskVerdict

@dataclass
class DeskDecision:
    verdict: str  # TRADE_CANDIDATE, WAIT, REJECT
    symbol: str
    direction: Optional[str]
    consensus_score: str  # e.g. "5/5" or "4/5"
    ai_confidence: float
    summary: str
    detailed_reasoning: str
    can_execute: bool

class HeadOfDesk:
    def __init__(self):
        self.role = "HEAD_OF_DESK"
        self.status = "ONLINE"

    def synthesize(
        self,
        scout: ScoutObservation,
        hunter: SetupCandidate,
        sentinel: SentinelReport,
        guardian: RiskVerdict,
        ai_ml_confidence: float = 85.0,
        llm_rationale: Optional[str] = None
    ) -> DeskDecision:
        # Rule 1: Guardian has absolute veto power
        if not guardian.approved:
            return DeskDecision(
                verdict="REJECT",
                symbol=scout.symbol,
                direction=hunter.direction,
                consensus_score="0/5 (Aegis Hard Stop)",
                ai_confidence=ai_ml_confidence,
                summary=f"REJECTED BY AEGIS GUARDIAN: {guardian.rejection_reason}",
                detailed_reasoning=f"Risk controls override all AI sentiment. Aegis rejected: {guardian.rejection_reason}",
                can_execute=False
            )

        # Rule 2: If Hunter has no setup
        if not hunter.has_setup:
            return DeskDecision(
                verdict="WAIT",
                symbol=scout.symbol,
                direction=None,
                consensus_score="1/5",
                ai_confidence=ai_ml_confidence,
                summary=hunter.reason or "No high-probability setup identified.",
                detailed_reasoning="Market conditions lack high-conviction trigger. Waiting for structural confirmation.",
                can_execute=False
            )

        # Rule 3: Check Sentinel liquidity and safety
        if not sentinel.safe_to_trade:
            return DeskDecision(
                verdict="WAIT",
                symbol=scout.symbol,
                direction=hunter.direction,
                consensus_score="3/5",
                ai_confidence=ai_ml_confidence,
                summary=f"Market Sentinel warning: {sentinel.status_note}",
                detailed_reasoning=f"Liquidity or spread conditions unfavorable despite technical trigger.",
                can_execute=False
            )

        # Calculate consensus
        votes = 0
        if scout.trend in ["STRONG_BULLISH", "BULLISH", "STRONG_BEARISH", "BEARISH"]:
            votes += 1
        if hunter.has_setup:
            votes += 1
        if sentinel.safe_to_trade:
            votes += 1
        if guardian.approved:
            votes += 1
        if ai_ml_confidence >= 75.0:
            votes += 1

        consensus_str = f"{votes}/5"

        if votes >= 4:
            rationale = llm_rationale or (
                f"{hunter.direction} {scout.symbol} confirmed by {scout.structure} on {scout.timeframe}. "
                f"Sentinel approves {sentinel.active_session} session. Guardian sized {guardian.allowed_lot} lots. "
                f"AI model confidence {ai_ml_confidence:.0f}%."
            )
            return DeskDecision(
                verdict="TRADE_CANDIDATE",
                symbol=scout.symbol,
                direction=hunter.direction,
                consensus_score=consensus_str,
                ai_confidence=ai_ml_confidence,
                summary=f"High-probability {hunter.direction} setup on {scout.symbol}. Consensus {consensus_str}.",
                detailed_reasoning=rationale,
                can_execute=True
            )
        else:
            return DeskDecision(
                verdict="WAIT",
                symbol=scout.symbol,
                direction=hunter.direction,
                consensus_score=consensus_str,
                ai_confidence=ai_ml_confidence,
                summary=f"Consensus insufficient ({consensus_str}). Waiting for higher confluence.",
                detailed_reasoning="System adheres to strict 'No trade is better than a bad trade' rule.",
                can_execute=False
            )
