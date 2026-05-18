const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { requireAuth, requireRole, prisma } = require('../middleware/auth');

const router = express.Router();

// File upload setup
const uploadDir = path.join(__dirname, '..', 'uploads', 'course-docs');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB

//////////////////////////////////////////////////
// GET AVAILABLE SUBJECTS (from teacher's department)
//////////////////////////////////////////////////
router.get('/available-subjects', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { departmentId: true }
        });
        if (!user?.departmentId) return res.json([]);
        const subjects = await prisma.subject.findMany({
            where: { departmentId: user.departmentId },
            include: { department: true }
        });
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET ALL OFFERINGS (role-based, enriched)
//////////////////////////////////////////////////
router.get('/', requireAuth, async (req, res) => {
    try {
        const { id, role } = req.user;

        const where = role === 'TEACHER' ? { teacherId: id } : {};

        const offerings = await prisma.subjectOffering.findMany({
            where,
            include: {
                subject: {
                    include: {
                        department: true,
                        documents: { orderBy: { createdAt: 'desc' } }
                    }
                },
                teacher: {
                    include: {
                        profile: true
                    }
                },
                documents: { orderBy: { createdAt: 'desc' } },
                _count: { select: { sessions: true, marks: true, enrollments: true } }
            },
            orderBy: [{ year: 'asc' }, { semester: 'asc' }, { section: 'asc' }]
        });

        // Enrich with teacher email + name
        const enriched = offerings.map(o => ({
            ...o,
            teacherEmail: o.teacher?.email || '',
            teacherName: o.teacher?.profile?.fullName || o.teacher?.email || '',
        }));

        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// ADD DOCUMENT TO OFFERING
//////////////////////////////////////////////////
router.post('/:offeringId/documents', requireAuth, upload.single('file'), async (req, res) => {
    try {
        const { offeringId } = req.params;
        const userId = req.user.id;

        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const doc = await prisma.document.create({
            data: {
                userId,
                subjectOfferingId: offeringId,
                name: req.file.originalname,
                url: `/uploads/course-docs/${req.file.filename}`
            }
        });

        res.json(doc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET DOCUMENTS FOR AN OFFERING
//////////////////////////////////////////////////
router.get('/:offeringId/documents', requireAuth, async (req, res) => {
    try {
        const { offeringId } = req.params;

        const offering = await prisma.subjectOffering.findUnique({
            where: { id: offeringId },
            select: { subjectId: true }
        });

        if (!offering) {
            return res.status(404).json({ error: 'Offering not found' });
        }

        const docs = await prisma.document.findMany({
            where: {
                OR: [
                    { subjectOfferingId: offeringId }, // teacher uploads
                    { subjectId: offering.subjectId }  // HOD/Admin uploads
                ]
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(docs);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET ENROLLED STUDENTS FOR AN OFFERING
// Returns students with email, section, year
//////////////////////////////////////////////////
router.get('/:offeringId/students', requireAuth, async (req, res) => {
    try {
        const { offeringId } = req.params;

        const enrollments = await prisma.subjectEnrollment.findMany({
            where: { subjectOfferingId: offeringId },
            include: {
                student: {
                    include: {
                        department: true,
                        enrollments: { orderBy: { academicYear: 'desc' }, take: 1 }
                    }
                }
            },
            orderBy: { student: { fullName: 'asc' } }
        });

        const students = enrollments.map(e => {
            const latest = e.student.enrollments?.[0];
            return {
                id: e.student.id,
                studentId: e.student.studentId,
                fullName: e.student.fullName,
                email: e.student.email || '',
                department: e.student.department?.name || '',
                departmentId: e.student.departmentId,
                section: latest?.section || 'A',
                year: latest?.year || null,
                semester: latest?.semester || null,
            };
        });

        res.json(students);
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

        const doc = await prisma.document.findUnique({ where: { id: docId } });
        if (!doc) return res.status(404).json({ error: 'Document not found' });
        if (doc.userId !== userId && req.user.role !== 'ADMIN')
            return res.status(403).json({ error: 'Not authorized' });

        // Delete physical file
        const filePath = path.join(__dirname, '..', doc.url.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch {}
        }

        await prisma.document.delete({ where: { id: docId } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;