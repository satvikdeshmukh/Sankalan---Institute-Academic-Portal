const express = require('express');
const { requireAuth, requireRole, prisma } = require('../middleware/auth');

const router = express.Router();

//////////////////////////////////////////////////
// PRINCIPAL STATS (Consolidated Dashboard Data)
//////////////////////////////////////////////////

router.get('/stats', requireAuth, requireRole('PRINCIPAL'), async (req, res) => {
    try {
        // 1. Departments + HODs + Counts
        const departments = await prisma.department.findMany({
            include: {
                hod: {
                    include: { profile: true }
                },
                _count: {
                    select: {
                        students: true,
                        users: {
                            where: { role: 'TEACHER' }
                        }
                    }
                }
            }
        });

        const formattedDepts = departments.map(d => ({
            id: d.id,
            name: d.name,
            shortId: d.shortId,
            hod_name: d.hod?.profile?.fullName || d.hod?.email || null,
            hod_email: d.hod?.email || null,
            teacher_count: d._count.users,
            student_count: d._count.students
        }));

        // 2. All Teachers
        const allTeachers = await prisma.user.findMany({
            where: { role: 'TEACHER' },
            include: {
                profile: true,
                department: true
            }
        });

        const formattedTeachers = allTeachers.map(t => ({
            user_id: t.id,
            id: t.id,
            full_name: t.profile?.fullName || t.email,
            email: t.email,
            department_name: t.department?.name || 'Unassigned',
            department_id: t.departmentId
        }));

        // 3. All HODs
        const allHODs = await prisma.user.findMany({
            where: { role: 'HOD' },
            include: {
                profile: true,
                hodDepartment: true
            }
        });

        const formattedHODs = allHODs.map(h => ({
            user_id: h.id,
            id: h.id,
            full_name: h.profile?.fullName || h.email,
            email: h.email,
            department_name: h.hodDepartment?.name || 'Unassigned',
            department_id: h.hodDepartment?.id
        }));

        // 4. Summarized Counts
        const totalDepartments = departments.length;
        const totalStudents = await prisma.student.count();
        const totalTeachers = allTeachers.length;
        const totalHODs = allHODs.length;
        const totalReports = await prisma.report.count();
        const approvedReports = await prisma.report.count({ where: { status: 'approved' } });
        const pendingReports = await prisma.report.count({ where: { status: 'submitted_to_principal' } });

        res.json({
            departments: formattedDepts,
            teachers: formattedTeachers,
            hods: formattedHODs,
            stats: {
                totalDepartments,
                totalStudents,
                totalTeachers,
                totalHODs,
                totalReports,
                approvedReports,
                pendingReports
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET USER DETAIL (Teacher or HOD)
//////////////////////////////////////////////////

router.get('/user/:id', requireAuth, requireRole('PRINCIPAL'), async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                profile: true,
                documents: {
                    orderBy: { createdAt: 'desc' }
                },
                department: true,       // if teacher
                hodDepartment: true,    // if hod
            }
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({
            profile: {
                ...user.profile,
                email: user.email,
                role: user.role
            },
            department: user.department || user.hodDepartment || null,
            documents: user.documents
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET DEPARTMENT DETAIL
//////////////////////////////////////////////////

router.get('/departments/:id', requireAuth, requireRole('PRINCIPAL'), async (req, res) => {
    try {
        const { id } = req.params;

        const department = await prisma.department.findUnique({
            where: { id },
            include: {
                hod: { include: { profile: true } },
                users: {
                    where: { role: 'TEACHER' },
                    include: { profile: true }
                }
            }
        });

        if (!department) return res.status(404).json({ error: "Department not found" });

        // Count students separately
        const studentCount = await prisma.student.count({ where: { departmentId: id } });

        res.json({
            ...department,
            student_count: studentCount,
            teacher_count: department.users.length,
            hod_name: department.hod?.profile?.fullName || department.hod?.email || null,
            hod_email: department.hod?.email || null
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;