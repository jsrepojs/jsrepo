import crypto from 'node:crypto';
import http from 'node:http';
import { Err, Ok, type Result } from './blocks/ts/result';
import * as jsrepo from './registry-providers/jsrepo';
import { AccessTokenManager } from './token-manager';

export const APPLICATION_PORT = 3333;
export const APPLICATION_CLIENT_ID = 'qoHyKKJbcbFEtQlaZttKefpvcwzxMZnD';

export function createServer(port: number) {
	const server = http.createServer();

	server.listen(port);

	return server;
}

export const DEFAULT_TIMEOUT = 1000 * 60 * 60 * 15; // 15 minutes

export async function listenForOAuthCallback(): Promise<Result<{ code: string }, string>> {
	try {
		const server = createServer(APPLICATION_PORT);

		return Ok(
			await new Promise<{ code: string }>((resolve, reject) => {
				server.on('request', async (req, res) => {
					if (req.url && req.method === 'GET') {
						const url = new URL(req.url, `http://localhost:${APPLICATION_PORT}`);

						const error = url.searchParams.get('error');

						if (error) {
							const error_description = url.searchParams.get('error_description');

							res.writeHead(200, { 'Content-Type': 'text/html' });
							res.end(errorPage(`${error}: ${error_description}`));
							server.close();
							reject(`Error: ${error}: ${error_description}`);
							return;
						}

						if (url.pathname === '/callback' && url.searchParams.has('code')) {
							const code = url.searchParams.get('code')!;

							res.writeHead(200, { 'Content-Type': 'text/html' });
							res.end(SUCCESS_PAGE);
							server.close();
							resolve({ code });
						} else {
							res.writeHead(404);
							res.end();
						}
					}
				});

				server.on('error', reject);
			})
		);
	} catch (err) {
		return Err(`${err}`);
	}
}

