import * as https from 'https';
import * as http from 'http';

let pendingRequests = 0;

export function getPendingRequests(): number {
    return pendingRequests;
}

export function sendPayload(payload: any, apiKey: string, apiUrl: string): void {
    try {
        const data = JSON.stringify(payload);
        // Parse URL
        const url = new URL(apiUrl + '/api/ingest');
        const isHttps = url.protocol === 'https:';
        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                'Authorization': `Bearer ${apiKey}`,
            },
            timeout: 5000,
        };
        pendingRequests++;
        const client = isHttps ? https : http;
        const req = client.request(options, (res) => {
            res.on('data', () => { });
            res.on('end', () => {
                pendingRequests--;
            });
        });
        req.on('error', () => {
            pendingRequests--;
        });
        req.on('timeout', () => {
            req.destroy();
            pendingRequests--;
        });
        req.write(data);
        req.end();
    } catch (err) {
        // Do not decrement here - only decrement in handlers after increment
    }
}
