"""
HUZLE OH — Trading Engine
Continuously scans markets, coordinates multi-agent consensus,
manages user trade approvals, supervises execution and monitors positions.
Adheres strictly to the core principle:
PROTECT CAPITAL → FIND OPPORTUNITY → VERIFY → EXECUTE → LEARN
"""
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from ..agents.orchestrator import AgentOrchestrator
from .execution import ExecutionEngine
from .position import PositionMonitor

logger = logging.getLogger("HuzleOh.TradingEngine")

class TradingEngine:
    def __init__(self, broker_adapter):
        self.broker = broker_adapter
        self.orchestrator = AgentOrchestrator(broker_adapter)
        self.execution = ExecutionEngine(broker_adapter, self.orchestrator.guardian)
        self.position_monitor = PositionMonitor(broker_adapter)
        self.is_active = True
        self.symbols = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "AUDUSD", "USDCAD", "USDCHF", "NZDUSD"]

    async def scan_all_markets(self) -> List[Dict[str, Any]]:
        """Run event-driven market scanning across configured pairs"""
        proposals = []
        for symbol in self.symbols:
            try:
                prop = await self.orchestrator.run_pipeline_for_symbol(symbol, "M5")
                if prop:
                    proposals.append(prop)
            except Exception as e:
                logger.error(f"Error scanning {symbol}: {e}")
        return proposals

    async def approve_trade(self, proposal_id: str) -> Dict[str, Any]:
        """User clicks [APPROVE] on proposal card"""
        if proposal_id not in self.orchestrator.active_proposals:
            return {"success": False, "message": "Proposal not found or already processed."}

        proposal = self.orchestrator.active_proposals[proposal_id]
        if datetime.utcnow().timestamp() > proposal["expires_at"]:
            proposal["status"] = "EXPIRED"
            return {"success": False, "message": "Proposal has expired (30s window passed)."}

        # Run Final Execution Check & Execute
        success, msg, ticket = await self.execution.execute_approved_proposal(proposal)
        if success:
            proposal["status"] = "APPROVED"
            proposal["ticket"] = ticket
            self.orchestrator.emit_event("HEAD_OF_DESK", "EXECUTE_SUCCESS", f"Trade executed: #{ticket} {proposal['symbol']}", proposal["symbol"])
            return {"success": True, "message": msg, "ticket": ticket}
        else:
            proposal["status"] = "INVALIDATED"
            self.orchestrator.emit_event("AEGIS_GUARDIAN", "INVALIDATION", f"Trade #{proposal_id} invalidated: {msg}", proposal["symbol"])
            return {"success": False, "message": msg}

    async def reject_trade(self, proposal_id: str, reason: str = "User declined") -> Dict[str, Any]:
        """User clicks [REJECT] on proposal card"""
        if proposal_id in self.orchestrator.active_proposals:
            proposal = self.orchestrator.active_proposals[proposal_id]
            proposal["status"] = "REJECTED"
            self.orchestrator.emit_event("HEAD_OF_DESK", "USER_REJECT", f"User rejected proposal #{proposal_id}: {reason}")
            return {"success": True, "message": "Trade proposal rejected."}
        return {"success": False, "message": "Proposal not found."}
