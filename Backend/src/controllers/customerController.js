import { customerService } from '../services/customerService.ts';

/**
 * Controller for Customer Management
 */
export const getAllCustomers = async (req, res, next) => {
  try {
    const data = await customerService.getAllCustomers();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const addCustomer = async (req, res, next) => {
  try {
    const data = await customerService.addCustomer(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getCustomerOrders = async (req, res, next) => {
  try {
    const data = await customerService.getCustomerOrders(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
