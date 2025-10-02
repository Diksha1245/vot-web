import os
import base64
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
import cv2
from PIL import Image
import io
import tempfile
import logging
from cryptography.fernet import Fernet
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000', 'http://localhost:8080'])

class FaceRecognitionService:
    def __init__(self):
        self.model_name = 'Facenet512'  # High accuracy model
        self.distance_metric = 'cosine'
        self.encryption_key = os.getenv('ENCRYPTION_KEY', Fernet.generate_key())
        self.fernet = Fernet(self.encryption_key)
        
    def preprocess_image(self, image_data, image_type='base64'):
        """Preprocess image data for face recognition"""
        try:
            if image_type == 'base64':
                # Remove data URL prefix if present
                if ',' in image_data:
                    image_data = image_data.split(',')[1]
                
                # Decode base64 image
                image_bytes = base64.b64decode(image_data)
            else:
                image_bytes = image_data
            
            # Convert to PIL Image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert to OpenCV format
            opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            return opencv_image
            
        except Exception as e:
            logger.error(f"Image preprocessing error: {str(e)}")
            raise ValueError(f"Invalid image data: {str(e)}")
    
    def extract_face_features(self, image_data, image_type='base64'):
        """Extract face features using DeepFace"""
        try:
            # Preprocess image
            opencv_image = self.preprocess_image(image_data, image_type)
            
            # Save to temporary file for DeepFace processing
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_file:
                cv2.imwrite(temp_file.name, opencv_image)
                temp_path = temp_file.name
            
            try:
                # Extract face embeddings using DeepFace
                embeddings = DeepFace.represent(
                    img_path=temp_path,
                    model_name=self.model_name,
                    enforce_detection=True,
                    detector_backend='opencv'
                )
                
                # DeepFace returns a list of embeddings for each face found
                if not embeddings:
                    raise ValueError("No face detected in image")
                
                # Use the first detected face
                face_encoding = embeddings[0]['embedding']
                
                # Encrypt the face encoding
                encrypted_encoding = self.encrypt_face_data(face_encoding)
                
                return {
                    'success': True,
                    'faceEncoding': encrypted_encoding,
                    'facesDetected': len(embeddings)
                }
                
            finally:
                # Clean up temporary file
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
            
        except Exception as e:
            logger.error(f"Face feature extraction error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def compare_face_encodings(self, encoding1, encoding2):
        """Compare two face encodings"""
        try:
            # Decrypt encodings
            face1 = self.decrypt_face_data(encoding1)
            face2 = self.decrypt_face_data(encoding2)
            
            # Convert to numpy arrays
            face1_np = np.array(face1)
            face2_np = np.array(face2)
            
            # Calculate cosine similarity
            dot_product = np.dot(face1_np, face2_np)
            norm1 = np.linalg.norm(face1_np)
            norm2 = np.linalg.norm(face2_np)
            
            if norm1 == 0 or norm2 == 0:
                similarity = 0
            else:
                similarity = dot_product / (norm1 * norm2)
            
            # Convert similarity to confidence (0-1 range)
            confidence = (similarity + 1) / 2  # Convert from [-1,1] to [0,1]
            
            return {
                'success': True,
                'confidence': float(confidence),
                'similarity': float(similarity)
            }
            
        except Exception as e:
            logger.error(f"Face comparison error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def encrypt_face_data(self, face_encoding):
        """Encrypt face encoding data"""
        try:
            # Convert to JSON string and encode
            encoding_json = json.dumps(face_encoding).encode('utf-8')
            encrypted_data = self.fernet.encrypt(encoding_json)
            # Return as base64 string for storage
            return base64.b64encode(encrypted_data).decode('utf-8')
        except Exception as e:
            logger.error(f"Encryption error: {str(e)}")
            raise
    
    def decrypt_face_data(self, encrypted_encoding):
        """Decrypt face encoding data"""
        try:
            # Decode from base64
            encrypted_data = base64.b64decode(encrypted_encoding.encode('utf-8'))
            decrypted_data = self.fernet.decrypt(encrypted_data)
            # Convert back to list
            return json.loads(decrypted_data.decode('utf-8'))
        except Exception as e:
            logger.error(f"Decryption error: {str(e)}")
            raise

# Initialize face recognition service
face_service = FaceRecognitionService()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'face-recognition-service',
        'model': face_service.model_name,
        'timestamp': str(np.datetime64('now'))
    })

@app.route('/extract-features', methods=['POST'])
def extract_features():
    """Extract face features from image"""
    try:
        data = request.get_json()
        
        if not data or 'imageData' not in data:
            return jsonify({'success': False, 'error': 'No image data provided'}), 400
        
        image_data = data['imageData']
        image_type = data.get('imageType', 'base64')
        
        # Extract face features
        result = face_service.extract_face_features(image_data, image_type)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Extract features endpoint error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@app.route('/compare-faces', methods=['POST'])
def compare_faces():
    """Compare two face encodings"""
    try:
        data = request.get_json()
        
        if not data or 'faceEncoding1' not in data or 'faceEncoding2' not in data:
            return jsonify({
                'success': False, 
                'error': 'Both face encodings required'
            }), 400
        
        encoding1 = data['faceEncoding1']
        encoding2 = data['faceEncoding2']
        
        # Compare encodings
        result = face_service.compare_face_encodings(encoding1, encoding2)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Compare faces endpoint error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@app.route('/batch-compare', methods=['POST'])
def batch_compare():
    """Compare one face encoding against multiple stored encodings"""
    try:
        data = request.get_json()
        
        if not data or 'targetEncoding' not in data or 'storedEncodings' not in data:
            return jsonify({
                'success': False,
                'error': 'Target encoding and stored encodings required'
            }), 400
        
        target_encoding = data['targetEncoding']
        stored_encodings = data['storedEncodings']
        
        results = []
        best_match = None
        best_confidence = 0
        
        for stored_id, stored_encoding in stored_encodings.items():
            comparison = face_service.compare_face_encodings(target_encoding, stored_encoding)
            
            if comparison['success']:
                result = {
                    'id': stored_id,
                    'confidence': comparison['confidence'],
                    'similarity': comparison['similarity']
                }
                results.append(result)
                
                if comparison['confidence'] > best_confidence:
                    best_confidence = comparison['confidence']
                    best_match = result
        
        return jsonify({
            'success': True,
            'results': results,
            'bestMatch': best_match,
            'totalComparisons': len(results)
        }), 200
        
    except Exception as e:
        logger.error(f"Batch compare endpoint error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"🤖 Face Recognition Service starting on port {port}")
    print(f"🔍 Model: {face_service.model_name}")
    print(f"🔐 Encryption: {'Enabled' if face_service.encryption_key else 'Disabled'}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
