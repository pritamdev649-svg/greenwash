import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';

const app = express();

// 🔧 Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// 🛣️ Routes
app.use('/api', routes);

// 🔍 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'API Route not found' });
});

// 🔐 Error handling
app.use(errorMiddleware);

export default app;
