import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
import joblib
import json

# ── Load dataset ──────────────────────────────────────────────────────
df = pd.read_csv("attendance_dataset.csv")

# ── Feature engineering ───────────────────────────────────────────────
trend_map = {"improving": 1, "stable": 0, "declining": -1}
df["trend_encoded"] = df["trend"].map(trend_map)

FEATURES = [
    "attendance_percentage",
    "absences",
    "trend_encoded",
    "lectures_conducted",
    "lectures_attended",
    "prev_sem_attendance",
    "month",
]

X = df[FEATURES]
y = df["risk_label"]

# ── Train / test split ────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ── Train Random Forest ───────────────────────────────────────────────
clf = RandomForestClassifier(
    n_estimators=100,
    max_depth=12,
    min_samples_leaf=5,
    random_state=42,
    n_jobs=-1,       # uses all CPU cores
    class_weight="balanced"
)
clf.fit(X_train, y_train)

# ── Evaluate ──────────────────────────────────────────────────────────
y_pred = clf.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"\n📊 Accuracy: {acc:.4f}")
print(classification_report(y_test, y_pred))

# ── Save artifacts ────────────────────────────────────────────────────
joblib.dump(clf, "model.joblib")

metadata = {
    "features": FEATURES,
    "classes": clf.classes_.tolist(),
    "accuracy": round(acc, 4),
    "trend_map": trend_map
}
with open("model_meta.json", "w") as f:
    json.dump(metadata, f, indent=2)

print("✅ Model saved → model.joblib + model_meta.json")