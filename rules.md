# Project Rules & Agent Guidelines: QuantaCare Prototype

## 1. Problem Statement
Early disease detection in modern healthcare is frequently bottlenecked by the inability of traditional classical models to capture complex, non-linear correlations in early-stage multi-variable patient biomarkers. Furthermore, while Quantum Machine Learning (QML) offers advanced pattern recognition capabilities, developers face severe architectural hurdles: physical quantum hardware is inaccessible for rapid prototyping, and naive multi-service designs introduce massive network latencies that break iterative hybrid training loops. 

**QuantaCare** solves this by establishing a high-performance **Modular Monolith** prototype using Python and FastAPI. It bridges classical data preprocessing with localized quantum circuit simulations (via PennyLane/Qiskit) and cloud-managed semantic retrieval (via Pinecone). The core challenge is maintaining low-latency, in-memory execution for the hybrid quantum optimization loop while delivering actionable, explainable, and color-coded clinical outputs to medical evaluators.

---

## 2. Core Engineering & Architecture Rules for the Agent

When writing code, configuring modules, or orchestrating the QuantaCare prototype, the AI agent must strictly adhere to the following rules:

* **Modular Monolith Integrity:** Never split core QML training, data engineering, or encoding loops into external HTTP microservices. All mathematical and simulation steps must execute synchronously and locally within the Python runtime to eliminate network bottlenecks.
* **FastAPI & Pydantic Enforcement:** All incoming client requests containing manual clinical vitals must pass through strict Pydantic schemas at the FastAPI boundary layer (`POST /predict`). Malformed, out-of-bound, or missing payloads must be immediately rejected with a `422 Unprocessable Entity` response.
* **State Pipeline Sequence:** Maintain strict adherence to the 10-step pipeline order:
  1. Client Ingestion Request
  2. FastAPI & Pydantic Validation
  3. Classical Data Engineering (Sanitization & Normalization)
  4. Processed Feature Vector Generation (In-memory array)
  5. Quantum Encoding ($R_x, R_y$ Feature Mapping)
  6. Quantum Circuit Execution (Parametrized Quantum Circuits via PennyLane/Qiskit)
  7. Quantum Probability Measurement
  8. Classical Optimizer Loop (COBYLA/Adam weight updates in RAM)
  9. Trained Hybrid QML & Pinecone Cloud Vector Search (Context retrieval)
  10. Clinical Output & Reporting (Color-coded severity score & encrypted summary)
* **Isolated Cloud Retrieval:** Restrict external cloud interactions strictly to **Pinecone** for semantic similarity matching of patient feature vectors against historical guidelines. Keep all iterative gradient updates and QML simulations strictly local.
* **Clinical Output Standards:** Ensure final outputs always translate numerical model inferences into a clear, visual severity tier (Low, Moderate, High) assigned with explicit color coding alongside a structured summary report.
  
  [[prd]]
  [[trd]]
  [[appflow]]
  [[systemarchitecture]]
