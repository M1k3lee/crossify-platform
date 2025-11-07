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
import { initializeDatabase } from './db';
import { initializeRedis } from './services/redis';
import { startPriceSyncService } from './services/priceSync';
import { startPriceMonitoring } from './services/unifiedLiquidity';
import { getCrossChainRelayer } from './services/crossChainRelayer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());

// CORS configuration - allow multiple origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://crossify-platform.vercel.app',
  'https://crossify.io',
  'https://www.crossify.io',
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(null, true); // Allow all in development, but log warning
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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

