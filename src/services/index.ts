// ============================================================================
// SIMPLE BOTTLE CONSUMPTION SERVICE
// ============================================================================
// This is the ONLY consumption service that should be used throughout the application.
// Implements the exact consumption logic as specified:
// - Track stock only in milliliters, not by counting open bottles
// - Always consume from open bottle first, then open sealed bottles only when necessary
// - Update product stock and logs consistently
// ============================================================================

export { SimpleBottleConsumptionService } from './SimpleBottleConsumptionService';
export type {
  ConsumptionRequest,
  ConsumptionResult,
  ProductInventoryStatus
} from './SimpleBottleConsumptionService';

// Re-export for backward compatibility
export { SimpleBottleConsumptionService as BottleInventoryService } from './SimpleBottleConsumptionService';
export { SimpleBottleConsumptionService as UnifiedBottleConsumptionService } from './SimpleBottleConsumptionService';

// Database service
export * from './database';
