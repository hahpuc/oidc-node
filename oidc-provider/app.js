import Provider, { errors } from 'oidc-provider';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import MySQLAdapter, { initializeDatabase, createTables } from './mysql-adapter.js';

// Initialize MySQL database
const dbPool = initializeDatabase({
    host: '147.93.156.241',
    user: 'root',
    port: 3306,
    password: 'Long@1234',
    database: 'test_oidc'
});

// Create tables before starting the server
await createTables();

// Helper function to find user by ID
async function findUserById(userId) {
    try {
        const [rows] = await dbPool.execute(
            'SELECT id, username, email, firstName, lastName, emailVerified, isActive FROM users WHERE id = ?',
            [userId]
        );
        return rows[0] || null;
    } catch (error) {
        console.error('Error finding user by ID:', error);
        return null;
    }
}

// Helper function to authenticate user by username and password
async function authenticateUser(username, password) {
    try {
        const [rows] = await dbPool.execute(
            'SELECT id, username, email, firstName, lastName, emailVerified, isActive, password FROM users WHERE username = ? AND isActive = 1',
            [username]
        );

        if (rows.length === 0) {
            console.log('❌ User not found:', username);
            return null;
        }

        const user = rows[0];

        // Compare password with bcrypt hash
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (isPasswordValid) {
            console.log('✅ User authenticated:', username);
            return user;
        }

        console.log('❌ Invalid password for user:', username);
        return null;
    } catch (error) {
        console.error('Error authenticating user:', error);
        return null;
    }
}

