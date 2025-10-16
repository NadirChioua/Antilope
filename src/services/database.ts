import { supabase } from '@/lib/supabaseClient';
import { supabaseAdmin, executeAdminQuery } from '@/lib/supabaseAdmin';
import { Client, Service, Product, Sale, DashboardStats } from '@/types';
import { normalizePhoneNumber } from '@/utils/phone';
import toast from 'react-hot-toast';

// Performance optimization: Simple cache for frequently accessed data
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 30000; // 30 seconds cache

// Helper function to get cached data
const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

// Helper function to set cached data
const setCachedData = (key: string, data: any, ttl: number = CACHE_TTL) => {
  cache.set(key, { data, timestamp: Date.now(), ttl });
};

// Helper function to clear cache
const clearCache = (pattern?: string) => {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
};

// Helper function to check if Supabase is configured
const isSupabaseConfigured = () => {
  return true; // Always configured since we're using direct keys
};

// Optimized error handling with reduced toast spam
let lastErrorTime = 0;
const ERROR_THROTTLE = 2000; // 2 seconds

const handleError = (error: any, operation: string) => {
  console.error(`Error during ${operation}:`, error);
  const errorMessage = error.message || `Failed to ${operation.toLowerCase()}`;
  
  // Throttle error toasts to prevent spam
  const now = Date.now();
  if (now - lastErrorTime > ERROR_THROTTLE) {
    toast.error(errorMessage);
    lastErrorTime = now;
  }
  
  throw new Error(errorMessage);
};

// Product validation utilities
const validateProductData = (productData: any, isUpdate: boolean = false): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields for creation
  if (!isUpdate) {
    if (!productData.name || typeof productData.name !== 'string' || productData.name.trim().length === 0) {
      errors.push('Product name is required and must be a non-empty string');
    }
    if (!productData.category || typeof productData.category !== 'string' || productData.category.trim().length === 0) {
      errors.push('Category is required and must be a non-empty string');
    }
    if (!productData.unit || typeof productData.unit !== 'string' || productData.unit.trim().length === 0) {
      errors.push('Unit is required and must be a non-empty string');
    }
  }

  // Validate numeric fields
  if (productData.volume !== undefined) {
    if (typeof productData.volume !== 'number' || productData.volume < 0) {
      errors.push('Volume must be a non-negative number');
    }
  }

  if (productData.quantity !== undefined) {
    if (typeof productData.quantity !== 'number' || productData.quantity < 0) {
      errors.push('Quantity must be a non-negative number');
    }
  }

  if (productData.totalQuantity !== undefined) {
    if (typeof productData.totalQuantity !== 'number' || productData.totalQuantity < 0) {
      errors.push('Total quantity must be a non-negative number');
    }
  }

  if (productData.minQuantity !== undefined) {
    if (typeof productData.minQuantity !== 'number' || productData.minQuantity < 0) {
      errors.push('Minimum quantity must be a non-negative number');
    }
  }

  if (productData.minThreshold !== undefined) {
    if (typeof productData.minThreshold !== 'number' || productData.minThreshold < 0) {
      errors.push('Minimum threshold must be a non-negative number');
    }
  }

  if (productData.price !== undefined) {
    if (typeof productData.price !== 'number' || productData.price < 0) {
      errors.push('Price must be a non-negative number');
    }
  }

  if (productData.cost !== undefined) {
    if (typeof productData.cost !== 'number' || productData.cost < 0) {
      errors.push('Cost must be a non-negative number');
    }
  }

  // Validate boolean fields
  if (productData.isActive !== undefined && typeof productData.isActive !== 'boolean') {
    errors.push('isActive must be a boolean value');
  }

  if (productData.archived !== undefined && typeof productData.archived !== 'boolean') {
    errors.push('archived must be a boolean value');
  }

  // Validate URL format for imageUrl
  if (productData.imageUrl !== undefined && productData.imageUrl !== null) {
    if (typeof productData.imageUrl !== 'string') {
      errors.push('Image URL must be a string');
    } else if (productData.imageUrl.trim().length > 0) {
      try {
        new URL(productData.imageUrl);
      } catch {
        errors.push('Image URL must be a valid URL format');
      }
    }
  }

  // Business logic validations
  if (productData.cost !== undefined && productData.price !== undefined) {
    if (productData.cost > productData.price) {
      errors.push('Cost cannot be higher than price');
    }
  }

  if (productData.totalQuantity !== undefined && productData.minThreshold !== undefined) {
    if (productData.totalQuantity < productData.minThreshold && productData.totalQuantity > 0) {
      // This is a warning, not an error - allow but log
      console.warn('⚠️ Product stock is below minimum threshold');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// CLIENT OPERATIONS
export const clientService = {
  async getAll(): Promise<Client[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    // Check cache first
    const cacheKey = 'clients_all';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      console.log('✅ Clients loaded from cache:', cachedData.length);
      return cachedData;
    }

    try {
      const { data, error } = await executeAdminQuery(
        (client) => client.from('clients')
          .select('id, name, phone, email, notes, last_visit, total_visits, total_spent, created_at, updated_at')
          .order('created_at', { ascending: false })
      );

      if (error) {
        throw error;
      }

      const clients = data?.map(client => ({
        id: client.id,
        name: client.name,
        phone: client.phone || '',
        email: client.email || '',
        notes: client.notes || '',
        lastVisit: client.last_visit || null,
        totalVisits: client.total_visits || 0,
        totalSpent: client.total_spent || 0,
        createdAt: client.created_at,
        updatedAt: client.updated_at,
      })) || [];

      // Cache the result
      setCachedData(cacheKey, clients);
      console.log('✅ Clients fetched and cached:', clients.length);
      
      return clients;
    } catch (error) {
      console.error('❌ Client service error:', error);
      handleError(error, 'fetch clients');
      return [];
    }
  },

  async create(clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'totalVisits' | 'totalSpent'>): Promise<Client | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      // Normalize phone number using utility function
      const normalizedPhone = normalizePhoneNumber(clientData.phone);
      
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: clientData.name.trim(),
          phone: normalizedPhone,
          email: clientData.email?.trim() || null,
          notes: clientData.notes?.trim() || null,
          total_visits: 0,
          total_spent: 0,
        })
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation for phone numbers
        if (error.code === '23505' && error.message.includes('phone')) {
          throw new Error('A client with this phone number already exists');
        }
        throw error;
      }

      const client: Client = {
        id: data.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        notes: data.notes,
        lastVisit: data.last_visit,
        totalVisits: data.total_visits,
        totalSpent: data.total_spent,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      // Clear cache after successful creation
      clearCache('clients');
      toast.success('Client added successfully');
      return client;
    } catch (error) {
      handleError(error, 'add client');
      return null;
    }
  },

  async update(id: string, clientData: Partial<Client>): Promise<Client | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .update({
          name: clientData.name,
          phone: clientData.phone,
          email: clientData.email,
          notes: clientData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const client: Client = {
        id: data.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        notes: data.notes,
        lastVisit: data.last_visit,
        totalVisits: data.total_visits,
        totalSpent: data.total_spent,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      // Clear cache after successful update
      clearCache('clients');
      toast.success('Client updated successfully');
      return client;
    } catch (error) {
      handleError(error, 'update client');
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Clear cache after successful deletion
      clearCache('clients');
      toast.success('Client deleted successfully');
      return true;
    } catch (error) {
      handleError(error, 'delete client');
      return false;
    }
  },
};

