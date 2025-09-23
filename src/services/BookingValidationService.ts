import { supabase } from '../lib/supabaseClient';

export interface BookingConflict {
  type: 'staff_conflict' | 'resource_conflict' | 'business_hours_violation' | 'advance_booking_violation';
  message: string;
  conflictingBookingId?: string;
  suggestedAlternatives?: string[];
}

export interface ValidationResult {
  hasConflicts: boolean;
  conflicts: BookingConflict[];
}

export interface BookingData {
  staffId: string;
  startTime: string;
  endTime: string;
  serviceId: string;
  clientId: string;
  requiredEquipment?: string[];
  id?: string;
}

export interface ValidationOptions {
  businessHours?: {
    start: string;
    end: string;
  };
  minimumAdvanceHours?: number;
}

export interface ServiceDurationResult {
  isValid: boolean;
  expectedDuration: number;
  actualDuration: number;
  error?: string;
}

export interface StaffAvailabilityResult {
  isAvailable: boolean;
  reason?: string;
}

export interface AlternativeTimeSlot {
  startTime: string;
  endTime: string;
  staffId: string;
  confidence: number;
}

export interface AlternativeOptions {
  searchWindowHours?: number;
  maxSuggestions?: number;
}

export class BookingValidationService {
  async validateBookingConflicts(
    booking: BookingData,
    options?: ValidationOptions
  ): Promise<ValidationResult> {
    const conflicts: BookingConflict[] = [];

    try {
      // Check for existing bookings that might conflict
      const { data: existingBookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'confirmed')
        .neq('id', booking.id || '')
        .or(`staff_id.eq.${booking.staffId}`);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Check for staff conflicts
      const staffConflicts = existingBookings?.filter(existing => 
        existing.staffId === booking.staffId &&
        this.isTimeOverlapping(booking.startTime, booking.endTime, existing.startTime, existing.endTime)
      ) || [];

      if (staffConflicts.length > 0) {
        conflicts.push({
          type: 'staff_conflict',
          message: `Staff member is already booked during this time slot`,
          conflictingBookingId: staffConflicts[0].id
        });
      }

      // Check for resource conflicts if equipment is required
      if (booking.requiredEquipment && booking.requiredEquipment.length > 0) {
        const resourceConflicts = existingBookings?.filter(existing => 
          existing.requiredEquipment &&
          booking.requiredEquipment?.some(equipment => 
            existing.requiredEquipment.includes(equipment)
          ) &&
          this.isTimeOverlapping(booking.startTime, booking.endTime, existing.startTime, existing.endTime)
        ) || [];

        if (resourceConflicts.length > 0) {
          conflicts.push({
            type: 'resource_conflict',
            message: `Required equipment is already in use during this time slot`,
            conflictingBookingId: resourceConflicts[0].id
          });
        }
      }

      // Check business hours if provided
      if (options?.businessHours) {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);
        const businessStart = this.parseTime(options.businessHours.start);
        const businessEnd = this.parseTime(options.businessHours.end);

        const bookingStartTime = bookingStart.getHours() * 60 + bookingStart.getMinutes();
        const bookingEndTime = bookingEnd.getHours() * 60 + bookingEnd.getMinutes();

        if (bookingStartTime < businessStart || bookingEndTime > businessEnd) {
          conflicts.push({
            type: 'business_hours_violation',
            message: `Booking is outside business hours (${options.businessHours.start} - ${options.businessHours.end})`
          });
        }
      }

      // Check minimum advance booking time
      if (options?.minimumAdvanceHours) {
        const now = new Date();
        const bookingTime = new Date(booking.startTime);
        const hoursUntilBooking = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilBooking < options.minimumAdvanceHours) {
          conflicts.push({
            type: 'advance_booking_violation',
            message: `Booking must be made at least ${options.minimumAdvanceHours} hours in advance (minimum advance booking time)`
          });
        }
      }

