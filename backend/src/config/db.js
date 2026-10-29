import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let mongoMemoryServer = null;

export const connectDB = async () => {
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
      console.warn(`[Database] Falling back to Standalone In-Memory Mode.`);
    }
  }

  // Attempt local MongoDB on standard port if no URI provided
  if (!customUri && !process.env.VERCEL) {
    try {
      await mongoose.connect('mongodb://127.0.0.1:27017/traindesk', {
        serverSelectionTimeoutMS: 1500,
      });
      console.log(`[Database] Connected to local MongoDB.`);
      return;
    } catch (err) {
      // Local MongoDB not running - fallback smoothly
    }
  }

  console.log(`[Database] Operating in Standalone In-Memory Store Mode. All REST endpoints are fully operational.`);
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
