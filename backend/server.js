const express = require('express');
const cors = require('cors');
const multer = require('multer');
const admin = require('firebase-admin');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://localhost:5000';

// Initialize Firebase Admin
try {
  const serviceAccount = require('./firebase-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization failed:', error.message);
  process.exit(1);
}

const db = admin.database();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Validation schemas
const voterRegistrationSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  faceData: Joi.string().required() // base64 encoded image
});

const authenticationSchema = Joi.object({
  faceData: Joi.string().required()
});

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      firebase: admin.apps.length > 0 ? 'connected' : 'disconnected',
      faceService: 'checking...'
    }
  });
});

// Register new voter
app.post('/api/register', async (req, res) => {
  try {
    // Validate input
    const { error, value } = voterRegistrationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, email, faceData } = value;

    // Check if email already exists
    const existingVoter = await db.ref('voters').orderByChild('email').equalTo(email).once('value');
    if (existingVoter.exists()) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Process face data with face recognition service
    const faceResponse = await axios.post(`${FACE_SERVICE_URL}/extract-features`, {
      imageData: faceData,
      imageType: 'base64'
    });

    if (!faceResponse.data.success) {
      return res.status(400).json({ error: 'Face detection failed: ' + faceResponse.data.error });
    }

    // Create voter record
    const voterId = uuidv4();
    const voterData = {
      id: voterId,
      name: name,
      email: email,
      registrationDate: new Date().toISOString(),
      faceEncoding: faceResponse.data.faceEncoding,
      status: 'active',
      createdAt: admin.database.ServerValue.TIMESTAMP
    };

    // Save to Firebase
    await db.ref(`voters/${voterId}`).set(voterData);

    // Log registration
    await db.ref('registration_logs').push({
      voterId: voterId,
      voterName: name,
      timestamp: admin.database.ServerValue.TIMESTAMP,
      action: 'registered'
    });

    res.status(201).json({
      success: true,
      message: 'Voter registered successfully',
      voterId: voterId
    });

  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ error: 'Face recognition service unavailable' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Authenticate voter
app.post('/api/authenticate', async (req, res) => {
  try {
    // Validate input
    const { error, value } = authenticationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { faceData } = value;

    // Extract features from provided face
    const faceResponse = await axios.post(`${FACE_SERVICE_URL}/extract-features`, {
      imageData: faceData,
      imageType: 'base64'
    });

    if (!faceResponse.data.success) {
      return res.status(400).json({ error: 'Face detection failed: ' + faceResponse.data.error });
    }

    // Get all registered voters
    const votersSnapshot = await db.ref('voters').once('value');
    const voters = votersSnapshot.val() || {};

    let bestMatch = null;
    let bestConfidence = 0;
    const CONFIDENCE_THRESHOLD = 0.85;

    // Compare with all registered faces
    for (const [voterId, voter] of Object.entries(voters)) {
      if (voter.status !== 'active') continue;

      const compareResponse = await axios.post(`${FACE_SERVICE_URL}/compare-faces`, {
        faceEncoding1: faceResponse.data.faceEncoding,
        faceEncoding2: voter.faceEncoding
      });

      if (compareResponse.data.success && compareResponse.data.confidence > bestConfidence) {
        bestConfidence = compareResponse.data.confidence;
        bestMatch = { id: voterId, ...voter };
      }
    }

    const authResult = bestConfidence >= CONFIDENCE_THRESHOLD;

    // Log authentication attempt
    await db.ref('authentication_logs').push({
      timestamp: admin.database.ServerValue.TIMESTAMP,
      voterId: bestMatch ? bestMatch.id : null,
      voterName: bestMatch ? bestMatch.name : null,
      result: authResult ? 'success' : 'failed',
      confidence: bestConfidence,
      ipAddress: req.ip
    });

    if (authResult) {
      res.json({
        success: true,
        message: 'Authentication successful',
        voter: {
          id: bestMatch.id,
          name: bestMatch.name,
          email: bestMatch.email
        },
        confidence: bestConfidence
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Authentication failed',
        confidence: bestConfidence
      });
    }

  } catch (error) {
    console.error('Authentication error:', error);
    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ error: 'Face recognition service unavailable' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Get dashboard statistics
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const votersSnapshot = await db.ref('voters').once('value');
    const authLogsSnapshot = await db.ref('authentication_logs').limitToLast(100).once('value');
    
    const voters = votersSnapshot.val() || {};
    const authLogs = authLogsSnapshot.val() || {};
    
    const totalRegistered = Object.keys(voters).length;
    const activeVoters = Object.values(voters).filter(v => v.status === 'active').length;
    
    // Calculate today's successful authentications
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    
    const todayAuths = Object.values(authLogs).filter(log => 
      log.timestamp > todayTimestamp && log.result === 'success'
    );
    
    const successfulAuthsToday = todayAuths.length;
    
    // Calculate system accuracy (last 100 attempts)
    const totalAttempts = Object.keys(authLogs).length;
    const successfulAttempts = Object.values(authLogs).filter(log => log.result === 'success').length;
    const accuracy = totalAttempts > 0 ? ((successfulAttempts / totalAttempts) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      stats: {
        totalRegistered,
        activeVoters,
        successfulAuthsToday,
        systemAccuracy: `${accuracy}%`,
        uptime: '99.8%' // This would typically come from a monitoring service
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get recent authentication logs
app.get('/api/dashboard/logs', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const logsSnapshot = await db.ref('authentication_logs')
      .orderByChild('timestamp')
      .limitToLast(limit)
      .once('value');
    
    const logs = logsSnapshot.val() || {};
    const logsArray = Object.entries(logs).map(([key, log]) => ({
      id: key,
      ...log,
      timestamp: new Date(log.timestamp).toISOString()
    })).reverse(); // Most recent first

    res.json({
      success: true,
      logs: logsArray
    });

  } catch (error) {
    console.error('Dashboard logs error:', error);
    res.status(500).json({ error: 'Failed to fetch authentication logs' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Voter FRS API Server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard/stats`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
