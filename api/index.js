import connect from 'connect';
import viteConfig from '../vite.config.js';

// Reuse the project's data proxies without running or exposing a dev server.
// Only API middleware is installed. Local credential editing is never hosted.
const app = connect();
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/api/health') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'ok', service: 'gods-eye-view' }));
    return;
  }
  if (pathname.startsWith('/api/setup/') || pathname === '/api/realtime/debug-log') {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'This endpoint is only available locally.' }));
    return;
  }
  next();
});

const { plugins } = viteConfig({ mode: 'production', command: 'serve' });
const server = {
  middlewares: {
    use(route, handler) {
      app.use(route, (req, res, next) => {
        try {
          Promise.resolve(handler(req, res, next)).catch(next);
        } catch (error) {
          next(error);
        }
      });
    },
  },
};
for (const plugin of plugins) {
  if (plugin.name === 'gev-key-setup' || plugin.name === 'vite-plugin-cesium') continue;
  if (typeof plugin.configureServer === 'function') plugin.configureServer(server);
}

app.use((req, res) => {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Unknown API route' }));
});
app.use((error, req, res, next) => {
  console.error('[Hosted API]', error?.name || 'Error');
  if (res.headersSent) return next(error);
  res.statusCode = 502;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Data provider temporarily unavailable' }));
});

export default function handler(req, res) {
  return new Promise((resolve) => {
    res.once('finish', resolve);
    res.once('close', resolve);
    app(req, res);
  });
}
