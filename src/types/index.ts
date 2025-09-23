export interface User {
  id: string;
  email: string;
  role: 'admin' | 'staff';
  name: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  lastVisit?: string;
  totalVisits: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  nameAr?: string;
  nameFr?: string;
  description?: string;
  price: number;
  duration: number; // in minutes
  category: string;
  commissionPercent?: number; // commission percentage for staff
  isActive: boolean;
  requiredProducts: ServiceProduct[];
  assignedStaff: string[]; // staff IDs
  createdAt: string;
  updatedAt: string;
}

export interface ServiceProduct {
  productId: string;
  requiredMl: number; // Required ml for this service
  isOptional?: boolean; // Whether this product is optional for the service
  unit?: string; // DEPRECATED - always ml for bottle-based system
  quantity?: number; // DEPRECATED - use requiredMl instead
}

export interface Product {
  id: string;
  brand: string;
  name: string;
  category: string;
  volume: number; // Keep for backward compatibility with bottle_capacity_ml
  unit: string; // ml, g, pieces, etc.
  
  // NEW BOTTLE-BASED INVENTORY FIELDS (Primary)
  sealed_bottles: number; // Number of unopened bottles in stock
  open_bottle_remaining_ml: number; // Remaining ml in current open bottle (only one allowed)
  bottle_capacity_ml: number; // Capacity of one full bottle in ml
  
  // Calculated fields
  total_ml_available?: number; // (sealed_bottles * bottle_capacity_ml) + open_bottle_remaining_ml
  stock_status?: 'good' | 'low' | 'critical' | 'out'; // Calculated based on stock levels
  
  // Legacy fields (for backward compatibility - will be ignored in new logic)
  quantity?: number; // DEPRECATED - use sealed_bottles instead
  totalQuantity?: number; // DEPRECATED - use total_ml_available instead
  minQuantity: number; // alert threshold for sealed bottles
  minThreshold?: number; // DEPRECATED - use minQuantity instead
  
  price: number;
  cost: number;
  isActive: boolean;
  imageUrl?: string;
  archived?: boolean;
  
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  clientId: string;
  serviceId: string;
  staffId: string;
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  startAt: string; // timestamp with time zone
  endAt: string;   // timestamp with time zone
}

export interface Sale {
  id: string;
  clientId: string;
  serviceId: string;
  staffId: string;
  products: SaleProduct[];
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  status: 'completed' | 'refunded';
  notes?: string;
  createdAt: string;
}

export interface SaleProduct {
  productId: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  totalPrice: number;
}

export interface StaffCommission {
  id: string;
  staffId: string;
  serviceId: string;
  commissionPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionEarning {
  id: string;
  staffId: string;
  saleId: string;
  amount: number;
  percentage: number;
  date: string;
}

export interface DashboardStats {
  totalSales: number;
  totalClients: number;
  totalServices: number;
  totalProducts: number;
  recentSales: Array<{
    service: string;
    amount: number;
    date: string;
  }>;
  topServices: Array<{ name: string; sales: number; revenue: number }>;
  topClients: Array<{ name: string; visits: number; totalSpent: number }>;
  lowStockAlerts: Array<{ product: string; quantity: number; minQuantity: number }>;
  serviceSales: Array<{ service: string; sales: number; revenue: number }>;
  staffSales: Array<{ staff: string; sales: number; revenue: number }>;
}

export interface Language {
  code: 'en' | 'ar' | 'fr';
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AppSettings {
  salonName: string;
  salonNameAr: string;
  salonNameFr: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  timezone: string;
  workingHours: {
    [key: string]: { open: string; close: string; isOpen: boolean };
  };
}

// Enhanced types for new database schema
export interface ServiceProductRelationship {
  id: string;
  serviceId: string;
  productId: string;
  defaultQty: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  serviceId?: string; // Optional foreign key to services
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemType?: string;  // 'product' or 'service'
  createdAt: string;
}

export interface SaleProductUsage {
  id: string;
  saleId: string;
  productId: string;
  qtyUsed: number;
  unit: string;
  createdAt: string;
}

export interface Commission {
  id: string;
  staffId: string;
  saleId: string;
  serviceId: string;
  commissionPercentage: number;
  commissionAmount: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
  paidAt?: string;
}

export interface StockHistory {
  id: string;
  productId: string;
  saleId?: string;
  staffId?: string;
  movementType: 'sale' | 'adjustment' | 'restock' | 'return';
  quantityBefore: number;
  quantityChange: number;
  quantityAfter: number;
  reason?: string;
  createdAt: string;
}

export interface SaleResult {
  sale: Sale;
  commission?: Commission;
  stockUpdates: StockHistory[];
}

// Bottle tracking interfaces
export interface BottleInventory {
  id: string;
  productId: string;
  sealedBottlesCount: number;
  openBottleRemainingMl: number;
  totalMlAvailable: number; // Calculated field
  lastUpdated: string;
}

export interface BottleMovement {
  id: string;
  productId: string;
  movementType: 'open_bottle' | 'consume_ml' | 'add_bottles' | 'adjust_open_bottle';
  sealedBottlesBefore: number;
  sealedBottlesAfter: number;
  openBottleMlBefore: number;
  openBottleMlAfter: number;
  mlConsumed?: number;
  bottlesAdded?: number;
  reason: string;
  saleId?: string;
  staffId?: string;
  createdAt: string;
}

export interface BottleConsumptionRequest {
  productId: string;
  mlRequested: number;
  reason: string;
  saleId?: string;
  staffId?: string;
}

export interface BottleConsumptionResult {
  success: boolean;
  mlConsumed: number;
  bottlesOpened: number;
  remainingMl: number;
  sealedBottlesRemaining: number;
  movements: BottleMovement[];
  error?: string;
}
