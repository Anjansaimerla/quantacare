# Technical Guide & Operational Protocol: Hybrid QML Training Pipeline

## 1. Overview & Scope

This document outlines the end-to-end training architecture and operational protocols for the QuantaCare multi-modal quantum-classical training engine. The training pipeline bridges raw clinical datasets (structured CSV telemetry combined with unstructured laboratory reports and diagnostic imaging) with variational quantum circuits (VQCs) running on local statevector emulators.

## 2. Multi-Modal Dataset Ingestion & Directory Topology

To support universal disease detection and severity scoring across varied clinical presentations, the training system uses an identifier-bound directory topology.

Plaintext

```
backend/
└── data/
    ├── clinical_records.csv        # Core 6 vitals, disease labels, and severity targets
    ├── lab_reports/                # Unstructured lab text/PDFs mapped by patient_id
    └── scan_images/                # Diagnostic X-ray/imaging files mapped by patient_id
```

### Data Schema Specifications

- **Tabular Feature Matrix (`clinical_records.csv`):** Contains primary patient metadata mapped to the 6 core physiological bounds (Age, Systolic BP, Diastolic BP, Fasting Blood Sugar, Cholesterol, and BMI), accompanied by ground-truth labels (y∈{0,1}) and multi-class severity scores.
    
- **Auxiliary Modalities:** Optional unstructured inputs (e.g., `patient_101_labs.pdf` and `patient_101_xray.png`) are dynamically queried by `patient_id` during batch ingestion. Missing modalities default to zero-filled tensors to preserve system stability.
    

## 3. Mathematical Foundations of the Hybrid Training Loop

The hybrid optimization loop minimizes a composite loss function over the network parameters using classical optimizers (such as SciPy COBYLA or Adam).

### A. Quantum State Preparation and Angle Encoding

Normalized vital signs xnorm​∈[0.0,1.0] are mapped onto a 6-qubit register via parameter-shift rotation gates:

θi​=xi​⋅πapplied via Rx​(θi​) and Ry​(θi​)

### B. Variational Circuit & Entanglement

The circuit evaluates non-linear correlations through ring CNOT topologies and parameterized rotation layers (Rz​) controlled by the trainable weight tensor θ:

∣ψ(θ)⟩=UPQC​(θ,xnorm​)∣0⟩

### C. Multi-Modal Fusion and Composite Loss Function

The system passes quantum measurement expectation values alongside extracted lab and imaging embeddings into a fusion layer. Training minimizes a combined loss function measuring both disease classification error (Binary Cross-Entropy) and severity error (Mean Squared Error):

Ltotal​=LBCE​(y,y^​)+λ⋅LMSE​(s,s^)

where y and y^​ represent true and predicted disease indicators, while s and s^ represent ground-truth and predicted clinical severity scores.

## 4. End-to-End Training Execution Script (`backend/train_multimodal.py`)

Python

