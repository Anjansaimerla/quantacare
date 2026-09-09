import numpy as np
from typing import List, Dict, Any
from pinecone import Pinecone
from app.config import settings
from app.schemas import VectorMatchItem

HISTORICAL_GUIDELINES_KNOWLEDGEBASE = [
    {
        "id": "REF-NEURO-7712",
        "vector": [0.78, 0.72, 0.84, 0.62, 0.88, 0.80],
        "metadata": {
            "category": "Neurology & Neuroimaging",
            "condition": "Acute Intracranial Parenchymal Pattern / Ischemic Stroke & Head CT Scan",
            "severity_tier": "HIGH",
            "clinical_guideline": "AHA/ASA Stroke Guidelines: Urgent non-contrast Head CT / Brain MRI recommended. Assess NIHSS score and evaluate for immediate thrombolytic therapy or endovascular thrombectomy."
        },
        "summary": "Historical Patient #7712 head CT scan displayed focal parenchymal tissue attenuation pattern and cranial structural asymmetry."
    },
    {
        "id": "REF-ORTHO-3341",
        "vector": [0.85, 0.68, 0.90, 0.40, 0.75, 0.82],
        "metadata": {
            "category": "Orthopedic Trauma",
            "condition": "Acute Cortical Skeletal Fracture & Structural Disruption",
            "severity_tier": "HIGH",
            "clinical_guideline": "BOA Trauma Guidelines: Align skeletal fracture, immobilize affected limb, and evaluate structural cortical boundary restoration."
        },
        "summary": "Historical Patient #3341 skeletal radiograph showed acute cortical boundary discontinuity and bone alignment disruption."
    },
    {
        "id": "REF-PULM-5520",
        "vector": [0.65, 0.70, 0.74, 0.58, 0.78, 0.69],
        "metadata": {
            "category": "Pulmonology & Respiratory Scan",
            "condition": "Pulmonary Parenchymal Opacity / Thoracic Radiograph Infiltrate",
            "severity_tier": "MODERATE",
            "clinical_guideline": "ATS/IDSA Guidelines: Thoracic radiography evaluation recommended. Initiate empiric respiratory protocol."
        },
        "summary": "Historical Patient #5520 chest radiograph demonstrated focal parenchymal infiltrate pattern in lower thoracic lobe."
    },
    {
        "id": "REF-CARDIO-8801",
        "vector": [0.72, 0.85, 0.78, 0.65, 0.82, 0.74],
        "metadata": {
            "category": "Cardiovascular Risk",
            "condition": "Severe Stage II Hypertension with Hyperlipidemia",
            "severity_tier": "HIGH",
            "clinical_guideline": "ESC/AHA Guidelines: Recommend immediate dual anti-hypertensive regimen, statin therapy, and urgent cardiology consultation."
        },
        "summary": "Historical Patient #8801 presented with elevated systolic BP (>160mmHg) and elevated LDL. QML similarity indicates high multi-variable risk correlation."
    },
    {
        "id": "REF-METAB-4102",
        "vector": [0.55, 0.60, 0.58, 0.85, 0.62, 0.68],
        "metadata": {
            "category": "Metabolic Syndrome",
            "condition": "Impaired Fasting Glucose & Early Type-2 Diabetes Risk",
            "severity_tier": "MODERATE",
            "clinical_guideline": "ADA Standards of Care: HbA1c screening recommended. Initiate lifestyle modifications, dietary restructuring, and glycemic monitoring."
        },
        "summary": "Historical Patient #4102 showed elevated fasting blood sugar (>125 mg/dL) and moderate BMI. QML vector matching flags metabolic risk factors."
    },
    {
        "id": "REF-NEPHRO-6105",
        "vector": [0.68, 0.74, 0.70, 0.60, 0.80, 0.72],
        "metadata": {
            "category": "Nephrology & Renal Health",
            "condition": "Elevated Serum Creatinine & Glomerular Filtration Pattern",
            "severity_tier": "MODERATE",
            "clinical_guideline": "KDIGO Guidelines: Monitor eGFR and serum creatinine. Evaluate renal parenchymal perfusion and electrolyte balance."
        },
        "summary": "Historical Patient #6105 displayed decreased glomerular filtration rate and elevated serum urea nitrogen."
    },
    {
        "id": "REF-ONCO-9204",
        "vector": [0.82, 0.80, 0.86, 0.70, 0.88, 0.85],
        "metadata": {
            "category": "Oncology Diagnostic Evaluation",
            "condition": "Atypical Cell Disruption & Tissue Biomarker Target",
            "severity_tier": "HIGH",
            "clinical_guideline": "NCCN Guidelines: Perform histopathological evaluation and tissue biomarker profiling."
        },
        "summary": "Historical Patient #9204 tissue biomarker screening identified cellular structural disruption requiring targeted protocol."
    },
    {
        "id": "REF-NORM-1092",
        "vector": [0.25, 0.30, 0.28, 0.22, 0.35, 0.29],
        "metadata": {
            "category": "Preventive Care",
            "condition": "Low Biomarker Risk / Optimal Homeostasis",
            "severity_tier": "LOW",
            "clinical_guideline": "WHO Clinical Guidelines: Patient biomarkers within healthy physiological boundaries. Continue annual routine wellness evaluation."
        },
        "summary": "Historical Cohort #1092 demonstrates balanced physiological vitals with optimal blood pressure and blood sugar parameters."
    }
]

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    a = np.array(v1)
    b = np.array(v2)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))

def search_pinecone_context(query_vector: List[float], top_k: int = 3) -> List[VectorMatchItem]:
    """
    Step 9: Pinecone Cloud Vector DB Integration.
    Queries Pinecone vector index using API key. Falls back gracefully to 
    embedded historical vector knowledgebase if index is provisioning.
    """
    matches: List[VectorMatchItem] = []
    
    try:
        pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        idx_list = pc.list_indexes()
        existing_names = [getattr(i, 'name', str(i)) for i in idx_list]
        
        if settings.PINECONE_INDEX_NAME in existing_names:
            index = pc.Index(settings.PINECONE_INDEX_NAME)
            res = index.query(
                vector=query_vector,
                top_k=top_k,
                include_metadata=True
            )
            for item in res.get("matches", []):
                item_dict = item.to_dict() if hasattr(item, 'to_dict') else dict(item)
                matches.append(
                    VectorMatchItem(
                        id=item_dict.get("id", "PINECONE-MATCH"),
                        score=round(float(item_dict.get("score", 0.0)), 4),
                        metadata=item_dict.get("metadata", {}),
                        summary=item_dict.get("metadata", {}).get("summary", "Pinecone Cloud Vector Similarity Match")
                    )
                )
    except Exception as e:
        print(f"[Pinecone Info] Using fallback embedded vector index: {e}")
        
    # Local similarity search fallback
    if not matches:
        scored_items = []
        for doc in HISTORICAL_GUIDELINES_KNOWLEDGEBASE:
            score = cosine_similarity(query_vector, doc["vector"])
            scored_items.append((score, doc))
            
        scored_items.sort(key=lambda x: x[0], reverse=True)
        
        for score, doc in scored_items[:top_k]:
            matches.append(
                VectorMatchItem(
                    id=doc["id"],
                    score=round(float(score), 4),
                    metadata=doc["metadata"],
                    summary=doc["summary"]
                )
            )
            
    return matches
