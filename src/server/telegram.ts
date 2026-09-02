import { TradeProposal, ActivePosition, HistoricalTrade } from '../types/index.js';

export interface TelegramMessageOptions {
  botToken?: string;
  chatId?: string;
}

export class TelegramService {
  private botToken: string;
  private chatId: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_CHAT_ID || '';
  }

  public updateCredentials(token: string, chatId: string) {
    if (token) this.botToken = token;
    if (chatId) this.chatId = chatId;
  }

  public async sendMessage(text: string, inlineKeyboard?: any): Promise<boolean> {
    const token = this.botToken || process.env.TELEGRAM_BOT_TOKEN;
    const chat = this.chatId || process.env.TELEGRAM_CHAT_ID;

    if (!token || !chat) {
      console.log(`[TELEGRAM LOG (Offline/Mock)]:\n${text}\n---`);
      return true;
    }

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const body: any = {
        chat_id: chat,
        text,
        parse_mode: 'HTML',
      };
      if (inlineKeyboard) {
        body.reply_markup = inlineKeyboard;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      return data.ok === true;
    } catch (err) {
      console.error('Telegram notification error:', err);
      return false;
    }
  }

  /**
   * Broadcasts Autonomous Trade Executed event (Auto Trading = ON)
   */
  public async sendTradeExecuted(pos: ActivePosition, riskAmount: number, targetRange: string, consensus: string): Promise<boolean> {
    const text = `🟢 <b>HUZLE OH TRADE EXECUTED</b>\n` +
      `<b>${pos.symbol} ${pos.direction}</b> (Ticket #${pos.ticket})\n\n` +
      `Entry: <code>${pos.entryPrice}</code>\n` +
      `SL: <code>${pos.stopLoss}</code>\n` +
      `TP: <code>${pos.takeProfit}</code>\n` +
      `Lot: <b>${pos.lotSize}</b>\n` +
      `Risk: <b>$${riskAmount.toFixed(2)}</b>\n` +
      `Target: <b>${targetRange}</b>\n` +
      `AI Confidence: <b>${pos.aiConfidence}%</b>\n\n` +
      `<b>Agent Consensus:</b>\n` +
      `SCOUT ✅\n` +
      `HUNTER ✅\n` +
      `SENTINEL ✅\n` +
      `GUARDIAN ✅\n` +
      `HEAD OF DESK: <b>AUTONOMOUS EXECUTE</b>\n\n` +
      `<i>Autonomous order dispatched to Exness MT5.</i>`;

    return this.sendMessage(text);
  }

  /**
   * Broadcasts Trade Proposal for Manual Operator Approval (Auto Trading = OFF)
   */
  public async sendTradeProposal(proposal: TradeProposal): Promise<boolean> {
    const text = `🚨 <b>HUZLE OH TRADE CANDIDATE</b>\n` +
      `<b>${proposal.symbol} ${proposal.direction}</b>\n\n` +
      `Entry: <code>${proposal.entryPrice}</code>\n` +
      `Stop: <code>${proposal.stopLoss}</code>\n` +
      `Take Profit: <code>${proposal.takeProfit}</code>\n` +
      `Lot: <b>${proposal.lotSize}</b>\n` +
      `Risk: <b>$${proposal.riskAmount}</b> (${proposal.riskPercentage}%)\n` +
      `R:R Ratio: <b>1:${proposal.riskReward}</b>\n` +
      `AI Confidence: <b>${proposal.aiConfidence}%</b>\n` +
      `Agent Consensus: <b>${proposal.agentConsensus}</b>\n\n` +
      `<i>Strategy: ${proposal.strategy} (${proposal.timeframe})</i>\n` +
      `⏱ <i>Expires in 30s.</i>`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: '✅ APPROVE', callback_data: `approve_${proposal.id}` },
          { text: '❌ REJECT', callback_data: `reject_${proposal.id}` },
        ],
      ],
    };

    return this.sendMessage(text, inlineKeyboard);
  }

  /**
   * Broadcasts Breakeven / Trailing Stop modification
   */
  public async sendPositionModified(pos: ActivePosition, actionNote: string): Promise<boolean> {
    const text = `🟡 <b>HUZLE OH POSITION PROTECTED</b>\n` +
      `<b>${pos.symbol} ${pos.direction} #${pos.ticket}</b>\n\n` +
      `${actionNote}\n` +
      `Current Price: <code>${pos.currentPrice}</code>\n` +
      `Stop Loss: <code>${pos.stopLoss}</code> (Breakeven Locked)\n` +
      `Floating P/L: <b>+$${pos.pnl.toFixed(2)} (+${pos.pnlPips} pips)</b>`;

    return this.sendMessage(text);
  }

  /**
   * Broadcasts Partial Profit Locked ($3-$5 reached)
   */
  public async sendPartialProfitLocked(pos: ActivePosition, lockedAmount: number, remainingLots: number): Promise<boolean> {
    const text = `💰 <b>HUZLE OH PARTIAL PROFIT LOCKED</b>\n` +
      `<b>${pos.symbol} ${pos.direction} #${pos.ticket}</b>\n\n` +
      `Profit Secured: <b>+$${lockedAmount.toFixed(2)}</b>\n` +
      `Remaining Position: <b>${remainingLots} lots</b>\n` +
      `Stop Loss: <code>${pos.stopLoss}</code> (Guaranteed Breakeven)\n` +
      `<i>Position running toward extended target ($5-$8).</i>`;

    return this.sendMessage(text);
  }

  /**
   * Broadcasts Trade Closed event
   */
  public async sendTradeClosed(trade: HistoricalTrade, todayPnl: number): Promise<boolean> {
    const isProfit = trade.netPnl >= 0;
    const icon = isProfit ? '✅' : '🛑';
    const text = `${icon} <b>HUZLE OH TRADE CLOSED</b>\n` +
      `<b>${trade.symbol} ${trade.direction} #${trade.ticket}</b>\n\n` +
      `Entry: <code>${trade.entryPrice}</code>\n` +
      `Exit: <code>${trade.exitPrice}</code>\n` +
      `Net P/L: <b>${isProfit ? '+' : ''}$${trade.netPnl.toFixed(2)}</b>\n` +
      `Result: <b>${trade.result}</b>\n` +
      `Duration: <b>${trade.durationMinutes}m</b>\n` +
      `Today's Total P/L: <b>${todayPnl >= 0 ? '+' : ''}$${todayPnl.toFixed(2)}</b>\n` +
      `<i>Strategy: ${trade.strategy} (Confidence: ${trade.aiConfidence}%)</i>`;

    return this.sendMessage(text);
  }

  /**
   * 04:00 Daily Market Briefing formatted according to prompt specification
   */
  public async sendDailyMarketBrief(brief: {
    marketsScanned: string;
    strongSetups: string;
    watchlist: string;
    highRiskMarkets: string;
    marketsToAvoid: string;
    topSetup: {
      symbol: string;
      direction: string;
      entry: number;
      sl: number;
      tp: number;
      risk: string;
      aiConfidence: number;
      agentConsensus: string;
    };
  }): Promise<boolean> {
    const text = `📊 <b>HUZLE OH DAILY MARKET BRIEF</b>\n` +
      `<i>04:00 AM Swarm Intelligence Scan</i>\n\n` +
      `<b>Markets scanned:</b> ${brief.marketsScanned}\n` +
      `<b>Strong setups:</b> ${brief.strongSetups}\n` +
      `<b>Watchlist:</b> ${brief.watchlist}\n` +
      `<b>High-risk markets:</b> ${brief.highRiskMarkets}\n` +
      `<b>Markets to avoid:</b> ${brief.marketsToAvoid}\n\n` +
      `🎯 <b>Top Setup:</b>\n` +
      `Symbol: <b>${brief.topSetup.symbol}</b>\n` +
      `Direction: <b>${brief.topSetup.direction}</b>\n` +
      `Entry: <code>${brief.topSetup.entry}</code>\n` +
      `SL: <code>${brief.topSetup.sl}</code>\n` +
      `TP: <code>${brief.topSetup.tp}</code>\n` +
      `Risk: <b>${brief.topSetup.risk}</b>\n` +
      `AI Confidence: <b>${brief.topSetup.aiConfidence}%</b>\n` +
      `Agent Consensus: <b>${brief.topSetup.agentConsensus}</b>\n\n` +
      `<i>Note: This briefing does NOT open an automatic trade. Normal autonomous risk engine operates independently.</i>`;

    return this.sendMessage(text);
  }

  /**
   * System Alert / Kill Switch / Connection failure
   */
  public async sendSystemAlert(title: string, message: string): Promise<boolean> {
    const text = `🚨 <b>HUZLE OH ALERT: ${title}</b>\n\n${message}`;
    return this.sendMessage(text);
  }
}

export const telegramService = new TelegramService();
