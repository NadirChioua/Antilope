import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SaleRequest {
  clientId: string;
  serviceId: string;
  staffId: string;
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  notes?: string;
}

interface SaleResponse {
  success: boolean;
  sale?: any;
  commission?: any;
  consumptionResults?: any[];
  error?: string;
}

// Simple bottle consumption logic - exactly as specified
async function consumeProduct(
  supabaseClient: any,
  productId: string,
  requiredMl: number,
  saleId: string,
  serviceId: string,
  staffId: string
): Promise<{
  success: boolean;
  productId: string;
  requiredMl: number;
  consumedMl: number;
  bottlesOpened: number;
  finalSealedBottles: number;
  finalOpenMl: number;
  totalRemainingMl: number;
  error?: string;
}> {
  try {
    // Get current product state
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return {
        success: false,
        productId,
        requiredMl,
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
    if (totalAvailable < requiredMl) {
      return {
        success: false,
        productId,
        requiredMl,
        consumedMl: 0,
        bottlesOpened: 0,
        finalSealedBottles: product.sealed_bottles,
        finalOpenMl: product.open_bottle_remaining_ml,
        totalRemainingMl: totalAvailable,
        error: `Insufficient stock. Available: ${totalAvailable}ml, Required: ${requiredMl}ml`
      };
    }

    // Store initial values for logging
    const initialSealedBottles = product.sealed_bottles;
    const initialOpenMl = product.open_bottle_remaining_ml;
    const bottleCapacity = product.bottle_capacity_ml;

    // CONSUMPTION LOGIC - Exactly as specified
    let remainingToConsume = requiredMl;
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
    const { error: updateError } = await supabaseClient
      .from('products')
      .update({
        sealed_bottles: newSealedBottles,
        open_bottle_remaining_ml: newOpenBottleRemaining,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (updateError) {
      throw new Error(`Failed to update product: ${updateError.message}`);
    }

    // Log the consumption
    await supabaseClient
      .from('product_consumption_log')
      .insert({
        product_id: productId,
        sale_id: saleId,
        service_id: serviceId,
        consumption_type: 'service',
        ml_consumed: requiredMl,
        bottles_opened: bottlesOpened,
        remaining_ml_before: initialOpenMl,
        remaining_ml_after: newOpenBottleRemaining,
        sealed_bottles_before: initialSealedBottles,
        sealed_bottles_after: newSealedBottles,
        staff_id: staffId,
        created_at: new Date().toISOString()
      });

    const finalTotalMl = (newSealedBottles * bottleCapacity) + newOpenBottleRemaining;

    return {
      success: true,
      productId,
      requiredMl,
      consumedMl: requiredMl,
      bottlesOpened,
      finalSealedBottles: newSealedBottles,
      finalOpenMl: newOpenBottleRemaining,
      totalRemainingMl: finalTotalMl
    };

  } catch (error) {
    console.error('Error consuming product:', error);
    return {
      success: false,
      productId,
      requiredMl,
      consumedMl: 0,
      bottlesOpened: 0,
      finalSealedBottles: 0,
      finalOpenMl: 0,
      totalRemainingMl: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the JWT token and get user role
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user role from database
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not found in database' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SECURITY FIX: Validate user role
    if (!['admin', 'staff'].includes(userData.role)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const saleData: SaleRequest = await req.json()

    // Validate required fields
    if (!saleData.clientId || !saleData.serviceId || !saleData.staffId || !saleData.totalAmount) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get service product requirements
    const { data: serviceProducts, error: serviceError } = await supabaseClient
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
      .eq('service_id', saleData.serviceId);

    if (serviceError) {
      console.error('Service products fetch error:', serviceError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch service product requirements' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check service availability first
    const requiredProducts = serviceProducts || [];
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
      
      if (totalAvailableMl < requiredMl) {
        missingProducts.push(`${product.name}: need ${requiredMl}ml, have ${totalAvailableMl}ml`);
      }
    }

    if (missingProducts.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Insufficient stock: ${missingProducts.join(', ')}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the sale
    const { data: sale, error: saleError } = await supabaseClient
      .from('sales')
      .insert({
        client_id: saleData.clientId,
        service_id: saleData.serviceId,
        staff_id: saleData.staffId,
        total_amount: saleData.totalAmount,
        payment_method: saleData.paymentMethod,
        status: 'completed',
        notes: saleData.notes || '',
      })
      .select()
      .single()

    if (saleError) {
      console.error('Sale creation error:', saleError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create sale' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process bottle consumption for each required product
    const consumptionResults = [];
    const errors = [];

    for (const sp of requiredProducts) {
      const product = sp.products;
      if (!product) continue;

      const consumptionResult = await consumeProduct(
        supabaseClient,
        sp.product_id,
        sp.default_qty || 0,
        sale.id,
        saleData.serviceId,
        saleData.staffId
      );

      consumptionResults.push(consumptionResult);

      if (!consumptionResult.success) {
        errors.push(consumptionResult.error || `Failed to consume product ${sp.product_id}`);
      } else {
        // Log to sale_product_usage for tracking
        try {
          await supabaseClient
            .from('sale_product_usage')
            .insert([{
              sale_id: sale.id,
              product_id: sp.product_id,
              service_id: saleData.serviceId,
              qty_used: consumptionResult.consumedMl,
              unit: 'ml'
            }]);
        } catch (usageError) {
          console.warn('Failed to log sale_product_usage:', usageError);
        }
      }
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Consumption errors: ${errors.join('; ')}` 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get service details for commission calculation
    const { data: service, error: serviceError2 } = await supabaseClient
      .from('services')
      .select('commission_percent')
      .eq('id', saleData.serviceId)
      .single()

    let commission = null
    if (!serviceError2 && service && service.commission_percent > 0) {
      const commissionAmount = saleData.totalAmount * (service.commission_percent / 100)
      
      const { data: commissionData, error: commissionError } = await supabaseClient
        .from('commissions')
        .insert({
          staff_id: saleData.staffId,
          sale_id: sale.id,
          service_id: saleData.serviceId,
          commission_percentage: service.commission_percent,
          commission_amount: commissionAmount,
          status: 'pending',
        })
        .select()
        .single()

      if (!commissionError) {
        commission = commissionData
      }
    }

    // Return success response
    const response: SaleResponse = {
      success: true,
      sale,
      commission,
      consumptionResults,
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})