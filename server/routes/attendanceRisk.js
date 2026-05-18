const express = require('express');
const router = express.Router();
const { requireAuth, requireRole, prisma } = require('../middleware/auth');
const axios = require('axios');
const { sendRiskNotification } = require('../services/notificationService');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: compute attendance trend from sorted monthly records
// ─────────────────────────────────────────────────────────────────────────────
function deriveTrend(monthlies) {
    if (!monthlies || monthlies.length < 2) return 'stable';
    const sorted = [...monthlies].sort((a, b) =>
        a.year !== b.year ? a.year - b.year : a.month - b.month
    );
    const half = Math.ceil(sorted.length / 2);
    const firstHalf = sorted.slice(0, half);
    const lastHalf  = sorted.slice(half);
    const avg1 = firstHalf.reduce((s, r) => s + r.percentage, 0) / firstHalf.length;
    const avg2 = lastHalf.reduce((s, r) => s + r.percentage, 0) / lastHalf.length;
    if (avg2 - avg1 > 3)  return 'improving';
    if (avg1 - avg2 > 3)  return 'declining';
    return 'stable';
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: resolve department ID for any role.
// Returns:
//   string  → scope to that department ID
//   null    → ADMIN/PRINCIPAL: show all departments
//   false   → TEACHER/HOD with no dept found: show nothing (never leak all)
// ─────────────────────────────────────────────────────────────────────────────
async function resolveDeptId(role, userId) {
    if (role === 'TEACHER') {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { departmentId: true }
        });
        if (user?.departmentId) return user.departmentId;

        // Fallback: infer from subject offerings
        const offering = await prisma.subjectOffering.findFirst({
            where: { teacherId: userId },
            include: { subject: { select: { departmentId: true } } }
        });
        // false = no dept found; caller must return empty results, NOT all students
        return offering?.subject?.departmentId || false;
    }

    if (role === 'HOD') {
        const dept = await prisma.department.findFirst({
            where: { hodId: userId },
            select: { id: true }
        });
        // false = no dept assigned; caller must return empty results, NOT all students
        return dept?.id || false;
    }

    // ADMIN / PRINCIPAL → null = no filter, show everyone
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: build AI payload from one student's monthly records
// ─────────────────────────────────────────────────────────────────────────────
function buildStudentPayload(student) {
    const monthlies = student.monthly || [];

    // Aggregate across all subjects
    const totalPresent = student.attendance
        ? student.attendance.filter(r => r.status === true).length
        : 0;
    const totalRecords = student.attendance
        ? student.attendance.length
        : 0;

    // Average attendance % across all monthly records
    const avgPct = monthlies.length
        ? monthlies.reduce((s, m) => s + m.percentage, 0) / monthlies.length
        : (totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0);

    const trend  = deriveTrend(monthlies);
    const latest = monthlies.length
        ? [...monthlies].sort((a, b) => b.year - a.year || b.month - a.month)[0]
        : null;

    // Count lectures conducted / attended from session records
    const sessionsTotal = totalRecords;
    const sessionsPresent = totalPresent;

    return {
        student_id:            student.studentId,
        attendance_percentage: Math.round(avgPct * 100) / 100,
        absences:              sessionsTotal - sessionsPresent,
        trend,
        lectures_conducted:    sessionsTotal  || 120,
        lectures_attended:     sessionsPresent || Math.round(avgPct * 1.2),
        prev_sem_attendance:   avgPct,          // fallback — no prev-sem stored separately
        month:                 latest?.month || new Date().getMonth() + 1,
        // metadata (stripped before sending to AI)
        _meta: {
            dbId:       student.id,
            name:       student.fullName,
            email:      student.email || null,
            phone:      student.profile?.phone || null,
            department: student.department?.name || null,
            deptShort:  student.department?.shortId || null,
            year:       student.enrollments?.[0]?.year || null,
            semester:   student.enrollments?.[0]?.semester || null,
            section:    student.enrollments?.[0]?.section || null,
            monthlies,  // kept for chart data
        }
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/attendance-risk/dashboard
// Accessible by: teacher, hod, principal, admin
// ─────────────────────────────────────────────────────────────────────────────
router.get('/dashboard', requireAuth, async (req, res) => {
    try {
        const { role, id: userId } = req.user;

        // Resolve scope
        // deptId: string = filter to dept | null = all depts (admin/principal) | false = no dept assigned (return empty)
        const deptId = await resolveDeptId(role, userId);
        if (deptId === false) {
            return res.json({ results: [], summary: { total: 0, safe: 0, warning: 0, highRisk: 0 }, deptChart: [] });
        }

        // Fetch students with full attendance data
        const students = await prisma.student.findMany({
            where: deptId ? { departmentId: deptId } : {},
            include: {
                department: { select: { name: true, shortId: true } },
                monthly: {
                    orderBy: [{ year: 'asc' }, { month: 'asc' }]
                },
                attendance: {
                    include: {
                        session: {
                            select: { date: true, subjectOfferingId: true }
                        }
                    }
                },
                enrollments: {
                    orderBy: { academicYear: 'desc' },
                    take: 1
                }
            }
        });

        if (!students.length) {
            return res.json({ results: [], summary: { total: 0, safe: 0, warning: 0, highRisk: 0 }, chartData: [] });
        }

        // Build AI payload
        const payloads = students.map(buildStudentPayload);
        const aiInput  = payloads.map(({ _meta, ...rest }) => rest);

        // Call FastAPI batch predict
        let predictions;
        try {
            const aiRes = await axios.post(`${AI_URL}/predict/batch`, { students: aiInput }, { timeout: 15000 });
            predictions = aiRes.data.results;
        } catch (aiErr) {
            // Graceful fallback: rule-based classification if AI service is down
            console.warn('[RiskDashboard] AI service unavailable — using rule-based fallback');
            predictions = aiInput.map(s => {
                const pct = s.attendance_percentage;
                const risk_level = pct >= 75 ? 'SAFE' : pct >= 65 ? 'WARNING' : 'HIGH_RISK';
                return {
                    student_id:       s.student_id,
                    attendance:       pct,
                    risk_level,
                    risk_probability: pct >= 75 ? 0.9 : pct >= 65 ? 0.75 : 0.85
                };
            });
        }

        // Merge predictions with metadata
        const metaMap = Object.fromEntries(payloads.map(p => [p.student_id, p._meta]));

        const results = predictions.map(pred => {
            const meta = metaMap[pred.student_id] || {};
            return {
                student_id:       pred.student_id,
                name:             meta.name,
                email:            meta.email,
                department:       meta.department,
                deptShort:        meta.deptShort,
                year:             meta.year,
                section:          meta.section,
                semester:         meta.semester,
                attendance:       pred.attendance,
                risk_level:       pred.risk_level,
                risk_probability: pred.risk_probability,
                trend:            payloads.find(p => p.student_id === pred.student_id)?.trend || 'stable',
                // Monthly breakdown for charts (per student)
                monthly: meta.monthlies?.map(m => ({
                    month: m.month,
                    year:  m.year,
                    percentage: Math.round(m.percentage * 10) / 10
                })) || []
            };
        });

        // Upsert risk records to DB (fire-and-forget)
        const upserts = results.map(r => {
            const dbId = metaMap[r.student_id]?.dbId;
            if (!dbId) return Promise.resolve();
            return prisma.attendanceRisk.upsert({
                where:  { studentId: dbId },
                update: { riskLevel: r.risk_level, riskProbability: r.risk_probability, attendance: r.attendance, updatedAt: new Date() },
                create: { studentId: dbId, riskLevel: r.risk_level, riskProbability: r.risk_probability, attendance: r.attendance }
            }).catch(() => {});
        });
        Promise.allSettled(upserts); // don't await — keep response fast

        // Summary
        const summary = {
            total:    results.length,
            safe:     results.filter(r => r.risk_level === 'SAFE').length,
            warning:  results.filter(r => r.risk_level === 'WARNING').length,
            highRisk: results.filter(r => r.risk_level === 'HIGH_RISK').length,
        };

        // Department-level chart data (for principal/admin overview)
        const deptMap = {};
        results.forEach(r => {
            const key = r.deptShort || r.department || 'Unknown';
            if (!deptMap[key]) deptMap[key] = { dept: key, safe: 0, warning: 0, highRisk: 0 };
            if (r.risk_level === 'SAFE')      deptMap[key].safe++;
            else if (r.risk_level === 'WARNING')   deptMap[key].warning++;
            else if (r.risk_level === 'HIGH_RISK') deptMap[key].highRisk++;
        });

        res.json({
            results,
            summary,
            deptChart: Object.values(deptMap)
        });

    } catch (err) {
        console.error('[RiskDashboard] Error:', err.message);
        res.status(500).json({ error: 'Failed to compute risk dashboard: ' + err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/attendance-risk/attendance-trend
// Returns time-bucketed attendance trend for the Attendance Trend Over Time chart
// Query params: period (week|month), department, year, section, studentId
// ─────────────────────────────────────────────────────────────────────────────
router.get('/attendance-trend', requireAuth, async (req, res) => {
    try {
        const { role, id: userId } = req.user;
        const { period = 'month', department, year, section, studentId } = req.query;

        // Resolve department scope based on role
        const scopedDeptId = await resolveDeptId(role, userId);
        if (scopedDeptId === false) {
            return res.json({ trend: [], studentTrend: [] });
        }

        // Build session filter
        const sessionWhere = {};
        const offeringWhere = {};

        // For teacher/HOD, always scope to their department
        if (scopedDeptId) {
            offeringWhere.subject = { departmentId: scopedDeptId };
        }
        // For admin/principal, allow optional department filter
        if (!scopedDeptId && department && department !== 'ALL') {
            // department param is the department name, resolve to id
            const dept = await prisma.department.findFirst({
                where: { OR: [{ name: department }, { shortId: department }] },
                select: { id: true }
            });
            if (dept) {
                offeringWhere.subject = { departmentId: dept.id };
            }
        }

        // Year filter
        if (year && year !== 'ALL') {
            offeringWhere.year = Number(year);
        }

        // Section filter
        if (section && section !== 'ALL') {
            offeringWhere.section = section;
        }

        if (Object.keys(offeringWhere).length > 0) {
            sessionWhere.subjectOffering = offeringWhere;
        }

        // Fetch attendance sessions with records
        const sessions = await prisma.attendanceSession.findMany({
            where: sessionWhere,
            include: {
                records: {
                    select: { studentId: true, status: true }
                }
            },
            orderBy: { date: 'asc' }
        });

        if (!sessions.length) {
            return res.json({ trend: [], studentTrend: [] });
        }

        // Group sessions into time buckets
        const buckets = {};
        const studentBuckets = {};
        const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        sessions.forEach(session => {
            const d = new Date(session.date);
            let bucketKey;

            if (period === 'week') {
                // ISO week number
                const startOfYear = new Date(d.getFullYear(), 0, 1);
                const weekNum = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
                bucketKey = `W${weekNum} ${d.getFullYear()}`;
            } else {
                bucketKey = `${MONTHS[d.getMonth() + 1]} ${d.getFullYear()}`;
            }

            if (!buckets[bucketKey]) {
                buckets[bucketKey] = { present: 0, total: 0, date: d };
            }

            session.records.forEach(rec => {
                buckets[bucketKey].total++;
                if (rec.status) buckets[bucketKey].present++;

                // Track selected student separately
                if (studentId && rec.studentId === studentId) {
                    if (!studentBuckets[bucketKey]) {
                        studentBuckets[bucketKey] = { present: 0, total: 0 };
                    }
                    studentBuckets[bucketKey].total++;
                    if (rec.status) studentBuckets[bucketKey].present++;
                }
            });
        });

        // Convert to sorted arrays
        const trend = Object.entries(buckets)
            .sort((a, b) => a[1].date - b[1].date)
            .map(([key, val]) => ({
                period: key,
                classAverage: val.total > 0 ? Math.round((val.present / val.total) * 1000) / 10 : 0
            }));

        const studentTrend = Object.entries(studentBuckets)
            .map(([key, val]) => ({
                period: key,
                studentAttendance: val.total > 0 ? Math.round((val.present / val.total) * 1000) / 10 : 0
            }));

        // Identify students with declining attendance (insight)
        // Compute per-student last 2 buckets difference
        const bucketKeys = trend.map(t => t.period);
        const studentDeclines = [];

        if (bucketKeys.length >= 2) {
            const lastTwo = bucketKeys.slice(-2);
            const perStudent = {};

            sessions.forEach(session => {
                const d = new Date(session.date);
                let bucketKey;
                if (period === 'week') {
                    const startOfYear = new Date(d.getFullYear(), 0, 1);
                    const weekNum = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
                    bucketKey = `W${weekNum} ${d.getFullYear()}`;
                } else {
                    bucketKey = `${MONTHS[d.getMonth() + 1]} ${d.getFullYear()}`;
                }

                if (!lastTwo.includes(bucketKey)) return;

                session.records.forEach(rec => {
                    if (!perStudent[rec.studentId]) {
                        perStudent[rec.studentId] = {};
                    }
                    if (!perStudent[rec.studentId][bucketKey]) {
                        perStudent[rec.studentId][bucketKey] = { present: 0, total: 0 };
                    }
                    perStudent[rec.studentId][bucketKey].total++;
                    if (rec.status) perStudent[rec.studentId][bucketKey].present++;
                });
            });

            // Find students whose attendance dropped > 5% between last two periods
            for (const [sid, periods] of Object.entries(perStudent)) {
                const p1 = periods[lastTwo[0]];
                const p2 = periods[lastTwo[1]];
                if (p1 && p2 && p1.total > 0 && p2.total > 0) {
                    const pct1 = (p1.present / p1.total) * 100;
                    const pct2 = (p2.present / p2.total) * 100;
                    if (pct1 - pct2 > 5) {
                        studentDeclines.push({
                            studentId: sid,
                            drop: Math.round((pct1 - pct2) * 10) / 10,
                            from: Math.round(pct1 * 10) / 10,
                            to: Math.round(pct2 * 10) / 10
                        });
                    }
                }
            }

            // Resolve student names for declines
            if (studentDeclines.length > 0) {
                const studentIds = studentDeclines.map(s => s.studentId);
                const students = await prisma.student.findMany({
                    where: { id: { in: studentIds } },
                    select: { id: true, fullName: true, studentId: true }
                });
                const nameMap = Object.fromEntries(students.map(s => [s.id, { name: s.fullName, sid: s.studentId }]));
                studentDeclines.forEach(s => {
                    s.name = nameMap[s.studentId]?.name || 'Unknown';
                    s.enrollmentId = nameMap[s.studentId]?.sid || s.studentId;
                });
            }
        }

        // Sort declines by drop amount
        studentDeclines.sort((a, b) => b.drop - a.drop);

        res.json({
            trend,
            studentTrend,
            decliningStudents: studentDeclines.slice(0, 10) // top 10
        });

    } catch (err) {
        console.error('[AttendanceTrend] Error:', err.message);
        res.status(500).json({ error: 'Failed to compute attendance trend: ' + err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/attendance-risk/notify
// Send email+SMS to all at-risk students in the provided results array
// ─────────────────────────────────────────────────────────────────────────────
router.post('/notify', requireAuth, requireRole('TEACHER', 'HOD', 'PRINCIPAL', 'ADMIN'), async (req, res) => {
    try {
        const { results } = req.body;
        const atRisk = (results || []).filter(r =>
            r.risk_level === 'WARNING' || r.risk_level === 'HIGH_RISK'
        );

        const notifResults = await Promise.allSettled(
            atRisk.map(r => sendRiskNotification(r))
        );

        const sent   = notifResults.filter(r => r.status === 'fulfilled').length;
        const failed = notifResults.filter(r => r.status === 'rejected').length;

        res.json({ sent, failed, total: atRisk.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/attendance-risk/student/:studentDbId
// Single student's stored risk record
// ─────────────────────────────────────────────────────────────────────────────
router.get('/student/:studentDbId', requireAuth, async (req, res) => {
    try {
        const risk = await prisma.attendanceRisk.findUnique({
            where: { studentId: req.params.studentDbId }
        });
        res.json(risk || { riskLevel: 'UNKNOWN', attendance: 0, riskProbability: 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/attendance-risk/summary
// Lightweight count-only endpoint for dashboard widgets
// ─────────────────────────────────────────────────────────────────────────────
router.get('/summary', requireAuth, async (req, res) => {
    try {
        const { role, id: userId } = req.user;
        const deptId = await resolveDeptId(role, userId);
        if (deptId === false) {
            return res.json({ safe: 0, warning: 0, highRisk: 0, total: 0 });
        }

        const where = deptId
            ? { student: { departmentId: deptId } }
            : {};

        const [safe, warning, highRisk] = await Promise.all([
            prisma.attendanceRisk.count({ where: { ...where, riskLevel: 'SAFE' } }),
            prisma.attendanceRisk.count({ where: { ...where, riskLevel: 'WARNING' } }),
            prisma.attendanceRisk.count({ where: { ...where, riskLevel: 'HIGH_RISK' } }),
        ]);

        res.json({ safe, warning, highRisk, total: safe + warning + highRisk });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;