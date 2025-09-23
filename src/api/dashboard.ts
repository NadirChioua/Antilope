import { Request, Response } from 'express';
import { productService, stockHistoryService } from '../services/database';

// GET /api/dashboard/products - Get products with stock info and alerts
export const getProductsDashboard = async (req: Request, res: Response) => {
  try {
    console.log('📊 Fetching products dashboard data...');
    
    // Get all products with stock information
    const products = await productService.getAll();
    
    // Calculate stock alerts and statistics
    const dashboardData = {
      products: products.map(product => {
        const totalQuantity = product.totalQuantity || product.quantity || 0;
        const minThreshold = product.minThreshold || product.minQuantity || 0;
        const isLowStock = totalQuantity <= minThreshold;
        const isOutOfStock = totalQuantity === 0;
        
        return {
          ...product,
          stockStatus: {
            isLowStock,
            isOutOfStock,
            stockLevel: totalQuantity,
            threshold: minThreshold,
            alertLevel: isOutOfStock ? 'critical' : isLowStock ? 'warning' : 'normal'
          }
        };
      }),
      summary: {
        totalProducts: products.length,
        lowStockCount: 0,
        outOfStockCount: 0,
        activeProducts: 0,
        archivedProducts: 0
      }
    };
    
    // Calculate summary statistics
    dashboardData.products.forEach(product => {
      if (product.stockStatus.isOutOfStock) {
        dashboardData.summary.outOfStockCount++;
      } else if (product.stockStatus.isLowStock) {
        dashboardData.summary.lowStockCount++;
      }
      
      if (product.archived) {
        dashboardData.summary.archivedProducts++;
      } else {
        dashboardData.summary.activeProducts++;
      }
    });
    
    console.log('✅ Dashboard data calculated:', {
      totalProducts: dashboardData.summary.totalProducts,
      lowStock: dashboardData.summary.lowStockCount,
      outOfStock: dashboardData.summary.outOfStockCount
    });
    
    res.json(dashboardData);
  } catch (error) {
    console.error('❌ Error fetching dashboard data:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// GET /api/dashboard/stock-alerts - Get only products with stock alerts
export const getStockAlerts = async (req: Request, res: Response) => {
  try {
    console.log('🚨 Fetching stock alerts...');
    
    const products = await productService.getAll();
    
    const alerts = products
      .filter(product => !product.archived) // Only active products
      .map(product => {
        const totalQuantity = product.totalQuantity || product.quantity || 0;
        const minThreshold = product.minThreshold || product.minQuantity || 0;
        const isLowStock = totalQuantity <= minThreshold;
        const isOutOfStock = totalQuantity === 0;
        
        return {
          productId: product.id,
          name: product.name,
          category: product.category,
          currentStock: totalQuantity,
          threshold: minThreshold,
          alertType: isOutOfStock ? 'out_of_stock' : isLowStock ? 'low_stock' : null,
          severity: isOutOfStock ? 'critical' : 'warning'
        };
      })
      .filter(alert => alert.alertType !== null); // Only products with alerts
    
    console.log(`✅ Found ${alerts.length} stock alerts`);
    
    res.json({
      alerts,
      summary: {
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
        warningAlerts: alerts.filter(a => a.severity === 'warning').length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching stock alerts:', error);
    res.status(500).json({
      error: 'Failed to fetch stock alerts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// GET /api/dashboard/recent-movements - Get recent stock movements
export const getRecentMovements = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    console.log(`📈 Fetching ${limit} recent stock movements...`);
    
    // This would use the stockHistoryService once we have the movements table
    // For now, return a placeholder response
    const movements = await stockHistoryService.getProductUsage(limit);
    
    res.json({
      movements,
      summary: {
        totalMovements: movements.length,
        recentActivity: movements.length > 0
      }
    });
  } catch (error) {
    console.error('❌ Error fetching recent movements:', error);
    res.status(500).json({
      error: 'Failed to fetch recent movements',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};