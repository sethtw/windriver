# Log Viewing Guide

This guide shows you all the different ways to view logs in your enterprise error handling system.

## 1. Browser Developer Console (Immediate Access)

### **How to Access:**
1. Open your browser's Developer Tools (F12 or Ctrl+Shift+I)
2. Go to the **Console** tab
3. Logs will appear in real-time as they're generated

### **What You'll See:**
```
[2024-01-15T10:30:45.123Z] [INFO] [useFileUpload] Starting file upload {fileName: "audio.mp3", fileSize: 2048576, fileType: "audio/mpeg"}
[2024-01-15T10:30:46.456Z] [ERROR] [ApiService] Network request failed {statusCode: 500, url: "/upload"}
[2024-01-15T10:30:47.789Z] [WARN] [ErrorRecovery] Operation failed, retrying in 1000ms {attempt: 1, maxAttempts: 3}
```

### **Console Log Levels:**
- **DEBUG** - Blue text (detailed debugging)
- **INFO** - Default text (general information)
- **WARN** - Yellow text with warning icon
- **ERROR** - Red text with error icon
- **CRITICAL** - Red text with error icon

### **Benefits:**
- ✅ Immediate access
- ✅ Real-time updates
- ✅ No setup required
- ✅ Works in all environments

### **Limitations:**
- ❌ Logs lost on page refresh
- ❌ Limited filtering capabilities
- ❌ No export functionality
- ❌ No error statistics

---

## 2. Built-in Log Viewer Component (Recommended)

### **How to Access:**
Add the LogViewer component to your App:

```typescript
import React, { useState } from 'react';
import LogViewer from './components/LogViewer';

function App() {
  const [showLogViewer, setShowLogViewer] = useState(false);

  return (
    <div>
      {/* Your existing app content */}
      
      {/* Add a button to open log viewer */}
      <Button 
        onClick={() => setShowLogViewer(true)}
        variant="outlined"
        startIcon={<BugReportIcon />}
      >
        View Logs
      </Button>

      {/* Log viewer component */}
      <LogViewer 
        show={showLogViewer} 
        onClose={() => setShowLogViewer(false)} 
      />
    </div>
  );
}
```

### **Features:**
- 📊 **Error Statistics** - Real-time error counts by category
- 🔍 **Advanced Filtering** - Filter by level, category, and search terms
- 📥 **Export Functionality** - Download logs as JSON
- 🔄 **Auto-refresh** - Real-time updates every 2 seconds
- 📋 **Detailed Context** - Expandable rows with full error details
- 🧹 **Clear Logs** - Clear all logs with one click

### **What You'll See:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Log Viewer                                                    [🔄] [🗑️] [📥] │
├─────────────────────────────────────────────────────────────────────────────┤
│ Error Statistics: [NETWORK: 3] [FILE_OPERATION: 1] [STREAMING: 2]          │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Search...] [Level: ALL ▼] [Category: ALL ▼] [Auto-refresh: ON]            │
│ Showing 15 of 25 logs                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Timestamp          │ Level │ Category    │ Message                    │ User │
│ 2024-01-15 10:30  │ ERROR │ NETWORK     │ Network request failed     │ N/A  │
│ 2024-01-15 10:29  │ INFO  │ useFileUp   │ Starting file upload       │ N/A  │
│ 2024-01-15 10:28  │ WARN  │ ErrorReco   │ Operation failed, retrying │ N/A  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### **Benefits:**
- ✅ Comprehensive filtering and search
- ✅ Error statistics and trends
- ✅ Export functionality
- ✅ Detailed error context
- ✅ Real-time updates
- ✅ Professional UI

---

## 3. Programmatic Access (For Developers)

### **Access Logs in Code:**
```typescript
import { logger } from '../services/logging';
import { globalErrorHandler } from '../services/errorHandling';

// Get all current logs
const allLogs = logger.getLogs();
console.log('All logs:', allLogs);

// Get error statistics
const errorStats = globalErrorHandler.getErrorStats();
console.log('Error stats:', errorStats);

// Clear logs
logger.clearLogs();

// Force flush to remote service
await logger.forceFlush();
```

### **Log Entry Structure:**
```typescript
interface LogEntry {
  level: LogLevel;           // 'debug' | 'info' | 'warn' | 'error' | 'critical'
  message: string;           // Human-readable message
  timestamp: number;         // Unix timestamp
  category: string;          // Component or service name
  context?: Record<string, any>; // Additional data
  error?: AppError;          // Error object if applicable
  userId?: string;           // Current user ID
  sessionId?: string;        // Session identifier
  requestId?: string;        // Request identifier
  userAgent?: string;        // Browser information
  url?: string;              // Current page URL
}
```

