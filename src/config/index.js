require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV,
  db: {
    url: process.env.DATABASE_URL,
  },
  zalo: {
    appId: process.env.ZALO_APP_ID,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  upload: {
    dir: process.env.UPLOAD_DIR || "uploads",
    
  },
  publicUrl:
    process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`,

  fitroom: {
    apiKey: process.env.FITROOM_API_KEY,
    baseUrl: process.env.FITROOM_BASE_URL || "https://platform.fitroom.app/api",
    timeout: parseInt(process.env.FITROOM_TIMEOUT) || 60000,
  }
};