const configuration = {
    adapter: MySQLAdapter,
    findAccount: async (ctx, sub) => {
        console.log('findAccount called with sub:', sub);

        const user = await findUserById(sub);

        if (!user) {
            console.log('❌ User not found in database:', sub);
            return undefined;
        }

        console.log('✅ User found in database:', user.username);

        return {
            accountId: user.id.toString(),
            claims: async (use, scope, claims, rejected) => {
                console.log('claims called with:', { use, scope, claims });
                return {
                    sub: user.id.toString(),
                    email: user.email,
                    email_verified: user.emailVerified,
                    given_name: user.firstName,
                    family_name: user.lastName,
                    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
                    preferred_username: user.username,
                };
            }
        };
    },
    interactions: {
        url(ctx, interaction) {
            return `/interaction/${interaction.uid}`;
        },
    },
    async renderError(ctx, out, error) {
        ctx.type = 'html';
        ctx.body = `<!DOCTYPE html>
<html>
<head>
    <title>Error</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="error">
        <h1>Error</h1>
        <p><strong>Error:</strong> ${error.error}</p>
        <p><strong>Description:</strong> ${error.error_description || 'An error occurred'}</p>
    </div>
</body>
</html>`;
    },
    jwks: {
        keys: [{
            'kty': 'RSA',
            'use': 'sig',
            'alg': 'RS256',
            'd': 'EF2Kky61jzvMYQ_B6ImXzCsQ8uQzbFJrGnB2azlpr_CFStjjUVKP4EKrSCVEasD6SGNJV2QSiNJr7j05nvuGmHMKa__rbU8fqP4qbDahUgCgWOq-zS5tGK6Ifk4II_cZ_V1F-TnrvmcOKMWBiSV-p8i72KpXXucbHGNRwASVs7--M55wp_m1UsybI2jSQ4IgyvGzTnvMmQ_GsX-XoD8u0zGU_4eN3DGc8l6hdxxuSymH0fEeL1Aj0LoCj6teRGF37a2sBQdU6mkNNAuyyirkoDqGZCGJToQLqX4F1FafnzjeIgfdneRa-vuaV380Hhr2rorWnQyBqOO27M5O_VAkJbfRaWJVrXTJ69ZgkU4GPdeYdklVL0HkU6laziTNqNMeAjnt4m51sWokVyJpvdWcb_vJ4NSCsRo7kHOz7g-UvWTXa8UW0DTDliq_TJ3rN4Gv0vn9tBlFfaeuLPpK4VNmRRDRXY_fcuzlnQwYExL9a4V_vCyGmabdb7PrUFPBcjR5',
            'dp': 'SX52TkZEc_eLIk5gYrKjAC643LJIw1RxMBWWewRSGLn_rbrH1he3hy7AGDUV6Uon7zkNh9R5GBVuxmlluBRAGbrhIXAAf8sWeyma3F6FIAt-MH_VkfW5K2p88PLOyVGljlv8-Z3wzdKYOlDP4yFU18LqGMqaRSDLDGhILkuZhjLYA40sfYJeJTi_HVP5UyWL4ohayqUWCT2W3DgeDDThYHmufOaqlrSLhUst6uez_cDz0BXAYIZvUuPVL_n1-_px',
            'dq': 'K1KYU77I6yyPA2u32rc0exp_TCG59hhpWxrmXN8yTXWyq_xYBhCJA_nHdY8UV25Hmd7q0iX2i8y2cCAFNWA5UWiSiNg9-fKRLI2nz53IM4dGfssOLwUk66wzX8r_u3XiLZsO7XNNtQZdcZmF0YuNTtzEdiNDhaOyHiwwHgShL36WNmUn00mZR__G5Qk60VvI8vsbvJU9xRnWuEVS1wRgyD7v6Nl9nIxb8N7oibCdTJLmgnRXPWvArsW0cJ-NURfr',
            'e': 'AQAB',
            'n': '2QwX-NBMkQYedGpbPvHL7Ca0isvfmLC7lSc8XSOCLmCUIf6Bk_pdCNx2kxsmT81IoA8CfvJLHQj5vWKoVDFMLfwo4IujvsC3m2IrEg6jERE-YHfC3W5jKZtmzQYpfx5vC2_XTmcyPigtyaNVsftGfycES3B_tvphNsFmQcJjVGOsJQXXqh_TDv6FMcH4m9pngyw6wfe3GgAKA0dRTSfD0h7wLdNCeuid53lLpkQypTNdZ6_PiCMu2gr_cH5M0MPZtBb2TW12_2zOabExK1lI5-HvdPtbMT4Qzs2nd2NkjcWmlbKRZzq6IzyWt7W2EnfZDsi61PHECtTb-EQN2icl8Wnsp-0Bw66yviAOj0gn3X5hRLx-TknT_PnWMou17l5GoAojKDezcTW0iLlrfs2ixFlY28u7WklUN8uYhHvwgON6fsdefG-3bPpiRLBPZ_tgXa4doALsCwfXu2oz0vYktk31A-UYv92uJsKSUbK0_8ODTN0rslCqCYN_1a_aVt2P',
            'p': '--L5BX8juLlGJk8hdPgEUmJjD7SsZuMrdq3cSibkkbaWUE5CQQ7vhLPr2dWCS1jUnY9WyoCx9QCZvhTHjORX50ykkOyBso9VJjWvYPjsrPpF7_Y6V0dKlblDmbbmRT9BW-MgjbwTivu3c2OpMXh2XLF-FOTq3t3Brs7SRnhTkD6GBDFf3X95J0PF7NELa9z2-kzPSDYz3k-9FepXnRPBM_ViDzlRw4eKUdylVuhzGbC2TRSmab9BRP0wipQKd-f5',
            'q': '3Jd5CRJpQV3xUi3FiHHAwcjfsRkfXMrxfaXt0PjX2xWzxscYiDcyCF6VhHTAGsiq5SOtCp3l5mg6A9PzdR53AzM2-706D82fMwiUZvsLOVTepXkgriP_xw7rDlkOeAvjB80sL2G9scFliTzzRZ8I8E79A8DxZihfB75AIN9ijklEihnwxfhp2EgO5MYEyQRcqU1TT8wD8ekLMzd-kJUWyTz3BogiVJH__BQoB6kaDyjvQoxBgwh0hi72t9H5XqPH',
            'qi': 'cwK0jhzwbu8BaTmTQhwfGiqwNN3v9F4nUQ4dtnBYRI6zlki4cLb2Mf9-VhyEsUYhhdTm8R7RwO9m5Xct3gEfozdk35wuvkVwkZgL3Uho5asao0xi4aENeUk5DCkU-paO3yLSDhIs9YYuYIDjUX6QuMCPjomypuE3SRm-Dg1PGOxYvX3w_P-0kd5iBFrm4jwGTZViFOr8tl_dXgDRDWDgofOYOYcmUv2_0zt1aO3j5dhEpwdkyuDMLfVZNpJQyopJ',
            'kid': 'f262a3214213d194c92991d6735b153b'
        }]
    },
    features: {
        clientCredentials: {
            enabled: true
        },
        introspection: {
            enabled: true
        },
        resourceIndicators: {
            enabled: true,
            getResourceServerInfo(ctx, resourceIndicator) {
                if (resourceIndicator === 'urn:api') {
                    return {
                        scope: 'read',
                        audience: 'urn:api',
                        accessTokenTTL: 1 * 60 * 60, // 1 hour
                        accessTokenFormat: 'jwt'
                    }
                }

                throw new errors.InvalidTarget();
            }
        }
    },
    clients: [{
        client_id: 'app',
        client_secret: 'a_secret',
        grant_types: ['client_credentials', 'authorization_code', 'refresh_token'],
        redirect_uris: [],
        response_types: []
    },
    {
        client_id: 'oidc_client',
        client_secret: 'a_different_secret',
        grant_types: ['authorization_code'],
        response_types: ['code'],
        redirect_uris: ['http://localhost:3001/cb']
    },
    {
        client_id: 'admin_client',
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        redirect_uris: ['http://localhost:4000/callback'],
        token_endpoint_auth_method: 'none',
        require_auth_time: false,
        application_type: 'web',
        post_logout_redirect_uris: ['http://localhost:4000'],
        scope: 'openid email profile'
    }],
    claims: {
        profile: ['birthdate', 'family_name', 'gender', 'given_name', 'locale', 'middle_name', 'name', 'nickname', 'picture', 'preferred_username', 'profile', 'updated_at', 'website', 'zoneinfo'],
        email: ['email', 'email_verified']
    }
};

