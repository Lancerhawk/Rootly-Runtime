# @rootly/runtime

Minimal runtime error tracking for Node.js production applications.

## Installation

```bash
npm install @rootly/runtime
```

## Usage

```typescript
import { init } from '@rootly/runtime';

// Initialize at app startup
init({
  apiKey: process.env.ROOTLY_API_KEY!,
  environment: 'production', // or 'preview'
});

// That's it! All unhandled errors are now captured
```

## Features

- ✅ Zero dependencies (uses native Node.js `https` module)
- ✅ Captures `uncaughtException` and `unhandledRejection`
- ✅ Auto-detects commit SHA from `VERCEL_GIT_COMMIT_SHA`
- ✅ Production-safe (never crashes your app)
- ✅ Minimal overhead

## Configuration

### Required

- `apiKey` - Your Rootly API key from the dashboard

### Optional

- `environment` - `'production'` or `'preview'` (default: `'production'`)

## Commit SHA Detection

The SDK automatically reads `process.env.VERCEL_GIT_COMMIT_SHA` for Vercel deployments.

For other platforms, set this environment variable:

```bash
# Docker
docker run -e VERCEL_GIT_COMMIT_SHA=$(git rev-parse HEAD) your-image

# Other platforms
export VERCEL_GIT_COMMIT_SHA=$(git rev-parse HEAD)
```

## How It Works

1. Registers global error handlers
2. Captures error details (message, type, stack)
3. Sends to `https://3.111.33.111.nip.io/api/ingest`
4. Fails silently on network errors

## Production Safety

- Never throws errors internally
- All operations wrapped in try-catch
- Network failures are silent
- No retry logic (keeps it simple)
- No queueing (immediate send)

## License

MIT
