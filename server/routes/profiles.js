const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const { requireAuth, prisma } = require('../middleware/auth');

const router = express.Router();

// Multer for profile photos
const photoDir = path.join(__dirname, '../uploads/photos');
if (!fs.existsSync(photoDir)) fs.mkdirSync(photoDir, { recursive: true });
const photoStorage = multer.diskStorage({
    destination: photoDir,
    filename: (req, file, cb) => cb(null, `photo_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`),
});
const photoUpload = multer({ storage: photoStorage, limits: { fileSize: 5 * 1024 * 1024 } });

//////////////////////////////////////////////////
// GET CURRENT USER PROFILE (/profiles/me)
//////////////////////////////////////////////////

router.get('/me', requireAuth, async (req, res) => {
    try {
        const { id, role } = req.user;

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                profile: true,
                teacherOfferings: { include: { subject: true } },
                hodDepartment: true,
                institute: true,
                department: true,
            }
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        let extraData = {};
        if (role === 'HOD' && user.hodDepartment) extraData.department = user.hodDepartment;
        if (role === 'PRINCIPAL' && user.institute) extraData.institute = { id: user.institute.id };
        if (role === 'TEACHER') {
            extraData.offerings = user.teacherOfferings;
            extraData.department = user.department;
        }

        res.json({
            id: user.id,
            email: user.email,
            role: user.role,
            fullName: user.profile?.fullName || null,
            phone: user.profile?.phone || null,
            bio: user.profile?.bio || null,
            qualifications: user.profile?.qualifications || null,
            experience: user.profile?.experience || null,
            designation: user.profile?.designation || null,
            joiningDate: user.profile?.joiningDate || null,
            address: user.profile?.address || null,
            profilePhoto: user.profile?.profilePhoto || null,
            ...extraData
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET ANY USER PROFILE BY USER ID (/profiles/:userId)
//////////////////////////////////////////////////

router.get('/:userId', requireAuth, async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
                teacherOfferings: { include: { subject: true } },
                hodDepartment: true,
                department: true,
            }
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({
            id: user.id,
            email: user.email,
            role: user.role,
            fullName: user.profile?.fullName || null,
            phone: user.profile?.phone || null,
            bio: user.profile?.bio || null,
            qualifications: user.profile?.qualifications || null,
            experience: user.profile?.experience || null,
            designation: user.profile?.designation || null,
            joiningDate: user.profile?.joiningDate || null,
            address: user.profile?.address || null,
            profilePhoto: user.profile?.profilePhoto || null,
            department: user.department || user.hodDepartment || null,
            offerings: user.teacherOfferings || [],
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET /profiles/:userId/performance (SAFE VERSION)
//////////////////////////////////////////////////

router.get('/:userId/performance', async (req, res) => {
    try {
        const { userId } = req.params;

        // 1. Identify all academic years this teacher has taught in
        const offeringsData = await prisma.subjectOffering.findMany({
            where: { teacherId: userId },
            select: { academicYear: true }
        });
        const offeringYears = [...new Set(offeringsData.map(o => o.academicYear).filter(Boolean))];

        // 2. Fetch existing self-reported records
        const records = await prisma.teacherPerformanceData.findMany({
            where: { teacherId: userId },
            orderBy: { academicYear: 'desc' },
        });
        const recordYears = records.map(r => r.academicYear);

        // 3. Union of all years
        const allYears = [...new Set([...offeringYears, ...recordYears])].sort((a,b) => b.localeCompare(a));

        // 4. Compute automated stats for each year
        const enrichedRecords = await Promise.all(allYears.map(async (year) => {
            const existingRecord = records.find(r => r.academicYear === year) || {
                academicYear: year,
                trainingsCompleted: 0,
                trainingDetails: '',
                committeesParticipated: 0,
                eventsOrganized: 0,
                studentsMentored: 0,
                adminResponsibilityNotes: '',
            };

            const offerings = await prisma.subjectOffering.findMany({
                where: { teacherId: userId, academicYear: year },
                include: {
                    enrollments: { select: { studentId: true } },
                    marks: { select: { studentId: true, marks: true } }
                }
            });

            let totalEnrollments = 0;
            let appearedStudents = new Set();
            let passedStudents = new Set();

            offerings.forEach(off => {
                totalEnrollments += off.enrollments.length;
                
                // Track students who have any mark in this offering
                const studentBestMark = {};
                off.marks.forEach(m => {
                    appearedStudents.add(m.studentId);
                    if (!studentBestMark[m.studentId] || m.marks > studentBestMark[m.studentId]) {
                        studentBestMark[m.studentId] = m.marks;
                    }
                });

                Object.entries(studentBestMark).forEach(([sId, mark]) => {
                    if (mark >= 40) passedStudents.add(sId);
                });
            });

            return {
                ...existingRecord,
                totalStudents: totalEnrollments,
                appearedStudents: appearedStudents.size,
                passedStudents: passedStudents.size,
                failedStudents: Math.max(0, appearedStudents.size - passedStudents.size),
            };
        }));

        res.json(enrichedRecords);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// UPDATE PROFILE (PUT /profiles/me) — upsert to be safe
//////////////////////////////////////////////////

router.put('/me', requireAuth, async (req, res) => {
    try {
        const { fullName, phone, bio, qualifications, experience, designation, joiningDate, address, profilePhoto } = req.body;

        const updated = await prisma.profile.upsert({
            where: { userId: req.user.id },
            update: {
                ...(fullName !== undefined && { fullName }),
                ...(phone !== undefined && { phone }),
                ...(bio !== undefined && { bio }),
                ...(qualifications !== undefined && { qualifications }),
                ...(experience !== undefined && { experience }),
                ...(designation !== undefined && { designation }),
                ...(joiningDate !== undefined && { joiningDate }),
                ...(address !== undefined && { address }),
                ...(profilePhoto !== undefined && { profilePhoto }),
            },
            create: {
                userId: req.user.id,
                fullName: fullName || '',
                phone: phone || null,
                bio: bio || null,
                qualifications: qualifications || null,
                experience: experience || null,
                designation: designation || null,
                joiningDate: joiningDate || null,
                address: address || null,
                profilePhoto: profilePhoto || null,
            }
        });

        res.json(updated);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH alias for clients that use PATCH
router.patch('/me', requireAuth, async (req, res) => {
    try {
        const { fullName, phone, bio, qualifications, experience, designation, joiningDate, address, profilePhoto } = req.body;

        const updated = await prisma.profile.upsert({
            where: { userId: req.user.id },
            update: {
                ...(fullName !== undefined && { fullName }),
                ...(phone !== undefined && { phone }),
                ...(bio !== undefined && { bio }),
                ...(qualifications !== undefined && { qualifications }),
                ...(experience !== undefined && { experience }),
                ...(designation !== undefined && { designation }),
                ...(joiningDate !== undefined && { joiningDate }),
                ...(address !== undefined && { address }),
                ...(profilePhoto !== undefined && { profilePhoto }),
            },
            create: {
                userId: req.user.id,
                fullName: fullName || '',
                phone: phone || null,
                bio: bio || null,
                qualifications: qualifications || null,
                experience: experience || null,
                designation: designation || null,
                joiningDate: joiningDate || null,
                address: address || null,
                profilePhoto: profilePhoto || null,
            }
        });

        res.json(updated);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /profiles/photo — upload profile photo
router.post('/photo', requireAuth, photoUpload.single('photo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const photoUrl = `/uploads/photos/${req.file.filename}`;

        await prisma.profile.upsert({
            where: { userId: req.user.id },
            update: { profilePhoto: photoUrl },
            create: { userId: req.user.id, fullName: '', profilePhoto: photoUrl },
        });

        res.json({ profilePhoto: photoUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /profiles/update-password — change password (requires current password)
router.post('/update-password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

        const hashed = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET /profiles/my-performance — Teacher self-report data
//////////////////////////////////////////////////

router.get('/my-performance', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Identify all academic years this teacher has taught in
        const offeringsData = await prisma.subjectOffering.findMany({
            where: { teacherId: userId },
            select: { academicYear: true }
        });
        const offeringYears = [...new Set(offeringsData.map(o => o.academicYear).filter(Boolean))];

        // 2. Fetch existing self-reported records
        const records = await prisma.teacherPerformanceData.findMany({
            where: { teacherId: userId },
            orderBy: { academicYear: 'desc' },
        });
        const recordYears = records.map(r => r.academicYear);

        // 3. Union of all years
        const allYears = [...new Set([...offeringYears, ...recordYears])].sort((a,b) => b.localeCompare(a));

        // 4. Compute automated stats for each year
        const enrichedRecords = await Promise.all(allYears.map(async (year) => {
            const existingRecord = records.find(r => r.academicYear === year) || {
                academicYear: year,
                trainingsCompleted: 0,
                trainingDetails: '',
                committeesParticipated: 0,
                eventsOrganized: 0,
                studentsMentored: 0,
                adminResponsibilityNotes: '',
            };

            const offerings = await prisma.subjectOffering.findMany({
                where: { teacherId: userId, academicYear: year },
                include: {
                    enrollments: { select: { studentId: true } },
                    marks: { select: { studentId: true, marks: true } }
                }
            });

            let totalEnrollments = 0;
            let appearedStudents = new Set();
            let passedStudents = new Set();

            offerings.forEach(off => {
                totalEnrollments += off.enrollments.length;
                
                // Track students who have any mark in this offering
                const studentBestMark = {};
                off.marks.forEach(m => {
                    appearedStudents.add(m.studentId);
                    if (!studentBestMark[m.studentId] || m.marks > studentBestMark[m.studentId]) {
                        studentBestMark[m.studentId] = m.marks;
                    }
                });

                Object.entries(studentBestMark).forEach(([sId, mark]) => {
                    if (mark >= 40) passedStudents.add(sId);
                });
            });

            return {
                ...existingRecord,
                totalStudents: totalEnrollments,
                appearedStudents: appearedStudents.size,
                passedStudents: passedStudents.size,
                failedStudents: Math.max(0, appearedStudents.size - passedStudents.size),
            };
        }));

        res.json(enrichedRecords);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// PUT /profiles/my-performance — Teacher updates own performance data
//////////////////////////////////////////////////

router.put('/my-performance', requireAuth, async (req, res) => {
    try {
        const {
            academicYear,
            trainingsCompleted = 0,
            trainingDetails = '',
            totalStudents = 0,
            passedStudents = 0,
            committeesParticipated = 0,
            eventsOrganized = 0,
            studentsMentored = 0,
            adminResponsibilityNotes = '',
        } = req.body;

        if (!academicYear) {
            return res.status(400).json({ error: 'academicYear is required' });
        }

        const data = {
            trainingsCompleted: parseInt(trainingsCompleted) || 0,
            trainingDetails: trainingDetails || null,
            // totalStudents and passedStudents are now automated
            committeesParticipated: parseInt(committeesParticipated) || 0,
            eventsOrganized: parseInt(eventsOrganized) || 0,
            studentsMentored: parseInt(studentsMentored) || 0,
            adminResponsibilityNotes: adminResponsibilityNotes || null,
        };

        const record = await prisma.teacherPerformanceData.upsert({
            where: {
                teacherId_academicYear: {
                    teacherId: req.user.id,
                    academicYear,
                },
            },
            update: data,
            create: {
                teacherId: req.user.id,
                academicYear,
                ...data,
            },
        });

        // Emit socket event for real-time updates
        req.app.get('io')?.emit('teacher_perf_change', { type: 'update', record });

        res.json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
