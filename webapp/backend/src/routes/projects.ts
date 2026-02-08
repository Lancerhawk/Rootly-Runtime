import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { verifyRepoAccess } from '../services/github';
import { generateProjectId, generateApiKey, hashApiKey } from '../services/keys';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/', requireAuth, async (req, res, next) => {
    try {
        const user = req.user as any;
        const { repo_full_name, platform } = req.body;

        // Validate input
        if (!repo_full_name) {
            return res.status(400).json({
                error: {
                    code: 'MISSING_REPO',
                    message: 'repo_full_name is required',
                },
            });
        }

        if (!platform) {
            return res.status(400).json({
                error: {
                    code: 'MISSING_PLATFORM',
                    message: 'platform is required',
                },
            });
        }

        // Verify user has access to the repo
        const hasAccess = await verifyRepoAccess(user.githubAccessToken, repo_full_name);
        if (!hasAccess) {
            return res.status(403).json({
                error: {
                    code: 'REPO_ACCESS_DENIED',
                    message: 'You do not have access to this repository',
                },
            });
        }

        // Check if project already exists for this repo
        const existingProject = await prisma.project.findUnique({
            where: { repoFullName: repo_full_name },
        });

        if (existingProject) {
            return res.status(409).json({
                error: {
                    code: 'PROJECT_EXISTS',
                    message: 'A project already exists for this repository',
                },
            });
        }

        // Generate project ID and API key
        const projectId = generateProjectId();
        const apiKey = generateApiKey();
        const keyHash = await hashApiKey(apiKey);

        // Create project and API key in transaction
        const project = await prisma.project.create({
            data: {
                projectId,
                repoFullName: repo_full_name,
                platform,
                ownerUserId: user.id,
                apiKey: {
                    create: {
                        keyHash,
                    },
                },
            },
            include: {
                apiKey: true,
            },
        });

        // Return project with raw API key (ONLY TIME IT'S SHOWN)
        res.status(201).json({
            project: {
                id: project.id,
                project_id: project.projectId,
                repo_full_name: project.repoFullName,
                platform: project.platform,
                ingest_api_key: apiKey, // RAW KEY - SHOW ONCE
                created_at: project.createdAt,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/projects
 * List all projects for authenticated user
 */
router.get('/', requireAuth, async (req, res, next) => {
    try {
        const user = req.user as any;

        const projects = await prisma.project.findMany({
            where: {
                ownerUserId: user.id,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json({
            projects: projects.map(project => ({
                id: project.id,
                project_id: project.projectId,
                repo_full_name: project.repoFullName,
                platform: project.platform,
                created_at: project.createdAt,
                // NOTE: API key is NEVER returned after creation
            })),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/projects/:projectId
 * Delete a project (requires ownership)
 */
router.delete('/:projectId', requireAuth, async (req, res, next) => {
    try {
        const user = req.user as any;
        const { projectId } = req.params;

        if (!projectId || typeof projectId !== 'string') {
            return res.status(400).json({
                error: {
                    code: 'INVALID_PROJECT_ID',
                    message: 'Invalid project ID',
                },
            });
        }

        // Find the project
        const project = await prisma.project.findUnique({
            where: { projectId },
        });

        if (!project) {
            return res.status(404).json({
                error: {
                    code: 'PROJECT_NOT_FOUND',
                    message: 'Project not found',
                },
            });
        }

        // Verify ownership
        if (project.ownerUserId !== user.id) {
            return res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to delete this project',
                },
            });
        }

        // Delete project (cascade will delete API key)
        await prisma.project.delete({
            where: { projectId },
        });

        res.json({
            message: 'Project deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/projects/verify
 * Verify if a repository is registered for the authenticated user
 * Supports both session-based auth (dashboard) and API key auth (IDE extension)
 */
router.get('/verify', async (req, res, next) => {
    try {
        console.log('\n🔍 [VERIFY] Request received');
        console.log('📋 Query params:', req.query);
        console.log('🔑 Headers:', {
            authorization: req.headers.authorization,
            cookie: req.headers.cookie,
            'x-api-key': req.headers['x-api-key']
        });
        console.log('👤 Session authenticated:', req.isAuthenticated());
        console.log('👤 User from session:', req.user ? 'Yes' : 'No');

        const { repo } = req.query;

        if (!repo || typeof repo !== 'string') {
            console.log('❌ [VERIFY] Missing repo parameter');
            return res.status(400).json({
                error: {
                    code: 'MISSING_REPO',
                    message: 'repo query parameter is required',
                },
            });
        }

        let userId: string | null = null;

        // Try session-based auth first (for dashboard)
        if (req.isAuthenticated() && req.user) {
            userId = (req.user as any).id;
            console.log('✅ [VERIFY] Authenticated via session, userId:', userId);
        }
        // Try API key auth (for IDE extension)
        else {
            const apiKey = req.headers['x-api-key'] as string;
            console.log('🔑 [VERIFY] Trying API key auth, key provided:', !!apiKey);

            if (apiKey) {
                const hashedKey = await hashApiKey(apiKey);
                console.log('🔑 [VERIFY] Hashed key:', hashedKey.substring(0, 10) + '...');

                // Find API key first, then get the project
                const apiKeyRecord = await prisma.apiKey.findFirst({
                    where: { keyHash: hashedKey, revokedAt: null },
                    include: { project: { include: { owner: true } } },
                });

                if (apiKeyRecord && apiKeyRecord.project) {
                    userId = apiKeyRecord.project.ownerUserId;
                    console.log('✅ [VERIFY] Authenticated via API key, userId:', userId, 'project:', apiKeyRecord.project.projectId);
                } else {
                    console.log('❌ [VERIFY] Invalid API key - no project found with this key hash');
                }
            }
        }

        if (!userId) {
            console.log('❌ [VERIFY] No authentication method succeeded');
            return res.status(401).json({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required. Please provide session cookie or X-API-Key header.',
                },
            });
        }

        console.log('🔍 [VERIFY] Looking for project:', repo, 'for user:', userId);

        // Find project by repo name and user
        const project = await prisma.project.findFirst({
            where: {
                repoFullName: repo, // Changed 'repo_full_name' to 'repoFullName'
                ownerUserId: userId, // Changed 'user_id' to 'ownerUserId'
            },
        });

        if (!project) {
            console.log('❌ [VERIFY] Project not found');
            return res.status(404).json({
                exists: false,
                error: {
                    code: 'PROJECT_NOT_FOUND',
                    message: `No project found for repository "${repo}"`,
                },
            });
        }

        console.log('✅ [VERIFY] Project found:', project.projectId); // Changed 'project_id' to 'projectId'

        res.json({
            exists: true,
            project: {
                id: project.projectId, // Changed 'project_id' to 'projectId'
                repo: project.repoFullName, // Changed 'repo_full_name' to 'repoFullName'
                platform: project.platform,
            },
        });
    } catch (error) {
        console.error('💥 [VERIFY] Error:', error);
        next(error);
    }
});

export default router;
