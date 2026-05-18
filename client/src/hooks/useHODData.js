import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api.js';
import socket from '../lib/socket.js';

export function useHODData(departmentIdFromAuth) {
    const [teachers, setTeachers] = useState([]);
    const [departmentId, setDepartmentId] = useState(departmentIdFromAuth || null);
    const [stats, setStats] = useState({
        totalTeachers: 0, totalStudents: 0,
        avgAttendance: 0, pendingReports: 0, submittedReports: 0
    });
    const [loading, setLoading] = useState(true);

    // Sync departmentId from auth when it changes
    useEffect(() => {
        if (departmentIdFromAuth) setDepartmentId(departmentIdFromAuth);
    }, [departmentIdFromAuth]);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            // Server auto-detects HOD's department — no departmentId needed
            // Optionally pass it as a hint if available
            const teacherUrl = departmentId
                ? `/hod/teachers?departmentId=${departmentId}`
                : '/hod/teachers';

            const [teacherData, reports] = await Promise.all([
                api.get(teacherUrl).catch(err => {
                    console.error('Teachers fetch error:', err);
                    return [];
                }),
                api.get('/reports').catch(() => []),
            ]);

            // Also get students — use departmentId if known, else skip dept filter
            const studentsUrl = departmentId
                ? `/students?departmentId=${departmentId}`
                : '/students';
            const students = await api.get(studentsUrl).catch(() => []);

            setTeachers(Array.isArray(teacherData) ? teacherData : []);

            const avgAll = (students || []).map(s => {
                const monthly = s.monthly || [];
                if (monthly.length > 0) {
                    const valid = monthly.filter(m => typeof m.percentage === "number");
                    return valid.length > 0
                        ? valid.reduce((sum, m) => sum + m.percentage, 0) / valid.length
                        : 0;
                }
                return Number(s.attendance) || 0;
            });
            const avg = avgAll.length ? avgAll.reduce((a, b) => a + b, 0) / avgAll.length : 0;

            setStats({
                totalTeachers: (teacherData || []).length,
                totalStudents: (students || []).length,
                avgAttendance: Math.round(avg),
                pendingReports: (reports || []).filter(r => r.status === 'submitted_to_hod').length,
                submittedReports: (reports || []).length,
            });

            // If departmentId came from teacher data and we don't have it yet
            if (!departmentId && teacherData?.[0]?.departmentId) {
                setDepartmentId(teacherData[0].departmentId);
            }
        } finally {
            setLoading(false);
        }
    }, [departmentId]);

    useEffect(() => {
        fetch();
        socket.on('student_change', fetch);
        socket.on('report_change', fetch);
        socket.on('teacher_change', fetch);
        return () => {
            socket.off('student_change', fetch);
            socket.off('report_change', fetch);
            socket.off('teacher_change', fetch);
        };
    }, [fetch]);

    return { teachers, stats, loading, departmentId, refetch: fetch };
}
