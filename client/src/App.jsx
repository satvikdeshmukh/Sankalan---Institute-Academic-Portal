import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';

// Auth pages
import Login from './pages/Login.jsx';
import LandingPage from './pages/LandingPage.jsx';
import Blocked from './pages/Blocked.jsx';

// Teacher pages
import TeacherDashboard from './pages/teacher/TeacherDashboard.jsx';
import TeacherStudents from './pages/teacher/TeacherStudents.jsx';
import TeacherCourses from './pages/teacher/TeacherCourses.jsx';
import TeacherReports from './pages/teacher/TeacherReports.jsx';
import TeacherSubmit from './pages/teacher/TeacherSubmit.jsx';
import TeacherDocuments from './pages/teacher/TeacherDocuments.jsx';
import TeacherProfile from './pages/teacher/TeacherProfile.jsx';
import TeacherExtraCurricular from './pages/teacher/TeacherExtraCurricular.jsx';
import TeacherMarks from './pages/teacher/TeacherMarks.jsx';
import TeacherManagedStudents from './pages/teacher/TeacherManagedStudents.jsx';
import TeacherTimetable from './pages/teacher/TeacherTimetable.jsx';

// HOD pages
import HODDashboard from './pages/hod/HODDashboard.jsx';
import HODTeachers from './pages/hod/HODTeachers.jsx';
import HODStudents from './pages/hod/HODStudents.jsx';
import HODStudentDetail from './pages/hod/HODStudentDetail.jsx';
import HODReports from './pages/hod/HODReports.jsx';
import HODSubmit from './pages/hod/HODSubmit.jsx';
import HODProfile from './pages/hod/HODProfile.jsx';
import HODTeacherDetail from './pages/hod/HODTeacherDetail.jsx';
import HODAttendance from './pages/hod/HODAttendance.jsx';
import HODMarks from './pages/hod/HODMarks.jsx';
import HODTimetable from './pages/hod/HODTimetable.jsx';
import HODCourses from './pages/hod/HODCourses.jsx';
import HODTeacherPerformance from './pages/hod/HODTeacherPerformance.jsx';

// Principal pages
import PrincipalDashboard from './pages/principal/PrincipalDashboard.jsx';
import PrincipalDepartments from './pages/principal/PrincipalDepartments.jsx';
import PrincipalDepartmentDetail from './pages/principal/PrincipalDepartmentDetail.jsx';
import PrincipalHODs from './pages/principal/PrincipalHODs.jsx';
import PrincipalHODDetail from './pages/principal/PrincipalHODDetail.jsx';
import PrincipalTeachers from './pages/principal/PrincipalTeachers.jsx';
import PrincipalTeacherDetail from './pages/principal/PrincipalTeacherDetail.jsx';
import PrincipalReports from './pages/principal/PrincipalReports.jsx';
import PrincipalProfile from './pages/principal/PrincipalProfile.jsx';
import PrincipalTeacherPerformance from './pages/principal/PrincipalTeacherPerformance.jsx';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminStudents from './pages/admin/AdminStudents.jsx';
import AdminReports from './pages/admin/AdminReports.jsx';
import AdminDocuments from './pages/admin/AdminDocuments.jsx';
import AdminTimetable from './pages/admin/AdminTimetable.jsx';
import AdminProfile from './pages/admin/AdminProfile.jsx';
import AdminDepartments from './pages/admin/AdminDepartments.jsx';
import AdminTeachers from './pages/admin/AdminTeachers.jsx';
import AdminTeacherAttendance from './pages/admin/AdminTeacherAttendance.jsx';
import AdminTeacherFeedback from './pages/admin/AdminTeacherFeedback.jsx';
import AdminAttendanceRisk from './pages/admin/AdminAttendanceRisk.jsx';

// Module-specific attendance risk pages
import TeacherAttendanceRisk from './pages/teacher/TeacherAttendanceRisk.jsx';
import HODAttendanceRisk from './pages/hod/HODAttendanceRisk.jsx';
import PrincipalAttendanceRisk from './pages/principal/PrincipalAttendanceRisk.jsx';
function Spinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
        </div>
    );
}

