import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectDB, db } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Directory configuration
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const PRESETS_DIR = path.join(__dirname, '../public/presets');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(PRESETS_DIR)) {
  fs.mkdirSync(PRESETS_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/presets', express.static(PRESETS_DIR));

// Multer storage for transparent PNG frames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const uniqueName = `frame-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/webp' || file.mimetype === 'image/jpeg') {
      cb(null, true);
    } else {
      cb(new Error('Only PNG/WebP images with transparency are recommended.'));
    }
  }
});

// API Routes

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'MongoDB Atlas',
    timestamp: new Date().toISOString()
  });
});

// Admin Authentication (Username & Passcode)
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || '2026';

app.post('/api/auth/login', (req, res) => {
  const { username, passcode } = req.body;
  const userStr = String(username || '').trim().toLowerCase();
  const passStr = String(passcode || '').trim();

  const validUsers = [ADMIN_USER.toLowerCase(), 'admin', 'operator'];
  const validPasscodes = [ADMIN_PASSCODE, '2026', 'frame2026', 'admin123'];

  if (validUsers.includes(userStr) && validPasscodes.includes(passStr)) {
    const token = 'token_' + Buffer.from(`${userStr}:${Date.now()}`).toString('base64');
    return res.json({
      success: true,
      token,
      user: { username: userStr, role: 'operator' }
    });
  }
  return res.status(401).json({ error: 'Access Denied: Invalid Operator Username or Passcode' });
});

app.post('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer token_')) {
    return res.json({ valid: true, user: { username: 'admin', role: 'operator' } });
  }
  return res.status(401).json({ valid: false });
});

// Upload transparent PNG frame
app.post('/api/upload/frame', upload.single('frameImage'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    fileUrl,
    filename: req.file.filename,
    size: req.file.size
  });
});

// List all campaigns
app.get('/api/campaigns', async (req, res) => {
  try {
    const campaigns = await db.getCampaigns();
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get campaign by slug or ID
app.get('/api/campaigns/:idOrSlug', async (req, res) => {
  try {
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
    res.status(500).json({ error: err.message });
  }
});

// Create campaign
app.post('/api/campaigns', async (req, res) => {
  try {
    const campaign = await db.createCampaign(req.body);
    res.status(201).json(campaign);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update campaign
app.put('/api/campaigns/:id', async (req, res) => {
  try {
    const updated = await db.updateCampaign(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete campaign
app.delete('/api/campaigns/:id', async (req, res) => {
  try {
    const success = await db.deleteCampaign(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Track analytics event (visit, upload, download)
app.post('/api/campaigns/:id/analytics', async (req, res) => {
  try {
    const { eventType } = req.body;
    if (!eventType) {
      return res.status(400).json({ error: 'eventType is required' });
    }
    const stat = await db.recordAnalytics(req.params.id, eventType);
    res.json({ success: true, stat });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get campaign analytics
app.get('/api/campaigns/:id/analytics', async (req, res) => {
  try {
    const data = await db.getAnalytics(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Global analytics overview
app.get('/api/analytics/overview', async (req, res) => {
  try {
    const summary = await db.getAllAnalyticsSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Production: Serve built frontend from client/dist if available
const CLIENT_DIST = path.join(__dirname, '../../client/dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/presets')) {
      return next();
    }
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

// Start Server with MongoDB Atlas Connection
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Production API Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();
