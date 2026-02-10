/**
 * Context building and commit SHA detection
 */

/**
 * Detect commit SHA from environment variables
 * Priority: VERCEL_GIT_COMMIT_SHA > RENDER_GIT_COMMIT > GITHUB_SHA > COMMIT_SHA
 */
export function getCommitSha(): string {
    const envSha =
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.RENDER_GIT_COMMIT ||
        process.env.RAILWAY_GIT_COMMIT_SHA ||
        process.env.GITHUB_SHA ||
        process.env.COMMIT_SHA ||
        '';

    // If no commit SHA found, generate a fallback (40 lowercase hex chars)
    // This ensures backend validation passes even in local development
    if (!envSha || envSha.length !== 40) {
        return '0000000000000000000000000000000000000000';
    }

    return envSha.toLowerCase();
}

/**
 * Build context object for error payload
 */
export function buildContext(environment: string, extraContext?: any): any {
    return {
        commit_sha: getCommitSha(),
        environment,
        occurred_at: new Date().toISOString(),
        ...extraContext,
    };
}
