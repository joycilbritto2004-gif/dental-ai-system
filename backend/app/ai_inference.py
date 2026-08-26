import os
import numpy as np
import tensorflow as tf
from PIL import Image

# Get absolute path to the saved model
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MODEL_PATH = os.path.join(BASE_DIR, 'ai_model', 'saved_models', 'dental_ai_model.keras')

# Load the model globally (happens once when the module is imported)
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

def predict_image(image_file):
    if model is None:
        raise ValueError("Model is not loaded on the server.")

    # 1. Load and resize image to 224x224
    img = Image.open(image_file).convert('RGB')
    img = img.resize((224, 224))
    
    # 2. Convert to numpy array and expand dimensions for batch size
    img_array = np.array(img)
    img_array = np.expand_dims(img_array, axis=0)
    
    # 3. Apply MobileNetV2 preprocessing (scales pixels to [-1, 1])
    # img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
    
    # 4. Predict
    predictions = model.predict(img_array)
    
    # 5. Extract results
    predicted_index = np.argmax(predictions[0])
    confidence = float(predictions[0][predicted_index]) * 100
    condition = CLASS_NAMES[predicted_index]
    
    return {
        "condition": condition,
        "confidence": round(confidence, 2),
        "recommendation": RECOMMENDATIONS.get(condition, "A professional dental consultation is recommended.")
    }
