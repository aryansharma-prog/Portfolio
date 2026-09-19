const mongoose = require("mongoose");

let isConnected = false;

// Disable command buffering so requests fail-fast to memory fallback instead of hanging
mongoose.set("bufferCommands", false);
mongoose.set("bufferTimeoutMS", 3000);

const connectDB = async () => {
  const rawUri = process.env.MONGODB_URI;
  const uri = rawUri && rawUri.trim() !== "" ? rawUri.trim() : null;

  if (isConnected || !uri) {
    if (!uri) {
      console.log("[Database] No MONGODB_URI configured. Inquiries will use in-memory store.");
    }
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 5000,
    });

    isConnected = conn.connections[0].readyState === 1;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    isConnected = false;
    console.warn(`[Database] MongoDB Connection Warning: ${error.message}`);
    console.warn(
      "[Database] Running in resilient fallback mode. Please ensure your MongoDB Atlas Network Access whitelist includes 0.0.0.0/0."
    );
  }
};

mongoose.connection.on("connected", () => {
  isConnected = true;
  console.log("[Database] Mongoose connected to DB cluster.");
});

mongoose.connection.on("error", (err) => {
  isConnected = false;
  console.error(`[Database] Mongoose connection error: ${err.message}`);
});

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.log("[Database] Mongoose disconnected.");
});

module.exports = {
  connectDB,
  isConnected: () => isConnected,
};
