import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Collapse
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { logger } from '../../services/logging';
import { LogLevel, LogEntry } from '../../services/logging';
import { globalErrorHandler } from '../../services/errorHandling';

interface LogViewerProps {
  show?: boolean;
  onClose?: () => void;
}

const LogViewer: React.FC<LogViewerProps> = ({ show = false, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [errorStats, setErrorStats] = useState<Record<string, number>>({});
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const tableRef = useRef<HTMLDivElement>(null);

  // Refresh logs
  const refreshLogs = () => {
    const currentLogs = logger.getLogs();
    setLogs(currentLogs);
    setErrorStats(globalErrorHandler.getErrorStats());
  };

  // Clear logs
  const clearLogs = () => {
    logger.clearLogs();
    setLogs([]);
    setFilteredLogs([]);
    setErrorStats({});
  };

  // Download logs as JSON
  const downloadLogs = () => {
    const logData = {
      logs: filteredLogs,
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE,
      stats: errorStats
    };

    const blob = new Blob([JSON.stringify(logData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Toggle row expansion
  const toggleRowExpansion = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  // Filter logs
  useEffect(() => {
    let filtered = logs;

    // Level filter
    if (levelFilter !== 'ALL') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    // Category filter
    if (categoryFilter !== 'ALL') {
      filtered = filtered.filter(log => log.category === categoryFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(term) ||
        log.category.toLowerCase().includes(term) ||
        (log.context && JSON.stringify(log.context).toLowerCase().includes(term))
      );
    }

    setFilteredLogs(filtered);
  }, [logs, levelFilter, categoryFilter, searchTerm]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refreshLogs, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Initial load
  useEffect(() => {
    refreshLogs();
  }, []);

  // Scroll to bottom on new logs
  useEffect(() => {
    if (tableRef.current && autoRefresh) {
      tableRef.current.scrollTop = tableRef.current.scrollHeight;
    }
  }, [filteredLogs]);

  if (!show) return null;

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG: return 'default';
      case LogLevel.INFO: return 'info';
      case LogLevel.WARN: return 'warning';
      case LogLevel.ERROR: return 'error';
      case LogLevel.CRITICAL: return 'error';
      default: return 'default';
    }
  };

  const getCategories = () => {
    const categories = new Set(logs.map(log => log.category));
    return Array.from(categories).sort();
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatContext = (context: any) => {
    if (!context) return '';
    try {
      return JSON.stringify(context, null, 2);
    } catch {
      return String(context);
    }
  };

  return (
    <Box sx={{ p: 2, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            Log Viewer
          </Typography>
          <Box>
            <IconButton onClick={refreshLogs} title="Refresh logs">
              <RefreshIcon />
            </IconButton>
            <IconButton onClick={clearLogs} title="Clear logs" color="warning">
              <ClearIcon />
            </IconButton>
            <IconButton onClick={downloadLogs} title="Download logs" color="primary">
              <DownloadIcon />
            </IconButton>
            {onClose && (
              <Button onClick={onClose} variant="outlined" sx={{ ml: 1 }}>
                Close
              </Button>
            )}
          </Box>
        </Box>

        {/* Error Statistics */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Error Statistics:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {Object.entries(errorStats).map(([category, count]) => (
              <Chip
                key={category}
                label={`${category}: ${count}`}
                size="small"
                color="error"
                variant="outlined"
              />
            ))}
            {Object.keys(errorStats).length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No errors recorded
              </Typography>
            )}
          </Box>
        </Alert>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ minWidth: 200 }}
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Level</InputLabel>
            <Select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as LogLevel | 'ALL')}
              label="Level"
            >
              <MenuItem value="ALL">All Levels</MenuItem>
              {Object.values(LogLevel).map(level => (
                <MenuItem key={level} value={level}>
                  {level.toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              label="Category"
            >
              <MenuItem value="ALL">All Categories</MenuItem>
              {getCategories().map(category => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant={autoRefresh ? 'contained' : 'outlined'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            startIcon={<RefreshIcon />}
            size="small"
          >
            Auto-refresh
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Showing {filteredLogs.length} of {logs.length} logs
        </Typography>
      </Paper>

      {/* Logs Table */}
      <Paper sx={{ flex: 1, overflow: 'hidden' }}>
        <TableContainer ref={tableRef} sx={{ height: '100%', maxHeight: 'calc(100vh - 300px)' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Session</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.map((log, index) => (
                <React.Fragment key={index}>
                  <TableRow hover>
                    <TableCell>
                      <Typography variant="caption">
                        {formatTimestamp(log.timestamp)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.level.toUpperCase()}
                        color={getLevelColor(log.level) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{log.category}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 300, wordBreak: 'break-word' }}>
                        {log.message}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {log.userId || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {log.sessionId ? log.sessionId.substring(0, 8) + '...' : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {(log.context || log.error) && (
                        <IconButton
                          size="small"
                          onClick={() => toggleRowExpansion(index)}
                        >
                          {expandedRows.has(index) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
                      <Collapse in={expandedRows.has(index)}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                          {log.context && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                                Context:
                              </Typography>
                              <Box
                                component="pre"
                                sx={{
                                  fontSize: '0.75rem',
                                  bgcolor: 'grey.100',
                                  p: 1,
                                  borderRadius: 1,
                                  overflow: 'auto',
                                  maxHeight: 200,
                                  mt: 1
                                }}
                              >
                                {formatContext(log.context)}
                              </Box>
                            </Box>
                          )}
                          {log.error && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                                Error:
                              </Typography>
                              <Box
                                component="pre"
                                sx={{
                                  fontSize: '0.75rem',
                                  bgcolor: 'error.light',
                                  color: 'error.contrastText',
                                  p: 1,
                                  borderRadius: 1,
                                  overflow: 'auto',
                                  maxHeight: 200,
                                  mt: 1
                                }}
                              >
                                {log.error.stack || log.error.message}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default LogViewer; 