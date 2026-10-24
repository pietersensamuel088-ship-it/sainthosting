import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { config } from './config.js';
import clusterRoutes from './routes/cluster.js';
import deployRoutes from './routes/deploy.js';
import blueprintRoutes from './routes/blueprint.js';
import contactRoutes from './routes/contact.js';
import adminRoutes from './routes/admin.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { sanitizeBodyMiddleware } from './middleware/sanitization.js';

const app = express();

// HARDENED SECURITY HEADERS
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", `http://localhost:${config.clientPort}`, `http://localhost:${config.port}`, config.baseUrl, config.apiBaseUrl],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS with credentials for HTTP-only cookies
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      // In development allow any localhost
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
      if (origin.endsWith('.sa1nt.xyz') || origin === 'https://sa1nt.xyz') {
        return callback(null, true);
      }
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(sanitizeBodyMiddleware);

// Base rate limiter
app.use(generalLimiter);

// API Routes
app.use('/api/cluster', clusterRoutes);
app.use('/api/deploy', deployRoutes);
app.use('/api/blueprint', blueprintRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);

// Root Health & System Manifest
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OPERATIONAL',
    system: 'SAINT // COLD STEEL HOSTING ENGINE',
    version: '1.0.0',
    primaryNode: 'pve-saint-01',
    domain: config.baseUrl,
    port: config.port,
    forbiddenPortsGuarded: [8080, 8081, 8082, 8083, 8084],
    timestamp: new Date().toISOString(),
  });
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: '[RESOURCE_NOT_FOUND]',
    path: req.originalUrl,
    message: 'Cold steel endpoint does not exist on this cluster node.',
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[CLUSTER_ERROR]', err);
  res.status(500).json({
    success: false,
    error: '[INTERNAL_NODE_FAULT]',
    message: config.nodeEnv === 'production' ? 'An unexpected orchestration failure occurred.' : err.message,
  });
});

// Start Server
const server = app.listen(config.port, () => {
  console.log(`
\x1b[31m====================================================================\x1b[0m
\x1b[1m\x1b[31m  SAINT // COLD STEEL ORCHESTRATION BACKEND ONLINE\x1b[0m
\x1b[31m====================================================================\x1b[0m
  \x1b[37mBackend Node Port:\x1b[0m       \x1b[32mhttp://localhost:${config.port}\x1b[0m
  \x1b[37mForbidden Port Range:\x1b[0m    \x1b[31m[8080, 8081, 8082, 8083, 8084] STRICTLY BLOCKED\x1b[0m
  \x1b[37mSubdomain Base:\x1b[0m          \x1b[36m${config.baseUrl}\x1b[0m
  \x1b[37mAdmin User:\x1b[0m              \x1b[33m${config.adminEmail}\x1b[0m
  \x1b[37mSecurity Protocol:\x1b[0m       \x1b[35mJWT HTTP-only Cookies + 5 req/min Token Bucket\x1b[0m
\x1b[31m====================================================================\x1b[0m
`);
});

export default app;
