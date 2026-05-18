const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const timetableRoutes = require('./routes/timetable');
const studentRoutes = require('./routes/students');
const reportRoutes = require('./routes/reports');
const documentRoutes = require('./routes/documents');
const profileRoutes = require('./routes/profiles');
const subjectRoutes = require('./routes/subjects');
const attendanceRoutes = require('./routes/attendance');
const courseRoutes = require('./routes/courses');
// const teacherAssignmentRoutes = require('./routes/teacherAssignments');
// const customColRoutes = require('./routes/customCols');
const hodRoutes = require('./routes/hod');
const principalRoutes = require('./routes/principal');
const marksRoutes = require("./routes/marks");
const attendanceRiskRoutes = require('./routes/attendanceRisk');
const { startRiskCron } = require('./jobs/riskCron');
const activitiesRoutes = require('./routes/activities');
const teacherPerformanceRoutes = require('./routes/teacherPerformance');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Socket.io — replaces Supabase Realtime
const io = new Server(server, {
    cors: { origin: CLIENT_URL, credentials: true }
});
app.set('io', io);
io.on('connection', socket => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/courses', courseRoutes);
// app.use('/api/teacher-assignments', teacherAssignmentRoutes);
// app.use('/api/custom-cols', customColRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/principal', principalRoutes);
app.use("/api/marks", marksRoutes);
app.use('/api/attendance-risk', attendanceRiskRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/teacher-performance', teacherPerformanceRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

server.listen(PORT, () => {
    console.log(`\n🚀 EduPortal API running on http://localhost:${PORT}`);
    console.log(`📡 Socket.io realtime active`);
    console.log(`🗄️  Database: PostgreSQL (local)\n`);
    startRiskCron();
});
