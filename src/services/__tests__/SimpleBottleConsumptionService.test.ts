import { SimpleBottleConsumptionService } from '../SimpleBottleConsumptionService';
import { supabase } from '../../lib/supabaseClient';

// Mock Supabase
jest.mock('@/lib/supabaseClient');
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('SimpleBottleConsumptionService', () => {
  let service: SimpleBottleConsumptionService;

  beforeEach(() => {
    service = new SimpleBottleConsumptionService();
    jest.clearAllMocks();
  });

  describe('processProductUsage', () => {
    it('processes single product usage correctly', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Shampoing Premium',
          currentStock: 100,
          minStock: 10,
          maxStock: 200,
          unit: 'ml',
        }
      ];

      const mockUsageData = [
        {
          productId: 'product-1',
          quantityUsed: 25,
          serviceId: 'service-1',
          clientId: 'client-1',
          staffId: 'staff-1',
        }
      ];

      // Mock product fetch
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: mockProducts,
            error: null,
          }),
        }),
      } as any);

      // Mock stock update
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ ...mockProducts[0], currentStock: 75 }],
            error: null,
          }),
        }),
      } as any);

      // Mock usage history insert
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          data: [{ id: 'usage-1', ...mockUsageData[0] }],
          error: null,
        }),
      } as any);

      const result = await service.processProductUsage(mockUsageData);

      expect(result.success).toBe(true);
      expect(result.updatedProducts).toHaveLength(1);
      expect(result.updatedProducts[0].currentStock).toBe(75);
    });

    it('handles insufficient stock correctly', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Shampoing Premium',
          currentStock: 10,
          minStock: 5,
          maxStock: 200,
          unit: 'ml',
        }
      ];

      const mockUsageData = [
        {
          productId: 'product-1',
          quantityUsed: 15, // More than available stock
          serviceId: 'service-1',
          clientId: 'client-1',
          staffId: 'staff-1',
        }
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: mockProducts,
            error: null,
          }),
        }),
      } as any);

      const result = await service.processProductUsage(mockUsageData);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Insufficient stock for Shampoing Premium. Available: 10ml, Required: 15ml');
    });

    it('processes multiple products correctly', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Shampoing',
          currentStock: 100,
          minStock: 10,
          maxStock: 200,
          unit: 'ml',
        },
        {
          id: 'product-2',
          name: 'Conditioner',
          currentStock: 80,
          minStock: 15,
          maxStock: 150,
          unit: 'ml',
        }
      ];

      const mockUsageData = [
        {
          productId: 'product-1',
          quantityUsed: 30,
          serviceId: 'service-1',
          clientId: 'client-1',
          staffId: 'staff-1',
        },
        {
          productId: 'product-2',
          quantityUsed: 20,
          serviceId: 'service-1',
          clientId: 'client-1',
          staffId: 'staff-1',
        }
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: mockProducts,
            error: null,
          }),
        }),
      } as any);

      // Mock multiple stock updates
      mockSupabase.from
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{ ...mockProducts[0], currentStock: 70 }],
              error: null,
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{ ...mockProducts[1], currentStock: 60 }],
              error: null,
            }),
          }),
        } as any);

      // Mock usage history inserts
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          data: mockUsageData.map((usage, index) => ({ id: `usage-${index + 1}`, ...usage })),
          error: null,
        }),
      } as any);

      const result = await service.processProductUsage(mockUsageData);

      expect(result.success).toBe(true);
      expect(result.updatedProducts).toHaveLength(2);
      expect(result.updatedProducts[0].currentStock).toBe(70);
      expect(result.updatedProducts[1].currentStock).toBe(60);
    });

    it('detects low stock warnings', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Shampoing',
          currentStock: 20,
          minStock: 15,
          maxStock: 200,
          unit: 'ml',
        }
      ];

      const mockUsageData = [
        {
          productId: 'product-1',
          quantityUsed: 10, // Will bring stock to 10, below minStock of 15
          serviceId: 'service-1',
          clientId: 'client-1',
          staffId: 'staff-1',
        }
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: mockProducts,
            error: null,
          }),
        }),
      } as any);

      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ ...mockProducts[0], currentStock: 10 }],
            error: null,
          }),
        }),
      } as any);

      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          data: [{ id: 'usage-1', ...mockUsageData[0] }],
          error: null,
        }),
      } as any);

      const result = await service.processProductUsage(mockUsageData);

      expect(result.success).toBe(true);
      expect(result.lowStockWarnings).toContain('Shampoing is running low (10ml remaining, minimum: 15ml)');
    });

    it('handles database errors gracefully', async () => {
      const mockUsageData = [
        {
          productId: 'product-1',
          quantityUsed: 25,
          serviceId: 'service-1',
          clientId: 'client-1',
          staffId: 'staff-1',
        }
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed', code: '500' },
          }),
        }),
      } as any);

      const result = await service.processProductUsage(mockUsageData);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to fetch product information');
    });
  });

  describe('getUsageHistory', () => {
    it('retrieves usage history for a date range', async () => {
      const mockHistory = [
        {
          id: 'usage-1',
          productId: 'product-1',
          quantityUsed: 25,
          serviceId: 'service-1',
          clientId: 'client-1',
          staffId: 'staff-1',
          createdAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 'usage-2',
          productId: 'product-1',
          quantityUsed: 30,
          serviceId: 'service-2',
          clientId: 'client-2',
          staffId: 'staff-1',
          createdAt: '2024-01-16T14:00:00Z',
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockHistory,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await service.getUsageHistory('2024-01-15', '2024-01-16');

      expect(result).toEqual(mockHistory);
      expect(mockSupabase.from).toHaveBeenCalledWith('product_usage');
    });

    it('filters usage history by product', async () => {
      const mockHistory = [
        {
          id: 'usage-1',
          productId: 'product-1',
          quantityUsed: 25,
          serviceId: 'service-1',
          clientId: 'client-1',
          staffId: 'staff-1',
          createdAt: '2024-01-15T10:00:00Z',
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockHistory,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      const result = await service.getUsageHistory('2024-01-15', '2024-01-16', 'product-1');

      expect(result).toEqual(mockHistory);
      expect(mockSupabase.from).toHaveBeenCalledWith('product_usage');
    });
  });

  describe('getLowStockProducts', () => {
    it('identifies products with low stock', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Shampoing',
          currentStock: 5,
          minStock: 10,
          maxStock: 200,
          unit: 'ml',
        },
        {
          id: 'product-2',
          name: 'Conditioner',
          currentStock: 50,
          minStock: 15,
          maxStock: 150,
          unit: 'ml',
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lt: jest.fn().mockResolvedValue({
            data: [mockProducts[0]], // Only the low stock product
            error: null,
          }),
        }),
      } as any);

      const result = await service.getLowStockProducts();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Shampoing');
      expect(result[0].currentStock).toBeLessThan(result[0].minStock);
    });
  });
});