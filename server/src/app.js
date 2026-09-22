import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import eventRoutes from './routes/event.routes.js';
import organizerRoutes from './routes/organizer.routes.js';
import registrationRoutes from './routes/registration.routes.js';
import userRoutes from './routes/user.routes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

// In development, Vite's dev server bumps to the next free port (5173,
// 5174, 5175...) whenever the previous one is taken, which otherwise means
// re-editing CLIENT_URL every time. Any localhost/127.0.0.1 origin is safe
// to allow here — only the developer's own machine can reach it — so dev
// accepts any local port while production stays locked to the one
// configured origin.
const corsOrigin =
  env.nodeEnv === 'production'
    ? env.clientUrl
    : (origin, callback) => {
        if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      };

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/users', userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
