import mongoose from 'mongoose';

const queueEntrySchema = new mongoose.Schema(
  {
    queue: { type: mongoose.Schema.Types.ObjectId, ref: 'Queue', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenNumber: { type: Number, required: true },
    status: {
      type: String,
      enum: ['WAITING', 'CALLED', 'SERVING', 'COMPLETED', 'SKIPPED', 'CANCELLED'],
      default: 'WAITING',
    },
    counterName: { type: String, trim: true, maxlength: 80 },
    joinedAt: { type: Date, default: Date.now },
    calledAt: Date,
    servedAt: Date,
  },
  { timestamps: true },
);

queueEntrySchema.index({ queue: 1, customer: 1, status: 1 });
queueEntrySchema.index({ queue: 1, tokenNumber: 1 }, { unique: true });

export default mongoose.model('QueueEntry', queueEntrySchema);
