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
import authRoutes from './routes/auth.js';
import userBotsRoutes from './routes/userBots.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { sanitizeBodyMiddleware } from './middleware/sanitization.js';

const app = express();

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

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
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
app.use(generalLimiter);

// Public & User API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user/bots', userBotsRoutes);
app.use('/api/cluster', clusterRoutes);
app.use('/api/deploy', deployRoutes);
app.use('/api/blueprint', blueprintRoutes);
app.use('/api/contact', contactRoutes);

// Isolated Admin Routes
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OPERATIONAL',
    system: 'SAINT // BOT HOSTING PLATFORM',
    version: '2.0.0',
    port: config.port,
    forbiddenPortsGuarded: [8080, 8081, 8082, 8083, 8084],
    timestamp: new Date().toISOString(),
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: '[NOT_FOUND]',
    path: req.originalUrl,
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[SERVER_ERROR]', err);
  res.status(500).json({
    success: false,
    error: '[INTERNAL_ERROR]',
    message: config.nodeEnv === 'production' ? 'An unexpected error occurred.' : err.message,
  });
});

app.listen(config.port, () => {
  console.log(`
\x1b[31m====================================================================\x1b[0m
\x1b[1m\x1b[31m  SAINT // BOT HOSTING & CREATION API ONLINE\x1b[0m
\x1b[31m====================================================================\x1b[0m
  \x1b[37mAPI Port:\x1b[0m                \x1b[32mhttp://localhost:${config.port}\x1b[0m
  \x1b[37mDatabase Store:\x1b[0m          \x1b[36mserver/data/store.json (PBKDF2 Hashed)\x1b[0m
  \x1b[37mUser Authentication:\x1b[0m     \x1b[33mDiscord OAuth + Secure Email/Password\x1b[0m
  \x1b[37mPort Restrictions:\x1b[0m       \x1b[31m[8080-8084] STRICTLY RESERVED\x1b[0m
\x1b[31m====================================================================\x1b[0m
`);
});

export default app;
