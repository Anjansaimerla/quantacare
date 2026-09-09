import numpy as np
from app.schemas import ClinicalVitalsInput

# Reference Min-Max feature bounds for clinical normalization
FEATURE_BOUNDS = {
    "age": (1.0, 120.0),
    "systolic_bp": (60.0, 240.0),
    "diastolic_bp": (40.0, 150.0),
    "fasting_blood_sugar": (50.0, 400.0),
    "cholesterol": (100.0, 500.0),
    "bmi": (10.0, 60.0)
}

def sanitize_and_normalize_vitals(vitals: ClinicalVitalsInput) -> np.ndarray:
    """
    Step 3 & Step 4 of the Pipeline:
    Classical Data Engineering - Sanitizes payload values and normalizes raw numerical 
    variables into standard continuous range [0.0, 1.0].
    Returns the 6-element Processed Feature Vector stored in RAM.
    """
    raw_values = [
        vitals.age,
        vitals.systolic_bp,
        vitals.diastolic_bp,
        vitals.fasting_blood_sugar,
        vitals.cholesterol,
        vitals.bmi
    ]
    
    keys = ["age", "systolic_bp", "diastolic_bp", "fasting_blood_sugar", "cholesterol", "bmi"]
    normalized_features = []
    
    for val, key in zip(raw_values, keys):
        min_v, max_v = FEATURE_BOUNDS[key]
        # Clip value within valid boundaries
        clipped_val = max(min_v, min(max_v, float(val)))
        # Min-Max Scaling into [0, 1]
        norm_v = (clipped_val - min_v) / (max_v - min_v)
        normalized_features.append(round(norm_v, 6))
        
    return np.array(normalized_features, dtype=np.float64)
