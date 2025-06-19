# Frontend Architecture Documentation

## Overview
This frontend application follows enterprise-level organization patterns with clear separation of concerns, maintainable code structure, and professional development practices.

## Directory Structure

```
src/
├── components/          # Reusable UI components
├── handlers/           # Event handlers and business logic
│   ├── fileHandlers.ts # File operation handlers
│   ├── streamingHandlers.ts # Streaming operation handlers
│   └── index.ts        # Handler exports
├── hooks/              # Custom React hooks
├── services/           # API and external service integrations
│   ├── api.ts          # Centralized API service
│   └── index.ts        # Service exports
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── App.tsx             # Main application component
```

## Architecture Patterns

### 1. Service Layer (`services/`)
- **Purpose**: Centralized API communication and external service integration
- **Pattern**: Singleton service classes with static methods
- **Benefits**: 
  - Single source of truth for API calls
  - Easy to mock for testing
  - Consistent error handling
  - Centralized configuration

### 2. Handler Layer (`handlers/`)
- **Purpose**: Business logic and event handling
- **Pattern**: Class-based handlers with static methods
- **Benefits**:
  - Separation of concerns
  - Reusable business logic
  - Testable in isolation
  - Clear responsibility boundaries

### 3. Component Layer (`components/`)
- **Purpose**: Reusable UI components
- **Pattern**: Functional components with TypeScript
- **Benefits**:
  - Modular and composable
  - Props-based communication
  - Consistent styling with Material-UI

## Key Design Principles

### 1. Single Responsibility Principle
Each module has a single, well-defined responsibility:
- `ApiService`: API communication only
- `FileHandlers`: File operations only
- `StreamingHandlers`: Streaming operations only

### 2. Dependency Injection
Handlers accept callback functions for side effects:
```typescript
await FileHandlers.handleFileUpload(event, loadFiles, handleError);
```

### 3. Error Handling
Consistent error handling patterns across all layers:
- API errors are logged and can be handled by callbacks
- UI errors are displayed through the ErrorAlert component

### 4. Type Safety
Full TypeScript implementation with:
- Proper type definitions in `types/`
- Strict typing for all function parameters
- Interface-based component props

## Usage Examples

### File Operations
```typescript
// Upload file
await FileHandlers.handleFileUpload(event, loadFiles);

// Delete file
await FileHandlers.handleFileDelete(file, selectedFileName, loadFiles);

// Select file
FileHandlers.handleFileSelect(file, setSelectedFile, handleFileSelect);
```

### Streaming Operations
```typescript
// Start streaming
await StreamingHandlers.handleCaptureAndStream(
  () => setIsStreaming(true),
  () => setIsStreaming(false),
  loadFiles
);

// Stop streaming
await StreamingHandlers.handleStopStreaming(
  () => setIsStreaming(false),
  undefined,
  loadFiles
);
```

### API Operations
```typescript
// Direct API calls (if needed)
await ApiService.uploadFile(file);
await ApiService.deleteFile(fileName);
await ApiService.getAudioDevices();
```

## Testing Strategy

### Unit Testing
- Test handlers in isolation with mocked dependencies
- Test API service with mocked axios calls
- Test components with mocked props and callbacks

### Integration Testing
- Test complete user workflows
- Test error scenarios and edge cases
- Test component interactions

## Best Practices

1. **Immutability**: Use callback patterns to avoid direct state mutations
2. **Composition**: Prefer composition over inheritance
3. **Error Boundaries**: Implement proper error boundaries for React components
4. **Performance**: Use React.memo and useCallback for expensive operations
5. **Documentation**: JSDoc comments for all public methods
6. **Consistency**: Follow established patterns across the codebase

## Future Enhancements

1. **State Management**: Consider Redux Toolkit for complex state
2. **Caching**: Implement API response caching
3. **Offline Support**: Add service worker for offline functionality
4. **Internationalization**: Add i18n support
5. **Accessibility**: Enhance ARIA labels and keyboard navigation 