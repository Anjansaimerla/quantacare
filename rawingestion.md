# Feature Specification: Raw Patient Ingestion (Manual Clinical Vitals)

## 1. Feature Overview & Purpose

The **Raw Patient Ingestion** feature serves as the primary entry point for the QuantaCare diagnostic pipeline. Designed specifically for clinical evaluators and prototype operators, this module captures essential manual patient vitals and health markers through a clean, streamlined client-side interface. By bypassing complex external hardware integrations for this iteration, it ensures reliable, deterministic data collection required to drive subsequent classical preprocessing and quantum machine learning simulations.

## 2. Technical Scope & Data Contract

This feature handles the structured intake of numerical health indicators. To prevent "context rot" and ensure long-term maintainability across multi-developer environments, the data contract is strictly bound to explicit clinical parameters rather than generic, unbounded dictionaries.

### Expected Input Parameters (JSON Payload Schema)

- **`patient_age`**: Integer (`18` to `120`) representing the patient's chronological age.
    
- **`systolic_bp`**: Integer (`70` to `200`) representing systolic blood pressure (mmHg).
    
- **`diastolic_bp`**: Integer (`40` to `130`) representing diastolic blood pressure (mmHg).
    
- **`fasting_blood_sugar`**: Float (`70.0` to `300.0`) representing blood glucose levels (mg/dL).
    
- **`cholesterol_level`**: Float (`100.0` to `450.0`) representing total serum cholesterol (mg/dL).
    
- **`bmi`**: Float (`10.0` to `60.0`) representing Body Mass Index.
    

## 3. Integration with the Modular Monolith Pipeline

Once submitted by the client interface via an HTTP `POST` request, the raw patient ingestion payload interacts directly with the backend architecture:

1. **FastAPI Endpoint Boundary:** Receives the raw JSON payload at `/predict`.
    
2. **Pydantic Validation Guard:** Intercepts the incoming data to evaluate types, missing fields, and range boundaries. If any parameter falls outside the defined clinical thresholds, ingestion is immediately halted, returning a `422 Unprocessable Entity` error.
    
3. **Data Hand-off:** Validated raw parameters are instantly handed off via in-memory function calls to the **Classical Data Engineering** module for sanitization and normalization into a **Processed Feature Vector**, ensuring zero network overhead between ingestion and compute layers.
    

## 4. Implementation Guidelines & Guardrails

- **Stateless Intake:** The ingestion handler must remain entirely stateless; it processes incoming metrics for immediate pipeline execution without writing unencrypted raw data to local disk storage.
    
- **Boundary Enforcement:** Never allow null or string-injected values to pass past the ingestion boundary. Strict typing enforced by Pydantic is mandatory.
    
- **UI Simplicity:** Keep the frontend input form compact and focused strictly on the required numerical fields to minimize operator friction during live demonstrations.
[[rules]]
[[prd]]
[[trd]]
[[appflow]]
[[systemarchitecture]]
[[classicaldataeng]]

