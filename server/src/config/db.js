import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  if (!env.mongoUri) {
    throw new Error('MONGO_URI is not set — cannot connect to MongoDB');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(env.mongoUri);

  // eslint-disable-next-line no-console
  console.log(`[db] Connected to MongoDB: ${mongoose.connection.name}`);
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
