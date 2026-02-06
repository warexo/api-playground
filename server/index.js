import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files in production
const distPath = join(__dirname, '..', 'dist', 'web');
app.use(express.static(distPath));

// Proxy middleware: reads target URL from X-Target-Url header per request
app.use('/proxy', (req, res, next) => {
  const targetUrl = req.headers['x-target-url'];

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing X-Target-Url header' });
  }

  // Validate URL
  try {
    new URL(targetUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid X-Target-Url header value' });
  }

  const proxy = createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: (path) => path.replace(/^\/proxy/, ''),
    on: {
      proxyReq: (proxyReq) => {
        // Remove the custom header before forwarding
        proxyReq.removeHeader('x-target-url');
      },
      error: (err, _req, res) => {
        console.error('Proxy error:', err.message);
        if (!res.headersSent) {
          res.status(502).json({ error: 'Proxy error', message: err.message });
        }
      },
    },
  });

  proxy(req, res, next);
});

// In production, serve index.html for all non-proxy routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

// Only start listening when run directly (not when imported by electron/main.js)
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  app.listen(PORT, () => {
    console.log(`✓ API Proxy server running on http://localhost:${PORT}`);
    console.log(`  Proxy requests to /proxy/* with X-Target-Url header`);
  });
}

export default app;
