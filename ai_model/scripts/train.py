import os
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import GlobalAveragePooling2D, Dropout, Dense, Input
from tensorflow.keras.models import Model
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

# 1. Define paths and constants
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATASET_DIR = os.path.join(BASE_DIR, 'dataset')
TRAIN_DIR = os.path.join(DATASET_DIR, 'train')
VAL_DIR = os.path.join(DATASET_DIR, 'val')
TEST_DIR = os.path.join(DATASET_DIR, 'test')
MODEL_SAVE_PATH = os.path.join(BASE_DIR, 'saved_models', 'dental_ai_model.keras')

IMG_SIZE = (224, 224)
BATCH_SIZE = 32

def main():
    print("Loading datasets...")
    # 2. Automatically read class names and load datasets
    train_dataset = tf.keras.utils.image_dataset_from_directory(
        TRAIN_DIR,
        shuffle=True,
        batch_size=BATCH_SIZE,
        image_size=IMG_SIZE,
        label_mode='categorical'
    )
    
    val_dataset = tf.keras.utils.image_dataset_from_directory(
        VAL_DIR,
        shuffle=False,
        batch_size=BATCH_SIZE,
        image_size=IMG_SIZE,
        label_mode='categorical'
    )
    
    test_dataset = tf.keras.utils.image_dataset_from_directory(
        TEST_DIR,
        shuffle=False,
        batch_size=BATCH_SIZE,
        image_size=IMG_SIZE,
        label_mode='categorical'
    )

    class_names = train_dataset.class_names
    num_classes = len(class_names)
    print(f"Discovered {num_classes} classes: {class_names}")

    # Optimize datasets for performance
    AUTOTUNE = tf.data.AUTOTUNE
    train_dataset = train_dataset.prefetch(buffer_size=AUTOTUNE)
    val_dataset = val_dataset.prefetch(buffer_size=AUTOTUNE)
    test_dataset = test_dataset.prefetch(buffer_size=AUTOTUNE)

    # 3. Data Augmentation (Only applied during training)
    data_augmentation = tf.keras.Sequential([
        tf.keras.layers.RandomFlip('horizontal'),
        tf.keras.layers.RandomRotation(0.2),
        tf.keras.layers.RandomZoom(0.1),
    ])

    # 4. Build Model with MobileNetV2
    print("Building model...")
    # MobileNetV2 expects pixel values in [-1, 1], so we use preprocess_input
    preprocess_input = tf.keras.applications.mobilenet_v2.preprocess_input
    
    base_model = MobileNetV2(input_shape=IMG_SIZE + (3,),
                             include_top=False,
                             weights='imagenet')
    
    # Freeze the base model
    base_model.trainable = False

    inputs = Input(shape=IMG_SIZE + (3,))
    x = data_augmentation(inputs)
    x = preprocess_input(x)
    x = base_model(x, training=False)
    x = GlobalAveragePooling2D()(x)
    x = Dropout(0.2)(x)
    outputs = Dense(num_classes, activation='softmax')(x)

    model = Model(inputs, outputs)

    model.compile(optimizer=tf.keras.optimizers.Adam(),
                  loss='categorical_crossentropy',
                  metrics=['accuracy'])

    # 5. Callbacks
    early_stopping = EarlyStopping(
        monitor='val_loss', 
        patience=5, 
        restore_best_weights=True
    )
    
    model_checkpoint = ModelCheckpoint(
        filepath=MODEL_SAVE_PATH,
        monitor='val_loss',
        save_best_only=True
    )

    # 6. Train Model
    print("Starting training...")
    EPOCHS = 20
    history = model.fit(
        train_dataset,
        epochs=EPOCHS,
        validation_data=val_dataset,
        callbacks=[early_stopping, model_checkpoint]
    )

    # 7. Evaluate on Test Set
    print("\nEvaluating the best model on the test dataset...")
    test_loss, test_accuracy = model.evaluate(test_dataset)
    
    print("\n==================================")
    print(f"Test Loss: {test_loss:.4f}")
    print(f"Test Accuracy: {test_accuracy:.4f}")
    print(f"Class Names: {class_names}")
    print("==================================")

if __name__ == '__main__':
    main()