const oidc = new Provider('http://localhost:3000', configuration);

const app = express();

// Add body parsing
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Add CORS support
app.use(cors({
    origin: ['http://localhost:4000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Add logging middleware
app.use('/', (req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    if (req.method === 'POST') {
        console.log('Body:', req.body);
    }
    if (req.headers.authorization) {
        console.log('Auth header:', req.headers.authorization.substring(0, 20) + '...');
    }
    next();
});

// Custom interaction routes for login
app.get('/interaction/:uid', async (req, res) => {
    try {
        const details = await oidc.interactionDetails(req, res);
        const { uid, prompt, params } = details;

        console.log('Interaction details:', { uid, prompt: prompt.name, params });

        if (prompt.name === 'login') {
            return res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Sign In</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .login-container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { margin-top: 0; color: #333; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; color: #555; }
        input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        button { width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
        button:hover { background: #0056b3; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="login-container">
        <h1>Sign In</h1>
        <div class="info">
            <strong>Client:</strong> ${params.client_id}<br>
            <strong>Scope:</strong> ${params.scope}
        </div>
        <form method="post" action="/interaction/${uid}/login">
            <div class="form-group">
                <label for="username">Username:</label>
                <input type="text" id="username" name="username" required autofocus>
            </div>
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit">Sign In</button>
        </form>
    </div>
</body>
</html>
            `);
        }

        if (prompt.name === 'consent') {
            const scopes = params.scope.split(' ');
            const scopeDescriptions = {
                'openid': 'Access your basic profile',
                'email': 'Access your email address',
                'profile': 'Access your profile information (name, etc.)',
            };

            return res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Authorize Application</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .consent-container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { margin-top: 0; color: #333; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
        .scopes { margin: 20px 0; }
        .scope-item { padding: 12px; background: #f8f9fa; border-left: 3px solid #007bff; margin-bottom: 10px; border-radius: 4px; }
        .scope-item strong { color: #007bff; }
        .buttons { display: flex; gap: 10px; margin-top: 20px; }
        button { flex: 1; padding: 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold; }
        .btn-allow { background: #28a745; color: white; }
        .btn-allow:hover { background: #218838; }
        .btn-deny { background: #dc3545; color: white; }
        .btn-deny:hover { background: #c82333; }
    </style>
</head>
<body>
    <div class="consent-container">
        <h1>Authorize Access</h1>
        <div class="info">
            <strong>${params.client_id}</strong> is requesting access to your account
        </div>
        <div class="scopes">
            <h3>This application will be able to:</h3>
            ${scopes.map(scope => `
                <div class="scope-item">
                    <strong>${scope}</strong> - ${scopeDescriptions[scope] || scope}
                </div>
            `).join('')}
        </div>
        <form method="post" action="/interaction/${uid}/consent">
            <div class="buttons">
                <button type="submit" name="action" value="allow" class="btn-allow">Allow</button>
                <button type="submit" name="action" value="deny" class="btn-deny">Deny</button>
            </div>
        </form>
    </div>
</body>
</html>
            `);
        }

        return res.send('Unknown prompt');
    } catch (err) {
        console.error('Error in interaction route:', err);
        return res.status(500).send('Internal Server Error');
    }
});

app.post('/interaction/:uid/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log('Login attempt for username:', username);

        const user = await authenticateUser(username, password);

        if (!user) {
            return res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Sign In Failed</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .error-container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
        a { color: #007bff; text-decoration: none; }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error">
            <strong>Authentication Failed</strong><br>
            Invalid username or password
        </div>
        <a href="/interaction/${req.params.uid}">← Back to login</a>
    </div>
</body>
</html>
            `);
        }

        const result = {
            login: {
                accountId: user.id.toString(),
            },
        };

        await oidc.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
    } catch (err) {
        console.error('Error in login post:', err);
        return res.status(500).send('Internal Server Error');
    }
});

app.post('/interaction/:uid/consent', async (req, res) => {
    try {
        const { action } = req.body;
        const interactionDetails = await oidc.interactionDetails(req, res);

        console.log('Consent action:', action);
        console.log('Interaction prompt:', interactionDetails.prompt);

        if (action === 'deny') {
            const result = {
                error: 'access_denied',
                error_description: 'User denied access',
            };
            return await oidc.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
        }

        // Get the grant for this session
        const grant = new oidc.Grant({
            accountId: interactionDetails.session.accountId,
            clientId: interactionDetails.params.client_id,
        });

        // Add the scopes that were requested
        if (interactionDetails.prompt.details.missingOIDCScope) {
            grant.addOIDCScope(interactionDetails.prompt.details.missingOIDCScope.join(' '));
        }
        if (interactionDetails.prompt.details.missingOIDCClaims) {
            grant.addOIDCClaims(interactionDetails.prompt.details.missingOIDCClaims);
        }
        if (interactionDetails.prompt.details.missingResourceScopes) {
            for (const [indicator, scopes] of Object.entries(interactionDetails.prompt.details.missingResourceScopes)) {
                grant.addResourceScope(indicator, scopes.join(' '));
            }
        }

        // Save the grant
        const grantId = await grant.save();
        console.log('Grant saved with ID:', grantId);

        // User approved - grant consent with the grantId
        const result = {
            consent: {
                grantId,
            },
        };

        console.log('Finishing interaction with consent result and grantId');
        await oidc.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
    } catch (err) {
        console.error('Error in consent post:', err);
        console.error('Error stack:', err.stack);
        return res.status(500).send('Internal Server Error');
    }
});

// Add error handling middleware
oidc.on('server_error', (ctx, err) => {
    console.error('🚨 OIDC Provider server_error:', err.message);
    console.error('🚨 Error stack:', err.stack);
    console.error('🚨 Context path:', ctx.path);
    console.error('🚨 Context query:', ctx.query);
});

app.use('/', oidc.callback());
app.listen(3000, () => {
    console.log('OIDC Provider listening on http://localhost:3000');
    console.log('MySQL adapter is configured');
});