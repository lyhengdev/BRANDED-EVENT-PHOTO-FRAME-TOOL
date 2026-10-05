import mongoose from 'mongoose';
import { Campaign } from './models/Campaign.js';
import { Analytics } from './models/Analytics.js';

const FALLBACK_URI = 'mongodb+srv://lyhengdev_db_user:t6cjUYSZ6xkjXN7J@cluster0.kgxsvma.mongodb.net/branded_photo_frame?retryWrites=true&w=majority';

let cachedConnection = null;
let connectionPromise = null;

export async function connectDB(mongoUri) {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    if (connectionPromise) {
      return await connectionPromise;
    }

    const uri = mongoUri || process.env.MONGODB_URI || FALLBACK_URI;

    mongoose.connection.on('connected', () => {
      console.log('🍃 MongoDB Atlas: Connected successfully.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB Atlas connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB Atlas: Connection disconnected.');
    });

    connectionPromise = mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 20000,
      autoIndex: false,
    });

    cachedConnection = await connectionPromise;
    return cachedConnection;
  } catch (err) {
    connectionPromise = null;
    console.error('Failed to initialize MongoDB Atlas connection:', err.message);
    throw err;
  }
}

export const db = {
  async getCampaigns() {
    await connectDB();
    const list = await Campaign.find({ status: { $ne: 'archived' } })
      .sort({ createdAt: -1 })
      .lean();
    return list.map(c => ({ ...c, id: c._id.toString() }));
  },

  async getCampaignById(idOrSlug) {
    await connectDB();
    let doc = null;
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      doc = await Campaign.findById(idOrSlug).lean();
    }
    if (!doc) {
      doc = await Campaign.findOne({ slug: idOrSlug.toLowerCase() }).lean();
    }
    return doc ? { ...doc, id: doc._id.toString() } : null;
  },

  async getCampaignBySlug(slug) {
    await connectDB();
    const doc = await Campaign.findOne({ slug: slug.toLowerCase() }).lean();
    return doc ? { ...doc, id: doc._id.toString() } : null;
  },

  async createCampaign(campaignData) {
    await connectDB();
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
    await connectDB();
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
    await connectDB();
    if (!id || id === 'undefined' || id === 'null') return false;

    let deleted = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      deleted = await Campaign.findByIdAndDelete(id);
    }
    if (!deleted) {
      deleted = await Campaign.findOneAndDelete({ slug: String(id).toLowerCase() });
    }
    if (!deleted) return false;

    await Analytics.deleteMany({ campaignId: deleted._id.toString() });
    return true;
  },

  async recordAnalytics(campaignId, eventType) {
    await connectDB();
    const incField = 
      eventType === 'visit' ? 'visits' : 
      eventType === 'upload' || eventType === 'photo_upload' ? 'photosUploaded' : 
      eventType === 'download' ? 'downloads' : null;

    const update = {
      $push: {
        history: {
          $each: [{ event: eventType, timestamp: new Date() }],
          $slice: -100
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
    await connectDB();
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
    await connectDB();
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