### **Example Usage:**
```typescript
// Create a custom log viewer
const CustomLogViewer = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(logger.getLogs());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h3>Custom Log Viewer</h3>
      {logs.map((log, index) => (
        <div key={index}>
          <strong>{log.level}</strong>: {log.message}
        </div>
      ))}
    </div>
  );
};
```

---

## 4. Remote Logging Services (Production)

### **Sentry Integration:**
```typescript
// Logs automatically sent to Sentry in production
if (config.errorReportingService === 'sentry' && window.Sentry) {
  window.Sentry.captureException(error);
}
```

### **Custom Remote Endpoint:**
```typescript
// Logs sent to your custom endpoint
await fetch(config.remoteLoggingEndpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    logs: entries,
    environment: 'production',
    timestamp: Date.now()
  })
});
```

### **Remote Logging Configuration:**
```typescript
// .env.production
VITE_REMOTE_LOGGING_ENDPOINT=https://logs.yourcompany.com/api/logs
VITE_ERROR_REPORTING_SERVICE=sentry
```

---

## 5. Environment-Specific Logging

### **Development Environment:**
```typescript
// .env.development
VITE_LOG_LEVEL=debug
VITE_ENABLE_REMOTE_LOGGING=false
```

**What you'll see:**
- All log levels (DEBUG, INFO, WARN, ERROR, CRITICAL)
- Console logging enabled
- No remote logging
- Detailed error context

### **Production Environment:**
```typescript
// .env.production
VITE_LOG_LEVEL=warn
VITE_ENABLE_REMOTE_LOGGING=true
VITE_REMOTE_LOGGING_ENDPOINT=https://logs.yourcompany.com/api/logs
```

**What you'll see:**
- Only WARN, ERROR, and CRITICAL logs
- Remote logging enabled
- Error reporting to external services
- Sanitized error messages

---

## 6. Browser Storage (Persistent Logs)

### **Local Storage Logs:**
```typescript
// Logs are automatically buffered in memory
// You can extend this to persist in localStorage

const persistLogs = () => {
  const logs = logger.getLogs();
  localStorage.setItem('app_logs', JSON.stringify(logs));
};

const loadPersistedLogs = () => {
  const persisted = localStorage.getItem('app_logs');
  if (persisted) {
    return JSON.parse(persisted);
  }
  return [];
};
```

---

## 7. Network Tab (API Logs)

### **How to Access:**
1. Open Developer Tools
2. Go to **Network** tab
3. Filter by **Fetch/XHR**
4. Look for requests to your API endpoints

### **What You'll See:**
```
POST /upload                   200 OK    1.2s
GET  /files                    200 OK    150ms
POST /capture-and-stream       500 Error 2.1s
```

### **Benefits:**
- ✅ See actual API requests
- ✅ Response times and status codes
- ✅ Request/response payloads
- ✅ Network errors

---

## 8. Performance Monitoring

### **Performance Logs:**
```typescript
// Performance metrics are automatically logged
globalErrorHandler.reportPerformanceMetric('api_response_time', 150);
globalErrorHandler.reportPerformanceMetric('file_upload_size', 2048576);
```

### **What You'll See:**
```
[INFO] Performance metric: api_response_time {metric: "api_response_time", value: 150}
[INFO] Performance metric: file_upload_size {metric: "file_upload_size", value: 2048576}
```

---

## Quick Start Guide

### **For Immediate Debugging:**
1. Open browser console (F12)
2. Look for colored log messages
3. Filter by log level using console filters

### **For Comprehensive Analysis:**
1. Add LogViewer component to your app
2. Click "View Logs" button
3. Use filters to find specific issues
4. Export logs for further analysis

### **For Production Monitoring:**
1. Configure remote logging endpoint
2. Set up Sentry or similar service
3. Monitor error rates and trends
4. Set up alerting for critical errors

---

## Troubleshooting

### **No Logs Appearing:**
- Check log level configuration
- Verify console logging is enabled
- Ensure hooks are properly initialized

### **Logs Not Persisting:**
- Check buffer size configuration
- Verify flush interval settings
- Monitor remote logging endpoint

### **Performance Issues:**
- Reduce log level in production
- Increase flush interval
- Limit buffer size
- Use remote logging for high-volume scenarios

This comprehensive logging system provides multiple ways to view and analyze logs, from simple console output to advanced filtering and export capabilities. 