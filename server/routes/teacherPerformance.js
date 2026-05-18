const express = require('express');
const { requireAuth, requireRole, prisma } = require('../middleware/auth');

const router = express.Router();

//////////////////////////////////////////////////
// GET /api/teacher-performance/:teacherId
// Aggregated performance data for a single teacher
// Accessible by ADMIN, HOD, PRINCIPAL
//////////////////////////////////////////////////

router.get('/:teacherId', requireAuth, requireRole('ADMIN', 'HOD', 'PRINCIPAL'), async (req, res) => {
    try {
        const { teacherId } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: teacherId },
            include: { profile: true, department: true }
        });
        if (!user || user.role !== 'TEACHER') {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        // 1. Attendance — include BOTH daily and monthly records
        const attendanceRecords = await prisma.teacherAttendance.findMany({
            where: { teacherId },
            orderBy: [{ year: 'desc' }, { month: 'asc' }, { date: 'desc' }]
        });

        const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Auto-compute from DAILY records: group by year-month
        const dailyRecords = attendanceRecords.filter(r => r.type === 'DAILY');
        const totalDays = dailyRecords.length;
        const presentDays = dailyRecords.filter(r => r.status).length;

        const monthlyMap = {}; // key: "2026-03" -> { percentage, present, total, source }
        dailyRecords.forEach(r => {
            const m = r.month || (r.date.getMonth() + 1);
            const y = r.year || r.date.getFullYear();
            const key = `${y}-${String(m).padStart(2, '0')}`;
            if (!monthlyMap[key]) monthlyMap[key] = { total: 0, present: 0, month: m, year: y };
            monthlyMap[key].total++;
            if (r.status) monthlyMap[key].present++;
        });

        // Override/add with MONTHLY records (they have explicit percentages)
        const monthlyRecords = attendanceRecords.filter(r => r.type === 'MONTHLY');
        monthlyRecords.forEach(r => {
            const m = r.month;
            const y = r.year || r.date.getFullYear();
            const key = `${y}-${String(m).padStart(2, '0')}`;
            const pct = r.percentage != null ? parseFloat(r.percentage) : (r.status ? 100 : 0);
            monthlyMap[key] = { total: 1, present: pct >= 50 ? 1 : 0, month: m, year: y, percentage: pct };
        });

        // Calculate overall attendance: average of all months' percentages
        const monthEntries = Object.entries(monthlyMap);
        const monthlyAttendance = monthEntries.map(([key, v]) => ({
            month: `${MONTH_NAMES[v.month]} ${v.year}`,
            sortKey: key,
            percentage: v.percentage != null ? v.percentage.toFixed(1) : ((v.present / v.total) * 100).toFixed(1),
            present: v.present,
            total: v.total,
        })).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

        const allPcts = monthlyAttendance.map(m => parseFloat(m.percentage));
        const overallAttendance = allPcts.length > 0 ? (allPcts.reduce((a, b) => a + b, 0) / allPcts.length) : (totalDays > 0 ? ((presentDays / totalDays) * 100) : null);


        // 2. Feedback ratings
        const feedbacks = await prisma.teacherFeedback.findMany({
            where: { teacherId },
            orderBy: { createdAt: 'desc' }
        });
        const avgRating = feedbacks.length > 0
            ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
            : null;

        // 3-5. Self-reported and Automated performance data
        const offeringsData = await prisma.subjectOffering.findMany({
            where: { teacherId },
            select: { academicYear: true }
        });
        const offeringYears = [...new Set(offeringsData.map(o => o.academicYear).filter(Boolean))];

        const perfDataRaw = await prisma.teacherPerformanceData.findMany({
            where: { teacherId },
            orderBy: { academicYear: 'desc' }
        });
        const recordYears = perfDataRaw.map(r => r.academicYear);

        const allYears = [...new Set([...offeringYears, ...recordYears])].sort((a,b) => b.localeCompare(a));

        const perfData = await Promise.all(allYears.map(async (year) => {
            const existingRecord = perfDataRaw.find(r => r.academicYear === year) || {
                academicYear: year,
                trainingsCompleted: 0,
                trainingDetails: '',
                committeesParticipated: 0,
                eventsOrganized: 0,
                studentsMentored: 0,
                adminResponsibilityNotes: '',
            };

            const offerings = await prisma.subjectOffering.findMany({
                where: { teacherId, academicYear: year },
                include: {
                    enrollments: { select: { studentId: true } },
                    marks: { select: { studentId: true, marks: true } }
                }
            });

            let totalEnrollments = 0;
            let appearedSet = new Set();
            let passedSet = new Set();

            offerings.forEach(off => {
                totalEnrollments += off.enrollments.length;
                const bestMarks = {};
                off.marks.forEach(m => {
                    appearedSet.add(m.studentId);
                    if (!bestMarks[m.studentId] || m.marks > bestMarks[m.studentId]) bestMarks[m.studentId] = m.marks;
                });
                Object.entries(bestMarks).forEach(([sId, mark]) => {
                    if (mark >= 40) passedSet.add(sId);
                });
            });

            return {
                ...existingRecord,
                totalStudents: totalEnrollments,
                appearedStudents: appearedSet.size,
                passedStudents: passedSet.size,
                failedStudents: Math.max(0, appearedSet.size - passedSet.size),
            };
        }));

        const latestPerf = perfData[0] || null;
        const passRateRaw = latestPerf && latestPerf.appearedStudents > 0
            ? ((latestPerf.passedStudents / latestPerf.appearedStudents) * 100)
            : (latestPerf && latestPerf.totalStudents > 0 ? ((latestPerf.passedStudents / latestPerf.totalStudents) * 100) : null);
        const passRate = passRateRaw !== null ? passRateRaw.toFixed(1) : null;

        // Weighted performance score
        const attScore = overallAttendance !== null ? Math.min(overallAttendance, 100) : 0;
        const fbScore = avgRating !== null ? (parseFloat(avgRating) / 5) * 100 : 0;
        const trainScore = latestPerf ? Math.min(latestPerf.trainingsCompleted * 20, 100) : 0;
        const prScore = passRate !== null ? parseFloat(passRate) : 0;
        const adminScore = latestPerf
            ? Math.min((latestPerf.committeesParticipated + latestPerf.eventsOrganized + latestPerf.studentsMentored) * 10, 100)
            : 0;

        const performanceScore = (
            attScore * 0.25 +
            fbScore * 0.25 +
            trainScore * 0.15 +
            prScore * 0.20 +
            adminScore * 0.15
        ).toFixed(1);

        // 6. Workload Distribution (from Timetable)
        const workloadEntries = await prisma.timetableEntry.findMany({
            where: { teacherId },
            select: { subject: true, academicYear: true }
        });

        const subjects = new Set();
        let lecturesPerWeek = 0;
        const subBreakdown = {};

        workloadEntries.forEach(e => {
            lecturesPerWeek++;
            if (e.subject) {
                subjects.add(e.subject);
                subBreakdown[e.subject] = (subBreakdown[e.subject] || 0) + 1;
            }
        });

        res.json({
            teacher: {
                id: user.id,
                email: user.email,
                fullName: user.profile?.fullName || user.email,
                phone: user.profile?.phone || null,
                departmentName: user.department?.name || 'Unassigned',
                departmentId: user.departmentId,
            },
            attendance: {
                overall: overallAttendance ? overallAttendance.toFixed(1) : null,
                totalDays,
                presentDays,
                monthly: monthlyAttendance,
                records: attendanceRecords.slice(0, 50), // last 50
            },
            feedback: {
                avgRating: avgRating ? parseFloat(avgRating) : null,
                totalFeedbacks: feedbacks.length,
                history: feedbacks.slice(0, 20),
            },
            performance: {
                current: latestPerf,
                all: perfData,
                passRate: passRate ? parseFloat(passRate) : null,
            },
            workload: {
                totalLectures: lecturesPerWeek,
                subjectCount: subjects.size,
                breakdown: Object.entries(subBreakdown).map(([name, count]) => ({ name, count }))
            },
            performanceScore: parseFloat(performanceScore),
            breakdown: {
                attendance: parseFloat(attScore.toFixed(1)),
                feedback: parseFloat(fbScore.toFixed(1)),
                trainings: parseFloat(trainScore.toFixed(1)),
                passRate: parseFloat(prScore.toFixed(1)),
                responsibilities: parseFloat(adminScore.toFixed(1)),
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET /api/teacher-performance/department/:deptId
// All teachers' performance in a department
//////////////////////////////////////////////////

router.get('/department/:deptId', requireAuth, requireRole('ADMIN', 'HOD', 'PRINCIPAL'), async (req, res) => {
    try {
        const { deptId } = req.params;

        const teachers = await prisma.user.findMany({
            where: {
                role: 'TEACHER',
                OR: [
                    { departmentId: deptId },
                    {
                        teacherOfferings: {
                            some: {
                                subject: {
                                    departmentId: deptId
                                }
                            }
                        }
                    }
                ]
            },
            include: {
                profile: true,
                teacherAttendance: true,
                teacherFeedback: true,
                teacherPerfData: { orderBy: { academicYear: 'desc' } },
            }
        });

        const result = await Promise.all(teachers.map(async (t) => {
            // Find most recent academic year from EITHER SubjectOffering or TeacherPerformanceData
            const offerYears = await prisma.subjectOffering.findMany({
                where: { teacherId: t.id },
                select: { academicYear: true }
            });
            const topOfferYear = offerYears.map(o => o.academicYear).filter(Boolean).sort((a,b) => b.localeCompare(a))[0];
            const topManualYear = t.teacherPerfData[0]?.academicYear;
            
            const activeYear = [topOfferYear, topManualYear].filter(Boolean).sort((a,b) => b.localeCompare(a))[0] || new Date().getFullYear().toString();

            // Compute Attendance from DAILY records per month
            const dailyRecs = t.teacherAttendance.filter(r => r.type === 'DAILY');
            const monthlyMap = {};
            dailyRecs.forEach(r => {
                const m = r.month || (r.date.getMonth() + 1);
                const y = r.year || r.date.getFullYear();
                const key = `${y}-${String(m).padStart(2, '0')}`;
                if (!monthlyMap[key]) monthlyMap[key] = { total: 0, present: 0 };
                monthlyMap[key].total++;
                if (r.status) monthlyMap[key].present++;
            });
            // Add MONTHLY records with explicit percentages
            t.teacherAttendance.filter(r => r.type === 'MONTHLY').forEach(r => {
                const m = r.month;
                const y = r.year || r.date.getFullYear();
                const key = `${y}-${String(m).padStart(2, '0')}`;
                const pct = r.percentage != null ? parseFloat(r.percentage) : (r.status ? 100 : 0);
                monthlyMap[key] = { percentage: pct };
            });
            const allPcts = Object.values(monthlyMap).map(v => v.percentage != null ? v.percentage : ((v.present / v.total) * 100));
            const overallAtt = allPcts.length > 0 ? (allPcts.reduce((a, b) => a + b, 0) / allPcts.length) : null;

            const avgRating = t.teacherFeedback.length > 0
                ? (t.teacherFeedback.reduce((s, f) => s + f.rating, 0) / t.teacherFeedback.length)
                : null;
                
            const perf = t.teacherPerfData.find(p => p.academicYear === activeYear) || null;
            
            // Automated pass rate calc for leaderboard
            let totalEnrollments = 0;
            let appearedCount = 0;
            let passedCount = 0;
            
            const offerings = await prisma.subjectOffering.findMany({
                where: { teacherId: t.id, academicYear: activeYear },
                include: {
                    enrollments: { select: { studentId: true } },
                    marks: { select: { studentId: true, marks: true } }
                }
            });

            const appearedSet = new Set();
            const passedSet = new Set();
            
            offerings.forEach(off => {
                totalEnrollments += off.enrollments.length;
                const bestMarks = {};
                off.marks.forEach(m => {
                    appearedSet.add(m.studentId);
                    if (!bestMarks[m.studentId] || m.marks > bestMarks[m.studentId]) bestMarks[m.studentId] = m.marks;
                });
                Object.entries(bestMarks).forEach(([sId, mark]) => {
                    if (mark >= 40) passedSet.add(sId);
                });
            });
            appearedCount = appearedSet.size;
            passedCount = passedSet.size;

            const passRate = (appearedCount > 0)
                ? ((passedCount / appearedCount) * 100)
                : (perf && perf.totalStudents > 0 ? ((perf.passedStudents / perf.totalStudents) * 100) : null);

            // Performance Score Calculation (same weights as individual endpoint)
            const attScore = overallAtt !== null ? Math.min(overallAtt, 100) : 0;
            const fbScore = avgRating !== null ? (avgRating / 5) * 100 : 0;
            const trainScore = Math.min((perf?.trainingsCompleted || 0) * 20, 100);
            const prScore = passRate !== null ? passRate : 0;
            const adminScore = Math.min((perf ? (perf.committeesParticipated + perf.eventsOrganized + perf.studentsMentored) : 0) * 10, 100);

            const performanceScore = (
                attScore * 0.25 +
                fbScore * 0.25 +
                trainScore * 0.15 +
                prScore * 0.20 +
                adminScore * 0.15
            );
            
            // Workload summary (Restored)
            const workload = await prisma.timetableEntry.findMany({
                where: { teacherId: t.id },
                select: { subject: true }
            });
            const subjects = new Set(workload.filter(w => w.subject).map(w => w.subject));

            return {
                id: t.id,
                fullName: t.profile?.fullName || t.email,
                email: t.email,
                attendance: overallAtt ? parseFloat(overallAtt.toFixed(1)) : null,
                rating: avgRating ? parseFloat(avgRating.toFixed(1)) : null,
                trainings: perf?.trainingsCompleted || 0,
                passRate: passRate ? parseFloat(passRate.toFixed(1)) : null,
                responsibilities: perf ? (perf.committeesParticipated + perf.eventsOrganized + perf.studentsMentored) : 0,
                performanceScore: parseFloat(performanceScore.toFixed(1)),
                workload: {
                    lectures: workload.length,
                    subjects: subjects.size
                }
            };
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// POST /api/teacher-performance/:teacherId/attendance
// HOD/Admin adds a monthly attendance record for a teacher
//////////////////////////////////////////////////

router.post('/:teacherId/attendance', requireAuth, requireRole('ADMIN', 'HOD', 'PRINCIPAL'), async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { month, year, percentage } = req.body;

        if (!month || !year || percentage === undefined) {
            return res.status(400).json({ error: 'month, year, and percentage are required' });
        }
        const m = parseInt(month);
        const y = parseInt(year);
        const pct = parseFloat(percentage);
        if (m < 1 || m > 12 || isNaN(y) || isNaN(pct) || pct < 0 || pct > 100) {
            return res.status(400).json({ error: 'Invalid values: month 1-12, year, percentage 0-100' });
        }

        // Upsert: one record per teacher + month + year
        const existing = await prisma.teacherAttendance.findFirst({
            where: { teacherId, month: m, year: y, type: 'MONTHLY' }
        });

        let record;
        if (existing) {
            record = await prisma.teacherAttendance.update({
                where: { id: existing.id },
                data: { percentage: pct, status: pct >= 75 }
            });
        } else {
            record = await prisma.teacherAttendance.create({
                data: {
                    teacherId,
                    type: 'MONTHLY',
                    month: m,
                    year: y,
                    date: new Date(y, m - 1, 1),
                    percentage: pct,
                    status: pct >= 75,
                }
            });
        }

        res.json({ success: true, record });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// POST /api/teacher-performance/:teacherId/feedback
// HOD/Admin adds a feedback rating for a teacher
//////////////////////////////////////////////////

router.post('/:teacherId/feedback', requireAuth, requireRole('ADMIN', 'HOD', 'PRINCIPAL'), async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { rating, comment, semester } = req.body;

        if (rating === undefined || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'rating must be between 1 and 5' });
        }

        const feedback = await prisma.teacherFeedback.create({
            data: {
                teacherId,
                rating: parseFloat(rating),
                comment: comment || null,
                semester: semester || null,
            }
        });

        res.json({ success: true, feedback });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// POST /api/teacher-performance/:teacherId/performance
// HOD/Admin adds or updates performance data for an academic year
//////////////////////////////////////////////////

router.post('/:teacherId/performance', requireAuth, requireRole('ADMIN', 'HOD', 'PRINCIPAL'), async (req, res) => {
    try {
        const { teacherId } = req.params;
        const {
            academicYear,
            totalStudents, passedStudents,
            trainingsCompleted, trainingDetails,
            committeesParticipated, eventsOrganized, studentsMentored,
            adminResponsibilityNotes,
        } = req.body;

        if (!academicYear) {
            return res.status(400).json({ error: 'academicYear is required (e.g. 2025-26)' });
        }

        const data = {
            totalStudents: parseInt(totalStudents) || 0,
            passedStudents: parseInt(passedStudents) || 0,
            trainingsCompleted: parseInt(trainingsCompleted) || 0,
            trainingDetails: trainingDetails || null,
            committeesParticipated: parseInt(committeesParticipated) || 0,
            eventsOrganized: parseInt(eventsOrganized) || 0,
            studentsMentored: parseInt(studentsMentored) || 0,
            adminResponsibilityNotes: adminResponsibilityNotes || null,
        };

        // Upsert per teacher + academicYear
        const existing = await prisma.teacherPerformanceData.findFirst({
            where: { teacherId, academicYear }
        });

        let record;
        if (existing) {
            record = await prisma.teacherPerformanceData.update({
                where: { id: existing.id },
                data
            });
        } else {
            record = await prisma.teacherPerformanceData.create({
                data: { teacherId, academicYear, ...data }
            });
        }

        res.json({ success: true, record });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
