const express = require('express');
const { requireAuth, requireRole, prisma } = require('../middleware/auth');
const router = express.Router();

/* ---------------- TEACHERS BY SUBJECT ---------------- */

router.get('/teachers-by-subject', requireAuth, async (req, res) => {
    try {
        const { subjectName, departmentId } = req.query;

        const offerings = await prisma.subjectOffering.findMany({
            where: {
                subject: {
                    name: subjectName,
                    departmentId
                }
            },
            include: {
                teacher: {
                    select: {
                        id: true,
                        email: true,
                        profile: { select: { fullName: true } }
                    }
                }
            }
        });

        const map = new Map();
        offerings.forEach(o => {
            if (o.teacher) map.set(o.teacher.id, o.teacher);
        });

        res.json([...map.values()]);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ---------------- CHECK TEACHER CLASH ---------------- */

router.get('/check-teacher-clash', requireAuth, async (req, res) => {
    try {

        const { teacherId, dayOfWeek, periodNumber, academicYear } = req.query;

        if (!teacherId) {
            return res.json({ clash: false });
        }

        const clash = await prisma.timetableEntry.findFirst({
            where: {
                teacherId,
                dayOfWeek,
                periodNumber: parseInt(periodNumber),
                academicYear
            },
            include: {
    department: { select: { name: true } },
    teacher: {
        select: {
            profile: { select: { fullName: true } }
        }
    }
}
        });

        if (!clash) {
            return res.json({ clash: false });
        }

        res.json({
    clash: true,
    teacherName: clash.teacher?.profile?.fullName || clash.teacherName,
    department: clash.department?.name,
    year: clash.year,
    section: clash.section
});

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ---------------- CHECK ROOM CLASH ---------------- */

router.get('/check-room-clash', requireAuth, async (req, res) => {

    try {

        const { room, dayOfWeek, periodNumber, academicYear } = req.query;

        if (!room) {
            return res.json({ clash: false });
        }

        const clash = await prisma.timetableEntry.findFirst({
            where: {
                room,
                dayOfWeek,
                periodNumber: parseInt(periodNumber),
                academicYear
            },
            include: {
                department: { select: { name: true } }
            }
        });

        if (!clash) {
            return res.json({ clash: false });
        }

        res.json({
            clash: true,
            room,
            department: clash.department?.name,
            year: clash.year,
            section: clash.section
        });

    } catch (err) {

        res.status(500).json({ error: err.message });

    }

});
/* ---------------- TIMETABLE SUMMARY ---------------- */
// Supports optional ?departmentId= filter for HOD/Teacher views
router.get('/summary', requireAuth, async (req, res) => {
    try {
        const { departmentId } = req.query;

        const groupByWhere = departmentId ? { departmentId } : {};

        const grouped = await prisma.timetableEntry.groupBy({
            by: ['departmentId', 'year', 'semester', 'section', 'academicYear'],
            where: groupByWhere,
            _count: true,
            orderBy: [
                { departmentId: 'asc' },
                { year: 'asc' },
                { semester: 'asc' },
                { section: 'asc' }
            ]
        });

        const deptIds = [...new Set(grouped.map(g => g.departmentId))];

        const depts = await prisma.department.findMany({
            where: { id: { in: deptIds } }
        });

        const deptMap = {};
        depts.forEach(d => deptMap[d.id] = d);

        const result = grouped.map(g => ({
            departmentId: g.departmentId,
            departmentName: deptMap[g.departmentId]?.name,
            shortId: deptMap[g.departmentId]?.shortId,
            year: g.year,
            semester: g.semester,
            section: g.section,
            academicYear: g.academicYear,
            entryCount: g._count
        }));

        res.json(result);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ---------------- GET TIMETABLE ---------------- */

router.get('/', requireAuth, async (req, res) => {
    try {

        const { departmentId, year, semester, section, teacherId, academicYear } = req.query;

        const where = {};

        if (departmentId) where.departmentId = departmentId;
        if (year) where.year = parseInt(year);
        if (semester) where.semester = parseInt(semester);
        if (section) where.section = section;
        if (teacherId) where.teacherId = teacherId;
        if (academicYear) where.academicYear = academicYear;

        const entries = await prisma.timetableEntry.findMany({
            where,
            include: {
                teacher: {
                    select: {
                        id: true,
                        email: true,
                        profile: { select: { fullName: true } }
                    }
                }
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { periodNumber: 'asc' }
            ]
        });

        const normalized = entries.map(e => ({
            ...e,
            teacherName: e.teacher?.profile?.fullName || e.teacherName,
            teacherEmail: e.teacher?.email || ''
        }));

        res.json(normalized);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ---------------- CREATE ---------------- */

router.post('/bulk', requireAuth, requireRole('ADMIN', 'HOD'), async (req, res) => {
    try {
        const { entries, departmentId } = req.body;

        // Only check clashes for entries that have a teacherId
        for (const e of entries) {
            if (e.teacherId) {
                const teacherConflict = await prisma.timetableEntry.findFirst({
                    where: {
                        teacherId: e.teacherId,
                        dayOfWeek: e.dayOfWeek,
                        periodNumber: e.periodNumber,
                        academicYear: e.academicYear,
                        // Ignore the current class's existing entries (allow re-publish)
                        NOT: {
                            departmentId: e.departmentId,
                            year: e.year,
                            semester: e.semester,
                            section: e.section
                        }
                    }
                });

                if (teacherConflict) {
                    return res.status(400).json({ error: `Teacher clash detected on ${e.dayOfWeek} Period ${e.periodNumber}` });
                }
            }

            if (e.room) {
                const roomConflict = await prisma.timetableEntry.findFirst({
                    where: {
                        room: e.room,
                        dayOfWeek: e.dayOfWeek,
                        periodNumber: e.periodNumber,
                        academicYear: e.academicYear,
                        // Allow same room if it's the same dept/section (re-publish scenario)
                        NOT: {
                            departmentId: e.departmentId,
                            year: e.year,
                            semester: e.semester,
                            section: e.section
                        }
                    }
                });

                if (roomConflict) {
                    return res.status(400).json({ error: `Room ${e.room} already booked on ${e.dayOfWeek} Period ${e.periodNumber}` });
                }
            }
        }

        await prisma.$transaction(async (tx) => {

    await tx.timetableEntry.deleteMany({
        where: {
            departmentId,
            year: entries[0].year,
            semester: entries[0].semester,
            section: entries[0].section,
            academicYear: entries[0].academicYear
        }
    });

    await tx.timetableEntry.createMany({
        data: entries
    });

});

        req.app.get('io').emit('timetable_change', { departmentId });

        res.json({ success: true, count: entries.length });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ---------------- DELETE SINGLE ENTRY ---------------- */

router.delete('/:entryId', requireAuth, requireRole('ADMIN', 'HOD'), async (req, res) => {
    try {
        const entry = await prisma.timetableEntry.findUnique({ where: { id: req.params.entryId }, select: { departmentId: true } });
        await prisma.timetableEntry.delete({ where: { id: req.params.entryId } });
        if (entry?.departmentId) req.app.get('io').emit('timetable_change', { departmentId: entry.departmentId });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ---------------- DELETE DEPT TIMETABLE ---------------- */

router.delete('/department/:deptId', requireAuth, requireRole('ADMIN', 'HOD'), async (req, res) => {
    try {
        const { year, semester, section, academicYear } = req.query;

        await prisma.timetableEntry.deleteMany({
            where: {
                departmentId: req.params.deptId,
                year: parseInt(year),
                semester: parseInt(semester),
                section,
                academicYear
            }
        });

        req.app.get('io').emit('timetable_change', { departmentId: req.params.deptId });

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;