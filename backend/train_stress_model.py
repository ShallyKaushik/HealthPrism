import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import numpy as np

print("--- Starting Stress Model Training Pipeline ---")

# --- 1. Load Raw Data ---
try:
    # Go up one directory to find the CSV
    data = pd.read_csv('../stress_data.csv') 
    print("✅ Raw stress data loaded successfully.")
except FileNotFoundError:
    print("❌ Error: 'stress_data.csv' not found. Make sure it's in the root project folder.")
    exit()

# --- 2. Data Cleaning & Feature Engineering (The "Updates") ---
print("Cleaning and preparing data...")

# Drop the "cheater" column (data leakage) and useless ID
data = data.drop(columns=['Sleep Disorder', 'Person ID'])

# Engineer the 'Blood Pressure' column
# It's a string like "126/83", we'll split it into two numbers
bp_split = data['Blood Pressure'].str.split('/', expand=True).astype(int)
data['Systolic BP'] = bp_split[0]
data['Diastolic BP'] = bp_split[1]
data = data.drop(columns=['Blood Pressure']) # Drop the original string column

# Engineer the 'Stress Level' target (Y)
# We will convert the 0-10 scale into 3 clear classes
def map_stress_level(level):
    if level <= 3:
        return 'Low Stress'
    elif level <= 7:
        return 'Moderate Stress'
    else:
        return 'High Stress'

data['Stress Level'] = data['Stress Level'].apply(map_stress_level)

print("✅ Data cleaning and feature engineering complete.")

# --- 3. Define Features (X) and Target (Y) ---
# We have 10 input features for our model
NUMERIC_FEATURES = [
    'Age', 
    'Sleep Duration', 
    'Quality of Sleep', 
    'Physical Activity Level', 
    'Heart Rate', 
    'Daily Steps',
    'Systolic BP',    # Our new feature
    'Diastolic BP'    # Our new feature
]

CATEGORICAL_FEATURES = [
    'Gender',
    'Occupation',
    'BMI Category'
]

ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES
TARGET_COLUMN = 'Stress Level'

X = data[ALL_FEATURES]
y = data[TARGET_COLUMN]

# --- 4. Create Preprocessing Pipeline ---
# This pipeline will automatically scale all numbers and encode all text
numeric_transformer = StandardScaler()
categorical_transformer = OneHotEncoder(handle_unknown='ignore')

preprocessor = ColumnTransformer(
    transformers=[
        ('num', numeric_transformer, NUMERIC_FEATURES),
        ('cat', categorical_transformer, CATEGORICAL_FEATURES)
    ],
    remainder='passthrough'
)

# --- 5. Create the Final ML Pipeline ---
model = RandomForestClassifier(n_estimators=100, random_state=42)

pipeline_final = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('classifier', model)
])

# --- 6. Train and Evaluate the Model ---
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Starting FINAL Stress Model training...")
pipeline_final.fit(X_train, y_train)
print("✅ Stress Model training complete!")

# Test its accuracy
y_pred = pipeline_final.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"\n✅ --- Optimized Stress Model Accuracy: {accuracy * 100:.2f}% --- ✅")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# --- 7. SAVE THE FINAL MODEL ---
FINAL_MODEL_FILE = 'stress_model.joblib'
joblib.dump(pipeline_final, FINAL_MODEL_FILE)

print(f"\n✅ --- SUCCESS! Optimized STRESS model saved to '{FINAL_MODEL_FILE}' --- ✅")
