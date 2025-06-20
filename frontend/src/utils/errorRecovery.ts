import { AppError, ErrorCategory, ErrorSeverity } from '../types/errors';
import { logger } from '../services/logging';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors: ErrorCategory[];
}

const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableErrors: [
    ErrorCategory.NETWORK,
    ErrorCategory.TIMEOUT,
    ErrorCategory.SERVER_ERROR
  ]
};

export class ErrorRecovery {
  /**
   * Retry operation with exponential backoff
   */
  static async retry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...defaultRetryConfig, ...config };
    let lastError: AppError;

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        lastError = error instanceof AppError ? error : new AppError(
          errorMessage,
          ErrorCategory.UNKNOWN,
          ErrorSeverity.HIGH,
          { metadata: { retryAttempt: attempt } }
        );

        // Check if error is retryable
        if (!finalConfig.retryableErrors.includes(lastError.category)) {
          throw lastError;
        }

        // Check if we've reached max attempts
        if (attempt === finalConfig.maxAttempts) {
          logger.error(`Operation failed after ${attempt} attempts`, lastError);
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          finalConfig.baseDelay * Math.pow(finalConfig.backoffFactor, attempt - 1),
          finalConfig.maxDelay
        );

        logger.warn(`Operation failed, retrying in ${delay}ms`, {
          attempt,
          maxAttempts: finalConfig.maxAttempts,
          error: lastError.message
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Circuit breaker pattern for preventing cascade failures
   */
  static createCircuitBreaker(
    failureThreshold: number = 5,
    resetTimeout: number = 60000
  ) {
    let failureCount = 0;
    let lastFailureTime = 0;
    let state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

    return async <T>(operation: () => Promise<T>): Promise<T> => {
      const now = Date.now();

      // Check if circuit breaker should reset
      if (state === 'OPEN' && now - lastFailureTime > resetTimeout) {
        state = 'HALF_OPEN';
        logger.info('Circuit breaker reset to HALF_OPEN');
      }

      // Check if circuit breaker is open
      if (state === 'OPEN') {
        throw new AppError(
          'Service temporarily unavailable',
          ErrorCategory.SERVER_ERROR,
          ErrorSeverity.HIGH,
          { metadata: { circuitBreakerState: 'OPEN' } },
          true,
          undefined,
          'Service is temporarily unavailable. Please try again later.'
        );
      }

      try {
        const result = await operation();
        
        // Success - reset failure count and close circuit
        if (state === 'HALF_OPEN') {
          state = 'CLOSED';
          logger.info('Circuit breaker reset to CLOSED');
        }
        failureCount = 0;
        
        return result;
      } catch (error) {
        failureCount++;
        lastFailureTime = now;

        logger.warn('Operation failed', {
          failureCount,
          failureThreshold,
          circuitBreakerState: state
        });

        // Check if circuit breaker should open
        if (failureCount >= failureThreshold) {
          state = 'OPEN';
          logger.error('Circuit breaker opened', undefined, {
            failureCount,
            failureThreshold
          });
        }

        throw error;
      }
    };
  }

  /**
   * Fallback strategy for graceful degradation
   */
  static async withFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    context: Record<string, any>
  ): Promise<T> {
    try {
      return await primaryOperation();
    } catch (error) {
      logger.warn('Primary operation failed, using fallback', {
        ...context,
        error: error instanceof AppError ? error.message : error
      });

      try {
        return await fallbackOperation();
      } catch (fallbackError) {
        logger.error('Both primary and fallback operations failed', undefined, {
          ...context,
          primaryError: error instanceof AppError ? error.message : error,
          fallbackError: fallbackError instanceof AppError ? fallbackError.message : fallbackError
        });
        throw fallbackError;
      }
    }
  }
} 