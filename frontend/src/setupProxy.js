const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  const options = {
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
    timeout: 120000,
    proxyTimeout: 120000,
    family: 4,
    logLevel: 'warn',
    onError(err, req, res) {
      console.error('[Proxy Error]', err.message);
      res.status(500).json({ error: 'Proxy error: ' + err.message });
    }
  };
  app.use(['/run', '/apps'], createProxyMiddleware(options));
};
