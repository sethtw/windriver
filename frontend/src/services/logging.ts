import { AppError, ErrorSeverity } from '../types/errors';

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Log entry interface
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  category: string;
  context?: Record<string, any>;
  error?: AppError;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  url?: string;
}

// Logging service configuration
export interface LoggingConfig {
  environment: 'development' | 'staging' | 'production';
  logLevel: LogLevel;
  enableConsole: boolean;
  enableRemoteLogging: boolean;
  remoteLoggingEndpoint?: string;
  enableErrorReporting: boolean;
  errorReportingService?: string;
  maxLogEntries: number;
  flushInterval: number;
}

// Centralized logging service
export class LoggingService {
  private static instance: LoggingService;
  private config: LoggingConfig;
  private logBuffer: LogEntry[] = [];
  private flushTimer?: number;

  private constructor(config: Partial<LoggingConfig> = {}) {
    this.config = {
      environment: 'development',
      logLevel: LogLevel.INFO,
      enableConsole: true,
      enableRemoteLogging: false,
      enableErrorReporting: false,
      maxLogEntries: 1000,
      flushInterval: 30000, // 30 seconds
      ...config
    };

    this.startFlushTimer();
  }

  static getInstance(config?: Partial<LoggingConfig>): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService(config);
    }
    return LoggingService.instance;
  }

  // Log methods
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: AppError, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, { ...context, error });
  }

  critical(message: string, error?: AppError, context?: Record<string, any>): void {
    this.log(LogLevel.CRITICAL, message, { ...context, error });
  }

  // Log error with automatic categorization
  logError(error: AppError, context?: Record<string, any>): void {
    const level = this.getLogLevelForError(error);
    this.log(level, error.message, { ...context, error });
  }

  // Private log method
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      category: context?.category || 'application',
      context,
      error: context?.error,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      requestId: this.getRequestId(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.logBuffer.push(entry);

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Buffer management
    if (this.logBuffer.length > this.config.maxLogEntries) {
      this.logBuffer = this.logBuffer.slice(-this.config.maxLogEntries);
    }
  }

  // Console logging with proper formatting
  private logToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.context);
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.context);
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.context);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(prefix, entry.message, entry.context);
        if (entry.error) {
          console.error('Error details:', entry.error);
        }
        break;
    }
  }

  // Remote logging
  private async sendToRemoteService(entries: LogEntry[]): Promise<void> {
    if (!this.config.enableRemoteLogging || !this.config.remoteLoggingEndpoint) {
      return;
    }

    try {
      await fetch(this.config.remoteLoggingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: entries,
          environment: this.config.environment,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.error('Failed to send logs to remote service:', error);
    }
  }

  // Flush logs to remote service
  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    await this.sendToRemoteService(logsToSend);
  }

  // Start flush timer
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushLogs();
    }, this.config.flushInterval);
  }

  // Utility methods
  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const currentLevelIndex = levels.indexOf(level);
    const configLevelIndex = levels.indexOf(this.config.logLevel);
    return currentLevelIndex >= configLevelIndex;
  }

  private getLogLevelForError(error: AppError): LogLevel {
    switch (error.severity) {
      case ErrorSeverity.LOW:
        return LogLevel.WARN;
      case ErrorSeverity.MEDIUM:
        return LogLevel.ERROR;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return LogLevel.CRITICAL;
      default:
        return LogLevel.ERROR;
    }
  }

  private getUserId(): string | undefined {
    // Get from auth context or localStorage
    return localStorage.getItem('userId') || undefined;
  }

  private getSessionId(): string | undefined {
    // Get from session storage or generate
    return sessionStorage.getItem('sessionId') || undefined;
  }

  private getRequestId(): string | undefined {
    // Generate unique request ID
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods
  getLogs(): LogEntry[] {
    return [...this.logBuffer];
  }

  clearLogs(): void {
    this.logBuffer = [];
  }

  updateConfig(newConfig: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  async forceFlush(): Promise<void> {
    await this.flushLogs();
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }
}

// Export singleton instance
export const logger = LoggingService.getInstance(); 