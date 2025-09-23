import { Request, Response } from 'express';
import { productService, stockHistoryService, saleService } from '../services/database';

// GET /api/reports/product-usage - Get product usage report
export const getProductUsageReport = async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      productId,
      category,
      limit = 50
    } = req.query;

    console.log('📊 Generating product usage report...', {
      startDate,
      endDate,
      productId,
      category,
      limit
    });

    // Get usage data from stock history service
    const usageData = await stockHistoryService.getUsageReport({
      startDate: startDate as string,
      endDate: endDate as string,
      productId: productId as string,
      category: category as string,
      limit: parseInt(limit as string)
    });

    // Get all products for reference
    const products = await productService.getAll();
    const productMap = new Map(products.map(p => [p.id, p]));

    // Enhance usage data with product information
    const enhancedUsage = usageData.map(usage => {
      const product = productMap.get(usage.productId);
      return {
        ...usage,
        productName: product?.name || 'Unknown Product',
        category: product?.category || 'Unknown',
        unit: product?.unit || 'units',
        currentStock: product?.totalQuantity || product?.quantity || 0,
        costPerUnit: product?.cost || 0,
        totalCost: (product?.cost || 0) * usage.totalUsed
      };
    });

    // Calculate summary statistics
    const summary = {
      totalProducts: enhancedUsage.length,
      totalQuantityUsed: enhancedUsage.reduce((sum, item) => sum + item.totalUsed, 0),
      totalCostValue: enhancedUsage.reduce((sum, item) => sum + item.totalCost, 0),
      averageUsagePerProduct: enhancedUsage.length > 0 
        ? enhancedUsage.reduce((sum, item) => sum + item.totalUsed, 0) / enhancedUsage.length 
        : 0,
      dateRange: {
        start: startDate || 'All time',
        end: endDate || 'Present'
      }
    };

    // Sort by usage amount (descending)
    enhancedUsage.sort((a, b) => b.totalUsed - a.totalUsed);

    console.log('✅ Usage report generated:', {
      products: enhancedUsage.length,
      totalUsage: summary.totalQuantityUsed,
      totalCost: summary.totalCostValue
    });

    res.json({
      usage: enhancedUsage,
      summary,
      filters: {
        startDate,
        endDate,
        productId,
        category,
        limit
      }
    });
  } catch (error) {
    console.error('❌ Error generating usage report:', error);
    res.status(500).json({
      error: 'Failed to generate usage report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// GET /api/reports/inventory-summary - Get inventory summary report
export const getInventorySummary = async (req: Request, res: Response) => {
  try {
    console.log('📋 Generating inventory summary report...');

    const products = await productService.getAll();

    // Calculate inventory metrics
    const inventoryData = products.map(product => {
      const totalQuantity = product.totalQuantity || product.quantity || 0;
      const minThreshold = product.minThreshold || product.minQuantity || 0;
      const cost = product.cost || 0;
      const price = product.price || 0;

      return {
        id: product.id,
        name: product.name,
        category: product.category,
        currentStock: totalQuantity,
        minThreshold,
        unit: product.unit,
        costPerUnit: cost,
        pricePerUnit: price,
        totalValue: totalQuantity * cost,
        potentialRevenue: totalQuantity * price,
        stockStatus: totalQuantity === 0 ? 'out_of_stock' 
                   : totalQuantity <= minThreshold ? 'low_stock' 
                   : 'normal',
        isActive: !product.archived,
        lastUpdated: product.updatedAt
      };
    });

    // Calculate summary statistics
    const summary = {
      totalProducts: inventoryData.length,
      activeProducts: inventoryData.filter(p => p.isActive).length,
      archivedProducts: inventoryData.filter(p => !p.isActive).length,
      outOfStock: inventoryData.filter(p => p.stockStatus === 'out_of_stock').length,
      lowStock: inventoryData.filter(p => p.stockStatus === 'low_stock').length,
      normalStock: inventoryData.filter(p => p.stockStatus === 'normal').length,
      totalInventoryValue: inventoryData.reduce((sum, item) => sum + item.totalValue, 0),
      totalPotentialRevenue: inventoryData.reduce((sum, item) => sum + item.potentialRevenue, 0),
      averageStockLevel: inventoryData.length > 0 
        ? inventoryData.reduce((sum, item) => sum + item.currentStock, 0) / inventoryData.length 
        : 0
    };

    // Group by category
    const byCategory = inventoryData.reduce((acc, product) => {
      const category = product.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = {
          products: [],
          totalValue: 0,
          totalItems: 0,
          lowStockCount: 0,
          outOfStockCount: 0
        };
      }
      
      acc[category].products.push(product);
      acc[category].totalValue += product.totalValue;
      acc[category].totalItems += product.currentStock;
      
      if (product.stockStatus === 'low_stock') acc[category].lowStockCount++;
      if (product.stockStatus === 'out_of_stock') acc[category].outOfStockCount++;
      
      return acc;
    }, {} as Record<string, any>);

    console.log('✅ Inventory summary generated:', {
      totalProducts: summary.totalProducts,
      totalValue: summary.totalInventoryValue,
      categories: Object.keys(byCategory).length
    });

    res.json({
      inventory: inventoryData,
      summary,
      byCategory,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error generating inventory summary:', error);
    res.status(500).json({
      error: 'Failed to generate inventory summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// GET /api/reports/stock-movements - Get stock movement history
export const getStockMovements = async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      productId,
      movementType,
      limit = 100
    } = req.query;

    console.log('📈 Fetching stock movements...', {
      startDate,
      endDate,
      productId,
      movementType,
      limit
    });

    // Get movement data from stock history service
    const movements = await stockHistoryService.logMovement({
      productId: productId as string,
      movementType: movementType as string,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: parseInt(limit as string)
    });

    // Get products for reference
    const products = await productService.getAll();
    const productMap = new Map(products.map(p => [p.id, p]));

    // Enhance movements with product information
    const enhancedMovements = movements.map(movement => {
      const product = productMap.get(movement.productId);
      return {
        ...movement,
        productName: product?.name || 'Unknown Product',
        category: product?.category || 'Unknown',
        unit: product?.unit || 'units'
      };
    });

    // Calculate summary
    const summary = {
      totalMovements: enhancedMovements.length,
      totalQuantityIn: enhancedMovements
        .filter(m => m.movementType === 'in')
        .reduce((sum, m) => sum + m.quantity, 0),
      totalQuantityOut: enhancedMovements
        .filter(m => m.movementType === 'out')
        .reduce((sum, m) => sum + m.quantity, 0),
      netMovement: 0,
      dateRange: {
        start: startDate || 'All time',
        end: endDate || 'Present'
      }
    };

    summary.netMovement = summary.totalQuantityIn - summary.totalQuantityOut;

    console.log('✅ Stock movements fetched:', {
      movements: enhancedMovements.length,
      netMovement: summary.netMovement
    });

    res.json({
      movements: enhancedMovements,
      summary,
      filters: {
        startDate,
        endDate,
        productId,
        movementType,
        limit
      }
    });
  } catch (error) {
    console.error('❌ Error fetching stock movements:', error);
    res.status(500).json({
      error: 'Failed to fetch stock movements',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};