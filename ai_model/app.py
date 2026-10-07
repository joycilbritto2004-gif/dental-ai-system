import os
import uuid
# pyrefly: ignore [missing-import]
import numpy as np
import tensorflow as tf  # type: ignore
# pyrefly: ignore [missing-import]
from PIL import Image
# pyrefly: ignore [missing-import]
from flask import Flask, request, jsonify
from flask_cors import CORS  # type: ignore
# pyrefly: ignore [missing-import]
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'best_dental_model.keras')

# Save uploads to the backend folder so Node server can serve them via /uploads URL
UPLOAD_FOLDER = os.path.abspath(os.path.join(BASE_DIR, '..', 'backend', 'uploads'))
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

model = None
if os.path.exists(MODEL_PATH):
    model = tf.keras.models.load_model(MODEL_PATH)
else:
    print(f"Warning: Model not found at {MODEL_PATH}")

CLASS_NAMES = ['Calculus', 'Caries', 'Gingivitis', 'Hypodontia', 'Mouth_Ulcer', 'Tooth_Discoloration']

RECOMMENDATIONS = {
    'Calculus': 'Professional dental cleaning and scaling is recommended.',
    'Caries': 'A dental filling or restoration is recommended. Please consult a dentist.',
    'Gingivitis': 'Improved oral hygiene (brushing and flossing) and professional cleaning are recommended.',
    'Hypodontia': 'Consult an orthodontist or prosthodontist for comprehensive evaluation and treatment options.',
    'Mouth_Ulcer': 'If the ulcer persists for more than two weeks, consult a dentist. Use topical treatments for relief.',
    'Tooth_Discoloration': 'Professional teeth whitening or cosmetic veneers may be considered. Consult a dentist.'
}

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/ai/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok",
        "message": "AI Prediction service is running"
    }), 200

@app.route('/api/ai/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({"error": "Model is not loaded on the server."}), 500

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
            img = Image.open(file_path).convert('RGB')
            img = img.resize((224, 224))
            
            img_array = np.array(img)
            img_array = np.expand_dims(img_array, axis=0)
            img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
            
            predictions = model.predict(img_array)
            predicted_index = np.argmax(predictions[0])
            confidence = float(predictions[0][predicted_index]) * 100
            condition = CLASS_NAMES[predicted_index]
            
            result = {
                "condition": condition,
                "confidence": round(confidence, 2),
                "recommendation": RECOMMENDATIONS.get(condition, "A professional dental consultation is recommended."),
                "imagePath": f"/uploads/{unique_filename}"
            }
            return jsonify(result), 200
        except Exception as e:
            import traceback
            return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500
    else:
        return jsonify({"error": "Allowed file types are png, jpg, jpeg"}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5002)
