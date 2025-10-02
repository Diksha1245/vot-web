# Voter Face Recognition System - Setup Instructions

## 🚀 Quick Start Guide

Follow these steps to set up and run the complete Voter Face Recognition System with real backend services.

## 📋 Prerequisites

### System Requirements
- **Node.js 16+** and npm
- **Python 3.8+** with pip
- **Git** for version control
- **Modern web browser** with webcam support
- **Minimum 8GB RAM** (for TensorFlow/DeepFace)

### Required Accounts
- **Firebase account** (free tier is sufficient)
- **Google Cloud account** (if using Firebase)

## ⚙️ Installation Steps

### 1. Setup Backend API (Node.js/Express)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

**Configure `.env` file:**
```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:8080
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
FACE_SERVICE_URL=http://localhost:5000
JWT_SECRET=your-super-secret-jwt-key-here
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

### 2. Setup Face Recognition Service (Python/Flask)

```bash
# Navigate to face recognition service directory
cd ../face-recognition-service

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env file
nano .env
```

**Configure `.env` file:**
```env
FLASK_ENV=development
FLASK_DEBUG=false
PORT=5000
ENCRYPTION_KEY=your-32-character-fernet-key-goes-here!!
MODEL_NAME=Facenet512
DETECTOR_BACKEND=opencv
DISTANCE_METRIC=cosine
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

### 3. Firebase Setup

1. **Create Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project"
   - Follow the setup wizard

2. **Enable Realtime Database:**
   - In Firebase Console, go to "Realtime Database"
   - Click "Create Database"
   - Choose "Start in test mode" for development

3. **Generate Service Account:**
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save as `firebase-service-account.json` in the `backend/` folder

4. **Update Environment Variables:**
   - Copy the Database URL from Firebase Console
   - Update `FIREBASE_DATABASE_URL` in `backend/.env`

### 4. Generate Security Keys

```bash
# Generate encryption key for backend
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Fernet key for Python service
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

## 🏃‍♂️ Running the System

### Terminal 1 - Face Recognition Service
```bash
cd face-recognition-service
source venv/bin/activate  # or venv\Scripts\activate on Windows
python app.py
```

### Terminal 2 - Backend API Server
```bash
cd backend
npm run dev
```

### Terminal 3 - Frontend (Simple HTTP Server)
```bash
# In the main project directory
python3 -m http.server 8080
# or use any static file server
# npx serve . -p 8080
```

## 🌐 Access the Application

- **Frontend:** http://localhost:8080
- **API Server:** http://localhost:3000
- **Face Service:** http://localhost:5000
- **Health Checks:** 
  - API: http://localhost:3000/api/health
  - Face Service: http://localhost:5000/health

## 🧪 Testing the System

### 1. Test API Endpoints
```bash
# Health check
curl http://localhost:3000/api/health

# Face service health
curl http://localhost:5000/health
```

### 2. Test Registration
1. Open http://localhost:8080
2. Navigate to "Register" page
3. Fill in voter details
4. Allow camera access
5. Capture face image
6. Submit registration

### 3. Test Authentication
1. Navigate to "Authenticate" page
2. Start camera
3. Click authenticate
4. Verify results

## 🛠️ Troubleshooting

### Common Issues

**1. Firebase Connection Error:**
- Verify `firebase-service-account.json` is in `backend/` folder
- Check Firebase Database URL in `.env`
- Ensure Firebase Realtime Database is enabled

**2. Face Service Connection Error:**
- Check if Python service is running on port 5000
- Verify virtual environment is activated
- Install missing Python dependencies

**3. Camera Access Denied:**
- Allow camera permissions in browser
- Use HTTPS in production (required for camera access)
- Check browser security settings

**4. TensorFlow/DeepFace Installation Issues:**
```bash
# For macOS with M1/M2 chips:
pip install tensorflow-macos
pip install tensorflow-metal

# For GPU support:
pip install tensorflow-gpu
```

### Performance Optimization

**1. Model Loading:**
- First face recognition request will be slow (model loading)
- Subsequent requests will be faster

**2. Memory Usage:**
- TensorFlow/DeepFace requires significant RAM
- Consider using cloud deployment for production

**3. Response Times:**
- Face extraction: ~2-3 seconds
- Face comparison: ~0.5 seconds
- Database operations: ~0.1 seconds

## 🚀 Production Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=443
FRONTEND_URL=https://your-domain.com
FIREBASE_DATABASE_URL=https://your-production-project.firebaseio.com/
FACE_SERVICE_URL=https://face-service.your-domain.com
```

### Security Considerations
- Use HTTPS for all endpoints
- Enable Firebase security rules
- Implement rate limiting
- Add request authentication
- Use environment-specific encryption keys
- Enable CORS only for trusted origins

### Scaling Options
- Use Docker containers for deployment
- Deploy face service separately (microservices)
- Use Firebase Hosting for frontend
- Consider cloud functions for serverless backend
- Implement load balancing for high traffic

## 📊 System Monitoring

- Check API health endpoints regularly
- Monitor Firebase usage and quotas  
- Track face recognition accuracy metrics
- Set up error logging and alerts
- Monitor system performance metrics

## 🔧 Development Mode

For development, you can use nodemon and Flask debug mode:

```bash
# Backend with auto-reload
cd backend
npm run dev

# Face service with debug mode
cd face-recognition-service  
FLASK_DEBUG=true python app.py
```

This enables automatic restarts when code changes are detected.

---

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all services are running
3. Check browser console for JavaScript errors
4. Review terminal logs for backend errors
5. Ensure all environment variables are set correctly

The system should now be fully functional with real backend services, Firebase integration, and facial recognition capabilities!
