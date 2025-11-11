import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config/api';

interface ChartDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TokenChartProps {
  tokenId: string;
  chain?: string;
}

export default function TokenChart({ tokenId, chain }: TokenChartProps) {
  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d' | '30d' | 'all'>('24h');
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');

  // Fetch price history from API
  const { data: priceHistoryData, isLoading } = useQuery({
    queryKey: ['price-history', tokenId, chain, timeframe],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({ timeframe });
        if (chain) params.append('chain', chain);
        
        const response = await axios.get(`${API_BASE}/tokens/${tokenId}/price-history?${params}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching price history:', error);
        // Return empty data on error
        return { data: [], timeframe, interval: 3600000 };
      }
    },
    enabled: !!tokenId,
    refetchInterval: timeframe === '1h' ? 60000 : 300000, // Refresh every 1min for 1h, 5min for others
  });

  const priceHistory: ChartDataPoint[] = priceHistoryData?.data || [];

  const chartData = useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) return null;
    
    // Filter out invalid data points and validate all values
    const validData = priceHistory.filter(p => {
      const isValid = (val: any) => {
        if (val === null || val === undefined) return false;
        const num = typeof val === 'number' ? val : parseFloat(val);
        return !isNaN(num) && isFinite(num) && num > 0;
      };
      return isValid(p.open) && isValid(p.high) && isValid(p.low) && isValid(p.close) && isValid(p.volume);
    });
    
    if (validData.length === 0) return null;
    
    return {
      prices: validData.map(p => typeof p.close === 'number' ? p.close : parseFloat(String(p.close)) || 0),
      opens: validData.map(p => typeof p.open === 'number' ? p.open : parseFloat(String(p.open)) || 0),
      highs: validData.map(p => typeof p.high === 'number' ? p.high : parseFloat(String(p.high)) || 0),
      lows: validData.map(p => typeof p.low === 'number' ? p.low : parseFloat(String(p.low)) || 0),
      closes: validData.map(p => typeof p.close === 'number' ? p.close : parseFloat(String(p.close)) || 0),
      volumes: validData.map(p => typeof p.volume === 'number' ? p.volume : parseFloat(String(p.volume)) || 0),
      times: validData.map(p => typeof p.time === 'number' ? p.time : parseFloat(String(p.time)) || 0),
    };
  }, [priceHistory]);

  if (isLoading || !chartData || priceHistory.length === 0) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">
            {isLoading ? 'Loading chart data...' : 'No price data available yet'}
          </div>
        </div>
      </div>
    );
  }

  const currentPrice = priceHistory[priceHistory.length - 1]?.close || 0;
  const previousPrice = priceHistory[0]?.open || currentPrice;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;
  const totalVolume = priceHistory.reduce((sum, p) => sum + p.volume, 0);

  // Calculate chart dimensions
  const chartHeight = 300;
  const chartWidth = 800;
  const padding = 40;
  const plotWidth = chartWidth - padding * 2;
  const plotHeight = chartHeight - padding * 2;

  // Scale data - validate and handle edge cases
  const allPrices = [...chartData.highs, ...chartData.lows].filter(p => !isNaN(p) && isFinite(p) && p > 0);
  if (allPrices.length === 0) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">No valid price data available</div>
        </div>
      </div>
    );
  }
  
  const maxPrice = Math.max(...allPrices);
  const minPrice = Math.min(...allPrices);
  const priceRange = (maxPrice - minPrice) || 1;
  const validVolumes = chartData.volumes.filter(v => !isNaN(v) && isFinite(v) && v >= 0);
  const maxVolume = validVolumes.length > 0 ? Math.max(...validVolumes) : 0;

  // Generate path for line chart - validate calculations
  const linePoints = chartData.prices.map((price, index) => {
    const normalizedPrice = Math.max(minPrice, Math.min(maxPrice, price)); // Clamp to valid range
    const x = chartData.prices.length > 1 
      ? padding + (index / (chartData.prices.length - 1)) * plotWidth
      : padding + plotWidth / 2;
    const yValue = ((normalizedPrice - minPrice) / priceRange) * plotHeight;
    const y = padding + plotHeight - (isNaN(yValue) ? plotHeight / 2 : Math.max(0, Math.min(plotHeight, yValue)));
    return { x, y: isNaN(y) ? padding + plotHeight / 2 : y, price: normalizedPrice };
  });

  const pathData = linePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Generate area fill path
  const areaPath = `${pathData} L ${linePoints[linePoints.length - 1].x} ${padding + plotHeight} L ${linePoints[0].x} ${padding + plotHeight} Z`;

  // Generate candlestick data - validate calculations
  const candlesticks = chartData.prices.map((close, index) => {
    const safeClose = Math.max(minPrice, Math.min(maxPrice, close));
    const safeOpen = Math.max(minPrice, Math.min(maxPrice, chartData.opens[index]));
    const safeHigh = Math.max(minPrice, Math.min(maxPrice, chartData.highs[index]));
    const safeLow = Math.max(minPrice, Math.min(maxPrice, chartData.lows[index]));
    
    const x = chartData.prices.length > 1 
      ? padding + (index / (chartData.prices.length - 1)) * plotWidth
      : padding + plotWidth / 2;
    
    const calcY = (price: number) => {
      const yValue = ((price - minPrice) / priceRange) * plotHeight;
      const y = padding + plotHeight - (isNaN(yValue) ? plotHeight / 2 : Math.max(0, Math.min(plotHeight, yValue)));
      return isNaN(y) ? padding + plotHeight / 2 : y;
    };
    
    return {
      x: isNaN(x) ? padding + plotWidth / 2 : x,
      openY: calcY(safeOpen),
      closeY: calcY(safeClose),
      highY: calcY(safeHigh),
      lowY: calcY(safeLow),
      open: safeOpen,
      close: safeClose,
      high: safeHigh,
      low: safeLow,
      isUp: safeClose >= safeOpen,
    };
  });

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Price Chart</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">${currentPrice.toFixed(6)}</span>
              <span className={`text-sm font-semibold flex items-center gap-1 ${
                priceChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
              </span>
            </div>
            <div className="text-sm text-gray-400">
              Vol: ${(totalVolume / 1000).toFixed(1)}K
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-700/50 rounded-lg p-1">
            {(['line', 'candlestick'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                  chartType === type
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {type === 'line' ? 'Line' : 'Candles'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex items-center gap-2 mb-4">
        {(['1h', '24h', '7d', '30d', 'all'] as const).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              timeframe === tf
                ? 'bg-primary-500 text-white'
                : 'bg-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {tf === '1h' ? '1H' : tf === '24h' ? '24H' : tf === '7d' ? '7D' : tf === '30d' ? '30D' : 'All'}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="relative">
        <svg
          width="100%"
          height={chartHeight}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="overflow-visible"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding + plotHeight - (ratio * plotHeight);
            return (
              <g key={ratio}>
                <line
                  x1={padding}
                  y1={y}
                  x2={padding + plotWidth}
                  y2={y}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="rgba(255,255,255,0.4)"
                  fontSize="10"
                >
                  ${(minPrice + (1 - ratio) * priceRange).toFixed(6)}
                </text>
              </g>
            );
          })}

          {/* Volume bars (background) */}
          {chartData.volumes.map((volume, index) => {
            // Prevent division by zero and NaN values
            const volumesLength = chartData.volumes.length;
            if (volumesLength === 0 || maxVolume === 0) return null;
            
            const x = volumesLength > 1 
              ? padding + (index / (volumesLength - 1)) * plotWidth
              : padding + plotWidth / 2;
            const barWidth = plotWidth / Math.max(volumesLength, 1);
            const normalizedVolume = Math.max(0, Math.min(volume, maxVolume));
            const barHeight = maxVolume > 0 ? (normalizedVolume / maxVolume) * plotHeight * 0.3 : 0;
            
            // Validate all values before rendering
            if (isNaN(x) || isNaN(barWidth) || isNaN(barHeight) || !isFinite(x) || !isFinite(barWidth) || !isFinite(barHeight)) {
              return null;
            }
            
            return (
              <rect
                key={index}
                x={x - barWidth / 2}
                y={padding + plotHeight - barHeight}
                width={barWidth}
                height={barHeight}
                fill="rgba(59, 130, 246, 0.1)"
              />
            );
          })}

          {chartType === 'line' ? (
            <>
              {/* Area fill */}
              <path
                d={areaPath}
                fill="url(#gradient)"
                opacity="0.3"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={priceChange >= 0 ? '#10B981' : '#EF4444'} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={priceChange >= 0 ? '#10B981' : '#EF4444'} stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Price line */}
              <path
                d={pathData}
                fill="none"
                stroke={priceChange >= 0 ? '#10B981' : '#EF4444'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {linePoints.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r="3"
                  fill={priceChange >= 0 ? '#10B981' : '#EF4444'}
                  className="opacity-0 hover:opacity-100 transition-opacity"
                />
              ))}
            </>
          ) : (
            <>
              {/* Candlesticks */}
              {candlesticks.map((candle, index) => {
                const bodyTop = Math.min(candle.openY, candle.closeY);
                const bodyBottom = Math.max(candle.openY, candle.closeY);
                const bodyHeight = bodyBottom - bodyTop || 1;
                const barWidth = plotWidth / candlesticks.length * 0.6;
                
                return (
                  <g key={index}>
                    {/* Wick */}
                    <line
                      x1={candle.x}
                      y1={candle.highY}
                      x2={candle.x}
                      y2={candle.lowY}
                      stroke={candle.isUp ? '#10B981' : '#EF4444'}
                      strokeWidth="1"
                    />
                    {/* Body */}
                    <rect
                      x={candle.x - barWidth / 2}
                      y={bodyTop}
                      width={barWidth}
                      height={bodyHeight}
                      fill={candle.isUp ? '#10B981' : '#EF4444'}
                      stroke={candle.isUp ? '#10B981' : '#EF4444'}
                      strokeWidth="0.5"
                    />
                  </g>
                );
              })}
            </>
          )}
        </svg>
      </div>

      {/* Chart Info */}
      <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-700">
        <div>
          <p className="text-xs text-gray-400 mb-1">24h High</p>
          <p className="text-sm font-semibold text-white">${maxPrice.toFixed(6)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">24h Low</p>
          <p className="text-sm font-semibold text-white">${minPrice.toFixed(6)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">24h Volume</p>
          <p className="text-sm font-semibold text-white">${(totalVolume / 1000).toFixed(1)}K</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Price Change</p>
          <p className={`text-sm font-semibold ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(6)}
          </p>
        </div>
      </div>
    </div>
  );
}
