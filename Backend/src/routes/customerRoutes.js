import { Router } from 'express';
import * as customerController from '../controllers/customerController.js';

const router = Router();

// 🛣️ Customer Routes
router.get('/', customerController.getAllCustomers);
router.post('/', customerController.addCustomer);
router.get('/:id/orders', customerController.getCustomerOrders);

export default router;
