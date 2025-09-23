// ============================================================================
// CENTRALIZED ERROR HANDLING SYSTEM
// ============================================================================
// This provides consistent error handling across the entire application
// ============================================================================

import toast from 'react-hot-toast';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export class ErrorHandler {
  private static errorThrottle = new Map<string, number>();
  private static readonly THROTTLE_DURATION = 5000; // 5 seconds

  /**
   * Handle and display errors consistently
   */
  static handle(error: unknown, context?: string): AppError {
    const appError = this.normalizeError(error, context);
    
    // Throttle duplicate errors
    if (this.isThrottled(appError.code)) {
      console.warn('Error throttled:', appError);
      return appError;
    }

    // Log error
    console.error('Application Error:', appError);

    // Display user-friendly message
    this.displayError(appError);

    return appError;
  }

  /**
   * Normalize different error types into AppError format
   */
  private static normalizeError(error: unknown, context?: string): AppError {
    const timestamp = new Date().toISOString();
    
    if (error instanceof Error) {
      return {
        code: this.extractErrorCode(error),
        message: this.getUserFriendlyMessage(error),
        details: {
          originalMessage: error.message,
          stack: error.stack,
          context
        },
        timestamp
      };
    }

    if (typeof error === 'string') {
      return {
        code: 'UNKNOWN_ERROR',
        message: error,
        details: { context },
        timestamp
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      details: { error, context },
      timestamp
    };
  }

  /**
   * Extract error code from error message or type
   */
  private static extractErrorCode(error: Error): string {
    // Supabase errors
    if (error.message.includes('JWT')) return 'AUTH_TOKEN_INVALID';
    if (error.message.includes('permission denied')) return 'PERMISSION_DENIED';
    if (error.message.includes('not found')) return 'RESOURCE_NOT_FOUND';
    if (error.message.includes('duplicate')) return 'DUPLICATE_RESOURCE';
    if (error.message.includes('constraint')) return 'CONSTRAINT_VIOLATION';
    
    // Network errors
    if (error.message.includes('fetch')) return 'NETWORK_ERROR';
    if (error.message.includes('timeout')) return 'REQUEST_TIMEOUT';
    
    // Generic error
    return 'UNKNOWN_ERROR';
  }

  /**
   * Get user-friendly error messages
   */
  private static getUserFriendlyMessage(error: Error): string {
    const code = this.extractErrorCode(error);
    
    const messages: Record<string, string> = {
      'AUTH_TOKEN_INVALID': 'Your session has expired. Please log in again.',
      'PERMISSION_DENIED': 'You do not have permission to perform this action.',
      'RESOURCE_NOT_FOUND': 'The requested item could not be found.',
      'DUPLICATE_RESOURCE': 'This item already exists.',
      'CONSTRAINT_VIOLATION': 'Invalid data provided. Please check your input.',
      'NETWORK_ERROR': 'Network connection failed. Please check your internet connection.',
      'REQUEST_TIMEOUT': 'Request timed out. Please try again.',
      'INSUFFICIENT_STOCK': 'Insufficient inventory to complete this operation.',
      'SERVICE_UNAVAILABLE': 'This service is currently unavailable.',
      'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.'
    };

    return messages[code] || messages['UNKNOWN_ERROR'];
  }

  /**
   * Display error to user using toast notifications
   */
  private static displayError(error: AppError): void {
    // Don't show toast for certain error types
    const silentErrors = ['AUTH_TOKEN_INVALID'];
    if (silentErrors.includes(error.code)) {
      return;
    }

    // Show appropriate toast based on error severity
    if (error.code === 'PERMISSION_DENIED') {
      toast.error(error.message, { duration: 6000 });
    } else if (error.code === 'NETWORK_ERROR' || error.code === 'REQUEST_TIMEOUT') {
      toast.error(error.message, { duration: 8000 });
    } else {
      toast.error(error.message, { duration: 4000 });
    }
  }

  /**
   * Check if error should be throttled
   */
  private static isThrottled(errorCode: string): boolean {
    const now = Date.now();
    const lastShown = this.errorThrottle.get(errorCode);
    
    if (lastShown && (now - lastShown) < this.THROTTLE_DURATION) {
      return true;
    }
    
    this.errorThrottle.set(errorCode, now);
    return false;
  }

  /**
   * Handle API errors specifically
   */
  static handleApiError(response: Response, context?: string): AppError {
    const error = new Error(`API Error: ${response.status} ${response.statusText}`);
    return this.handle(error, context);
  }

  /**
   * Handle Supabase errors specifically
   */
  static handleSupabaseError(error: any, context?: string): AppError {
    const appError = new Error(error.message || 'Database operation failed');
    return this.handle(appError, context);
  }

  /**
   * Clear error throttle (useful for testing)
   */
  static clearThrottle(): void {
    this.errorThrottle.clear();
  }
}

// Export convenience functions
export const handleError = ErrorHandler.handle.bind(ErrorHandler);
export const handleApiError = ErrorHandler.handleApiError.bind(ErrorHandler);
export const handleSupabaseError = ErrorHandler.handleSupabaseError.bind(ErrorHandler);

export default ErrorHandler;

