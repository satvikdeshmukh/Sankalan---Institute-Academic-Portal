const express = require('express');
const { requireAuth, requireRole, prisma } = require('../middleware/auth');

const router = express.Router();

//////////////////////////////////////////////////
// HOD DASHBOARD
//////////////////////////////////////////////////

router.get('/dashboard', requireAuth, requireRole('HOD'), async (req, res) => {
    try {
        const { id } = req.user;

        // Get HOD department
        const department = await prisma.department.findFirst({
            where: { hodId: id }
        });

        if (!department) {
            return res.status(404).json({ error: "Department not assigned" });
        }

        // Students
        const students = await prisma.student.count({
            where: { departmentId: department.id }
        });

        // Subjects
        const subjects = await prisma.subject.count({
            where: { departmentId: department.id }
        });

        // Offerings
        const offerings = await prisma.subjectOffering.count({
            where: {
                subject: {
                    departmentId: department.id
                }
            }
        });

        // Teachers in department (via offerings)
        const teachers = await prisma.user.count({
            where: {
                role: "TEACHER",
                teacherOfferings: {
                    some: {
                        subject: {
                            departmentId: department.id
                        }
                    }
                }
            }
        });

        res.json({
            department: department.name,
            totalStudents: students,
            totalSubjects: subjects,
            totalOfferings: offerings,
            totalTeachers: teachers
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET DEPARTMENT TEACHERS (list with stats)
//////////////////////////////////////////////////

router.get('/teachers', requireAuth, requireRole('HOD'), async (req, res) => {
    try {
        const { id } = req.user;

        const department = await prisma.department.findFirst({
            where: { hodId: id }
        });

        if (!department) {
            return res.status(404).json({ error: "Department not assigned" });
        }

        // Find all teachers who are assigned to this department OR have subject offerings in this department
        const teachers = await prisma.user.findMany({
            where: {
                role: "TEACHER",
                OR: [
                    { departmentId: department.id },
                    {
                        teacherOfferings: {
                            some: {
                                subject: {
                                    departmentId: department.id
                                }
                            }
                        }
                    }
                ]
            },
            include: {
                profile: true,
                teacherOfferings: {
                    where: {
                        subject: {
                            departmentId: department.id
                        }
                    },
                    include: {
                        subject: true,
                        enrollments: true,
                    }
                },
                documents: {
                    select: { id: true }
                },
                reports: {
                    select: { id: true, status: true }
                }
            }
        });

        const result = teachers.map(t => {
            const subjectNames = [...new Set(t.teacherOfferings.map(o => o.subject.name))];
            const studentCount = new Set(
                t.teacherOfferings.flatMap(o => o.enrollments.map(e => e.studentId))
            ).size;

            return {
                user_id: t.id,
                full_name: t.profile?.fullName || t.email,
                email: t.email,
                phone: t.profile?.phone || null,
                bio: t.profile?.bio || null,
                qualifications: t.profile?.qualifications || null,
                experience: t.profile?.experience || null,
                designation: t.profile?.designation || null,
                subjects: subjectNames,
                subject_count: subjectNames.length,
                student_count: studentCount,
                document_count: t.documents.length,
                report_count: t.reports.length,
            };
        });

        res.json(result);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET TEACHER DETAIL (profile + docs + performance)
//////////////////////////////////////////////////

router.get('/teachers/:teacherId', requireAuth, requireRole('HOD'), async (req, res) => {
    try {
        const { id } = req.user;
        const { teacherId } = req.params;

        const department = await prisma.department.findFirst({
            where: { hodId: id }
        });

        if (!department) {
            return res.status(404).json({ error: "Department not assigned" });
        }

        // Get teacher with full detail
        const teacher = await prisma.user.findUnique({
            where: { id: teacherId },
            include: {
                profile: true,
                documents: {
                    orderBy: { createdAt: 'desc' }
                },
                reports: {
                    orderBy: { createdAt: 'desc' }
                },
                teacherOfferings: {
                    where: {
                        subject: {
                            departmentId: department.id
                        }
                    },
                    include: {
                        subject: true,
                        enrollments: {
                            include: {
                                student: true
                            }
                        },
                        monthly: true,
                        marks: true,
                    }
                }
            }
        });

        if (!teacher) {
            return res.status(404).json({ error: "Teacher not found" });
        }

        // Compute performance summary
        const subjectNames = [...new Set(teacher.teacherOfferings.map(o => o.subject.name))];
        const allStudentIds = new Set(
            teacher.teacherOfferings.flatMap(o => o.enrollments.map(e => e.studentId))
        );

        // Average student attendance across all offerings
        const allMonthly = teacher.teacherOfferings.flatMap(o => o.monthly);
        const avgAttendance = allMonthly.length > 0
            ? Math.round(allMonthly.reduce((sum, m) => sum + m.percentage, 0) / allMonthly.length)
            : null;

        // Average marks
        const allMarks = teacher.teacherOfferings.flatMap(o => o.marks);
        const avgMarks = allMarks.length > 0
            ? Math.round(allMarks.reduce((sum, m) => sum + m.marks, 0) / allMarks.length)
            : null;

        res.json({
            profile: {
                full_name: teacher.profile?.fullName || teacher.email,
                email: teacher.email,
                phone: teacher.profile?.phone || null,
                bio: teacher.profile?.bio || null,
                qualifications: teacher.profile?.qualifications || null,
                experience: teacher.profile?.experience || null,
                designation: teacher.profile?.designation || null,
                joiningDate: teacher.profile?.joiningDate || null,
                address: teacher.profile?.address || null,
                profilePhoto: teacher.profile?.profilePhoto || null,
            },
            department: {
                name: department.name
            },
            documents: teacher.documents.map(d => ({
                id: d.id,
                name: d.name,
                url: d.url,
                file_name: d.name,
                file_size: null,
                created_at: d.createdAt,
            })),
            performance: {
                subjects_taught: subjectNames,
                subject_count: subjectNames.length,
                student_count: allStudentIds.size,
                avg_attendance: avgAttendance,
                avg_marks: avgMarks,
                total_reports: teacher.reports.length,
                total_documents: teacher.documents.length,
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET HOD'S OWN DEPARTMENT (id + name + shortId)
//////////////////////////////////////////////////

router.get('/my-department', requireAuth, requireRole('HOD'), async (req, res) => {
    try {
        const department = await prisma.department.findFirst({
            where: { hodId: req.user.id },
            select: { id: true, name: true, shortId: true }
        });
        if (!department) return res.status(404).json({ error: 'No department assigned' });
        res.json(department);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;