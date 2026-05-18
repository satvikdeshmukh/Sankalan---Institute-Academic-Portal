const express = require('express');
const { requireAuth, requireRole, prisma } = require('../middleware/auth');

const router = express.Router();

//////////////////////////////////////////////////
// GET ACTIVITIES (teacher's students)
// Returns { [studentId]: { [month]: [{ id, value, desc }] } }
//////////////////////////////////////////////////

router.get('/', requireAuth, async (req, res) => {
    try {
        const teacherId = req.user.id;

        const entries = await prisma.activityEntry.findMany({
            where: { teacherId },
            orderBy: { createdAt: 'asc' }
        });

        // Group: studentId → month → array of entries
        const result = {};
        for (const e of entries) {
            if (!result[e.studentId]) result[e.studentId] = {};
            if (!result[e.studentId][e.month]) result[e.studentId][e.month] = [];
            result[e.studentId][e.month].push({
                id: e.id,
                value: e.points,
                desc: e.description || ''
            });
        }

        res.json(result);
    } catch (err) {
        console.error('GET /activities error:', err);
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET ACTIVITIES FOR A SPECIFIC STUDENT (all teachers)
//////////////////////////////////////////////////

router.get('/student/:studentId', requireAuth, async (req, res) => {
    try {
        const { studentId } = req.params;

        const entries = await prisma.activityEntry.findMany({
            where: { studentId },
            orderBy: { createdAt: 'asc' }
        });

        res.json(entries.map(e => ({
            id: e.id,
            studentId: e.studentId,
            teacherId: e.teacherId,
            month: e.month,
            points: e.points,
            description: e.description,
        })));
    } catch (err) {
        console.error('GET /activities/student error:', err);
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// CREATE ACTIVITY ENTRY (always inserts a new row)
//////////////////////////////////////////////////

router.post('/', requireAuth, requireRole('TEACHER', 'HOD'), async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { studentId, month, points, description } = req.body;

        if (!studentId || !month) {
            return res.status(400).json({ error: 'studentId and month are required' });
        }

        const pts = Number(points);
        if (isNaN(pts) || pts < 0) {
            return res.status(400).json({ error: 'points must be a non-negative number' });
        }

        // Verify student exists
        const student = await prisma.student.findUnique({ where: { id: studentId } });
        if (!student) {
            return res.status(404).json({ error: `Student not found: ${studentId}` });
        }

        const entry = await prisma.activityEntry.create({
            data: {
                studentId,
                teacherId,
                month,
                points: pts,
                description: description?.trim() || null,
            }
        });

        console.log(`Activity created: student=${studentId} month=${month} pts=${pts} desc="${description}"`);

        // Emit real-time update
        req.app.get('io')?.emit('activity_change', { type: 'create', entry });

        res.json({ id: entry.id, value: entry.points, desc: entry.description || '' });
    } catch (err) {
        console.error('POST /activities error:', err);
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// DELETE ACTIVITY ENTRY
//////////////////////////////////////////////////

router.delete('/:id', requireAuth, requireRole('TEACHER', 'HOD'), async (req, res) => {
    try {
        const teacherId = req.user.id;
        const entry = await prisma.activityEntry.findUnique({ where: { id: req.params.id } });

        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        if (entry.teacherId !== teacherId) {
            return res.status(403).json({ error: 'Not authorized to delete this entry' });
        }

        await prisma.activityEntry.delete({ where: { id: req.params.id } });

        // Emit real-time update
        req.app.get('io')?.emit('activity_change', { type: 'delete', entryId: req.params.id });

        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /activities error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;