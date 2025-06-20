// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error categories
export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  RESOURCE_NOT_FOUND = 'resource_not_found',
  SERVER_ERROR = 'server_error',
  CLIENT_ERROR = 'client_error',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
  FILE_OPERATION = 'file_operation',
  STREAMING = 'streaming',
  PLAYER = 'player',
  UNKNOWN = 'unknown'
}

// Error context for better debugging
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  timestamp: number;
  userAgent?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  retryCount?: number;
  metadata?: Record<string, any>;
}

// Base error class
export class AppError extends Error {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly isOperational: boolean;
  public readonly originalError?: Error;
  public readonly userMessage: string;

  constructor(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Partial<ErrorContext> = {},
    isOperational: boolean = true,
    originalError?: Error,
    userMessage?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.category = category;
    this.severity = severity;
    this.context = {
      timestamp: Date.now(),
      ...context
    };
    this.isOperational = isOperational;
    this.originalError = originalError;
    this.userMessage = userMessage || message;

    // Maintains proper stack trace for where our error was thrown
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }
}

// Specific error types
export class NetworkError extends AppError {
  constructor(
    message: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      message,
      ErrorCategory.NETWORK,
      ErrorSeverity.HIGH,
      context,
      true,
      originalError,
      'Network connection failed. Please check your internet connection and try again.'
    );
  }
}

export class FileOperationError extends AppError {
  constructor(
    message: string,
    operation: 'upload' | 'delete' | 'download',
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      message,
      ErrorCategory.FILE_OPERATION,
      ErrorSeverity.MEDIUM,
      { ...context, action: operation },
      true,
      originalError,
      `Failed to ${operation} file. Please try again.`
    );
  }
}

export class StreamingError extends AppError {
  constructor(
    message: string,
    operation: 'start' | 'stop' | 'capture',
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      message,
      ErrorCategory.STREAMING,
      ErrorSeverity.HIGH,
      { ...context, action: operation },
      true,
      originalError,
      `Failed to ${operation} streaming. Please try again.`
    );
  }
}

export class PlayerError extends AppError {
  constructor(
    message: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      message,
      ErrorCategory.PLAYER,
      ErrorSeverity.MEDIUM,
      context,
      true,
      originalError,
      'Audio player error. Please try refreshing the page.'
    );
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    field?: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      message,
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      { ...context, metadata: { field } },
      true,
      originalError,
      'Invalid input. Please check your data and try again.'
    );
  }
}

export class ServerError extends AppError {
  constructor(
    message: string,
    statusCode: number,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      message,
      ErrorCategory.SERVER_ERROR,
      ErrorSeverity.HIGH,
      { ...context, statusCode },
      false,
      originalError,
      'Server error occurred. Please try again later.'
    );
  }
}

// Error factory for creating appropriate error types
export class ErrorFactory {
  static createFromAxiosError(error: any, context: Partial<ErrorContext> = {}): AppError {
    const statusCode = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Network request failed';

    if (statusCode >= 500) {
      return new ServerError(message, statusCode, context, error);
    } else if (statusCode === 404) {
      return new AppError(
        message,
        ErrorCategory.RESOURCE_NOT_FOUND,
        ErrorSeverity.MEDIUM,
        { ...context, statusCode },
        true,
        error,
        'Resource not found.'
      );
    } else if (statusCode === 401) {
      return new AppError(
        message,
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.HIGH,
        { ...context, statusCode },
        true,
        error,
        'Authentication required. Please log in again.'
      );
    } else if (statusCode === 403) {
      return new AppError(
        message,
        ErrorCategory.AUTHORIZATION,
        ErrorSeverity.HIGH,
        { ...context, statusCode },
        true,
        error,
        'Access denied. You do not have permission to perform this action.'
      );
    } else if (statusCode === 429) {
      return new AppError(
        message,
        ErrorCategory.RATE_LIMIT,
        ErrorSeverity.MEDIUM,
        { ...context, statusCode },
        true,
        error,
        'Too many requests. Please wait a moment and try again.'
      );
    } else {
      return new NetworkError(message, { ...context, statusCode }, error);
    }
  }

  static createFromUnknownError(error: any, context: Partial<ErrorContext> = {}): AppError {
    if (error instanceof AppError) {
      return error;
    }

    return new AppError(
      error.message || 'An unexpected error occurred',
      ErrorCategory.UNKNOWN,
      ErrorSeverity.HIGH,
      context,
      false,
      error,
      'An unexpected error occurred. Please try again.'
    );
  }
} 