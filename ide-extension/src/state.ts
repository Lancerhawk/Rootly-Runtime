import * as vscode from 'vscode';

const CONNECTED_REPO_KEY = 'rootly.connectedRepo';
const USERNAME_KEY = 'rootly.username';

/**
 * Centralized state management for the extension
 */
export class ExtensionState {
    constructor(private context: vscode.ExtensionContext) { }

    /**
     * Get the currently connected repository
     */
    getConnectedRepo(): string | null {
        return this.context.globalState.get<string>(CONNECTED_REPO_KEY) || null;
    }

    /**
     * Set the connected repository
     */
    async setConnectedRepo(repo: string | null): Promise<void> {
        await this.context.globalState.update(CONNECTED_REPO_KEY, repo);
    }

    /**
     * Get the GitHub username
     */
    getUsername(): string | null {
        return this.context.globalState.get<string>(USERNAME_KEY) || null;
    }

    /**
     * Set the GitHub username
     */
    async setUsername(username: string | null): Promise<void> {
        await this.context.globalState.update(USERNAME_KEY, username);
    }

    /**
     * Clear all state (on logout)
     */
    async clearAll(): Promise<void> {
        await this.setConnectedRepo(null);
        await this.setUsername(null);
    }
}
