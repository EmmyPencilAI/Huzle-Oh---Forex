"""
HUZLE OH — SQLite Database Layer with WAL Mode & Auto Backup
"""
import sqlite3
import os
import shutil
from datetime import datetime
from typing import Dict, Any, List, Optional
import json

DB_FILE = "huzle_oh.db"
BACKUP_DIR = "backups"

def get_connection(db_path: str = DB_FILE) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.row_factory = sqlite3.Row
    return conn

def init_db(db_path: str = DB_FILE):
    os.makedirs(BACKUP_DIR, exist_ok=True)
    conn = get_connection(db_path)
    cursor = conn.cursor()

    # 1. Users
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'TRADER',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Broker Accounts
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS broker_accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        broker_name TEXT DEFAULT 'EXNESS',
        login_encrypted TEXT NOT NULL,
        password_encrypted TEXT NOT NULL,
        server TEXT NOT NULL,
        is_live INTEGER DEFAULT 0,
        is_connected INTEGER DEFAULT 0,
        balance REAL DEFAULT 2438.21,
        equity REAL DEFAULT 2438.21,
        free_margin REAL DEFAULT 2438.21,
        currency TEXT DEFAULT 'USD',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)

    # 3. Trades
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS trades (
        id TEXT PRIMARY KEY,
        ticket INTEGER,
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
        strategy TEXT NOT NULL,
        ai_confidence REAL,
        agent_consensus TEXT,
        status TEXT NOT NULL,
        is_paper INTEGER DEFAULT 1,
        open_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        close_time TIMESTAMP,
        audit_trail TEXT
    );
    """)

    # 4. Positions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS positions (
        id TEXT PRIMARY KEY,
        ticket INTEGER UNIQUE,
        symbol TEXT NOT NULL,
        direction TEXT NOT NULL,
        lot_size REAL NOT NULL,
        entry_price REAL NOT NULL,
        current_price REAL NOT NULL,
        stop_loss REAL NOT NULL,
        take_profit REAL NOT NULL,
        unrealized_pnl REAL DEFAULT 0,
        is_paper INTEGER DEFAULT 1,
        trailing_stop INTEGER DEFAULT 0,
        opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 5. Orders & Proposals
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        direction TEXT NOT NULL,
        entry_price REAL NOT NULL,
        stop_loss REAL NOT NULL,
        take_profit REAL NOT NULL,
        lot_size REAL NOT NULL,
        status TEXT NOT NULL, -- PENDING, APPROVED, REJECTED, EXPIRED, EXECUTED
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 6. Signals
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS signals (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        timeframe TEXT NOT NULL,
        agent_source TEXT NOT NULL,
        direction TEXT NOT NULL,
        confidence REAL NOT NULL,
        payload TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 7. Agent Events & Predictions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS agent_events (
        id TEXT PRIMARY KEY,
        agent_role TEXT NOT NULL,
        event_type TEXT NOT NULL,
        symbol TEXT,
        message TEXT NOT NULL,
        metadata_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS agent_predictions (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        features_json TEXT,
        predicted_direction TEXT,
        confidence REAL,
        model_version TEXT,
        actual_outcome TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 8. Risk Events
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS risk_events (
        id TEXT PRIMARY KEY,
        event_name TEXT NOT NULL,
        symbol TEXT,
        risk_metric TEXT,
        value REAL,
        threshold REAL,
        action_taken TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 9. Market Data Metadata
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS market_data_metadata (
        symbol TEXT PRIMARY KEY,
        digits INTEGER DEFAULT 5,
        spread_typical REAL,
        min_lot REAL DEFAULT 0.01,
        max_lot REAL DEFAULT 100.0,
        lot_step REAL DEFAULT 0.01,
        contract_size REAL DEFAULT 100000.0,
        is_enabled INTEGER DEFAULT 1,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 10. AI Models
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ai_models (
        id TEXT PRIMARY KEY,
        model_name TEXT NOT NULL,
        model_type TEXT NOT NULL,
        accuracy REAL,
        trained_samples INTEGER,
        is_active INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 11. Backtests
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS backtests (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        timeframe TEXT NOT NULL,
        start_date TEXT,
        end_date TEXT,
        initial_balance REAL,
        final_balance REAL,
        win_rate REAL,
        profit_factor REAL,
        max_drawdown REAL,
        total_trades INTEGER,
        results_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 12. Telegram Events
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS telegram_events (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        message_type TEXT NOT NULL,
        content TEXT NOT NULL,
        response_status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 13. System Logs & Settings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_logs (
        id TEXT PRIMARY KEY,
        level TEXT NOT NULL,
        module TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_agent_events_created ON agent_events(created_at);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs(created_at);")

    conn.commit()
    conn.close()

def backup_database(db_path: str = DB_FILE):
    """Automatic database backup routine for VPS resilience"""
    if os.path.exists(db_path):
        ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        backup_file = os.path.join(BACKUP_DIR, f"huzle_oh_backup_{ts}.db")
        shutil.copy2(db_path, backup_file)
        # Retain last 7 backups
        backups = sorted([os.path.join(BACKUP_DIR, f) for f in os.listdir(BACKUP_DIR) if f.endswith(".db")])
        if len(backups) > 7:
            for old in backups[:-7]:
                try:
                    os.remove(old)
                except Exception:
                    pass

if __name__ == "__main__":
    init_db()
    print("Database huzle_oh.db initialized with WAL mode and schema.")
