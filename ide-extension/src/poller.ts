import * as vscode from 'vscode';
import { fetchIncidents, Incident } from './api';
import { getToken } from './auth';

const POLL_INTERVAL = 45000; // 45 seconds

export class IncidentPoller {
    private timer: NodeJS.Timeout | null = null;
    private outputChannel: vscode.OutputChannel;
    private currentRepo: string | null = null;

    constructor(
        private context: vscode.ExtensionContext,
        private onIncidentsUpdate: (incidents: Incident[]) => void
    ) {
        this.outputChannel = vscode.window.createOutputChannel('Rootly');
    }

    /**
     * Start polling for incidents for a specific repository
     * @param repo - Repository in "owner/repo" format
     */
    start(repo: string) {
        if (this.timer) {
            this.stop(); // Stop existing polling
        }

        this.currentRepo = repo;
        this.outputChannel.appendLine(`Starting incident polling for ${repo}...`);

        // Poll immediately
        this.poll();

        // Then poll every interval
        this.timer = setInterval(() => this.poll(), POLL_INTERVAL);
    }

    /**
     * Stop polling
     */
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
            this.currentRepo = null;
            this.outputChannel.appendLine('Stopped incident polling');
        }
    }

    /**
     * Poll for incidents once
     */
    private async poll() {
        try {
            const token = await getToken(this.context);

            if (!token) {
                this.outputChannel.appendLine('Not authenticated, skipping poll');
                this.onIncidentsUpdate([]);
                return;
            }

            if (!this.currentRepo) {
                this.outputChannel.appendLine('No repository connected, skipping poll');
                this.onIncidentsUpdate([]);
                return;
            }

            this.outputChannel.appendLine(`Polling incidents for ${this.currentRepo}...`);

            const incidents = await fetchIncidents(this.currentRepo, token);

            this.outputChannel.appendLine(`Found ${incidents.length} incident(s)`);
            this.onIncidentsUpdate(incidents);

        } catch (error) {
            if (error instanceof Error) {
                if (error.message === 'UNAUTHORIZED') {
                    this.outputChannel.appendLine('Token expired, please login again');
                    vscode.window.showWarningMessage('Rootly session expired. Please login again.');
                } else if (error.message === 'PROJECT_NOT_FOUND') {
                    this.outputChannel.appendLine('Project not found for this repo');
                } else {
                    this.outputChannel.appendLine(`Poll error: ${error.message}`);
                }
            }

            // Don't crash, just skip this poll
            this.onIncidentsUpdate([]);
        }
    }

    /**
     * Manually trigger a poll
     */
    async refresh() {
        this.outputChannel.appendLine('Manual refresh triggered');
        await this.poll();
    }
}
