const express = require("express");
const http = require("http");
const sequelize = require("./config");
const User = require("./models/userModel");
const Property = require("./models/propertyModel");
const Booking = require("./models/bookingModel");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { initializeSocket } = require("./socket");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'property-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Only allow image files
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP and GIF are allowed'));
    }
  }
});

// Import routes
const authRoutes = require("./routes/authRoutes_new");
const propertyRoutes = require("./routes/propertyRoutes");
const approvalRoutes = require("./routes/approvalRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const messageRoutes = require("./routes/messageRoutes");
const placesRoutes = require("./routes/placesRoutes");

const app = express();
const server = http.createServer(app);
const jsonParser = express.json({ limit: '25mb' });
const urlencodedParser = express.urlencoded({ extended: true, limit: '25mb' });

// Middleware
// IMPORTANT: Order matters! We need to apply multer BEFORE express.json() for multipart routes
// But we still need json parsing for other routes

// For /api/properties, we use custom middleware chain with multer first
// For other routes, we use standard json/urlencoded parsing

// First, add CORS
app.use(cors({ 
  origin: [
    "http://localhost:5173", 
    "http://localhost:8081", 
    "http://localhost:8082",
    "http://192.168.1.6:5173",
    "http://192.168.1.6:8081",
    "http://192.168.1.6:8082",
    "http://192.168.1.6:19000", // Expo web
    "http://192.168.1.6:19001",
  ], 
  credentials: true 
}));

app.use(cookieParser());

// Second, add JSON/URL-encoded parsing ONLY for non-multipart routes
// We'll use a conditional middleware that skips these for /api/properties POST requests
app.use((req, res, next) => {
  // Skip body parsing for multipart POST requests to /api/properties
  // Multer will handle this
  if (req.method === 'POST' && req.path === '/api/properties' && 
      req.headers['content-type']?.includes('multipart/form-data')) {
    return next();
  }
  jsonParser(req, res, () => {
    urlencodedParser(req, res, next);
  });
});

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// DEBUG MIDDLEWARE - Log raw multipart requests before multer processes them
app.use('/api/properties', (req, res, next) => {
  if (req.method === 'POST') {
    console.log('\n🔍 PRE-MULTER DEBUG MIDDLEWARE');
    console.log('   Content-Type:', req.headers['content-type']);
    console.log('   Content-Length:', req.headers['content-length']);
    console.log('   Method:', req.method);
    console.log('   URL:', req.url);
    
    // Check if content-type has multipart
    const isMultipart = req.headers['content-type']?.includes('multipart/form-data');
    console.log('   Is Multipart:', isMultipart);
  }
  next();
});

// Apply multer to properties routes - THIS MUST BE FIRST before other body parsers consume the stream
// Add a debugging middleware BEFORE multer to see what's coming in
app.use("/api/properties", (req, res, next) => {
  if (req.method === 'POST') {
    console.log('\n🔍 [BEFORE MULTER] Checking request:');
    console.log(`   Content-Type: ${req.headers['content-type']}`);
    console.log(`   Is multipart: ${req.headers['content-type']?.includes('multipart')}`);
  }
  next();
}, upload.array('images', 10), (req, res, next) => {
  if (req.method === 'POST') {
    console.log('\n🔍 [AFTER MULTER] File processing:');
    console.log(`   req.files type: ${typeof req.files}`);
    console.log(`   req.files: ${req.files ? JSON.stringify(req.files.map(f => ({ fieldname: f.fieldname, filename: f.filename }))) : 'null'}`);
    console.log(`   req.body keys: ${Object.keys(req.body || {})}`);
  }
  next();
}, propertyRoutes);

// Multer error handling middleware - catches file validation errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Handle multer specific errors
    console.error('🔴 Multer Error:', err.message);
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ error: 'File size exceeds 10MB limit' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Maximum 10 files allowed' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err && err.message && err.message.includes('Invalid file type')) {
    // Handle custom file filter errors
    console.error('🔴 File Filter Error:', err.message);
    return res.status(400).json({ error: err.message });
  }
  // Pass other errors to next middleware
  next(err);
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/approval", approvalRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/places", placesRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "House Rental Tunisia API is running",
    timestamp: new Date().toISOString()
  });
});

// Start server
async function startServer() {
  try {
    // a3ml schema if it doesn't exist
    await sequelize.query('CREATE SCHEMA IF NOT EXISTS ikri;');
    console.log("✅ Schema 'ikri' checked/created");
    
    // Sync models
    await sequelize.sync({ alter: true });
    console.log("✅ Models synced with DB");
    
    // Fix sender_id constraint to allow NULL for system messages
    try {
      await sequelize.query(`ALTER TABLE "ikri"."messages" ALTER COLUMN "sender_id" DROP NOT NULL;`);
      console.log("✅ sender_id constraint fixed (nullable for system messages)");
    } catch (err) {
      // Constraint might already be dropped, that's OK
      console.log("ℹ️ sender_id already nullable");
    }
    
    console.log("🏠 House Rental Tunisia API");
    
    // Initialize Socket.IO
    initializeSocket(server);
    console.log("⚡ Socket.IO initialized for real-time chat");
    
    // Start the server - listen on all interfaces (0.0.0.0)
    server.listen(4000, '0.0.0.0', () => {
      console.log("🚀 Server running on port 4000");
      console.log("📍 API available at http://0.0.0.0:4000/api");
      console.log("   Or use your machine IP, e.g., http://26.71.37.69:4000/api");
      console.log("💬 Real-time chat enabled");
    });
  } catch (error) {
    console.error("❌ Database sync error:", error);
  }
}

startServer();