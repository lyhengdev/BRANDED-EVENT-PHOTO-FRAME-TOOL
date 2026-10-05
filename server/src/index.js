import 'dotenv/config';
import app from './app.js';
import { connectDB } from './database.js';

const PORT = process.env.PORT || 5001;

// Non-blocking initialization of MongoDB Atlas connection
connectDB().catch((err) => {
  console.warn('⚠️  MongoDB initial connection deferred:', err.message);
});

// Always start listening on the assigned port
const server = app.listen(PORT, () => {
  console.log(`🚀 FrameCraft API listening on port ${PORT}`);
});

export default app;
