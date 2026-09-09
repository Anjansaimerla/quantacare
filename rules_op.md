# Rules & Operational Procedure: Classical Optimizer Loop

## 1. Overview & Purpose

This document establishes the mandatory operational rules, mathematical invariants, and step-by-step procedures governing the **Classical Optimizer Loop** within QuantaCare. Because this module manages weight updates and loss minimization for the hybrid quantum-classical pipeline, strict adherence to these rules ensures stable convergence, prevents numerical divergence, and maintains microsecond-level modular monolith performance.

## 2. Core Operational Rules

- **Rule 1: In-Memory Weight Mutability Only** Trainable weight tensors (θweights​) must be stored, updated, and mutated exclusively within volatile system RAM. Serializing intermediate model weights to disk during training iterations is strictly forbidden.
    
- **Rule 2: Strict Epsilon Clipping for Loss Stability** When computing Binary Cross-Entropy (BCE) loss, strict numerical epsilon clipping (ϵ=10−7) must be applied to predicted probabilities to prevent infinite logarithmic singularities (log(0) errors).
    
- **Rule 3: Enforced Epoch Hard Limits** All training and optimization loops must enforce a strict maximum epoch cap (e.g., max_iter=100) to prevent infinite execution hangs in the event of an optimization plateau.
    
- **Rule 4: Deterministic Parameter Initialization** Initial weight vectors (θ0​) must be initialized using a fixed random seed to guarantee reproducible optimization trajectories and consistent model behavior across diagnostic evaluations.
    

## 3. Step-by-Step Operational Procedure

### Phase 1: Probability Ingestion & Loss Evaluation

1. **Probability Reception:** Receive the validated 1D NumPy probability array (y^​) from the Quantum Probability measurement module.
    
2. **Ground Truth Comparison:** Retrieve the target clinical label (y∈{0,1}) associated with the patient record.
    
3. **BCE Loss Calculation:** Compute the scalar loss value using stabilized cross-entropy:
    
    L(θ)=−(ylog(y^​+ϵ)+(1−y)log(1−y^​+ϵ))
    

### Phase 2: Gradient Computation & Parameter Update

1. **Optimizer Execution:** Pass the loss and current parameters into the selected solver:
    
    - **COBYLA Path:** Evaluate direct simplex search steps based on scalar loss values.
        
    - **Adam Path:** Compute analytical parameter-shift gradients (∂θi​∂L​) and apply learning rate updates:
        
        θt+1​=θt​−v^t​![](data:image/svg+xml;utf8,<svg%20xmlns="http://www.w3.org/2000/svg"%20width="400em"%20height="1.08em"%20viewBox="0%200%20400000%201080"%20preserveAspectRatio="xMinYMin%20slice"><path%20d="M95,702c-2.7,0,-7.17,-2.7,-13.5,-8c-5.8,-5.3,-9.5,-10,-9.5,-14c0,-2,0.3,-3.3,1,-4c1.3,-2.7,23.83,-20.7,67.5,-54c44.2,-33.3,65.8,-50.3,66.5,-51c1.3,-1.3,3,-2,5,-2c4.7,0,8.7,3.3,12,10s173,378,173,378c0.7,0,35.3,-71,104,-213c68.7,-142,137.5,-285,206.5,-429c69,-144,104.5,-217.7,106.5,-221l0%20-0c5.3,-9.3,12,-14,20,-14H400000v40H845.2724s-225.272,467,-225.272,467s-235,486,-235,486c-2.7,4.7,-9,7,-19,7c-6,0,-10,-1,-12,-3s-194,-422,-194,-422s-65,47,-65,47zM834%2080h400000v40h-400000z"></path></svg>)​+ϵη​m^t​
        
2. **RAM In-Place Mutation:** Update the weight tensor array references directly in local memory.
    

### Phase 3: Convergence Check & Loop Control

1. **Tolerance Assertion:** Check if gradient magnitude or loss delta satisfies convergence criteria (ΔL≤10−4 or tol≤10−4).
    
2. **Routing Decision:**
    
    - **If Converged or Max Epoch Reached:** Terminate the loop, lock final weights (θ∗), and route the trained model output to the **Trained Hybrid QML Inference** module.
        
    - **If Unconverged:** Feed the updated weight tensor (θweights​) back into the **Parametrised Quantum Circuit (PQC)** execution module for the next epoch iteration.
[[rules]]
[[optimizer]]
