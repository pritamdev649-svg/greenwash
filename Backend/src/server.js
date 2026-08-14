import config from './config/env.js';
import app from './app.js';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Ironwala Backend is fire! Server running at http://localhost:${PORT}`);
  console.log(`Environment: ${config.env}`);
});
