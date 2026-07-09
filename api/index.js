const startServer = require('../Restaurant Reservation Management System/backend/server');

let appPromise;

module.exports = async (req, res) => {
  if (!appPromise) {
    appPromise = startServer().then(({ app }) => app);
  }
  try {
    const app = await appPromise;
    return app(req, res);
  } catch (err) {
    console.error('Error handling request in Vercel serverless function:', err);
    res.status(500).json({ error: 'Server initialization failed', message: err.message });
  }
};
