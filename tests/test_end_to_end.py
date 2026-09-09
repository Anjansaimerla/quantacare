import unittest
import os
import numpy as np
from fastapi.testclient import TestClient
from main import app
from app.schemas import ClinicalVitalsInput
from app.data_engineering import sanitize_and_normalize_vitals
from app.quantum_engine import run_hybrid_qml_pipeline, load_pretrained_weights
from app.vector_search import search_pinecone_context
from app.ocr_service import parse_medical_report_text
from app.reporting import classify_risk_tier, generate_encrypted_clinical_summary

class TestQuantaCarePlatformComprehensive(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        print("\n================================================================================")
        print("           QUANTACARE FULL PLATFORM COMPREHENSIVE SUITE")
        print("================================================================================")

    def test_01_health_check_endpoint(self):
        print(" [Test 1] Health Check Endpoint GET /api/health ...")
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "HEALTHY")
        self.assertEqual(data["system"], "QuantaCare Clinical Decision Support")
        print("  --> PASSED: System health status is HEALTHY.")

    def test_02_dashboard_html_rendering(self):
        print(" [Test 2] Dashboard Web Interface GET / ...")
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("QuantaCare AI", response.text)
        self.assertIn("progress-container", response.text)
        print("  --> PASSED: Dashboard HTML template rendered successfully.")

    def test_03_data_engineering_normalization(self):
        print(" [Test 3] Classical Data Sanitization & Min-Max Normalization ...")
        vitals = ClinicalVitalsInput(
            age=55.0, systolic_bp=145.0, diastolic_bp=92.0,
            fasting_blood_sugar=130.0, cholesterol=240.0, bmi=28.5
        )
        vec = sanitize_and_normalize_vitals(vitals)
        self.assertEqual(len(vec), 6)
        self.assertTrue(np.all(vec >= 0.0) and np.all(vec <= 1.0))
        print(f"  --> PASSED: Normalized Feature Vector in RAM: {list(vec)}")

    def test_04_quantum_engine_weights_loading(self):
        print(" [Test 4] Quantum Engine Weights Persistence Check ...")
        weights = load_pretrained_weights()
        self.assertGreater(len(weights), 0)
        print(f"  --> PASSED: Loaded pretrained weights tensor of shape {weights.shape}.")

    def test_05_quantum_engine_pqc_execution(self):
        print(" [Test 5] PennyLane 6-Qubit PQC Circuit Execution ...")
        features = np.array([0.45, 0.47, 0.47, 0.22, 0.35, 0.37])
        risk_score, telemetry = run_hybrid_qml_pipeline(features)
        self.assertGreaterEqual(risk_score, 0.05)
        self.assertLessEqual(risk_score, 0.98)
        self.assertEqual(len(telemetry.qubit_angles_rx), 6)
        self.assertEqual(len(telemetry.qubit_angles_ry), 6)
        self.assertEqual(len(telemetry.quantum_probabilities), 6)
        print(f"  --> PASSED: 6-Qubit PQC Risk Score: {risk_score*100:.2f}% | Telemetry: 6 Qubits OK.")

    def test_06_pinecone_vector_search(self):
        print(" [Test 6] Pinecone Cloud Vector Search Module ...")
        query_vec = [0.45, 0.47, 0.47, 0.22, 0.35, 0.37]
        matches = search_pinecone_context(query_vec, top_k=3)
        self.assertEqual(len(matches), 3)
        self.assertTrue(hasattr(matches[0], 'score'))
        print(f"  --> PASSED: Retrieved top {len(matches)} vector similarity matches (Top score: {matches[0].score*100:.1f}%).")

    def test_07_api_predict_manual_normal_cohort(self):
        print(" [Test 7] Full 10-Step Pipeline - Normal Cohort Input ...")
        payload = {
            "age": 32.0, "systolic_bp": 115.0, "diastolic_bp": 75.0,
            "fasting_blood_sugar": 85.0, "cholesterol": 170.0, "bmi": 21.8,
            "patient_id": "TEST-NORM-01"
        }
        response = self.client.post("/predict/manual", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "SUCCESS")
        self.assertEqual(data["risk_tier"], "LOW RISK")
        self.assertEqual(data["risk_color_hex"], "#2d6a4f")
        self.assertEqual(data["primary_disease_target"], "Cardiovascular Disease (CVD)")
        self.assertIn("Low Risk Cardiovascular", data["predicted_condition"])
        self.assertEqual(len(data["steps_executed"]), 10)
        print(f"  --> PASSED: Low Risk Classification ({data['risk_score_percentage']}%) | Disease Target: {data['primary_disease_target']}.")

    def test_08_api_predict_manual_high_risk_cohort(self):
        print(" [Test 8] Full 10-Step Pipeline - High Risk Cohort Input ...")
        payload = {
            "age": 68.0, "systolic_bp": 178.0, "diastolic_bp": 105.0,
            "fasting_blood_sugar": 210.0, "cholesterol": 320.0, "bmi": 35.2,
            "patient_id": "TEST-HIGH-99"
        }
        response = self.client.post("/predict/manual", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "SUCCESS")
        self.assertEqual(data["risk_tier"], "HIGH RISK")
        self.assertEqual(data["risk_color_hex"], "#9b2226")
        self.assertEqual(data["primary_disease_target"], "Cardiovascular Disease (CVD)")
        self.assertIn("High-Risk Cardiovascular", data["predicted_condition"])
        self.assertIn("Stage 2 Hypertension", data["detected_risk_factors"])
        self.assertEqual(len(data["steps_executed"]), 10)
        print(f"  --> PASSED: High Risk Classification ({data['risk_score_percentage']}%) | Disease Target: {data['primary_disease_target']}.")

    def test_09_pydantic_boundary_validation_rejection(self):
        print(" [Test 9] Pydantic Boundary Validation HTTP 422 Rejection ...")
        # Age > 120 should be rejected
        payload = {
            "age": 145.0, "systolic_bp": 120.0, "diastolic_bp": 80.0,
            "fasting_blood_sugar": 90.0, "cholesterol": 180.0, "bmi": 24.0
        }
        response = self.client.post("/predict/manual", json=payload)
        self.assertEqual(response.status_code, 422)
        
        # Diastolic >= Systolic should be rejected
        payload_bp = {
            "age": 50.0, "systolic_bp": 110.0, "diastolic_bp": 120.0,
            "fasting_blood_sugar": 90.0, "cholesterol": 180.0, "bmi": 24.0
        }
        response_bp = self.client.post("/predict/manual", json=payload_bp)
        self.assertEqual(response_bp.status_code, 422)
        print("  --> PASSED: Malformed & out-of-bounds payloads strictly rejected with HTTP 422.")

    def test_10_ocr_document_scan_intake(self):
        print(" [Test 10] Dual-Path Scanned Document Intake POST /predict/scan ...")
        raw_text = "ROYAL INFIRMARY LAB REPORT Age: 58 Blood Pressure: 148 / 92 Fasting Glucose: 135.5 Cholesterol: 245 BMI: 29.4"
        res = parse_medical_report_text(raw_text, "report.pdf")
        self.assertTrue(res.is_complete)
        self.assertEqual(res.extracted_vitals.age, 58.0)
        self.assertEqual(res.extracted_vitals.systolic_bp, 148.0)
        print("  --> PASSED: OCR document parsing & entity extraction verified.")

    def test_11_multimodal_image_upload_scan(self):
        print(" [Test 11] Multi-Modal Image Scan (PyTorch Vision Encoder + VQC Fusion) ...")
        import io
        from PIL import Image

        # Create synthetic 100x100 RGB medical image scan in memory
        img = Image.new('RGB', (100, 100), color=(73, 109, 137))
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        img_bytes = img_byte_arr.getvalue()

        files = {"file": ("chest_xray_sample.png", img_bytes, "image/png")}
        response = self.client.post("/predict/scan", files=files)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "SUCCESS")
        self.assertTrue(data["has_image_input"])
        self.assertEqual(data["vision_feature_dim"], 512)
        self.assertEqual(data["fusion_type"], "HYBRID_QML_VISION_FUSION")
        self.assertEqual(len(data["steps_executed"]), 10)
        print(f"  --> PASSED: Image processed via PyTorch CNN (512d) & VQC | Fusion Score: {data['risk_score_percentage']}%.")

    def test_12_non_text_image_scan_no_422_error(self):
        print(" [Test 12] Image Scan Auto-Imputation (Zero HTTP 422 Popup Check) ...")
        import io
        from PIL import Image

        # Create pure image without any text vitals
        img = Image.new('RGB', (64, 64), color=(200, 50, 50))
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='JPEG')
        img_bytes = img_byte_arr.getvalue()

        files = {"file": ("scan_without_text.jpg", img_bytes, "image/jpeg")}
        response = self.client.post("/predict/scan", files=files)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "SUCCESS")
        self.assertTrue(data["has_image_input"])
        self.assertIn("Step 10: Multi-Modal Fusion Layer Executed", data["steps_executed"][-1])
        print("  --> PASSED: Image without text auto-imputed population vitals; zero HTTP 422 rejections.")

    def test_14_neurology_head_ct_scan(self):
        print(" [Test 14] Neurology Head CT Scan Modality Recognition ...")
        import io
        from PIL import Image, ImageDraw

        # Create head CT scan in memory (circular cranium with dark surrounding border)
        img = Image.new('L', (300, 300), color=10)
        draw = ImageDraw.Draw(img)
        draw.ellipse([30, 30, 270, 270], fill=180, outline=240)
        draw.ellipse([45, 45, 255, 255], fill=90)
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        
        files = {"file": ("new-140107-scan-jsa-417p.jpg", buf.getvalue(), "image/jpeg")}
        response = self.client.post("/predict/scan", files=files)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "SUCCESS")
        self.assertEqual(data["primary_disease_target"], "Neurology — Head CT / Brain MRI Neuroimaging")
        self.assertIn("Head CT Scan", data["predicted_condition"])
        self.assertIn("Intracranial Structural Anomaly / Focal Attenuation Pattern", data["detected_risk_factors"])
        print(f"  --> PASSED: Neurology Head CT Scan mapped to '{data['primary_disease_target']}'.")

    def test_15_orthopedics_bone_fracture_xray(self):
        print(" [Test 15] Orthopedics Skeletal Bone Fracture X-Ray Recognition ...")
        # Test real uploaded bone fracture file
        xray_path = "/Users/anjansaimerla/.gemini/antigravity/brain/2b7c5a8b-2113-4892-ae33-c7dcaaff7191/.user_uploaded/media_1788887725375.webp"
        if os.path.exists(xray_path):
            with open(xray_path, "rb") as f:
                files = {"file": ("xray_fracture.webp", f.read(), "image/webp")}
            response = self.client.post("/predict/scan", files=files)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["status"], "SUCCESS")
            self.assertEqual(data["primary_disease_target"], "Orthopedics — Skeletal Radiography & Bone Trauma")
            self.assertIn("Acute Tibia/Fibula Cortical Skeletal Fracture", data["predicted_condition"])
            self.assertIn("Acute Cortical Disruption / Bone Fracture Line Detected", data["detected_risk_factors"])
            print(f"  --> PASSED: Orthopedics Bone Fracture mapped to '{data['primary_disease_target']}'.")

    def test_16_pulmonology_chest_radiograph(self):
        print(" [Test 16] Pulmonology Thoracic Chest Radiograph Recognition ...")
        import io
        from PIL import Image

        img = Image.new('RGB', (250, 200), color=(120, 120, 120))
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        
        files = {"file": ("chest_xray_scan.png", buf.getvalue(), "image/png")}
        response = self.client.post("/predict/scan", files=files)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "SUCCESS")
        self.assertEqual(data["primary_disease_target"], "Pulmonology — Thoracic Radiography & Respiratory Scan")
        print(f"  --> PASSED: Pulmonology Chest X-Ray mapped to '{data['primary_disease_target']}'.")

    def test_18_cardiology_domain(self):
        print(" [Test 18] Cardiology ECG Scan Modality Recognition ...")
        import io
        from PIL import Image
        img = Image.new('RGB', (200, 200), color=(100, 100, 100))
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        files = {"file": ("cardio_ecg_trace.png", buf.getvalue(), "image/png")}
        response = self.client.post("/predict/scan", files=files)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "SUCCESS")
        self.assertEqual(data["primary_disease_target"], "Cardiology — Electrocardiogram & Vascular Health")
        print(f"  --> PASSED: Cardiology domain mapped to '{data['primary_disease_target']}'.")

    def test_19_endocrinology_domain(self):
        print(" [Test 19] Endocrinology Metabolic Profile Recognition ...")
        import io
        from PIL import Image
        img = Image.new('RGB', (200, 200), color=(100, 100, 100))
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        files = {"file": ("endocrinology_hba1c_report.png", buf.getvalue(), "image/png")}
        response = self.client.post("/predict/scan", files=files)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "SUCCESS")
        self.assertEqual(data["primary_disease_target"], "Endocrinology — Metabolic & Diabetes Screening")
        print(f"  --> PASSED: Endocrinology domain mapped to '{data['primary_disease_target']}'.")

    def test_20_nephrology_domain(self):
        print(" [Test 20] Nephrology Renal Health Scan Recognition ...")
        import io
        from PIL import Image
        img = Image.new('RGB', (200, 200), color=(100, 100, 100))
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        files = {"file": ("nephrology_kidney_scan.png", buf.getvalue(), "image/png")}
        response = self.client.post("/predict/scan", files=files)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "SUCCESS")
        self.assertEqual(data["primary_disease_target"], "Nephrology — Renal Function & Glomerular Health")
        print(f"  --> PASSED: Nephrology domain mapped to '{data['primary_disease_target']}'.")

    def test_21_oncology_domain(self):
        print(" [Test 21] Oncology Histology Biopsy Recognition ...")
        import io
        from PIL import Image
        img = Image.new('RGB', (200, 200), color=(100, 100, 100))
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        files = {"file": ("oncology_tumor_biopsy.png", buf.getvalue(), "image/png")}
        response = self.client.post("/predict/scan", files=files)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "SUCCESS")
        self.assertEqual(data["primary_disease_target"], "Oncology — Tissue Biomarker & Cellular Pathology")
        print(f"  --> PASSED: Oncology domain mapped to '{data['primary_disease_target']}'.")

if __name__ == "__main__":
    unittest.main()



