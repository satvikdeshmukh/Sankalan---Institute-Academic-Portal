import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api.js';
import socket from '../lib/socket.js';

export function usePrincipalData() {
    const [departments, setDepartments] = useState([]);
    const [hods, setHODs] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [stats, setStats] = useState({
        totalDepartments: 0, totalHODs: 0, totalTeachers: 0, totalStudents: 0,
        totalReports: 0, approvedReports: 0, pendingReports: 0,
    });
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.get('/principal/stats');
            setDepartments(data.departments || []);
            setHODs(data.hods || []);
            setTeachers(data.teachers || []);
            setStats(data.stats || {});
        } catch (err) {
            console.error('usePrincipalData error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();

        // Real-time: refresh on any relevant change
        socket.on('student_change', fetchAll);
        socket.on('report_change', fetchAll);
        socket.on('teacher_change', fetchAll);
        socket.on('user_change', fetchAll);
        socket.on('document_change', fetchAll);

        return () => {
            socket.off('student_change', fetchAll);
            socket.off('report_change', fetchAll);
            socket.off('teacher_change', fetchAll);
            socket.off('user_change', fetchAll);
            socket.off('document_change', fetchAll);
        };
    }, [fetchAll]);

    return { departments, hods, teachers, stats, loading, refetch: fetchAll };
}
