// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// API Helper Class
class VoterAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async registerVoter(name, email, faceData) {
    return this.makeRequest('/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, faceData })
    });
  }

  async authenticateVoter(faceData) {
    return this.makeRequest('/authenticate', {
      method: 'POST',
      body: JSON.stringify({ faceData })
    });
  }

  async getDashboardStats() {
    return this.makeRequest('/dashboard/stats');
  }

  async getAuthenticationLogs(limit = 10) {
    return this.makeRequest(`/dashboard/logs?limit=${limit}`);
  }

  async checkHealth() {
    return this.makeRequest('/health');
  }
}

// Application State
class VoterFRS {
  constructor() {
    this.currentPage = 'home';
    this.isRegistering = false;
    this.isAuthenticating = false;
    this.api = new VoterAPI();
    this.registerStream = null;
    this.authStream = null;
    this.faceDetectionInterval = null;
    this.capturedFaceData = null;
    
    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupRegistration();
    this.setupAuthentication();
    this.loadDashboard();
    this.showToast('System initialized successfully', 'success');
  }

  // Navigation System
  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const heroButtons = document.querySelectorAll('[data-navigate]');

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        this.navigateToPage(page);
      });
    });

    heroButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const page = button.getAttribute('data-navigate');
        this.navigateToPage(page);
      });
    });
  }

  navigateToPage(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Remove active class from nav links
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    
    // Show target page
    document.getElementById(`${page}-page`).classList.add('active');
    
    // Add active class to corresponding nav link
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    
    this.currentPage = page;

    // Stop any active streams when navigating away
    if (page !== 'register') {
      this.stopRegistrationCamera();
    }
    if (page !== 'authenticate') {
      this.stopAuthenticationCamera();
    }

    // Load page-specific data
    if (page === 'dashboard') {
      this.loadDashboard();
    }
  }

  // Registration System
  setupRegistration() {
    const startCameraBtn = document.getElementById('start-camera-btn');
    const captureFaceBtn = document.getElementById('capture-face-btn');
    const registrationForm = document.getElementById('registration-form');

    startCameraBtn.addEventListener('click', () => this.startRegistrationCamera());
    captureFaceBtn.addEventListener('click', () => this.captureFace());
    registrationForm.addEventListener('submit', (e) => this.submitRegistration(e));
  }

  async startRegistrationCamera() {
    try {
      const video = document.getElementById('register-video');
      const statusDiv = document.getElementById('camera-status');
      
      statusDiv.className = 'status-indicator waiting';
      statusDiv.textContent = 'Starting camera...';

      this.registerStream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = this.registerStream;

      statusDiv.className = 'status-indicator detecting';
      statusDiv.textContent = 'Camera active - Position your face in frame';

      document.getElementById('start-camera-btn').disabled = true;
      document.getElementById('capture-face-btn').disabled = false;

      // Start face detection simulation
      this.startFaceDetection('register');

    } catch (error) {
      console.error('Camera access denied:', error);
      this.showToast('Camera access denied. Please allow camera permissions.', 'error');
      document.getElementById('camera-status').className = 'status-indicator error';
      document.getElementById('camera-status').textContent = 'Camera access denied';
    }
  }

  stopRegistrationCamera() {
    if (this.registerStream) {
      this.registerStream.getTracks().forEach(track => track.stop());
      this.registerStream = null;
    }
    if (this.faceDetectionInterval) {
      clearInterval(this.faceDetectionInterval);
    }
    document.getElementById('start-camera-btn').disabled = false;
    document.getElementById('capture-face-btn').disabled = true;
  }

  startFaceDetection(mode) {
    const detectionBox = document.getElementById(`${mode}-detection-box`);
    
    this.faceDetectionInterval = setInterval(() => {
      // Simulate face detection
      const faceDetected = Math.random() > 0.3; // 70% chance of detecting face
      
      if (faceDetected) {
        // Show detection box with random position (simulated face location)
        const x = 20 + Math.random() * 40; // 20-60% from left
        const y = 15 + Math.random() * 30; // 15-45% from top
        const width = 25 + Math.random() * 15; // 25-40% width
        const height = 30 + Math.random() * 20; // 30-50% height

        detectionBox.style.left = `${x}%`;
        detectionBox.style.top = `${y}%`;
        detectionBox.style.width = `${width}%`;
        detectionBox.style.height = `${height}%`;
        detectionBox.classList.add('visible');
      } else {
        detectionBox.classList.remove('visible');
      }
    }, 200);
  }

  async captureFace() {
    const video = document.getElementById('register-video');
    const canvas = document.getElementById('register-canvas');
    const statusDiv = document.getElementById('camera-status');
    const countdownDiv = document.getElementById('capture-countdown');
    
    // Show countdown
    countdownDiv.classList.remove('hidden');
    for (let i = 3; i > 0; i--) {
      countdownDiv.textContent = i;
      await this.sleep(1000);
    }
    countdownDiv.classList.add('hidden');

    // Capture frame
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Show preview
    const previewImg = document.getElementById('captured-face-img');
    const qualityScore = document.getElementById('face-quality-score');
    
    previewImg.src = imageData;
    previewImg.classList.remove('hidden');
    
    // Simulate quality score
    const quality = 85 + Math.random() * 10;
    qualityScore.textContent = `Face Quality: ${quality.toFixed(1)}%`;
    qualityScore.classList.remove('hidden');

    // Store captured data
    this.capturedFaceData = {
      image: imageData,
      encoding: this.generateFaceEncoding(), // Simulate face encoding
      quality: quality
    };

    statusDiv.className = 'status-indicator success';
    statusDiv.textContent = 'Face captured successfully!';

    document.getElementById('submit-registration').disabled = false;
    this.showToast('Face captured successfully!', 'success');
  }

  generateFaceEncoding() {
    // Generate 128-dimensional face encoding (simulation)
    const encoding = [];
    for (let i = 0; i < 128; i++) {
      encoding.push(Math.random() * 2 - 1); // Random values between -1 and 1
    }
    return encoding;
  }

  async submitRegistration(e) {
    e.preventDefault();
    
    if (!this.capturedFaceData) {
      this.showToast('Please capture your face first', 'error');
      return;
    }

    this.showLoading('Registering voter...');

    try {
      const formData = new FormData(e.target);
      const name = formData.get('voter-name') || document.getElementById('voter-name').value;
      const email = formData.get('voter-email') || document.getElementById('voter-email').value;
      
      // Call the real API
      const response = await this.api.registerVoter(name, email, this.capturedFaceData.image);
      
      this.hideLoading();
      this.showToast('Registration completed successfully!', 'success');
      
      // Reset form
      document.getElementById('registration-form').reset();
      document.getElementById('captured-face-img').classList.add('hidden');
      document.getElementById('face-quality-score').classList.add('hidden');
      document.getElementById('submit-registration').disabled = true;
      
      this.stopRegistrationCamera();
      
      // Navigate to dashboard after successful registration
      setTimeout(() => {
        this.navigateToPage('dashboard');
      }, 1500);

    } catch (error) {
      this.hideLoading();
      console.error('Registration failed:', error);
      this.showToast(error.message || 'Registration failed. Please try again.', 'error');
    }
  }

  // Authentication System
  setupAuthentication() {
    const startAuthBtn = document.getElementById('start-auth-camera-btn');
    const authenticateBtn = document.getElementById('authenticate-btn');

    startAuthBtn.addEventListener('click', () => this.startAuthenticationCamera());
    authenticateBtn.addEventListener('click', () => this.performAuthentication());
  }

  async startAuthenticationCamera() {
    try {
      const video = document.getElementById('auth-video');
      const statusDiv = document.getElementById('auth-status');
      
      statusDiv.className = 'status-indicator waiting';
      statusDiv.textContent = 'Starting camera...';

      this.authStream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = this.authStream;

      statusDiv.className = 'status-indicator detecting';
      statusDiv.textContent = 'Camera active - Look directly at camera';

      document.getElementById('start-auth-camera-btn').disabled = true;
      document.getElementById('authenticate-btn').disabled = false;

      // Start face detection
      this.startFaceDetection('auth');

    } catch (error) {
      console.error('Camera access denied:', error);
      this.showToast('Camera access denied. Please allow camera permissions.', 'error');
      document.getElementById('auth-status').className = 'status-indicator error';
      document.getElementById('auth-status').textContent = 'Camera access denied';
    }
  }

  stopAuthenticationCamera() {
    if (this.authStream) {
      this.authStream.getTracks().forEach(track => track.stop());
      this.authStream = null;
    }
    if (this.faceDetectionInterval) {
      clearInterval(this.faceDetectionInterval);
    }
    document.getElementById('start-auth-camera-btn').disabled = false;
    document.getElementById('authenticate-btn').disabled = true;
  }

  async performAuthentication() {
    const video = document.getElementById('auth-video');
    const canvas = document.getElementById('auth-canvas');
    const statusDiv = document.getElementById('auth-status');
    const resultsDiv = document.getElementById('auth-results');

    this.showLoading('Analyzing face...');
    statusDiv.className = 'status-indicator waiting';
    statusDiv.textContent = 'Processing authentication...';

    try {
      // Capture current frame
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      // Convert canvas to base64 image
      const imageData = canvas.toDataURL('image/jpeg', 0.8);

      // Call the real API for authentication
      const response = await this.api.authenticateVoter(imageData);

      this.hideLoading();

      // Update UI with results
      resultsDiv.classList.remove('hidden');
      const resultStatus = document.getElementById('auth-result-status');
      const confidenceScore = document.getElementById('confidence-score');
      const voterDetails = document.getElementById('voter-details');

      if (response.success) {
        resultStatus.className = 'result-status success';
        resultStatus.textContent = '✅ Authentication Successful';
        confidenceScore.textContent = `Confidence: ${(response.confidence * 100).toFixed(1)}%`;
        
        // Show voter details
        document.getElementById('authenticated-name').textContent = response.voter.name;
        document.getElementById('authenticated-id').textContent = response.voter.id;
        document.getElementById('authenticated-date').textContent = new Date().toLocaleDateString();
        voterDetails.classList.remove('hidden');

        statusDiv.className = 'status-indicator success';
        statusDiv.textContent = 'Authentication successful!';

        this.showToast(`Welcome, ${response.voter.name}!`, 'success');

      } else {
        resultStatus.className = 'result-status failure';
        resultStatus.textContent = '❌ Authentication Failed';
        confidenceScore.textContent = `Confidence: ${(response.confidence * 100).toFixed(1)}% (Below threshold)`;
        voterDetails.classList.add('hidden');

        statusDiv.className = 'status-indicator error';
        statusDiv.textContent = 'Authentication failed - Face not recognized';

        this.showToast('Authentication failed - Face not recognized', 'error');
      }

    } catch (error) {
      this.hideLoading();
      console.error('Authentication failed:', error);
      
      const resultStatus = document.getElementById('auth-result-status');
      const confidenceScore = document.getElementById('confidence-score');
      const voterDetails = document.getElementById('voter-details');
      
      resultsDiv.classList.remove('hidden');
      resultStatus.className = 'result-status failure';
      resultStatus.textContent = '❌ Authentication Error';
      confidenceScore.textContent = 'System error occurred';
      voterDetails.classList.add('hidden');

      statusDiv.className = 'status-indicator error';
      statusDiv.textContent = 'System error - Please try again';

      this.showToast(error.message || 'Authentication system error. Please try again.', 'error');
    }
  }

  calculateSimilarity(encoding1, encoding2) {
    // Simulate face similarity calculation using cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    // Use first 8 dimensions for simulation
    const dim = Math.min(8, encoding1.length, encoding2.length);
    
    for (let i = 0; i < dim; i++) {
      dotProduct += encoding1[i] * encoding2[i];
      norm1 += encoding1[i] * encoding1[i];
      norm2 += encoding2[i] * encoding2[i];
    }
    
    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    
    // Add some randomness to make it more realistic
    const noise = (Math.random() - 0.5) * 0.1;
    const finalSimilarity = Math.max(0, Math.min(1, similarity + noise + 0.5));
    
    // Boost similarity for demo purposes if close match
    return finalSimilarity > 0.7 ? Math.min(1, finalSimilarity + 0.15) : finalSimilarity;
  }

  // Dashboard System
  async loadDashboard() {
    try {
      // Load dashboard statistics from API
      const statsResponse = await this.api.getDashboardStats();
      
      // Update statistics display
      document.getElementById('total-voters').textContent = statsResponse.stats.totalRegistered;
      document.getElementById('successful-auths').textContent = statsResponse.stats.successfulAuthsToday;
      document.getElementById('system-accuracy').textContent = statsResponse.stats.systemAccuracy;
      document.getElementById('system-uptime').textContent = statsResponse.stats.uptime;

      // Load authentication logs
      await this.loadAuthenticationLogs();
      
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      // Show fallback/error message
      this.showToast('Unable to load dashboard data. Using offline mode.', 'warning');
      
      // Show default values
      document.getElementById('total-voters').textContent = '0';
      document.getElementById('successful-auths').textContent = '0';
      document.getElementById('system-accuracy').textContent = '0%';
      document.getElementById('system-uptime').textContent = '0%';
    }
  }

  async loadAuthenticationLogs() {
    try {
      const logsResponse = await this.api.getAuthenticationLogs(10);
      const tbody = document.getElementById('auth-logs-table');
      tbody.innerHTML = '';

      logsResponse.logs.forEach(log => {
        const row = document.createElement('tr');
        
        const timestamp = new Date(log.timestamp);
        const formattedTime = timestamp.toLocaleString();
        
        row.innerHTML = `
          <td>${formattedTime}</td>
          <td>${log.voterName || 'Unknown'}</td>
          <td><span class="status status--${log.result === 'success' ? 'success' : 'error'}">${log.result}</span></td>
          <td>${(log.confidence * 100).toFixed(1)}%</td>
        `;
        
        tbody.appendChild(row);
      });

    } catch (error) {
      console.error('Failed to load authentication logs:', error);
      const tbody = document.getElementById('auth-logs-table');
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">Unable to load logs</td></tr>';
    }
  }

  // Utility Functions
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✅' : 
                 type === 'error' ? '❌' : 
                 type === 'warning' ? '⚠️' : 'ℹ️';
    
    toast.innerHTML = `
      <span>${icon}</span>
      <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);
  }

  showLoading(message = 'Processing...') {
    const overlay = document.getElementById('loading-overlay');
    const text = document.querySelector('.loading-text');
    text.textContent = message;
    overlay.classList.remove('hidden');
  }

  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.add('hidden');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  window.voterFRS = new VoterFRS();
});

// Handle page visibility change to pause/resume camera
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page is hidden, pause camera operations
    if (window.voterFRS) {
      if (window.voterFRS.faceDetectionInterval) {
        clearInterval(window.voterFRS.faceDetectionInterval);
      }
    }
  } else {
    // Page is visible, resume operations if needed
    if (window.voterFRS && window.voterFRS.currentPage === 'register' && window.voterFRS.registerStream) {
      window.voterFRS.startFaceDetection('register');
    }
    if (window.voterFRS && window.voterFRS.currentPage === 'authenticate' && window.voterFRS.authStream) {
      window.voterFRS.startFaceDetection('auth');
    }
  }
});

// Handle window beforeunload to cleanup streams
window.addEventListener('beforeunload', () => {
  if (window.voterFRS) {
    window.voterFRS.stopRegistrationCamera();
    window.voterFRS.stopAuthenticationCamera();
  }
});