# Rules & Operational Procedure: Disease Prediction & Confidence Score

## 1. Overview & Purpose

This document establishes the mandatory operational rules, classification invariants, and step-by-step procedures governing the **Disease Prediction & Confidence Score** module within QuantaCare. Because this feature translates raw quantum inference probabilities into actionable clinical classifications and certainty metrics, strict adherence to these rules ensures diagnostic consistency, strict boundary adherence, and reliable reporting.

  

## 2. Core Operational Rules

- **Rule 1: Uniform Threshold Invariant**
    
    Classification boundaries (Binary threshold at $0.50$; Risk tiers at $0.35$ and $0.70$) must remain strictly uniform across all system environments. Arbitrary runtime modification of classification thresholds is banned.
    
      
    
- **Rule 2: Bounded Confidence Scaling**
    
    Model confidence scores ($C$) must be calculated deterministically using the distance-to-boundary formula and bounded strictly between $0\%$ and $100\%$ ($0.0 \le C \le 100.0$).
    
      
    
- **Rule 3: Zero-Disk Storage Mandate**
    
    Structured prediction objects, risk tiers, and confidence metrics must reside exclusively in volatile system RAM during request processing. Writing patient prediction outputs to local disk storage is strictly prohibited.
    
      
    
- **Rule 4: Deterministic Mapping Guarantee**
    
    Given an identical inference probability score ($\hat{y}$), the prediction module must consistently output the exact same binary classification, risk tier, and confidence percentage.
    
      
    

## 3. Step-by-Step Operational Procedure

### Phase 1: Probability Ingestion & Verification

1. **Score Reception:** Ingest the continuous probability score ($\hat{y} \in [0.0, 1.0]$) directly from the Trained Hybrid QML Inference module via in-memory function call.
    
      
    
2. **Bounds Assertion:** Verify that the incoming probability adheres to valid range constraints:
    
      
    
    Python
    
    ```
    assert 0.0 <= y_pred <= 1.0, "Inference probability out of bounds!"
    ```
    

### Phase 2: Categorical Classification & Tier Assignment

1. **Binary Status Evaluation:** Map $\hat{y}$ against the core classification threshold:
    
      
    - If $\hat{y} \ge 0.50 \rightarrow$ Status: **Positive Detection Indicator**
        
          
        
    - If $\hat{y} < 0.50 \rightarrow$ Status: **Negative Detection Indicator**
        
          
        
2. **Granular Risk Tier Assignment:** Evaluate $\hat{y}$ against severity boundaries:
    
      
    - **Low Risk:** $\hat{y} < 0.35$
        
          
        
    - **Moderate Risk:** $0.35 \le \hat{y} < 0.70$
        
          
        
    - **High Risk:** $\hat{y} \ge 0.70$
        
          
        

### Phase 3: Confidence Score Computation

1. **Distance Calculation:** Compute statistical certainty using the absolute distance from the uncertain decision boundary ($0.50$):
    
      
    
    $$C = 2 \cdot \vert{}\hat{y} - 0.5\vert{} \times 100\%$$
    
2. **Precision Formatting:** Round the resulting confidence score to two decimal places for clinical readability.
    
      
    

### Phase 4: Packaging & Downstream Handoff

1. **Object Assembly:** Encapsulate the prediction status, risk tier, confidence percentage, and raw probability into a structured in-memory dictionary.
    
      
    
2. **Reporting Handoff:** Pass the structured prediction object via in-memory function call directly to the **Clinical Output & Reporting** module for color-coded final rendering.
   
   [[rules]]
[[prediction]]
