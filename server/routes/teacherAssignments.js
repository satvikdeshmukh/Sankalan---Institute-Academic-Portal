const express = require('express');
const { requireAuth, prisma } = require('../middleware/auth');
const router = express.Router();

// GET /api/teacher-assignments/:teacherUserId
// Returns the teacher's department assignment with dept name
router.get('/:teacherUserId', requireAuth, async (req, res) => {
    try {
        const assignment = await prisma.teacherAssignment.findUnique({
            where: { teacherUserId: req.params.teacherUserId },
            include: { department: true },
        });
        if (!assignment) return res.json(null);
        res.json({
            department_id: assignment.departmentId,
            departments: { name: assignment.department?.name || '' },
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/teacher-assignments — assign a teacher to a department
router.post('/', requireAuth, async (req, res) => {
    try {
        const { teacherUserId, departmentId } = req.body;
        const assignment = await prisma.teacherAssignment.upsert({
            where: { teacherUserId },
            update: { departmentId },
            create: { teacherUserId, departmentId },
            include: { department: true },
        });
        // Real-time: notify HOD dashboards in this department
        req.app.get('io')?.emit('teacher_change', { type: 'ASSIGN', departmentId });
        res.json(assignment);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
