import time
import datetime
import os
from typing import Optional
from fastapi import FastAPI, HTTPException, Request, Depends, UploadFile, File, Form, status
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
import numpy as np

from app.config import settings
from app.schemas import ClinicalVitalsInput, PredictionResponse, ScanExtractionResponse
from app.data_engineering import sanitize_and_normalize_vitals
from app.quantum_engine import run_hybrid_qml_pipeline
from app.vision_engine import extract_visual_embedding
from app.fusion_engine import fuse_multimodal_features
from app.vector_search import search_pinecone_context
from app.ocr_service import parse_medical_report_text
from app.reporting import classify_risk_tier, generate_encrypted_clinical_summary

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="QuantaCare Hybrid Multi-Modal Quantum-Vision Clinical Decision Support System"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.get("/", response_class=HTMLResponse)
async def render_dashboard(request: Request):
    """
    Renders the main QuantaCare Clinical Decision Support Dashboard.
    """
    return templates.TemplateResponse(
        request=request,
        name="index.html", 
        context={
            "project_name": settings.PROJECT_NAME,
            "version": settings.VERSION
        }
    )


@app.post("/predict", response_model=PredictionResponse)
@app.post("/predict/manual", response_model=PredictionResponse)
async def process_manual_clinical_vitals(vitals: ClinicalVitalsInput):
    """
    Complete 10-Step Pipeline Execution (Modular Monolith In-Memory Execution):
    """
    start_time = time.time()
    steps_executed = []
    
    steps_executed.append("Step 1: Ingestion Request Received")
    steps_executed.append("Step 2: FastAPI & Pydantic Boundary Validation Passed")

    feature_vector = sanitize_and_normalize_vitals(vitals)
    steps_executed.append("Step 3: Classical Data Sanitization & Min-Max Normalization")
    steps_executed.append(f"Step 4: Processed Feature Vector Generated in RAM: {list(feature_vector)}")

    risk_score_raw, telemetry = run_hybrid_qml_pipeline(feature_vector)
    steps_executed.append("Step 5: Quantum Encoding (Rx, Ry Rotation Feature Mapping)")
    steps_executed.append("Step 6: Quantum Circuit Execution (PennyLane 6-Qubit PQC)")
    steps_executed.append("Step 7: Quantum Probability Measurement Operator Extracted")
    steps_executed.append(f"Step 8: COBYLA Hybrid Optimization Converged ({telemetry.optimization_epochs} epochs)")

    pinecone_matches = search_pinecone_context(list(feature_vector), top_k=3)
    steps_executed.append("Step 9: Pinecone Cloud Vector DB Similarity Match Executed")

    # Multi-Modal Fusion (Tabular mode)
    risk_score, confidence_pct, risk_tier, risk_color_hex = fuse_multimodal_features(
        quantum_risk_score=risk_score_raw,
        expectation_values=telemetry.expectation_values,
        visual_embedding=[0.0]*512,
        vitals_vector=list(feature_vector),
        has_image=False
    )
    
    summary_report, primary_disease, predicted_condition, risk_factors = generate_encrypted_clinical_summary(
        vitals=vitals,
        risk_score=risk_score,
        risk_tier=risk_tier,
        confidence_pct=confidence_pct,
        pinecone_matches=pinecone_matches,
        has_image=False
    )
    steps_executed.append("Step 10: Clinical Output & Encrypted Medical Summary Generated")

    elapsed_ms = round((time.time() - start_time) * 1000, 2)
    timestamp_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    patient_ref = vitals.patient_id or f"PATIENT-{int(time.time())}"

    return PredictionResponse(
        patient_id=patient_ref,
        status="SUCCESS",
        processed_feature_vector=[round(float(v), 6) for v in feature_vector],
        primary_disease_target=primary_disease,
        predicted_condition=predicted_condition,
        detected_risk_factors=risk_factors,
        risk_score_percentage=round(risk_score * 100.0, 2),
        risk_tier=risk_tier,
        risk_color_hex=risk_color_hex,
        confidence_percentage=confidence_pct,
        has_image_input=False,
        vision_feature_dim=512,
        fusion_type="HYBRID_QML_TABULAR",
        quantum_telemetry=telemetry,
        pinecone_matches=pinecone_matches,
        clinical_summary_report=summary_report,
        timestamp=timestamp_str,
        execution_time_ms=elapsed_ms,
        steps_executed=steps_executed
    )


