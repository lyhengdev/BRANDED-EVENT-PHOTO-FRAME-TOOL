import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Base middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static directories (optional/local)
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const PRESETS_DIR = path.join(__dirname, '../public/presets');

try {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!fs.existsSync(PRESETS_DIR)) fs.mkdirSync(PRESETS_DIR, { recursive: true });
} catch {
  // Read-only filesystem on serverless environments
}

app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/presets', express.static(PRESETS_DIR));

// Memory storage for uploads so files convert directly to base64 Data URLs
// This avoids serverless ephemeral filesystem issues on Vercel
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (PNG, WebP, JPEG) are allowed.'));
    }
  }
});

// Admin credentials
const ADMIN_USER = process.env.ADMIN_USER || 'mtfteam';
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || '2022';

// Create API Router
const apiRouter = express.Router();

// Health Check
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'MongoDB Atlas',
    operator: ADMIN_USER,
    timestamp: new Date().toISOString()
  });
});

// Operator Authentication (Username: mtfteam | Passcode: 2022)
apiRouter.post('/auth/login', (req, res) => {
  const { username, passcode } = req.body || {};
  const userStr = String(username || '').trim().toLowerCase();
  const passStr = String(passcode || '').trim();

  if (userStr === ADMIN_USER.toLowerCase() && passStr === ADMIN_PASSCODE) {
    const token = 'token_' + Buffer.from(`${userStr}:${Date.now()}`).toString('base64');
    return res.json({
      success: true,
      token,
      user: { username: userStr, role: 'operator' }
    });
  }
  return res.status(401).json({ error: 'Access Denied: Invalid Operator Username or Passcode' });
});

apiRouter.post('/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer token_')) {
    return res.json({ valid: true, user: { username: ADMIN_USER, role: 'operator' } });
  }
  return res.status(401).json({ valid: false });
});

// Upload transparent PNG frame
apiRouter.post('/upload/frame', upload.single('frameImage'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }
  const base64Url = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  res.json({
    success: true,
    fileUrl: base64Url,
    filename: req.file.originalname || 'frame.png',
    size: req.file.size
  });
});

// List all campaigns (Real-time fresh from database)
apiRouter.get('/campaigns', async (req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const campaigns = await db.getCampaigns();
    res.json(campaigns);
  } catch (err) {
    next(err);
  }
});

// Get campaign by slug or ID
apiRouter.get('/campaigns/:idOrSlug', async (req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const { idOrSlug } = req.params;
    let campaign = await db.getCampaignBySlug(idOrSlug);
    if (!campaign) {
      campaign = await db.getCampaignById(idOrSlug);
    }
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign frame not found' });
    }
    res.json(campaign);
  } catch (err) {
    next(err);
  }
});

// Create campaign
apiRouter.post('/campaigns', async (req, res, next) => {
  try {
    const campaign = await db.createCampaign(req.body);
    res.status(201).json(campaign);
  } catch (err) {
    next(err);
  }
});

// Update campaign
apiRouter.put('/campaigns/:id', async (req, res, next) => {
  try {
    const updated = await db.updateCampaign(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Delete campaign
apiRouter.delete('/campaigns/:id', async (req, res, next) => {
  try {
    const success = await db.deleteCampaign(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// Track analytics event (visit, upload, download)
apiRouter.post('/campaigns/:id/analytics', async (req, res, next) => {
  try {
    const { eventType } = req.body || {};
    if (!eventType) {
      return res.status(400).json({ error: 'eventType is required' });
    }
    const stat = await db.recordAnalytics(req.params.id, eventType);
    res.json({ success: true, stat });
  } catch (err) {
    next(err);
  }
});

// Get campaign analytics
apiRouter.get('/campaigns/:id/analytics', async (req, res, next) => {
  try {
    const data = await db.getAnalytics(req.params.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Global analytics overview
apiRouter.get('/analytics/overview', async (req, res, next) => {
  try {
    const summary = await db.getAllAnalyticsSummary();
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

// Mount the router on BOTH '/api' and '/' to guarantee matches regardless of Vercel rewrite prefix stripping
app.use('/api', apiRouter);
app.use(apiRouter);

// Global JSON error handler (guarantees API always returns JSON, never HTML)
app.use((err, req, res, next) => {
  console.error('Unhandled API Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    success: false
  });
});

export default app;
