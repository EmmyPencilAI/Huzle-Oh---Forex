"""
HUZLE OH — Telegram Bot Integration
Sends trade proposals with inline [APPROVE] and [REJECT] buttons,
delivers 04:00 AM Morning Market Intelligence reports, and streams trade updates.
"""
import httpx
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("HuzleOh.Telegram")

class TelegramNotifier:
    def __init__(self, bot_token: str, chat_id: str):
        self.token = bot_token
        self.chat_id = chat_id
        self.api_url = f"https://api.telegram.org/bot{bot_token}"

    async def send_message(self, text: str, reply_markup: Optional[Dict[str, Any]] = None) -> bool:
        if not self.token or not self.chat_id:
            logger.info(f"[Telegram Mock] Would send message: {text[:60]}...")
            return True

        try:
            payload = {
                "chat_id": self.chat_id,
                "text": text,
                "parse_mode": "HTML"
            }
            if reply_markup:
                payload["reply_markup"] = reply_markup

            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(f"{self.api_url}/sendMessage", json=payload)
                return res.status_code == 200
        except Exception as e:
            logger.error(f"Telegram send failed: {e}")
            return False

    async def send_trade_proposal(self, proposal: Dict[str, Any]) -> bool:
        text = (
            f"🚨 <b>HUZLE OH TRADE PROPOSAL</b>\n"
            f"<b>EXNESS / MT5</b>\n\n"
            f"<b>{proposal['symbol']}</b> {proposal['direction']}\n"
            f"Entry: <code>{proposal['entry_price']}</code>\n"
            f"Stop: <code>{proposal['stop_loss']}</code>\n"
            f"Take Profit: <code>{proposal['take_profit']}</code>\n"
            f"Lot: <b>{proposal['lot_size']}</b>\n"
            f"AI Confidence: <b>{proposal['ai_confidence']}%</b>\n"
            f"Agent Consensus: <b>{proposal['agent_consensus']}</b>\n"
            f"Expected Duration: <b>{proposal['expected_duration']}</b>\n\n"
            f"<i>Reason: {proposal['reason']}</i>\n"
            f"⏱ <i>Proposal expires in 30 seconds.</i>"
        )
        markup = {
            "inline_keyboard": [
                [
                    {"text": "✅ APPROVE", "callback_data": f"approve_{proposal['id']}"},
                    {"text": "❌ REJECT", "callback_data": f"reject_{proposal['id']}"}
                ]
            ]
        }
        return await self.send_message(text, markup)

    async def send_trade_closed(self, trade: Dict[str, Any]) -> bool:
        pnl_symbol = "+" if trade["net_pnl"] >= 0 else ""
        text = (
            f"✅ <b>HUZLE OH TRADE CLOSED</b>\n"
            f"<b>{trade['symbol']} {trade['direction']}</b>\n\n"
            f"Entry: <code>{trade['entry_price']}</code>\n"
            f"Exit: <code>{trade['exit_price']}</code>\n"
            f"Duration: <b>{trade.get('duration', '14m 20s')}</b>\n"
            f"Gross P/L: <code>{pnl_symbol}${trade['gross_pnl']:.2f}</code>\n"
            f"Fees/Costs: <code>-${trade.get('fees', 0.80):.2f}</code>\n"
            f"Net P/L: <b>{pnl_symbol}${trade['net_pnl']:.2f}</b>\n"
            f"Result: <b>{trade.get('result', 'PROFIT')}</b>\n"
            f"Strategy: <i>{trade.get('strategy', 'Momentum Scalping')}</i>\n"
            f"AI Confidence: <b>{trade.get('ai_confidence', 88)}%</b>"
        )
        return await self.send_message(text)
