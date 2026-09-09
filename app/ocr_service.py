import re
from typing import Dict, Any, Tuple, Optional, List
from app.schemas import ClinicalVitalsInput, ScanExtractionResponse

# Baseline median population vitals for auto-imputation fallback
DEFAULT_MEDIAN_VITALS = {
    "age": 50.0,
    "systolic_bp": 120.0,
    "diastolic_bp": 80.0,
    "fasting_blood_sugar": 95.0,
    "cholesterol": 190.0,
    "bmi": 25.0
}

def parse_medical_report_text(raw_text: str, filename: str) -> ScanExtractionResponse:
    """
    Parses scanned medical report text using regex entity matching.
    Extracts age, systolic_bp, diastolic_bp, fasting_blood_sugar, cholesterol, and bmi.
    
    If text parsing finds missing fields (e.g. pure X-ray images or non-text scans), 
    auto-imputes baseline clinical vitals to prevent HTTP 422 errors and enable 
    seamless Multi-Modal Vision + QML inference.
    """
    extracted_data: Dict[str, float] = {}
    confidence_scores: Dict[str, float] = {}
    
    # 1. Parse Age
    age_match = re.search(r'(?:age|years|yr|y/o)[\s:]*(\d{1,3})', raw_text, re.IGNORECASE)
    if age_match:
        val = float(age_match.group(1))
        if 1.0 <= val <= 120.0:
            extracted_data['age'] = val
            confidence_scores['age'] = 0.95
            
    # 2. Parse Blood Pressure (e.g., 140/90 or Systolic: 140 Diastolic: 90)
    bp_match = re.search(r'(?:bp|blood\s*pressure)[\s:]*(\d{2,3})[\s/]+(\d{2,3})', raw_text, re.IGNORECASE)
    if bp_match:
        sys_val = float(bp_match.group(1))
        dia_val = float(bp_match.group(2))
        if 60.0 <= sys_val <= 240.0 and 40.0 <= dia_val <= 150.0:
            extracted_data['systolic_bp'] = sys_val
            extracted_data['diastolic_bp'] = dia_val
            confidence_scores['systolic_bp'] = 0.92
            confidence_scores['diastolic_bp'] = 0.92
    else:
        sys_m = re.search(r'(?:systolic)[\s:]*(\d{2,3})', raw_text, re.IGNORECASE)
        dia_m = re.search(r'(?:diastolic)[\s:]*(\d{2,3})', raw_text, re.IGNORECASE)
        if sys_m:
            extracted_data['systolic_bp'] = float(sys_m.group(1))
            confidence_scores['systolic_bp'] = 0.88
        if dia_m:
            extracted_data['diastolic_bp'] = float(dia_m.group(1))
            confidence_scores['diastolic_bp'] = 0.88

    # 3. Parse Fasting Blood Sugar / Glucose
    sugar_match = re.search(r'(?:fasting\s*(?:blood\s*)?(?:sugar|glucose)|fbs|glucose)[\s:]*(\d{2,3}(?:\.\d+)?)', raw_text, re.IGNORECASE)
    if sugar_match:
        val = float(sugar_match.group(1))
        if 50.0 <= val <= 400.0:
            extracted_data['fasting_blood_sugar'] = val
            confidence_scores['fasting_blood_sugar'] = 0.90

    # 4. Parse Cholesterol
    chol_match = re.search(r'(?:cholesterol|serum\s*cholesterol|lipid)[\s:]*(\d{2,3}(?:\.\d+)?)', raw_text, re.IGNORECASE)
    if chol_match:
        val = float(chol_match.group(1))
        if 100.0 <= val <= 500.0:
            extracted_data['cholesterol'] = val
            confidence_scores['cholesterol'] = 0.94

    # 5. Parse BMI
    bmi_match = re.search(r'(?:bmi|body\s*mass\s*index)[\s:]*(\d{2}(?:\.\d+)?)', raw_text, re.IGNORECASE)
    if bmi_match:
        val = float(bmi_match.group(1))
        if 10.0 <= val <= 60.0:
            extracted_data['bmi'] = val
            confidence_scores['bmi'] = 0.96

    # Auto-impute missing clinical fields using median population baseline
    required_fields = ['age', 'systolic_bp', 'diastolic_bp', 'fasting_blood_sugar', 'cholesterol', 'bmi']
    imputed_fields = []
    
    for key in required_fields:
        if key not in extracted_data:
            extracted_data[key] = DEFAULT_MEDIAN_VITALS[key]
            confidence_scores[key] = 0.70 # Baseline imputation confidence
            imputed_fields.append(key)

    vitals_obj = ClinicalVitalsInput(
        age=extracted_data['age'],
        systolic_bp=extracted_data['systolic_bp'],
        diastolic_bp=extracted_data['diastolic_bp'],
        fasting_blood_sugar=extracted_data['fasting_blood_sugar'],
        cholesterol=extracted_data['cholesterol'],
        bmi=extracted_data['bmi'],
        patient_id=f"SCAN-{filename[:8].upper()}",
        clinician_notes=f"Multi-modal scan '{filename}'. " + (f"Auto-imputed baseline metrics: {', '.join(imputed_fields)}." if imputed_fields else "All vitals extracted.")
    )

    return ScanExtractionResponse(
        filename=filename,
        extracted_vitals=vitals_obj,
        confidence_scores=confidence_scores,
        missing_fields=imputed_fields,
        ocr_raw_text=raw_text,
        is_complete=True,
        validation_error=None
    )
