# Feature Specification: Disease Prediction & Confidence Score

## 1. Feature Overview & Purpose

The **Disease Prediction and Confidence Score** module serves as the final clinical decision-support translation layer of the QuantaCare platform. While the Trained Hybrid QML Inference module outputs a raw, continuous probability value ($\hat{y}$), this module transforms that numerical output into an interpretable, actionable disease prediction paired with a statistically robust model confidence metric.

  

By bridging raw quantum state probabilities with clinical diagnostic frameworks, this feature empowers medical evaluators with clear risk classifications, explicit confidence metrics, and deterministic boundary evaluations.

  

## 2. Mathematical Foundations & Prediction Mapping

The transformation from the continuous quantum inference score $\hat{y} \in [0.0, 1.0]$ to a discrete clinical prediction and confidence metric relies on standardized thresholding and distance-to-boundary calculations.

  

### A. Disease Prediction Classification Logic

The system maps the inference probability $\hat{y}$ against clinically validated risk thresholds to assign a categorical disease status:

  

- **Binary Classification Status:**
    
      
    - If $\hat{y} \ge 0.50$: **Positive Detection Indicator** (Early disease biomarker pattern identified).
        
          
        
    - If $\hat{y} < 0.50$: **Negative Detection Indicator** (Biomarker pattern within normal baseline limits).
        
          
        
- **Granular Risk Tier Assignment:**
    
      
    - **Low Risk:** $\hat{y} < 0.35$
        
          
        
    - **Moderate Risk:** $0.35 \le \hat{y} < 0.70$
        
          
        
    - **High Risk:** $\hat{y} \ge 0.70$
        
          
        

### B. Confidence Score Calculation

Model confidence quantifies the certainty of the QML inference based on how far the predicted probability lies from the uncertain decision boundary ($0.50$). The confidence score ($C$) is calculated as:

  

$$C = 2 \cdot \vert{}\hat{y} - 0.5\vert{} \times 100\%$$

- **Boundary Behavior:** When $\hat{y} = 0.50$ (maximum uncertainty), confidence drops to $0\%$. When $\hat{y} = 0.0$ or $\hat{y} = 1.0$ (maximum certainty), confidence reaches $100\%$.
    
      
    

## 3. Pipeline Lifecycle & In-Memory Data Flow

```
[Inference Probability Score ($\hat{y}$) from QML Engine]
                           │
                           ▼
[Threshold Evaluation & Categorical Status Mapping]
                           │
                           ▼
[Confidence Score Calculation ($C = 2 \cdot |\hat{y} - 0.5|$)]
                           │
                           ▼
[Structured Prediction Object (In-Memory RAM)]
                           │
                           ▼
[Handoff to Clinical Output & Reporting Module]
```

1. **Score Reception:** Ingests the raw probability score ($\hat{y}$) directly from the Trained Hybrid QML Inference module via in-memory function call.
    
      
    
2. **Threshold Processing:** Evaluates the score against binary and tier classification boundaries.
    
      
    
3. **Confidence Computation:** Computes the statistical certainty percentage using the distance formula.
    
      
    
4. **Payload Packaging:** Encapsulates the disease prediction, risk tier, and confidence score into a structured, in-memory dictionary for immediate dispatch to the clinical reporting engine.
    
      
    

## 4. Technical Stack & Integration

|**Component**|**Technology / Library**|**Role in Pipeline**|
|---|---|---|
|**Mathematical Engine**|NumPy / Python Math|Executes fast arithmetic operations for confidence score scaling.|
|**Data Structuring**|Python Standard Library (Dict / Dataclasses)|Packages prediction results for downstream reporting.|
|**Execution Runtime**|FastAPI Synchronous Thread|Processes prediction logic in local RAM with zero latency overhead.|

## 5. Implementation Guardrails & Anti-Context-Rot Rules

- **Strict In-Memory Packaging:** The structured prediction object must reside entirely in volatile system RAM. Never write intermediate prediction scores or confidence metrics to local disk storage.
    
      
    
- **Deterministic Thresholds:** Hardcoded threshold values ($0.35, 0.50, 0.70$) must remain uniform across all execution environments to ensure consistent clinical evaluations.
    
      
    
- **Bounded Confidence Output:** Assert that calculated confidence scores are strictly constrained between $0\%$and $100\%$ before passing the data to the reporting module.
[[prd]]
[[trd]]
[[appflow]]
[[systemarchitecture]]
[[rules]]
[[rules_pre]]
