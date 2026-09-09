# Input Data Validation & Rules Specification: QuantaCare

## 1. Overview & Purpose
This document establishes the strict input validation rules, data constraints, and sanitization policies for raw patient clinical vitals entering the QuantaCare pipeline. Because downstream quantum encoding and classical optimization rely heavily on stable numerical ranges, enforcing strict boundary checks at the ingestion boundary is mandatory to prevent execution errors or distorted model inferences.

---

## 2. Ingestion Rules & Data Constraints
All incoming client payloads submitted to the prediction endpoint must strictly adhere to the following schema and boundary rules. Any parameter violating these constraints will trigger an immediate rejection by the Pydantic validation layer.

| Field Name | Data Type | Valid Range / Constraint | Description / Clinical Metric |
| :--- | :--- | :--- | :--- |
| **`patient_age`** | `integer` | $18 \le x \le 120$ | Chronological age of the patient in years. |
| **`systolic_bp`** | `integer` | $70 \le x \le 200$ | Systolic blood pressure measured in $\text{mmHg}$. |
| **`diastolic_bp`** | `integer` | $40 \le x \le 130$ | Diastolic blood pressure measured in $\text{mmHg}$. |
| **`fasting_blood_sugar`** | `float` | $70.0 \le x \le 300.0$ | Blood glucose concentration measured in $\text{mg/dL}$. |
| **`cholesterol_level`** | `float` | $100.0 \le x \le 450.0$ | Total serum cholesterol level measured in $\text{mg/dL}$. |
| **`bmi`** | `float` | $10.0 \le x \le 60.0$ | Body Mass Index calculated as $\text{weight (kg)} / \text{height (m)}^2$. |

---

## 3. Strict Input Rules for Development & Execution

* **Rule 1: Strict Type Enforcement (No Implicit Casting):** 
  Incoming values must match their designated data types (integers must not be passed as strings, floats must accept valid decimals). Implicit string-to-number casting by the API framework must be explicitly validated to prevent injection or malformation vulnerabilities.
* **Rule 2: Zero Tolerance for Null/Missing Fields:** 
  All six parameters are mandatory for every prediction request. If any required field is omitted from the JSON payload, the validator must flag it as a missing field rather than assigning default or zero values (which would skew the normalized feature vector).
* **Rule 3: Immediate Rejection on Boundary Violation:** 
  If any clinical parameter falls outside its defined medical range (e.g., a blood pressure of $300\text{ mmHg}$ or a negative age), the FastAPI backend must halt processing instantly and return a HTTP `422 Unprocessable Entity` status code containing a descriptive error payload.
* **Rule 4: Sanitization of Payload Headers:** 
  All incoming requests must be parsed as clean JSON with proper UTF-8 encoding. Any unexpected payload structures, nested objects, or anomalous script tags must be stripped or rejected at the boundary layer before reaching the classical data engineering stage.

---

## 4. Multi-Modal and Scanned Data Input Rules

* **Rule 5: Dual-Path Validation Consistency:** 
  Whether data is received via direct manual form submission (`POST /predict/manual`) or extracted from an optional document scan (`POST /predict/scan`), the resulting data dictionary must pass through the exact same Pydantic validation rules and boundaries.
* **Rule 6: OCR Incomplete Extraction Handling:** 
  When handling optional document scans, if the OCR parsing layer fails to extract mandatory clinical parameters or detects illegible text, it must not fabricate or default values. It must return a `422 Unprocessable Entity` status code detailing the missing extracted fields.
* **Rule 7: Fallback Prompting:** 
  If scan extraction fails due to low resolution or missing data points, the UI layer must prompt the operator to manually override and supply the required numerical metrics via the standard form interface.
[[rawingestion]]
[[flexi]]
[[rules]]

