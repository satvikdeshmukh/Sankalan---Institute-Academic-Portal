import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import ExtraCurricular from './ExtraCurricular.jsx';
import { api } from '../../lib/api.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import socket from '../../lib/socket.js';

export default function TeacherExtraCurricular() {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);

    const fetchStudents = useCallback(async () => {
        try {
            const data = await api.get('/students');
            // Normalize: flatten latest enrollment into top-level fields
            setStudents((data || []).map(s => {
                const latest = (s.enrollments || [])
                    .sort((a, b) => (b.academicYear || '').localeCompare(a.academicYear || ''))[0];
                return {
                    ...s,
                    name: s.fullName || s.name,
                    student_id: s.studentId,
                    year: latest?.year ?? s.year ?? null,
                    semester: latest?.semester ?? s.semester ?? null,
                    section: latest?.section ?? s.section ?? 'A',
                };
            }));
        } catch (err) {
            console.error('Failed to fetch students for extra curricular:', err);
            setStudents([]);
        }
    }, []);

    useEffect(() => {
        fetchStudents();
        // Real-time: refresh when student data changes
        socket.on('student_change', fetchStudents);
        socket.on('activity_change', fetchStudents);
        return () => {
            socket.off('student_change', fetchStudents);
            socket.off('activity_change', fetchStudents);
        };
    }, [fetchStudents]);

    return (
        <DashboardLayout>
            <ExtraCurricular students={students} userId={user?.id} />
        </DashboardLayout>
    );
}