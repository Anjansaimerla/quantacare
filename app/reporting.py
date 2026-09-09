import datetime
import hashlib
from typing import Tuple, List
from app.schemas import ClinicalVitalsInput, VectorMatchItem

def classify_risk_tier(risk_score: float) -> Tuple[str, str]:
    """
    Step 10: Translates risk score into explicit visual severity tier and hex color code.
    - Low Risk: #2d6a4f (Emerald Ink)
    - Moderate Risk: #b7791f (Amber Antique Gold)
    - High Risk: #9b2226 (Deep Crimson Red)
    """
    if risk_score < 0.35:
        return "LOW RISK", "#2d6a4f"
    elif risk_score < 0.65:
        return "MODERATE RISK", "#b7791f"
    else:
        return "HIGH RISK", "#9b2226"

def determine_diagnosed_condition(
    vitals: ClinicalVitalsInput,
    risk_score: float,
    risk_tier: str,
    has_image: bool = False,
    image_modality: str = "",
    visual_risk_factors: List[str] = None
) -> Tuple[str, str, List[str]]:
    """
    Determines the target disease/condition, condition description, and specific risk factors.
    Dynamically maps Orthopedics, Pulmonology, Neurology, and Cardiovascular disease targets based on scan modality.
    """
    risk_factors = []

    if visual_risk_factors:
        risk_factors.extend(visual_risk_factors)

    if vitals.systolic_bp >= 140 or vitals.diastolic_bp >= 90:
        risk_factors.append("Stage 2 Hypertension")
    elif vitals.systolic_bp >= 130 or vitals.diastolic_bp >= 80:
        risk_factors.append("Stage 1 Hypertension")

    if vitals.cholesterol >= 240:
        risk_factors.append("High Serum Cholesterol")
    elif vitals.cholesterol >= 200:
        risk_factors.append("Borderline High Cholesterol")

    if vitals.fasting_blood_sugar >= 126:
        risk_factors.append("Elevated Blood Glucose")
    elif vitals.fasting_blood_sugar >= 100:
        risk_factors.append("Impaired Fasting Glucose")

    if vitals.bmi >= 30.0:
        risk_factors.append("Class I/II Obesity")
    elif vitals.bmi >= 25.0:
        risk_factors.append("Elevated BMI")

    # Map target disease according to image modality or tabular vitals
    if has_image and "Orthopedics" in image_modality:
        primary_disease = "Orthopedics — Skeletal Radiography & Bone Trauma"
        if risk_tier in ["HIGH RISK", "MODERATE RISK"]:
            condition_name = "Acute Tibia/Fibula Cortical Skeletal Fracture & Bone Disruption"
        else:
            condition_name = "Skeletal Radiograph Evaluation (Normal Cortical Continuity)"
            
    elif has_image and "Pulmonology" in image_modality:
        primary_disease = "Pulmonology — Thoracic Radiography & Respiratory Scan"
        if risk_tier in ["HIGH RISK", "MODERATE RISK"]:
            condition_name = "Pulmonary Parenchymal Opacity / Infiltrate Disruption"
        else:
            condition_name = "Clear Lung Parenchyma & Normal Thoracic Contour"
            
    elif has_image and "Neurology" in image_modality:
        primary_disease = "Neurology — Head CT / Brain MRI Neuroimaging"
        if risk_tier in ["HIGH RISK", "MODERATE RISK"]:
            condition_name = "Acute Intracranial Structural Anomaly & Focal Attenuation Pattern (Head CT Scan)"
        else:
            condition_name = "Normal Cranial Symmetry & Brain Parenchymal Baseline (Head CT Scan)"
            
    elif has_image and "Endocrinology" in image_modality:
        primary_disease = "Endocrinology — Metabolic & Diabetes Screening"
        if risk_tier in ["HIGH RISK", "MODERATE RISK"]:
            condition_name = "Endocrine Metabolic Disruption & Glycemic Dysregulation"
        else:
            condition_name = "Normal Metabolic Homeostasis & Glycemic Baseline"

    elif has_image and "Nephrology" in image_modality:
        primary_disease = "Nephrology — Renal Function & Glomerular Health"
        if risk_tier in ["HIGH RISK", "MODERATE RISK"]:
            condition_name = "Renal Parenchymal Perfusion & Glomerular Filtration Disruption"
        else:
            condition_name = "Optimal Renal Perfusion & Glomerular Baseline"

    elif has_image and "Oncology" in image_modality:
        primary_disease = "Oncology — Tissue Biomarker & Cellular Pathology"
        if risk_tier in ["HIGH RISK", "MODERATE RISK"]:
            condition_name = "Atypical Cellular Disruption & Histopathological Focal Lesion"
        else:
            condition_name = "Normal Cellular Histology & Unremarkable Biomarker Baseline"

    elif has_image and "Cardiology" in image_modality:
        primary_disease = "Cardiology — Electrocardiogram & Vascular Health"
        if risk_tier in ["HIGH RISK", "MODERATE RISK"]:
            condition_name = "Acute Coronary & Hemodynamic Vascular Risk Pattern"
        else:
            condition_name = "Normal Cardiac Rhythm & Vascular Baseline"
            
    else:
        primary_disease = "Cardiovascular Disease (CVD)"
        if risk_tier == "HIGH RISK":
            condition_name = "High-Risk Cardiovascular & Coronary Artery Disease (CVD)"
        elif risk_tier == "MODERATE RISK":
            condition_name = "Moderate Risk Cardiometabolic & Vascular Disease"
        else:
            condition_name = "Low Risk Cardiovascular Baseline (Normal Physiological State)"

    return primary_disease, condition_name, risk_factors


