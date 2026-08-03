import mongoose from 'mongoose';

const queueSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    status: { type: String, enum: ['OPEN', 'PAUSED', 'CLOSED'], default: 'OPEN' },
    currentToken: { type: Number, default: 0 },
    nextTokenNumber: { type: Number, default: 1 },
  },
  { timestamps: true },
);

export default mongoose.model('Queue', queueSchema);
