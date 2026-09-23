import mongoose from 'mongoose';
import { EVENT_STATUS, EVENT_MODE, EVENT_CATEGORIES } from '../utils/constants.js';

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, enum: EVENT_CATEGORIES, required: true },
    date: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    mode: { type: String, enum: Object.values(EVENT_MODE), required: true },
    location: {
      address: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    capacity: { type: Number, required: true, min: 1 },
    // Optional cutoff after which no new registrations/waitlist joins are
    // accepted, even if the event itself hasn't started yet.
    registrationDeadline: { type: Date, default: null },
    // Data URI (base64) or external URL — stored as plain text rather than
    // a file-storage integration, matching the project's time constraints.
    posterUrl: { type: String, default: null },
    status: {
      type: String,
      enum: Object.values(EVENT_STATUS),
      required: true,
      default: EVENT_STATUS.DRAFT,
    },
  },
  { timestamps: true },
);

eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ organizer: 1 });

export const Event = mongoose.model('Event', eventSchema);
