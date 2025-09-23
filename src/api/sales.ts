import { Request, Response } from 'express';
import { saleService } from '../services/database';

// POST /api/sales - Create a complete sale with multiple services and products
export const createSale = async (req: Request, res: Response) => {
  try {
    const {
      clientId,
      services,
      staffId,
      paymentMethod,
      notes
    } = req.body;

    // Validate required fields
    if (!clientId || !services || !Array.isArray(services) || services.length === 0 || !staffId || !paymentMethod) {
      return res.status(400).json({
        error: 'Missing required fields: clientId, services, staffId, paymentMethod'
      });
    }

    // Validate services structure
    for (const service of services) {
      if (!service.serviceId || !service.products || !Array.isArray(service.products)) {
        return res.status(400).json({
          error: 'Each service must have serviceId and products array'
        });
      }

      for (const product of service.products) {
        if (!product.productId || typeof product.quantity !== 'number' || !product.unit) {
          return res.status(400).json({
            error: 'Each product must have productId, quantity (number), and unit'
          });
        }
      }
    }

    // Validate payment method
    if (!['cash', 'card', 'transfer'].includes(paymentMethod)) {
      return res.status(400).json({
        error: 'Payment method must be one of: cash, card, transfer'
      });
    }

    console.log('🛒 Creating sale with data:', {
      clientId,
      servicesCount: services.length,
      staffId,
      paymentMethod
    });

    const result = await saleService.createCompleteSale({
      clientId,
      services,
      staffId,
      paymentMethod,
      notes
    });

    if (!result) {
      return res.status(500).json({
        error: 'Failed to create sale'
      });
    }

    res.status(201).json({
      success: true,
      data: {
        sale: result.sale,
        receipt: result.receipt,
        commission: result.commission
      }
    });

  } catch (error: any) {
    console.error('❌ Error creating sale:', error);
    
    // Handle specific error types
    if (error.message.includes('Insufficient stock')) {
      return res.status(400).json({
        error: error.message,
        type: 'INSUFFICIENT_STOCK'
      });
    }

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: error.message,
        type: 'NOT_FOUND'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

// GET /api/sales/:id - Get detailed sale information
export const getSaleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Sale ID is required'
      });
    }

    console.log('📋 Fetching sale details for ID:', id);

    const result = await saleService.getById(id);

    if (!result) {
      return res.status(404).json({
        error: 'Sale not found'
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('❌ Error fetching sale:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

// GET /api/sales - Get all sales with optional filters
export const getSales = async (req: Request, res: Response) => {
  try {
    const { staffId, clientId, startDate, endDate, limit = 50 } = req.query;

    console.log('📋 Fetching sales with filters:', {
      staffId,
      clientId,
      startDate,
      endDate,
      limit
    });

    // For now, we'll use the existing getByStaffId method
    // In a full implementation, you'd add more filtering options
    if (staffId) {
      const sales = await saleService.getByStaffId(staffId as string);
      return res.json({
        success: true,
        data: sales.slice(0, parseInt(limit as string))
      });
    }

    // If no specific filters, return empty array or implement getAll method
    res.json({
      success: true,
      data: []
    });

  } catch (error: any) {
    console.error('❌ Error fetching sales:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};