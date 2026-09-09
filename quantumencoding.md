# Feature Specification: Quantum Encoding (Quantum Feature Mapping)

## 1. Feature Overview & Purpose

The **Quantum Encoding** module acts as the critical translation layer that maps classical patient data into quantum mechanical states. Operating immediately after the processed feature vector is established in local RAM, this feature transforms normalized classical attributes into quantum states within Hilbert space.

By utilizing parameter-shift-rule compatible rotation gates (Rx​ and Ry​), the quantum encoding process binds each clinical indicator to the rotational angles of virtual qubits. This enables subsequent Variational Quantum Circuits (VQCs) to evaluate complex, non-linear feature interactions via superposition and entanglement.

## 2. Mathematical Foundations & Mapping Strategy

Because quantum circuits operate on unitary transformations, classical floating-point numbers cannot be processed directly as raw amplitudes without proper encoding. QuantaCare utilizes **Angle Encoding** (or product state encoding), where each normalized clinical feature from the 6-element processed feature vector is mapped directly to the rotation angle of a dedicated qubit.

### A. Qubit Allocation & Mapping

To process the 6 clinical parameters, the encoding circuit initializes a register of **6 virtual qubits** (Q0​ through Q5​), maintaining a 1:1 mapping with the feature vector indices:

- **Qubit Q0​**: Mapped to `scaled_patient_age`
    
- **Qubit Q1​**: Mapped to `scaled_systolic_bp`
    
- **Qubit Q2​**: Mapped to `scaled_diastolic_bp`
    
- **Qubit Q3​**: Mapped to `scaled_fasting_blood_sugar`
    
- **Qubit Q4​**: Mapped to `scaled_cholesterol_level`
    
- **Qubit Q5​**: Mapped to `scaled_bmi`
    

### B. Rotation Gate Transformations

Each normalized feature xi​∈[0.0,1.0] is scaled to an angle domain [0,π] or [0,2π] and applied via Pauli rotation gates.

- **Rx​ Rotation Gate:** Rotates the qubit state around the X-axis of the Bloch sphere based on the scaled feature value:
    
    Rx​(xi​)=(cos(2θi​​)−isin(2θi​​)​−isin(2θi​​)cos(2θi​​)​)
    
    where θi​=xi​⋅π (scaling the normalized [0,1] value to radians).
    
- **Ry​ Rotation Gate:** Provides supplementary phase rotation around the Y-axis to enrich the feature space representation before entanglement layers.
    

## 3. Execution Pipeline & In-Memory State Flow

```
[Processed Feature Vector (NumPy Array in RAM)]
                       │
                       ▼
[Quantum Circuit Initializer (6 Qubits)]
                       │
                       ▼
[Parameter-Shift Angle Scaling ($\theta = x \cdot \pi$)]
                       │
                       ▼
[Applying $R_x$ and $R_y$ Rotation Gates to Qubits $Q_0 - Q_5$]
                       │
                       ▼
[Prepared Quantum State Vector] ──► Hand-off to Quantum Circuit Execution (PQC)
```

1. **Vector Ingestion:** Pulls the 6-element floating-point array directly from local RAM without disk serialization.
    
2. **Circuit Binding:** Iterates over array elements, dynamically binding each normalized value to its respective qubit rotation operation inside the quantum simulator framework (PennyLane/Qiskit).
    
3. **State Preparation:** Emits an initialized quantum state vector ready for variational circuit execution.
    

## 4. Implementation Guidelines & Anti-Context-Rot Guardrails

- **In-Memory Simulation Runtime:** All encoding operations execute strictly within local CPU RAM using PennyLane or Qiskit statevector simulators, preserving the modular monolith's low-latency execution model.
    
- **Deterministic Angle Scaling:** Ensure the scalar multiplier (e.g., π) applied to normalized features is uniform across all production environments to prevent model weight divergence.
    
- **Qubit-to-Feature Integrity:** Never alter the 1:1 index mapping between the processed feature vector and qubit allocation unless the entire variational circuit architecture is updated simultaneously.
[[prd]]
[[trd]]
[[rules]]
[[appflow]]
[[systemarchitecture]]
[[rules_en]]
[[quantumcircuits]]
