const mongoose = require("mongoose");
const dns = require("dns");
const fs = require("fs");
const path = require("path");

let isMongo = false;
const DATA_DIR = path.join(__dirname, "../../data");

if (!fs.existsSync(DATA_DIR)) {
fs.mkdirSync(DATA_DIR, { recursive: true });
}
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (process.env.MONGODB_DNS_SERVERS) {
    dns.setServers(process.env.MONGODB_DNS_SERVERS.split(",").map((server) => server.trim()));
  }

  if (!uri) {
    console.log("MONGODB_URI is not configured. Falling back to local JSON database.");
    return false;
  }

  try {
    await mongoose.connect(uri);
    isMongo = true;
console.log("Connected to MongoDB successfully.");
  } catch (error) {
    isMongo = false;
    console.log("Error Connecting to MongoDB. Falling back to local JSON database:", error.message);
  }

  return isMongo;
};

function getIsMongo() {
  return isMongo;
}

module.exports = {
  connectDB,
  getIsMongo,
  DATA_DIR,
};
