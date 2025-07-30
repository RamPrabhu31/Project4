from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np
import os



# Load model
model = joblib.load('Calories.pkl')

# Optional: Load scaler (only if used during training)
scaler_path = 'scaler.pkl'
if os.path.exists(scaler_path):
    scaler = joblib.load(scaler_path)
    use_scaler = True
else:
    scaler = None
    use_scaler = False
    print("⚠️ Warning: scaler.pkl not found, proceeding without scaling.")

# Define input schema
class InputData(BaseModel):
    age: float
    duration: float
    heart_rate: float
    body_temp: float

# Initialize app
app = FastAPI()

# Allow CORS for frontend connection (e.g., React at localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prediction endpoint
@app.post("/predict")
def predict(data: InputData):
    # Convert input to 2D NumPy array
    features = np.array([[data.age, data.duration, data.heart_rate, data.body_temp]])

    # Scale if scaler is available
    if use_scaler:
        features = scaler.transform(features)

    # Predict using model
    prediction = model.predict(features)

    return {"calories_burnt": round(prediction[0], 2)}