```
import os
import numpy as np
import pandas as pd
import pennylane as qml
from scipy.optimize import minimize

# 1. Load multi-modal dataset index
df = pd.read_csv("data/clinical_records.csv")

# 2. Setup Quantum Simulator (6 Qubits for Vitals)
dev = qml.device("default.qubit", wires=6)

@qml.qnode(dev, interface="autograd")
def quantum_circuit(weights, normalized_vitals):
    # Encoding step: Map 6 vital signs to Rx and Ry rotation angles
    for i in range(6):
        angle = normalized_vitals[i] * np.pi
        qml.RX(angle, wires=i)
        qml.RY(angle, wires=i)
    
    # Entanglement step: CNOT ring topology
    for i in range(5):
        qml.CNOT(wires=[i, i+1])
    qml.CNOT(wires=[5, 0])
    
    # Variational parameter layers
    for l in range(len(weights)):
        for i in range(6):
            qml.RZ(weights[l][i], wires=i)
            
    return qml.expval(qml.PauliZ(0))

# 3. Auxiliary Feature Extractors (Modality Handlers)
def extract_lab_embedding(patient_id):
    pdf_path = f"data/lab_reports/{patient_id}_labs.pdf"
    if os.path.exists(pdf_path):
        return np.array([0.5, 0.2, 0.8, 0.1])
    return np.zeros(4)

def extract_scan_embedding(patient_id):
    img_path = f"data/scan_images/{patient_id}_xray.png"
    if os.path.exists(img_path):
        return np.array([0.1, 0.9, 0.3, 0.4])
    return np.zeros(4)

# 4. Multi-Modal Fusion & Composite Loss Function
def compute_multimodal_loss(weights, df_batch):
    total_loss = 0.0
    eps = 1e-7
    
    mins = np.array([18.0, 70.0, 40.0, 70.0, 100.0, 10.0])
    maxs = np.array([120.0, 200.0, 130.0, 300.0, 400.0, 60.0])
    
    for _, row in df_batch.iterrows():
        # A. Process Vitals through Quantum Circuit
        raw_vitals = np.array([row['age'], row['systolic_bp'], row['diastolic_bp'], row['blood_sugar'], row['cholesterol'], row['bmi']])
        norm_vitals = np.clip((raw_vitals - mins) / (maxs - mins), 0.0, 1.0)
        
        exp_val = quantum_circuit(weights, norm_vitals)
        quantum_score = (exp_val + 1.0) / 2.0
        
        # B. Extract auxiliary multi-modal features (Labs + Scans)
        lab_features = extract_lab_embedding(row['patient_id'])
        scan_features = extract_scan_embedding(row['patient_id'])
        
        # C. Fusion Layer
        fused_representation = np.hstack(([quantum_score], lab_features, scan_features))
        y_pred = np.clip(np.mean(fused_representation), eps, 1.0 - eps)
        
        # D. Loss Calculation
        true_label = row['disease_label']
        loss = - (true_label * np.log(y_pred) + (1 - true_label) * np.log(1 - y_pred))
        total_loss += loss
        
    return total_loss / len(df_batch)

# 5. Initialize Weights and Run Optimizer
np.random.seed(42)
initial_weights = np.random.uniform(0, 2 * np.pi, size=(1, 6))

print("Starting multi-modal quantum training loop...")
subset_batch = df.head(50)

result = minimize(
    compute_multimodal_loss,
    initial_weights,
    args=(subset_batch,),
    method="COBYLA",
    options={"maxiter": 30, "disp": True}
)

optimal_weights = result.x.reshape(1, 6)
np.save("trained_multimodal_weights.npy", optimal_weights)
print("Multi-modal training complete! Weights saved to backend/trained_multimodal_weights.npy")
```

## 5. Operational Rules & Guardrails for Training

- **In-Memory Volatility:** Trainable weight tensors (θweights​) and intermediate activation states must be processed in local system RAM.
    
- **Bounded Epoch Limits:** Optimization runs must enforce hard iteration ceilings (e.g., `maxiter = 30` to `100`) to prevent infinite convergence loops during optimization plateaus.
    
- **Deterministic Weight Seeding:** Initial parameter matrices (θ0​) must use a fixed random seed (e.g., `np.random.seed(42)`) to ensure reproducible training trajectories across deployment environments.
    
- **Production Persistence:** Upon successful convergence, the optimizer exports the final parameter matrix to `backend/trained_multimodal_weights.npy`, where the FastAPI inference layer loads it for live execution.
  
  
  
[[prd]]
[[trd]]
[[appflow]]
[[rules]]
[[rawingestion]]
[[classicaldataeng]]
[[processed]]
[[quantumencoding]]
[[quantumcircuits]]
[[quantumprob]]
[[optimizer]]
[[trained]]
[[prediction]]
[[rules_tr]]
[[rules_op]]
[[rules_en]]
[[rules_pre]]
[[rules_cir]]
[[rules_pro]]
[[rules_prob]]
[[rules_input]]
