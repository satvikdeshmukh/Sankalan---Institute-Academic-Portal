const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { requireAuth, prisma } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads dir exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB

// GET /api/documents
router.get('/', requireAuth, async (req, res) => {
    try {
        const where = req.user.role === 'admin' ? {} : { userId: req.user.id };
        const docs = await prisma.document.findMany({ where, orderBy: { createdAt: 'desc' } });
        res.json(docs);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/documents/upload
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const url = `${process.env.SERVER_URL || 'http://localhost:3001'}/uploads/${req.file.filename}`;
        const doc = await prisma.document.create({
            data: {
                userId: req.user.id,
                name: req.body.name || req.file.originalname,
                url,
                category: req.body.category || 'personal',
                fileType: req.file.mimetype,
                size: req.file.size,
            }
        });
        req.app.get('io')?.emit('document_change', { type: 'UPLOAD', userId: req.user.id });
        res.json(doc);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/subjects/subject/:subjectId/documents
router.post(
    '/subject/:subjectId/documents',
    requireAuth,
    upload.single('file'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const subjectId = req.params.subjectId;

            const url = `${process.env.SERVER_URL || 'http://localhost:3001'}/uploads/${req.file.filename}`;

            const doc = await prisma.document.create({
                data: {
                    subjectId,
                    userId: req.user.id,
                    name: req.body.name || req.file.originalname,
                    url,
                    fileType: req.file.mimetype,
                    size: req.file.size
                }
            });

            res.json(doc);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// DELETE /api/documents/:id
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
        if (!doc) return res.status(404).json({ error: 'Not found' });
        // Delete file from disk
        const filename = doc.url.split('/uploads/')[1];
        const filePath = path.join(uploadDir, filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        await prisma.document.delete({ where: { id: req.params.id } });
        req.app.get('io')?.emit('document_change', { type: 'DELETE', userId: doc.userId });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