class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { error: null }; }
    static getDerivedStateFromError(error) { return { error }; }
    componentDidCatch(error, info) { console.error('EduPortal Error:', error, info); }
    render() {
        if (this.state.error) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
                    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                        <div className="text-4xl mb-4">⚠️</div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
                        <p className="text-gray-500 text-sm mb-4">{this.state.error.message}</p>
                        <button
                            onClick={() => { this.setState({ error: null }); window.location.href = '/'; }}
                            className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700"
                        >
                            Go to Home
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

function ProtectedRoute({ children, allowedRole }) {
    const { isAuthenticated, user, isLoading, isBlocked } = useAuth();
    if (isLoading) return <Spinner />;
    if (isBlocked) return <Navigate to="/blocked" replace />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user?.role !== allowedRole) return <Navigate to={`/${user?.role}`} replace />;
    return children;
}

function IndexRedirect() {
    const { isAuthenticated, user, isLoading, isBlocked } = useAuth();
    if (isLoading) return <Spinner />;
    if (isBlocked) return <Navigate to="/blocked" replace />;
    if (isAuthenticated && user?.role) return <Navigate to={`/${user.role}`} replace />;
    return <LandingPage />;
}

export default function App() {
    return (
        <BrowserRouter>
            <ErrorBoundary>
                <AuthProvider>
                    <Routes>
                        <Route path="/" element={<IndexRedirect />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/blocked" element={<Blocked />} />

                        {/* Teacher */}
                        <Route path="/teacher" element={<ProtectedRoute allowedRole="teacher"><TeacherDashboard /></ProtectedRoute>} />
                        <Route path="/teacher/students" element={<ProtectedRoute allowedRole="teacher"><TeacherStudents /></ProtectedRoute>} />
                        <Route path="/teacher/courses" element={<ProtectedRoute allowedRole="teacher"><TeacherCourses /></ProtectedRoute>} />
                        <Route path="/teacher/reports" element={<ProtectedRoute allowedRole="teacher"><TeacherReports /></ProtectedRoute>} />
                        <Route path="/teacher/submit" element={<ProtectedRoute allowedRole="teacher"><TeacherSubmit /></ProtectedRoute>} />
                        <Route path="/teacher/documents" element={<ProtectedRoute allowedRole="teacher"><TeacherDocuments /></ProtectedRoute>} />
                        <Route path="/teacher/profile" element={<ProtectedRoute allowedRole="teacher"><TeacherProfile /></ProtectedRoute>} />
                        <Route path="/teacher/extra-curricular" element={<ProtectedRoute allowedRole="teacher"><TeacherExtraCurricular /></ProtectedRoute>} />
                        <Route path="/teacher/marks" element={<ProtectedRoute allowedRole="teacher"><TeacherMarks /></ProtectedRoute>} />
                        <Route path="/teacher/managed-students" element={<ProtectedRoute allowedRole="teacher"><TeacherManagedStudents /></ProtectedRoute>} />
                        <Route path="/teacher/timetable" element={<ProtectedRoute allowedRole="teacher"><TeacherTimetable /></ProtectedRoute>} />
                        <Route path="/teacher/attendance-risk"
                            element={<ProtectedRoute allowedRole="teacher"><TeacherAttendanceRisk /></ProtectedRoute>} />

                        {/* HOD */}
                        <Route path="/hod" element={<ProtectedRoute allowedRole="hod"><HODDashboard /></ProtectedRoute>} />
                        <Route path="/hod/teachers" element={<ProtectedRoute allowedRole="hod"><HODTeachers /></ProtectedRoute>} />
                        <Route path="/hod/teachers/:teacherId" element={<ProtectedRoute allowedRole="hod"><HODTeacherDetail /></ProtectedRoute>} />
                        <Route path="/hod/timetable" element={<ProtectedRoute allowedRole="hod"><HODTimetable /></ProtectedRoute>} />
                        <Route path="/hod/students" element={<ProtectedRoute allowedRole="hod"><HODStudents /></ProtectedRoute>} />
                        <Route path="/hod/students/:studentId" element={<ProtectedRoute allowedRole="hod"><HODStudentDetail /></ProtectedRoute>} />
                        <Route path="/hod/attendance" element={<ProtectedRoute allowedRole="hod"><HODAttendance /></ProtectedRoute>} />
                        <Route path="/hod/marks" element={<ProtectedRoute allowedRole="hod"><HODMarks /></ProtectedRoute>} />
                        <Route path="/hod/courses" element={<ProtectedRoute allowedRole="hod"><HODCourses /></ProtectedRoute>} />
                        <Route path="/hod/reports" element={<ProtectedRoute allowedRole="hod"><HODReports /></ProtectedRoute>} />
                        <Route path="/hod/submit" element={<ProtectedRoute allowedRole="hod"><HODSubmit /></ProtectedRoute>} />
                        <Route path="/hod/profile" element={<ProtectedRoute allowedRole="hod"><HODProfile /></ProtectedRoute>} />
                        <Route path="/hod/attendance-risk"
                            element={<ProtectedRoute allowedRole="hod"><HODAttendanceRisk /></ProtectedRoute>} />
                        <Route path="/hod/teacher-performance" element={<ProtectedRoute allowedRole="hod"><HODTeacherPerformance /></ProtectedRoute>} />

                        {/* Principal */}
                        <Route path="/principal" element={<ProtectedRoute allowedRole="principal"><PrincipalDashboard /></ProtectedRoute>} />
                        <Route path="/principal/departments" element={<ProtectedRoute allowedRole="principal"><PrincipalDepartments /></ProtectedRoute>} />
                        <Route path="/principal/departments/:deptId" element={<ProtectedRoute allowedRole="principal"><PrincipalDepartmentDetail /></ProtectedRoute>} />
                        <Route path="/principal/hods" element={<ProtectedRoute allowedRole="principal"><PrincipalHODs /></ProtectedRoute>} />
                        <Route path="/principal/hods/:hodId" element={<ProtectedRoute allowedRole="principal"><PrincipalHODDetail /></ProtectedRoute>} />
                        <Route path="/principal/teachers" element={<ProtectedRoute allowedRole="principal"><PrincipalTeachers /></ProtectedRoute>} />
                        <Route path="/principal/teachers/:teacherId" element={<ProtectedRoute allowedRole="principal"><PrincipalTeacherDetail /></ProtectedRoute>} />
                        <Route path="/principal/reports" element={<ProtectedRoute allowedRole="principal"><PrincipalReports /></ProtectedRoute>} />
                        <Route path="/principal/profile" element={<ProtectedRoute allowedRole="principal"><PrincipalProfile /></ProtectedRoute>} />
                        <Route path="/principal/attendance-risk"
                            element={<ProtectedRoute allowedRole="principal"><PrincipalAttendanceRisk /></ProtectedRoute>} />
                        <Route path="/principal/teacher-performance" element={<ProtectedRoute allowedRole="principal"><PrincipalTeacherPerformance /></ProtectedRoute>} />

                        {/* Admin */}
                        <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
                        <Route path="/admin/users" element={<ProtectedRoute allowedRole="admin"><AdminUsers /></ProtectedRoute>} />
                        <Route path="/admin/students" element={<ProtectedRoute allowedRole="admin"><AdminStudents /></ProtectedRoute>} />
                        <Route path="/admin/reports" element={<ProtectedRoute allowedRole="admin"><AdminReports /></ProtectedRoute>} />
                        <Route path="/admin/documents" element={<ProtectedRoute allowedRole="admin"><AdminDocuments /></ProtectedRoute>} />
                        <Route path="/admin/timetable" element={<ProtectedRoute allowedRole="admin"><AdminTimetable /></ProtectedRoute>} />
                        <Route path="/admin/departments" element={<ProtectedRoute allowedRole="admin"><AdminDepartments /></ProtectedRoute>} />
                        <Route path="/admin/profile" element={<ProtectedRoute allowedRole="admin"><AdminProfile /></ProtectedRoute>} />
                        <Route path="/admin/teachers" element={<ProtectedRoute allowedRole="admin"><AdminTeachers /></ProtectedRoute>} />
                        <Route path="/admin/teacher-attendance" element={<ProtectedRoute allowedRole="admin"><AdminTeacherAttendance /></ProtectedRoute>} />
                        <Route path="/admin/teacher-feedback" element={<ProtectedRoute allowedRole="admin"><AdminTeacherFeedback /></ProtectedRoute>} />
                        <Route path="/admin/attendance-risk"
                            element={<ProtectedRoute allowedRole="admin"><AdminAttendanceRisk /></ProtectedRoute>} />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </AuthProvider>
            </ErrorBoundary>
        </BrowserRouter>
    );
}