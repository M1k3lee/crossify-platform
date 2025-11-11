import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { router as tokensRouter } from './routes/tokens';
import { router as poolsRouter } from './routes/pools';
import { router as transactionsRouter } from './routes/transactions';
import { router as uploadRouter } from './routes/upload';
import { router as contactRouter } from './routes/contact';
import { router as crosschainRouter } from './routes/crosschain';
import { router as adminRouter } from './routes/admin';
import { router as debugRouter } from './routes/debug';
import { router as healthCheckRouter } from './routes/health-check';
import { router as presaleRouter } from './routes/presale';
import { router as cfyRouter } from './routes/cfy';
import { initializeDatabase } from './db/adapter';
import { initializeRedis } from './services/redis';
import { startPriceSyncService } from './services/priceSync';
import { startPriceMonitoring } from './services/unifiedLiquidity';
import { getCrossChainRelayer } from './services/crossChainRelayer';
import { startStartupSync } from './services/startupSync';
import { startHolderCountService } from './services/holderCount';
import { startLiquidityMonitoringService } from './services/liquidityBridge';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy - REQUIRED for Railway and other cloud platforms
// This allows Express to correctly identify client IPs when behind a proxy
// Set to 1 to trust only the first proxy (Railway's proxy)
app.set('trust proxy', 1);

// Middleware
// Configure Helmet to allow cross-origin image loading
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration - allow multiple origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://crossify-platform.vercel.app',
  'https://crossify.io',
  'https://www.crossify.io',
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
];

// Vercel preview deployments pattern
const isVercelPreview = (origin: string): boolean => {
  return /^https:\/\/.*\.vercel\.app$/.test(origin);
};

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check exact match
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Allow all Vercel preview deployments
    if (isVercelPreview(origin)) {
      console.log(`✅ Allowing Vercel preview: ${origin}`);
      return callback(null, true);
    }
    
    // Allow in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Log warning but allow (for now - you can change this to reject in production)
    console.warn(`⚠️ CORS: Unknown origin: ${origin}`);
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-creator-address'],
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Routes
app.use('/api/tokens', tokensRouter);
app.use('/api/pools', poolsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/contact', contactRouter);
app.use('/api/crosschain', crosschainRouter);
app.use('/api/admin', adminRouter);
app.use('/api/debug', debugRouter);
app.use('/api/presale', presaleRouter);
app.use('/api/cfy', cfyRouter);
app.use('/api', healthCheckRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'crossify-backend', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Initialize services
async function start() {
  try {
    // Initialize database
    await initializeDatabase();
    console.log('✅ Database initialized');

    // Initialize Redis (optional - won't crash if Redis is unavailable)
    try {
      await initializeRedis();
      console.log('✅ Redis initialized');
    } catch (error) {
      console.warn('⚠️  Redis not available (optional):', error instanceof Error ? error.message : error);
      console.log('ℹ️  Continuing without Redis - price caching will be disabled');
    }

    // Start price sync service
    startPriceSyncService();
    console.log('✅ Price sync service started');

    // Start unified liquidity pool monitoring
    startPriceMonitoring(5 * 60 * 1000); // Check every 5 minutes
    console.log('✅ Unified liquidity pool monitoring started');

    // Start cross-chain relayer service (for fee conversion)
    getCrossChainRelayer();
    console.log('✅ Cross-chain relayer service started');

    // Start startup sync (syncs all tokens from blockchain on startup)
    startStartupSync();
    console.log('✅ Startup sync service started (will sync tokens from blockchain)');

    // Start holder count service
    startHolderCountService();
    console.log('✅ Holder count service started');

    // Start liquidity monitoring service (cross-chain bridge)
    startLiquidityMonitoringService();
    console.log('✅ Liquidity monitoring service started');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

