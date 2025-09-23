import { BookingValidationService } from '../BookingValidationService';
import { supabase } from '../../lib/supabaseClient';

// Mock Supabase
jest.mock('../../lib/supabaseClient');
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('BookingValidationService', () => {
  let service: BookingValidationService;

  beforeEach(() => {
    service = new BookingValidationService();
    jest.clearAllMocks();
  });

  describe('validateBookingConflicts', () => {
    it('detects staff double booking conflicts', async () => {
      const newBooking = {
        staffId: 'staff-1',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
        serviceId: 'service-1',
        clientId: 'client-1',
      };

      const existingBookings = [
        {
          id: 'booking-1',
          staffId: 'staff-1',
          startTime: '2024-01-15T10:30:00Z',
          endTime: '2024-01-15T11:30:00Z',
          status: 'confirmed',
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            neq: jest.fn().mockReturnValue({
              or: jest.fn().mockResolvedValue({
                data: existingBookings,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await service.validateBookingConflicts(newBooking);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('staff_conflict');
      expect(result.conflicts[0].message).toContain('Staff member is already booked');
    });

    it('allows booking when no conflicts exist', async () => {
      const newBooking = {
        staffId: 'staff-1',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
        serviceId: 'service-1',
        clientId: 'client-1',
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            neq: jest.fn().mockReturnValue({
              or: jest.fn().mockResolvedValue({
                data: [], // No existing bookings
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await service.validateBookingConflicts(newBooking);

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });

    it('detects resource conflicts for equipment-based services', async () => {
      const newBooking = {
        staffId: 'staff-1',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
        serviceId: 'service-1',
        clientId: 'client-1',
        requiredEquipment: ['equipment-1'],
      };

      const existingBookings = [
        {
          id: 'booking-1',
          staffId: 'staff-2',
          startTime: '2024-01-15T10:30:00Z',
          endTime: '2024-01-15T11:30:00Z',
          status: 'confirmed',
          requiredEquipment: ['equipment-1'],
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            neq: jest.fn().mockReturnValue({
              or: jest.fn().mockResolvedValue({
                data: existingBookings,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await service.validateBookingConflicts(newBooking);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('resource_conflict');
      expect(result.conflicts[0].message).toContain('Required equipment is already in use');
    });

    it('validates business hours constraints', async () => {
      const newBooking = {
        staffId: 'staff-1',
        startTime: '2024-01-15T07:00:00Z', // Before business hours
        endTime: '2024-01-15T08:00:00Z',
        serviceId: 'service-1',
        clientId: 'client-1',
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            neq: jest.fn().mockReturnValue({
              or: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await service.validateBookingConflicts(newBooking, {
        businessHours: { start: '09:00', end: '18:00' },
      });

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('business_hours_violation');
      expect(result.conflicts[0].message).toContain('outside business hours');
    });

    it('validates minimum advance booking time', async () => {
      const now = new Date();
      const tooSoon = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now

      const newBooking = {
        staffId: 'staff-1',
        startTime: tooSoon.toISOString(),
        endTime: new Date(tooSoon.getTime() + 60 * 60 * 1000).toISOString(),
        serviceId: 'service-1',
        clientId: 'client-1',
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            neq: jest.fn().mockReturnValue({
              or: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await service.validateBookingConflicts(newBooking, {
        minimumAdvanceHours: 2,
      });

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('advance_booking_violation');
      expect(result.conflicts[0].message).toContain('minimum advance booking time');
    });
  });

  describe('validateServiceDuration', () => {
    it('validates service duration matches expected duration', async () => {
      const booking = {
        serviceId: 'service-1',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z', // 60 minutes
      };

      const mockService = {
        id: 'service-1',
        name: 'Coupe Classique',
        duration: 60, // Expected 60 minutes
        price: 25,
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockService,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await service.validateServiceDuration(booking);

      expect(result.isValid).toBe(true);
      expect(result.expectedDuration).toBe(60);
      expect(result.actualDuration).toBe(60);
    });

    it('detects duration mismatch', async () => {
      const booking = {
        serviceId: 'service-1',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T10:30:00Z', // 30 minutes
      };

      const mockService = {
        id: 'service-1',
        name: 'Coupe Classique',
        duration: 60, // Expected 60 minutes
        price: 25,
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockService,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await service.validateServiceDuration(booking);

      expect(result.isValid).toBe(false);
      expect(result.expectedDuration).toBe(60);
      expect(result.actualDuration).toBe(30);
      expect(result.error).toContain('Duration mismatch');
    });
  });

  describe('validateStaffAvailability', () => {
    it('validates staff working hours', async () => {
      const booking = {
        staffId: 'staff-1',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
      };

      const mockStaff = {
        id: 'staff-1',
        name: 'Jean Dupont',
        workingHours: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          // ... other days
        },
        isActive: true,
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockStaff,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await service.validateStaffAvailability(booking);

      expect(result.isAvailable).toBe(true);
    });

    it('detects staff unavailability during non-working hours', async () => {
      const booking = {
        staffId: 'staff-1',
        startTime: '2024-01-15T19:00:00Z', // After working hours
        endTime: '2024-01-15T20:00:00Z',
      };

      const mockStaff = {
        id: 'staff-1',
        name: 'Jean Dupont',
        workingHours: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          // ... other days
        },
        isActive: true,
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockStaff,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await service.validateStaffAvailability(booking);

      expect(result.isAvailable).toBe(false);
      expect(result.reason).toContain('outside working hours');
    });

    it('detects inactive staff members', async () => {
      const booking = {
        staffId: 'staff-1',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
      };

      const mockStaff = {
        id: 'staff-1',
        name: 'Jean Dupont',
        workingHours: {
          monday: { start: '09:00', end: '17:00' },
        },
        isActive: false, // Staff member is inactive
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockStaff,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await service.validateStaffAvailability(booking);

      expect(result.isAvailable).toBe(false);
      expect(result.reason).toContain('not currently active');
    });
  });

  describe('getAlternativeTimeSlots', () => {
    it('suggests alternative time slots when conflicts exist', async () => {
      const conflictedBooking = {
        staffId: 'staff-1',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
        serviceId: 'service-1',
      };

      const existingBookings = [
        {
          id: 'booking-1',
          staffId: 'staff-1',
          startTime: '2024-01-15T10:30:00Z',
          endTime: '2024-01-15T11:30:00Z',
          status: 'confirmed',
        },
      ];

      // Mock existing bookings query
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: existingBookings,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      const alternatives = await service.getAlternativeTimeSlots(conflictedBooking, {
        searchWindowHours: 4,
        maxSuggestions: 3,
      });

      expect(alternatives).toHaveLength(3);
      expect(alternatives[0].startTime).not.toBe(conflictedBooking.startTime);
      expect(alternatives.every(alt => alt.staffId === conflictedBooking.staffId)).toBe(true);
    });
  });
});