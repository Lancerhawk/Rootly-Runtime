/**
 * Context building and commit SHA detection
 */

/**
 * Detect commit SHA from environment variables
 * Priority: VERCEL_GIT_COMMIT_SHA > RENDER_GIT_COMMIT > GITHUB_SHA > COMMIT_SHA
 */
export function getCommitSha(): string {
    return (
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.RENDER_GIT_COMMIT ||
        process.env.GITHUB_SHA ||
        process.env.COMMIT_SHA ||
        ''
    );
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
