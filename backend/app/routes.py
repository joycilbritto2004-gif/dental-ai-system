from flask import Blueprint, request, jsonify
import os
import uuid
from werkzeug.utils import secure_filename
from .ai_inference import predict_image

UPLOAD_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'uploads'))
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@ai_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok",
        "message": "AI Prediction service is running"
    }), 200

@ai_bp.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({"error": "No image part in the request"}), 400
        
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if file and allowed_file(file.filename):
        try:
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
            file.save(file_path)
            
            # Predict using the saved file path
            result = predict_image(file_path)
            result['imagePath'] = f"/uploads/{unique_filename}"
            
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"error": "Allowed file types are png, jpg, jpeg"}), 400
