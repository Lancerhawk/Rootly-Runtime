import { Router } from 'express';
import passport from 'passport';
import crypto from 'crypto';
import signature from 'cookie-signature';

const router = Router();

// Store IDE auth states temporarily (in production, use Redis)
const ideAuthStates = new Map<string, { timestamp: number }>();

// Clean up old states every 5 minutes
setInterval(() => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [state, data] of ideAuthStates.entries()) {
        if (data.timestamp < fiveMinutesAgo) {
            ideAuthStates.delete(state);
        }
    }
}, 5 * 60 * 1000);

/**
 * GET /auth/github
 * Redirect to GitHub OAuth
 */
router.get('/github', (req, res, next) => {
    // Check if this is from IDE extension
    const isIDE = req.query.source === 'ide';
    console.log('🔑 OAuth initiated, source:', isIDE ? 'IDE' : 'WEB');

    if (isIDE) {
        // Generate a unique state token for IDE auth
        const state = crypto.randomBytes(32).toString('hex');
        ideAuthStates.set(state, { timestamp: Date.now() });
        console.log('✅ Generated IDE auth state:', state);

        // Pass state to GitHub OAuth
        passport.authenticate('github', {
            scope: ['user:email', 'read:user', 'repo'],
            state: state,
        })(req, res, next);
    } else {
        passport.authenticate('github', {
            scope: ['user:email', 'read:user', 'repo'],
        })(req, res, next);
    }
});

/**
 * GET /auth/github/callback
 * Handle GitHub OAuth callback
 */
router.get('/github/callback',
    passport.authenticate('github', { failureRedirect: process.env.FRONTEND_URL }),
    (req, res) => {
        // Explicitly save session before redirecting to handle race conditions
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.redirect(`${process.env.FRONTEND_URL}?error=session_save_failed`);
            }

            // Check if this was IDE authentication via state parameter
            const state = req.query.state as string;
            const isIDE = state && ideAuthStates.has(state);

            console.log('🔍 Checking IDE auth state:', state);
            console.log('🔍 Is IDE auth:', isIDE);

            if (isIDE) {
                // Clean up the state
                ideAuthStates.delete(state);
                console.log('🎯 IDE auth detected, showing token page');
                console.log('📝 Session ID:', req.sessionID);

                // Manually construct the signed session cookie
                const sessionSecret = process.env.SESSION_SECRET || 'change-this-secret';
                const signedSessionId = 's:' + signature.sign(req.sessionID, sessionSecret);
                const sessionCookie = `connect.sid=${signedSessionId}`;

                console.log('🍪 Session cookie:', sessionCookie);

                // Show token page for IDE
                return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rootly Authentication</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #e4e4e7;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 24px;
        }
        .container {
            max-width: 480px;
            width: 100%;
        }
        .card {
            background: #18181b;
            border: 1px solid #27272a;
            border-radius: 12px;
            padding: 32px;
        }
        h1 {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #fafafa;
        }
        .subtitle {
            color: #71717a;
            font-size: 14px;
            margin-bottom: 24px;
        }
        .token-box {
            background: #09090b;
            border: 1px solid #27272a;
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 16px;
            font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
            font-size: 12px;
            color: #a1a1aa;
            word-break: break-all;
            line-height: 1.5;
        }
        .copy-btn {
            width: 100%;
            background: #6366f1;
            color: white;
            border: none;
            padding: 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: background 0.15s;
        }
        .copy-btn:hover {
            background: #5558e3;
        }
        .copy-btn:active {
            background: #4c4fd8;
        }
        .hint {
            text-align: center;
            color: #52525b;
            font-size: 13px;
            margin-top: 16px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>Copy your token</h1>
            <p class="subtitle">Paste this into VS Code when prompted</p>
            
            <div class="token-box" id="token">${sessionCookie || 'Error: Could not extract cookie'}</div>
            
            <button class="copy-btn" onclick="copyToken()">
                Copy to clipboard
            </button>

            <p class="hint">You can close this window after copying</p>
        </div>
    </div>
    
    <script>
        function copyToken() {
            const token = document.getElementById('token').textContent;
            const btn = document.querySelector('.copy-btn');
            
            navigator.clipboard.writeText(token).then(() => {
                btn.textContent = '✓ Copied';
                btn.style.background = '#10b981';
                
                setTimeout(() => {
                    btn.textContent = 'Copy to clipboard';
                    btn.style.background = '#6366f1';
                }, 1500);
            });
        }
    </script>
</body>
</html>
                `);
            }

            // Regular web authentication, redirect to dashboard
            console.log('🌐 Regular web auth, redirecting to dashboard');
            res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
        });
    }
);

export default router;
