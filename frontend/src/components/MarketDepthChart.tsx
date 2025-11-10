import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import axios from 'axios';
import { API_BASE } from '../config/api';

interface MarketDepthChartProps {
  tokenId: string;
  chain?: string;
}

interface Order {
  price: number;
  amount: number;
  total: number;
}

interface MarketDepthData {
  chain: string;
  currentPrice: number;
  currentSupply: number;
  basePrice: number;
  slope: number;
  buyOrders: Order[];
  sellOrders: Order[];
}

export default function MarketDepthChart({ tokenId, chain }: MarketDepthChartProps) {
  const { data: marketDepthData, isLoading } = useQuery({
    queryKey: ['market-depth', tokenId, chain],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (chain) params.append('chain', chain);
        
        const response = await axios.get(`${API_BASE}/tokens/${tokenId}/market-depth?${params}`);
        return response.data.marketDepth as MarketDepthData | MarketDepthData[];
      } catch (error) {
        console.error('Error fetching market depth:', error);
        return null;
      }
    },
    enabled: !!tokenId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const depth = Array.isArray(marketDepthData) ? marketDepthData[0] : marketDepthData;

  const chartData = useMemo(() => {
    if (!depth) return null;

    const { buyOrders, sellOrders, currentPrice } = depth;
    
    // Filter out invalid orders (NaN, null, undefined, <= 0)
    const isValidOrder = (o: Order) => {
      const price = typeof o.price === 'number' ? o.price : parseFloat(o.price);
      const amount = typeof o.amount === 'number' ? o.amount : parseFloat(o.amount);
      return !isNaN(price) && isFinite(price) && price > 0 && 
             !isNaN(amount) && isFinite(amount) && amount > 0;
    };
    
    const validBuyOrders = (buyOrders || []).filter(isValidOrder).map(o => ({
      price: parseFloat(o.price) || 0,
      amount: parseFloat(o.amount) || 0,
      total: parseFloat(o.total) || 0,
    }));
    
    const validSellOrders = (sellOrders || []).filter(isValidOrder).map(o => ({
      price: parseFloat(o.price) || 0,
      amount: parseFloat(o.amount) || 0,
      total: parseFloat(o.total) || 0,
    }));
    
    // Combine and sort all orders by price
    const allOrders = [
      ...validBuyOrders.map(o => ({ ...o, type: 'buy' as const })),
      ...validSellOrders.map(o => ({ ...o, type: 'sell' as const })),
    ].sort((a, b) => a.price - b.price);
    
    if (allOrders.length === 0) return null;

    // Calculate cumulative volumes
    let buyCumulative = 0;
    let sellCumulative = 0;

    const buyCumulativeData = validBuyOrders.map(order => {
      buyCumulative += order.amount;
      return {
        price: order.price,
        cumulative: buyCumulative,
        amount: order.amount,
      };
    }).reverse(); // Reverse to show from current price down

    const sellCumulativeData = validSellOrders.map(order => {
      sellCumulative += order.amount;
      return {
        price: order.price,
        cumulative: sellCumulative,
        amount: order.amount,
      };
    });

    const validPrices = allOrders.map(o => o.price).filter(p => !isNaN(p) && isFinite(p) && p > 0);
    if (validPrices.length === 0) return null;
    
    const minPrice = Math.min(...validPrices);
    const maxPrice = Math.max(...validPrices);
    const priceRange = (maxPrice - minPrice) || 1;
    
    const allCumulatives = [
      ...buyCumulativeData.map(d => d.cumulative),
      ...sellCumulativeData.map(d => d.cumulative)
    ].filter(c => !isNaN(c) && isFinite(c) && c >= 0);
    
    const maxCumulative = allCumulatives.length > 0 ? Math.max(...allCumulatives) : 1;
    const safeCurrentPrice = (typeof currentPrice === 'number' && !isNaN(currentPrice) && isFinite(currentPrice) && currentPrice > 0)
      ? currentPrice
      : (minPrice + maxPrice) / 2;

    return {
      buyCumulativeData,
      sellCumulativeData,
      currentPrice: safeCurrentPrice,
      minPrice,
      maxPrice,
      priceRange,
      maxCumulative,
    };
  }, [depth]);

  if (isLoading || !chartData || !depth) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">
            {isLoading ? 'Loading market depth...' : 'No market depth data available'}
          </div>
        </div>
      </div>
    );
  }

  const chartHeight = 400;
  const chartWidth = 800;
  const padding = 60;
  const plotWidth = chartWidth - padding * 2;
  const plotHeight = chartHeight - padding * 2;

  // Scale functions - validate inputs to prevent NaN
  const scalePrice = (price: number) => {
    if (isNaN(price) || !isFinite(price)) return padding + plotWidth / 2;
    const normalizedPrice = Math.max(chartData.minPrice, Math.min(chartData.maxPrice, price));
    const xValue = padding + ((normalizedPrice - chartData.minPrice) / chartData.priceRange) * plotWidth;
    return isNaN(xValue) || !isFinite(xValue) ? padding + plotWidth / 2 : xValue;
  };

  const scaleVolume = (volume: number) => {
    if (isNaN(volume) || !isFinite(volume) || volume < 0) return padding + plotHeight;
    const normalizedVolume = Math.min(volume, chartData.maxCumulative);
    const yValue = padding + plotHeight - (normalizedVolume / chartData.maxCumulative) * plotHeight;
    return isNaN(yValue) || !isFinite(yValue) ? padding + plotHeight : Math.max(padding, Math.min(padding + plotHeight, yValue));
  };

  const currentPriceX = scalePrice(chartData.currentPrice);

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Market Depth</h3>
          <p className="text-sm text-gray-400">Bonding curve order book visualization</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Current Price</p>
          <p className="text-lg font-bold text-primary-400">${chartData.currentPrice.toFixed(6)}</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500/50 rounded"></div>
          <span className="text-sm text-gray-400">Buy Orders</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500/50 rounded"></div>
          <span className="text-sm text-gray-400">Sell Orders</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-primary-400"></div>
          <span className="text-sm text-gray-400">Current Price</span>
        </div>
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
              <line
                key={ratio}
                x1={padding}
                y1={y}
                x2={padding + plotWidth}
                y2={y}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
              />
            );
          })}

          {/* Buy orders area (green) */}
          {chartData.buyCumulativeData.length > 0 && (() => {
            const buyPoints = chartData.buyCumulativeData
              .map((point) => {
                const x = scalePrice(point.price);
                const y = scaleVolume(point.cumulative);
                // Validate coordinates
                if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) return null;
                return { x, y };
              })
              .filter((p): p is { x: number; y: number } => p !== null);
            
            if (buyPoints.length === 0) return null;
            
            const buyPath = buyPoints.map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            const minPriceX = scalePrice(chartData.minPrice);
            const bottomY = padding + plotHeight;
            const buyAreaPath = `${buyPath} L ${minPriceX} ${bottomY} L ${minPriceX} ${bottomY} Z`;
            
            return (
              <path
                d={buyAreaPath}
                fill="rgba(16, 185, 129, 0.2)"
                stroke="rgba(16, 185, 129, 0.5)"
                strokeWidth="1"
              />
            );
          })()}

          {/* Sell orders area (red) */}
          {chartData.sellCumulativeData.length > 0 && (() => {
            const sellPoints = chartData.sellCumulativeData
              .map((point) => {
                const x = scalePrice(point.price);
                const y = scaleVolume(point.cumulative);
                // Validate coordinates
                if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) return null;
                return { x, y };
              })
              .filter((p): p is { x: number; y: number } => p !== null);
            
            if (sellPoints.length === 0) return null;
            
            const sellPath = sellPoints.map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            const maxPriceX = scalePrice(chartData.maxPrice);
            const bottomY = padding + plotHeight;
            const sellAreaPath = `${sellPath} L ${maxPriceX} ${bottomY} L ${maxPriceX} ${bottomY} Z`;
            
            return (
              <path
                d={sellAreaPath}
                fill="rgba(239, 68, 68, 0.2)"
                stroke="rgba(239, 68, 68, 0.5)"
                strokeWidth="1"
              />
            );
          })()}

          {/* Current price line */}
          {!isNaN(currentPriceX) && isFinite(currentPriceX) && (
            <line
              x1={currentPriceX}
              y1={padding}
              x2={currentPriceX}
              y2={padding + plotHeight}
              stroke="#3B82F6"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          )}

          {/* Price labels */}
          <text
            x={padding}
            y={padding + plotHeight + 20}
            fill="rgba(255,255,255,0.6)"
            fontSize="10"
            textAnchor="start"
          >
            ${chartData.minPrice.toFixed(6)}
          </text>
          <text
            x={padding + plotWidth}
            y={padding + plotHeight + 20}
            fill="rgba(255,255,255,0.6)"
            fontSize="10"
            textAnchor="end"
          >
            ${chartData.maxPrice.toFixed(6)}
          </text>
          <text
            x={currentPriceX}
            y={padding + plotHeight + 35}
            fill="#3B82F6"
            fontSize="10"
            textAnchor="middle"
            fontWeight="bold"
          >
            ${chartData.currentPrice.toFixed(6)}
          </text>

          {/* Volume labels */}
          <text
            x={padding - 10}
            y={padding}
            fill="rgba(255,255,255,0.6)"
            fontSize="10"
            textAnchor="end"
          >
            {chartData.maxCumulative.toFixed(2)}
          </text>
          <text
            x={padding - 10}
            y={padding + plotHeight}
            fill="rgba(255,255,255,0.6)"
            fontSize="10"
            textAnchor="end"
          >
            0
          </text>
        </svg>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-700">
        <div>
          <p className="text-xs text-gray-400 mb-1">Best Buy Price</p>
          <p className="text-sm font-semibold text-green-400">
            ${chartData.buyCumulativeData[0]?.price.toFixed(6) || 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Best Sell Price</p>
          <p className="text-sm font-semibold text-red-400">
            ${chartData.sellCumulativeData[0]?.price.toFixed(6) || 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Spread</p>
          <p className="text-sm font-semibold text-white">
            {chartData.buyCumulativeData[0] && chartData.sellCumulativeData[0]
              ? `${((chartData.sellCumulativeData[0].price - chartData.buyCumulativeData[0].price) / chartData.currentPrice * 100).toFixed(2)}%`
              : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}

