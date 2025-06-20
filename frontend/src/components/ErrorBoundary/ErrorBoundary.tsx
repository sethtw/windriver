import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { logger } from '../../services/logging';
import { AppError, ErrorCategory, ErrorSeverity } from '../../types/errors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error
    const appError = new AppError(
      error.message,
      ErrorCategory.CLIENT_ERROR,
      ErrorSeverity.HIGH,
      {
        component: 'ErrorBoundary',
        action: 'componentDidCatch',
        metadata: {
          stack: error.stack,
          componentStack: errorInfo.componentStack
        }
      },
      false,
      error,
      'Something went wrong. Please refresh the page.'
    );

    logger.logError(appError);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReportError = (): void => {
    if (this.state.error) {
      // Send error report to support team
      logger.critical('User reported error', this.state.error as AppError, {
        userAction: 'report',
        errorInfo: this.state.errorInfo
      });
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          p={3}
        >
          <Paper sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
            <Typography variant="h4" color="error" gutterBottom>
              Oops! Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We're sorry, but something unexpected happened. Our team has been notified.
            </Typography>
            
            {import.meta.env.MODE === 'development' && this.state.error && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1, textAlign: 'left' }}>
                <Typography variant="caption" component="pre" sx={{ fontSize: '0.75rem' }}>
                  {this.state.error.stack}
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="contained" onClick={this.handleRetry}>
                Try Again
              </Button>
              <Button variant="outlined" onClick={this.handleReportError}>
                Report Issue
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
} 