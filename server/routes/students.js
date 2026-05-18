const express = require('express');
const { requireAuth, requireRole, prisma } = require('../middleware/auth');

const router = express.Router();

//////////////////////////////////////////////////
// GET ALL STUDENTS (Role-Based)
//////////////////////////////////////////////////

router.get('/', requireAuth, async (req, res) => {
    try {
        const { role, id } = req.user;
        // Optional query filters
        const { section, year, semester, academicYear, departmentId: queryDeptId } = req.query;

        // Build enrollment filter if section/year/semester requested
        const enrollmentFilter = {};
        if (section) enrollmentFilter.section = section;
        if (year) enrollmentFilter.year = parseInt(year);
        if (semester) enrollmentFilter.semester = parseInt(semester);
        if (academicYear) enrollmentFilter.academicYear = academicYear;
        const hasEnrollmentFilter = Object.keys(enrollmentFilter).length > 0;

        const baseInclude = {
            department: true,
            enrollments: { orderBy: { academicYear: 'desc' } },
            monthly: true,
            marks: true
        };

        const buildWhere = (deptId) => {
            const where = { departmentId: deptId };
            if (hasEnrollmentFilter) {
                where.enrollments = { some: enrollmentFilter };
            }
            return where;
        };

        // Normalize student: attach email directly, flatten latest enrollment
        const normalize = (students) => students.map(s => {
            const latest = (s.enrollments || []).sort((a, b) =>
                (b.academicYear || '').localeCompare(a.academicYear || '')
            )[0];
            return {
                ...s,
                // Ensure email is always top-level (it's already on Student model)
                email: s.email || null,
                // Flatten latest enrollment for convenience
                year: latest?.year ?? null,
                semester: latest?.semester ?? null,
                section: latest?.section ?? null,
                academicYear: latest?.academicYear ?? null,
            };
        });

        // ADMIN & PRINCIPAL → all students (or filtered by departmentId query param)
        if (role === 'ADMIN' || role === 'PRINCIPAL') {
            const where = {};
            if (queryDeptId) where.departmentId = queryDeptId;
            if (hasEnrollmentFilter) where.enrollments = { some: enrollmentFilter };
            const students = await prisma.student.findMany({
                where,
                include: baseInclude,
                orderBy: { fullName: 'asc' }
            });
            return res.json(normalize(students));
        }

        // HOD → only their department
        if (role === 'HOD') {
            const department = await prisma.department.findFirst({
                where: { hodId: id }
            });
            if (!department) return res.status(403).json({ error: "No department assigned" });

            const students = await prisma.student.findMany({
                where: buildWhere(department.id),
                include: baseInclude,
                orderBy: { fullName: 'asc' }
            });
            return res.json(normalize(students));
        }

        // TEACHER → students from teacher's department (filtered by their sections if applicable)
        if (role === 'TEACHER') {
            const teacherUser = await prisma.user.findUnique({
                where: { id },
                select: { departmentId: true }
            });

            let deptId = teacherUser?.departmentId;

            // Fallback: infer department from teacher's subject offerings
            if (!deptId) {
                const offering = await prisma.subjectOffering.findFirst({
                    where: { teacherId: id },
                    include: { subject: true }
                });
                deptId = offering?.subject?.departmentId;
            }

            if (!deptId) return res.json([]);

            // Get sections this teacher teaches (to filter students)
            const teacherSections = await prisma.subjectOffering.findMany({
                where: { teacherId: id },
                select: { section: true, year: true, semester: true },
                distinct: ['section', 'year', 'semester']
            });

            // If teacher has specific sections, filter to those (unless explicit filter provided)
            let whereClause;
            if (!hasEnrollmentFilter && teacherSections.length > 0) {
                whereClause = {
                    departmentId: deptId,
                    enrollments: {
                        some: {
                            OR: teacherSections.map(ts => ({
                                section: ts.section,
                                year: ts.year,
                                semester: ts.semester,
                            }))
                        }
                    }
                };
            } else {
                whereClause = buildWhere(deptId);
            }

            const students = await prisma.student.findMany({
                where: whereClause,
                include: baseInclude,
                orderBy: { fullName: 'asc' }
            });
            return res.json(normalize(students));
        }

        res.status(403).json({ error: "Unauthorized role" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET MANAGED STUDENTS (TEACHER — students linked
// through subject offerings with full attendance)
//////////////////////////////////////////////////

router.get('/managed', requireAuth, requireRole('TEACHER'), async (req, res) => {
    try {
        const teacherId = req.user.id;
        const academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

        // 1. Get Teacher Assignments (Class Teacher & Subject Offerings)
        const userWithAssignments = await prisma.user.findUnique({
            where: { id: teacherId },
            include: {
                classTeacherAssignments: {
                    where: { academicYear }
                },
                teacherOfferings: {
                    where: { academicYear }
                }
            }
        });

        if (!userWithAssignments) return res.json({ offerings: [], students: [] });

        const classAssignments = userWithAssignments.classTeacherAssignments;
        const offerings = await prisma.subjectOffering.findMany({
            where: { teacherId, academicYear },
            include: {
                subject: { include: { department: true } },
                sessions: {
                    include: { records: true },
                    orderBy: { date: 'asc' }
                },
                monthly: true,
                enrollments: {
                    include: { student: { include: { department: true, enrollments: true } } }
                }
            }
        });

        // 2. Identify students to show
        let managedStudentsMap = new Map();

        // A. Students from Subject Offerings
        for (const off of offerings) {
            for (const sem of off.enrollments) {
                if (!managedStudentsMap.has(sem.studentId)) {
                    managedStudentsMap.set(sem.studentId, { ...sem.student, subjects: {} });
                }
            }
        }

        // B. Students from Class Teacher Assignments
        for (const ca of classAssignments) {
            const classStudents = await prisma.student.findMany({
                where: {
                    departmentId: ca.departmentId,
                    enrollments: {
                        some: {
                            academicYear: ca.academicYear,
                            year: ca.year,
                            semester: ca.semester,
                            section: ca.section
                        }
                    }
                },
                include: { department: true, enrollments: true }
            });
            for (const student of classStudents) {
                if (!managedStudentsMap.has(student.id)) {
                    managedStudentsMap.set(student.id, { ...student, subjects: {} });
                }
            }
        }

        const students = Array.from(managedStudentsMap.values());

        // 3. Build per-student attendance data
        for (const off of offerings) {
            const subjectKey = off.id;
            const subjectInfo = {
                offeringId: off.id,
                subjectName: off.subject.name,
                subjectCode: off.subject.code,
                year: off.year,
                semester: off.semester,
                section: off.section,
                daily: [],
                monthly: [],
                totalPresent: 0,
                totalSessions: 0,
                aggregate: 0
            };

            // Daily attendance per student
            for (const session of off.sessions) {
                for (const rec of session.records) {
                    const studentData = managedStudentsMap.get(rec.studentId);
                    if (!studentData) continue;

                    if (!studentData.subjects[subjectKey]) {
                        studentData.subjects[subjectKey] = { ...subjectInfo, daily: [], monthly: [] };
                    }
                    const sa = studentData.subjects[subjectKey];
                    sa.daily.push({ date: session.date, status: rec.status });
                    sa.totalSessions++;
                    if (rec.status) sa.totalPresent++;
                }
            }

            // Monthly attendance
            for (const m of off.monthly) {
                const studentData = managedStudentsMap.get(m.studentId);
                if (!studentData) continue;

                if (!studentData.subjects[subjectKey]) {
                    studentData.subjects[subjectKey] = { ...subjectInfo, daily: [], monthly: [] };
                }
                studentData.subjects[subjectKey].monthly.push({
                    month: m.month, year: m.year, percentage: m.percentage
                });
            }
        }

        // 4. Calculate aggregates
        for (const sa of managedStudentsMap.values()) {
            let totalPresent = 0, totalSessions = 0;
            const subjectsList = Object.values(sa.subjects);
            for (const sub of subjectsList) {
                sub.aggregate = sub.totalSessions > 0 ? Math.round((sub.totalPresent / sub.totalSessions) * 100) : 0;
                totalPresent += sub.totalPresent;
                totalSessions += sub.totalSessions;
            }
            sa.overallAggregate = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;
        }

        // 5. Format response
        const formattedOfferings = offerings.map(o => ({
            id: o.id,
            subjectName: o.subject.name,
            subjectCode: o.subject.code,
            year: o.year,
            semester: o.semester,
            section: o.section
        }));

        res.json({
            offerings: formattedOfferings,
            classAssignments: classAssignments.map(ca => ({
                id: ca.id,
                year: ca.year,
                semester: ca.semester,
                section: ca.section
            })),
            students: Array.from(managedStudentsMap.values())
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// CREATE STUDENT (ADMIN, HOD, or TEACHER)
//////////////////////////////////////////////////

router.post('/', requireAuth, requireRole('ADMIN', 'HOD', 'TEACHER'), async (req, res) => {
    try {
        const { studentId, fullName, email, departmentId, year, semester, section } = req.body;

        if (!fullName || !departmentId) {
            return res.status(400).json({ error: 'fullName and departmentId are required' });
        }

        const academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

        const student = await prisma.student.create({
            data: {
                studentId: studentId || `STU-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
                fullName,
                email: email || null,
                departmentId,
                // Create enrollment inline if provided
                enrollments: (year && semester) ? {
                    create: {
                        year: Number(year),
                        semester: Number(semester),
                        section: section || 'A',
                        academicYear
                    }
                } : undefined
            },
            include: {
                department: true,
                enrollments: { orderBy: { academicYear: 'desc' } }
            }
        });

        // Flatten latest enrollment fields for response
        const latest = student.enrollments[0];
        const result = {
            ...student,
            email: student.email || null,
            year: latest?.year ?? null,
            semester: latest?.semester ?? null,
            section: latest?.section ?? null,
            academicYear: latest?.academicYear ?? null,
        };

        // Emit real-time event
        const io = req.app.get('io');
        if (io) io.emit('student_change', { type: 'created', studentId: student.id });

        res.json(result);
    } catch (err) {
        if (err.code === 'P2002') return res.status(409).json({ error: 'Student ID already exists' });
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// BULK IMPORT STUDENTS (TEACHER, HOD, ADMIN)
//////////////////////////////////////////////////

router.post('/bulk', requireAuth, requireRole('ADMIN', 'HOD', 'TEACHER'), async (req, res) => {
    try {
        const { rows, departmentId } = req.body;

        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({ error: 'No rows to import' });
        }

        // Determine department — use provided or infer from teacher's offerings
        let deptId = departmentId;
        if (!deptId && req.user.role === 'TEACHER') {
            const offering = await prisma.subjectOffering.findFirst({
                where: { teacherId: req.user.id },
                include: { subject: true }
            });
            deptId = offering?.subject?.departmentId;
        }

        if (!deptId) {
            return res.status(400).json({ error: 'Department is required for student import' });
        }

        let inserted = 0;
        let updated = 0;
        const academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

        for (const row of rows) {
            // Normalize keys to lowercase for case-insensitive matching
            const rowLower = {};
            for (const [k, v] of Object.entries(row)) rowLower[k.toLowerCase().trim()] = v;

            const sid = String(rowLower['studentid'] || rowLower['student_id'] || rowLower['student id'] || rowLower['roll no'] || rowLower['rollno'] || '').trim();
            const name = String(rowLower['fullname'] || rowLower['full name'] || rowLower['name'] || '').trim();
            const email = String(rowLower['email'] || rowLower['e-mail'] || rowLower['email address'] || '').trim();

            if (!name) continue;

            // Try to find existing student
            let existing = null;
            if (sid) {
                existing = await prisma.student.findUnique({
                    where: { studentId: sid }
                });
            }

            if (existing) {
                // Update if needed
                await prisma.student.update({
                    where: { id: existing.id },
                    data: {
                        fullName: name || existing.fullName,
                        email: email || existing.email
                    }
                });

                // Upsert enrollment
                const rowYear = rowLower['year'];
                const rowSemester = rowLower['semester'] || rowLower['sem'];
                const rowSection = String(rowLower['section'] || rowLower['sec'] || 'A').trim().toUpperCase() || 'A';
                if (rowYear && rowSemester) {
                    await prisma.enrollment.upsert({
                        where: {
                            studentId_academicYear: {
                                studentId: existing.id,
                                academicYear
                            }
                        },
                        update: {
                            year: Number(rowYear),
                            semester: Number(rowSemester),
                            section: rowSection
                        },
                        create: {
                            studentId: existing.id,
                            year: Number(rowYear),
                            semester: Number(rowSemester),
                            section: rowSection,
                            academicYear
                        }
                    });
                }

                updated++;
            } else {
                // Create new student
                const newStudent = await prisma.student.create({
                    data: {
                        studentId: sid || `STU-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                        fullName: name,
                        email: email || null,
                        departmentId: deptId
                    }
                });

                // Create enrollment
                const rowYear = rowLower['year'];
                const rowSemester = rowLower['semester'] || rowLower['sem'];
                const rowSection = String(rowLower['section'] || rowLower['sec'] || 'A').trim().toUpperCase() || 'A';
                if (rowYear && rowSemester) {
                    await prisma.enrollment.create({
                        data: {
                            studentId: newStudent.id,
                            year: Number(rowYear),
                            semester: Number(rowSemester),
                            section: rowSection,
                            academicYear
                        }
                    });
                }

                inserted++;
            }
        }

        // Emit real-time event
        const io = req.app.get('io');
        if (io) io.emit('student_change', { type: 'bulk_imported', inserted, updated });

        res.json({ inserted, updated, total: rows.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// UPDATE STUDENT
//////////////////////////////////////////////////

router.patch('/:id', requireAuth, requireRole('ADMIN', 'HOD', 'TEACHER'), async (req, res) => {
    try {
        const { fullName, email, departmentId, section, year, semester } = req.body;
        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (email !== undefined) updateData.email = email || null;
        if (departmentId) updateData.departmentId = departmentId;

        const student = await prisma.student.update({
            where: { id: req.params.id },
            data: updateData,
            include: { department: true, enrollments: { orderBy: { academicYear: 'desc' } } }
        });

        // Update enrollment section/year/semester if provided
        if (section !== undefined || year !== undefined || semester !== undefined) {
            const latest = student.enrollments[0];
            if (latest) {
                const enrollUpdate = {};
                if (section !== undefined) enrollUpdate.section = section;
                if (year !== undefined) enrollUpdate.year = Number(year);
                if (semester !== undefined) enrollUpdate.semester = Number(semester);

                await prisma.enrollment.update({
                    where: { id: latest.id },
                    data: enrollUpdate
                });
            }
        }

        // Re-fetch with updated enrollment
        const updated = await prisma.student.findUnique({
            where: { id: req.params.id },
            include: { department: true, enrollments: { orderBy: { academicYear: 'desc' } } }
        });

        const latest = updated.enrollments[0];
        const result = {
            ...updated,
            email: updated.email || null,
            year: latest?.year ?? null,
            semester: latest?.semester ?? null,
            section: latest?.section ?? null,
            academicYear: latest?.academicYear ?? null,
        };

        // Emit real-time event
        const io = req.app.get('io');
        if (io) io.emit('student_change', { type: 'updated', studentId: updated.id });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// DELETE STUDENT
//////////////////////////////////////////////////

router.delete('/:id', requireAuth, requireRole('ADMIN', 'HOD'), async (req, res) => {
    try {
        await prisma.student.delete({ where: { id: req.params.id } });

        // Emit real-time event
        const io = req.app.get('io');
        if (io) io.emit('student_change', { type: 'deleted', studentId: req.params.id });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET STUDENT PROFILE SUMMARY
//////////////////////////////////////////////////

router.get('/:id/profile', requireAuth, async (req, res) => {
    try {
        const studentId = req.params.id;

        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                department: true,
                enrollments: { orderBy: { academicYear: 'desc' } },
                subjectEnrollments: {
                    include: {
                        subjectOffering: {
                            include: {
                                subject: true,
                                teacher: { select: { id: true, email: true, profile: { select: { fullName: true } } } }
                            }
                        }
                    }
                }
            }
        });

        if (!student) return res.status(404).json({ error: 'Student not found' });

        // Marks
        const marks = await prisma.mark.findMany({
            where: { studentId },
            include: { subjectOffering: { include: { subject: true } } }
        });

        // Monthly attendance
        const monthly = await prisma.attendanceMonthly.findMany({
            where: { studentId },
            include: { subjectOffering: { include: { subject: true } } }
        });

        // Daily attendance
        const daily = await prisma.attendanceRecord.findMany({
            where: { studentId },
            include: { session: true },
            orderBy: { session: { date: 'asc' } }
        });

        res.json({ student, marks, monthly, daily });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;