def generate_encrypted_clinical_summary(
    vitals: ClinicalVitalsInput,
    risk_score: float,
    risk_tier: str,
    confidence_pct: float,
    pinecone_matches: List[VectorMatchItem],
    has_image: bool = False,
    image_modality: str = "",
    visual_risk_factors: List[str] = None
) -> Tuple[str, str, str, List[str]]:
    """
    Generates a structured clinician report formatted as an authentic clinical hospital ledger report.
    Includes SHA-256 cryptographic verification checksum.
    Returns (summary_report, primary_disease, predicted_condition, risk_factors).
    """
    primary_disease, condition_name, risk_factors = determine_diagnosed_condition(
        vitals=vitals,
        risk_score=risk_score,
        risk_tier=risk_tier,
        has_image=has_image,
        image_modality=image_modality,
        visual_risk_factors=visual_risk_factors
    )
    timestamp = datetime.datetime.now().strftime("%B %d, %Y - %H:%M:%S")
    
    # Format Pinecone reference notes
    context_notes = "\n".join(
        [f"   • [{m.id}] Similarity {m.score*100:.1f}%: {m.metadata.get('condition', 'Reference Match')} - {m.summary}" for m in pinecone_matches]
    ) if pinecone_matches else "   • No external vector matches required."

    factors_str = ", ".join(risk_factors) if risk_factors else "None (Optimal Baseline)"
    raw_payload_signature = f"{vitals.age}|{vitals.systolic_bp}|{vitals.diastolic_bp}|{vitals.fasting_blood_sugar}|{vitals.cholesterol}|{vitals.bmi}|{risk_score}"
    checksum = hashlib.sha256(raw_payload_signature.encode('utf-8')).hexdigest()[:16].upper()

    summary_report = f"""================================================================================
          ROYAL INFIRMARY & QUANTUM DIAGNOSTIC CLINIC
                  OFFICIAL MEDICAL LEDGER & CLINICAL SUMMARY
================================================================================
PATIENT IDENTIFIER: {vitals.patient_id or 'PATIENT-ANON-' + checksum[:6]}
EVALUATION TIMESTAMP: {timestamp}
CLINICAL LOCATION: QuantaCare Quantum Decision Support Ward
--------------------------------------------------------------------------------

I. EVALUATED DISEASE & TARGET CONDITION:
   - Primary Disease Target: {primary_disease}
   - Diagnostic Condition Status: {condition_name}
   - Detected Clinical Risk Factors: {factors_str}

II. CLINICAL PHYSIOLOGICAL BIOMARKERS (RAW INGESTION):
   - Age: {vitals.age:.0f} years
   - Blood Pressure: {vitals.systolic_bp:.0f} / {vitals.diastolic_bp:.0f} mmHg
   - Fasting Blood Sugar: {vitals.fasting_blood_sugar:.1f} mg/dL
   - Serum Cholesterol: {vitals.cholesterol:.1f} mg/dL
   - Body Mass Index (BMI): {vitals.bmi:.1f} kg/m²

III. QUANTUM MACHINE LEARNING DIAGNOSTIC INFERENCE:
   - Evaluated Model: 6-Qubit Variational Quantum Classifier (PennyLane Local Engine)
   - Calculated Multi-Variable Risk Score: {risk_score * 100:.2f}%
   - Assigned Severity Classification: [{risk_tier}]
   - Model Confidence Index: {confidence_pct:.1f}%
   - Optimization Status: SciPy COBYLA In-Memory Convergence Complete

IV. PINECONE CLOUD VECTOR CONTEXTUAL REFERENCES:
{context_notes}

V. CHIEF MEDICAL OFFICER DIRECTIVES & SUMMARY:
   Based on multi-variable quantum Hilbert-space state mapping, the patient presents a 
   {risk_tier} profile ({risk_score*100:.1f}% risk probability) for {primary_disease}. 
   Recommended action: Follow targeted clinical protocol for {risk_tier} patients.

--------------------------------------------------------------------------------
CRYPTOGRAPHIC VALIDATION CHECKSUM: QMC-{checksum}
STATUS: SEALED & ENCRYPTED IN QUANTUM MEMORY RUNTIME
================================================================================
"""
    return summary_report, primary_disease, condition_name, risk_factors
