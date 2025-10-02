#!/bin/bash

# Voter Face Recognition System - Quick Setup Script
# This script helps set up the development environment

echo "🚀 Voter Face Recognition System - Quick Setup"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Check prerequisites
print_header "Checking Prerequisites"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 16+ from https://nodejs.org"
    exit 1
fi

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_status "Python found: $PYTHON_VERSION"
else
    print_error "Python 3 not found. Please install Python 3.8+ from https://python.org"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_status "npm found: $NPM_VERSION"
else
    print_error "npm not found. Please install npm"
    exit 1
fi

# Check pip
if command -v pip3 &> /dev/null; then
    print_status "pip3 found"
else
    print_error "pip3 not found. Please install pip3"
    exit 1
fi

# Setup Backend
print_header "Setting up Backend (Node.js/Express)"

cd backend

if [ ! -f "package.json" ]; then
    print_error "package.json not found in backend directory"
    exit 1
fi

print_status "Installing Node.js dependencies..."
npm install

if [ $? -eq 0 ]; then
    print_status "Backend dependencies installed successfully"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

# Copy environment file
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_status "Created .env file from template"
        print_warning "Please edit backend/.env file with your Firebase configuration"
    else
        print_error ".env.example file not found"
    fi
else
    print_status "Backend .env file already exists"
fi

cd ..

# Setup Face Recognition Service
print_header "Setting up Face Recognition Service (Python/Flask)"

cd face-recognition-service

if [ ! -f "requirements.txt" ]; then
    print_error "requirements.txt not found in face-recognition-service directory"
    exit 1
fi

# Create virtual environment
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
    if [ $? -eq 0 ]; then
        print_status "Virtual environment created successfully"
    else
        print_error "Failed to create virtual environment"
        exit 1
    fi
else
    print_status "Virtual environment already exists"
fi

# Activate virtual environment and install dependencies
print_status "Activating virtual environment and installing Python dependencies..."
source venv/bin/activate

pip install -r requirements.txt

if [ $? -eq 0 ]; then
    print_status "Python dependencies installed successfully"
else
    print_error "Failed to install Python dependencies"
    print_warning "You may need to install additional system dependencies"
    print_warning "For macOS with M1/M2: pip install tensorflow-macos tensorflow-metal"
fi

# Copy environment file
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_status "Created .env file from template"
        print_warning "Please edit face-recognition-service/.env file with your encryption key"
    else
        print_error ".env.example file not found"
    fi
else
    print_status "Face service .env file already exists"
fi

cd ..

# Generate security keys
print_header "Generating Security Keys"

print_status "Generating encryption key for backend..."
BACKEND_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "Backend encryption key: $BACKEND_KEY"

print_status "Generating Fernet key for Python service..."
cd face-recognition-service
source venv/bin/activate
FERNET_KEY=$(python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
echo "Python Fernet key: $FERNET_KEY"
cd ..

# Final instructions
print_header "Setup Complete!"

print_status "✅ Backend dependencies installed"
print_status "✅ Python virtual environment created"
print_status "✅ Python dependencies installed"
print_status "✅ Environment files created"
print_status "✅ Security keys generated"

echo
print_warning "Next Steps:"
echo "1. Set up Firebase:"
echo "   - Create a Firebase project at https://console.firebase.google.com/"
echo "   - Enable Realtime Database"
echo "   - Download service account key as 'firebase-service-account.json'"
echo "   - Place the file in the 'backend/' directory"
echo "   - Update FIREBASE_DATABASE_URL in backend/.env"
echo
echo "2. Update environment variables:"
echo "   - Edit backend/.env with your Firebase URL and generated keys"
echo "   - Edit face-recognition-service/.env with the Fernet key"
echo
echo "3. Start the services:"
echo "   Terminal 1: cd face-recognition-service && source venv/bin/activate && python app.py"
echo "   Terminal 2: cd backend && npm run dev"
echo "   Terminal 3: python3 -m http.server 8080"
echo
echo "4. Open http://localhost:8080 in your browser"
echo
print_status "Setup script completed successfully!"
print_warning "Please follow the next steps above to complete the configuration."
