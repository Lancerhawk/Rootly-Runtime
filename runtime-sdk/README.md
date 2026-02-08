# @rootly/runtime

Production-grade runtime error tracking for Node.js applications.

## Installation

```bash
npm install @rootly/runtime
```

## Quick Start

```typescript
import { init } from '@rootly/runtime';

// Initialize at app startup
init({
  apiKey: process.env.ROOTLY_API_KEY!,
});

// That's it! All unhandled errors are now captured
```

## Usage

### Basic Setup (Required)

```typescript
import { init } from '@rootly/runtime';

init({
  apiKey: process.env.ROOTLY_API_KEY!,  // Required: Get from Rootly dashboard
  environment: 'production',             // Optional: 'production' or 'preview' (default: NODE_ENV)
  debug: true                            // Optional: Enable debug logging (default: false)
});
```

**What happens automatically:**
- ✅ Captures all `uncaughtException` errors
- ✅ Captures all `unhandledRejection` errors  
- ✅ Deduplicates identical errors (10s window)
- ✅ Rate limits to 20 errors/60s
- ✅ Auto-detects commit SHA from environment
- ✅ Graceful shutdown handling

### Manual Error Capture

```typescript
import { capture } from '@rootly/runtime';

try {
  // Your code...
} catch (error) {
  // Capture with custom context
  capture(error, { 
    user_id: '12345',
    action: 'checkout',
    amount: 99.99
  });
  
  // Handle error gracefully
  res.status(500).json({ error: 'Something went wrong' });
}
```

### Severity Levels (New in v1.2.0)

```typescript
import { capture } from '@rootly/runtime';

// Error (default)
capture(error, { user_id: '123' }, 'error');

// Warning
capture(error, { deprecation: 'old_api' }, 'warning');

// Info
capture(error, { event: 'migration_complete' }, 'info');
```

### Wrap Functions (Auto-Capture)

```typescript
import { wrap } from '@rootly/runtime';

// Wrap sync functions
const processPayment = wrap((amount: number) => {
  if (amount < 0) throw new Error('Invalid amount');
  // Process payment...
});

// Wrap async functions
const fetchUser = wrap(async (userId: string) => {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) throw new Error('User not found');
  return response.json();
});

// Errors are captured AND re-thrown
try {
  await fetchUser('123');
} catch (error) {
  // Error was sent to Rootly, now handle it
}
```

### Express Middleware (5xx Error Capture)

```typescript
import express from 'express';
import { init, expressErrorHandler } from '@rootly/runtime';

init({ apiKey: process.env.ROOTLY_API_KEY! });

const app = express();

// Your routes
app.get('/api/users', async (req, res) => {
  // Your code...
});

// Add Rootly error handler BEFORE your final error handler
app.use(expressErrorHandler());

// Your final error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

app.listen(3000);
```

**Behavior**:
- ✅ Captures errors when `res.statusCode >= 500`
- ❌ Ignores 4xx errors (validation, auth, etc.)
- Adds Express context: `method`, `path`, `status_code`, `source: 'express'`
- Always calls `next(err)` to continue error chain

## Configuration

### Required

- `apiKey` - Your Rootly API key from the dashboard

### Optional

- `environment` - `'production'` or `'preview'` (default: `process.env.NODE_ENV` or `'production'`)
  - `'production'` or `'prod'` → normalized to `'production'`
  - All other values → normalized to `'preview'`
- `debug` - Enable debug logging to stderr (default: `false`)

### Advanced: Custom Backend URL

For development, staging, or self-hosted deployments, set the `ROOTLY_API_URL` environment variable:

```bash
# Development
export ROOTLY_API_URL=http://localhost:5000

# Staging
export ROOTLY_API_URL=https://staging.rootly.io

# Self-hosted
export ROOTLY_API_URL=https://rootly.your-company.com
```

**Note**: This is an advanced feature. Normal users should not configure this.

## Features

### Production-Grade Hardening (v1.2.0)

