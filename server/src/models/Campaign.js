import mongoose from 'mongoose';

const CampaignSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    eventTitle: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    tagline: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['published', 'draft', 'archived'],
      default: 'published'
    },
    canvasWidth: {
      type: Number,
      required: true,
      default: 1080
    },
    canvasHeight: {
      type: Number,
      required: true,
      default: 1350
    },
    aspectRatio: {
      type: String,
      default: '4:5'
    },
    themeColor: {
      type: String,
      default: '#6366f1'
    },
    accentColor: {
      type: String,
      default: '#06b6d4'
    },
    frameType: {
      type: String,
      enum: ['preset', 'uploaded'],
      default: 'preset'
    },
    framePreset: {
      type: String,
      default: 'tech-summit'
    },
    frameUrl: {
      type: String,
      default: ''
    },
    frameMeta: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const Campaign = mongoose.model('Campaign', CampaignSchema);
