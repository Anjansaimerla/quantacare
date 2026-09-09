# Rules & Operational Procedure: Quantum Encoding

## 1. Overview & Purpose

This document outlines the strict operational rules, guardrails, and step-by-step procedures governing the **Quantum Encoding** module in QuantaCare. Because quantum circuit execution depends entirely on precise angle scaling and deterministic qubit mapping, following these rules prevents numerical corruption and state drift during clinical feature transformation.

## 2. Core Operational Rules

- **Rule 1: Strict 1:1 Qubit-to-Feature Preservation** The quantum register must maintain exactly 6 virtual qubits corresponding to the 6 indices of the processed feature vector. Dynamic resizing or re-indexing of qubits without updating the upstream data schema is strictly prohibited.
    
- **Rule 2: Deterministic Angle Scaling Domain** All normalized features xi​∈[0.0,1.0] must be scaled to the rotational domain [0,π] using a uniform scalar multiplier. Arbitrary or dynamic scaling factors per feature are forbidden to ensure reproducible state preparation.
    
- **Rule 3: Parameter-Shift Compatibility** Rotation gates applied during encoding (Rx​,Ry​) must support parameter-shift differentiation rules to allow downstream classical optimizers to calculate exact gradients during the hybrid training loop.
    
- **Rule 4: Zero-Disk State Persistence** Encoded quantum states must remain entirely in-memory as volatile statevector representations within the local simulator runtime. Writing intermediate quantum states to disk or external caches is strictly banned.
    

## 3. Step-by-Step Operational Procedure

### Phase 1: Register Initialization

1. **Vector Retrieval:** Ingest the read-only 6-element `numpy.float64` processed feature vector from local RAM.
    
2. **Circuit Allocation:** Instantiate a clean 6-qubit quantum register and circuit canvas using the chosen simulation framework (PennyLane or Qiskit):
    
    Python
    
    ```
    # Example structural flow
    num_qubits = 6
    # Initialize zero state |000000>
    ```
    

### Phase 2: Angle Transformation & Gate Application

1. **Scalar Multiplication:** Convert each normalized feature into its corresponding radian rotation angle:
    
    θi​=feature_vector[i]⋅π
    
2. **Gate Injection:** Apply Rx​ and Ry​ rotation gates sequentially across the 6 qubits:
    
    - Qubit Q0​←Rx​(θ0​),Ry​(θ0​) (Patient Age)
        
    - Qubit Q1​←Rx​(θ1​),Ry​(θ1​) (Systolic BP)
        
    - Qubit Q2​←Rx​(θ2​),Ry​(θ2​) (Diastolic BP)
        
    - Qubit Q3​←Rx​(θ3​),Ry​(θ3​) (Fasting Blood Sugar)
        
    - Qubit Q4​←Rx​(θ4​),Ry​(θ4​) (Cholesterol Level)
        
    - Qubit Q5​←Rx​(θ5​),Ry​(θ5​) (BMI)
        

### Phase 3: State Handoff

1. **Validation Assert:** Verify that all rotation angles have successfully populated the circuit layers without throwing NaN or infinity errors.
    
2. **Direct Memory Transfer:** Hand off the prepared quantum state structure via an in-memory reference directly to the **Quantum Circuit Execution** module for variational processing.
[[rules]]
[[quantumencoding]]
