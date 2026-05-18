from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import joblib, json, numpy as np

app = FastAPI(title="Sankalan AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],  # Node.js server
    allow_methods=["*"], allow_headers=["*"],
)

# ── Load model once at startup ────────────────────────────────────────
clf = joblib.load("model.joblib")
with open("model_meta.json") as f:
    META = json.load(f)

TREND_MAP = META["trend_map"]
FEATURES  = META["features"]

# ── Schemas ───────────────────────────────────────────────────────────
class StudentInput(BaseModel):
    student_id: str
    attendance_percentage: float
    absences: int
    trend: str                  # "improving" | "stable" | "declining"
    lectures_conducted: int
    lectures_attended: int
    prev_sem_attendance: float
    month: Optional[int] = 1

class BatchInput(BaseModel):
    students: List[StudentInput]

# ── Helpers ───────────────────────────────────────────────────────────
def build_features(s: StudentInput):
    trend_enc = TREND_MAP.get(s.trend, 0)
    return [
        s.attendance_percentage,
        s.absences,
        trend_enc,
        s.lectures_conducted,
        s.lectures_attended,
        s.prev_sem_attendance,
        s.month,
    ]

def predict_one(s: StudentInput) -> dict:
    feat = np.array([build_features(s)])
    risk_level = clf.predict(feat)[0]
    proba = clf.predict_proba(feat)[0]
    classes = clf.classes_
    risk_prob = round(float(proba[list(classes).index(risk_level)]), 4)
    return {
        "student_id": s.student_id,
        "attendance": s.attendance_percentage,
        "risk_level": risk_level,
        "risk_probability": risk_prob,
    }

# ── Routes ────────────────────────────────────────────────────────────
@app.get("/")
def health():
    return {"status": "ok", "model_accuracy": META["accuracy"]}

@app.post("/predict")
def predict_single(body: StudentInput):
    try:
        return predict_one(body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/batch")
def predict_batch(body: BatchInput):
    try:
        return {"results": [predict_one(s) for s in body.students]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run: uvicorn main:app --port 8001 --reload