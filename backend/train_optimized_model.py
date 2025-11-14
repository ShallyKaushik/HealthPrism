# backend/train_optimized_model.py

import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import numpy as np

print("--- Starting ML Optimization Pipeline ---")

# --- 1. Load Data ---
try:
    data = pd.read_csv('../heart_data.csv') # Use '../' to go up one folder
    print("✅ Data loaded successfully.")
except FileNotFoundError:
    print("❌ Error: 'heart_data.csv' not found. Make sure it's in the root project folder.")
    exit()

# --- 2. PHASE 1 (The "Research"): Train on ALL 13 Features ---
print("\n--- Phase 1: Training Preliminary Model (13 Features) ---")

# Define ALL features first
ALL_NUMERIC_FEATURES = ['age', 'trestbps', 'chol', 'thalach', 'oldpeak']
ALL_CATEGORICAL_FEATURES = ['sex', 'cp', 'fbs', 'restecg', 'exang', 'slope', 'ca', 'thal']
ALL_FEATURES = ALL_NUMERIC_FEATURES + ALL_CATEGORICAL_FEATURES
TARGET_COLUMN = 'target'

X_full = data[ALL_FEATURES]
y_full = data[TARGET_COLUMN]

# Create a preprocessor for ALL 13 features
preprocessor_full = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), ALL_NUMERIC_FEATURES),
        ('cat', OneHotEncoder(handle_unknown='ignore'), ALL_CATEGORICAL_FEATURES)
    ],
    remainder='passthrough'
)

# Create the "Research" pipeline
pipeline_research = Pipeline(steps=[
    ('preprocessor', preprocessor_full),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

# Train the "Research" model
X_train_full, X_test_full, y_train_full, y_test_full = train_test_split(X_full, y_full, test_size=0.2, random_state=42)
pipeline_research.fit(X_train_full, y_train_full)

# Test its accuracy (so we can compare)
y_pred_full = pipeline_research.predict(X_test_full)
accuracy_full = accuracy_score(y_test_full, y_pred_full)
print(f"✅ Full Model (13 Features) Accuracy: {accuracy_full * 100:.2f}%")


# --- 3. PHASE 2 (The "Selection"): Extract Embedded Importances ---
print("\n--- Phase 2: Extracting Feature Importances ---")

# Get the parts from our trained pipeline
classifier_full = pipeline_research.named_steps['classifier']
preprocessor_full_from_pipeline = pipeline_research.named_steps['preprocessor']

# --- THIS IS THE FIX ---
# The original line was:
# cat_features_out = preprocessor_full.named_transformers_['cat'].named_steps['onehot'].get_feature_names_out(ALL_CATEGORICAL_FEATURES)
# The OneHotEncoder is directly on 'cat', not in 'named_steps'.
# This is the correct, simpler line:
cat_features_out = preprocessor_full_from_pipeline.named_transformers_['cat'].get_feature_names_out(ALL_CATEGORICAL_FEATURES)
# --- END OF FIX ---

final_feature_names = ALL_NUMERIC_FEATURES + list(cat_features_out)

# Get the importance scores
importances = classifier_full.feature_importances_

# Create a readable list
feature_importance_list = list(zip(final_feature_names, importances))
feature_importance_list.sort(key=lambda x: x[1], reverse=True)

print("✅ Feature Importance (Top to Bottom):")
for feature, importance in feature_importance_list:
    print(f"- {feature}: {importance * 100:.2f}%")

# --- 4. PHASE 3 (The "Final Product"): Train Optimized Model ---
print("\n--- Phase 3: Training FINAL Optimized Model (Top 8 Features) ---")

# --- This is our FEATURE SELECTION! ---
# Based on the list, we've decided these 5 features are "junk":
# 'sex', 'fbs', 'restecg', 'exang', 'slope'
# We will KEEP these 8 features:
OPTIMIZED_NUMERIC_FEATURES = ['age', 'trestbps', 'chol', 'thalach', 'oldpeak']
OPTIMIZED_CATEGORICAL_FEATURES = ['cp', 'ca', 'thal']
OPTIMIZED_FEATURES = OPTIMIZED_NUMERIC_FEATURES + OPTIMIZED_CATEGORICAL_FEATURES
print(f"✅ Selected Features: {OPTIMIZED_FEATURES}")

# Create a new, smaller dataset
X_optimized = data[OPTIMIZED_FEATURES]
y_optimized = data[TARGET_COLUMN] # 'y' is the same

# Create a new, smaller preprocessor
preprocessor_optimized = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), OPTIMIZED_NUMERIC_FEATURES),
        ('cat', OneHotEncoder(handle_unknown='ignore'), OPTIMIZED_CATEGORICAL_FEATURES)
    ],
    remainder='passthrough'
)

# Create the FINAL pipeline
pipeline_final = Pipeline(steps=[
    ('preprocessor', preprocessor_optimized),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

# Train the FINAL model
X_train_opt, X_test_opt, y_train_opt, y_test_opt = train_test_split(X_optimized, y_optimized, test_size=0.2, random_state=42)
pipeline_final.fit(X_train_opt, y_train_opt)

# Test its accuracy
y_pred_opt = pipeline_final.predict(X_test_opt)
accuracy_opt = accuracy_score(y_test_opt, y_pred_opt)
print(f"✅ Optimized Model (Top 8 Features) Accuracy: {accuracy_opt * 100:.2f}%")

# --- 5. SAVE THE FINAL MODEL ---
# We overwrite the old, 13-feature model with our new, 8-feature optimized one
FINAL_MODEL_FILE = 'heart_risk_pipeline.joblib'
joblib.dump(pipeline_final, FINAL_MODEL_FILE)

# We will ALSO save the simple model under its own name
# so our app.py can use both for the demo.
SIMPLE_MODEL_FILE = 'heart_risk_pipeline_SIMPLE.joblib'
joblib.dump(pipeline_final, SIMPLE_MODEL_FILE)


print(f"\n✅ --- SUCCESS! Optimized model saved to '{FINAL_MODEL_FILE}' --- ✅")
print(f"✅ --- (Also saved copy to '{SIMPLE_MODEL_FILE}') --- ✅")
print(f"Comparison: Full Model (13 features) @ {accuracy_full*100:.2f}% vs. Optimized (8 features) @ {accuracy_opt*100:.2f}%")