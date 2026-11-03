import os
import logging
# pyrefly: ignore [missing-import]
import numpy as np
import tensorflow as tf  # type: ignore
# pyrefly: ignore [missing-import]
from PIL import Image, UnidentifiedImageError
# pyrefly: ignore [missing-import]
from flask import Flask, request, jsonify
from flask_cors import CORS  # type: ignore

app = Flask(__name__)

# Only the Node API should be calling this service. Set AI_ALLOWED_ORIGINS if a browser
# ever needs direct access; the default allows none.
CORS(app, origins=[o for o in os.environ.get('AI_ALLOWED_ORIGINS', '').split(',') if o])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'best_dental_model.keras')

# This service is stateless: it reads the image from the request, runs inference and
# returns scores. It deliberately writes nothing to disk. The Node API owns image
# storage, because the two services do not share a filesystem once deployed separately.
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
app.config['MAX_CONTENT_LENGTH'] = MAX_UPLOAD_BYTES

model = None
if os.path.exists(MODEL_PATH):
    model = tf.keras.models.load_model(MODEL_PATH)
else:
    logger.warning("Model not found at %s", MODEL_PATH)

# Index order must match the class order used when the checkpoint was trained.
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
INPUT_SIZE = (224, 224)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.errorhandler(413)
def payload_too_large(_error):
    return jsonify({"error": "Image is too large. Maximum size is 10 MB."}), 413


@app.route('/api/ai/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok" if model is not None else "degraded",
        "message": "AI Prediction service is running" if model is not None
                   else "Service is up but the model checkpoint is not loaded",
        "model_loaded": model is not None
    }), 200


@app.route('/api/ai/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({"error": "Model is not loaded on the server."}), 503

    if 'image' not in request.files:
        return jsonify({"error": "No image part in the request"}), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Allowed file types are png, jpg, jpeg"}), 400

    try:
        # Decode before trusting the extension: a .jpg that is not an image is rejected here
        # rather than failing deeper in the pipeline.
        try:
            file.stream.seek(0)
            Image.open(file.stream).verify()
            file.stream.seek(0)
        except (UnidentifiedImageError, OSError, ValueError):
            return jsonify({"error": "The uploaded file is not a readable image."}), 400

        img = Image.open(file.stream).convert('RGB').resize(INPUT_SIZE)

        # Same preprocessing as training: MobileNetV2's preprocess_input, applied here
        # because the saved checkpoint does not include it in the graph.
        img_array = np.array(img, dtype=np.float32)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)

        predictions = model.predict(img_array, verbose=0)[0]
        predicted_index = int(np.argmax(predictions))
        confidence = float(predictions[predicted_index]) * 100
        condition = CLASS_NAMES[predicted_index]

        result = {
            "condition": condition,
            "confidence": round(confidence, 2),
            "recommendation": RECOMMENDATIONS.get(
                condition, "A professional dental consultation is recommended."
            ),
            # All six class scores, so the UI can show the full distribution rather than
            # only the winning label.
            "classProbabilities": {
                name: round(float(score) * 100, 2)
                for name, score in zip(CLASS_NAMES, predictions)
            },
        }
        return jsonify(result), 200

    except Exception:
        # Log the detail server-side; never return tracebacks or internal paths to a client.
        logger.exception("Prediction failed")
        return jsonify({"error": "Image analysis failed. Please try another image."}), 500


if __name__ == '__main__':
    # Never enable the Werkzeug debugger on a reachable port: its console executes
    # arbitrary code. Set FLASK_DEBUG=true locally if you need the reloader.
    debug_mode = os.environ.get('FLASK_DEBUG', '').lower() == 'true'
    port = int(os.environ.get('AI_SERVICE_PORT', '5002'))
    app.run(debug=debug_mode, host='127.0.0.1', port=port)