- ✅ **Environment Normalization** - Automatic production/preview normalization
- ✅ **Recursive Capture Protection** - Prevents infinite loops if SDK throws
- ✅ **Stable Fingerprinting** - Consistent error deduplication
- ✅ **Severity Support** - error/warning/info levels
- ✅ **Hard Memory Cap** - Max 500 fingerprints (auto-cleanup)
- ✅ **Optimized Rate Limiter** - O(n) performance
- ✅ **Debug Mode** - Optional stderr logging
- ✅ **Real Graceful Shutdown** - Tracks pending requests

### Core Features

- ✅ Zero dependencies (uses native Node.js `https` module)
- ✅ Captures `uncaughtException` and `unhandledRejection`
- ✅ Express middleware for 5xx server errors
- ✅ Manual error capture with custom context
- ✅ Function wrapping for auto-capture
- ✅ Auto-detects commit SHA from multiple platforms
- ✅ Production-safe (never crashes your app)
- ✅ Minimal overhead (283 lines total)

### Production Safety

- ✅ **Error Deduplication** - Same error within 10s sent only once
- ✅ **Rate Limiting** - Max 20 errors per 60 seconds
- ✅ **Graceful Shutdown** - Handles SIGTERM and beforeExit
- ✅ **Fail-Silent** - Never throws errors internally
- ✅ **No Retries** - Keeps it simple
- ✅ **No Queueing** - Immediate send

## Commit SHA Detection

The SDK automatically detects commit SHA from environment variables (in priority order):

1. `VERCEL_GIT_COMMIT_SHA` (Vercel)
2. `RENDER_GIT_COMMIT` (Render)
3. `GITHUB_SHA` (GitHub Actions)
4. `COMMIT_SHA` (Custom)

### Manual Setup

For platforms without auto-detection:

```bash
# Docker
docker run -e COMMIT_SHA=$(git rev-parse HEAD) your-image

# Other platforms
export COMMIT_SHA=$(git rev-parse HEAD)
```

## API Reference

### `init(options: InitOptions): void`

Initialize the SDK. Must be called before other functions.

**Options**:
- `apiKey: string` - Required. Your Rootly API key
- `environment?: 'production' | 'preview'` - Optional. Defaults to `process.env.NODE_ENV` or `'production'`
- `debug?: boolean` - Optional. Enable debug logging. Defaults to `false`

### `capture(error: Error, extraContext?: object, severity?: 'error' | 'warning' | 'info'): void`

Manually capture an error with optional custom context and severity.

**Example**:
```typescript
capture(new Error('Payment failed'), { 
  user_id: '123',
  amount: 99.99 
}, 'error');
```

### `wrap<T>(fn: T): T`

Wrap a function to automatically capture errors. Works with both sync and async functions.

**Example**:
```typescript
const safeFunction = wrap(() => {
  // Your code that might throw
});
```

### `expressErrorHandler(): ExpressErrorHandler`

Express middleware for capturing 5xx errors. Place before your final error handler.

**Example**:
```typescript
app.use(expressErrorHandler());
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
```

## Changelog

### v1.2.0 (2026-02-09)

**Production Hardening Release**

- ✅ Environment normalization with NODE_ENV fallback
- ✅ Removed `apiUrl` from public API (use `ROOTLY_API_URL` env var)
- ✅ Recursive capture protection using Symbol flag
- ✅ Stable fingerprinting algorithm
- ✅ Severity support (error/warning/info)
- ✅ Hard memory cap (500 max fingerprints)
- ✅ Optimized rate limiter (O(n) performance)
- ✅ Debug mode with stderr logging
- ✅ Real graceful shutdown tracking
- ✅ Fixed listener guard bug (SDK now always registers)
- ✅ Fixed transport decrement bug
- ✅ Nullish coalescing for severity

### v1.0.0 (2026-02-08)

- Initial release
- Basic error capture and reporting
- Express middleware
- Function wrapping

## License

MIT
