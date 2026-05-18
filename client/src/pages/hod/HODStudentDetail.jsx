import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import StudentProfileView from '../teacher/StudentProfileView.jsx';

export default function HODStudentDetail() {
    const { studentId } = useParams();
    const navigate = useNavigate();

    return (
        <DashboardLayout title="Student Profile" subtitle="Detailed student performance and insights">
            <StudentProfileView
                studentId={studentId}
                onBack={() => navigate('/hod/students')}
            />
        </DashboardLayout>
    );
}
