import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let mongoMemoryServer = null;

export const connectDB = async () => {
  // Check if mongoose already has an active connection
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const customUri = process.env.MONGODB_URI;

  if (customUri) {
    try {
      console.log(`[Database] Connecting to configured MONGODB_URI...`);
      await mongoose.connect(customUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[Database] Connected to MongoDB at ${customUri}`);
      return;
    } catch (err) {
      console.warn(`[Database] Failed to connect to MONGODB_URI: ${err.message}`);
    }
  }

  // If running in Vercel Serverless environment and no custom URI provided,
  // do not attempt to download MongoMemoryServer in Lambda
  if (process.env.VERCEL) {
    console.warn(`[Vercel Serverless] MONGODB_URI is not set. To connect a database in production, add MONGODB_URI to your Vercel Environment Variables.`);
    return;
  }

  // Attempt local MongoDB on standard port if no URI provided
  if (!customUri) {
    try {
      console.log(`[Database] Attempting local MongoDB connection (mongodb://127.0.0.1:27017/traindesk)...`);
      await mongoose.connect('mongodb://127.0.0.1:27017/traindesk', {
        serverSelectionTimeoutMS: 2000,
      });
      console.log(`[Database] Connected to local MongoDB.`);
      return;
    } catch (err) {
      console.log(`[Database] Local MongoDB unavailable (${err.message}). Starting embedded In-Memory MongoDB...`);
    }
  }

  // Local Fallback: MongoMemoryServer
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongoMemoryServer = await MongoMemoryServer.create();
    const uri = mongoMemoryServer.getUri();
    await mongoose.connect(uri);
    console.log(`[Database] Connected to embedded in-memory MongoDB (${uri}).`);
  } catch (memoryErr) {
    console.error(`[Database] Failed to initialize in-memory MongoDB:`, memoryErr.message);
  }
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};

export default connectDB;
