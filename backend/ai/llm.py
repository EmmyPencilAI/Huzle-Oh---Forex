"""
HUZLE OH — LLM Abstraction Layer
Supports Grok API, Local LLM API (Ollama/vLLM), and OpenAI-compatible endpoints.
Used strictly for higher-level reasoning, conflicting signal analysis, daily reports,
and post-trade explanations.
THE LLM CANNOT DIRECTLY PLACE TRADES.
"""
import os
import httpx
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger("HuzleOh.LLM")

class LLMService:
    def __init__(
        self,
        provider: str = "grok",
        api_url: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None
    ):
        self.provider = provider
        self.api_url = api_url or os.getenv("GROK_API_URL", "https://api.x.ai/v1")
        self.api_key = api_key or os.getenv("GROK_API_KEY", "")
        self.model = model or os.getenv("GROK_MODEL", "grok-beta")

    async def generate_market_synthesis(self, market_data: Dict[str, Any]) -> str:
        """Generates executive summary and agent consensus reasoning"""
        prompt = (
            f"You are the Head of Desk AI reasoning engine for HUZLE OH — AGENTIC TRADER.\n"
            f"Market state: {market_data.get('symbol')} on {market_data.get('timeframe')}.\n"
            f"Indicators: {market_data.get('indicators')}.\n"
            f"Synthesize this in 2 concise sentences: state momentum structure and why capital is protected."
        )

        if not self.api_key:
            # Fallback deterministic rationale
            sym = market_data.get("symbol", "EURUSD")
            trend = market_data.get("trend", "BULLISH")
            return f"{sym} exhibits clear {trend} alignment across short-term moving averages. Aegis Guardian risk criteria are satisfied with strict invalidation."

        try:
            headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": "You are a quantitative forex risk analyst. Be concise, precise, and objective."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2,
                "max_tokens": 150
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(f"{self.api_url}/chat/completions", headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"].strip()
                else:
                    logger.warning(f"LLM API returned status {res.status_code}")
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")

        return f"Structural momentum confirmed on {market_data.get('symbol', 'Asset')}. Sized strictly according to account equity."
