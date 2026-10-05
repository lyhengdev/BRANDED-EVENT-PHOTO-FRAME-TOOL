import mongoose from 'mongoose';
import { Campaign } from './models/Campaign.js';
import { Analytics } from './models/Analytics.js';

const SEED_CAMPAIGNS = [
  {
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
    frameType: 'preset',
    framePreset: 'tech-summit',
    frameUrl: '/presets/mtf2026-frame.png',
    frameMeta: {
      headline: 'MODERN TECH FRONTIER 2026',
      subline: 'OFFICIAL ATTENDEE • SAN FRANCISCO, CA',
      badgeText: 'DELEGATE',
      borderStyle: 'cyber-glow',
      bannerPosition: 'bottom'
    }
  },
  {
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
    }
  },
  {
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
    }
  }
];

export async function connectDB(mongoUri) {
  try {
    const uri = mongoUri || process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables.');
    }

    mongoose.connection.on('connected', () => {
      console.log('🍃 MongoDB Atlas: Connected successfully.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB Atlas connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB Atlas: Connection disconnected.');
    });

    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000
    });

    // Auto-seed initial campaigns if database is fresh
    await seedInitialData();

    return true;
  } catch (err) {
    console.error('Failed to initialize MongoDB Atlas connection:', err.message);
    throw err;
  }
}

async function seedInitialData() {
  try {
    const count = await Campaign.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding default initial event campaigns into MongoDB Atlas...');
      for (const item of SEED_CAMPAIGNS) {
        const created = await Campaign.create(item);
        await Analytics.create({
          campaignId: created._id.toString(),
          visits: item.slug === 'mtf2026' ? 5280 : item.slug === 'summerbeats2026' ? 3410 : 2890,
          photosUploaded: item.slug === 'mtf2026' ? 2140 : item.slug === 'summerbeats2026' ? 1680 : 1220,
          downloads: item.slug === 'mtf2026' ? 1850 : item.slug === 'summerbeats2026' ? 1420 : 980,
          history: []
        });
      }
      console.log('✓ MongoDB Atlas seeding completed successfully.');
    }
  } catch (e) {
    console.error('Warning during MongoDB seeding:', e.message);
  }
}

export const db = {
  async getCampaigns() {
    const list = await Campaign.find({ status: { $ne: 'archived' } }).sort({ createdAt: -1 });
    return list.map(c => c.toJSON());
  },

  async getCampaignById(idOrSlug) {
    let doc = null;
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      doc = await Campaign.findById(idOrSlug);
    }
    if (!doc) {
      doc = await Campaign.findOne({ slug: idOrSlug.toLowerCase() });
    }
    return doc ? doc.toJSON() : null;
  },

  async getCampaignBySlug(slug) {
    const doc = await Campaign.findOne({ slug: slug.toLowerCase() });
    return doc ? doc.toJSON() : null;
  },

  async createCampaign(campaignData) {
    const rawSlug = (campaignData.slug || campaignData.name || 'campaign')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `frame-${Date.now()}`;

    // Verify slug uniqueness
    let finalSlug = rawSlug;
    let counter = 1;
    while (await Campaign.exists({ slug: finalSlug })) {
      finalSlug = `${rawSlug}-${counter++}`;
    }

    const newCampaign = await Campaign.create({
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
      framePreset: campaignData.framePreset || 'tech-summit',
      frameUrl: campaignData.frameUrl || '',
      frameMeta: campaignData.frameMeta || {}
    });

    const json = newCampaign.toJSON();

    // Create corresponding analytics record
    await Analytics.create({
      campaignId: json.id,
      visits: 0,
      photosUploaded: 0,
      downloads: 0,
      history: []
    });

    return json;
  },

  async updateCampaign(id, updateData) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const bySlug = await Campaign.findOne({ slug: id });
      if (bySlug) id = bySlug._id;
      else return null;
    }

    const updated = await Campaign.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    );
    return updated ? updated.toJSON() : null;
  },

  async deleteCampaign(id) {
    let filter = { _id: id };
    if (!mongoose.Types.ObjectId.isValid(id)) {
      filter = { slug: id };
    }

    const deleted = await Campaign.findOneAndDelete(filter);
    if (!deleted) return false;

    await Analytics.deleteMany({ campaignId: deleted._id.toString() });
    return true;
  },

  async recordAnalytics(campaignId, eventType) {
    const incField = 
      eventType === 'visit' ? 'visits' : 
      eventType === 'upload' || eventType === 'photo_upload' ? 'photosUploaded' : 
      eventType === 'download' ? 'downloads' : null;

    const update = {
      $push: {
        history: {
          $each: [{ event: eventType, timestamp: new Date() }],
          $slice: -100 // retain latest 100 entries
        }
      }
    };

    if (incField) {
      update.$inc = { [incField]: 1 };
    }

    const stat = await Analytics.findOneAndUpdate(
      { campaignId },
      update,
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    return stat.toJSON();
  },

  async getAnalytics(campaignId) {
    let stat = await Analytics.findOne({ campaignId });
    if (!stat) {
      stat = await Analytics.create({
        campaignId,
        visits: 0,
        photosUploaded: 0,
        downloads: 0,
        history: []
      });
    }

    const data = stat.toJSON();
    const conversionRate = data.visits > 0 ? ((data.downloads / data.visits) * 100).toFixed(1) + '%' : '0%';
    return {
      ...data,
      conversionRate
    };
  },

  async getAllAnalyticsSummary() {
    const campaigns = await Campaign.find({ status: { $ne: 'archived' } }).sort({ createdAt: -1 });
    const statsList = await Analytics.find();

    const statsMap = new Map();
    for (const s of statsList) {
      statsMap.set(s.campaignId, s);
    }

    let totalVisits = 0;
    let totalUploads = 0;
    let totalDownloads = 0;

    const items = campaigns.map((camp) => {
      const campId = camp._id.toString();
      const s = statsMap.get(campId) || { visits: 0, photosUploaded: 0, downloads: 0 };
      totalVisits += s.visits || 0;
      totalUploads += s.photosUploaded || 0;
      totalDownloads += s.downloads || 0;

      const rate = s.visits > 0 ? (((s.downloads || 0) / s.visits) * 100).toFixed(1) : 0;
      return {
        campaignId: campId,
        name: camp.name,
        slug: camp.slug,
        visits: s.visits || 0,
        photosUploaded: s.photosUploaded || 0,
        downloads: s.downloads || 0,
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