// SERVICE OPERATIONS
export const serviceService = {
  async getAll(): Promise<Service[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, name_ar, name_fr, description, price, duration, category, commission_percent, is_active, required_products, assigned_staff, created_at, updated_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(service => ({
        id: service.id,
        name: service.name,
        nameAr: service.name_ar,
        nameFr: service.name_fr,
        description: service.description,
        price: service.price,
        duration: service.duration,
        category: service.category,
        commissionPercent: service.commission_percent,
        isActive: service.is_active,
        requiredProducts: Array.isArray(service.required_products) ? service.required_products : [],
        assignedStaff: service.assigned_staff || [],
        createdAt: service.created_at,
        updatedAt: service.updated_at,
      }));
    } catch (error) {
      handleError(error, 'fetch services');
      return [];
    }
  },

  async create(serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<Service | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .insert({
          name: serviceData.name,
          name_ar: serviceData.nameAr,
          name_fr: serviceData.nameFr,
          description: serviceData.description,
          price: serviceData.price,
          duration: serviceData.duration,
          category: serviceData.category,
          commission_percent: serviceData.commissionPercent || 0,
          is_active: serviceData.isActive,
          required_products: serviceData.requiredProducts || [],
          assigned_staff: serviceData.assignedStaff || [],
        })
        .select()
        .single();

      if (error) throw error;

      const service: Service = {
        id: data.id,
        name: data.name,
        nameAr: data.name_ar,
        nameFr: data.name_fr,
        description: data.description,
        price: data.price,
        duration: data.duration,
        category: data.category,
        commissionPercent: data.commission_percent,
        isActive: data.is_active,
        requiredProducts: data.required_products,
        assignedStaff: data.assigned_staff,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      toast.success('Service added successfully');
      return service;
    } catch (error) {
      handleError(error, 'add service');
      return null;
    }
  },

  async update(id: string, serviceData: Partial<Service>): Promise<Service | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .update({
          name: serviceData.name,
          name_ar: serviceData.nameAr,
          name_fr: serviceData.nameFr,
          description: serviceData.description,
          price: serviceData.price,
          duration: serviceData.duration,
          category: serviceData.category,
          commission_percent: serviceData.commissionPercent,
          is_active: serviceData.isActive,
          required_products: serviceData.requiredProducts || [],
          assigned_staff: serviceData.assignedStaff || [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const service: Service = {
        id: data.id,
        name: data.name,
        nameAr: data.name_ar,
        nameFr: data.name_fr,
        description: data.description,
        price: data.price,
        duration: data.duration,
        category: data.category,
        commissionPercent: data.commission_percent,
        isActive: data.is_active,
        requiredProducts: data.required_products,
        assignedStaff: data.assigned_staff,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      toast.success('Service updated successfully');
      return service;
    } catch (error) {
      handleError(error, 'update service');
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Service deleted successfully');
      return true;
    } catch (error) {
      handleError(error, 'delete service');
      return false;
    }
  },
};

// PRODUCT OPERATIONS
export const productService = {
  async getAll(): Promise<Product[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      console.log('🔍 Fetching products from Supabase...');
      const { data, error } = await supabase
        .from('products')
        .select('id, name, brand, category, volume, unit, quantity, min_quantity, price, cost, is_active, created_at, updated_at, sealed_bottles, open_bottle_remaining_ml, bottle_capacity_ml, min_stock_threshold, is_bottle_tracked, bottle_size_ml')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching products:', error);
        throw error;
      }

      console.log('✅ Products fetched successfully:', data?.length || 0);

      return data?.map(product => ({
        id: product.id,
        name: product.name,
        brand: product.brand || '',
        category: product.category || 'General',
        volume: product.volume || 0,
        unit: product.unit || 'ml',
        quantity: product.quantity || 0, // Backward compatibility
        totalQuantity: product.quantity || 0, // Use quantity as totalQuantity
        minQuantity: product.min_quantity || 0, // Backward compatibility
        minThreshold: product.min_quantity || 10, // Use min_quantity as minThreshold
        price: product.price || 0,
        cost: product.cost || 0,
        isActive: product.is_active !== false, // Default to active
        imageUrl: '', // Default empty string since image_url column doesn't exist
        archived: false, // Default false since archived column doesn't exist
        // Bottle-specific fields
        sealed_bottles: product.sealed_bottles || 0,
        open_bottle_remaining_ml: product.open_bottle_remaining_ml || 0,
        bottle_capacity_ml: product.bottle_size_ml || 1000,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      })) || [];
    } catch (error) {
      console.error('❌ Product service error:', error);
      handleError(error, 'fetch products');
      return [];
    }
  },

  async create(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    // Validate product data
    const validation = validateProductData(productData, false);
    if (!validation.isValid) {
      const errorMessage = `Validation failed: ${validation.errors.join(', ')}`;
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: productData.name,
          brand: productData.brand || '',
          category: productData.category,
          volume: productData.volume,
          unit: productData.unit,
          quantity: productData.quantity || productData.totalQuantity || 0,
          min_quantity: productData.minQuantity || productData.minThreshold || 10,
          price: productData.price,
          cost: productData.cost,
          is_active: productData.isActive,
          // Bottle-specific fields
          sealed_bottles: productData.sealed_bottles || 0,
          open_bottle_remaining_ml: productData.open_bottle_remaining_ml || 0,
          bottle_size_ml: productData.bottle_capacity_ml || productData.bottleSizeMl || 1000,
        })
        .select()
        .single();

      if (error) throw error;

      const product: Product = {
        id: data.id,
        name: data.name,
        brand: data.brand || '',
        category: data.category,
        volume: data.volume,
        unit: data.unit,
        quantity: data.quantity,
        totalQuantity: data.quantity,
        minQuantity: data.min_quantity,
        minThreshold: data.min_quantity || 10,
        price: data.price,
        cost: data.cost,
        isActive: data.is_active,
        imageUrl: '', // Default empty string since image_url column doesn't exist
        archived: false, // Default false since archived column doesn't exist
        // Bottle-specific fields
        sealed_bottles: data.sealed_bottles || 0,
        open_bottle_remaining_ml: data.open_bottle_remaining_ml || 0,
        bottle_capacity_ml: data.bottle_size_ml || 1000,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      toast.success('Product added successfully');
      return product;
    } catch (error) {
      handleError(error, 'add product');
      return null;
    }
  },

  async update(id: string, productData: Partial<Product>): Promise<Product | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    // Validate product data for updates
    const validation = validateProductData(productData, true);
    if (!validation.isValid) {
      const errorMessage = `Validation failed: ${validation.errors.join(', ')}`;
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Only update fields that are provided
      if (productData.name !== undefined) updateData.name = productData.name;
      if (productData.category !== undefined) updateData.category = productData.category;
      if (productData.volume !== undefined) updateData.volume = productData.volume;
      if (productData.unit !== undefined) updateData.unit = productData.unit;
      if (productData.quantity !== undefined) updateData.quantity = productData.quantity;
      if (productData.minQuantity !== undefined) updateData.min_quantity = productData.minQuantity;
      if (productData.price !== undefined) updateData.price = productData.price;
      if (productData.cost !== undefined) updateData.cost = productData.cost;
      if (productData.isActive !== undefined) updateData.is_active = productData.isActive;
      
      // Handle bottle-specific fields (both camelCase from frontend and snake_case from database)
      if (productData.sealed_bottles !== undefined) updateData.sealed_bottles = productData.sealed_bottles;
      if (productData.sealedBottles !== undefined) updateData.sealed_bottles = productData.sealedBottles;
      if (productData.open_bottle_remaining_ml !== undefined) updateData.open_bottle_remaining_ml = productData.open_bottle_remaining_ml;
      if (productData.openBottleRemainingMl !== undefined) updateData.open_bottle_remaining_ml = productData.openBottleRemainingMl;
      if (productData.bottle_capacity_ml !== undefined) updateData.bottle_size_ml = productData.bottle_capacity_ml;
      if (productData.bottleCapacityMl !== undefined) updateData.bottle_size_ml = productData.bottleCapacityMl;
      if (productData.bottleSizeMl !== undefined) updateData.bottle_size_ml = productData.bottleSizeMl;
      if (productData.min_stock_threshold !== undefined) updateData.min_stock_threshold = productData.min_stock_threshold;
      if (productData.minStockThreshold !== undefined) updateData.min_stock_threshold = productData.minStockThreshold;
      if (productData.is_bottle_tracked !== undefined) updateData.is_bottle_tracked = productData.is_bottle_tracked;
      if (productData.isBottleTracked !== undefined) updateData.is_bottle_tracked = productData.isBottleTracked;
      if (productData.brand !== undefined) updateData.brand = productData.brand;

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const product: Product = {
        id: data.id,
        name: data.name,
        brand: data.brand || '',
        category: data.category,
        volume: data.volume,
        unit: data.unit,
        quantity: data.quantity,
        totalQuantity: data.quantity,
        minQuantity: data.min_quantity,
        minThreshold: data.min_quantity || 10,
        price: data.price,
        cost: data.cost,
        isActive: data.is_active,
        imageUrl: '', // Default empty string since image_url column doesn't exist
        archived: false, // Default false since archived column doesn't exist
        // Bottle-specific fields
        sealed_bottles: data.sealed_bottles || 0,
        open_bottle_remaining_ml: data.open_bottle_remaining_ml || 0,
        bottle_capacity_ml: data.bottle_size_ml || 1000,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      toast.success('Product updated successfully');
      return product;
    } catch (error) {
      handleError(error, 'update product');
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Product deleted successfully');
      return true;
    } catch (error) {
      handleError(error, 'delete product');
      return false;
    }
  },

  async updateStock(productId: string, newQuantity: number): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;

      return true;
    } catch (error) {
      handleError(error, 'update stock');
      return false;
    }
  },

  async getProductUsageStats(productId: string): Promise<{
    totalUsed: number;
    usageHistory: Array<{
      date: string;
      quantityUsed: number;
      unit: string;
      saleId: string;
    }>;
  }> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }

    try {
      const { data, error } = await supabase
        .from('sale_product_usage')
        .select(`
          qty_used,
          unit,
          created_at,
          sale_id
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalUsed = data?.reduce((sum, usage) => sum + usage.qty_used, 0) || 0;
      
      const usageHistory = data?.map(usage => ({
        date: usage.created_at,
        quantityUsed: usage.qty_used,
        unit: usage.unit,
        saleId: usage.sale_id,
      })) || [];

      return {
        totalUsed,
        usageHistory,
      };
    } catch (error) {
      handleError(error, 'fetch product usage stats');
      return { totalUsed: 0, usageHistory: [] };
    }
  },

  async restock(restockData: {
    productId: string;
    bottlesToAdd: number;
    costPerBottle: number;
    totalCost: number;
    supplier?: string;
    invoiceNumber?: string;
    notes?: string;
    restockDate: string;
  }): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      console.log('🔄 Starting restock operation for product:', restockData.productId);

      // First, get the current product data
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('id, name, sealed_bottles, bottle_capacity_ml, cost')
        .eq('id', restockData.productId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching product for restock:', fetchError);
        throw fetchError;
      }

      if (!currentProduct) {
        throw new Error('Product not found');
      }

      const currentBottles = currentProduct.sealed_bottles || 0;
      const newBottleCount = currentBottles + restockData.bottlesToAdd;

      // Update the product's sealed bottles count and cost if provided
      const updateData: any = {
        sealed_bottles: newBottleCount,
        updated_at: new Date().toISOString(),
      };

      // Update cost if provided and different from current
      if (restockData.costPerBottle > 0 && restockData.costPerBottle !== currentProduct.cost) {
        updateData.cost = restockData.costPerBottle;
      }

      console.log('🔄 Updating product with data:', {
        productId: restockData.productId,
        updateData,
        currentBottles,
        newBottleCount
      });

      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', restockData.productId);

      if (updateError) {
        console.error('❌ Error updating product stock:', updateError);
        throw updateError;
      }

      // Log the restock in stock history
      const { error: historyError } = await supabase
        .from('stock_history')
        .insert({
          product_id: restockData.productId,
          movement_type: 'restock',
          quantity_before: currentBottles,
          quantity_change: restockData.bottlesToAdd,
          quantity_after: newBottleCount,
          reason: `Restock: ${restockData.bottlesToAdd} bottles added${restockData.supplier ? ` from ${restockData.supplier}` : ''}${restockData.invoiceNumber ? ` (Invoice: ${restockData.invoiceNumber})` : ''}`,
          created_at: restockData.restockDate,
        });

      if (historyError) {
        console.error('❌ Error logging stock history:', historyError);
        // Don't throw here as the main operation succeeded
      }

      // Note: Detailed restock tracking is handled through stock_history table
      // The stock_history entry above contains all necessary restock information

      console.log('✅ Restock completed successfully');
      console.log(`📦 Product: ${currentProduct.name}`);
      console.log(`📈 Stock: ${currentBottles} → ${newBottleCount} bottles (+${restockData.bottlesToAdd})`);

      // Clear cache to ensure fresh data
      clearCache('products');

      return true;

    } catch (error) {
      console.error('❌ Error during restock operation:', error);
      handleError(error, 'restock product');
      return false;
    }
  },

  async getRestockHistory(productId?: string): Promise<Array<{
    id: string;
    productId: string;
    productName: string;
    bottlesAdded: number;
    costPerBottle: number;
    totalCost: number;
    supplier?: string;
    invoiceNumber?: string;
    notes?: string;
    restockDate: string;
    createdAt: string;
  }>> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      let query = supabase
        .from('stock_history')
        .select(`
          id,
          product_id,
          quantity_change,
          reason,
          created_at,
          products!inner(name)
        `)
        .eq('movement_type', 'restock')
        .order('created_at', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching restock history:', error);
        throw error;
      }

      return data?.map(record => {
        // Parse the reason field to extract restock details
        const reason = record.reason || '';
        const supplierMatch = reason.match(/from (.+?)(?:\s*\(|$)/);
        const invoiceMatch = reason.match(/\(Invoice: (.+?)\)/);
        
        return {
          id: record.id,
          productId: record.product_id,
          productName: (record.products as any)?.name || 'Unknown Product',
          bottlesAdded: record.quantity_change,
          costPerBottle: 0, // Not available in stock_history
          totalCost: 0, // Not available in stock_history
          supplier: supplierMatch ? supplierMatch[1] : undefined,
          invoiceNumber: invoiceMatch ? invoiceMatch[1] : undefined,
          notes: reason,
          restockDate: record.created_at.split('T')[0],
          createdAt: record.created_at,
        };
      }) || [];

    } catch (error) {
      handleError(error, 'fetch restock history');
      return [];
    }
  },

  async getAllWithRealUsage(): Promise<(Product & {
    realUsage: {
      totalUsed: number;
      currentStock: number;
      initialStock: number;
      usagePercentage: number;
      remainingPercentage: number;
      itemsConsumed: number;
      partialUsage: number;
      quantityRemaining: number;
      quantityUsed: number;
    };
    stockStatus: {
      isLowStock: boolean;
      isOutOfStock: boolean;
      stockLevel: number;
      threshold: number;
      alertLevel: 'normal' | 'warning' | 'critical';
    };
  })[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }

    try {
      // Get all products
      const products = await this.getAll();
      
      // Get usage data for all products
      const { data: usageData, error: usageError } = await supabase
        .from('sale_product_usage')
        .select(`
          product_id,
          qty_used,
          unit,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (usageError) throw usageError;

      // Calculate real usage for each product
      const productsWithRealUsage = products.map(product => {
        // Get usage data for this product
        const productUsage = usageData?.filter(usage => usage.product_id === product.id) || [];
        const totalUsed = productUsage.reduce((sum, usage) => sum + usage.qty_used, 0);
        
        // Current stock from database (whole items)
        const currentStock = product.quantity;
        const quantityRemaining = currentStock;
        
        // Calculate initial stock (current + used)
        const initialStock = currentStock + totalUsed;
        
        // Calculate usage percentages
        const usagePercentage = initialStock > 0 ? Math.round((totalUsed / initialStock) * 100) : 0;
        const remainingPercentage = 100 - usagePercentage;
        
        // Calculate items consumed vs partial usage
        const itemVolume = product.volume || 1;
        
        // For whole items tracking - how many complete items were used
        const quantityUsed = Math.floor(totalUsed / itemVolume);
        
        // Items consumed (whole items used)
        const itemsConsumed = quantityUsed;
        
        // For partial usage (remaining amount from incomplete items)
        const partialUsage = totalUsed % itemVolume;
        
        // Stock status
        const stockStatus = {
          isLowStock: currentStock <= (product.minQuantity || 20),
          isOutOfStock: currentStock === 0,
          stockLevel: currentStock,
          threshold: product.minQuantity || 20,
          alertLevel: currentStock === 0 ? 'critical' as const : 
                     currentStock <= (product.minQuantity || 20) ? 'warning' as const : 'normal' as const
        };

        return {
          ...product,
          realUsage: {
            totalUsed,
            currentStock,
            initialStock: Math.max(initialStock, currentStock), // Ensure initial is at least current
            usagePercentage: Math.max(0, Math.min(100, usagePercentage)),
            remainingPercentage: Math.max(0, Math.min(100, remainingPercentage)),
            itemsConsumed,
            partialUsage,
            quantityRemaining,
            quantityUsed,
          },
          stockStatus,
        };
      });

      return productsWithRealUsage;
    } catch (error) {
      handleError(error, 'fetch products with real usage');
      return [];
    }
  },
};

