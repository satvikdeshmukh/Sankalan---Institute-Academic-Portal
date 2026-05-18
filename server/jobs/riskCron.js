const cron = require('node-cron');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { sendRiskNotification } = require('../services/notificationService');

const prisma = new PrismaClient();
const API_BASE = `http://localhost:${process.env.PORT || 3001}/api`;

async function runWeeklyRiskScan() {
  console.log('[RiskCron] ⏰ Starting weekly attendance risk scan...');

  try {
    // We call our own internal dashboard endpoint with a system token
    // OR directly replicate the logic here for cron use:
    const students = await prisma.student.findMany({
      include: {
        monthly: { orderBy: [{ year: 'asc' }, { month: 'asc' }] },
      },
    });

    const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

    function deriveTrend(monthlies) {
      if (monthlies.length < 2) return 'stable';
      const sorted = [...monthlies].sort((a, b) => a.month - b.month);
      const half = Math.ceil(sorted.length / 2);
      const a1 = sorted.slice(0, half).reduce((s, r) => s + r.percentage, 0) / half;
      const a2 = sorted.slice(half).reduce((s, r) => s + r.percentage, 0) / (sorted.length - half);
      return a2 - a1 > 3 ? 'improving' : a1 - a2 > 3 ? 'declining' : 'stable';
    }

    const payload = students.map(s => {
      const m = s.monthly;
      const avg = m.length ? m.reduce((a, x) => a + x.percentage, 0) / m.length : 0;
      const conducted = m.reduce((a, x) => a + (x.lecturesConducted || 20), 0) || 120;
      const attended  = m.reduce((a, x) => a + (x.lecturesAttended || Math.round(x.percentage * 20 / 100)), 0);
      return {
        student_id: s.studentId, attendance_percentage: avg,
        absences: conducted - attended, trend: deriveTrend(m),
        lectures_conducted: conducted, lectures_attended: attended,
        prev_sem_attendance: avg, month: m.at(-1)?.month || 1,
        _meta: { dbId: s.id, email: s.email, name: s.fullName, phone: s.phone },
      };
    });

    if (!payload.length) { console.log('[RiskCron] No students found.'); return; }

    const aiRes = await axios.post(`${AI_URL}/predict/batch`, {
      students: payload.map(({ _meta, ...rest }) => rest)
    });

    const atRisk = aiRes.data.results
      .map((pred, i) => ({ ...pred, ...(payload[i]._meta) }))
      .filter(r => r.risk_level !== 'SAFE');

    console.log(`[RiskCron] Found ${atRisk.length} at-risk students. Sending notifications...`);

    for (const student of atRisk) {
      await sendRiskNotification(student);
    }

    console.log(`[RiskCron] ✅ Done. Notified ${atRisk.length} students.`);
  } catch (err) {
    console.error('[RiskCron] ❌ Error:', err.message);
  }
}

// ── Schedule: Every Monday at 8:00 AM ────────────────────────────────
function startRiskCron() {
  cron.schedule('0 8 * * 1', runWeeklyRiskScan, {
    timezone: 'Asia/Kolkata'
  });
  console.log('[RiskCron] 🗓️  Weekly scan scheduled — every Monday 8:00 AM IST');
}

module.exports = { startRiskCron, runWeeklyRiskScan };