      return {
        hasConflicts: conflicts.length > 0,
        conflicts
      };
    } catch (error) {
      throw new Error(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateServiceDuration(booking: {
    serviceId: string;
    startTime: string;
    endTime: string;
  }): Promise<ServiceDurationResult> {
    try {
      const { data: service, error } = await supabase
        .from('services')
        .select('duration')
        .eq('id', booking.serviceId)
        .single();

      if (error) {
        throw new Error(`Service not found: ${error.message}`);
      }

      const expectedDuration = service.duration;
      const actualDuration = this.calculateDurationMinutes(booking.startTime, booking.endTime);

      const isValid = expectedDuration === actualDuration;

      return {
        isValid,
        expectedDuration,
        actualDuration,
        error: isValid ? undefined : `Duration mismatch: expected ${expectedDuration} minutes, got ${actualDuration} minutes`
      };
    } catch (error) {
      return {
        isValid: false,
        expectedDuration: 0,
        actualDuration: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async validateStaffAvailability(booking: {
    staffId: string;
    startTime: string;
    endTime: string;
  }): Promise<StaffAvailabilityResult> {
    try {
      const { data: staff, error } = await supabase
        .from('staff')
        .select('workingHours, isActive')
        .eq('id', booking.staffId)
        .single();

      if (error) {
        return {
          isAvailable: false,
          reason: `Staff member not found: ${error.message}`
        };
      }

      if (!staff.isActive) {
        return {
          isAvailable: false,
          reason: 'Staff member is not currently active'
        };
      }

      // Check working hours
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      const dayOfWeek = this.getDayOfWeek(bookingStart);
      
      const workingHours = staff.workingHours?.[dayOfWeek];
      if (!workingHours) {
        return {
          isAvailable: false,
          reason: `Staff member does not work on ${dayOfWeek}`
        };
      }

      const workStart = this.parseTime(workingHours.start);
      const workEnd = this.parseTime(workingHours.end);
      const bookingStartTime = bookingStart.getHours() * 60 + bookingStart.getMinutes();
      const bookingEndTime = bookingEnd.getHours() * 60 + bookingEnd.getMinutes();

      if (bookingStartTime < workStart || bookingEndTime > workEnd) {
        return {
          isAvailable: false,
          reason: `Booking is outside working hours (${workingHours.start} - ${workingHours.end})`
        };
      }

      return {
        isAvailable: true
      };
    } catch (error) {
      return {
        isAvailable: false,
        reason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getAlternativeTimeSlots(
    booking: BookingData,
    options?: AlternativeOptions
  ): Promise<AlternativeTimeSlot[]> {
    const searchWindowHours = options?.searchWindowHours || 4;
    const maxSuggestions = options?.maxSuggestions || 3;
    const serviceDuration = this.calculateDurationMinutes(booking.startTime, booking.endTime);

    try {
      const searchStart = new Date(booking.startTime);
      searchStart.setHours(searchStart.getHours() - searchWindowHours);
      
      const searchEnd = new Date(booking.startTime);
      searchEnd.setHours(searchEnd.getHours() + searchWindowHours);

      // Get existing bookings in the search window
      const { data: existingBookings, error } = await supabase
        .from('bookings')
        .select('start_at, end_at')
        .eq('staff_id', booking.staffId)
        .gte('start_at', searchStart.toISOString())
        .lte('end_at', searchEnd.toISOString())
        .order('start_at');

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const alternatives: AlternativeTimeSlot[] = [];
      const timeSlots = this.generateTimeSlots(searchStart, searchEnd, serviceDuration);

      for (const slot of timeSlots) {
        if (alternatives.length >= maxSuggestions) break;

        const isAvailable = !existingBookings?.some(existing =>
          this.isTimeOverlapping(slot.startTime, slot.endTime, existing.start_at, existing.end_at)
        );

        if (isAvailable && slot.startTime !== booking.startTime) {
          alternatives.push({
            startTime: slot.startTime,
            endTime: slot.endTime,
            staffId: booking.staffId,
            confidence: this.calculateConfidence(slot.startTime, booking.startTime)
          });
        }
      }

      return alternatives.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Error generating alternatives:', error);
      return [];
    }
  }

  private isTimeOverlapping(start1: string, end1: string, start2: string, end2: string): boolean {
    const s1 = new Date(start1);
    const e1 = new Date(end1);
    const s2 = new Date(start2);
    const e2 = new Date(end2);

    return s1 < e2 && s2 < e1;
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private calculateDurationMinutes(startTime: string, endTime: string): number {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }

  private getDayOfWeek(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }

  private generateTimeSlots(start: Date, end: Date, durationMinutes: number): Array<{startTime: string, endTime: string}> {
    const slots = [];
    const current = new Date(start);
    
    while (current < end) {
      const slotEnd = new Date(current.getTime() + durationMinutes * 60000);
      if (slotEnd <= end) {
        slots.push({
          startTime: current.toISOString(),
          endTime: slotEnd.toISOString()
        });
      }
      current.setMinutes(current.getMinutes() + 30); // 30-minute intervals
    }
    
    return slots;
  }

  private calculateConfidence(alternativeTime: string, originalTime: string): number {
    const alt = new Date(alternativeTime);
    const orig = new Date(originalTime);
    const diffHours = Math.abs(alt.getTime() - orig.getTime()) / (1000 * 60 * 60);
    
    // Higher confidence for closer times
    return Math.max(0, 1 - diffHours / 24);
  }
}