// SALE OPERATIONS
export const saleService = {
  async create(saleData: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      console.log('🛒 Creating sale with data:', saleData);

      // Start a transaction by creating the sale first
      const { data: saleResult, error: saleError } = await supabase
        .from('sales')
        .insert({
          client_id: saleData.clientId,
          staff_id: saleData.staffId,
          total_amount: saleData.totalAmount,
          payment_method: saleData.paymentMethod,
          status: saleData.status || 'completed',
          notes: saleData.notes,
        })
        .select()
        .single();

      if (saleError) {
        console.error('❌ Error creating sale:', saleError);
        throw saleError;
      }

      console.log('✅ Sale created:', saleResult);

      // Create sale item for the service itself
      if (saleData.serviceId) {
        const { error: serviceItemError } = await supabase
          .from('sale_items')
          .insert({
            sale_id: saleResult.id,
            service_id: saleData.serviceId,
            quantity: 1,
            unit_price: saleData.totalAmount,
            total_price: saleData.totalAmount,
            item_type: 'service',
          });

        if (serviceItemError) {
          console.error('❌ Error creating service sale item:', serviceItemError);
          throw serviceItemError;
        }

        console.log('✅ Service sale item created for:', saleData.serviceId);
      }

      // Create sale items for products used in the service
      if (saleData.products && saleData.products.length > 0) {
        for (const product of saleData.products) {
          if (product.productId && product.quantity > 0) {
            const { error: saleItemError } = await supabase
              .from('sale_items')
              .insert({
                sale_id: saleResult.id,
                product_id: product.productId,
                service_id: saleData.serviceId,
                quantity: product.quantity,
                unit_price: product.unitPrice || 0,
                total_price: product.totalPrice || 0,
                item_type: 'product',
              });

            if (saleItemError) {
              console.error('❌ Error creating sale item:', saleItemError);
              throw saleItemError;
            }

            console.log('✅ Sale item created for product:', product.productId);
          }
        }
      }

      // Create product usage records and update stock
      if (saleData.products && saleData.products.length > 0) {
        for (const product of saleData.products) {
          if (product.productId && product.quantity > 0) {
            // Create sale product usage record
            const { error: usageError } = await supabase
              .from('sale_product_usage')
              .insert({
                sale_id: saleResult.id,
                product_id: product.productId,
                qty_used: product.quantity,
                unit: product.unit || 'pcs',
              });

            if (usageError) {
              console.error('❌ Error creating product usage record:', usageError);
              continue;
            }

            console.log('✅ Product usage recorded for:', product.productId);

            // Note: Product stock updates are now handled by the bottle consumption service
            // The legacy quantity-based system has been replaced with bottle tracking
            console.log('✅ Product usage recorded for:', product.productId, '(stock managed by bottle consumption service)');
          }
        }
      }

      // Update client stats
      // First get current client data
      const { data: currentClient, error: clientFetchError } = await supabase
        .from('clients')
        .select('total_visits, total_spent')
        .eq('id', saleData.clientId)
        .single();

      if (!clientFetchError && currentClient) {
        const { error: clientUpdateError } = await supabase
          .from('clients')
          .update({
            total_visits: (currentClient.total_visits || 0) + 1,
            total_spent: (currentClient.total_spent || 0) + saleData.totalAmount,
            last_visit: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', saleData.clientId);

        if (clientUpdateError) {
          console.error('❌ Error updating client stats:', clientUpdateError);
        } else {
          console.log('✅ Client stats updated for:', saleData.clientId);
        }
      } else {
        console.error('❌ Error fetching client data:', clientFetchError);
      }

      // Get service info for commission calculation
      if (saleData.serviceId) {
        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .select('commission_percent')
          .eq('id', saleData.serviceId)
          .single();

        if (!serviceError && serviceData?.commission_percent > 0) {
          // Calculate and create commission
          const commissionAmount = (saleData.totalAmount * serviceData.commission_percent) / 100;
          
          const { error: commissionError } = await supabase
            .from('commissions')
            .insert({
              staff_id: saleData.staffId,
              sale_id: saleResult.id,
              service_id: saleData.serviceId,
              commission_amount: commissionAmount,
              commission_percentage: serviceData.commission_percent,
              status: 'pending',
            });

          if (commissionError) {
            console.error('❌ Error creating commission:', commissionError);
          } else {
            console.log('✅ Commission created:', commissionAmount, 'for staff:', saleData.staffId);
          }
        } else if (serviceError) {
          console.error('❌ Error fetching service data:', serviceError);
        }
      }

      const sale: Sale = {
        id: saleResult.id,
        clientId: saleResult.client_id,
        serviceId: saleData.serviceId, // Use the original serviceId from input
        staffId: saleResult.staff_id,
        products: saleData.products || [], // Use the original products from input
        totalAmount: saleResult.total_amount,
        paymentMethod: saleResult.payment_method,
        status: saleResult.status,
        notes: saleResult.notes,
        createdAt: saleResult.created_at,
      };

      console.log('✅ Sale completed successfully:', sale);
      toast.success('Sale completed successfully');
      return sale;
    } catch (error) {
      handleError(error, 'create sale');
      return null;
    }
  },

  async getAll(): Promise<Sale[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      console.log('🔍 Fetching sales from Supabase...');
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id, client_id, service_id, staff_id, products, total_amount, 
          payment_method, status, notes, created_at,
          clients(id, name, phone),
          services(id, name, price),
          users(id, name, role)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching sales:', error);
        throw error;
      }

      console.log('✅ Sales fetched successfully:', data?.length || 0);

      return data?.map(sale => ({
        id: sale.id,
        clientId: sale.client_id || '',
        serviceId: sale.service_id || '',
        staffId: sale.staff_id || '',
        products: sale.products || [],
        totalAmount: sale.total_amount || 0,
        paymentMethod: sale.payment_method || 'cash',
        status: sale.status || 'completed',
        notes: sale.notes || '',
        createdAt: sale.created_at,
      })) || [];
    } catch (error) {
      console.error('❌ Sales service error:', error);
      handleError(error, 'fetch sales');
      return [];
    }
  },

  async getByStaffId(staffId: string): Promise<Sale[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id, client_id, service_id, staff_id, products, total_amount, 
          payment_method, status, notes, created_at,
          clients(id, name, phone),
          services(id, name, price)
        `)
        .eq('staff_id', staffId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(sale => ({
        id: sale.id,
        clientId: sale.client_id,
        serviceId: sale.service_id,
        staffId: sale.staff_id,
        products: sale.products,
        totalAmount: sale.total_amount,
        paymentMethod: sale.payment_method,
        status: sale.status,
        notes: sale.notes,
        createdAt: sale.created_at,
      }));
    } catch (error) {
      handleError(error, 'fetch staff sales');
      return [];
    }
  },

  // Enhanced method for complete POS flow with multiple services
  async createCompleteSale(saleData: {
    clientId: string;
    services: Array<{
      serviceId: string;
      products: Array<{
        productId: string;
        quantity: number;
        unit: string;
      }>;
    }>;
    staffId: string;
    paymentMethod: 'cash' | 'card' | 'transfer';
    notes?: string;
  }): Promise<{ sale: Sale; receipt: any; commission: number } | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      console.log('🛒 Creating complete sale with data:', saleData);

      // Calculate total amount and validate stock
      let totalAmount = 0;
      const serviceDetails = [];
      const allProducts = [];

      // Fetch service details and calculate total
      for (const serviceItem of saleData.services) {
        const { data: service, error: serviceError } = await supabase
          .from('services')
          .select('id, name, price, commission_percent')
          .eq('id', serviceItem.serviceId)
          .single();

        if (serviceError) {
          throw new Error(`Service not found: ${serviceItem.serviceId}`);
        }

        serviceDetails.push(service);
        totalAmount += service.price;

        // Validate stock for each product
        for (const product of serviceItem.products) {
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('id, name, price, is_bottle_tracked, bottle_capacity_ml, sealed_bottles, open_bottle_remaining_ml')
            .eq('id', product.productId)
            .single();

          if (productError) {
            throw new Error(`Product not found: ${product.productId}`);
          }

          // For bottle-tracked products, validate using bottle inventory
          if (productData.is_bottle_tracked) {
            const { SimpleBottleConsumptionService } = await import('./SimpleBottleConsumptionService');
            const inventoryStatus = await SimpleBottleConsumptionService.getInventoryStatus();
            const productStatus = inventoryStatus.find(p => p.id === product.productId);
            
            const requiredMl = product.quantity; // Assuming quantity is in ml for bottle-tracked products
            
            if (!productStatus || productStatus.total_ml_available < requiredMl) {
              throw new Error(`Not enough stock for product ${productData.name}. Available: ${productStatus?.total_ml_available || 0}ml, Required: ${requiredMl}ml`);
            }
          } else {
            // For non-bottle-tracked products, we'll phase out quantity-based tracking
            console.warn(`Product ${productData.name} is not bottle-tracked. Consider migrating to bottle-based inventory.`);
          }

          allProducts.push({
            ...product,
            productData,
            serviceId: serviceItem.serviceId
          });
        }
      }

      // Start transaction by creating the main sale record
      // Use the first service as the primary service for the sale record
      const primaryServiceId = serviceDetails.length > 0 ? serviceDetails[0].id : null;
      
      if (!primaryServiceId) {
        throw new Error('At least one service is required for a sale');
      }

      const { data: saleResult, error: saleError } = await supabase
        .from('sales')
        .insert({
          client_id: saleData.clientId,
          service_id: primaryServiceId,
          staff_id: saleData.staffId,
          total_amount: totalAmount,
          payment_method: saleData.paymentMethod,
          status: 'completed',
          notes: saleData.notes || '',
        })
        .select()
        .single();

      if (saleError) {
        throw saleError;
      }

      console.log('✅ Main sale record created:', saleResult);

      // Create sale items for each service
      // Note: We need to handle the NOT NULL constraint on product_id
      // For services, we'll create entries without product_id by using the service's associated products
      for (const service of serviceDetails) {
        // Get the first product associated with this service, or create a service-only entry
        const serviceProducts = allProducts.filter(p => p.serviceId === service.id);
        
        if (serviceProducts.length > 0) {
          // If service has associated products, create entries for each
          for (const product of serviceProducts) {
            const { error: saleItemError } = await supabase
              .from('sale_items')
              .insert({
                sale_id: saleResult.id,
                product_id: product.productId,
                service_id: service.id,
                quantity: product.quantity,
                unit_price: service.price / serviceProducts.length, // Distribute service price
                total_price: service.price / serviceProducts.length,
                item_type: 'service',
              });

            if (saleItemError) {
              console.error('❌ Error creating service sale item:', saleItemError);
              throw saleItemError;
            }
          }
        } else {
          // For services without products, we need to find a way to handle this
          // Let's try to find any product to use as a placeholder
          const { data: anyProduct, error: productError } = await supabase
            .from('products')
            .select('id')
            .limit(1)
            .single();

          if (productError || !anyProduct) {
            console.error('❌ No products available for service entry');
            throw new Error('Cannot create service entry: no products available and product_id is required');
          }

          const { error: saleItemError } = await supabase
            .from('sale_items')
            .insert({
              sale_id: saleResult.id,
              product_id: anyProduct.id, // Use placeholder product
              service_id: service.id,
              quantity: 0, // Zero quantity indicates this is a service-only entry
              unit_price: service.price,
              total_price: service.price,
              item_type: 'service',
            });

          if (saleItemError) {
            console.error('❌ Error creating service sale item:', saleItemError);
            throw saleItemError;
          }
        }
      }

      // Process products: create usage records and update stock atomically
      const stockUpdates = [];
      for (const product of allProducts) {
        // Only create sale_product_usage records for non-bottle-tracked products
        // Bottle-tracked products use the bottle consumption system instead
        if (!product.productData.is_bottle_tracked) {
          const { error: usageError } = await supabase
            .from('sale_product_usage')
            .insert({
              sale_id: saleResult.id,
              product_id: product.productId,
              qty_used: product.quantity,
              unit: product.unit,
            });

          if (usageError) {
            throw usageError;
          }
        }

        // Note: Bottle consumption is now handled by ComprehensiveSalonInventoryService in POS.tsx
        // This prevents duplicate consumption calls
        stockUpdates.push({
          productId: product.productId,
          productName: product.productData.name,
          quantityUsed: product.quantity,
          unit: product.unit,
          note: 'Consumption handled by ComprehensiveSalonInventoryService'
        });

        // Note: For bottle-tracked products, consumption is already logged in product_consumption_log
        // by the SimpleBottleConsumptionService. No need for additional inventory_movements logging.
      }

      // Update client statistics
      const { data: currentClient, error: clientFetchError } = await supabase
        .from('clients')
        .select('total_visits, total_spent')
        .eq('id', saleData.clientId)
        .single();

      if (!clientFetchError && currentClient) {
        await supabase
          .from('clients')
          .update({
            total_visits: (currentClient.total_visits || 0) + 1,
            total_spent: (currentClient.total_spent || 0) + totalAmount,
            last_visit: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', saleData.clientId);
      }

      // Calculate and create commissions
      let totalCommission = 0;
      for (const service of serviceDetails) {
        if (service.commission_percent > 0) {
          const commissionAmount = (service.price * service.commission_percent) / 100;
          totalCommission += commissionAmount;

          await supabase
            .from('commissions')
            .insert({
              staff_id: saleData.staffId,
              sale_id: saleResult.id,
              service_id: service.id,
              commission_amount: commissionAmount,
              commission_percentage: service.commission_percent,
              status: 'pending',
            });
        }
      }

      // Get client details for receipt
      const { data: clientData } = await supabase
        .from('clients')
        .select('name, phone')
        .eq('id', saleData.clientId)
        .single();

      // Prepare sale object
      const sale: Sale = {
        id: saleResult.id,
        clientId: saleResult.client_id,
        serviceId: serviceDetails[0]?.id || '', // For compatibility
        staffId: saleResult.staff_id,
        products: allProducts.map(p => ({
          productId: p.productId,
          quantity: p.quantity,
          unit: p.unit,
          unitPrice: p.productData.price,
          totalPrice: p.quantity * p.productData.price,
        })),
        totalAmount: saleResult.total_amount,
        paymentMethod: saleResult.payment_method,
        status: saleResult.status,
        notes: saleResult.notes,
        createdAt: saleResult.created_at,
      };

      // Generate receipt
      const receipt = {
        saleId: saleResult.id,
        clientName: clientData?.name || 'Unknown Client',
        clientPhone: clientData?.phone || '',
        services: serviceDetails.map(s => ({
          name: s.name,
          price: s.price
        })),
        products: stockUpdates,
        totalAmount,
        paymentMethod: saleData.paymentMethod,
        date: new Date().toISOString(),
        commission: totalCommission
      };

      console.log('✅ Complete sale processed successfully');
      toast.success(`Sale completed! ${totalCommission > 0 ? `Commission: $${totalCommission.toFixed(2)}` : ''}`);

      // Clear cache
      clearCache('sales');
      clearCache('products');
      clearCache('clients');

      return { sale, receipt, commission: totalCommission };
    } catch (error) {
      console.error('❌ Error creating complete sale:', error);
      handleError(error, 'create complete sale');
      return null;
    }
  },

  // Get detailed sale information with all related data
  async getById(saleId: string): Promise<{
    sale: Sale;
    client: Client;
    services: Service[];
    products: Array<{
      product: Product;
      quantityUsed: number;
      unit: string;
    }>;
    commission: number;
  } | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }

    try {
      // Get main sale record
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select('*')
        .eq('id', saleId)
        .single();

      if (saleError) {
        throw saleError;
      }

      // Get client data
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', saleData.client_id)
        .single();

      if (clientError) {
        throw clientError;
      }

      // Get sale items (services)
      const { data: saleItems, error: saleItemsError } = await supabase
        .from('sale_items')
        .select(`
          *,
          services(*)
        `)
        .eq('sale_id', saleId)
        .eq('item_type', 'service');

      if (saleItemsError) {
        throw saleItemsError;
      }

      // Get product usage
      const { data: productUsage, error: productUsageError } = await supabase
        .from('sale_product_usage')
        .select(`
          *,
          products(*)
        `)
        .eq('sale_id', saleId);

      if (productUsageError) {
        throw productUsageError;
      }

      // Get commissions
      const { data: commissions } = await supabase
        .from('commissions')
        .select('commission_amount')
        .eq('sale_id', saleId);

      const totalCommission = commissions?.reduce((sum, c) => sum + c.commission_amount, 0) || 0;

      // Format response
      const sale: Sale = {
        id: saleData.id,
        clientId: saleData.client_id,
        serviceId: saleItems[0]?.service_id || '',
        staffId: saleData.staff_id,
        products: productUsage?.map(pu => ({
          productId: pu.product_id,
          quantity: pu.qty_used,
          unit: pu.unit,
          unitPrice: pu.products?.price || 0,
          totalPrice: pu.qty_used * (pu.products?.price || 0),
        })) || [],
        totalAmount: saleData.total_amount,
        paymentMethod: saleData.payment_method,
        status: saleData.status,
        notes: saleData.notes,
        createdAt: saleData.created_at,
      };

      const client: Client = {
        id: clientData.id,
        name: clientData.name,
        phone: clientData.phone || '',
        email: clientData.email || '',
        notes: clientData.notes || '',
        lastVisit: clientData.last_visit,
        totalVisits: clientData.total_visits || 0,
        totalSpent: clientData.total_spent || 0,
        createdAt: clientData.created_at,
        updatedAt: clientData.updated_at,
      };

      const services: Service[] = saleItems?.map(si => ({
        id: si.services.id,
        name: si.services.name,
        nameAr: si.services.name_ar,
        nameFr: si.services.name_fr,
        description: si.services.description,
        price: si.services.price,
        duration: si.services.duration,
        category: si.services.category,
        commissionPercent: si.services.commission_percent,
        isActive: si.services.is_active,
        requiredProducts: si.services.required_products || [],
        assignedStaff: si.services.assigned_staff || [],
        createdAt: si.services.created_at,
        updatedAt: si.services.updated_at,
      })) || [];

      const products = productUsage?.map(pu => ({
        product: {
          id: pu.products.id,
          name: pu.products.name,
          category: pu.products.category,
          volume: pu.products.volume,
          unit: pu.products.unit,
          quantity: pu.products.quantity,
          minQuantity: pu.products.min_quantity,
          price: pu.products.price,
          cost: pu.products.cost,
          isActive: pu.products.is_active,
          createdAt: pu.products.created_at,
          updatedAt: pu.products.updated_at,
        },
        quantityUsed: pu.qty_used,
        unit: pu.unit,
      })) || [];

      return {
        sale,
        client,
        services,
        products,
        commission: totalCommission,
      };
    } catch (error) {
      handleError(error, 'fetch sale details');
      return null;
    }
  },

  async getRecentSales(limit: number = 10): Promise<Array<{
    id: string;
    clientName: string;
    serviceName: string;
    total: number;
    createdAt: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          total_amount,
          created_at,
          clients!inner(name),
          sale_items!inner(
            services!inner(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map(sale => ({
        id: sale.id,
        clientName: sale.clients.name,
        serviceName: sale.sale_items[0]?.services?.name || 'Unknown Service',
        total: sale.total_amount,
        createdAt: sale.created_at
      })) || [];
    } catch (error) {
      console.error('Error getting recent sales:', error);
      return [];
    }
  },
};

// DASHBOARD STATS
export const dashboardService = {
  async getStats(): Promise<DashboardStats | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      console.log('🔍 Fetching dashboard stats from Supabase...');
      
      // Fetch all stats from database with better error handling using admin client
      const [clientsResult, servicesResult, productsResult, salesResult] = await Promise.all([
        executeAdminQuery(client => client.from('clients').select('*')).then(result => {
          console.log('📊 Clients query result:', result);
          return result;
        }),
        executeAdminQuery(client => client.from('services').select('*')).then(result => {
          console.log('📊 Services query result:', result);
          return result;
        }),
        executeAdminQuery(client => client.from('products').select('*')).then(result => {
          console.log('📊 Products query result:', result);
          return result;
        }),
        executeAdminQuery(client => client.from('sales').select('*').order('created_at', { ascending: false }).limit(5)).then(result => {
          console.log('📊 Sales query result:', result);
          return result;
        }),
      ]);

      // Check for errors with detailed logging
      if (clientsResult.error) {
        console.error('❌ Clients query error:', clientsResult.error);
        throw new Error(`Failed to fetch clients: ${clientsResult.error.message}`);
      }
      if (servicesResult.error) {
        console.error('❌ Services query error:', servicesResult.error);
        throw new Error(`Failed to fetch services: ${servicesResult.error.message}`);
      }
      if (productsResult.error) {
        console.error('❌ Products query error:', productsResult.error);
        throw new Error(`Failed to fetch products: ${productsResult.error.message}`);
      }
      if (salesResult.error) {
        console.error('❌ Sales query error:', salesResult.error);
        throw new Error(`Failed to fetch sales: ${salesResult.error.message}`);
      }

      console.log('✅ All dashboard queries successful');
      console.log(`📈 Found: ${clientsResult.data?.length || 0} clients, ${servicesResult.data?.length || 0} services, ${productsResult.data?.length || 0} products, ${salesResult.data?.length || 0} sales`);

      const totalSales = salesResult.data?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
      const totalClients = clientsResult.data?.length || 0;
      const totalServices = servicesResult.data?.length || 0;
      const totalProducts = productsResult.data?.length || 0;

      const recentSales = salesResult.data?.map(sale => ({
        service: servicesResult.data?.find(s => s.id === sale.service_id)?.name || 'Unknown Service',
        amount: sale.total_amount || 0,
        date: sale.created_at ? sale.created_at.split('T')[0] : 'Unknown Date',
      })) || [];

      const lowStockAlerts = productsResult.data
        ?.filter(product => product.quantity <= (product.min_quantity || 0))
        ?.map(product => ({
          product: product.name || 'Unknown Product',
          quantity: product.quantity || 0,
          minQuantity: product.min_quantity || 0,
        })) || [];

      // Get top services data from both new format (sale_items) and old format (sales table)
      
      // First, try to get data from sale_items table (new format)
      const { data: saleItemsData, error: saleItemsError } = await supabase
        .from('sale_items')
        .select(`
          service_id,
          quantity,
          total_price,
          services(name)
        `)
        .eq('item_type', 'service');

      // Also get data from sales table (old format) for backward compatibility
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          service_id,
          total_amount,
          services(name)
        `)
        .not('service_id', 'is', null);

      if (saleItemsError) {
        console.error('❌ Error fetching sale items:', saleItemsError);
      }
      
      if (salesError) {
        console.error('❌ Error fetching sales:', salesError);
      }

      console.log('📊 Sale items data:', saleItemsData?.length || 0, 'records');
      console.log('📊 Sales data:', salesData?.length || 0, 'records');

      const serviceStats = new Map();
      
      // Process sale_items data (new format)
      saleItemsData?.forEach(item => {
        const serviceId = item.service_id;
        const serviceName = item.services?.name || 'Unknown Service';
        if (!serviceStats.has(serviceId)) {
          serviceStats.set(serviceId, {
            name: serviceName,
            sales: 0,
            revenue: 0
          });
        }
        const stats = serviceStats.get(serviceId);
        stats.sales += item.quantity || 1;
        stats.revenue += item.total_price || 0;
      });

      // Process sales data (old format) - each sale counts as 1 service sale
      salesData?.forEach(sale => {
        const serviceId = sale.service_id;
        const serviceName = sale.services?.name || 'Unknown Service';
        if (!serviceStats.has(serviceId)) {
          serviceStats.set(serviceId, {
            name: serviceName,
            sales: 0,
            revenue: 0
          });
        }
        const stats = serviceStats.get(serviceId);
        stats.sales += 1; // Each sale is 1 service
        stats.revenue += sale.total_amount || 0;
      });

      const topServices = Array.from(serviceStats.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      console.log('🏆 Top Services calculated:', topServices);
      console.log('📊 Service stats map size:', serviceStats.size);

      // Get top clients data
      const topClientsData = clientsResult.data
        ?.filter(client => client.total_spent > 0)
        ?.sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
        ?.slice(0, 5)
        ?.map(client => ({
          name: client.name || 'Unknown Client',
          visits: client.total_visits || 0,
          totalSpent: client.total_spent || 0
        })) || [];

      // Get staff sales data
      const { data: staffSalesData } = await supabase
        .from('sales')
        .select(`
          staff_id,
          total_amount,
          users(name)
        `);

      const staffStats = new Map();
      staffSalesData?.forEach(sale => {
        const staffId = sale.staff_id;
        const staffName = sale.users?.name || 'Unknown Staff';
        if (!staffStats.has(staffId)) {
          staffStats.set(staffId, {
            staff: staffName,
            sales: 0,
            revenue: 0
          });
        }
        const stats = staffStats.get(staffId);
        stats.sales += 1;
        stats.revenue += sale.total_amount || 0;
      });

      const staffSales = Array.from(staffStats.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const stats = {
        totalSales,
        totalClients,
        totalServices,
        totalProducts,
        recentSales,
        topServices,
        topClients: topClientsData,
        lowStockAlerts,
        serviceSales: [], // Legacy field, can be removed
        staffSales,
      };

      console.log('✅ Dashboard stats compiled successfully:', stats);
      console.log('🔍 Top Services in final stats:', stats.topServices);
      console.log('📊 Top Services length:', stats.topServices?.length || 0);
      return stats;
    } catch (error) {
      console.error('❌ Dashboard service error:', error);
      // Don't use handleError here as it shows toast, just throw the error
      throw error;
    }
  },
};

