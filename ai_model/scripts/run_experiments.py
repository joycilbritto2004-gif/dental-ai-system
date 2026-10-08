import os
import json
import numpy as np
import tensorflow as tf
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import classification_report, confusion_matrix
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import GlobalAveragePooling2D, Dropout, Dense, Input
from tensorflow.keras.models import Model
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATA_DIR = os.path.join(BASE_DIR, 'split_dataset')
TRAIN_DIR = os.path.join(DATA_DIR, 'train')
VAL_DIR = os.path.join(DATA_DIR, 'val')
TEST_DIR = os.path.join(DATA_DIR, 'test')
SAVED_MODELS_DIR = os.path.join(BASE_DIR, 'saved_models')

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
NUM_CLASSES = 6

def get_generators(use_augmentation=False):
    preprocess_input = tf.keras.applications.mobilenet_v2.preprocess_input
    
    if use_augmentation:
        train_datagen = tf.keras.preprocessing.image.ImageDataGenerator(
            preprocessing_function=preprocess_input,
            rotation_range=15,
            width_shift_range=0.1,
            height_shift_range=0.1,
            zoom_range=0.1,
            horizontal_flip=True,
            fill_mode='nearest'
        )
    else:
        train_datagen = tf.keras.preprocessing.image.ImageDataGenerator(
            preprocessing_function=preprocess_input
        )
        
    val_test_datagen = tf.keras.preprocessing.image.ImageDataGenerator(
        preprocessing_function=preprocess_input
    )
    
    train_gen = train_datagen.flow_from_directory(
        TRAIN_DIR, target_size=IMG_SIZE, batch_size=BATCH_SIZE, class_mode='categorical', shuffle=True
    )
    val_gen = val_test_datagen.flow_from_directory(
        VAL_DIR, target_size=IMG_SIZE, batch_size=BATCH_SIZE, class_mode='categorical', shuffle=False
    )
    test_gen = val_test_datagen.flow_from_directory(
        TEST_DIR, target_size=IMG_SIZE, batch_size=BATCH_SIZE, class_mode='categorical', shuffle=False
    )
    return train_gen, val_gen, test_gen

def build_model(learning_rate=1e-3, freeze_base=True):
    base_model = MobileNetV2(input_shape=IMG_SIZE + (3,), include_top=False, weights='imagenet')
    
    if freeze_base:
        base_model.trainable = False
    else:
        base_model.trainable = True
        # Fine-tune from this layer onwards (e.g. unfreeze top 30 layers)
        fine_tune_at = len(base_model.layers) - 30
        for layer in base_model.layers[:fine_tune_at]:
            layer.trainable = False
        # Freeze BatchNormalization layers to prevent moving averages from updating
        for layer in base_model.layers:
            if isinstance(layer, tf.keras.layers.BatchNormalization):
                layer.trainable = False

    inputs = Input(shape=IMG_SIZE + (3,))
    x = base_model(inputs, training=not freeze_base)
    x = GlobalAveragePooling2D()(x)
    x = Dropout(0.3)(x)
    outputs = Dense(NUM_CLASSES, activation='softmax')(x)
    
    model = Model(inputs, outputs)
    model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
                  loss='categorical_crossentropy',
                  metrics=['accuracy'])
    return model

def calculate_class_weights(train_gen):
    classes = train_gen.classes
    class_weights = compute_class_weight('balanced', classes=np.unique(classes), y=classes)
    return dict(enumerate(class_weights))

def run_experiment(name, model, train_gen, val_gen, epochs, class_weights=None):
    print(f"\n--- Running {name} ---")
    checkpoint_path = os.path.join(SAVED_MODELS_DIR, f"{name}.keras")
    
    callbacks = [
        EarlyStopping(monitor='val_loss', patience=6, restore_best_weights=True),
        ModelCheckpoint(checkpoint_path, monitor='val_accuracy', save_best_only=True),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, min_lr=1e-6)
    ]
    
    history = model.fit(
        train_gen,
        epochs=epochs,
        validation_data=val_gen,
        class_weight=class_weights,
        callbacks=callbacks,
        verbose=1
    )
    
    val_acc = max(history.history['val_accuracy'])
    return val_acc, checkpoint_path

