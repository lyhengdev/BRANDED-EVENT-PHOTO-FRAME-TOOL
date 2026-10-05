import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const CAMPAIGNS_FILE = path.join(DATA_DIR, 'campaigns.json');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial sample campaigns with beautiful pre-configured frames
const SEED_CAMPAIGNS = [
  {
    id: 'camp_mtf2026',
    slug: 'mtf2026',
    name: 'Modern Tech Frontier 2026',
    eventTitle: 'MTF 2026 Developer Summit',
    description: 'Create your official attendee badge & photo frame. Share with #MTF2026!',
    tagline: 'Connecting Builders of the Next Era',
    status: 'published',
    canvasWidth: 1080,
    canvasHeight: 1350,
    aspectRatio: '4:5',
    themeColor: '#6366f1',
    accentColor: '#06b6d4',
    // Pre-built frame overlay graphics or uploaded PNG URL
    frameType: 'preset',
    framePreset: 'tech-summit',
    frameUrl: '/presets/mtf2026-frame.png',
    frameMeta: {
      headline: 'MODERN TECH FRONTIER 2026',
      subline: 'OFFICIAL ATTENDEE • SAN FRANCISCO, CA',
      badgeText: 'DELEGATE',
      borderStyle: 'cyber-glow',
      bannerPosition: 'bottom'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'camp_summerbeats',
    slug: 'summerbeats2026',
    name: 'Summer Beats Music Fest',
    eventTitle: 'Summer Beats Fest 2026',
    description: 'Get your festival vibe on! Frame your party moment and share.',
    tagline: 'Feel the Sound • Live the Moment',
    status: 'published',
    canvasWidth: 1080,
    canvasHeight: 1080,
    aspectRatio: '1:1',
    themeColor: '#ec4899',
    accentColor: '#f59e0b',
    frameType: 'preset',
    framePreset: 'neon-fest',
    frameUrl: '/presets/summerbeats-frame.png',
    frameMeta: {
      headline: 'SUMMER BEATS 2026',
      subline: 'LIVE AT GOLDEN GATE PARK',
      badgeText: 'VIP ACCESS',
      borderStyle: 'neon-gradient',
      bannerPosition: 'corners'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'camp_aisummit',
    slug: 'aisummit2026',
    name: 'Global AI Summit 2026',
    eventTitle: 'Global AI Summit • Story Edition',
    description: 'Vertical story frame for Instagram & TikTok. Share your conference highlights!',
    tagline: 'Intelligence Unleashed',
    status: 'published',
    canvasWidth: 1080,
    canvasHeight: 1920,
    aspectRatio: '9:16',
    themeColor: '#8b5cf6',
    accentColor: '#10b981',
    frameType: 'preset',
    framePreset: 'ai-story',
    frameUrl: '/presets/aisummit-frame.png',
    frameMeta: {
      headline: 'GLOBAL AI SUMMIT',
      subline: 'OCTOBER 2026 • KEYNOTE ATTENDEE',
      badgeText: 'AI INNOVATOR',
      borderStyle: 'holographic',
      bannerPosition: 'full-border'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const SEED_ANALYTICS = {
  camp_mtf2026: {
    visits: 5280,
    photosUploaded: 2140,
    downloads: 1850,
    history: []
  },
  camp_summerbeats: {
    visits: 3410,
    photosUploaded: 1680,
    downloads: 1420,
    history: []
  },
  camp_aisummit: {
    visits: 2890,
    photosUploaded: 1220,
    downloads: 980,
    history: []
  }
};

function readJsonFile(filePath, defaultData) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultData;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

export const db = {
  getCampaigns() {
    return readJsonFile(CAMPAIGNS_FILE, SEED_CAMPAIGNS);
  },

  getCampaignById(id) {
    const list = this.getCampaigns();
    return list.find((c) => c.id === id || c.slug === id);
  },

  getCampaignBySlug(slug) {
    const list = this.getCampaigns();
    return list.find((c) => c.slug.toLowerCase() === slug.toLowerCase());
  },

  createCampaign(campaignData) {
    const list = this.getCampaigns();
    const id = 'camp_' + Date.now();
    const slug = (campaignData.slug || campaignData.name || 'campaign')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `frame-${Date.now()}`;

    // Verify slug uniqueness
    let finalSlug = slug;
    let counter = 1;
    while (list.some((c) => c.slug === finalSlug)) {
      finalSlug = `${slug}-${counter++}`;
    }

    const newCampaign = {
      id,
      slug: finalSlug,
      name: campaignData.name || 'Untitled Campaign',
      eventTitle: campaignData.eventTitle || campaignData.name || 'Event Photo Frame',
      description: campaignData.description || '',
      tagline: campaignData.tagline || '',
      status: campaignData.status || 'published',
      canvasWidth: Number(campaignData.canvasWidth) || 1080,
      canvasHeight: Number(campaignData.canvasHeight) || 1350,
      aspectRatio: campaignData.aspectRatio || '4:5',
      themeColor: campaignData.themeColor || '#6366f1',
      accentColor: campaignData.accentColor || '#38bdf8',
      frameType: campaignData.frameType || 'uploaded',
      frameUrl: campaignData.frameUrl || '',
      frameMeta: campaignData.frameMeta || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    list.unshift(newCampaign);
    writeJsonFile(CAMPAIGNS_FILE, list);

    // Initialize analytics entry
    const analytics = readJsonFile(ANALYTICS_FILE, SEED_ANALYTICS);
    analytics[id] = { visits: 0, photosUploaded: 0, downloads: 0, history: [] };
    writeJsonFile(ANALYTICS_FILE, analytics);

    return newCampaign;
  },

  updateCampaign(id, updateData) {
    const list = this.getCampaigns();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) return null;

    list[index] = {
      ...list[index],
      ...updateData,
      id: list[index].id, // protect id
      updatedAt: new Date().toISOString()
    };

    writeJsonFile(CAMPAIGNS_FILE, list);
    return list[index];
  },

  deleteCampaign(id) {
    const list = this.getCampaigns();
    const filtered = list.filter((c) => c.id !== id);
    if (filtered.length === list.length) return false;

    writeJsonFile(CAMPAIGNS_FILE, filtered);

    // Remove analytics
    const analytics = readJsonFile(ANALYTICS_FILE, SEED_ANALYTICS);
    delete analytics[id];
    writeJsonFile(ANALYTICS_FILE, analytics);

    return true;
  },

  recordAnalytics(campaignId, eventType) {
    const analytics = readJsonFile(ANALYTICS_FILE, SEED_ANALYTICS);
    if (!analytics[campaignId]) {
      analytics[campaignId] = { visits: 0, photosUploaded: 0, downloads: 0, history: [] };
    }

    if (eventType === 'visit') {
      analytics[campaignId].visits = (analytics[campaignId].visits || 0) + 1;
    } else if (eventType === 'upload' || eventType === 'photo_upload') {
      analytics[campaignId].photosUploaded = (analytics[campaignId].photosUploaded || 0) + 1;
    } else if (eventType === 'download') {
      analytics[campaignId].downloads = (analytics[campaignId].downloads || 0) + 1;
    }

    // Keep lightweight log
    if (!analytics[campaignId].history) analytics[campaignId].history = [];
    analytics[campaignId].history.push({
      event: eventType,
      timestamp: new Date().toISOString()
    });

    // Keep last 100 events
    if (analytics[campaignId].history.length > 100) {
      analytics[campaignId].history = analytics[campaignId].history.slice(-100);
    }

    writeJsonFile(ANALYTICS_FILE, analytics);
    return analytics[campaignId];
  },

  getAnalytics(campaignId) {
    const analytics = readJsonFile(ANALYTICS_FILE, SEED_ANALYTICS);
    const data = analytics[campaignId] || { visits: 0, photosUploaded: 0, downloads: 0, history: [] };
    const conversionRate = data.visits > 0 ? ((data.downloads / data.visits) * 100).toFixed(1) + '%' : '0%';
    return {
      ...data,
      conversionRate
    };
  },

  getAllAnalyticsSummary() {
    const campaigns = this.getCampaigns();
    const analytics = readJsonFile(ANALYTICS_FILE, SEED_ANALYTICS);

    let totalVisits = 0;
    let totalUploads = 0;
    let totalDownloads = 0;

    const items = campaigns.map((camp) => {
      const stat = analytics[camp.id] || { visits: 0, photosUploaded: 0, downloads: 0 };
      totalVisits += stat.visits || 0;
      totalUploads += stat.photosUploaded || 0;
      totalDownloads += stat.downloads || 0;
      const rate = stat.visits > 0 ? (((stat.downloads || 0) / stat.visits) * 100).toFixed(1) : 0;
      return {
        campaignId: camp.id,
        name: camp.name,
        slug: camp.slug,
        visits: stat.visits || 0,
        photosUploaded: stat.photosUploaded || 0,
        downloads: stat.downloads || 0,
        conversionRate: `${rate}%`
      };
    });

    const overallConversion = totalVisits > 0 ? ((totalDownloads / totalVisits) * 100).toFixed(1) : 0;

    return {
      totalCampaigns: campaigns.length,
      totalVisits,
      totalUploads,
      totalDownloads,
      overallConversionRate: `${overallConversion}%`,
      campaigns: items
    };
  }
};
