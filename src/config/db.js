const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  const rawUri = process.env.MONGODB_URI;
  const uri = rawUri && rawUri.trim() !== "" ? rawUri.trim() : "mongodb://127.0.0.1:27017/portfolio_db";

  if (isConnected) {
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = conn.connections[0].readyState === 1;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[Database] MongoDB Connection Warning: ${error.message}`);
    console.warn(
      "[Database] Running in resilient mode. Ensure MongoDB is running or MONGODB_URI is configured for production persistence."
    );
  }
};

mongoose.connection.on("connected", () => {
  isConnected = true;
  console.log("[Database] Mongoose connected to DB cluster.");
});

mongoose.connection.on("error", (err) => {
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
