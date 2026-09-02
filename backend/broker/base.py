"""
HUZLE OH — Broker Adapter Base Class
Allows any execution interface (MT5, cTrader, FIX) to be integrated cleanly.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class AccountInfo:
    login: int
    server: str
    broker: str
    balance: float
    equity: float
    margin: float
    free_margin: float
    margin_level: float
    currency: str
    leverage: int
    connected: bool

@dataclass
class Tick:
    symbol: str
    time: datetime
    bid: float
    ask: float
    spread_pips: float
    volume: float

@dataclass
class CandleBar:
    time: datetime
    open: float
    high: float
    low: float
    close: float
    tick_volume: int

@dataclass
class OrderRequest:
    symbol: str
    direction: str  # BUY or SELL
    volume: float
    price: float
    stop_loss: float
    take_profit: float
    order_type: str = "MARKET"
    comment: str = "HuzleOh"

@dataclass
class ExecutionResult:
    success: bool
    ticket: Optional[int]
    price: float
    volume: float
    error_message: Optional[str] = None

class BrokerAdapter(ABC):
    @abstractmethod
    async def connect(self, login: int, password: str, server: str) -> bool:
        pass

    @abstractmethod
    async def disconnect(self) -> bool:
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        pass

    @abstractmethod
    async def get_account_info(self) -> Optional[AccountInfo]:
        pass

    @abstractmethod
    async def get_symbols(self) -> List[str]:
        pass

    @abstractmethod
    async def get_tick(self, symbol: str) -> Optional[Tick]:
        pass

    @abstractmethod
    async def get_ohlcv(self, symbol: str, timeframe: str, count: int = 100) -> List[CandleBar]:
        pass

    @abstractmethod
    async def place_order(self, request: OrderRequest) -> ExecutionResult:
        pass

    @abstractmethod
    async def modify_order(self, ticket: int, stop_loss: float, take_profit: float) -> bool:
        pass

    @abstractmethod
    async def cancel_order(self, ticket: int) -> bool:
        pass

    @abstractmethod
    async def close_position(self, ticket: int, volume: Optional[float] = None) -> bool:
        pass

    @abstractmethod
    async def get_open_positions(self) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_trade_history(self, days: int = 30) -> List[Dict[str, Any]]:
        pass
