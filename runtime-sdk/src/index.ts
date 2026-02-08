import * as https from 'https';

interface InitOptions {
    apiKey: string;
    environment?: 'production' | 'preview';
}

interface ErrorPayload {
    error: {
        message: string;
        type: string;
        stack: string;
    };
    context: {
        commit_sha: string;
        environment: string;
        occurred_at: string;
    };
}

let isInitialized = false;
let apiKey: string;
let environment: string;

/**
 * Initialize Rootly runtime error tracking
 */
export function init(options: InitOptions): void {
    try {
        // Validate API key
        if (!options.apiKey || typeof options.apiKey !== 'string') {
            return; // Fail silently
        }

        if (isInitialized) {
            return; // Already initialized
        }

        apiKey = options.apiKey;
        environment = options.environment || process.env.NODE_ENV || 'production';
        isInitialized = true;

        // Register error handlers (prepend to run before other handlers)
        process.prependListener('uncaughtException', handleError);
        process.prependListener('unhandledRejection', handleRejection);
    } catch (error) {
        // Fail silently - never crash the host app
    }
}

/**
 * Handle uncaught exceptions
 */
function handleError(error: Error): void {
    try {
        captureError(error);
    } catch (err) {
        // Fail silently
    }
}

/**
 * Handle unhandled promise rejections
 */
function handleRejection(reason: any): void {
    try {
        const error = reason instanceof Error ? reason : new Error(String(reason));
        captureError(error);
    } catch (err) {
        // Fail silently
    }
}

/**
 * Capture and send error to backend
 */
function captureError(error: Error): void {
    try {
        // Extract commit SHA from environment
        const commitSha = process.env.VERCEL_GIT_COMMIT_SHA || '';

        // Build payload
        const payload: ErrorPayload = {
            error: {
                message: error.message || 'Unknown error',
                type: error.name || 'Error',
                stack: error.stack || 'No stack trace available',
            },
            context: {
                commit_sha: commitSha,
                environment: environment,
                occurred_at: new Date().toISOString(),
            },
        };

        // Send to backend
        sendToBackend(payload);
    } catch (err) {
        // Fail silently
    }
}

/**
 * Send payload to Rootly backend using native https module
 */
function sendToBackend(payload: ErrorPayload): void {
    try {
        const data = JSON.stringify(payload);

        const options = {
            hostname: '3.111.33.111.nip.io',
            port: 443,
            path: '/api/ingest',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                'Authorization': `Bearer ${apiKey}`,
            },
            timeout: 5000,
        };

        const req = https.request(options, (res) => {
            // Consume response to free up memory
            res.on('data', () => { });
            res.on('end', () => { });
        });

        // Handle errors silently
        req.on('error', () => { });
        req.on('timeout', () => {
            req.destroy();
        });

        // Send payload
        req.write(data);
        req.end();
    } catch (err) {
        // Fail silently
    }
}
