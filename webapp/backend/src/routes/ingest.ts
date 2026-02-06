import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyApiKey, generateIncidentId } from '../services/keys';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/ingest
 * Accept production error telemetry with strict validation
 * 
 * Expected payload:
 * {
 *   "error": {
 *     "message": "TypeError: Cannot read property 'id'",
 *     "type": "TypeError",
 *     "stack": "TypeError...\n at checkout.ts:42:10"
 *   },
 *   "context": {
 *     "commit_sha": "40_char_git_sha",
 *     "environment": "production" | "preview",
 *     "occurred_at": "ISO_8601_TIMESTAMP"
 *   }
 * }
 */
router.post('/', async (req, res, next) => {
    try {
        // 1. Validate Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: {
                    code: 'MISSING_API_KEY',
                    message: 'Authorization header with Bearer token required',
                },
            });
        }

        const apiKey = authHeader.substring(7); // Remove 'Bearer '

        // 2. Find and verify API key
        // Get all active API keys and verify against the provided key
        const apiKeyRecords = await prisma.apiKey.findMany({
            where: {
                revokedAt: null, // Only active keys
            },
            include: {
                project: true,
            },
        });

        // Find the matching API key by verifying the hash
        let apiKeyRecord = null;
        for (const record of apiKeyRecords) {
            const isValid = await verifyApiKey(apiKey, record.keyHash);
            if (isValid) {
                apiKeyRecord = record;
                break;
            }
        }

        if (!apiKeyRecord) {
            return res.status(401).json({
                error: {
                    code: 'INVALID_API_KEY',
                    message: 'Invalid or revoked API key',
                },
            });
        }

        // 3. Validate payload structure
        const { error, context } = req.body;

        // Validate error object
        if (!error || typeof error !== 'object') {
            return res.status(400).json({
                error: {
                    code: 'INVALID_PAYLOAD',
                    message: 'error object is required',
                },
            });
        }

        if (!error.message || typeof error.message !== 'string') {
            return res.status(400).json({
                error: {
                    code: 'INVALID_PAYLOAD',
                    message: 'error.message is required',
                },
            });
        }

        if (!error.stack || typeof error.stack !== 'string') {
            return res.status(400).json({
                error: {
                    code: 'INVALID_PAYLOAD',
                    message: 'error.stack is required',
                },
            });
        }

        // Validate context object
        if (!context || typeof context !== 'object') {
            return res.status(400).json({
                error: {
                    code: 'INVALID_PAYLOAD',
                    message: 'context object is required',
                },
            });
        }

        if (!context.commit_sha || typeof context.commit_sha !== 'string') {
            return res.status(400).json({
                error: {
                    code: 'INVALID_PAYLOAD',
                    message: 'context.commit_sha is required',
                },
            });
        }

        // Validate commit SHA format (must be exactly 40 lowercase hex characters)
        const commitShaRegex = /^[a-f0-9]{40}$/;
        if (!commitShaRegex.test(context.commit_sha)) {
            return res.status(400).json({
                error: {
                    code: 'INVALID_PAYLOAD',
                    message: 'context.commit_sha must be a valid 40-character lowercase hex Git SHA',
                },
            });
        }

        // Validate environment (must be 'production' or 'preview')
        const validEnvironments = ['production', 'preview'];
        if (!context.environment || !validEnvironments.includes(context.environment)) {
            return res.status(400).json({
                error: {
                    code: 'INVALID_PAYLOAD',
                    message: 'context.environment must be "production" or "preview"',
                },
            });
        }

        // Validate occurred_at (must be valid ISO 8601 timestamp)
        if (!context.occurred_at || typeof context.occurred_at !== 'string') {
            return res.status(400).json({
                error: {
                    code: 'INVALID_PAYLOAD',
                    message: 'context.occurred_at is required',
                },
            });
        }

        const occurredAt = new Date(context.occurred_at);
        if (isNaN(occurredAt.getTime())) {
            return res.status(400).json({
                error: {
                    code: 'INVALID_PAYLOAD',
                    message: 'context.occurred_at must be a valid ISO 8601 timestamp',
                },
            });
        }

        // 4. Create incident
        const incidentId = generateIncidentId();
        const incident = await prisma.incident.create({
            data: {
                incidentId,
                projectId: apiKeyRecord.project.id,
                repoFullName: apiKeyRecord.project.repoFullName,
                summary: error.message,
                stackTrace: error.stack,
                errorType: error.type || null,
                commitSha: context.commit_sha,
                environment: context.environment,
                occurredAt: occurredAt,
                status: 'open',
            },
        });

        // 5. Return success response
        res.status(201).json({
            incident_id: incident.incidentId,
            status: 'created',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