// STAFF OPERATIONS
// BOOKING OPERATIONS
export const bookingService = {
  async getAll(): Promise<any[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          clients(name, phone),
          services(name, price, duration),
          users(name)
        `)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      
      // Map database fields to frontend expected format
      const mappedData = (data || []).map(commission => ({
        ...commission,
        commissionPercentage: commission.commission_percentage,
        commissionAmount: commission.commission_amount,
        createdAt: commission.created_at,
        paidAt: commission.paid_at
      }));

      return mappedData;
    } catch (error) {
      handleError(error, 'fetch bookings');
      return [];
    }
  },

  async create(bookingData: any): Promise<any | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          client_id: bookingData.clientId,
          service_id: bookingData.serviceId,
          staff_id: bookingData.staffId,
          date: bookingData.date,
          time: bookingData.time,
          duration: bookingData.duration,
          start_at: bookingData.startAt,
          end_at: bookingData.endAt,
          status: bookingData.status || 'pending',
          notes: bookingData.notes,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Booking created successfully');
      return data;
    } catch (error) {
      handleError(error, 'create booking');
      return null;
    }
  },

  async update(id: string, bookingData: any): Promise<any | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          ...bookingData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Booking updated successfully');
      return data;
    } catch (error) {
      handleError(error, 'update booking');
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Booking deleted successfully');
      return true;
    } catch (error) {
      handleError(error, 'delete booking');
      return false;
    }
  },
};

// COMMISSION OPERATIONS
export const commissionService = {
  async getAll(): Promise<any[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const { data, error } = await supabase
        .from('commissions')
        .select(`
          *,
          users(id, name, email, role),
          sales(id, total_amount, created_at, payment_method, status),
          services(id, name, price, commission_percent)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map database fields to frontend expected format
      const mappedData = (data || []).map(commission => ({
        ...commission,
        commissionPercentage: commission.commission_percentage || 0,
        commissionAmount: commission.commission_amount || 0,
        createdAt: commission.created_at,
        paidAt: commission.paid_at
      }));
      
      return mappedData;
    } catch (error) {
      handleError(error, 'fetch commissions');
      return [];
    }
  },

  async getByStaffId(staffId: string): Promise<any[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const { data, error } = await supabase
        .from('commissions')
        .select(`
          *,
          sales(id, total_amount, created_at, payment_method, status),
          services(id, name, price, commission_percent)
        `)
        .eq('staff_id', staffId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map database fields to frontend expected format
      const mappedData = (data || []).map(commission => ({
        ...commission,
        commissionPercentage: commission.commission_percentage || 0,
        commissionAmount: commission.commission_amount || 0,
        createdAt: commission.created_at,
        paidAt: commission.paid_at
      }));
      
      return mappedData;
    } catch (error) {
      handleError(error, 'fetch staff commissions');
      return [];
    }
  },

  async getByDateRange(startDate: string, endDate: string, staffId?: string): Promise<any[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      let query = supabase
        .from('commissions')
        .select(`
          *,
          users(id, name, email, role),
          sales(id, total_amount, created_at, payment_method, status),
          services(id, name, price, commission_percent)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (staffId) {
        query = query.eq('staff_id', staffId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map database fields to frontend expected format
      const mappedData = (data || []).map(commission => ({
        ...commission,
        commissionPercentage: commission.commission_percentage || 0,
        commissionAmount: commission.commission_amount || 0,
        createdAt: commission.created_at,
        paidAt: commission.paid_at
      }));
      
      return mappedData;
    } catch (error) {
      handleError(error, 'fetch commissions by date range');
      return [];
    }
  },

  async getCommissionStats(staffId?: string): Promise<{
    totalCommissions: number;
    paidCommissions: number;
    pendingCommissions: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    thisMonthCommissions: number;
    thisMonthAmount: number;
    averageCommissionRate: number;
  }> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      let data;
      if (staffId) {
        data = await executeAdminQuery('commissions', 'select', '*', { staff_id: staffId });
      } else {
        data = await executeAdminQuery('commissions', 'select', '*');
      }

      const commissions = data || [];
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats = {
        totalCommissions: commissions.length,
        paidCommissions: commissions.filter(c => c.status === 'paid').length,
        pendingCommissions: commissions.filter(c => c.status === 'pending').length,
        totalAmount: commissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0),
        paidAmount: commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.commission_amount || 0), 0),
        pendingAmount: commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.commission_amount || 0), 0),
        thisMonthCommissions: commissions.filter(c => new Date(c.created_at) >= thisMonthStart).length,
        thisMonthAmount: commissions.filter(c => new Date(c.created_at) >= thisMonthStart).reduce((sum, c) => sum + (c.commission_amount || 0), 0),
        averageCommissionRate: commissions.length > 0 ? commissions.reduce((sum, c) => sum + (c.commission_percentage || 0), 0) / commissions.length : 0,
      };

      return stats;
    } catch (error) {
      handleError(error, 'fetch commission stats');
      return {
        totalCommissions: 0,
        paidCommissions: 0,
        pendingCommissions: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        thisMonthCommissions: 0,
        thisMonthAmount: 0,
        averageCommissionRate: 0,
      };
    }
  },

  async markAsPaid(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const { error } = await supabase
        .from('commissions')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Commission marked as paid');
      clearCache('commissions');
      return true;
    } catch (error) {
      handleError(error, 'mark commission as paid');
      return false;
    }
  },

  async markMultipleAsPaid(ids: string[]): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const { error } = await supabase
        .from('commissions')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .in('id', ids);

      if (error) throw error;

      toast.success(`${ids.length} commissions marked as paid`);
      clearCache('commissions');
      return true;
    } catch (error) {
      handleError(error, 'mark multiple commissions as paid');
      return false;
    }
  },

  async cancelCommission(id: string, reason?: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const { error } = await supabase
        .from('commissions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Commission cancelled');
      clearCache('commissions');
      return true;
    } catch (error) {
      handleError(error, 'cancel commission');
      return false;
    }
  },

  async calculateCommission(saleAmount: number, serviceId: string, staffId: string): Promise<{
    percentage: number;
    amount: number;
  }> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      // Get service commission percentage
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('commission_percent')
        .eq('id', serviceId)
        .single();

      if (serviceError) throw serviceError;

      const percentage = service?.commission_percent || 0;
      const amount = (saleAmount * percentage) / 100;

      return { percentage, amount };
    } catch (error) {
      handleError(error, 'calculate commission');
      return { percentage: 0, amount: 0 };
    }
  },

  async createCommission(commissionData: {
    staffId: string;
    saleId: string;
    serviceId: string;
    commissionPercentage: number;
    commissionAmount: number;
  }): Promise<any | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const { data, error } = await supabase
        .from('commissions')
        .insert({
          staff_id: commissionData.staffId,
          sale_id: commissionData.saleId,
          service_id: commissionData.serviceId,
          commission_percentage: commissionData.commissionPercentage,
          commission_amount: commissionData.commissionAmount,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      clearCache('commissions');
      return data;
    } catch (error) {
      handleError(error, 'create commission');
      return null;
    }
  },

  async getStaffCommissionSummary(staffId: string, year?: number): Promise<{
    monthlyData: Array<{
      month: string;
      totalCommissions: number;
      totalAmount: number;
      paidAmount: number;
      pendingAmount: number;
    }>;
    yearlyTotal: {
      totalCommissions: number;
      totalAmount: number;
      paidAmount: number;
      pendingAmount: number;
    };
  }> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const currentYear = year || new Date().getFullYear();
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;

      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .eq('staff_id', staffId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const commissions = data || [];
      const monthlyData = [];
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      for (let i = 0; i < 12; i++) {
        const monthCommissions = commissions.filter(c => {
          const commissionDate = new Date(c.created_at);
          return commissionDate.getMonth() === i;
        });

        monthlyData.push({
          month: months[i],
          totalCommissions: monthCommissions.length,
          totalAmount: monthCommissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0),
          paidAmount: monthCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.commission_amount || 0), 0),
          pendingAmount: monthCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.commission_amount || 0), 0),
        });
      }

      const yearlyTotal = {
        totalCommissions: commissions.length,
        totalAmount: commissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0),
        paidAmount: commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.commission_amount || 0), 0),
        pendingAmount: commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.commission_amount || 0), 0),
      };

      return { monthlyData, yearlyTotal };
    } catch (error) {
      handleError(error, 'fetch staff commission summary');
      return {
        monthlyData: [],
        yearlyTotal: { totalCommissions: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0 }
      };
    }
  },
};

// Simple password hashing utility (for production, use bcrypt)
const hashPassword = async (password: string): Promise<string> => {
  // Simple hash for demo - in production use bcrypt
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt123'); // Add salt
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  const hashedInput = await hashPassword(password);
  return hashedInput === hashedPassword;
};

// DATABASE AUTHENTICATION OPERATIONS
export const authService = {
  async signIn(email: string, password: string): Promise<any | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      console.log('🔍 Attempting login for email:', email);
      
      // Find user by email
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      console.log('👤 User query result:', { user, error });

      if (error || !user) {
        console.log('❌ User not found or error:', error);
        throw new Error('Invalid email or password');
      }

      // Verify password
      const hashedInput = await hashPassword(password);
      console.log('🔐 Password verification:', {
        inputPassword: password,
        hashedInput,
        storedHash: user.password,
        match: hashedInput === user.password
      });
      
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        console.log('❌ Password verification failed');
        throw new Error('Invalid email or password');
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      toast.success('Login successful');
      return userWithoutPassword;
    } catch (error) {
      handleError(error, 'sign in');
      return null;
    }
  },

  async signUp(email: string, password: string, name: string, role: 'admin' | 'staff' = 'staff'): Promise<any | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          email: email,
          password: hashedPassword,
          name: name,
          role: role,
        })
        .select()
        .single();

      if (userError) {
        console.error('❌ Error creating user:', userError);
        throw new Error('Failed to create user account');
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = userData;
      toast.success('User account created successfully');
      return userWithoutPassword;
    } catch (error) {
      handleError(error, 'create user account');
      return null;
    }
  },

  async updateUserRole(userId: string, role: 'admin' | 'staff'): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      toast.success('User role updated successfully');
      return true;
    } catch (error) {
      handleError(error, 'update user role');
      return false;
    }
  },

  async updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const hashedPassword = await hashPassword(newPassword);
      
      const { error } = await supabase
        .from('users')
        .update({ password: hashedPassword, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Password updated successfully');
      return true;
    } catch (error) {
      handleError(error, 'update password');
      return false;
    }
  },

  async getUserProfile(userId: string): Promise<any | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, role, phone, avatar, created_at, last_login, updated_at')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'fetch user profile');
      return null;
    }
  },

  async getAllUsers(): Promise<any[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, role, phone, avatar, created_at, last_login, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'fetch users');
      return [];
    }
  },
};

export const stockHistoryService = {
  async logMovement(data: {
    productId: string;
    movementType: 'sale' | 'restock' | 'adjustment' | 'return';
    quantityChange: number;
    referenceId?: string;
    notes?: string;
    createdBy?: string;
  }): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }

    try {
      const { error } = await supabase
        .from('inventory_movements')
        .insert({
          product_id: data.productId,
          movement_type: data.movementType,
          quantity_change: data.quantityChange,
          reference_id: data.referenceId,
          notes: data.notes,
          created_by: data.createdBy,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.warn('⚠️ Could not log inventory movement:', error);
      return false;
    }
  },

  async getProductUsage(productId: string, startDate?: string, endDate?: string): Promise<{
    totalUsed: number;
    movements: any[];
  }> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }

    try {
      let query = supabase
        .from('inventory_movements')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const totalUsed = data
        ?.filter(m => m.movement_type === 'sale')
        .reduce((sum, m) => sum + Math.abs(m.quantity_change), 0) || 0;

      return {
        totalUsed,
        movements: data || []
      };
    } catch (error) {
      handleError(error, 'fetch product usage');
      return { totalUsed: 0, movements: [] };
    }
  },

  async getUsageReport(startDate: string, endDate: string): Promise<Array<{
    productId: string;
    productName: string;
    totalUsed: number;
    remainingStock: number;
    salesCount: number;
  }>> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }

    try {
      // Get all products with their current stock
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, quantity');

      if (productsError) throw productsError;

      // Get usage data for the period
      const { data: movements, error: movementsError } = await supabase
        .from('inventory_movements')
        .select('product_id, quantity_change, movement_type, reference_id')
        .eq('movement_type', 'sale')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (movementsError) throw movementsError;

      // Aggregate usage by product
      const usageMap = new Map();
      const salesCountMap = new Map();

      movements?.forEach(movement => {
        const productId = movement.product_id;
        const used = Math.abs(movement.quantity_change);
        
        usageMap.set(productId, (usageMap.get(productId) || 0) + used);
        
        if (movement.reference_id) {
          const salesSet = salesCountMap.get(productId) || new Set();
          salesSet.add(movement.reference_id);
          salesCountMap.set(productId, salesSet);
        }
      });

      // Combine with product data
      return products?.map(product => ({
        productId: product.id,
        productName: product.name,
        totalUsed: usageMap.get(product.id) || 0,
        remainingStock: product.quantity || 0,
        salesCount: salesCountMap.get(product.id)?.size || 0
      })) || [];

    } catch (error) {
      handleError(error, 'fetch usage report');
      return [];
    }
  }
};

export const staffService = {
  async getAll(): Promise<any[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, phone, avatar, role, created_at, last_login')
        .eq('role', 'staff')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'fetch staff');
      return [];
    }
  },

  async create(staffData: any): Promise<any | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          ...staffData,
          role: 'staff',
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Staff member added successfully');
      return data;
    } catch (error) {
      handleError(error, 'add staff');
      return null;
    }
  },
};
