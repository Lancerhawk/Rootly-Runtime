import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/incidents
 * Read incidents for a repository
 * 
 * Authentication: GitHub OAuth JWT (same as dashboard)
 * 
 * Query parameters:
 * - repo (required): "owner/repo" format
 * - status (optional): "open" or "resolved" (default: "open")
 * - limit (optional): number of results (default: 50)
 * - offset (optional): pagination offset (default: 0)
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        // 1. Authenticate user via JWT (req.user set by Passport)
        if (!req.isAuthenticated() || !req.user) {
            return res.status(401).json({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required',
                },
            });
        }

        const userId = (req.user as any).id;

        // 2. Validate query parameters
        const { repo, status = 'open', limit = '50', offset = '0' } = req.query;

        if (!repo || typeof repo !== 'string') {
            return res.status(400).json({
                error: {
                    code: 'MISSING_PARAMETER',
                    message: 'repo query parameter is required',
                },
            });
        }

        // Validate status
        const validStatuses = ['open', 'resolved'];
        if (status && !validStatuses.includes(status as string)) {
            return res.status(400).json({
                error: {
                    code: 'INVALID_PARAMETER',
                    message: 'status must be "open" or "resolved"',
                },
            });
        }

        // Parse limit and offset
        const limitNum = parseInt(limit as string, 10);
        const offsetNum = parseInt(offset as string, 10);

        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({
                error: {
                    code: 'INVALID_PARAMETER',
                    message: 'limit must be between 1 and 100',
                },
            });
        }

        if (isNaN(offsetNum) || offsetNum < 0) {
            return res.status(400).json({
                error: {
                    code: 'INVALID_PARAMETER',
                    message: 'offset must be a non-negative number',
                },
            });
        }

        // 3. Find project by repo_full_name and owner_user_id
        const project = await prisma.project.findFirst({
            where: {
                repoFullName: repo,
                ownerUserId: userId,
            },
        });

        if (!project) {
            return res.status(404).json({
                error: {
                    code: 'PROJECT_NOT_FOUND',
                    message: 'Repository not found or not owned by user',
                },
            });
        }

        // 4. Query incidents
        const incidents = await prisma.incident.findMany({
            where: {
                projectId: project.id,
                status: status as string,
            },
            orderBy: {
                occurredAt: 'desc',
            },
            take: limitNum,
            skip: offsetNum,
            select: {
                incidentId: true,
                summary: true,
                status: true,
                environment: true,
                commitSha: true,
                occurredAt: true,
                stackTrace: true,
                errorType: true,
            },
        });

        // 5. Format response
        const formattedIncidents = incidents.map((incident) => ({
            incident_id: incident.incidentId,
            summary: incident.summary,
            status: incident.status,
            environment: incident.environment,
            commit_sha: incident.commitSha,
            occurred_at: incident.occurredAt.toISOString(),
            stack_trace: incident.stackTrace,
            error_type: incident.errorType,
        }));

        res.status(200).json({
            incidents: formattedIncidents,
        });
    } catch (error) {
        console.error('Error fetching incidents:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching incidents',
            },
        });
    }
});

export default router;
