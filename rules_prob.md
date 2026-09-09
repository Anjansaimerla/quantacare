# Rules & Operational Procedure: Quantum Probability

## 1. Overview & Purpose

This document establishes the mandatory operational rules, mathematical invariants, and step-by-step procedures governing the **Quantum Probability** measurement module within QuantaCare. Because this feature bridges the gap between abstract quantum state amplitudes and actionable classical predictions, strict adherence to these rules ensures numerical stability, probability simplex constraints, and compatibility with the downstream classical optimizer.

## 2. Core Operational Rules

- **Rule 1: Strict Probability Simplex Invariant** All measured probability distributions extracted from the quantum state must satisfy probability axioms: individual probabilities must be bounded within [0.0,1.0], and the sum of all outcomes must equal unity (1.0±10−6).
    
- **Rule 2: Exact Analytical Statevector Measurement** The system must default to exact analytical expectation values and state probabilities (via statevector simulation) rather than stochastic shot-based sampling, eliminating random sampling noise during the iterative training loop.
    
- **Rule 3: Epsilon Clipping for Numerical Stability** When probability values are passed to classical loss functions or gradient evaluators, strict epsilon clipping (ϵ=10−7) must be enforced to prevent logarithmic singularities (log(0) errors).
    
- **Rule 4: Zero-Disk State Persistence** Extracted probability matrices must reside exclusively in volatile system RAM as NumPy arrays (`np.float64`) and must never be written to disk or external caches.
    

## 3. Step-by-Step Operational Procedure

### Phase 1: State Ingestion & Observable Application

1. **Reference Reception:** Ingest the evolved 6-qubit quantum state tensor reference directly from the PQC Execution module via in-memory function call.
    
2. **Observable Binding:** Apply Hermitian Pauli-Z measurement operators (σz​) to designated readout qubits or extract full computational basis probabilities (qml.probs / qml.expval).
    

### Phase 2: Expectation & Probability Calculation

1. **Born's Rule Evaluation:** Compute the computational basis state probabilities:
    
    P(i)=∣⟨i∣ψ⟩∣2
    
2. **Expectation Mapping:** Project raw expectation values into bounded disease risk probability space:
    
    P(Risk=1)=2⟨Zk​⟩+1​
    

### Phase 3: Assertion & Downstream Handoff

1. **Simplex Verification Check:** Assert that the resulting probability array meets simplex boundaries:
    
    Python
    
    ```
    assert np.all((probs >= 0.0) & (probs <= 1.0)), "Probability values outside [0, 1] range!"
    assert np.isclose(np.sum(probs), 1.0, atol=1e-6), "Probability distribution does not sum to 1.0!"
    ```
    
1. **Direct Memory Transfer:** Hand off the validated probability array via an in-memory reference directly to the **Classical Optimizer Loop** (during training) or the **Trained Hybrid QML Inference** module (during final prediction).
[[rules]]
[[quantumprob]]