function base64URLEncode(input: Buffer) {
	return input.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function sha256(buffer: string) {
	return crypto.createHash('sha256').update(buffer).digest();
}

export function generatePKCE() {
	const codeVerifier = base64URLEncode(crypto.randomBytes(32));
	const codeChallenge = base64URLEncode(sha256(codeVerifier));
	return { codeVerifier, codeChallenge };
}

/** Refresh the users access token if there is one */
export async function refreshToken() {
	const tokenManager = new AccessTokenManager();

	const token = tokenManager.get(jsrepo.jsrepo.name);

	// nothing to refresh
	if (!token || token.type === 'api' || token.refreshToken === undefined) {
		return;
	}

	// too early to refresh
	if (token.expires && token.expires > Date.now() + 60000) {
		return;
	}

	try {
		const tokens = await jsrepo.getAuthToken({
			grant_type: 'refresh_token',
			client_id: APPLICATION_CLIENT_ID,
			refresh_token: token.refreshToken,
		});

		if (!tokens.error) {
			tokenManager.set(jsrepo.jsrepo.name, {
				type: 'default',
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token,
				expires: tokens.expires_in * 1000 + Date.now(),
			});
		} else {
			// the token must be invalid so we should just get rid of it instead of keep trying
			tokenManager.delete(jsrepo.jsrepo.name);
		}
	} catch {
		// we just assume this is a network error or something unexpected
	}
}

/** Page that is shown when the user successfully authenticates to the application */
const SUCCESS_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authentication Successful</title>
    <style>
        :root {
            --success-color: #10b981;
            --success-light: rgba(16, 185, 129, 0.2);
            --background: #000000;
            --card-background: #111111;
            --text-color: #ffffff;
            --muted-text-color: rgba(255, 255, 255, 0.7);
            --border-color: #333333;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--background);
            color: var(--text-color);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 1rem;
        }

        .container {
            max-width: 420px;
            width: 100%;
            background-color: var(--card-background);
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            padding: 2.5rem;
            text-align: center;
            border: 1px solid var(--border-color);
        }

        .success-icon {
            width: 80px;
            height: 80px;
            background-color: var(--success-light);
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0 auto 1.5rem;
        }

        .checkmark {
            width: 40px;
            height: 40px;
            position: relative;
        }

        .checkmark::before,
        .checkmark::after {
            content: '';
            position: absolute;
            background-color: var(--success-color);
        }

        .checkmark::before {
            width: 12px;
            height: 4px;
            transform: rotate(45deg);
            top: 24px;
            left: 8px;
            border-radius: 2px;
        }

        .checkmark::after {
            width: 24px;
            height: 4px;
            transform: rotate(-45deg);
            top: 20px;
            left: 12px;
            border-radius: 2px;
        }

        h1 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            color: var(--text-color);
        }

        p {
            color: var(--muted-text-color);
            line-height: 1.6;
            font-size: 1.1rem;
        }

        @media (max-width: 480px) {
            .container {
                padding: 1.5rem;
            }
            
            .success-icon {
                width: 60px;
                height: 60px;
            }
            
            .checkmark {
                width: 30px;
                height: 30px;
            }
            
            .checkmark::before {
                width: 9px;
                height: 3px;
                top: 18px;
                left: 6px;
            }
            
            .checkmark::after {
                width: 18px;
                height: 3px;
                top: 15px;
                left: 9px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">
            <div class="checkmark"></div>
        </div>
        
        <h1>Authentication Successful</h1>
        
        <p>
            You have successfully authenticated to jsrepo.com. You can safely close this window now!
        </p>
    </div>
</body>
</html>`;

function errorPage(errorMessage: string) {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authentication Failed</title>
    <style>
        :root {
            --error-color: #ef4444;
            --error-light: rgba(239, 68, 68, 0.2);
            --background: #000000;
            --card-background: #111111;
            --text-color: #ffffff;
            --muted-text-color: rgba(255, 255, 255, 0.7);
            --border-color: #333333;
            --error-message-bg: rgba(239, 68, 68, 0.1);
            --error-message-border: rgba(239, 68, 68, 0.3);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--background);
            color: var(--text-color);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 1rem;
        }

        .container {
            max-width: 420px;
            width: 100%;
            background-color: var(--card-background);
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            padding: 2.5rem;
            text-align: center;
            border: 1px solid var(--border-color);
        }

        .error-icon {
            width: 80px;
            height: 80px;
            background-color: var(--error-light);
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0 auto 1.5rem;
        }

        .x-mark {
            width: 40px;
            height: 40px;
            position: relative;
        }

        .x-mark::before,
        .x-mark::after {
            content: '';
            position: absolute;
            background-color: var(--error-color);
            width: 40px;
            height: 4px;
            top: 18px;
            left: 0;
            border-radius: 2px;
        }

        .x-mark::before {
            transform: rotate(45deg);
        }

        .x-mark::after {
            transform: rotate(-45deg);
        }

        h1 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            color: var(--text-color);
        }

        p {
            color: var(--muted-text-color);
            line-height: 1.6;
            font-size: 1.1rem;
            margin-bottom: 1.5rem;
        }

        .error-message {
            background-color: var(--error-message-bg);
            border: 1px solid var(--error-message-border);
            border-radius: 6px;
            padding: 1rem;
            margin-top: 1.5rem;
            text-align: left;
        }

        .error-message p {
            margin-bottom: 0;
            font-size: 0.95rem;
            font-family: monospace;
            white-space: pre-wrap;
            word-break: break-word;
        }

        @media (max-width: 480px) {
            .container {
                padding: 1.5rem;
            }
            
            .error-icon {
                width: 60px;
                height: 60px;
            }
            
            .x-mark {
                width: 30px;
                height: 30px;
            }
            
            .x-mark::before,
            .x-mark::after {
                width: 30px;
                height: 3px;
                top: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">
            <div class="x-mark"></div>
        </div>
        
        <h1>Access Denied</h1>
        
        <p>
            Authentication to jsrepo.com failed. You can safely close this window now.
        </p>
        
        <div class="error-message">
            <p id="error-details">Error: ${errorMessage}. Please try again or contact support if the issue persists.</p>
        </div>
    </div>
</body>
</html>`;
}
