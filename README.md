# 🔐 Voter Face Recognition System

A comprehensive full-stack voter authentication system using advanced facial recognition technology with 95%+ accuracy, built with Node.js, Python, Firebase, and AI-powered face detection.

## ✨ Features

- **🤖 AI-Powered Face Recognition** - DeepFace with Facenet512 model for 95%+ accuracy
- **🔒 Secure Data Storage** - Encrypted face embeddings in Firebase Realtime Database
- **⚡ Real-time Authentication** - Sub-second face matching and verification
- **📊 Live Dashboard** - Real-time statistics and authentication logs
- **🛡️ Security First** - Rate limiting, input validation, and encrypted data storage
- **📱 Responsive Design** - Modern UI that works on all devices
- **🔄 RESTful API** - Complete backend API with comprehensive endpoints

## 🏗️ Architecture

### Frontend
- **HTML5/CSS3/JavaScript** - Modern responsive web interface
- **WebRTC Camera Access** - Real-time webcam integration
- **Canvas API** - Image capture and processing

### Backend
- **Node.js + Express.js** - RESTful API server
- **Python + Flask** - Face recognition microservice
- **Firebase Realtime Database** - Scalable data storage
- **JWT Authentication** - Secure session management

### AI/ML
- **DeepFace Library** - State-of-the-art face recognition
- **Facenet512 Model** - High-accuracy face embeddings
- **TensorFlow** - Deep learning framework
- **OpenCV** - Computer vision processing

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+ with pip
- Firebase account
- Webcam-enabled device

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Diksha1245/vot-web.git
   cd vot-web
   ```

2. **Setup Backend API**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Setup Face Recognition Service**
   ```bash
   cd ../face-recognition-service
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Configure Firebase**
   - Create a Firebase project
   - Enable Realtime Database
   - Download service account key as `firebase-service-account.json`
   - Place in `backend/` folder

5. **Start the Services**
   ```bash
   # Terminal 1: Face Recognition Service
   cd face-recognition-service
   source venv/bin/activate
   python app.py

   # Terminal 2: Backend API
   cd backend
   npm run dev

   # Terminal 3: Frontend Server
   python3 -m http.server 8080
   ```

6. **Access the Application**
   - Open http://localhost:8080
   - Allow camera permissions
   - Start registering and authenticating voters!

## 📡 API Endpoints

### Authentication
- `POST /api/register` - Register new voter with face data
- `POST /api/authenticate` - Authenticate voter by face
- `GET /api/health` - API health check

### Dashboard
- `GET /api/dashboard/stats` - System statistics
- `GET /api/dashboard/logs` - Authentication logs

### Face Recognition Service
- `POST /extract-features` - Extract face embeddings
- `POST /compare-faces` - Compare two face encodings
- `POST /batch-compare` - Compare against multiple faces

## 🛡️ Security Features

- **Encrypted Face Data** - All biometric data encrypted before storage
- **Rate Limiting** - API endpoint protection against abuse
- **Input Validation** - Comprehensive request validation
- **CORS Protection** - Controlled cross-origin access
- **Firebase Security Rules** - Database access control
- **Environment Variables** - Secure configuration management

## 📊 Performance

- **Face Detection**: ~2-3 seconds (first request)
- **Face Matching**: ~0.5 seconds
- **Database Operations**: ~0.1 seconds
- **Accuracy Rate**: 95%+ with proper lighting
- **Concurrent Users**: Scales with Firebase

## 🧪 Testing

```bash
# Test API health
curl http://localhost:3000/api/health

# Test face service
curl http://localhost:5000/health

# Run backend tests
cd backend && npm test

# Run face service tests
cd face-recognition-service && python -m pytest
```

## 📁 Project Structure

```
├── backend/                    # Express.js API server
│   ├── server.js              # Main server file
│   ├── package.json           # Node.js dependencies
│   └── .env.example           # Environment template
├── face-recognition-service/   # Python Flask service
│   ├── app.py                 # Face recognition API
│   ├── requirements.txt       # Python dependencies
│   └── .env.example           # Environment template
├── app.js                     # Frontend JavaScript
├── index.html                 # Main UI interface
├── style.css                  # Styling
├── SETUP_INSTRUCTIONS.md      # Detailed setup guide
└── start.sh                   # Quick start script
```

## 🚀 Deployment

### Development
```bash
./start.sh  # Quick start script
```

### Production
- Use HTTPS for all endpoints
- Deploy on cloud platforms (AWS, GCP, Azure)
- Use managed databases (Firebase, MongoDB Atlas)
- Implement container orchestration (Docker, Kubernetes)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **DeepFace** - Face recognition library
- **Firebase** - Backend infrastructure
- **TensorFlow** - Machine learning framework
- **OpenCV** - Computer vision library

## 📞 Support

- 📧 Email: support@yourproject.com
- 🐛 Issues: [GitHub Issues](https://github.com/Diksha1245/vot-web/issues)
- 📖 Documentation: [Setup Guide](SETUP_INSTRUCTIONS.md)

---

**⚡ Built with cutting-edge AI technology for secure and accurate voter authentication**
