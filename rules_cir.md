# Rules & Operational Procedure: Quantum Circuit Execution (PQC)

## 1. Overview & Purpose

This document establishes the mandatory operational rules, guardrails, and step-by-step procedures for executing **Parametrised Quantum Circuits (PQCs)** within the QuantaCare platform. Because this module handles the core quantum computation and entanglement layers, strict adherence to these rules ensures numerical stability, deterministic tensor shapes, and compatibility with the downstream classical optimizer.

## 2. Core Operational Rules

- **Rule 1: Fixed Circuit Depth (L) Invariant** The variational ansatz depth (L) must remain constant across all execution cycles. Dynamically modifying circuit layers or qubit topologies at runtime is strictly prohibited to prevent tensor shape mismatches during gradient computation.
    
- **Rule 2: Local CPU-Only Simulation Mandate** All quantum circuit executions must run locally in system RAM using statevector simulators (e.g., PennyLane's `default.qubit` or Qiskit's local simulator). Routing simulation tasks to external quantum hardware APIs or remote cloud nodes during iteration loops is banned.
    
- **Rule 3: Explicit Parameter-Shift Gradient Support** All parameterized gates within the ansatz must support analytic gradient evaluation via the parameter-shift rule, ensuring seamless integration with the classical optimization loop.
    
- **Rule 4: Zero-Disk Tensor Persistence** Evolved quantum state tensors and intermediate unitary matrices must remain entirely in volatile system RAM. Writing intermediate circuit states to disk or external caches is strictly forbidden.
    

## 3. Step-by-Step Operational Procedure

### Phase 1: Circuit Initialization & State Ingestion

1. **Reference Reception:** Ingest the 6-qubit prepared quantum state reference directly from the Quantum Encoding module via in-memory function call.
    
2. **Ansatz Setup:** Initialize the parameterized circuit structure, binding the current epoch weight vector (θweights​) to the trainable rotation gates.
    

### Phase 2: Entanglement & Layer Evolution

1. **Topological Entanglement:** Apply the linear or ring CNOT/CZ entanglement cascade across qubits Q0​ through Q5​ to model multi-variable feature correlations.
    
2. **Parametric Rotation:** Execute adjustable rotation gates (Rz​ or arbitrary unitaries) driven by the current weight parameters across the defined L layers.
    
3. **State Evolution:** Compute the final unitary matrix multiplication to yield the evolved quantum state tensor in memory.
    

### Phase 3: Post-Execution Validation & Handoff

1. **Norm Verification:** Assert that the evolved state vector maintains a valid probability amplitude sum equal to 1.0(∣∣ψ∣∣=1):
    
    Python
    
    ```
    assert np.isclose(np.linalg.norm(evolved_state), 1.0), "Quantum state normalization violated!"
    ```
    
1. **Direct Memory Transfer:** Hand off the evolved quantum state reference via an in-memory function call directly to the **Quantum Probability Measurement** module.
[[rules]]
[[quantumcircuits]]
