"""
HUZLE OH — AGENTIC TRADER
Production Configuration for VPS Deployment
"""
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App
    APP_NAME: str = "HUZLE OH — AGENTIC TRADER"
    ENV: str = os.getenv("ENV", "production")
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", "huzle_oh.db")
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "0.0.0.0")

    # Exness & MetaTrader 5
    EXNESS_MT5_LOGIN: int = int(os.getenv("EXNESS_MT5_LOGIN", "0") or "0")
    EXNESS_MT5_PASSWORD: str = os.getenv("EXNESS_MT5_PASSWORD", "")
    EXNESS_MT5_SERVER: str = os.getenv("EXNESS_MT5_SERVER", "Exness-MT5Real")
    MT5_PATH: str = os.getenv("MT5_PATH", "/opt/metatrader5/terminal64.exe")

    # Telegram Bot
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_CHAT_ID: str = os.getenv("TELEGRAM_CHAT_ID", "")
    MORNING_REPORT_TIME: str = os.getenv("MORNING_REPORT_TIME", "04:00")
    TIMEZONE: str = os.getenv("TIMEZONE", "UTC")

    # AI / LLM APIs
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GROK_API_KEY: str = os.getenv("GROK_API_KEY", "")
    GROK_API_URL: str = os.getenv("GROK_API_URL", "https://api.x.ai/v1")
    GROK_MODEL: str = os.getenv("GROK_MODEL", "grok-beta")

    LOCAL_LLM_API_URL: str = os.getenv("LOCAL_LLM_API_URL", "http://localhost:11434/v1")
    LOCAL_LLM_API_KEY: str = os.getenv("LOCAL_LLM_API_KEY", "")
    LOCAL_LLM_MODEL: str = os.getenv("LOCAL_LLM_MODEL", "llama3")

    # Security
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "huzle_oh_secret_key_32_bytes_len!")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "huzle_oh_jwt_secret_token_key_change_me")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    # Risk Defaults (Hard Rules)
    DEFAULT_MAX_RISK_PER_TRADE_PCT: float = 1.5
    DEFAULT_MAX_DAILY_LOSS_PCT: float = 4.0
    DEFAULT_MAX_SIMULTANEOUS_TRADES: int = 3
    DEFAULT_MAX_SPREAD_PIPS: float = 2.5
    DEFAULT_MAX_SLIPPAGE_PIPS: float = 1.5
    DEFAULT_MAX_DRAWDOWN_PCT: float = 10.0
    DAILY_TARGET_PCT: float = 30.0

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
