# Flexible Ingestion Specification: Handling Scanned vs. Manual Patient Data

## 1. Overview & Purpose

In clinical environments, patient data acquisition is rarely uniform. Clinicians may either manually input patient vitals through a digital interface or upload scanned diagnostic documents, lab printouts, and medical reports. This document outlines the architectural strategy and workflow extensions required to handle both manual inputs and optional document scans seamlessly without altering the core quantum-classical pipeline.

## 2. Dual-Path Ingestion Architecture

To accommodate fluctuating intake methods, the FastAPI backend implements a dual-path routing structure that normalizes all incoming data into a unified schema before it reaches the data engineering stage.

```
                  ┌──► [Manual Form Entry] ──┐
                  │                          ▼
[Client / UI] ────┤               [Unified Pydantic Validator] ──► [Processed Feature Vector]
                  │                          ▲
                  └──► [Scanned Document] ───┘
                            │
                            ▼
                   [OCR & Parser Service]
```

- **Path A: Direct Manual Intake (`POST /predict/manual`)**
    
    - Accepts structured JSON payloads containing direct key-value pairs for clinical parameters (`patient_age`, `systolic_bp`, etc.).
        
    - Bypasses parsing overhead and routes straight to validation.
        
- **Path B: Scanned Document Intake (`POST /predict/scan`)**
    
    - Accepts unstructured document formats (`.pdf`, `.png`, `.jpg`) via `multipart/form-data`.
        
    - Passes the file through an **OCR & Information Extraction Middleware** to pull text and map recognized values into the standard JSON dictionary format.
        

## 3. Scanned Data Processing Pipeline

When a scan is present, the file undergoes an automated extraction process before validation:

1. **Document Upload:** The client uploads a medical report image or PDF.
    
2. **Text Extraction (OCR):** An optical character recognition utility extracts all legible text strings from the document canvas.
    
3. **Regex & Entity Mapping:** A parsing layer scans the extracted text for clinical keywords (e.g., matching "Blood Sugar", "Glucose", or "FBS" to extract the corresponding numerical value).
    
4. **Schema Assembly:** The extracted parameters are compiled into a standard dictionary matching the base data contract.
    

## 4. Fallback & Handling Rules for Missing Scan Data

When scanning is optional or intermittent, the system enforces strict fallback and quality-control guardrails:

- **Rule 1: Incomplete Extraction Fallback:** If an uploaded scan is blurry, low-resolution, or missing mandatory clinical parameters (e.g., failing to detect `bmi` or `cholesterol_level`), the parser must not inject default or zero values. Instead, it must return a partial payload response along with an HTTP `422 Unprocessable Entity` error indicating which fields could not be extracted.
    
- **Rule 2: Manual Override Prompt:** When the OCR layer fails or encounters ambiguous text, the frontend UI must catch the validation error and prompt the clinician to either re-upload a clearer scan or manually switch to the form input view to fill in the missing metrics.
    
- **Rule 3: Unified Convergence:** Regardless of whether the data originated from a direct keyboard stroke or an OCR-scanned PDF, once the data dictionary is successfully assembled, it **must** pass through the exact same Pydantic sanitization and normalization rules before entering the **Processed Feature Vector** stage.
[[rawingestion]]
[[rules]]
