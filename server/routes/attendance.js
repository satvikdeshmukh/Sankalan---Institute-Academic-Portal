const express = require('express');
const { requireAuth, requireRole, prisma } = require('../middleware/auth');

const router = express.Router();

//////////////////////////////////////////////////
// CREATE ATTENDANCE SESSION (TEACHER ONLY)
//////////////////////////////////////////////////

router.post('/session', requireAuth, requireRole('TEACHER'), async (req, res) => {
    try {
        const { subjectOfferingId, date } = req.body;

        const session = await prisma.attendanceSession.create({
            data: {
                subjectOfferingId,
                date: new Date(date)
            }
        });

        res.json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// MARK DAILY ATTENDANCE
//////////////////////////////////////////////////

router.post('/mark', requireAuth, requireRole('TEACHER'), async (req, res) => {
    try {
        const { sessionId, records } = req.body;
        // records = [{ studentId, status }, ...]

        await prisma.attendanceRecord.createMany({
            data: records.map(r => ({
                sessionId,
                studentId: r.studentId,
                status: r.status
            })),
            skipDuplicates: true
        });

        // 🔥 AUTO UPDATE MONTHLY PERCENTAGE
        await updateMonthlyAttendance(sessionId);

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET ATTENDANCE BY OFFERING
//////////////////////////////////////////////////

router.get('/offering/:id', requireAuth, async (req, res) => {
    try {
        const offeringId = req.params.id;

        const sessions = await prisma.attendanceSession.findMany({
            where: { subjectOfferingId: offeringId },
            include: {
                records: true
            },
            orderBy: { date: 'asc' }
        });

        res.json(sessions);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// AUTO MONTHLY CALCULATION
//////////////////////////////////////////////////

async function updateMonthlyAttendance(sessionId) {

    const session = await prisma.attendanceSession.findUnique({
        where: { id: sessionId },
        include: {
            subjectOffering: true,
            records: true
        }
    });

    const month = session.date.getMonth() + 1;
    const year = session.date.getFullYear();

    for (const record of session.records) {

        const studentId = record.studentId;

        // Get all sessions for same offering + month
        const sessionsInMonth = await prisma.attendanceSession.findMany({
            where: {
                subjectOfferingId: session.subjectOfferingId,
                date: {
                    gte: new Date(year, month - 1, 1),
                    lt: new Date(year, month, 1)
                }
            },
            include: { records: true }
        });

        let total = 0;
        let present = 0;

        sessionsInMonth.forEach(s => {
            const r = s.records.find(x => x.studentId === studentId);
            if (r) {
                total++;
                if (r.status) present++;
            }
        });

        const percentage = total > 0 ? (present / total) * 100 : 0;

        await prisma.attendanceMonthly.upsert({
            where: {
                studentId_subjectOfferingId_month_year: {
                    studentId,
                    subjectOfferingId: session.subjectOfferingId,
                    month,
                    year
                }
            },
            update: { percentage },
            create: {
                studentId,
                subjectOfferingId: session.subjectOfferingId,
                month,
                year,
                percentage
            }
        });
    }
}

module.exports = router;