# Feature Specification: Quantum Circuit Execution (Parametrised Quantum Circuits - PQC)

## 1. Feature Overview & Purpose

The **Quantum Circuit Execution** module serves as the computational core of the QuantaCare hybrid engine. Operating immediately after the quantum encoding phase, this module executes Variational Quantum Classifiers (VQCs) using **Parametrised Quantum Circuits (PQCs)**.

While encoding maps patient feature vectors into initial quantum states, the PQC layer introduces layers of parameterized entangling gates. By leveraging quantum mechanical principles—specifically superposition and entanglement—this module evaluates complex, non-linear correlations across clinical metrics that classical statistical models typically struggle to capture.

## 2. Architectural & Mathematical Framework

The PQC architecture is structured as a layered ansatz designed to process the 6-qubit register initialized during encoding.

### A. Entanglement and Variational Layers

1. **Entangling Blocks:** Following initial Rx​,Ry​ rotations, the circuit applies a cascade of CNOT (Controlled-NOT) or CZ gates arranged in a ring or linear topology across qubits Q0​ through Q5​. This entanglement allows the system to model multi-variable biomarker interactions (e.g., the combined effect of blood pressure, age, and BMI on cardiovascular risk).
    
2. **Parametrised Rotation Layers (θweights​):** Subsequent layers apply adjustable rotation gates (Rz​(ω) or arbitrary parameterized unitaries) controlled by weight parameters θ. These weights are iteratively tuned by the downstream classical optimizer.
    
3. **Ansatz Depth (L):** The circuit repeats the encoding, entanglement, and parameter-rotation sequence across Ldiscrete layers to increase model expressivity while maintaining simulation efficiency within CPU RAM.
    

### B. Simulation Framework Integration

- **PennyLane / Qiskit Backend:** The circuit is compiled and executed using local statevector simulators (e.g., `default.qubit` in PennyLane or `AerSimulator` in Qiskit).
    
- **In-Memory Gradient Tracking:** The execution engine hooks directly into automatic differentiation frameworks (like Autograd or PyTorch) to compute parameter-shift gradients without serialization overhead.
    

## 3. Execution Pipeline & State Transition Flow

```
[Prepared Quantum State Vector (Post-Encoding)]
                       │
                       ▼
[Parametrised Ansatz Layer Initialization (CNOT / CZ Gates)]
                       │
                       ▼
[Applying Trainable Weight Parameters ($\theta_{\text{weights}}$)]
                       │
                       ▼
[Terminal State Evolution Across $L$ Layers]
                       │
                       ▼
[Evolved Quantum State] ──► Hand-off to Quantum Probability Measurement Operator
```

1. **State Ingestion:** Accepts the 6-qubit statevector reference directly from local RAM via in-memory function call.
    
2. **Ansatz Execution:** Evaluates the unitary matrix transformations defined by the circuit topology and current weight parameters.
    
3. **State Output:** Produces the evolved quantum state tensor, primed for expectation value extraction and probability measurement.
    

## 4. Implementation Guidelines & Anti-Context-Rot Guardrails

- **Strict Local RAM Execution:** All tensor contractions and circuit simulations must execute locally on CPU cores. Network-based quantum cloud simulators are strictly barred during this phase to preserve the microsecond-level modular monolith execution loop.
    
- **Deterministic Circuit Depth:** Maintain a fixed circuit depth (L) across runtime instances to ensure consistent tensor shapes and prevent shape-mismatch errors during gradient backpropagation.
    
- **Numerical Stability:** Monitor floating-point precision during deep entanglement layers to prevent rounding errors or vanishing gradients from collapsing the quantum state vector to zero.
[[prd]]
[[trd]]
[[rules]]
[[appflow]]
[[systemarchitecture]]
[[rules_cir]]
[[quantumprob]]
