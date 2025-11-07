// Redis service for caching (optional - app works without it)
let redisClient: any = null;

export async function initializeRedis(): Promise<void> {
  try {
    // Try to import redis - it's optional
    const redis = await import('redis');
    
    if (process.env.REDIS_URL) {
      redisClient = redis.createClient({
        url: process.env.REDIS_URL,
      });
      
      redisClient.on('error', (err: Error) => {
        console.error('Redis Client Error:', err);
      });
      
      await redisClient.connect();
      console.log('✅ Redis connected');
    } else {
      console.log('ℹ️  Redis URL not configured - caching disabled');
    }
  } catch (error) {
    // Redis is optional - don't throw, just log
    console.warn('⚠️  Redis not available (optional):', error instanceof Error ? error.message : error);
    redisClient = null;
  }
}

export function getRedisClient() {
  return redisClient;
}

export async function cachePrice(tokenId: string, chain: string, price: number): Promise<void> {
  if (!redisClient) return;
  
  try {
    const key = `price:${tokenId}:${chain}`;
    await redisClient.setEx(key, 300, JSON.stringify({ price, timestamp: Date.now() })); // 5 min TTL
  } catch (error) {
    console.error('Error caching price:', error);
  }
}

export async function getAllPrices(tokenId: string): Promise<Record<string, number>> {
  if (!redisClient) return {};
  
  try {
    const keys = await redisClient.keys(`price:${tokenId}:*`);
    const prices: Record<string, number> = {};
    
    for (const key of keys) {
      const data = await redisClient.get(key);
      if (data) {
        const parsed = JSON.parse(data);
        const chain = key.split(':')[2];
        prices[chain] = parsed.price;
      }
    }
    
    return prices;
  } catch (error) {
    console.error('Error getting cached prices:', error);
    return {};
  }
}





