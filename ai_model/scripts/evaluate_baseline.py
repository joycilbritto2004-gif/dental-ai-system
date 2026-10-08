import os
import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix, precision_score, recall_score, f1_score
from tensorflow.keras.models import load_model

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATA_DIR = os.path.join(BASE_DIR, 'split_dataset')
TRAIN_DIR = os.path.join(DATA_DIR, 'train')
VAL_DIR = os.path.join(DATA_DIR, 'val')
TEST_DIR = os.path.join(DATA_DIR, 'test')
MODEL_PATH = os.path.join(BASE_DIR, 'best_dental_model.keras')

IMG_SIZE = (224, 224)
BATCH_SIZE = 32

def main():
    print("STEP 1 & 2 - VERIFY DATASET AND GENERATORS")
    
    # Preprocessing function
    preprocess_input = tf.keras.applications.mobilenet_v2.preprocess_input
    
    # We will use ImageDataGenerator for standard preprocessing
    datagen = tf.keras.preprocessing.image.ImageDataGenerator(preprocessing_function=preprocess_input)
    
    train_gen = datagen.flow_from_directory(
        TRAIN_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        shuffle=True
    )
    
    val_gen = datagen.flow_from_directory(
        VAL_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        shuffle=False
    )
    
    test_gen = datagen.flow_from_directory(
        TEST_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        shuffle=False
    )
    
    print("\nClass Mapping:")
    print(train_gen.class_indices)
    
    # Verify a batch
    images, labels = next(test_gen)
    print("\nImage shape:", images.shape)
    print("Label shape:", labels.shape)
    print("Image value range:", np.min(images), "to", np.max(images))
    
    print("\nSTEP 3 - CHECK CURRENT MODEL BASELINE")
    if not os.path.exists(MODEL_PATH):
        print(f"Model not found at {MODEL_PATH}")
        return
        
    model = load_model(MODEL_PATH)
    model.summary()
    
    print("\nEvaluating on test set...")
    # Reset test generator before prediction
    test_gen.reset()
    
    loss, accuracy = model.evaluate(test_gen, verbose=1)
    print(f"\nBASELINE TEST ACCURACY: {accuracy * 100:.2f}%")
    
    test_gen.reset()
    predictions = model.predict(test_gen, verbose=1)
    y_pred = np.argmax(predictions, axis=1)
    y_true = test_gen.classes
    
    print("\nClassification Report:")
    target_names = list(test_gen.class_indices.keys())
    print(classification_report(y_true, y_pred, target_names=target_names))
    
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_true, y_pred))

if __name__ == '__main__':
    main()
