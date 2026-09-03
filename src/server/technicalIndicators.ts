import { Candle } from '../types/index.js';

export interface CalculatedIndicators {
  ema5: number;
  ema9: number;
  ema21: number;
  ema50: number;
  rsi: number;
  macd: { value: number; signal: number; hist: number };
  atr: number;
  vwap: number;
  adx: number;
  bollingerBands: { upper: number; middle: number; lower: number };
  momentum: number;
  support: number;
  resistance: number;
  volatilityScore: number;
}

/**
 * Calculates Exponential Moving Average (EMA) for an array of numbers.
 */
export function calculateEMA(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const emaValues: number[] = [];
  
  // Seed with Simple Moving Average of first 'period' elements (or first element if fewer)
  const seedPeriod = Math.min(period, values.length);
  let sum = 0;
  for (let i = 0; i < seedPeriod; i++) {
    sum += values[i];
  }
  let currentEMA = sum / seedPeriod;
  emaValues.push(currentEMA);

  for (let i = seedPeriod; i < values.length; i++) {
    currentEMA = values[i] * k + currentEMA * (1 - k);
    emaValues.push(currentEMA);
  }
  return emaValues;
}

/**
 * Calculates Relative Strength Index (RSI) for period 14.
 */
export function calculateRSI(closes: number[], period = 14): number {
  if (closes.length <= period) return 50.0;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100.0;
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  return Number(rsi.toFixed(2));
}

/**
 * Calculates MACD (12, 26, 9)
 */
export function calculateMACD(closes: number[]): { value: number; signal: number; hist: number } {
  if (closes.length < 26) {
    return { value: 0, signal: 0, hist: 0 };
  }

  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  
  const minLen = Math.min(ema12.length, ema26.length);
  const macdLine: number[] = [];
  for (let i = 0; i < minLen; i++) {
    macdLine.push(ema12[ema12.length - minLen + i] - ema26[ema26.length - minLen + i]);
  }

  const signalLine = calculateEMA(macdLine, 9);
  const latestMacd = macdLine[macdLine.length - 1] || 0;
  const latestSignal = signalLine[signalLine.length - 1] || 0;
  const hist = latestMacd - latestSignal;

  return {
    value: Number(latestMacd.toFixed(5)),
    signal: Number(latestSignal.toFixed(5)),
    hist: Number(hist.toFixed(5)),
  };
}

/**
 * Calculates Average True Range (ATR)
 */
export function calculateATR(candles: Candle[], period = 14): number {
  if (candles.length < 2) return 0.001;

  const trueRanges: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  const sampleTrs = trueRanges.slice(-period);
  const avgTr = sampleTrs.reduce((a, b) => a + b, 0) / sampleTrs.length;
  return Number(avgTr.toFixed(5));
}

/**
 * Calculates Volume Weighted Average Price (VWAP)
 */
export function calculateVWAP(candles: Candle[]): number {
  if (candles.length === 0) return 0;
  let cumTypicalVolume = 0;
  let cumVolume = 0;

  candles.forEach((c) => {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    const vol = c.volume > 0 ? c.volume : 1;
    cumTypicalVolume += typicalPrice * vol;
    cumVolume += vol;
  });

  if (cumVolume === 0) return candles[candles.length - 1].close;
  return Number((cumTypicalVolume / cumVolume).toFixed(5));
}

/**
 * Calculates Bollinger Bands (20, 2)
 */
export function calculateBollingerBands(closes: number[], period = 20, multiplier = 2): { upper: number; middle: number; lower: number } {
  if (closes.length < period) {
    const last = closes[closes.length - 1] || 0;
    return { upper: last * 1.01, middle: last, lower: last * 0.99 };
  }

  const slice = closes.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  return {
    upper: Number((mean + stdDev * multiplier).toFixed(5)),
    middle: Number(mean.toFixed(5)),
    lower: Number((mean - stdDev * multiplier).toFixed(5)),
  };
}

/**
 * Calculates Average Directional Index (ADX 14)
 */
export function calculateADX(candles: Candle[], period = 14): number {
  if (candles.length < period + 1) return 25.0; // Moderate trend default

  let sumDx = 0;
  let count = 0;
  for (let i = 1; i < Math.min(candles.length, period * 2); i++) {
    const upMove = candles[i].high - candles[i - 1].high;
    const downMove = candles[i - 1].low - candles[i].low;

    const plusDm = upMove > downMove && upMove > 0 ? upMove : 0;
    const minusDm = downMove > upMove && downMove > 0 ? downMove : 0;

    const sum = plusDm + minusDm;
    if (sum > 0) {
      const dx = (Math.abs(plusDm - minusDm) / sum) * 100;
      sumDx += dx;
      count++;
    }
  }

  const adx = count > 0 ? sumDx / count : 28.0;
  return Number(adx.toFixed(2));
}

/**
 * Comprehensive indicator calculator from real MT5 candle history.
 */
export function calculateTechnicalIndicators(candles: Candle[]): CalculatedIndicators {
  if (!candles || candles.length === 0) {
    return {
      ema5: 0,
      ema9: 0,
      ema21: 0,
      ema50: 0,
      rsi: 50,
      macd: { value: 0, signal: 0, hist: 0 },
      atr: 0.001,
      vwap: 0,
      adx: 25,
      bollingerBands: { upper: 0, middle: 0, lower: 0 },
      momentum: 0,
      support: 0,
      resistance: 0,
      volatilityScore: 50,
    };
  }

  const closes = candles.map((c) => c.close);
  const ema5Series = calculateEMA(closes, 5);
  const ema9Series = calculateEMA(closes, 9);
  const ema21Series = calculateEMA(closes, 21);
  const ema50Series = calculateEMA(closes, 50);

  const ema5 = Number((ema5Series[ema5Series.length - 1] || closes[closes.length - 1]).toFixed(5));
  const ema9 = Number((ema9Series[ema9Series.length - 1] || closes[closes.length - 1]).toFixed(5));
  const ema21 = Number((ema21Series[ema21Series.length - 1] || closes[closes.length - 1]).toFixed(5));
  const ema50 = Number((ema50Series[ema50Series.length - 1] || closes[closes.length - 1]).toFixed(5));

  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes);
  const atr = calculateATR(candles, 14);
  const vwap = calculateVWAP(candles);
  const bb = calculateBollingerBands(closes, 20, 2);
  const adx = calculateADX(candles, 14);

  // Momentum: 10-period difference
  const momIdx = Math.max(0, closes.length - 10);
  const momentum = Number((closes[closes.length - 1] - closes[momIdx]).toFixed(5));

  // Support / Resistance from recent swing highs/lows
  const recentSlice = candles.slice(-20);
  const support = Math.min(...recentSlice.map((c) => c.low));
  const resistance = Math.max(...recentSlice.map((c) => c.high));

  // Volatility score normalized 0-100 based on ATR / price
  const lastPrice = closes[closes.length - 1] || 1;
  const atrPct = (atr / lastPrice) * 100;
  const volatilityScore = Math.min(100, Math.max(10, Math.round(atrPct * 150)));

  return {
    ema5,
    ema9,
    ema21,
    ema50,
    rsi,
    macd,
    atr,
    vwap,
    adx,
    bollingerBands: bb,
    momentum,
    support,
    resistance,
    volatilityScore,
  };
}