def main():
    if not os.path.exists(SAVED_MODELS_DIR):
        os.makedirs(SAVED_MODELS_DIR)
        
    results = []
    
    # Experiment 1: Baseline (using already known accuracy)
    results.append({'Experiment': '1 - Baseline', 'Val_Accuracy': 0.8100, 'Test_Accuracy': 0.8431})
    
    # Get generators
    train_gen_aug, val_gen, test_gen = get_generators(use_augmentation=True)
    class_weights = calculate_class_weights(train_gen_aug)
    
    # Experiment 2: Augmentation + Stage 1 (Head)
    model_2 = build_model(learning_rate=1e-3, freeze_base=True)
    val_acc_2, path_2 = run_experiment("exp2_aug", model_2, train_gen_aug, val_gen, epochs=20, class_weights=None)
    results.append({'Experiment': '2 - Augmentation', 'Val_Accuracy': val_acc_2, 'Path': path_2})
    
    # Experiment 3: Augmentation + Class Weights + Stage 1 (Head)
    model_3 = build_model(learning_rate=1e-3, freeze_base=True)
    val_acc_3, path_3 = run_experiment("exp3_aug_weights", model_3, train_gen_aug, val_gen, epochs=20, class_weights=class_weights)
    results.append({'Experiment': '3 - Augmentation + Weights', 'Val_Accuracy': val_acc_3, 'Path': path_3})
    
    # Experiment 4: Fine-tuning top 30 layers on the best model from Exp 3
    print("\n--- Running Experiment 4 - Fine-Tuning ---")
    model_4 = tf.keras.models.load_model(path_3)
    
    # Unfreeze top 30 layers
    base_model = model_4.layers[1] # MobileNetV2 is layer 1
    base_model.trainable = True
    fine_tune_at = len(base_model.layers) - 30
    for layer in base_model.layers[:fine_tune_at]:
        layer.trainable = False
    for layer in base_model.layers:
        if isinstance(layer, tf.keras.layers.BatchNormalization):
            layer.trainable = False
            
    # Recompile with smaller LR
    model_4.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
                  loss='categorical_crossentropy',
                  metrics=['accuracy'])
                  
    val_acc_4, path_4 = run_experiment("exp4_finetune", model_4, train_gen_aug, val_gen, epochs=15, class_weights=class_weights)
    results.append({'Experiment': '4 - Fine-Tuning + Weights', 'Val_Accuracy': val_acc_4, 'Path': path_4})
    
    # Select Best Model based on Validation Accuracy
    best_exp = max(results[1:], key=lambda x: x['Val_Accuracy'])
    print(f"\nBest Model selected from validation: {best_exp['Experiment']} with Val Acc: {best_exp['Val_Accuracy']:.4f}")
    
    best_model_path = best_exp['Path']
    best_model = tf.keras.models.load_model(best_model_path)
    
    print("\n--- FINAL TEST EVALUATION ---")
    test_gen.reset()
    loss, test_accuracy = best_model.evaluate(test_gen, verbose=1)
    print(f"Final Test Accuracy: {test_accuracy*100:.2f}%")
    
    test_gen.reset()
    predictions = best_model.predict(test_gen, verbose=1)
    y_pred = np.argmax(predictions, axis=1)
    y_true = test_gen.classes
    
    target_names = list(test_gen.class_indices.keys())
    report = classification_report(y_true, y_pred, target_names=target_names)
    print("\nClassification Report:")
    print(report)
    
    cm = confusion_matrix(y_true, y_pred)
    print("\nConfusion Matrix:")
    print(cm)
    
    # Save the best model
    best_dental_model_path = os.path.join(BASE_DIR, 'best_dental_model.keras')
    best_model.save(best_dental_model_path)
    print(f"\nSaved Best Model to {best_dental_model_path}")
    
    with open(os.path.join(BASE_DIR, 'final_evaluation_results.json'), 'w') as f:
        json.dump({
            "test_accuracy": float(test_accuracy),
            "best_experiment": best_exp['Experiment'],
            "val_accuracy": float(best_exp['Val_Accuracy'])
        }, f, indent=4)
        
    print("\nSummary of Experiments:")
    for r in results:
        print(r)

if __name__ == '__main__':
    main()
