import mongoose from 'mongoose';

let connectionPromise;

export async function connectDB() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not configured.');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGO_URI).then((mongooseInstance) => {
      console.log('MongoDB connected');
      return mongooseInstance.connection;
    });
  }

  return connectionPromise;
}
