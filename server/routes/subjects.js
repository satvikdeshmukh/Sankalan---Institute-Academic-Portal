const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { requireAuth, requireRole, prisma } = require('../middleware/auth');
const xlsx = require('xlsx');

const router = express.Router();

//////////////////////////////////////////////////
// ASSIGN TEACHER TO SUBJECT (CREATE OFFERING)
//////////////////////////////////////////////////

router.post('/:subjectId/assign-teacher', requireAuth, requireRole('ADMIN', 'HOD'), async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { teacherId, section, academicYear } = req.body; 

        if (!teacherId || !section) {
            return res.status(400).json({ error: 'teacherId and section are required' });
        }

        // Fetch parent subject to inherit the year and semester
        const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
        if (!subject) return res.status(404).json({ error: 'Subject not found' });

        const ay = academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

        const offering = await prisma.subjectOffering.create({
            data: {
                subjectId,
                teacherId,
                academicYear: ay,
                year: subject.year,         // Inherited from Subject
                semester: subject.semester, // Inherited from Subject
                section
            },
            include: {
                teacher: { include: { profile: true } },
                subject: { include: { department: true } }
            }
        });

        res.json({
            ...offering,
            teacherName: offering.teacher?.profile?.fullName || '',
            teacherEmail: offering.teacher?.email || '',
        });
    } catch (err) {
        if (err.code === 'P2002') return res.status(409).json({ error: 'This teacher is already assigned to this subject/section' });
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// EDIT ASSIGNED TEACHER (OFFERING)
//////////////////////////////////////////////////

router.put('/offerings/:offeringId', requireAuth, requireRole('ADMIN', 'HOD'), async (req, res) => {
    try {
        const { teacherId, section } = req.body;
        
        const offering = await prisma.subjectOffering.update({
            where: { id: req.params.offeringId },
            data: { teacherId, section },
            include: {
                teacher: { include: { profile: true } },
                subject: { include: { department: true } }
            }
        });

        res.json(offering);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// REMOVE ASSIGNED TEACHER (OFFERING)
//////////////////////////////////////////////////

router.delete('/offerings/:offeringId', requireAuth, requireRole('ADMIN', 'HOD'), async (req, res) => {
    try {
        await prisma.subjectOffering.delete({
            where: { id: req.params.offeringId }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// File upload setup
//////////////////////////////////////////////////

const uploadDir = path.join(__dirname, '..', 'uploads', 'subject-docs');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

//////////////////////////////////////////////////
// GET ALL SUBJECTS
//////////////////////////////////////////////////

router.get('/', requireAuth, async (req, res) => {
    try {
        const subjects = await prisma.subject.findMany({
            include: {
                department: true,
                _count: { select: { offerings: true } }
            }
        });
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id/details', requireAuth, async (req, res) => {
    try {

        const subject = await prisma.subject.findUnique({
            where: { id: req.params.id },
            include: {
                department: true,
                documents: true,
                offerings: {
                    include: {
                        teacher: { include: { profile: true } },
                        subject: true,
                        _count: { select: { enrollments: true } }
                    },
                    orderBy: [
                        { year: 'desc' },
                        { semester: 'desc' },
                        { section: 'asc' }
                    ]
                }
            }
        });

        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        res.json(subject);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET STUDENTS MANAGED BY TEACHER
//////////////////////////////////////////////////

router.get('/managed', requireAuth, async (req, res) => {
    try {
        const { id: teacherId, role } = req.user;

        if (role !== 'TEACHER') {
            return res.status(403).json({ error: 'Only teachers allowed' });
        }

        // 1️⃣ Get teacher offerings
        const offerings = await prisma.subjectOffering.findMany({
            where: { teacherId },
            include: { subject: true }
        });

        if (!offerings.length) {
            return res.json({ offerings: [], classAssignments: [], students: [] });
        }

        const offeringIds = offerings.map(o => o.id);

        // 2️⃣ Get enrollments
        const enrollments = await prisma.subjectEnrollment.findMany({
            where: { subjectOfferingId: { in: offeringIds } },
            include: {
                student: {
                    include: {
                        department: true,
                        enrollments: true
                    }
                },
                subjectOffering: {
                    include: { subject: true }
                }
            }
        });

        const studentMap = {};

        for (const enr of enrollments) {
            const s = enr.student;
            const off = enr.subjectOffering;

            if (!studentMap[s.id]) {
                studentMap[s.id] = {
                    id: s.id,
                    fullName: s.fullName,
                    studentId: s.studentId,
                    department: s.department,
                    enrollments: s.enrollments,
                    overallAggregate: 0,
                    subjects: {}
                };
            }

            studentMap[s.id].subjects[off.id] = {
                offeringId: off.id,
                subjectName: off.subject.name,
                subjectCode: off.subject.code,
                section: off.section,
                aggregate: 0,
                totalPresent: 0,
                totalSessions: 0,
                monthly: [],
                daily: []
            };
        }

        // 3️⃣ Get attendance sessions
        const sessions = await prisma.attendanceSession.findMany({
            where: { subjectOfferingId: { in: offeringIds } },
            include: { records: true }
        });

        for (const session of sessions) {
            for (const record of session.records) {

                const student = studentMap[record.studentId];
                if (!student) continue;

                const subject = student.subjects[session.subjectOfferingId];
                if (!subject) continue;

                subject.totalSessions += 1;
                if (record.status) subject.totalPresent += 1;

                subject.daily.push({
                    date: session.date,
                    status: record.status
                });

                const month = new Date(session.date).getMonth() + 1;
                const year = new Date(session.date).getFullYear();

                let monthObj = subject.monthly.find(
                    m => m.month === month && m.year === year
                );

                if (!monthObj) {
                    monthObj = {
                        month,
                        year,
                        totalPresent: 0,
                        totalSessions: 0,
                        percentage: 0
                    };
                    subject.monthly.push(monthObj);
                }

                monthObj.totalSessions += 1;
                if (record.status) monthObj.totalPresent += 1;
            }
        }

        // 4️⃣ Merge directly imported AttendanceMonthly records
        const monthlyRecords = await prisma.attendanceMonthly.findMany({
            where: { subjectOfferingId: { in: offeringIds } }
        });

        for (const mr of monthlyRecords) {
            const student = studentMap[mr.studentId];
            if (!student) continue;

            const subject = student.subjects[mr.subjectOfferingId];
            if (!subject) continue;

            let monthObj = subject.monthly.find(
                m => m.month === mr.month && m.year === mr.year
            );

            if (!monthObj) {
                subject.monthly.push({
                    month: mr.month,
                    year: mr.year,
                    totalPresent: 0,
                    totalSessions: 0,
                    percentage: mr.percentage
                });
            } else if (monthObj.totalSessions === 0) {
                monthObj.percentage = mr.percentage;
            }
        }

        // 5️⃣ Final calculations
        Object.values(studentMap).forEach(student => {
            let totalP = 0;
            let totalS = 0;
            let monthlyPercentages = []; 

            Object.values(student.subjects).forEach(sub => {
                sub.aggregate = sub.totalSessions === 0
                    ? 0
                    : Math.round((sub.totalPresent / sub.totalSessions) * 100);

                sub.monthly.forEach(m => {
                    if (m.totalSessions > 0) {
                        m.percentage = Math.round((m.totalPresent / m.totalSessions) * 100);
                    }
                });

                if (sub.totalSessions === 0 && sub.monthly.length > 0) {
                    const monthlyWithData = sub.monthly.filter(m => m.percentage > 0);
                    if (monthlyWithData.length > 0) {
                        sub.aggregate = Math.round(
                            monthlyWithData.reduce((sum, m) => sum + m.percentage, 0) / monthlyWithData.length
                        );
                    }
                }

                totalP += sub.totalPresent;
                totalS += sub.totalSessions;

                sub.monthly.forEach(m => {
                    if (m.percentage > 0) monthlyPercentages.push(m.percentage);
                });
            });

            if (totalS > 0) {
                student.overallAggregate = Math.round((totalP / totalS) * 100);
            } else if (monthlyPercentages.length > 0) {
                student.overallAggregate = Math.round(
                    monthlyPercentages.reduce((sum, p) => sum + p, 0) / monthlyPercentages.length
                );
            } else {
                student.overallAggregate = 0;
            }
        });

        res.json({
            offerings: offerings.map(o => ({
                id: o.id,
                subjectName: o.subject.name,
                section: o.section
            })),
            classAssignments: [],
            students: Object.values(studentMap)
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// CREATE SUBJECT (ADMIN or HOD)
//////////////////////////////////////////////////

router.post('/', requireAuth, requireRole('ADMIN', 'HOD'), async (req, res) => {
    try {

        const { name, code, type, departmentId, year, semester } = req.body;

        if (!name || !departmentId) {
            return res.status(400).json({
                error: 'Name and department are required'
            });
        }

        const subject = await prisma.subject.create({
            data: {
                name: name.trim(),
                code: code?.trim() || null,
                type: type || 'THEORY',
                year: year ? Number(year) : 1,
                semester: semester ? Number(semester) : 1,
                departmentId
            }
        });

        res.json(subject);

    } catch (err) {

        if (err.code === 'P2002') {
            return res.status(409).json({
                error: 'Subject already exists in department'
            });
        }

        res.status(500).json({ error: err.message });
    }
});


//////////////////////////////////////////////////
// CREATE SUBJECT OFFERING (ADMIN or HOD)
//////////////////////////////////////////////////

router.post('/offering', requireAuth, requireRole('ADMIN', 'HOD'), async (req, res) => {
    try {
        const { subjectId, teacherId, year, semester, section } = req.body;

        const offering = await prisma.subjectOffering.create({
            data: {
                subjectId,
                teacherId,
                academicYear: null,
                year: Number(year),
                semester: Number(semester),
                section: section || 'A'
            }
        });

        res.json(offering);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET OFFERINGS (Role-Based)
//////////////////////////////////////////////////

router.get('/offerings', requireAuth, async (req, res) => {
    try {
        const { role, id } = req.user;

        if (role === 'ADMIN' || role === 'PRINCIPAL') {
            return res.json(
                await prisma.subjectOffering.findMany({
                    include: {
                        subject: true,
                        teacher: { include: { profile: true } },
                        marks: true,
                        monthly: true
                    }
                })
            );
        }

        if (role === 'HOD') {
            const department = await prisma.department.findFirst({
                where: { hodId: id }
            });

            return res.json(
                await prisma.subjectOffering.findMany({
                    where: {
                        subject: { departmentId: department.id }
                    },
                    include: {
                        subject: true,
                        teacher: { include: { profile: true } },
                        marks: true,
                        monthly: true
                    }
                })
            );
        }

        if (role === 'TEACHER') {
            return res.json(
                await prisma.subjectOffering.findMany({
                    where: { teacherId: id },
                    include: { subject: true }
                })
            );
        }

        res.status(403).json({ error: "Unauthorized role" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// SUBJECT DOCUMENTS (Admin or Assigned Teacher)
//////////////////////////////////////////////////

router.post('/:offeringId/documents', requireAuth, upload.single('file'), async (req, res) => {
    try {
        const { offeringId } = req.params;
        const userId = req.user.id;
        const role = req.user.role;

        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const offering = await prisma.subjectOffering.findUnique({
            where: { id: offeringId }
        });

        if (!offering) return res.status(404).json({ error: 'Offering not found' });

        if (role !== 'ADMIN' && offering.teacherId !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const doc = await prisma.document.create({
            data: {
                userId,
                subjectOfferingId: offeringId,
                name: req.file.originalname,
                url: `/uploads/subject-docs/${req.file.filename}`
            }
        });

        res.json(doc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Subject-level documents
router.post('/subject/:id/documents', requireAuth, requireRole('ADMIN', 'HOD'), upload.single('file'), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const doc = await prisma.document.create({
            data: {
                userId,
                subjectId: id,
                name: req.file.originalname,
                url: `/uploads/subject-docs/${req.file.filename}`
            }
        });

        res.json(doc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// STUDENT ENROLLMENT (Subject Level)
//////////////////////////////////////////////////

router.get('/offerings/:offeringId/students', requireAuth, async (req, res) => {
    try {
        const { offeringId } = req.params;
        const { id: userId, role } = req.user;

        const offering = await prisma.subjectOffering.findUnique({
            where: { id: offeringId },
            include: { subject: true }
        });

        if (!offering) {
            return res.status(404).json({ error: 'Offering not found' });
        }

        if (role === 'TEACHER' && offering.teacherId !== userId) {
            return res.status(403).json({ error: 'Not authorized for this offering' });
        }

        const enrollments = await prisma.subjectEnrollment.findMany({
            where: { subjectOfferingId: offeringId },
            include: {
                student: {
                    include: {
                        enrollments: true
                    }
                }
            },
            orderBy: {
                student: { fullName: 'asc' }
            }
        });

        res.json(enrollments.map(e => ({
            id: e.student.id,
            studentId: e.student.studentId,
            fullName: e.student.fullName,
            email: e.student.email || null,
            departmentId: e.student.departmentId,
            section: e.student.enrollments.find(enr => enr.academicYear === offering.academicYear)?.section || 'A'
        })));

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/offerings/:offeringId/enroll', requireAuth, async (req, res) => {
    try {
        const { offeringId } = req.params;
        const { studentId, studentExternalId } = req.body;

        const offering = await prisma.subjectOffering.findUnique({
            where: { id: offeringId },
            include: { subject: true }
        });

        if (req.user.role === 'TEACHER' && offering.teacherId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        if (!offering) return res.status(404).json({ error: 'Offering not found' });

        let targetId = studentId;
        if (!targetId && studentExternalId) {
            const s = await prisma.student.findUnique({ where: { studentId: studentExternalId } });
            if (!s) return res.status(404).json({ error: 'Student not found' });
            targetId = s.id;
        }

        if (!targetId) return res.status(400).json({ error: 'Student ID record required' });

        const student = await prisma.student.findUnique({
            where: { id: targetId },
            include: {
                enrollments: {
                    orderBy: { academicYear: 'desc' },
                    take: 1
                }
            }
        });

        if (!student) return res.status(404).json({ error: 'Student record not found' });

        if (student.departmentId !== offering.subject.departmentId) {
            return res.status(400).json({ error: 'Student belongs to a different department' });
        }

        const currentEnrollment = student.enrollments[0];
        
        // Strict Validation: Year and Semester MUST match!
        if (!currentEnrollment || currentEnrollment.year !== offering.year) {
            return res.status(400).json({ error: `Student is not enrolled in Year ${offering.year}` });
        }
        if (currentEnrollment.semester !== offering.semester) {
            return res.status(400).json({ error: `Student is not enrolled in Semester ${offering.semester}` });
        }
        if (currentEnrollment.section && String(currentEnrollment.section).toUpperCase() !== String(offering.section).toUpperCase()) {
            return res.status(400).json({ error: `Student belongs to Section ${currentEnrollment.section}, not Section ${offering.section}` });
        }

        const enrollment = await prisma.subjectEnrollment.create({
            data: {
                studentId: targetId,
                subjectOfferingId: offeringId
            }
        });

        res.json(enrollment);
    } catch (err) {
        if (err.code === 'P2002') return res.status(409).json({ error: 'Student already enrolled in this subject' });
        res.status(500).json({ error: err.message });
    }
});

// GET BULK ENROLL PREVIEW (Filtered by Year AND Section)
router.get('/offerings/:offeringId/enroll-preview', requireAuth, requireRole('ADMIN', 'HOD'), async (req, res) => {
    try {
        const { offeringId } = req.params;

        const offering = await prisma.subjectOffering.findUnique({
            where: { id: offeringId },
            include: { subject: true }
        });

        if (!offering) return res.status(404).json({ error: 'Offering not found' });

        const students = await prisma.student.findMany({
    where: {
        departmentId: offering.subject.departmentId,
        enrollments: {
            some: {
                year: offering.year,
                semester: offering.semester,
                section: offering.section
            }
        },
        NOT: {
            subjectEnrollments: {
                some: {
                    subjectOfferingId: offeringId
                }
            }
        }
    },
    select: {
        id: true,
        studentId: true,
        fullName: true
    }
});

        res.json(students);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/offerings/:offeringId/enroll-bulk', requireAuth, requireRole('ADMIN', 'HOD'), async (req, res) => {
    try {
        const { offeringId } = req.params;

        const offering = await prisma.subjectOffering.findUnique({
            where: { id: offeringId },
            include: { subject: true }
        });

        if (!offering) return res.status(404).json({ error: 'Offering not found' });

        // Filter students by department, year AND section
        const students = await prisma.student.findMany({
            where: {
                departmentId: offering.subject.departmentId,
                enrollments: {
                    some: {
                        year: offering.year,
                        semester: offering.semester,
                        section: offering.section  // <-- 💥 Strict Section Matching!
                    }
                }
            }
        });

        if (students.length === 0) return res.json({ count: 0, message: "No students found for this section & year" });

        const data = students.map(s => ({
            studentId: s.id,
            subjectOfferingId: offeringId
        }));

        const result = await prisma.subjectEnrollment.createMany({
            data,
            skipDuplicates: true
        });

        res.json({ count: result.count, message: `Enrolled ${result.count} students.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/offerings/:offeringId/unenroll/:studentId', requireAuth, async (req, res) => {
    try {
        const { offeringId, studentId } = req.params;

        const offering = await prisma.subjectOffering.findUnique({
            where: { id: offeringId }
        });

        if (!offering) return res.status(404).json({ error: 'Offering not found' });

        if (req.user.role === 'TEACHER' && offering.teacherId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await prisma.subjectEnrollment.delete({
            where: {
                studentId_subjectOfferingId: {
                    studentId,
                    subjectOfferingId: offeringId
                }
            }
        });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// DELETE DOCUMENT
//////////////////////////////////////////////////

router.delete('/documents/:docId', requireAuth, async (req, res) => {
    try {
        const { docId } = req.params;
        const userId = req.user.id;
        const role = req.user.role;

        const doc = await prisma.document.findUnique({ where: { id: docId } });
        if (!doc) return res.status(404).json({ error: 'Document not found' });

        if (role !== 'ADMIN' && doc.userId !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const filePath = path.join(__dirname, '..', doc.url);
        if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch {}
        }

        await prisma.document.delete({ where: { id: docId } });
        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET DOCUMENTS
//////////////////////////////////////////////////

router.get('/:offeringId/documents', requireAuth, async (req, res) => {
    try {
        const docs = await prisma.document.findMany({
            where: { subjectOfferingId: req.params.offeringId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(docs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// UPDATE ATTENDANCE MONTHLY (TEACHER)
//////////////////////////////////////////////////

router.put('/attendance-monthly', requireAuth, requireRole('TEACHER'), async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { records } = req.body;

        if (!records || !Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ error: 'No records provided' });
        }

        let updated = 0;
        const errors = [];

        for (const r of records) {
            const offering = await prisma.subjectOffering.findUnique({ where: { id: r.subjectOfferingId } });
            if (!offering || offering.teacherId !== teacherId) {
                errors.push(`Not authorized for offering ${r.subjectOfferingId}`);
                continue;
            }

            const pct = Number(r.percentage);
            if (isNaN(pct) || pct < 0 || pct > 100) {
                errors.push(`Invalid percentage ${r.percentage}`);
                continue;
            }

            await prisma.attendanceMonthly.upsert({
                where: {
                    studentId_subjectOfferingId_month_year: {
                        studentId: r.studentId,
                        subjectOfferingId: r.subjectOfferingId,
                        month: Number(r.month),
                        year: Number(r.year)
                    }
                },
                update: { percentage: Math.round(pct) },
                create: {
                    studentId: r.studentId,
                    subjectOfferingId: r.subjectOfferingId,
                    month: Number(r.month),
                    year: Number(r.year),
                    percentage: Math.round(pct)
                }
            });
            updated++;
        }

        res.json({ message: `Updated ${updated} records`, updated, errors });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// DELETE ATTENDANCE MONTHLY (TEACHER)
//////////////////////////////////////////////////

router.delete('/attendance-monthly', requireAuth, requireRole('TEACHER'), async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { records } = req.body;

        if (!records || !Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ error: 'No records provided' });
        }

        let deleted = 0;
        const errors = [];

        for (const r of records) {
            const offering = await prisma.subjectOffering.findUnique({ where: { id: r.subjectOfferingId } });
            if (!offering || offering.teacherId !== teacherId) {
                errors.push(`Not authorized for offering ${r.subjectOfferingId}`);
                continue;
            }

            try {
                await prisma.attendanceMonthly.delete({
                    where: {
                        studentId_subjectOfferingId_month_year: {
                            studentId: r.studentId,
                            subjectOfferingId: r.subjectOfferingId,
                            month: Number(r.month),
                            year: Number(r.year)
                        }
                    }
                });
                deleted++;
            } catch {
                // Record may not exist
            }

            const startDate = new Date(Number(r.year), Number(r.month) - 1, 1);
            const endDate = new Date(Number(r.year), Number(r.month), 0, 23, 59, 59);

            const sessions = await prisma.attendanceSession.findMany({
                where: {
                    subjectOfferingId: r.subjectOfferingId,
                    date: { gte: startDate, lte: endDate }
                }
            });

            for (const session of sessions) {
                await prisma.attendanceRecord.deleteMany({
                    where: {
                        sessionId: session.id,
                        studentId: r.studentId
                    }
                });
            }
        }

        res.json({ message: `Deleted ${deleted} records`, deleted, errors });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// IMPORT ATTENDANCE FROM EXCEL (SMART FORMAT)
//////////////////////////////////////////////////

const MONTH_ABBREVS = {
    'jan': 1, 'january': 1, 'feb': 2, 'february': 2,
    'mar': 3, 'march': 3, 'apr': 4, 'april': 4,
    'may': 5, 'jun': 6, 'june': 6, 'jul': 7, 'july': 7,
    'aug': 8, 'august': 8, 'sep': 9, 'september': 9, 'sept': 9,
    'oct': 10, 'october': 10, 'nov': 11, 'november': 11,
    'dec': 12, 'december': 12,
};

function detectExcelFormat(headers) {
    const dataCols = headers.slice(2).map(h => String(h || '').trim().toLowerCase());
    if (dataCols.length === 0) return 'UNKNOWN';
    const monthMatches = dataCols.filter(h => MONTH_ABBREVS[h] !== undefined);
    if (monthMatches.length >= 2) return 'YEARLY';
    const dateCount = dataCols.filter(h => {
        if (!h) return false;
        if (!isNaN(Number(h)) && Number(h) > 40000) return true;
        const d = new Date(h);
        return !isNaN(d.getTime()) && d.getFullYear() > 2000;
    }).length;
    if (dateCount >= 2) return 'DAILY';
    if (dataCols.length === 1 || (dataCols.length >= 1 && dataCols[0] !== '')) return 'MONTHLY';
    return 'MONTHLY'; 
}

function parseExcelDate(val) {
    if (typeof val === 'number') {
        return new Date((val - 25569) * 86400 * 1000);
    }
    return new Date(val);
}

function isPresentValue(val) {
    const s = String(val || '').trim().toUpperCase();
    return s === 'P' || s === 'PRESENT' || s === 'TRUE' || s === '1';
}

router.post(
    '/import-attendance',
    requireAuth,
    requireRole('TEACHER'),
    upload.single('file'),
    async (req, res) => {
        try {
            const teacherId = req.user.id;
            const { offeringId, month, year, format: userFormat } = req.body;

            if (!req.file) return res.status(400).json({ error: 'Excel file is required' });
            if (!offeringId) return res.status(400).json({ error: 'Subject offering is required' });

            const offering = await prisma.subjectOffering.findUnique({ where: { id: offeringId } });
            if (!offering || offering.teacherId !== teacherId) {
                return res.status(403).json({ error: 'Not authorized for this subject offering' });
            }

            const workbook = xlsx.readFile(req.file.path);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

            if (rows.length < 2) return res.status(400).json({ error: 'Excel file is empty or has no data rows' });

            const format = (userFormat || 'MONTHLY').toUpperCase();
            let processed = 0;
            let skipped = 0;
            const errors = [];

            if (format === 'MONTHLY') {
                if (!month || !year) return res.status(400).json({ error: 'Month and year are required for this Excel format' });
                const monthNum = Number(month);
                const yearNum = Number(year);
                if (monthNum < 1 || monthNum > 12 || isNaN(yearNum)) return res.status(400).json({ error: 'Invalid month or year' });

                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    const sid = String(row[0] || '').trim();
                    const pct = Number(row[2]);

                    if (!sid) continue;
                    if (isNaN(pct) || pct < 0 || pct > 100) { errors.push(`Row ${i + 1}: Invalid percentage for ${sid}`); skipped++; continue; }

                    const student = await prisma.student.findUnique({ where: { studentId: sid } });
                    if (!student) { errors.push(`Row ${i + 1}: Student ${sid} not found`); skipped++; continue; }

                    await prisma.attendanceMonthly.upsert({
                        where: {
                            studentId_subjectOfferingId_month_year: {
                                studentId: student.id, subjectOfferingId: offeringId,
                                month: monthNum, year: yearNum
                            }
                        },
                        update: { percentage: Math.round(pct) },
                        create: {
                            studentId: student.id, subjectOfferingId: offeringId,
                            month: monthNum, year: yearNum, percentage: Math.round(pct)
                        }
                    });
                    processed++;
                }
            } else if (format === 'YEARLY') {
                const yearNum = Number(year);
                if (!year || isNaN(yearNum)) return res.status(400).json({ error: 'Year is required for yearly Excel format' });

                const monthCols = [];
                for (let j = 2; j < headers.length; j++) {
                    const hdr = String(headers[j] || '').trim().toLowerCase();
                    const monthNum = MONTH_ABBREVS[hdr];
                    if (monthNum !== undefined) monthCols.push({ col: j, month: monthNum });
                }

                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    const sid = String(row[0] || '').trim();
                    if (!sid) continue;

                    const student = await prisma.student.findUnique({ where: { studentId: sid } });
                    if (!student) { errors.push(`Row ${i + 1}: Student ${sid} not found`); skipped++; continue; }

                    for (const mc of monthCols) {
                        const val = row[mc.col];
                        if (val === undefined || val === null || val === '') continue;

                        const pct = Number(val);
                        if (isNaN(pct) || pct < 0 || pct > 100) { errors.push(`Row ${i + 1}: Invalid % for ${sid} in month ${mc.month}`); skipped++; continue; }

                        await prisma.attendanceMonthly.upsert({
                            where: {
                                studentId_subjectOfferingId_month_year: {
                                    studentId: student.id, subjectOfferingId: offeringId,
                                    month: mc.month, year: yearNum
                                }
                            },
                            update: { percentage: Math.round(pct) },
                            create: {
                                studentId: student.id, subjectOfferingId: offeringId,
                                month: mc.month, year: yearNum, percentage: Math.round(pct)
                            }
                        });
                        processed++;
                    }
                }
            } else if (format === 'DAILY') {
                if (!month || !year) return res.status(400).json({ error: 'Month and year are required for daily attendance' });
                const monthNum = Number(month);
                const yearNum = Number(year);
                if (monthNum < 1 || monthNum > 12 || isNaN(yearNum)) return res.status(400).json({ error: 'Invalid month or year' });

                const headers = rows[0];
                const dayCols = [];
                for (let j = 2; j < headers.length; j++) {
                    const hdr = headers[j];
                    if (hdr === undefined || hdr === null || hdr === '') continue;
                    dayCols.push({ col: j, dayIndex: j - 1 }); 
                }

                if (dayCols.length === 0) return res.status(400).json({ error: 'No day columns found in the file' });

                const sessionMap = {};
                for (const dc of dayCols) {
                    const dayNum = Math.min(dc.dayIndex, 28);
                    const sessionDate = new Date(yearNum, monthNum - 1, dayNum);
                    const key = sessionDate.toISOString();

                    if (!sessionMap[key]) {
                        const session = await prisma.attendanceSession.upsert({
                            where: {
                                subjectOfferingId_date: {
                                    subjectOfferingId: offeringId,
                                    date: sessionDate
                                }
                            },
                            update: {},
                            create: {
                                subjectOfferingId: offeringId,
                                date: sessionDate
                            }
                        });
                        sessionMap[key] = session;
                    }
                    dc.session = sessionMap[key];
                }

                const studentCounts = {}; 

                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    const sid = String(row[0] || '').trim();
                    if (!sid) continue;

                    const student = await prisma.student.findUnique({ where: { studentId: sid } });
                    if (!student) { errors.push(`Row ${i + 1}: Student ${sid} not found`); skipped++; continue; }

                    if (!studentCounts[student.id]) {
                        studentCounts[student.id] = { studentId: student.id, present: 0, total: 0 };
                    }

                    for (const dc of dayCols) {
                        const val = row[dc.col];
                        if (val === undefined || val === null || val === '') continue;

                        const status = isPresentValue(val);

                        await prisma.attendanceRecord.upsert({
                            where: {
                                sessionId_studentId: {
                                    sessionId: dc.session.id,
                                    studentId: student.id
                                }
                            },
                            update: { status },
                            create: {
                                sessionId: dc.session.id,
                                studentId: student.id,
                                status
                            }
                        });

                        studentCounts[student.id].total++;
                        if (status) studentCounts[student.id].present++;
                        processed++;
                    }
                }

                for (const entry of Object.values(studentCounts)) {
                    const pct = entry.total > 0 ? Math.round((entry.present / entry.total) * 100) : 0;

                    await prisma.attendanceMonthly.upsert({
                        where: {
                            studentId_subjectOfferingId_month_year: {
                                studentId: entry.studentId, subjectOfferingId: offeringId,
                                month: monthNum, year: yearNum
                            }
                        },
                        update: { percentage: pct },
                        create: {
                            studentId: entry.studentId, subjectOfferingId: offeringId,
                            month: monthNum, year: yearNum, percentage: pct
                        }
                    });
                }
            }

            try { fs.unlinkSync(req.file.path); } catch { }

            res.json({
                message: 'Attendance imported successfully',
                format,
                records: processed,
                skipped,
                errors: errors.slice(0, 10)
            });

        } catch (err) {
            console.error('Attendance import error:', err);
            res.status(500).json({ error: err.message });
        }
    }
);

//////////////////////////////////////////////////
// DELETE SUBJECT (ADMIN or HOD)
//////////////////////////////////////////////////

router.delete('/:id', requireAuth, requireRole('ADMIN','HOD'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if offerings exist
        const offerings = await prisma.subjectOffering.findMany({
            where: { subjectId: id }
        });

        if (offerings.length > 0) {
            return res.status(400).json({
                error: 'Cannot delete subject. Remove assigned teachers/offerings first.'
            });
        }

        await prisma.subject.delete({
            where: { id }
        });

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.put('/:id', requireAuth, requireRole('ADMIN','HOD'), async (req, res) => {

    try {

        const { id } = req.params;
        const { name, code, type, year, semester } = req.body;

        const subject = await prisma.subject.update({
            where: { id },
            data: {
                name: name.trim(),
                code: code?.trim() || null,
                type,
                year: year ? Number(year) : undefined,
                semester: semester ? Number(semester) : undefined
            }
        });

        res.json(subject);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;