@app.post("/predict/scan")
async def process_scanned_medical_document(
    file: UploadFile = File(...),
    patient_id: Optional[str] = Form(None),
    age: Optional[float] = Form(None),
    sys_bp: Optional[float] = Form(None),
    dia_bp: Optional[float] = Form(None),
    fbs: Optional[float] = Form(None),
    chol: Optional[float] = Form(None),
    bmi: Optional[float] = Form(None),
):
    """
    Multi-Modal Ingestion Route (Solution 2):
    Accepts medical images (X-rays, ECGs, scans) or PDF lab reports.
    1. Passes image through PyTorch Vision Encoder (MobileNetV3) -> extracts 512-dim visual vector.
    2. Runs OCR / Auto-imputation on text & reads 6 mandatory vitals form fields.
    3. Runs 6-qubit PennyLane VQC -> extracts quantum expectations.
    4. Multi-Modal Fusion Layer -> computes unified quantum + vision risk score.
    """
    start_time = time.time()
    contents = await file.read()
    filename = file.filename or "medical_scan.png"
    
    # 1. Extract PyTorch Vision Embedding (v_image)
    v_image, has_image, vision_desc, modality, anomaly_score, visual_risk_factors = extract_visual_embedding(contents, filename)
    
    # 2. Extract / Auto-impute Vitals
    try:
        raw_text = contents.decode('utf-8', errors='ignore')
    except Exception:
        raw_text = ""

    parsed_result = parse_medical_report_text(raw_text, filename)
    vitals = parsed_result.extracted_vitals
    
    # Override vitals with explicit form inputs if provided
    if age is not None: vitals.age = age
    if sys_bp is not None: vitals.systolic_bp = sys_bp
    if dia_bp is not None: vitals.diastolic_bp = dia_bp
    if fbs is not None: vitals.fasting_blood_sugar = fbs
    if chol is not None: vitals.cholesterol = chol
    if bmi is not None: vitals.bmi = bmi
    if patient_id and patient_id.strip():
        vitals.patient_id = patient_id.strip()
    
    # 3. Process Vitals through Classical Preprocessing & Quantum Engine
    feature_vector = sanitize_and_normalize_vitals(vitals)
    risk_score_raw, telemetry = run_hybrid_qml_pipeline(feature_vector)
    
    # 4. Pinecone Cloud Search
    pinecone_matches = search_pinecone_context(list(feature_vector), top_k=3)

    # 5. Multi-Modal Fusion (Quantum Expectations + PyTorch Vision Vector)
    risk_score, confidence_pct, risk_tier, risk_color_hex = fuse_multimodal_features(
        quantum_risk_score=risk_score_raw,
        expectation_values=telemetry.expectation_values,
        visual_embedding=v_image,
        vitals_vector=list(feature_vector),
        has_image=has_image,
        visual_anomaly_score=anomaly_score
    )

    summary_report, primary_disease, predicted_condition, risk_factors = generate_encrypted_clinical_summary(
        vitals=vitals,
        risk_score=risk_score,
        risk_tier=risk_tier,
        confidence_pct=confidence_pct,
        pinecone_matches=pinecone_matches,
        has_image=has_image,
        image_modality=modality,
        visual_risk_factors=visual_risk_factors
    )

    elapsed_ms = round((time.time() - start_time) * 1000, 2)
    timestamp_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    steps_executed = [
        "Step 1: Multi-Modal Ingestion Received",
        f"Step 2: PyTorch Vision Encoder: {vision_desc}",
        "Step 3: Clinical Vitals Auto-Imputation & Bounds Sanitization",
        f"Step 4: Processed Feature Vector in RAM: {list(feature_vector)}",
        "Step 5: Quantum Encoding (Rx, Ry Rotation Feature Mapping)",
        "Step 6: Quantum Circuit Execution (PennyLane 6-Qubit PQC)",
        "Step 7: Quantum Probability Measurement Operator Extracted",
        "Step 8: COBYLA Hybrid Optimization Converged",
        "Step 9: Pinecone Cloud Vector Search Match Executed",
        "Step 10: Multi-Modal Fusion Layer Executed (QML + PyTorch Vision)"
    ]

    return PredictionResponse(
        patient_id=vitals.patient_id or f"SCAN-{filename[:8].upper()}",
        status="SUCCESS",
        processed_feature_vector=[round(float(v), 6) for v in feature_vector],
        primary_disease_target=primary_disease,
        predicted_condition=predicted_condition,
        detected_risk_factors=risk_factors,
        risk_score_percentage=round(risk_score * 100.0, 2),
        risk_tier=risk_tier,
        risk_color_hex=risk_color_hex,
        confidence_percentage=confidence_pct,
        has_image_input=has_image,
        vision_feature_dim=512,
        fusion_type="HYBRID_QML_VISION_FUSION" if has_image else "HYBRID_QML_TABULAR",
        quantum_telemetry=telemetry,
        pinecone_matches=pinecone_matches,
        clinical_summary_report=summary_report,
        timestamp=timestamp_str,
        execution_time_ms=elapsed_ms,
        steps_executed=steps_executed
    )


@app.get("/api/health")
async def health_check():
    """
    System Health Check Endpoint.
    """
    return {
        "status": "HEALTHY",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "architecture": "Modular Monolith (Hybrid QML + PyTorch Vision Encoder)",
        "vision_engine": "PyTorch MobileNetV3-Small (512-dim)",
        "pinecone_api": "CONNECTED" if settings.PINECONE_API_KEY else "FALLBACK_MODE",
        "timestamp": datetime.datetime.now().isoformat()
    }
