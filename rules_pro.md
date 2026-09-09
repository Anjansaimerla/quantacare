## 1. Overview & Purpose

This document establishes the mandatory rules, operational procedures, and structural invariants for handling the **Processed Feature Vector** within the QuantaCare pipeline. Because this vector forms the exact mathematical bridge between classical data engineering and quantum state preparation, strict adherence to these rules is required to ensure numerical stability and prevent state corruption during simulation.

## 2. Core Operational Rules

- **Rule 1: Strict Immutability After Allocation** Once the processed feature vector is instantiated as a NumPy array in local RAM, it must be treated as strictly read-only. Downstream modules (such as quantum encoding or telemetry logging) are prohibited from mutating, overwriting, or re-scaling values within the array instance.
    
- **Rule 2: Fixed 6-Element Dimensionality** The vector shape must remain identically fixed to a 1D array of length 6 (`shape=(6,)`). Dynamic padding, feature dropping, or appending additional metrics without a formal architectural revision is strictly prohibited.
    
- **Rule 3: Explicit Float64 Precision Enforcement** All elements within the vector must be explicitly cast to `numpy.float64`. Implicit casting or lower-precision float formats (like `float32`) are banned to eliminate rounding drift during parameter-shift rotation gate computations (Rx​,Ry​).
    
- **Rule 4: Zero-Disk Persistence Mandate** The processed feature vector must never be written to disk, saved as an intermediate file, or cached in external storage during the request lifecycle. It exists exclusively in volatile system RAM to preserve modular monolith execution speed.
    

## 3. Step-by-Step Operational Procedure

### Phase 1: Receipt and Array Initialization

1. **Payload Reception:** Accept the normalized scaling output from the Classical Data Engineering module.
    
2. **Memory Allocation:** Initialize a contiguous memory block via NumPy with pre-allocated size and type:
    
    Python
    
    ```
    import numpy as np
    feature_vector = np.zeros(6, dtype=np.float64)
    ```
    

### Phase 2: Deterministic Mapping & Population

1. **Sequential Insertion:** Populate indices strictly according to the hardcoded architectural sequence:
    
    - `feature_vector[0] = scaled_patient_age`
        
    - `feature_vector[1] = scaled_systolic_bp`
        
    - `feature_vector[2] = scaled_diastolic_bp`
        
    - `feature_vector[3] = scaled_fasting_blood_sugar`
        
    - `feature_vector[4] = scaled_cholesterol_level`
        
    - `feature_vector[5] = scaled_bmi`
        
2. **Boundary Assertion Check:** Run a quick runtime assertion ensuring all array elements fall strictly within the normalized domain [0.0,1.0]:
    
    Python
    
    ```
    assert np.all((feature_vector >= 0.0) & (feature_vector <= 1.0)), "Feature vector out of normalized bounds!"
    ```
    

### Phase 3: Handoff to Quantum Encoding

1. **Reference Pass:** Pass the read-only feature vector reference directly via in-memory function call to the Quantum Encoding module.
    
2. **Lifecycle Termination:** Allow the vector reference to fall out of scope post-inference, releasing memory back to the Python garbage collector.
[[rules]]
[[processed]]
