# Generates a realistic synthetic dataset for training
import pandas as pd
import numpy as np
import random

random.seed(42)
np.random.seed(42)

def generate_dataset(n_students=500, months=6):
    records = []
    for s in range(n_students):
        student_id = f"STU{s+100:04d}"
        prev_sem = round(random.uniform(50, 100), 1)
        trend_base = random.choice(["improving", "declining", "stable"])
        base_pct = random.uniform(55, 98)

        for m in range(1, months+1):
            # Simulate trend
            if trend_base == "improving":
                pct = min(100, base_pct + m * random.uniform(0.5, 2.0))
            elif trend_base == "declining":
                pct = max(30, base_pct - m * random.uniform(0.5, 2.0))
            else:
                pct = base_pct + random.uniform(-3, 3)

            lectures_conducted = random.randint(18, 24)
            lectures_attended = max(0, int(lectures_conducted * pct / 100))
            absences = lectures_conducted - lectures_attended

            # Label
            if pct >= 75:
                risk = "SAFE"
            elif pct >= 65:
                risk = "WARNING"
            else:
                risk = "HIGH_RISK"

            records.append({
                "student_id": student_id,
                "month": m,
                "subject": f"SUB{random.randint(1,5)}",
                "lectures_conducted": lectures_conducted,
                "lectures_attended": lectures_attended,
                "absences": absences,
                "attendance_percentage": round(pct, 2),
                "prev_sem_attendance": prev_sem,
                "trend": trend_base,
                "risk_label": risk
            })

    df = pd.DataFrame(records)
    df.to_csv("attendance_dataset.csv", index=False)
    print(f"✅ Dataset saved: {len(df)} records")
    return df

if __name__ == "__main__":
    generate_dataset()