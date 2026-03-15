import joblib
import sklearn
print(f"Sklearn version: {sklearn.__version__}")

try:
    model = joblib.load('stress_model_v2.joblib')
    print("Model loaded successfully!")
    print(f"Model type: {type(model)}")
    if hasattr(model, 'predict'):
        print("Model has predict method.")
except Exception as e:
    print(f"Error loading model: {e}")
    import traceback
    traceback.print_exc()
