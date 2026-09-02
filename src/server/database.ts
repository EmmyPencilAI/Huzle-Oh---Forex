import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { BrokerAccount, RiskSettings, HistoricalTrade, AgentEvent } from '../types/index.js';

const DB_FILE = path.join(process.cwd(), 'huzle_oh.db');

export class AppDatabase {
  private db: Database | null = null;
  private isInitialized = false;

  public async init(): Promise<void> {
    if (this.isInitialized && this.db) return;

    try {
      const SQL = await initSqlJs();

      if (fs.existsSync(DB_FILE)) {
        const fileBuffer = fs.readFileSync(DB_FILE);
        this.db = new SQL.Database(fileBuffer);
      } else {
        this.db = new SQL.Database();
      }

      this.createTables();
      this.isInitialized = true;
      this.persist();
    } catch (err) {
      console.error('Failed to initialize SQLite database:', err);
    }
  }

  private createTables(): void {
    if (!this.db) return;

    // Broker accounts table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS broker_accounts (
        id TEXT PRIMARY KEY,
        account_number TEXT NOT NULL,
        server TEXT NOT NULL,
        broker TEXT DEFAULT 'Exness',
        balance REAL DEFAULT 2438.21,
        equity REAL DEFAULT 2438.21,
        free_margin REAL DEFAULT 2368.21,
        margin REAL DEFAULT 70.0,
        margin_level REAL DEFAULT 3480.0,
        currency TEXT DEFAULT 'USD',
        leverage INTEGER DEFAULT 500,
        is_live INTEGER DEFAULT 0,
        encrypted_password TEXT,
        algo_trading INTEGER DEFAULT 1,
        trade_allowed INTEGER DEFAULT 1,
        updated_at INTEGER
      );
    `);

    // System Settings & Risk Parameters
    this.db.run(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id TEXT PRIMARY KEY,
        settings_json TEXT NOT NULL,
        updated_at INTEGER
      );
    `);

    // Trades
    this.db.run(`
      CREATE TABLE IF NOT EXISTS trades (
        id TEXT PRIMARY KEY,
        ticket INTEGER UNIQUE,
        symbol TEXT NOT NULL,
        direction TEXT NOT NULL,
        lot_size REAL NOT NULL,
        entry_price REAL NOT NULL,
        exit_price REAL,
        stop_loss REAL NOT NULL,
        take_profit REAL NOT NULL,
        gross_pnl REAL DEFAULT 0,
        fees REAL DEFAULT 0,
        net_pnl REAL DEFAULT 0,
        strategy TEXT,
        ai_confidence REAL,
        result TEXT,
        is_paper INTEGER DEFAULT 1,
        open_time INTEGER,
        close_time INTEGER,
        audit_trail TEXT
      );
    `);

    // Agent Events
    this.db.run(`
      CREATE TABLE IF NOT EXISTS agent_events (
        id TEXT PRIMARY KEY,
        agent TEXT NOT NULL,
        type TEXT NOT NULL,
        symbol TEXT,
        message TEXT NOT NULL,
        timestamp INTEGER
      );
    `);

    // Daily Market Briefings
    this.db.run(`
      CREATE TABLE IF NOT EXISTS market_briefings (
        id TEXT PRIMARY KEY,
        scheduled_time TEXT,
        briefing_text TEXT NOT NULL,
        top_setup_symbol TEXT,
        created_at INTEGER
      );
    `);
  }

  public persist(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_FILE, buffer);
    } catch (err) {
      console.error('Error persisting SQLite DB:', err);
    }
  }

  public saveBrokerAccount(account: BrokerAccount, encryptedPassword?: string): void {
    if (!this.db) return;
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO broker_accounts (
          id, account_number, server, broker, balance, equity, free_margin, margin,
          margin_level, currency, leverage, is_live, encrypted_password, algo_trading, trade_allowed, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run([
        'primary',
        account.accountNumber,
        account.server,
        account.broker,
        account.balance,
        account.equity,
        account.freeMargin,
        account.margin,
        account.marginLevel,
        account.currency,
        account.leverage,
        account.isLive ? 1 : 0,
        encryptedPassword || '',
        account.tradingPermissions?.algoTrading ? 1 : 0,
        account.tradingPermissions?.tradeAllowed ? 1 : 0,
        Date.now(),
      ]);
      stmt.free();
      this.persist();
    } catch (err) {
      console.error('Failed to save broker account:', err);
    }
  }

  public loadBrokerAccount(): { account: Partial<BrokerAccount>; encryptedPassword?: string } | null {
    if (!this.db) return null;
    try {
      const res = this.db.exec('SELECT * FROM broker_accounts WHERE id = "primary"');
      if (res.length > 0 && res[0].values.length > 0) {
        const row = res[0].values[0];
        const cols = res[0].columns;
        const getVal = (name: string) => row[cols.indexOf(name)];

        return {
          account: {
            accountNumber: String(getVal('account_number')),
            server: String(getVal('server')),
            broker: String(getVal('broker') || 'Exness'),
            balance: Number(getVal('balance')),
            equity: Number(getVal('equity')),
            freeMargin: Number(getVal('free_margin')),
            margin: Number(getVal('margin') || 70.0),
            marginLevel: Number(getVal('margin_level') || 3480.0),
            currency: String(getVal('currency') || 'USD'),
            leverage: Number(getVal('leverage') || 500),
            isLive: Boolean(getVal('is_live')),
            tradingPermissions: {
              algoTrading: Boolean(getVal('algo_trading')),
              investorMode: false,
              tradeAllowed: Boolean(getVal('trade_allowed')),
            },
            accountStatus: 'CONNECTED',
            connectionHealth: 'HEALTHY',
          },
          encryptedPassword: String(getVal('encrypted_password') || ''),
        };
      }
    } catch (err) {
      console.error('Failed to load broker account from DB:', err);
    }
    return null;
  }

  public saveSettings(settings: RiskSettings): void {
    if (!this.db) return;
    try {
      const stmt = this.db.prepare('INSERT OR REPLACE INTO system_settings (id, settings_json, updated_at) VALUES (?, ?, ?)');
      stmt.run(['risk_settings', JSON.stringify(settings), Date.now()]);
      stmt.free();
      this.persist();
    } catch (err) {
      console.error('Failed to save settings to DB:', err);
    }
  }

  public loadSettings(): RiskSettings | null {
    if (!this.db) return null;
    try {
      const res = this.db.exec('SELECT settings_json FROM system_settings WHERE id = "risk_settings"');
      if (res.length > 0 && res[0].values.length > 0) {
        const json = res[0].values[0][0] as string;
        return JSON.parse(json);
      }
    } catch (err) {
      console.error('Failed to load settings from DB:', err);
    }
    return null;
  }

  public saveTrade(trade: HistoricalTrade): void {
    if (!this.db) return;
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO trades (
          id, ticket, symbol, direction, lot_size, entry_price, exit_price, stop_loss, take_profit,
          gross_pnl, fees, net_pnl, strategy, ai_confidence, result, is_paper, open_time, close_time, audit_trail
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run([
        trade.id,
        trade.ticket,
        trade.symbol,
        trade.direction,
        trade.lotSize,
        trade.entryPrice,
        trade.exitPrice,
        trade.stopLoss,
        trade.takeProfit,
        trade.grossPnl,
        trade.fees,
        trade.netPnl,
        trade.strategy,
        trade.aiConfidence,
        trade.result,
        0, // live vs paper
        trade.openTime,
        trade.closeTime,
        JSON.stringify(trade.audit),
      ]);
      stmt.free();
      this.persist();
    } catch (err) {
      console.error('Failed to save trade to DB:', err);
    }
  }

  public loadTrades(): HistoricalTrade[] {
    if (!this.db) return [];
    try {
      const res = this.db.exec('SELECT * FROM trades ORDER BY close_time DESC LIMIT 100');
      if (res.length > 0) {
        const cols = res[0].columns;
        return res[0].values.map((row) => {
          const getVal = (name: string) => row[cols.indexOf(name)];
          let audit = {
            scoutSignal: '',
            hunterStrategy: '',
            guardianRisk: '',
            headOfDeskVerdict: '',
            aiConfidenceScore: 85,
          };
          try {
            const parsed = JSON.parse(String(getVal('audit_trail')));
            if (parsed) audit = parsed;
          } catch {}

          return {
            id: String(getVal('id')),
            ticket: Number(getVal('ticket')),
            symbol: String(getVal('symbol')),
            direction: getVal('direction') as any,
            lotSize: Number(getVal('lot_size')),
            entryPrice: Number(getVal('entry_price')),
            exitPrice: Number(getVal('exit_price')),
            stopLoss: Number(getVal('stop_loss')),
            takeProfit: Number(getVal('take_profit')),
            grossPnl: Number(getVal('gross_pnl')),
            fees: Number(getVal('fees')),
            netPnl: Number(getVal('net_pnl')),
            durationMinutes: Math.max(1, Math.floor((Number(getVal('close_time')) - Number(getVal('open_time'))) / 60000)),
            openTime: Number(getVal('open_time')),
            closeTime: Number(getVal('close_time')),
            strategy: String(getVal('strategy')),
            aiConfidence: Number(getVal('ai_confidence')),
            result: getVal('result') as any,
            audit,
          };
        });
      }
    } catch (err) {
      console.error('Failed to load trades from DB:', err);
    }
    return [];
  }
}

export const dbService = new AppDatabase();
