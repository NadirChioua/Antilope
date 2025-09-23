import { supabase } from '@/lib/supabaseClient';

// ============================================================================
// SIMPLE BOTTLE CONSUMPTION SERVICE
// ============================================================================
// This service implements the exact consumption logic as specified:
// - Track stock only in milliliters, not by counting open bottles
// - Always consume from open bottle first, then open sealed bottles only when necessary
// - Update product stock and logs consistently
// ============================================================================

export interface ConsumptionRequest {
  productId: string;
  requiredMl: number;
  saleId?: string;
  serviceId?: string;
  staffId?: string;
}

export interface ConsumptionResult {
  success: boolean;
  productId: string;
  requiredMl: number;
  consumedMl: number;
  bottlesOpened: number;
  finalSealedBottles: number;
  finalOpenMl: number;
  totalRemainingMl: number;
  error?: string;
}

export interface ProductInventoryStatus {
  id: string;
  name: string;
  brand: string;
  category: string;
  sealed_bottles: number;
  open_bottle_remaining_ml: number;
  bottle_capacity_ml: number;
  total_ml_available: number;
  stock_status: 'good' | 'low' | 'critical' | 'out';
  min_threshold: number;
}

export class SimpleBottleConsumptionService {
  
  /**
   * CORE CONSUMPTION LOGIC - Exactly as specified
   * 
   * Consumption Flow:
   * 1. If open_bottle_remaining_ml >= used_ml → subtract directly
   * 2. Else:
   *    - Subtract what's left from open_bottle_remaining_ml
   *    - Decrement sealed_bottles by 1
   *    - Set open_bottle_remaining_ml = bottle_capacity_ml - (remaining ml needed)
   */
  static async consumeProduct(request: ConsumptionRequest): Promise<ConsumptionResult> {
    try {
      // Get current product state
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', request.productId)
        .single();

      if (productError || !product) {
        return {
          success: false,
          productId: request.productId,
          requiredMl: request.requiredMl,
          consumedMl: 0,
          bottlesOpened: 0,
          finalSealedBottles: 0,
          finalOpenMl: 0,
          totalRemainingMl: 0,
          error: `Product not found: ${productError?.message}`
        };
      }

      // Calculate total available ml
      const totalAvailable = (product.sealed_bottles * product.bottle_capacity_ml) + product.open_bottle_remaining_ml;

      // Check if we have enough stock
      if (totalAvailable < request.requiredMl) {
        return {
          success: false,
          productId: request.productId,
          requiredMl: request.requiredMl,
          consumedMl: 0,
          bottlesOpened: 0,
          finalSealedBottles: product.sealed_bottles,
          finalOpenMl: product.open_bottle_remaining_ml,
          totalRemainingMl: totalAvailable,
          error: `Insufficient stock. Available: ${totalAvailable}ml, Required: ${request.requiredMl}ml`
        };
      }

      // Store initial values for logging
      const initialSealedBottles = product.sealed_bottles;
      const initialOpenMl = product.open_bottle_remaining_ml;
      const bottleCapacity = product.bottle_capacity_ml;

      // CONSUMPTION LOGIC - Exactly as specified
      let remainingToConsume = request.requiredMl;
      let bottlesOpened = 0;
      let newSealedBottles = product.sealed_bottles;
      let newOpenBottleRemaining = product.open_bottle_remaining_ml;

      // Step 1: If open_bottle_remaining_ml >= used_ml → subtract directly
      if (newOpenBottleRemaining >= remainingToConsume) {
        newOpenBottleRemaining -= remainingToConsume;
        remainingToConsume = 0;
      } else {
        // Step 2: Else - consume from open bottle first, then open sealed bottles
        // Subtract what's left from open_bottle_remaining_ml
        remainingToConsume -= newOpenBottleRemaining;
        newOpenBottleRemaining = 0;

        // Open sealed bottles as needed
        while (remainingToConsume > 0 && newSealedBottles > 0) {
          // Decrement sealed_bottles by 1
          newSealedBottles -= 1;
          bottlesOpened += 1;

          // Set open_bottle_remaining_ml = bottle_capacity_ml - (remaining ml needed)
          const consumeFromNewBottle = Math.min(bottleCapacity, remainingToConsume);
          newOpenBottleRemaining = bottleCapacity - consumeFromNewBottle;
          remainingToConsume -= consumeFromNewBottle;
        }
      }

      // Update database
      const { error: updateError } = await supabase
        .from('products')
        .update({
          sealed_bottles: newSealedBottles,
          open_bottle_remaining_ml: newOpenBottleRemaining,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.productId);

      if (updateError) {
        throw new Error(`Failed to update product: ${updateError.message}`);
      }

      // Log the consumption
      await this.logConsumption({
        productId: request.productId,
        saleId: request.saleId,
        serviceId: request.serviceId,
        mlConsumed: request.requiredMl,
        bottlesOpened,
        sealedBottlesBefore: initialSealedBottles,
        sealedBottlesAfter: newSealedBottles,
        openMlBefore: initialOpenMl,
        openMlAfter: newOpenBottleRemaining,
        staffId: request.staffId
      });

      const finalTotalMl = (newSealedBottles * bottleCapacity) + newOpenBottleRemaining;

      return {
        success: true,
        productId: request.productId,
        requiredMl: request.requiredMl,
        consumedMl: request.requiredMl,
        bottlesOpened,
        finalSealedBottles: newSealedBottles,
        finalOpenMl: newOpenBottleRemaining,
        totalRemainingMl: finalTotalMl
      };

    } catch (error) {
      console.error('Error consuming product:', error);
      return {
        success: false,
        productId: request.productId,
        requiredMl: request.requiredMl,
        consumedMl: 0,
        bottlesOpened: 0,
        finalSealedBottles: 0,
        finalOpenMl: 0,
        totalRemainingMl: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if service can be fulfilled with current stock
   */
  static async checkServiceAvailability(serviceId: string): Promise<{
    available: boolean;
    serviceId: string;
    requiredProducts: Array<{
      productId: string;
      productName: string;
      requiredMl: number;
      availableMl: number;
      canFulfill: boolean;
    }>;
    missingProducts: string[];
  }> {
    try {
      // Get service info
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('id, name')
        .eq('id', serviceId)
        .single();

      if (serviceError || !service) {
        throw new Error(`Service not found: ${serviceError?.message}`);
      }

      // Get required products from service_products table
      const { data: serviceProducts, error: spError } = await supabase
        .from('service_products')
        .select(`
          product_id,
          default_qty,
          products (
            id,
            name,
            sealed_bottles,
            open_bottle_remaining_ml,
            bottle_capacity_ml
          )
        `)
        .eq('service_id', serviceId);

      if (spError) {
        throw new Error(`Error fetching service products: ${spError.message}`);
      }

      const requiredProducts = serviceProducts || [];
      const productChecks = [];
      const missingProducts = [];

      for (const sp of requiredProducts) {
        const product = sp.products;
        
        if (!product) {
          missingProducts.push(`Product ${sp.product_id} not found`);
          continue;
        }

        // Calculate total available ml
        const totalAvailableMl = (product.sealed_bottles * product.bottle_capacity_ml) + product.open_bottle_remaining_ml;
        const requiredMl = sp.default_qty || 0;
        const canFulfill = totalAvailableMl >= requiredMl;

        productChecks.push({
          productId: sp.product_id,
          productName: product.name,
          requiredMl: requiredMl,
          availableMl: totalAvailableMl,
          canFulfill
        });

        if (!canFulfill) {
          missingProducts.push(`${product.name}: need ${requiredMl}ml, have ${totalAvailableMl}ml`);
        }
      }

      return {
        available: missingProducts.length === 0,
        serviceId,
        requiredProducts: productChecks,
        missingProducts
      };
    } catch (error) {
      console.error('Error checking service availability:', error);
      return {
        available: false,
        serviceId,
        requiredProducts: [],
        missingProducts: [`Error checking availability: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Get current inventory status for all products
   */
  static async getInventoryStatus(): Promise<ProductInventoryStatus[]> {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, brand, category, sealed_bottles, open_bottle_remaining_ml, bottle_capacity_ml, min_quantity')
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw new Error(`Failed to fetch products: ${error.message}`);
      }

      return products.map(product => {
        const total_ml_available = (product.sealed_bottles * product.bottle_capacity_ml) + product.open_bottle_remaining_ml;
        
        let stock_status: 'good' | 'low' | 'critical' | 'out' = 'good';
        if (total_ml_available === 0) {
          stock_status = 'out';
        } else if (product.sealed_bottles === 0) {
          stock_status = 'critical';
        } else if (product.sealed_bottles <= product.min_quantity) {
          stock_status = 'low';
        }

        return {
          id: product.id,
          name: product.name,
          brand: product.brand,
          category: product.category,
          sealed_bottles: product.sealed_bottles,
          open_bottle_remaining_ml: product.open_bottle_remaining_ml,
          bottle_capacity_ml: product.bottle_capacity_ml,
          total_ml_available,
          stock_status,
          min_threshold: product.min_quantity
        };
      });
    } catch (error) {
      console.error('Error getting inventory status:', error);
      return [];
    }
  }

  /**
   * Get active stock alerts
   */
  static async getActiveStockAlerts(): Promise<ProductInventoryStatus[]> {
    try {
      const products = await this.getInventoryStatus();
      return products.filter(product => 
        product.stock_status === 'low' || product.stock_status === 'out' || product.stock_status === 'critical'
      );
    } catch (error) {
      console.error('Error getting active stock alerts:', error);
      return [];
    }
  }

  /**
   * Get consumption history
   */
  static async getConsumptionHistory(productId?: string, limit: number = 50): Promise<Array<{
    id: string;
    product_id: string;
    product_name: string;
    ml_consumed: number;
    bottles_opened: number;
    consumption_type: string;
    created_at: string;
    service_name?: string;
  }>> {
    try {
      let query = supabase
        .from('product_consumption_log')
        .select(`
          id,
          product_id,
          ml_consumed,
          bottles_opened,
          consumption_type,
          created_at,
          products (name),
          services (name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = query;

      if (error) throw error;

      return (data || []).map(log => ({
        id: log.id,
        product_id: log.product_id,
        product_name: log.products?.name || 'Unknown Product',
        ml_consumed: log.ml_consumed || 0,
        bottles_opened: log.bottles_opened || 0,
        consumption_type: log.consumption_type || 'unknown',
        created_at: log.created_at,
        service_name: log.services?.name
      }));
    } catch (error) {
      console.error('Error getting consumption history:', error);
      return [];
    }
  }

  /**
   * Get service product requirements
   */
  static async getServiceProductRequirements(serviceId: string): Promise<Array<{
    productId: string;
    productName: string;
    requiredMl: number;
  }>> {
    try {
      const { data: serviceProducts, error } = await supabase
        .from('service_products')
        .select(`
          product_id,
          default_qty,
          products (name)
        `)
        .eq('service_id', serviceId);

      if (error) throw error;

      return (serviceProducts || []).map(sp => ({
        productId: sp.product_id,
        productName: sp.products?.name || 'Unknown Product',
        requiredMl: sp.default_qty || 0
      }));
    } catch (error) {
      console.error('Error getting service product requirements:', error);
      return [];
    }
  }

  /**
   * Get sale product usage
   */
  static async getSaleProductUsage(saleId: string): Promise<Array<{
    productId: string;
    productName: string;
    mlConsumed: number;
    bottlesOpened: number;
  }>> {
    try {
      const { data: logs, error } = await supabase
        .from('product_consumption_log')
        .select(`
          product_id,
          ml_consumed,
          bottles_opened,
          products (name)
        `)
        .eq('sale_id', saleId);

      if (error) throw error;

      return (logs || []).map(log => ({
        productId: log.product_id,
        productName: log.products?.name || 'Unknown Product',
        mlConsumed: log.ml_consumed || 0,
        bottlesOpened: log.bottles_opened || 0
      }));
    } catch (error) {
      console.error('Error getting sale product usage:', error);
      return [];
    }
  }

  /**
   * Log consumption operation
   */
  private static async logConsumption(data: {
    productId: string;
    saleId?: string;
    serviceId?: string;
    mlConsumed: number;
    bottlesOpened: number;
    sealedBottlesBefore: number;
    sealedBottlesAfter: number;
    openMlBefore: number;
    openMlAfter: number;
    staffId?: string;
  }): Promise<void> {
    try {
      await supabase
        .from('product_consumption_log')
        .insert({
          product_id: data.productId,
          sale_id: data.saleId,
          service_id: data.serviceId,
          consumption_type: 'service',
          ml_consumed: data.mlConsumed,
          bottles_opened: data.bottlesOpened,
          remaining_ml_before: data.openMlBefore,
          remaining_ml_after: data.openMlAfter,
          sealed_bottles_before: data.sealedBottlesBefore,
          sealed_bottles_after: data.sealedBottlesAfter,
          staff_id: data.staffId,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging consumption:', error);
      // Don't throw error here as it's just logging
    }
  }
}

export default SimpleBottleConsumptionService;

