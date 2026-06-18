import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import 'dotenv/config';

const app = express();
const PORT = 3000;

app.use(express.json());

// API: Dell Warranty Lookup Proxy (Secure, by-passes browser CORS constraints)
app.post('/api/dell/lookup', async (req, res) => {
  const { serviceTag, clientId, clientSecret, environment } = req.body;

  if (!serviceTag || typeof serviceTag !== 'string') {
    return res.status(400).json({ error: 'serviceTag parameter is required' });
  }

  const cleanedTag = serviceTag.trim().toUpperCase();
  if (cleanedTag.length !== 7 || !/^[A-Z0-9]{7}$/.test(cleanedTag)) {
    return res.status(400).json({ error: 'Dell Service Tags must be exactly 7 alphanumeric characters.' });
  }

  // Determine credentials: Body overrides Env variables
  const finalClientId = clientId || process.env.DELL_CLIENT_ID;
  const finalClientSecret = clientSecret || process.env.DELL_CLIENT_SECRET;
  const finalEnv = environment || process.env.DELL_ENVIRONMENT || 'sandbox';

  // If credentials are blank, report sandbox fallback
  if (!finalClientId || !finalClientSecret) {
    return res.json({
      online: false,
      reason: 'No credentials configured. Enter TechDirect Client ID & Client Secret in Portal Settings.',
      serviceTag: cleanedTag
    });
  }

  // Handshake with Dell OAuth 2.0 Identity Server
  const authUrl = finalEnv === 'production'
    ? 'https://apigtwi.dell.com/auth/oauth/v2/token'
    : 'https://sandbox.api.dell.com/auth/oauth/v2/token';

  const assetUrl = finalEnv === 'production'
    ? `https://apigtwi.dell.com/support/assetinfo/v5/assets?servicetags=${cleanedTag}`
    : `https://sandbox.api.dell.com/support/assetinfo/v5/assets?servicetags=${cleanedTag}`;

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', finalClientId);
    params.append('client_secret', finalClientSecret);

    const tokenResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!tokenResponse.ok) {
      throw new Error(`Dell authorization failed: Status ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json() as { access_token?: string };
    const token = tokenData.access_token;

    if (!token) {
      throw new Error('Access token absent from Dell response.');
    }

    // Call Dell Asset Info API
    const assetResponse = await fetch(assetUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!assetResponse.ok) {
      throw new Error(`Dell asset search failed: Status ${assetResponse.status}`);
    }

    const rawData = await assetResponse.json();
    return res.json({
      online: true,
      data: rawData
    });

  } catch (error: any) {
    console.error('Dell API Lookup Error:', error);
    return res.json({
      online: false,
      reason: error.message || 'Dell API connection error',
      serviceTag: cleanedTag
    });
  }
});

// Vite server setup logic for full-stack integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
