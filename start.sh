#!/bin/bash

echo "🚀 Starting Voter Face Recognition System..."
echo ""

# Check if Firebase service account exists
if [ ! -f "backend/firebase-service-account.json" ]; then
    echo "⚠️  Warning: Firebase service account file not found!"
    echo "   Please add your firebase-service-account.json to the backend/ folder"
    echo "   and update the FIREBASE_DATABASE_URL in backend/.env"
    echo ""
fi

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ Port $1 is already in use"
        return 1
    else
        echo "✅ Port $1 is available"
        return 0
    fi
}

# Check if required ports are available
echo "🔍 Checking required ports..."
check_port 3000  # Backend API
check_port 5000  # Face Recognition Service
check_port 8080  # Frontend

echo ""
echo "📝 To start the system manually, run these commands in separate terminals:"
echo ""
echo "Terminal 1 - Face Recognition Service:"
echo "cd face-recognition-service"
echo "/usr/local/bin/python3 app.py"
echo ""
echo "Terminal 2 - Backend API:"
echo "cd backend"
echo "npm run dev"
echo ""
echo "Terminal 3 - Frontend Server:"
echo "cd .."
echo "python3 -m http.server 8080"
echo ""
echo "Then open: http://localhost:8080"
echo ""
echo "🔧 Next Steps:"
echo "1. Set up Firebase project and add service account"
echo "2. Update environment variables in .env files"
echo "3. Start the services as shown above"
echo ""
echo "📖 For detailed setup instructions, see SETUP_INSTRUCTIONS.md"
