/**
 * Core error capture logic with deduplication and rate limiting
 */

import { buildContext } from './context';
import { sendPayload } from './transport';

const ROOTLY_CAPTURED = Symbol('rootly_captured');
const errorFingerprints = new Map<string, number>();
const DEDUP_WINDOW_MS = 10000;
const MAX_FINGERPRINTS = 500;
const errorTimestamps: number[] = [];
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60000;

let debugMode = false;

export function setDebugMode(enabled: boolean): void {
    debugMode = enabled;
}

function debugLog(message: string): void {
    if (debugMode) process.stderr.write(`[Rootly SDK] ${message}\n`);
}

function getStableStackFrame(stack: string): string {
    try {
        const lines = stack.split('\n');
        // Skip first line (error message), find first non-empty stack frame
        for (let i = 1; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            if (trimmed) return trimmed.replace(/\s+/g, ' ');
        }
        return '';
    } catch (err) {
        return '';
    }
}

function computeFingerprint(error: Error): string {
    try {
        const message = error.message || 'Unknown';
        const stableFrame = getStableStackFrame(error.stack || '');
        return `${message}:${stableFrame}`;
    } catch (err) {
        return 'unknown';
    }
}

function shouldDeduplicate(fingerprint: string): boolean {
    const now = Date.now();
    const lastSent = errorFingerprints.get(fingerprint);

    if (lastSent && (now - lastSent) < DEDUP_WINDOW_MS) {
        debugLog(`Deduplicated: ${fingerprint.substring(0, 50)}...`);
        return true;
    }

    errorFingerprints.set(fingerprint, now);

    // Hard memory cap: delete oldest 50% if exceeded
    if (errorFingerprints.size > MAX_FINGERPRINTS) {
        const entries = Array.from(errorFingerprints.entries());
        entries.sort((a, b) => a[1] - b[1]); // Sort by timestamp
        const toDelete = Math.floor(MAX_FINGERPRINTS / 2);
        for (let i = 0; i < toDelete; i++) {
            errorFingerprints.delete(entries[i][0]);
        }
        debugLog(`Memory cap: deleted ${toDelete} old fingerprints`);
    }
    return false;
}

function isRateLimited(): boolean {
    const now = Date.now();

    let validIndex = 0;
    while (validIndex < errorTimestamps.length && now - errorTimestamps[validIndex] > RATE_LIMIT_WINDOW_MS) {
        validIndex++;
    }
    if (validIndex > 0) errorTimestamps.splice(0, validIndex);

    if (errorTimestamps.length >= RATE_LIMIT_MAX) {
        debugLog('Rate limited: 20/60s exceeded');
        return true;
    }
    errorTimestamps.push(now);
    return false;
}

export function captureError(
    error: Error,
    apiKey: string,
    environment: string,
    apiUrl: string,
    extraContext?: any,
    severity?: 'error' | 'warning' | 'info'
): void {
    try {
        // Recursive capture protection
        if ((error as any)[ROOTLY_CAPTURED]) {
            debugLog('Recursive capture prevented');
            return;
        }
        (error as any)[ROOTLY_CAPTURED] = true;

        const fingerprint = computeFingerprint(error);
        if (shouldDeduplicate(fingerprint)) return;
        if (isRateLimited()) return;

        const payload = {
            error: {
                message: error.message || 'Unknown error',
                type: error.name || 'Error',
                stack: error.stack || 'No stack trace available',
                severity: severity ?? 'error',
            },
            context: buildContext(environment, extraContext),
        };
        debugLog(`Sending: ${error.message} (${severity ?? 'error'})`);
        sendPayload(payload, apiKey, apiUrl);
    } catch (err) {
        // Fail silently
    }
}
