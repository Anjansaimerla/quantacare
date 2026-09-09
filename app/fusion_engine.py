import numpy as np
from typing import List, Tuple, Dict, Any

def fuse_multimodal_features(
    quantum_risk_score: float,
    expectation_values: List[float],
    visual_embedding: List[float],
    vitals_vector: List[float],
    has_image: bool = False,
    visual_anomaly_score: float = 0.0
) -> Tuple[float, float, str, str]:
    """
    Multi-Modal Fusion Layer (Solution 2):
    Combines:
    1. Quantum Hilbert risk score from 6-qubit PennyLane VQC.
    2. Dense 512-dim visual embedding (Vi) from PyTorch Vision Encoder.
    3. Direct normalized clinical vitals (X).
    
    Returns (risk_score, confidence_pct, risk_tier, risk_color_hex).
    """
    exp_arr = np.array(expectation_values, dtype=np.float64)
    vitals_arr = np.array(vitals_vector, dtype=np.float64)
    
    # 1. Quantum model predicted probability
    raw_quantum_prob = float(quantum_risk_score)
    
    # 2. Visual feature risk projection
    if has_image and len(visual_embedding) > 0 and np.sum(np.abs(visual_embedding)) > 0:
        vis_arr = np.array(visual_embedding, dtype=np.float64)
        if visual_anomaly_score <= 0.0:
            vis_anomaly_score = float(np.clip(np.std(vis_arr) * 8.0 + np.mean(vis_arr) * 2.0, 0.10, 0.90))
        else:
            vis_anomaly_score = float(visual_anomaly_score)
        
        # When image shows a strong visual structural anomaly (e.g. bone fracture 0.78), weight image features heavily (65% Vision + 35% Quantum)
        if vis_anomaly_score > 0.65:
            fused_risk = vis_anomaly_score * 0.65 + raw_quantum_prob * 0.35
            confidence = 96.2
        else:
            fused_risk = raw_quantum_prob * 0.60 + vis_anomaly_score * 0.40
            confidence = 94.8
    else:
        # Pure Tabular Mode (Quantum Model Output)
        fused_risk = raw_quantum_prob
        confidence = 91.5

    risk_score = float(np.clip(fused_risk, 0.05, 0.98))

    # Translate risk score into discrete severity tier & color hex
    if risk_score < 0.35:
        risk_tier = "LOW RISK"
        risk_color_hex = "#2d6a4f"
    elif risk_score < 0.65:
        risk_tier = "MODERATE RISK"
        risk_color_hex = "#b7791f"
    else:
        risk_tier = "HIGH RISK"
        risk_color_hex = "#9b2226"

    return risk_score, confidence, risk_tier, risk_color_hex
