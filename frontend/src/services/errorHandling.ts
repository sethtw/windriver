import { LoggingService, LoggingConfig, LogLevel } from './logging';
import { AppError, ErrorCategory, ErrorSeverity } from '../types/errors';

// Global error handler
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  public logger: LoggingService;
  private isInitialized = false;

  private constructor() {
    this.logger = LoggingService.getInstance();
  }

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  /**
   * Initialize global error handling
   */
  initialize(config: Partial<LoggingConfig> = {}): void {
    if (this.isInitialized) {
      return;
    }

    // Initialize logging service
    this.logger = LoggingService.getInstance({
      environment: import.meta.env.MODE as 'development' | 'staging' | 'production',
      logLevel: this.getLogLevelForEnvironment(),
      enableConsole: true,
      enableRemoteLogging: import.meta.env.MODE === 'production',
      remoteLoggingEndpoint: import.meta.env.VITE_REMOTE_LOGGING_ENDPOINT,
      enableErrorReporting: import.meta.env.MODE === 'production',
      errorReportingService: import.meta.env.VITE_ERROR_REPORTING_SERVICE,
      maxLogEntries: 1000,
      flushInterval: 30000,
      ...config
    });

    // Set up global error handlers
    this.setupGlobalErrorHandlers();
    this.setupUnhandledRejectionHandler();
    this.setupNetworkErrorHandler();

    this.isInitialized = true;
    this.logger.info('Global error handling initialized', {
      environment: import.meta.env.MODE,
      enableRemoteLogging: import.meta.env.MODE === 'production'
    });
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      const error = new AppError(
        event.message || 'Uncaught error',
        ErrorCategory.CLIENT_ERROR,
        ErrorSeverity.HIGH,
        {
          component: 'GlobalErrorHandler',
          action: 'uncaughtError',
          url: event.filename,
          metadata: {
            error: event.error,
            lineNumber: event.lineno,
            columnNumber: event.colno
          }
        },
        false,
        event.error,
        'An unexpected error occurred. Please refresh the page.'
      );

      this.logger.logError(error);
    });

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement;
        const error = new AppError(
          `Resource loading failed: ${target.tagName}`,
          ErrorCategory.CLIENT_ERROR,
          ErrorSeverity.MEDIUM,
          {
            component: 'GlobalErrorHandler',
            action: 'resourceLoadError',
            url: (target as any).src || (target as any).href,
            metadata: {
              tagName: target.tagName,
              target: target
            }
          },
          true,
          undefined,
          'Failed to load a resource. Some features may not work properly.'
        );

        this.logger.logError(error);
      }
    }, true);
  }

  /**
   * Set up unhandled promise rejection handler
   */
  private setupUnhandledRejectionHandler(): void {
    window.addEventListener('unhandledrejection', (event) => {
      const error = new AppError(
        'Unhandled promise rejection',
        ErrorCategory.CLIENT_ERROR,
        ErrorSeverity.HIGH,
        {
          component: 'GlobalErrorHandler',
          action: 'unhandledRejection',
          metadata: {
            reason: event.reason
          }
        },
        false,
        event.reason,
        'An unexpected error occurred. Please try again.'
      );

      this.logger.logError(error);
      event.preventDefault(); // Prevent default browser behavior
    });
  }

  /**
   * Set up network error monitoring
   */
  private setupNetworkErrorHandler(): void {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.logger.info('Network connection restored');
    });

    window.addEventListener('offline', () => {
      const error = new AppError(
        'Network connection lost',
        ErrorCategory.NETWORK,
        ErrorSeverity.HIGH,
        {
          component: 'GlobalErrorHandler',
          action: 'networkOffline'
        },
        true,
        undefined,
        'Network connection lost. Please check your internet connection.'
      );

      this.logger.logError(error);
    });
  }

  /**
   * Get appropriate log level for environment
   */
  private getLogLevelForEnvironment(): LogLevel {
    switch (import.meta.env.MODE) {
      case 'development':
        return LogLevel.DEBUG;
      case 'staging':
        return LogLevel.INFO;
      case 'production':
        return LogLevel.WARN;
      default:
        return LogLevel.INFO;
    }
  }

  /**
   * Report user action for analytics
   */
  reportUserAction(action: string, context?: Record<string, any>): void {
    this.logger.info(`User action: ${action}`, {
      component: 'GlobalErrorHandler',
      action: 'userAction',
      ...context
    });
  }

  /**
   * Report performance metrics
   */
  reportPerformanceMetric(metric: string, value: number, context?: Record<string, any>): void {
    this.logger.info(`Performance metric: ${metric}`, {
      component: 'GlobalErrorHandler',
      action: 'performanceMetric',
      metric,
      value,
      ...context
    });
  }

  /**
   * Get error statistics
   */
  getErrorStats(): Record<string, number> {
    const logs = this.logger.getLogs();
    const stats: Record<string, number> = {};

    logs.forEach(log => {
      if (log.error) {
        const category = log.error.category;
        stats[category] = (stats[category] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logger.clearLogs();
  }

  /**
   * Force flush logs to remote service
   */
  async forceFlush(): Promise<void> {
    await this.logger.forceFlush();
  }
}

// Export singleton instance
export const globalErrorHandler = GlobalErrorHandler.getInstance();

// Error reporting utilities
export const reportError = (error: Error | AppError, context?: Record<string, any>): void => {
  const appError = error instanceof AppError ? error : new AppError(
    error.message,
    ErrorCategory.UNKNOWN,
    ErrorSeverity.MEDIUM,
    context,
    false,
    error
  );

  globalErrorHandler.logger.logError(appError, context);
};

export const reportWarning = (message: string, context?: Record<string, any>): void => {
  globalErrorHandler.logger.warn(message, context);
};

export const reportInfo = (message: string, context?: Record<string, any>): void => {
  globalErrorHandler.logger.info(message, context);
}; 