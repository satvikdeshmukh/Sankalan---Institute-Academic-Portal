const express = require('express');
const { requireAuth, requireRole, prisma } = require('../middleware/auth');

const router = express.Router();

//////////////////////////////////////////////////
// ADD OR UPDATE MARKS (TEACHER ONLY)
//////////////////////////////////////////////////

router.post('/', requireAuth, requireRole('TEACHER'), async (req, res) => {
    try {
        const { studentId, subjectOfferingId, examType, marks } = req.body;

        const result = await prisma.mark.upsert({
            where: {
                studentId_subjectOfferingId_examType: {
                    studentId,
                    subjectOfferingId,
                    examType
                }
            },
            update: { marks },
            create: {
                studentId,
                subjectOfferingId,
                examType,
                marks
            }
        });

        res.json(result);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// BULK IMPORT MARKS (TEACHER ONLY)
//////////////////////////////////////////////////

router.post('/bulk', requireAuth, requireRole('TEACHER'), async (req, res) => {
    try {
        const { rows } = req.body;
        // rows = [{ studentId, subjectOfferingId, examType, marks }]

        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({ error: 'No rows to import' });
        }

        let inserted = 0;
        let updated = 0;

        for (const row of rows) {
            if (!row.studentId || !row.subjectOfferingId || !row.examType) continue;

            const existing = await prisma.mark.findUnique({
                where: {
                    studentId_subjectOfferingId_examType: {
                        studentId: row.studentId,
                        subjectOfferingId: row.subjectOfferingId,
                        examType: row.examType
                    }
                }
            });

            await prisma.mark.upsert({
                where: {
                    studentId_subjectOfferingId_examType: {
                        studentId: row.studentId,
                        subjectOfferingId: row.subjectOfferingId,
                        examType: row.examType
                    }
                },
                update: { marks: Number(row.marks) || 0 },
                create: {
                    studentId: row.studentId,
                    subjectOfferingId: row.subjectOfferingId,
                    examType: row.examType,
                    marks: Number(row.marks) || 0
                }
            });

            if (existing) updated++;
            else inserted++;
        }

        res.json({ inserted, updated, total: rows.length });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET MARKS FOR TEACHER (all offerings)
//////////////////////////////////////////////////

router.get('/teacher', requireAuth, requireRole('TEACHER'), async (req, res) => {
    try {
        const teacherId = req.user.id;

        const offerings = await prisma.subjectOffering.findMany({
            where: { teacherId },
            include: {
                subject: { include: { department: true } },
                marks: {
                    include: {
                        student: { include: { department: true } }
                    }
                },
                enrollments: {
                    select: { studentId: true }
                }
            }
        });

        res.json(offerings);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET MARKS BY OFFERING
//////////////////////////////////////////////////

router.get('/offering/:id', requireAuth, async (req, res) => {
    try {
        const offeringId = req.params.id;

        const marks = await prisma.mark.findMany({
            where: { subjectOfferingId: offeringId },
            include: {
                student: true
            }
        });

        res.json(marks);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET MARKS FOR HOD (By Department)
//////////////////////////////////////////////////

router.get('/department', requireAuth, requireRole('HOD', 'ADMIN'), async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        let departmentId = req.query.departmentId;

        if (role === 'HOD') {
            const department = await prisma.department.findFirst({ where: { hodId: userId } });
            if (!department) return res.status(403).json({ error: 'No department assigned' });
            departmentId = department.id;
        }

        if (!departmentId) return res.status(400).json({ error: 'Department ID required' });

        const marks = await prisma.mark.findMany({
            where: { student: { departmentId } },
            include: {
                student: { include: { enrollments: true } },
                subjectOffering: { include: { subject: true } }
            }
        });

        res.json(marks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET MARKS BY STUDENT
//////////////////////////////////////////////////

router.get('/student/:id', requireAuth, async (req, res) => {
    try {
        const studentId = req.params.id;

        const marks = await prisma.mark.findMany({
            where: { studentId },
            include: {
                subjectOffering: {
                    include: {
                        subject: true
                    }
                }
            }
        });

        res.json(marks);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// DELETE SINGLE MARK (TEACHER ONLY)
//////////////////////////////////////////////////

router.delete('/:id', requireAuth, requireRole('TEACHER'), async (req, res) => {
    try {
        const mark = await prisma.mark.findUnique({
            where: { id: req.params.id },
            include: { subjectOffering: true }
        });
        if (!mark) return res.status(404).json({ error: 'Mark not found' });
        if (mark.subjectOffering.teacherId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await prisma.mark.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// BULK DELETE MARKS (TEACHER ONLY)
//////////////////////////////////////////////////

router.post('/bulk-delete', requireAuth, requireRole('TEACHER'), async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'No IDs provided' });
        }

        // Verify all marks belong to teacher's offerings
        const marks = await prisma.mark.findMany({
            where: { id: { in: ids } },
            include: { subjectOffering: true }
        });

        const unauthorized = marks.filter(m => m.subjectOffering.teacherId !== req.user.id);
        if (unauthorized.length > 0) {
            return res.status(403).json({ error: 'Not authorized for some marks' });
        }

        const result = await prisma.mark.deleteMany({ where: { id: { in: ids } } });
        res.json({ deleted: result.count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// RENAME EXAM TYPE (TEACHER ONLY)
//////////////////////////////////////////////////

router.put('/rename-exam', requireAuth, requireRole('TEACHER'), async (req, res) => {
    try {
        const { subjectOfferingId, oldName, newName } = req.body;
        if (!subjectOfferingId || !oldName || !newName) {
            return res.status(400).json({ error: 'subjectOfferingId, oldName, and newName required' });
        }

        const offering = await prisma.subjectOffering.findUnique({ where: { id: subjectOfferingId } });
        if (!offering || offering.teacherId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const result = await prisma.mark.updateMany({
            where: { subjectOfferingId, examType: oldName },
            data: { examType: newName }
        });

        res.json({ updated: result.count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;