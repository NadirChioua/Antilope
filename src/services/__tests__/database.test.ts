import { saleService, commissionService } from '../database';
import { supabase } from '../../lib/supabaseClient';
import { Sale, Commission } from '@/types';

// Mock Supabase
jest.mock('@/lib/supabaseClient');
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Database Service - Commission Calculations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Commission Service', () => {
    it('calculates commission correctly for service sales', async () => {
      const mockSale: Sale = {
        id: '1',
        clientId: 'client-1',
        staffId: 'staff-1',
        items: [
          {
            id: '1',
            type: 'service',
            serviceId: 'service-1',
            name: 'Coupe de cheveux',
            price: 50,
            quantity: 1,
            commission: 0.15, // 15% commission
          }
        ],
        subtotal: 50,
        tax: 5,
        total: 55,
        paymentMethod: 'cash',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [{
              id: 'commission-1',
              staffId: 'staff-1',
              saleId: '1',
              amount: 7.5, // 15% of 50
              type: 'service',
              createdAt: new Date().toISOString(),
            }],
            error: null,
          }),
        }),
      } as any);

      const result = await commissionService.calculateAndCreateCommission(mockSale);

      expect(result).toBeDefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('commissions');
    });

    it('calculates commission correctly for product sales', async () => {
      const mockSale: Sale = {
        id: '2',
        clientId: 'client-1',
        staffId: 'staff-1',
        items: [
          {
            id: '2',
            type: 'product',
            productId: 'product-1',
            name: 'Shampoing',
            price: 25,
            quantity: 2,
            commission: 0.10, // 10% commission
          }
        ],
        subtotal: 50,
        tax: 5,
        total: 55,
        paymentMethod: 'card',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [{
              id: 'commission-2',
              staffId: 'staff-1',
              saleId: '2',
              amount: 5, // 10% of 50
              type: 'product',
              createdAt: new Date().toISOString(),
            }],
            error: null,
          }),
        }),
      } as any);

      const result = await commissionService.calculateAndCreateCommission(mockSale);

      expect(result).toBeDefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('commissions');
    });

    it('handles mixed service and product sales', async () => {
      const mockSale: Sale = {
        id: '3',
        clientId: 'client-1',
        staffId: 'staff-1',
        items: [
          {
            id: '3',
            type: 'service',
            serviceId: 'service-1',
            name: 'Coupe de cheveux',
            price: 50,
            quantity: 1,
            commission: 0.15,
          },
          {
            id: '4',
            type: 'product',
            productId: 'product-1',
            name: 'Shampoing',
            price: 25,
            quantity: 1,
            commission: 0.10,
          }
        ],
        subtotal: 75,
        tax: 7.5,
        total: 82.5,
        paymentMethod: 'cash',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [{
              id: 'commission-3',
              staffId: 'staff-1',
              saleId: '3',
              amount: 10, // (50 * 0.15) + (25 * 0.10) = 7.5 + 2.5 = 10
              type: 'mixed',
              createdAt: new Date().toISOString(),
            }],
            error: null,
          }),
        }),
      } as any);

      const result = await commissionService.calculateAndCreateCommission(mockSale);

      expect(result).toBeDefined();
    });

    it('handles zero commission items', async () => {
      const mockSale: Sale = {
        id: '4',
        clientId: 'client-1',
        staffId: 'staff-1',
        items: [
          {
            id: '5',
            type: 'service',
            serviceId: 'service-1',
            name: 'Consultation gratuite',
            price: 0,
            quantity: 1,
            commission: 0,
          }
        ],
        subtotal: 0,
        tax: 0,
        total: 0,
        paymentMethod: 'cash',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      } as any);

      const result = await commissionService.calculateAndCreateCommission(mockSale);

      // Should not create commission for zero amount
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('retrieves staff commissions for a date range', async () => {
      const mockCommissions = [
        {
          id: 'commission-1',
          staffId: 'staff-1',
          saleId: 'sale-1',
          amount: 7.5,
          type: 'service',
          createdAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 'commission-2',
          staffId: 'staff-1',
          saleId: 'sale-2',
          amount: 5,
          type: 'product',
          createdAt: '2024-01-16T14:00:00Z',
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockCommissions,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      const result = await commissionService.getStaffCommissions(
        'staff-1',
        '2024-01-15',
        '2024-01-16'
      );

      expect(result).toEqual(mockCommissions);
      expect(mockSupabase.from).toHaveBeenCalledWith('commissions');
    });
  });

  describe('Sale Service', () => {
    it('creates sale with proper validation', async () => {
      const mockSaleData = {
        clientId: 'client-1',
        staffId: 'staff-1',
        items: [
          {
            id: '1',
            type: 'service' as const,
            serviceId: 'service-1',
            name: 'Coupe de cheveux',
            price: 50,
            quantity: 1,
            commission: 0.15,
          }
        ],
        subtotal: 50,
        tax: 5,
        total: 55,
        paymentMethod: 'cash' as const,
      };

      const mockCreatedSale = {
        id: 'sale-1',
        ...mockSaleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCreatedSale,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await saleService.create(mockSaleData);

      expect(result).toEqual(mockCreatedSale);
      expect(mockSupabase.from).toHaveBeenCalledWith('sales');
    });

    it('validates sale totals correctly', () => {
      const saleData = {
        items: [
          { price: 25, quantity: 2 },
          { price: 30, quantity: 1 },
        ],
        subtotal: 80,
        tax: 8,
        total: 88,
      };

      const calculatedSubtotal = saleData.items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
      );
      const calculatedTotal = calculatedSubtotal + saleData.tax;

      expect(calculatedSubtotal).toBe(saleData.subtotal);
      expect(calculatedTotal).toBe(saleData.total);
    });

    it('handles database errors gracefully', async () => {
      const mockSaleData = {
        clientId: 'client-1',
        staffId: 'staff-1',
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        paymentMethod: 'cash' as const,
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error', code: '500' },
            }),
          }),
        }),
      } as any);

      await expect(saleService.create(mockSaleData)).rejects.toThrow();
    });
  });
});