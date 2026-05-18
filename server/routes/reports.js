const express = require('express');
const { requireAuth, requireRole, prisma } = require('../middleware/auth');

const router = express.Router();

//////////////////////////////////////////////////
// CREATE REPORT (TEACHER / HOD)
//////////////////////////////////////////////////

router.post('/', requireAuth, requireRole('TEACHER', 'HOD'), async (req, res) => {
    try {
        const { title, content, status } = req.body;

        const report = await prisma.report.create({
            data: {
                userId: req.user.id,
                title,
                content,
                status: status || 'draft',
            }
        });

        // Emit socket event
        const io = req.app.get('io');
        if (io) io.emit('report_change', { type: 'created', reportId: report.id });

        res.json(report);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET REPORTS (ROLE-BASED)
//////////////////////////////////////////////////

router.get('/', requireAuth, async (req, res) => {
    try {
        const { role, id } = req.user;

        // ADMIN & PRINCIPAL → all reports
        if (role === 'ADMIN' || role === 'PRINCIPAL') {
            const reports = await prisma.report.findMany({
                where: {
            status: {
                not: 'draft'
            }
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                    profile: {
                        select: { fullName: true }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
    const result = reports.map(r => ({
        ...r,
        userId: r.user?.id,
        teacherName: r.user?.profile?.fullName || r.user?.email || 'Unknown Teacher',
        reporterRole: r.user?.role?.toLowerCase() || 'teacher'
    }));

            return res.json(result);
        }

        // HOD → only reports from their department teachers + own reports
        if (role === 'HOD') {

            const department = await prisma.department.findFirst({
                where: { hodId: id }
            });

            const reports = await prisma.report.findMany({
                where: {
                    status: { not: 'draft' },
                    user: {
                        OR: [
                            { id }, // own reports
                            {
                                teacherOfferings: {
                                    some: {
                                        subject: {
                                            departmentId: department?.id
                                        }
                                    }
                                }
                            }
                        ]
                    }
                },
                include: {
                    user: {
                        include: { profile: true, department: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            return res.json(reports.map(r => ({
    ...r,
    userId: r.user?.id,
    teacherName: r.user?.profile?.fullName || r.user?.email || 'Unknown Teacher',
    reporterRole: r.user?.role?.toLowerCase() || 'teacher',
    departmentName: r.user?.department?.name || '',
})));
        }

        // TEACHER → only their reports
        if (role === 'TEACHER') {
    const reports = await prisma.report.findMany({
        where: { userId: id },
        include: {
            user: {
                include: {
                    profile: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return res.json(reports.map(r => ({
        ...r,
        userId: r.userId,
        teacherName: r.user?.profile?.fullName || r.user?.email || 'Unknown Teacher',
        reporterRole: 'teacher',
    })));
}

        res.status(403).json({ error: "Unauthorized role" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET STUDENT REPORT DATA (attendance + marks)
//////////////////////////////////////////////////

router.get('/data/student/:id', requireAuth, async (req, res) => {
    try {
        const studentId = req.params.id;
        const teacherId = req.user.id;

        // Get marks for this student in teacher's offerings
        const marks = await prisma.mark.findMany({
            where: {
                studentId,
                subjectOffering: { teacherId }
            },
            include: {
                subjectOffering: {
                    include: { subject: true }
                }
            }
        });

        // Get monthly attendance for this student in teacher's offerings
        const monthly = await prisma.attendanceMonthly.findMany({
            where: {
                studentId,
                subjectOffering: { teacherId }
            },
            include: {
                subjectOffering: {
                    include: { subject: true }
                }
            }
        });

        // Get student info
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { department: true, enrollments: true }
        });

        // Get daily attendance
        const sessions = await prisma.attendanceSession.findMany({
            where: {
                subjectOffering: { teacherId }
            },
            include: {
                records: {
                    where: { studentId }
                }
            }
        });

        const daily = sessions.map(s => ({
            offeringId: s.subjectOfferingId,
            date: s.date,
            status: s.records[0]?.status ?? false, // Only one record per student per session
            hasRecord: s.records.length > 0
        })).filter(d => d.hasRecord);

        // Get extra-curricular activity entries — wrapped separately so a missing table won't crash the endpoint
        let activities = [];
        try {
            activities = await prisma.activityEntry.findMany({
                where: { studentId },
                orderBy: { month: 'asc' },
            });
        } catch (actErr) {
            console.warn('Could not fetch activities (run migrations):', actErr.message);
        }

        res.json({ student, marks, monthly, daily, activities });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET STUDENT REPORT DATA BY REPORT ID
// (HOD / Principal / Admin — same data teacher used)
//////////////////////////////////////////////////

router.get('/data/student-report/:reportId', requireAuth, async (req, res) => {
    try {
        const { role } = req.user;
        if (!['HOD', 'PRINCIPAL', 'ADMIN', 'TEACHER'].includes(role)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // 1. Load the report
        const report = await prisma.report.findUnique({
            where: { id: req.params.reportId },
            include: { user: { include: { profile: true } } },
        });
        if (!report) return res.status(404).json({ error: 'Report not found' });

        // 2. Parse stored metadata
        let parsed;
        try { parsed = JSON.parse(report.content); } catch {
            return res.status(400).json({ error: 'Report content is not a student report' });
        }
        if (parsed.type !== 'student' || !parsed.studentId) {
            return res.status(400).json({ error: 'Not a student report' });
        }

        const { studentId, subjectIds = [], remarks = '' } = parsed;
        const selectedSubjects = new Set(subjectIds);

        // 3. Fetch student
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { department: true, enrollments: true },
        });

        // 4. Fetch marks (for the stored subject offerings)
        const marksWhere = subjectIds.length > 0
            ? { studentId, subjectOfferingId: { in: subjectIds } }
            : { studentId };
        const marks = await prisma.mark.findMany({
            where: marksWhere,
            include: { subjectOffering: { include: { subject: true } } },
        });

        // 5. Fetch monthly attendance
        const monthly = await prisma.attendanceMonthly.findMany({
            where: marksWhere,
            include: { subjectOffering: { include: { subject: true } } },
        });

        // 6. Fetch daily attendance sessions
        const sessionsWhere = subjectIds.length > 0
            ? { subjectOfferingId: { in: subjectIds } }
            : {};
        const sessions = await prisma.attendanceSession.findMany({
            where: sessionsWhere,
            include: { records: { where: { studentId } } },
        });
        const daily = sessions.map(s => ({
            offeringId: s.subjectOfferingId,
            date: s.date,
            status: s.records[0]?.status ?? false,
            hasRecord: s.records.length > 0,
        })).filter(d => d.hasRecord);

        // 7. Activities
        let activities = [];
        try {
            activities = await prisma.activityEntry.findMany({
                where: { studentId },
                orderBy: { month: 'asc' },
            });
        } catch { }

        // 8. Teacher info from report creator
        const teacherName = report.user?.profile?.fullName || report.user?.email || '';

        res.json({
            student,
            marks,
            monthly,
            daily,
            activities,
            teacherName,
            remarks,
            subjectIds,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/data/class-report/:reportId', requireAuth, async (req, res) => {
    try {

        const report = await prisma.report.findUnique({
            where: { id: req.params.reportId },
            include: {
                user: { include: { profile: true } }
            }
        });

        if (!report) {
            return res.status(404).json({ error: "Report not found" });
        }

        let parsed;
        try {
            parsed = JSON.parse(report.content);
        } catch {
            return res.status(400).json({ error: "Invalid report format" });
        }

        if (parsed.type !== 'class' || !parsed.offeringId) {
            return res.status(400).json({ error: "Not a class report" });
        }

        const offering = await prisma.subjectOffering.findUnique({
            where: { id: parsed.offeringId },
            include: {
                subject: true,
                enrollments: {
                    include: {
                        student: {
                            include: { department: true }
                        }
                    }
                },
                marks: true,
                monthly: true
            }
        });

        if (!offering) {
            return res.status(404).json({ error: "Subject offering not found" });
        }

        const examTypes = [...new Set(offering.marks.map(m => m.examType))];

        const students = offering.enrollments.map(e => {

            const student = e.student;

            const studentMarks = offering.marks.filter(m => m.studentId === student.id);
            const studentMonthly = offering.monthly.filter(a => a.studentId === student.id);

            const marksByExam = {};
            studentMarks.forEach(m => {
                marksByExam[m.examType] = m.marks;
            });

            const totalMarks = studentMarks.reduce((s, m) => s + m.marks, 0);

            const avgAtt = studentMonthly.length
                ? Math.round(studentMonthly.reduce((s, a) => s + a.percentage, 0) / studentMonthly.length)
                : 0;

            return {
                fullName: student.fullName,
                studentId: student.studentId,
                marks: marksByExam,
                totalMarks,
                avgAtt
            };

        });

        res.json({
            offering,
            students,
            examTypes,
            remarks: parsed.remarks || '',
            teacherName: report.user?.profile?.fullName || ''
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
//////////////////////////////////////////////////
// GET CLASS REPORT DATA (all students summary)
//////////////////////////////////////////////////

router.get('/data/class', requireAuth, requireRole('TEACHER'), async (req, res) => {
    try {
        const teacherId = req.user.id;

        const offerings = await prisma.subjectOffering.findMany({
            where: { teacherId },
            include: {
                subject: true,
                marks: {
                    include: {
                        student: { include: { department: true } }
                    }
                },
                monthly: {
                    include: { student: true }
                },
                enrollments: {
                    include: {
                        student: { include: { department: true } }
                    }
                },
                sessions: {
                    include: { records: true }
                }
            }
        });

        // Enrich offerings with real-time student attendance averages
        const enrichedOfferings = offerings.map(off => {
            const studentAverages = off.enrollments.map(enr => {
                const sId = enr.studentId;
                
                // Try monthly first
                const studentMonthly = off.monthly.filter(m => m.studentId === sId);
                if (studentMonthly.length > 0) {
                    const avg = Math.round(studentMonthly.reduce((acc, m) => acc + m.percentage, 0) / studentMonthly.length);
                    return { studentId: sId, avgAtt: avg };
                }

                // Fallback to daily sessions if monthly is empty
                let total = 0;
                let present = 0;
                off.sessions.forEach(sess => {
                    const rec = sess.records.find(r => r.studentId === sId);
                    if (rec) {
                        total++;
                        if (rec.status) present++;
                    }
                });

                const dailyAvg = total > 0 ? Math.round((present / total) * 100) : 0;
                return { studentId: sId, avgAtt: dailyAvg };
            });

            // Attach to offering object for frontend consumption
            return {
                ...off,
                calculatedAverages: studentAverages
            };
        });

        res.json({ offerings: enrichedOfferings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// PATCH REPORT (update status / forward)
//////////////////////////////////////////////////

router.patch('/:id', requireAuth, requireRole('HOD', 'ADMIN', 'TEACHER', 'PRINCIPAL'), async (req, res) => {
    try {
        const { status, notes, content, title } = req.body;

        const report = await prisma.report.findUnique({
            where: { id: req.params.id }
        });

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        const updated = await prisma.report.update({
    where: { id: req.params.id },
    data: {
        ...(title ? { title } : {}),
        ...(status ? { status } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(notes
            ? {
                  content: (content || report.content)
                      ? `${content || report.content}\n\n--- Notes ---\n${notes}`
                      : notes
              }
            : {})
    }
});

        // Emit socket event
        const io = req.app.get('io');
        if (io) io.emit('report_change', { type: 'updated', reportId: updated.id });

        res.json(updated);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// DELETE REPORT (ADMIN or HOD)
//////////////////////////////////////////////////

router.delete('/:id', requireAuth, requireRole('ADMIN', 'HOD', 'PRINCIPAL'), async (req, res) => {
    try {
        await prisma.report.delete({
            where: { id: req.params.id }
        });

        // Emit socket event
        const io = req.app.get('io');
        if (io) io.emit('report_change', { type: 'deleted', reportId: req.params.id });

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



module.exports = router;