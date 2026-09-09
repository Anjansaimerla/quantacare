# Rules & Operational Procedure: Trained Hybrid QML Inference

## 1. Overview & Purpose

This document establishes the mandatory operational rules, mathematical invariants, and step-by-step procedures governing the **Trained Hybrid QML Inference** module within QuantaCare. Because this phase delivers the final quantitative risk score to clinical evaluators and triggers downstream cloud context retrieval, strict adherence to these rules ensures deterministic execution, zero gradient overhead, and strict data privacy.

## 2. Core Operational Rules

- **Rule 1: Strict Forward-Pass Isolation (Zero Gradient Tracking)** Automatic differentiation and gradient tracking frameworks must be disabled during the inference pass. Because weight optimization is complete, computing gradients is unnecessary and wastes CPU cycles.
    
- **Rule 2: Locked Parameter Invariance** Optimal variational parameters (θ∗) loaded into the circuit must remain strictly read-only throughout the inference execution. Modifying weights during the forward pass is prohibited.
    
- **Rule 3: Deterministic Reproducibility** Given an identical processed feature vector and locked parameter set θ∗, the inference engine must yield the exact same floating-point risk probability score (y^​) across repeated executions.
    
- **Rule 4: Zero-Disk Persistence Mandate** Intermediate quantum state tensors, inference scores, and patient health metrics must remain exclusively in volatile system RAM. Never write patient-specific inference results to local disk or unencrypted storage.
    

## 3. Step-by-Step Operational Procedure

### Phase 1: Parameter & Feature Ingestion

1. **Feature Retrieval:** Ingest the read-only 6-element processed feature vector from the Classical Data Engineering module via in-memory function call.
    
2. **Weight Loading:** Load the optimal variational parameter array (\theta^^*) resulting from the converged classical optimizer loop into volatile RAM.
    

### Phase 2: Forward-Pass Circuit Execution

1. **Circuit Binding:** Initialize the 6-qubit quantum register, binding the feature values to encoding rotation gates (Rx​,Ry​) and the parameters to the ansatz rotation gates using θ∗.
    
2. **State Evolution:** Execute the single-pass statevector simulation locally on CPU cores to evolve the quantum state tensor without backpropagation.
    

### Phase 3: Probability Extraction & Tier Assignment

1. **Expectation Mapping:** Extract the terminal Pauli-Z expectation value and compute the definitive disease risk probability score:
    
    y^​=P(Risk=1)=2⟨Zreadout​⟩+1​
    
2. **Risk Tier Categorization:** Map y^​ to its corresponding clinical severity tier:
    
    - **Low Risk:** y^​<0.35
        
    - **Moderate Risk:** 0.35≤y^​<0.70
        
    - **High Risk:** y^​≥0.70
        

### Phase 4: Dual Concurrent Handoff

1. **Vector DB Dispatch:** Forward the inference score and feature signature concurrently to the **Pinecone Cloud Vector Database** client to execute semantic similarity searches against historical clinical guidelines.
    
2. **Reporting Handoff:** Pass the final risk probability (y^​), risk tier, and feature array via in-memory function call to the **Clinical Output & Reporting** module for color-coded report assembly.
[[rules]]
[[trained]]
