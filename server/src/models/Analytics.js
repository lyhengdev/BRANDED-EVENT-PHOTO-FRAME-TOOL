import mongoose from 'mongoose';

const AnalyticsSchema = new mongoose.Schema(
  {
    campaignId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    visits: {
      type: Number,
      default: 0
    },
    photosUploaded: {
      type: Number,
      default: 0
    },
    downloads: {
      type: Number,
      default: 0
    },
    history: [
      {
        event: {
          type: String,
          enum: ['visit', 'upload', 'download'],
          required: true
        },
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ]
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

export const Analytics = mongoose.model('Analytics', AnalyticsSchema);
