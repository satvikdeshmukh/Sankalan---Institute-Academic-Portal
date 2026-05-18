const express = require('express');
const { requireAuth, requireRole, prisma } = require('../middleware/auth');
const router = express.Router();

//////////////////////////////////////////////////
// GET /api/admin/users
//////////////////////////////////////////////////

router.get('/users', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: { profile: true },
            orderBy: { createdAt: 'desc' }
        });

        const result = users.map(u => ({
            id: u.id,
            fullName: u.profile?.fullName || u.email,
            email: u.email,
            role: u.role,
            isBlocked: u.isBlocked,
            createdAt: u.createdAt
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// DELETE /api/admin/users/:id
//////////////////////////////////////////////////

router.delete('/users/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        await prisma.user.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// BLOCK / UNBLOCK USERS
//////////////////////////////////////////////////

router.post('/block-user', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const { userId } = req.body;
        await prisma.user.update({
            where: { id: userId },
            data: { isBlocked: true }
        });
        res.json({ success: true, message: 'User blocked' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/unblock-user', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const { userId } = req.body;
        await prisma.user.update({
            where: { id: userId },
            data: { isBlocked: false }
        });
        res.json({ success: true, message: 'User unblocked' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET /api/admin/reports
//////////////////////////////////////////////////

router.get('/reports', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const reports = await prisma.report.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        profile: { select: { fullName: true } },
                        department: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reports.map(r => ({
            ...r,
            userId: r.user?.id,
            teacherName: r.user?.profile?.fullName || r.user?.email || 'Unknown Teacher',
            reporterRole: r.user?.role?.toLowerCase() || 'teacher',
            departmentName: r.user?.department?.name || ''
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET /api/admin/documents
//////////////////////////////////////////////////

router.get('/documents', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const docs = await prisma.document.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(docs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET /api/admin/staff-documents
// Returns all teachers, HODs, principals with
// their profiles, departments, and documents
//////////////////////////////////////////////////

router.get('/staff-documents', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const staffUsers = await prisma.user.findMany({
            where: { role: { in: ['TEACHER', 'HOD', 'PRINCIPAL'] } },
            include: {
                profile: true,
                department: true,
                documents: { orderBy: { createdAt: 'desc' } },
            },
            orderBy: { createdAt: 'desc' },
        });

        const result = staffUsers.map(u => ({
            id: u.id,
            email: u.email,
            role: u.role,                          // TEACHER | HOD | PRINCIPAL
            fullName: u.profile?.fullName || u.email.split('@')[0],
            phone: u.profile?.phone || null,
            qualifications: u.profile?.qualifications || null,
            department: u.department?.name || null,
            departmentShortId: u.department?.shortId || null,
            documents: u.documents.map(d => ({
                id: d.id,
                name: d.name,
                url: d.url,
                category: d.category || 'personal',
                fileType: d.fileType,
                size: d.size,
                createdAt: d.createdAt,
            })),
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET /api/admin/departments
//////////////////////////////////////////////////

router.get('/departments', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const departments = await prisma.department.findMany({
            include: {
                hod: {
                    include: { profile: true }
                },
                _count: {
                    select: { students: true, subjects: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        const result = departments.map(d => ({
            id: d.id,
            name: d.name,
            shortId: d.shortId,
            studentCount: d._count.students,
            subjectCount: d._count.subjects,
            hod: d.hod
                ? {
                    id: d.hod.id,
                    name: d.hod.profile?.fullName || null
                }
                : null
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/departments/:id/staff', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const dept = await prisma.department.findUnique({
            where: { id },
            include: {
                hod: { include: { profile: true } },
                users: { include: { profile: true } }
            }
        });

        if (!dept) return res.status(404).json({ error: "Department not found" });

        const staffMap = new Map();
        if (dept.hod) staffMap.set(dept.hod.id, dept.hod);
        if (dept.users) {
            dept.users.forEach(u => {
                if (!staffMap.has(u.id)) staffMap.set(u.id, u);
            });
        }

        const result = Array.from(staffMap.values()).map(u => ({
            id: u.id,
            fullName: u.profile?.fullName || u.email,
            email: u.email,
            role: u.role,
            profile: u.profile,
            createdAt: u.createdAt
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// POST /api/admin/departments
//////////////////////////////////////////////////

router.post('/departments', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const { name, shortId } = req.body;
        if (!name || !shortId) {
            return res.status(400).json({ error: 'Name and Short ID are required' });
        }
        const dept = await prisma.department.create({
            data: { name, shortId }
        });
        res.json(dept);
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({ error: 'Department name or Short ID already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// PUT /api/admin/departments/:id
//////////////////////////////////////////////////

router.put('/departments/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const { name, shortId } = req.body;
        const updateData = {};
        if (name) updateData.name = name;
        if (shortId) updateData.shortId = shortId;

        const dept = await prisma.department.update({
            where: { id: req.params.id },
            data: updateData
        });
        res.json(dept);
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({ error: 'Department name or Short ID already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// DELETE /api/admin/departments/:id
//////////////////////////////////////////////////

router.delete('/departments/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        await prisma.department.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        if (err.code === 'P2003') {
            return res.status(409).json({ error: 'Cannot delete department with existing students or subjects. Remove them first.' });
        }
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// ASSIGN HOD TO DEPARTMENT
//////////////////////////////////////////////////

router.post('/assign-hod', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const { departmentId, userId } = req.body;

        const department = await prisma.department.findUnique({
            where: { id: departmentId }
        });

        if (!department) {
            return res.status(404).json({ error: "Department not found" });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user || user.role !== "HOD") {
            return res.status(400).json({ error: "User must have HOD role" });
        }

        await prisma.department.update({
            where: { id: departmentId },
            data: { hodId: userId }
        });

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// ASSIGN PRINCIPAL (ONLY ONE)
//////////////////////////////////////////////////

router.post('/assign-principal', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const { userId } = req.body;

        const existingPrincipal = await prisma.institute.findFirst();

        if (existingPrincipal) {
            return res.status(400).json({
                error: "Principal already assigned"
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user || user.role !== "PRINCIPAL") {
            return res.status(400).json({
                error: "User must have PRINCIPAL role"
            });
        }

        await prisma.institute.create({
            data: { principalId: userId }
        });

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET /api/admin/teachers
//////////////////////////////////////////////////

router.get('/teachers', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const teachers = await prisma.user.findMany({
            where: { role: 'TEACHER' },
            include: {
                profile: true,
                department: true,
                teacherOfferings: {
                    include: { subject: true },
                    distinct: ['subjectId'],
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const result = teachers.map(t => ({
            id: t.id,
            email: t.email,
            fullName: t.profile?.fullName || t.email.split('@')[0],
            phone: t.profile?.phone || null,
            departmentId: t.departmentId,
            departmentName: t.department?.name || 'Unassigned',
            departmentShortId: t.department?.shortId || '',
            isBlocked: t.isBlocked,
            createdAt: t.createdAt,
            subjectCount: t.teacherOfferings.length,
            subjects: t.teacherOfferings.map(o => o.subject?.name).filter(Boolean),
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// TEACHER ATTENDANCE (Admin managed)
//////////////////////////////////////////////////

router.get('/teacher-attendance', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const { departmentId } = req.query;
        const where = {};
        if (departmentId) {
            const teachers = await prisma.user.findMany({
                where: { role: 'TEACHER', departmentId },
                select: { id: true }
            });
            where.teacherId = { in: teachers.map(t => t.id) };
        }

        const records = await prisma.teacherAttendance.findMany({
            where,
            include: {
                teacher: { include: { profile: true, department: true } }
            },
            orderBy: [{ date: 'desc' }]
        });

        const result = records.map(r => ({
            ...r,
            teacherName: r.teacher?.profile?.fullName || r.teacher?.email || '',
            departmentName: r.teacher?.department?.name || '',
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/teacher-attendance', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const { teacherId, date, status, type = 'DAILY', month, year, percentage } = req.body;
        if (!teacherId || !date) return res.status(400).json({ error: 'teacherId and date are required' });

        const dateObj = new Date(date);
        const record = await prisma.teacherAttendance.upsert({
            where: {
                teacherId_date_type: { teacherId, date: dateObj, type }
            },
            update: { status: status !== false, percentage },
            create: {
                teacherId,
                date: dateObj,
                month: month || (dateObj.getMonth() + 1),
                year: year || dateObj.getFullYear(),
                type,
                status: status !== false,
                percentage,
            }
        });

        req.app.get('io')?.emit('teacher_attendance_change', { type: 'upsert', record });
        res.json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/teacher-attendance/import', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const { rows } = req.body;
        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({ error: 'No rows provided' });
        }

        const allTeachers = await prisma.user.findMany({
            where: { role: 'TEACHER' },
            include: { profile: true },
        });

        const findTeacher = (row) => {
            const email = (row['Email'] || row['email'] || row['teacherEmail'] || row['Teacher Email'] || '').trim().toLowerCase();
            if (email) {
                const byEmail = allTeachers.find(t => t.email.toLowerCase() === email);
                if (byEmail) return byEmail;
            }
            const name = (row['Name'] || row['name'] || row['Teacher'] || row['Teacher Name'] || row['teacherName'] || row['Full Name'] || row['fullName'] || '').trim().toLowerCase();
            if (name) {
                let byName = allTeachers.find(t => (t.profile?.fullName || '').toLowerCase() === name);
                if (byName) return byName;
                byName = allTeachers.find(t => (t.profile?.fullName || '').toLowerCase().includes(name) || name.includes((t.profile?.fullName || '').toLowerCase()));
                if (byName) return byName;
            }
            return null;
        };

        const parseDate = (val) => {
            if (!val) return null;
            if (typeof val === 'number') {
                const d = new Date((val - 25569) * 86400 * 1000);
                if (!isNaN(d.getTime())) return d;
            }
            const d = new Date(val);
            return isNaN(d.getTime()) ? null : d;
        };

        let imported = 0, failed = 0, errors = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                const teacher = findTeacher(row);
                if (!teacher) {
                    failed++;
                    errors.push(`Row ${i + 1}: Teacher not found`);
                    continue;
                }

                const type = (row['Type'] || row['type'] || 'DAILY').toUpperCase();

                if (type === 'MONTHLY') {
                    const month = Number(row['Month'] || row['month'] || 0);
                    const year = Number(row['Year'] || row['year'] || 0);
                    const pct = parseFloat(row['Attendance %'] || row['Attendance'] || row['attendance'] || row['percentage'] || row['Percentage'] || 0);
                    if (!month || !year) { failed++; errors.push(`Row ${i + 1}: Missing month or year`); continue; }
                    const dateObj = new Date(year, month - 1, 1);
                    await prisma.teacherAttendance.upsert({
                        where: { teacherId_date_type: { teacherId: teacher.id, date: dateObj, type: 'MONTHLY' } },
                        update: { percentage: pct, status: pct >= 50 },
                        create: { teacherId: teacher.id, date: dateObj, month, year, type: 'MONTHLY', status: pct >= 50, percentage: pct }
                    });
                    imported++;
                } else {
                    const dateVal = row['Date'] || row['date'] || row['Attendance Date'] || '';
                    const dateObj = parseDate(dateVal);
                    if (!dateObj) { failed++; errors.push(`Row ${i + 1}: Invalid date "${dateVal}"`); continue; }
                    const statusRaw = String(row['Status'] || row['status'] || row['Attendance'] || row['attendance'] || '').trim().toLowerCase();
                    const isPresent = ['present', 'true', '1', 'p', 'yes', 'y'].includes(statusRaw);
                    await prisma.teacherAttendance.upsert({
                        where: { teacherId_date_type: { teacherId: teacher.id, date: dateObj, type: 'DAILY' } },
                        update: { status: isPresent, percentage: row.percentage ? parseFloat(row.percentage) : undefined },
                        create: { teacherId: teacher.id, date: dateObj, month: dateObj.getMonth() + 1, year: dateObj.getFullYear(), type: 'DAILY', status: isPresent, percentage: row.percentage ? parseFloat(row.percentage) : undefined }
                    });
                    imported++;
                }
            } catch (err) {
                failed++;
                errors.push(`Row ${i + 1}: ${err.message}`);
            }
        }

        req.app.get('io')?.emit('teacher_attendance_change', { type: 'bulk_import', imported });
        res.json({ imported, failed, total: rows.length, errors: errors.slice(0, 10) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// TEACHER FEEDBACK (Admin managed)
//////////////////////////////////////////////////

router.get('/teacher-feedback/:teacherId', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const feedbacks = await prisma.teacherFeedback.findMany({
            where: { teacherId: req.params.teacherId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(feedbacks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/teacher-feedback', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const { teacherId, rating, semester, remarks } = req.body;
        if (!teacherId || rating == null) return res.status(400).json({ error: 'teacherId and rating required' });
        if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });

        const feedback = await prisma.teacherFeedback.create({
            data: { teacherId, rating: parseFloat(rating), semester, remarks }
        });

        req.app.get('io')?.emit('teacher_feedback_change', { type: 'create', feedback });
        res.json(feedback);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// SEND FEEDBACK FORM TO STUDENTS (Email)
//////////////////////////////////////////////////

router.post('/send-feedback-form', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const { departmentId, formLink } = req.body;
        if (!departmentId || !formLink) return res.status(400).json({ error: 'departmentId and formLink required' });

        const students = await prisma.student.findMany({
            where: { departmentId, email: { not: null } },
            select: { email: true }
        });

        const emails = students.map(s => s.email).filter(Boolean);
        if (emails.length === 0) return res.status(400).json({ error: 'No student emails found in this department' });

        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_FROM,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const dept = await prisma.department.findUnique({ where: { id: departmentId } });

        const mailOptions = {
            from: `"Sankalan Academic System" <${process.env.EMAIL_FROM}>`,
            bcc: emails.join(','),
            subject: `📋 Teacher Feedback Form — ${dept?.name || 'Department'}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
                    <div style="background:#6366f1;padding:20px 28px">
                        <h2 style="color:#fff;margin:0;font-size:18px">📋 Teacher Feedback Request</h2>
                    </div>
                    <div style="padding:28px">
                        <p>Dear Student,</p>
                        <p>Please take a moment to provide your feedback on your teachers. Your responses are anonymous and will help improve teaching quality.</p>
                        <p style="text-align:center;margin:24px 0">
                            <a href="${formLink}" style="display:inline-block;padding:12px 32px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px">
                                Fill Feedback Form
                            </a>
                        </p>
                        <p style="color:#94a3b8;font-size:12px">Department: ${dept?.name || ''}</p>
                        <p style="color:#94a3b8;font-size:12px">Regards,<br><strong style="color:#374151">Sankalan Academic System</strong></p>
                    </div>
                </div>`
        };

        await transporter.sendMail(mailOptions);

        await prisma.feedbackFormLog.create({
            data: {
                departmentId,
                formLink,
                sentBy: req.user.id,
                recipientCount: emails.length,
            }
        });

        res.json({ success: true, sentTo: emails.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET FEEDBACK FORM LOGS
//////////////////////////////////////////////////

router.get('/feedback-logs', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const logs = await prisma.feedbackFormLog.findMany({
            orderBy: { sentAt: 'desc' }
        });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET TEACHER FULL PROFILE (Admin view)
//////////////////////////////////////////////////

router.get('/teacher-profile/:teacherId', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const { teacherId } = req.params;

        const [attendanceRecords, feedbacks, offeringsData, perfDataRaw] = await Promise.all([
            prisma.teacherAttendance.findMany({ where: { teacherId }, orderBy: [{ date: 'desc' }] }),
            prisma.teacherFeedback.findMany({ where: { teacherId }, orderBy: { createdAt: 'desc' } }),
            prisma.subjectOffering.findMany({ where: { teacherId }, select: { academicYear: true } }),
            prisma.teacherPerformanceData.findMany({ where: { teacherId }, orderBy: { academicYear: 'desc' } }),
        ]);

        // 1. Attendance grouped by month
        const monthlyMap = {};
        attendanceRecords.filter(r => r.type === 'DAILY').forEach(r => {
            const m = r.month || (r.date.getMonth() + 1);
            const y = r.year || r.date.getFullYear();
            const key = `${y}-${String(m).padStart(2, '0')}`;
            if (!monthlyMap[key]) monthlyMap[key] = { total: 0, present: 0 };
            monthlyMap[key].total++;
            if (r.status) monthlyMap[key].present++;
        });
        attendanceRecords.filter(r => r.type === 'MONTHLY').forEach(r => {
            const m = r.month;
            const y = r.year || r.date.getFullYear();
            const key = `${y}-${String(m).padStart(2, '0')}`;
            const pct = r.percentage != null ? parseFloat(r.percentage) : (r.status ? 100 : 0);
            monthlyMap[key] = { percentage: pct };
        });

        const allPcts = Object.values(monthlyMap).map(v => v.percentage != null ? v.percentage : ((v.present / v.total) * 100));
        const overallAtt = allPcts.length > 0 ? (allPcts.reduce((a, b) => a + b, 0) / allPcts.length).toFixed(1) : null;

        // 2. Feedback
        const avgRating = feedbacks.length > 0
            ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1) : null;

        // 3. Automated Performance Year Selection
        const offeringYears = offeringsData.map(o => o.academicYear).filter(Boolean);
        const manualYears = perfDataRaw.map(r => r.academicYear);
        const activeYear = [...new Set([...offeringYears, ...manualYears])].sort((a,b) => b.localeCompare(a))[0] 
            || new Date().getFullYear().toString();

        const latestManual = perfDataRaw.find(r => r.academicYear === activeYear) || null;

        const offerings = await prisma.subjectOffering.findMany({
            where: { teacherId, academicYear: activeYear },
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

        const performance = {
            ...(latestManual || {
                academicYear: activeYear,
                trainingsCompleted: 0,
                committeesParticipated: 0,
                eventsOrganized: 0,
                studentsMentored: 0
            }),
            totalEnrollments,
            appearedStudents: appearedSet.size,
            passedStudents: passedSet.size,
            failedStudents: appearedSet.size - passedSet.size,
            passRate: appearedSet.size > 0 ? ((passedSet.size / appearedSet.size) * 100).toFixed(1) : null
        };

        res.json({
            attendance: { overall: overallAtt, totalDays: attendanceRecords.length, presentDays: attendanceRecords.filter(r => r.status).length },
            feedback: { avgRating: avgRating ? parseFloat(avgRating) : null, count: feedbacks.length, history: feedbacks },
            performance,
            allPerformance: perfDataRaw,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;