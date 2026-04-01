import { Router } from 'express';
import authRoutes from './authRoutes.js';
import customerRoutes from './customerRoutes.js';
import orderRoutes from './orderRoutes.js';
import branchRoutes from './branchRoutes.js';

const router = Router();

// 🛣️ Combine Routes
router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/orders', orderRoutes);
router.use('/branches', branchRoutes);

export default router;
