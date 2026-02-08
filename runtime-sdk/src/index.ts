/**
 * rootly-runtime - Production-grade runtime error tracking for Node.js
 */

import { captureError, setDebugMode } from './runtime';
import { getPendingRequests } from './transport';

interface InitOptions {
    apiKey: string;
    environment?: string;
    debug?: boolean;
}

const DEFAULT_API_URL = 'https://3.111.33.111.nip.io';

let isInitialized = false;
let apiKey: string;
let environment: 'production' | 'preview';
let apiUrl: string;

function normalizeEnvironment(env?: string): 'production' | 'preview' {
    if (!env) return 'production';
    const normalized = env.toLowerCase().trim();
    return (normalized === 'production' || normalized === 'prod') ? 'production' : 'preview';
}

export function init(options: InitOptions): void {
    try {
        if (!options.apiKey || typeof options.apiKey !== 'string') return;
        if (isInitialized) return;

        apiKey = options.apiKey;
        environment = normalizeEnvironment(options.environment || process.env.NODE_ENV);
        apiUrl = process.env.ROOTLY_API_URL?.trim() || DEFAULT_API_URL;
        isInitialized = true;

        if (options.debug) setDebugMode(true);

        process.prependListener('uncaughtException', handleError);
        process.prependListener('unhandledRejection', handleRejection);

        process.on('beforeExit', () => {
            if (getPendingRequests() > 0) setTimeout(() => { }, 200);
        });
        process.on('SIGTERM', () => {
            if (getPendingRequests() > 0) setTimeout(() => { }, 200);
        });
    } catch (error) {
        // Fail silently
    }
}

export function capture(error: Error, extraContext?: any, severity?: 'error' | 'warning' | 'info'): void {
    try {
        if (!apiKey) return;
        captureError(error, apiKey, environment, apiUrl, extraContext, severity);
    } catch (err) {
        // Fail silently
    }
}

export function wrap<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: any[]) => {
        try {
            const result = fn(...args);
            if (result && typeof result.then === 'function') {
                return result.catch((error: any) => {
                    const err = error instanceof Error ? error : new Error(String(error));
                    capture(err);
                    throw error;
                });
            }
            return result;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            capture(err);
            throw error;
        }
    }) as T;
}

export function expressErrorHandler() {
    return (err: any, req: any, res: any, next: any): void => {
        try {
            if (!apiKey) return next(err);
            if (res.statusCode >= 500) {
                const error = err instanceof Error ? err : new Error(String(err));
                const extraContext = {
                    source: 'express',
                    method: req.method,
                    path: req.path || req.url,
                    status_code: res.statusCode,
                };
                captureError(error, apiKey, environment, apiUrl, extraContext);
            }
            next(err);
        } catch (error) {
            next(err);
        }
    };
}

function handleError(error: Error): void {
    try {
        captureError(error, apiKey, environment, apiUrl);
    } catch (err) {
        // Fail silently
    }
}

function handleRejection(reason: any): void {
    try {
        const error = reason instanceof Error ? reason : new Error(String(reason));
        captureError(error, apiKey, environment, apiUrl);
    } catch (err) {
        // Fail silently
    }
}
