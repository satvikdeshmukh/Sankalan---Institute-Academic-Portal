const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 🔥 CRITICAL: Check if user exists and is not blocked
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { isBlocked: true }
        });

        if (!user) {
            return res.status(401).json({ error: 'User account no longer exists' });
        }

        if (user.isBlocked) {
            return res.status(403).json({ error: 'Your account has been blocked. Access denied.' });
        }

        // Normalize role to uppercase — JWT stores lowercase but routes check uppercase
        decoded.role = decoded.role?.toUpperCase();
        req.user = decoded; // { id, role }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
}

module.exports = { requireAuth, requireRole, prisma };