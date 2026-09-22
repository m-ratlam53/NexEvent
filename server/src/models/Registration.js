import mongoose from 'mongoose';
import { REGISTRATION_STATUS } from '../utils/constants.js';

const registrationSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    participant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: Object.values(REGISTRATION_STATUS),
      default: REGISTRATION_STATUS.REGISTERED,
    },
    // 1-based FIFO position among this event's currently WAITLISTED entries.
    // null for registered/cancelled entries. Kept contiguous (1..N) by
    // recomputeWaitlistPositions() after every join/cancel/promotion.
    waitlistPosition: { type: Number, default: null },
  },
  { timestamps: true },
);

// Supports the duplicate-registration check (event+participant+status lookup)
// and derived seat counts (event+status lookup).
registrationSchema.index({ event: 1, participant: 1 });
registrationSchema.index({ event: 1, status: 1 });

export const Registration = mongoose.model('Registration', registrationSchema);
