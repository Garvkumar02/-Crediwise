const mongoose = require("mongoose");

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    console.log("MongoDB Connected (Cached)");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true, // Enable buffering for cold starts
    };

    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log(`MongoDB Connected: ${cached.conn.connection.host}`);
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    console.error(`Error connecting to MongoDB: ${e.message}`);
    // process.exit(1); // Do not exit in serverless
    throw e;
  }
};

module.exports = connectDB;
