const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma, requireAuth } = require('../middleware/auth');

const router = express.Router();

//////////////////////////////////////////////////
// GET DEPARTMENTS (for signup dropdown)
//////////////////////////////////////////////////

router.get('/departments', async (req, res) => {
    try {
        const departments = await prisma.department.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' }
        });
        res.json(departments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// GET USERS (By Role / Department)
//////////////////////////////////////////////////

router.get('/users', async (req, res) => {
    try {
        const { role, departmentId } = req.query;
        const where = {};
        if (role) where.role = role.toUpperCase();
        if (departmentId) where.departmentId = departmentId;

        const users = await prisma.user.findMany({
            where,
            include: { profile: true, department: true },
            orderBy: { createdAt: 'desc' }
        });

        const result = users.map(u => ({
            id: u.id,
            email: u.email,
            role: u.role,
            department: u.department,
            profile: u.profile
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// REGISTER (TEACHER & HOD only — Admin/Principal
// accounts must be created by an admin)
//////////////////////////////////////////////////

router.post('/register', async (req, res) => {
    const { email, password, fullName, role, departmentId } = req.body;

    if (!email || !password || !fullName || !role) {
        return res.status(400).json({ error: 'All fields required' });
    }

    // Only TEACHER and HOD can self-register
    const allowedRoles = ['TEACHER', 'HOD'];
    if (!allowedRoles.includes(role.toUpperCase())) {
        return res.status(403).json({ error: 'Admin and Principal accounts cannot be self-registered. Contact an administrator.' });
    }

    const normalizedRole = role.toUpperCase();

    // TEACHER and HOD must provide a department
    if (!departmentId) {
        return res.status(400).json({ error: 'Department is required for Teacher and HOD registration' });
    }

    try {
        const existing = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() }
        });

        if (existing) {
            return res.status(409).json({ error: 'Email already exists' });
        }

        // Verify department exists
        const department = await prisma.department.findUnique({
            where: { id: departmentId }
        });
        if (!department) {
            return res.status(400).json({ error: 'Invalid department selected' });
        }

        // For HOD: check if department already has an HOD assigned
        if (normalizedRole === 'HOD' && department.hodId) {
            return res.status(409).json({ error: 'This department already has an HOD assigned' });
        }

        const hashed = await bcrypt.hash(password, 10);

        // Create user + profile in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: email.toLowerCase().trim(),
                    password: hashed,
                    role: normalizedRole,
                    departmentId: departmentId,   // 👈 ADD THIS LINE
                    profile: {
                        create: { fullName }
                    }
                },
                include: { profile: true }
            });

            // For HOD: link user as the department's HOD
            if (normalizedRole === 'HOD') {
                await tx.department.update({
                    where: { id: departmentId },
                    data: { hodId: user.id }
                });
            }

            return user;
        });

        const token = jwt.sign(
            { id: result.id, role: result.role.toLowerCase() },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: result.id,
                email: result.email,
                role: result.role.toLowerCase(),
                name: result.profile.fullName,
                departmentId: departmentId
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////////
// LOGIN
//////////////////////////////////////////////////

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            include: {
                profile: true,
                hodDepartment: { select: { id: true, name: true } }
            }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.isBlocked) {
            return res.status(403).json({ error: 'Your account has been blocked. Contact administrator.' });
        }

        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const roleLower = user.role.toLowerCase();

        const token = jwt.sign(
            { id: user.id, role: roleLower },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: roleLower,
                name: user.profile?.fullName || null,
                departmentId: user.hodDepartment?.id || user.departmentId || null,
                department: user.hodDepartment?.name || null
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


/* ---------------- GET CURRENT USER (for stale session recovery) ---------------- */
router.get('/me', requireAuth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                profile: true,
                hodDepartment: { select: { id: true, name: true } }
            }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({
            id: user.id,
            email: user.email,
            role: user.role.toLowerCase(),
            name: user.profile?.fullName || null,
            departmentId: user.hodDepartment?.id || user.departmentId || null,
            department: user.hodDepartment?.name || null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ──────────────────────────────────────────────────────
   FORGOT PASSWORD — send OTP to email
   POST /auth/forgot-password  { email }
────────────────────────────────────────────────────── */

// In-memory OTP store (production: use Redis or DB table)
const otpStore = new Map(); // email → { otp, expiresAt }

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (!user) return res.status(404).json({ error: 'No account found with this email' });

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(email.toLowerCase(), { otp, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 min

        // Send via nodemailer
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_FROM, pass: process.env.EMAIL_PASSWORD },
        });

        await transporter.sendMail({
            from: `"Sankalan" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: 'Password Reset OTP – Sankalan',
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px">
                <h2 style="color:#1e40af">Password Reset</h2>
                <p>Use the OTP below to reset your Sankalan password. It expires in <strong>10 minutes</strong>.</p>
                <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1e40af;text-align:center;padding:16px 0">${otp}</div>
                <p style="color:#6b7280;font-size:12px">If you did not request a password reset, please ignore this email.</p>
              </div>`
        });

        res.json({ success: true, message: 'OTP sent to your email' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ──────────────────────────────────────────────────────
   RESET PASSWORD — verify OTP and set new password
   POST /auth/reset-password  { email, otp, newPassword }
────────────────────────────────────────────────────── */
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ error: 'Email, OTP, and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const record = otpStore.get(email.toLowerCase());
        if (!record) return res.status(400).json({ error: 'No OTP found for this email. Request a new one.' });
        if (Date.now() > record.expiresAt) {
            otpStore.delete(email.toLowerCase());
            return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
        }
        if (record.otp !== otp.trim()) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { email: email.toLowerCase().trim() },
            data: { password: hashed }
        });

        otpStore.delete(email.toLowerCase());
        res.json({ success: true, message: 'Password reset successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ──────────────────────────────────────────────────────
   REQUEST EMAIL CHANGE — send OTP to the NEW email
   POST /auth/request-email-change  { newEmail }
   Requires authentication
────────────────────────────────────────────────────── */
router.post('/request-email-change', requireAuth, async (req, res) => {
    try {
        const { newEmail } = req.body;
        if (!newEmail) return res.status(400).json({ error: 'New email is required' });

        const normalizedNew = newEmail.toLowerCase().trim();

        // Basic email format check
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedNew)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check current user
        const currentUser = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!currentUser) return res.status(404).json({ error: 'User not found' });

        // Don't allow changing to same email
        if (currentUser.email === normalizedNew) {
            return res.status(400).json({ error: 'New email is the same as current email' });
        }

        // Check if new email is already taken
        const existing = await prisma.user.findUnique({ where: { email: normalizedNew } });
        if (existing) {
            return res.status(409).json({ error: 'This email is already registered to another account' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const storeKey = `emailchange:${req.user.id}:${normalizedNew}`;
        otpStore.set(storeKey, { otp, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 min

        // Send OTP to the NEW email
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_FROM, pass: process.env.EMAIL_PASSWORD },
        });

        await transporter.sendMail({
            from: `"Sankalan" <${process.env.EMAIL_FROM}>`,
            to: normalizedNew,
            subject: 'Email Change Verification OTP – Sankalan',
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px">
                <h2 style="color:#1e40af">Verify Your New Email</h2>
                <p>You requested to change your Sankalan email to <strong>${normalizedNew}</strong>.</p>
                <p>Use the OTP below to verify this email address. It expires in <strong>10 minutes</strong>.</p>
                <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1e40af;text-align:center;padding:16px 0">${otp}</div>
                <p style="color:#6b7280;font-size:12px">If you did not request this change, please ignore this email.</p>
              </div>`
        });

        res.json({ success: true, message: 'OTP sent to your new email address' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ──────────────────────────────────────────────────────
   VERIFY EMAIL CHANGE — verify OTP and update email
   POST /auth/verify-email-change  { newEmail, otp }
   Requires authentication
────────────────────────────────────────────────────── */
router.post('/verify-email-change', requireAuth, async (req, res) => {
    try {
        const { newEmail, otp } = req.body;
        if (!newEmail || !otp) {
            return res.status(400).json({ error: 'New email and OTP are required' });
        }

        const normalizedNew = newEmail.toLowerCase().trim();
        const storeKey = `emailchange:${req.user.id}:${normalizedNew}`;

        const record = otpStore.get(storeKey);
        if (!record) return res.status(400).json({ error: 'No OTP found for this email change. Request a new one.' });
        if (Date.now() > record.expiresAt) {
            otpStore.delete(storeKey);
            return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
        }
        if (record.otp !== otp.trim()) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // Double-check email is still available
        const existing = await prisma.user.findUnique({ where: { email: normalizedNew } });
        if (existing) {
            otpStore.delete(storeKey);
            return res.status(409).json({ error: 'This email is already registered to another account' });
        }

        // Update email
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: { email: normalizedNew },
            include: { profile: true, hodDepartment: { select: { id: true, name: true } } }
        });

        otpStore.delete(storeKey);

        // Issue a new token with updated info
        const roleLower = updatedUser.role.toLowerCase();
        const token = jwt.sign(
            { id: updatedUser.id, role: roleLower },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Email updated successfully',
            token,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                role: roleLower,
                name: updatedUser.profile?.fullName || null,
                departmentId: updatedUser.hodDepartment?.id || updatedUser.departmentId || null,
                department: updatedUser.hodDepartment?.name || null
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;