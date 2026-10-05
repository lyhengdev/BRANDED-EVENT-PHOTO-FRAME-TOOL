import 'dotenv/config';
import app from './app.js';
import { connectDB } from './database.js';

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 FrameCraft API listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();
