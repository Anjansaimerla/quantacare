from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator

class ClinicalVitalsInput(BaseModel):
    """
    Manual clinical vitals ingestion schema with strict Pydantic range validation.
    Out of bound values trigger a 422 Unprocessable Entity error at the FastAPI gateway.
    """
    age: float = Field(..., ge=1.0, le=120.0, description="Patient age in years (1 - 120)")
    systolic_bp: float = Field(..., ge=60.0, le=240.0, description="Systolic Blood Pressure in mmHg (60 - 240)")
    diastolic_bp: float = Field(..., ge=40.0, le=150.0, description="Diastolic Blood Pressure in mmHg (40 - 150)")
    fasting_blood_sugar: float = Field(..., ge=50.0, le=400.0, description="Fasting Blood Sugar in mg/dL (50 - 400)")
    cholesterol: float = Field(..., ge=100.0, le=500.0, description="Serum Cholesterol in mg/dL (100 - 500)")
    bmi: float = Field(..., ge=10.0, le=60.0, description="Body Mass Index in kg/m2 (10.0 - 60.0)")
    
    patient_id: Optional[str] = Field(None, description="Optional patient reference ID")
    clinician_notes: Optional[str] = Field(None, description="Optional diagnostic notes")

    @field_validator('diastolic_bp')
    @classmethod
    def validate_bp_ratio(cls, v: float, info) -> float:
        systolic = info.data.get('systolic_bp')
        if systolic and v >= systolic:
            raise ValueError("Diastolic BP must be strictly less than Systolic BP")
        return v


class QuantumStateTelemetry(BaseModel):
    qubit_angles_rx: List[float]
    qubit_angles_ry: List[float]
    quantum_probabilities: List[float]
    expectation_values: List[float]
    optimization_epochs: int
    final_loss_delta: float


class VectorMatchItem(BaseModel):
    id: str
    score: float
    metadata: Dict[str, Any]
    summary: str


class PredictionResponse(BaseModel):
    patient_id: str
    status: str = "SUCCESS"
    processed_feature_vector: List[float]
    primary_disease_target: str = "Cardiovascular Disease (CVD)"
    predicted_condition: str = "Cardiovascular Disease Risk Assessment"
    detected_risk_factors: List[str] = []
    risk_score_percentage: float
    risk_tier: str  # "LOW RISK", "MODERATE RISK", "HIGH RISK"
    risk_color_hex: str
    confidence_percentage: float
    has_image_input: bool = False
    vision_feature_dim: int = 512
    fusion_type: str = "HYBRID_QML_VISION"
    quantum_telemetry: QuantumStateTelemetry
    pinecone_matches: List[VectorMatchItem]
    clinical_summary_report: str
    timestamp: str
    execution_time_ms: float
    steps_executed: List[str]


class ScanExtractionResponse(BaseModel):
    filename: str
    extracted_vitals: Optional[ClinicalVitalsInput] = None
    confidence_scores: Dict[str, float] = {}
    missing_fields: List[str] = []
    ocr_raw_text: str = ""
    is_complete: bool = True
    validation_error: Optional[str] = None
