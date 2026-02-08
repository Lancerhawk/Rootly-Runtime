import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Detect GitHub repository from .git/config
 */
export function detectRepo(): string | null {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders || workspaceFolders.length === 0) {
        return null;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const gitConfigPath = path.join(rootPath, '.git', 'config');

    if (!fs.existsSync(gitConfigPath)) {
        return null;
    }

    try {
        const gitConfig = fs.readFileSync(gitConfigPath, 'utf-8');

        // Look for remote.origin.url
        const match = gitConfig.match(/\[remote "origin"\][\s\S]*?url\s*=\s*(.+)/);

        if (!match) {
            return null;
        }

        const remoteUrl = match[1].trim();

        // Parse GitHub repo from URL
        return parseGitHubRepo(remoteUrl);
    } catch (error) {
        console.error('Failed to read .git/config:', error);
        return null;
    }
}

/**
 * Parse GitHub owner/repo from remote URL
 * Supports both HTTPS and SSH formats
 */
function parseGitHubRepo(url: string): string | null {
    // HTTPS: https://github.com/owner/repo.git
    const httpsMatch = url.match(/github\.com[\/:](.+?)\/(.+?)(\.git)?$/);

    if (httpsMatch) {
        const owner = httpsMatch[1];
        const repo = httpsMatch[2].replace('.git', '');
        return `${owner}/${repo}`;
    }

    // SSH: git@github.com:owner/repo.git
    const sshMatch = url.match(/git@github\.com:(.+?)\/(.+?)(\.git)?$/);

    if (sshMatch) {
        const owner = sshMatch[1];
        const repo = sshMatch[2].replace('.git', '');
        return `${owner}/${repo}`;
    }

    return null;
}
