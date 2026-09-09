import unittest
import numpy as np
from fastapi.testclient import TestClient
from main import app
from app.schemas import ClinicalVitalsInput
from app.data_engineering import sanitize_and_normalize_vitals
from app.quantum_engine import run_hybrid_qml_pipeline
from app.vector_search import search_pinecone_context
from app.ocr_service import parse_medical_report_text

class TestQuantaCarePipeline(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        self.valid_vitals = {
            "age": 55.0,
            "systolic_bp": 145.0,
            "diastolic_bp": 92.0,
            "fasting_blood_sugar": 130.0,
            "cholesterol": 240.0,
            "bmi": 28.5,
            "patient_id": "TEST-PATIENT-101"
        }

    def test_pydantic_validation_success(self):
        vitals = ClinicalVitalsInput(**self.valid_vitals)
        self.assertEqual(vitals.age, 55.0)
        self.assertEqual(vitals.systolic_bp, 145.0)

    def test_pydantic_validation_out_of_bounds_422(self):
        # Age > 120 should fail validation
        invalid_payload = self.valid_vitals.copy()
        invalid_payload["age"] = 150.0
        response = self.client.post("/predict/manual", json=invalid_payload)
        self.assertEqual(response.status_code, 422)

    def test_pydantic_validation_diastolic_greater_than_systolic_422(self):
        # Diastolic BP >= Systolic BP should fail validation
        invalid_payload = self.valid_vitals.copy()
        invalid_payload["systolic_bp"] = 100.0
        invalid_payload["diastolic_bp"] = 120.0
        response = self.client.post("/predict/manual", json=invalid_payload)
        self.assertEqual(response.status_code, 422)

    def test_data_engineering_normalization(self):
        vitals = ClinicalVitalsInput(**self.valid_vitals)
        vec = sanitize_and_normalize_vitals(vitals)
        self.assertEqual(len(vec), 6)
        self.assertTrue(np.all(vec >= 0.0) and np.all(vec <= 1.0))

    def test_quantum_engine_simulation(self):
        features = np.array([0.45, 0.47, 0.47, 0.22, 0.35, 0.37])
        risk_score, telemetry = run_hybrid_qml_pipeline(features)
        self.assertGreaterEqual(risk_score, 0.0)
        self.assertLessEqual(risk_score, 1.0)
        self.assertEqual(len(telemetry.qubit_angles_rx), 6)
        self.assertEqual(len(telemetry.qubit_angles_ry), 6)
        self.assertGreater(telemetry.optimization_epochs, 0)

    def test_vector_search(self):
        query_vec = [0.45, 0.47, 0.47, 0.22, 0.35, 0.37]
        matches = search_pinecone_context(query_vec, top_k=3)
        self.assertEqual(len(matches), 3)
        self.assertTrue(hasattr(matches[0], 'score'))

    def test_complete_api_predict_manual_endpoint(self):
        response = self.client.post("/predict/manual", json=self.valid_vitals)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "SUCCESS")
        self.assertIn("risk_score_percentage", data)
        self.assertIn("risk_tier", data)
        self.assertIn("risk_color_hex", data)
        self.assertEqual(len(data["steps_executed"]), 10)

    def test_ocr_parser_service(self):
        raw_report = "Patient Age: 62 Blood Pressure: 150/95 Fasting Glucose: 140 Serum Cholesterol: 260 BMI: 31.2"
        res = parse_medical_report_text(raw_report, "lab_report.pdf")
        self.assertTrue(res.is_complete)
        self.assertEqual(res.extracted_vitals.age, 62.0)
        self.assertEqual(res.extracted_vitals.systolic_bp, 150.0)

if __name__ == "__main__":
    unittest.main()
