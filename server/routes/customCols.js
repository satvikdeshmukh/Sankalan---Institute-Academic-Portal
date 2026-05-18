const express = require('express');
const { requireAuth, prisma } = require('../middleware/auth');
const router = express.Router();

// GET /api/custom-cols?year=X&semester=Y
router.get('/', requireAuth, async (req, res) => {
    try {
        const { year, semester } = req.query;
        const cols = await prisma.teacherCustomCol.findMany({
            where: {
                teacherUserId: req.user.id,
                year: year ? parseInt(year) : undefined,
                semester: semester ? parseInt(semester) : undefined,
            },
            orderBy: { id: 'asc' },
        });
        res.json(cols);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/custom-cols
router.post('/', requireAuth, async (req, res) => {
    try {
        const { colName, year, semester } = req.body;
        const col = await prisma.teacherCustomCol.create({
            data: {
                teacherUserId: req.user.id,
                colName,
                year: year ? parseInt(year) : null,
                semester: semester ? parseInt(semester) : null,
            }
        });
        res.json(col);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/custom-cols?colName=X&year=Y&semester=Z
router.delete('/', requireAuth, async (req, res) => {
    try {
        const { colName, year, semester } = req.query;
        await prisma.teacherCustomCol.deleteMany({
            where: {
                teacherUserId: req.user.id,
                colName,
                year: year ? parseInt(year) : null,
                semester: semester ? parseInt(semester) : null,
            }
        });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
