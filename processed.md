# Feature Specification: Processed Feature Vector

## 1. Feature Overview & Purpose

The **Processed Feature Vector** serves as the immutable data contract and state bridge between classical data engineering and quantum machine learning simulation within the QuantaCare platform. Once raw patient vitals (whether submitted via manual forms or extracted from optional OCR scans) undergo Pydantic validation, sanitization, and Min-Max normalization, they are encapsulated into this structured, high-performance in-memory array.

This feature ensures that clinical attributes maintain a strict, deterministic sequence before being translated into quantum states by rotation gates, completely eliminating data alignment errors during simulation execution.

## 2. Structural Schema & Deterministic Index Mapping

To prevent context drift and structural misinterpretation across modules, the processed feature vector is strictly mapped to a 6-element floating-point array (`numpy.ndarray` with `dtype=float64`). Each index corresponds to a specific normalized clinical parameter scaled to the continuous interval [0,1].

|Array Index|Feature Name|Normalized Value Range|Clinical Description|
|---|---|---|---|
|**Index `0`**|`scaled_patient_age`|[0.0,1.0]|Normalized chronological age derived from baseline bounds (18to 120 years).|
|**Index `1`**|`scaled_systolic_bp`|[0.0,1.0]|Normalized systolic blood pressure derived from baseline bounds (70 to 200 mmHg).|
|**Index `2`**|`scaled_diastolic_bp`|[0.0,1.0]|Normalized diastolic blood pressure derived from baseline bounds (40 to 130 mmHg).|
|**Index `3`**|`scaled_fasting_blood_sugar`|[0.0,1.0]|Normalized blood glucose concentration derived from baseline bounds (70.0 to 300.0 mg/dL).|
|**Index `4`**|`scaled_cholesterol_level`|[0.0,1.0]|Normalized total serum cholesterol derived from baseline bounds (100.0 to 450.0 mg/dL).|
|**Index `5`**|`scaled_bmi`|[0.0,1.0]|Normalized Body Mass Index derived from baseline bounds (10.0 to 60.0).|

## 3. In-Memory Lifecycle & State Transition

```
[Classical Data Engineering Module]
               │
               ▼ (NumPy Array Allocation in RAM)
[Processed Feature Vector (Immutable State)]
               │
               ├──────────────────────────────┐
               ▼                              ▼
[Quantum Encoding Layer ($R_x, R_y$ Gates)]   [Logging / Telemetry Context (Optional)]
```

1. **Instantiation:** Created instantly upon the completion of Min-Max feature scaling within the classical preprocessing block.
    
2. **Immutability Principle:** Once allocated in RAM, the processed feature vector is treated as read-only. Downstream quantum modules may read index values to assign rotation angles, but they are strictly prohibited from mutating the array values in-place.
    
3. **Memory Reclamation:** The vector resides in local volatile RAM for the duration of the synchronous request lifecycle, automatically marked for garbage collection once the final clinical prediction and report are generated.
    

## 4. Implementation Guidelines & Architectural Guardrails

- **Zero Serialization Overhead:** Never serialize the processed feature vector to disk, JSON files, or external databases prior to quantum simulation. Keeping the array entirely in-memory preserves the microsecond-level latency mandated by the modular monolith pattern.
    
- **Strict Index Guardrails:** Any modification to the length or sequence of the feature vector requires simultaneous updates in the Quantum Encoding module. Hardcoding array indices or using unstructured dictionaries at this stage is strictly prohibited to avoid model distortion.
    
- **Type Consistency:** Ensure all elements retain explicit `float64` precision to prevent floating-point truncation artifacts from altering quantum rotation angle calculations (Rx​,Ry​).
[[prd]]
[[trd]]
[[appflow]]
[[systemarchitecture]]
[[classicaldataeng]]
[[rules]]
[[quantumencoding]]
[[rules_pro]]

