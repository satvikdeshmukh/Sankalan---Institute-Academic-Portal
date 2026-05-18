import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api.js';
import socket from '../lib/socket.js';

const MONTH_ATT_KEYS = ['janAtt', 'febAtt', 'marAtt', 'aprAtt', 'mayAtt', 'junAtt', 'julAtt', 'augAtt', 'sepAtt', 'octAtt', 'novAtt', 'decAtt'];

export function useStudents(teacherUserId, departmentId) {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (departmentId) params.append('departmentId', departmentId);
            const query = params.toString();
            const data = await api.get(`/students${query ? `?${query}` : ''}`);
            // Normalize field names — server returns camelCase, add lowercase aliases for template compat
            setStudents((data || []).map(s => {
                // Derive year/semester from latest enrollment
                const latestEnroll = (s.enrollments || []).sort((a, b) =>
                    (b.academicYear || '').localeCompare(a.academicYear || '')
                )[0];
                return {
                    ...s,
                    // Enrollment-derived fields for template compatibility
                    year: latestEnroll?.year || s.year,
                    semester: latestEnroll?.semester || s.semester,
                    section: latestEnroll?.section || s.section || 'A',
                    name: s.fullName || s.name,
                    jan_att: s.janAtt, feb_att: s.febAtt, mar_att: s.marAtt,
                    apr_att: s.aprAtt, may_att: s.mayAtt, jun_att: s.junAtt,
                    jul_att: s.julAtt, aug_att: s.augAtt, sep_att: s.sepAtt,
                    oct_att: s.octAtt, nov_att: s.novAtt, dec_att: s.decAtt,
                    student_id: s.studentId,
                    teacher_user_id: s.teacherUserId,
                    department_id: s.departmentId,
                    departments: s.department,
                    contact: s.phone || s.contact || '',
                    custom_data: s.customData || s.custom_data || {},
                };
            }));
        } finally { setLoading(false); }
    }, [teacherUserId, departmentId]);

    useEffect(() => {
        fetch();
        socket.on('student_change', fetch);
        return () => socket.off('student_change', fetch);
    }, [fetch]);

    const addStudent = async (student) => {
        const mapped = {
            name: student.name, email: student.email, phone: student.phone || student.contact,
            year: student.year, semester: student.semester,
            studentId: student.student_id || student.studentId,
            attendance: student.attendance,
            janAtt: student.jan_att, febAtt: student.feb_att, marAtt: student.mar_att,
            aprAtt: student.apr_att, mayAtt: student.may_att, junAtt: student.jun_att,
            julAtt: student.jul_att, augAtt: student.aug_att, sepAtt: student.sep_att,
            octAtt: student.oct_att, novAtt: student.nov_att, decAtt: student.dec_att,
            customData: student.custom_data || student.customData,
            teacherUserId: student.teacher_user_id || teacherUserId,
            departmentId: student.department_id || departmentId,
        };
        try {
            const data = await api.post('/students', mapped);
            return data;
        } catch (err) { console.error(err); return null; }
    };

    const updateStudent = async (id, updates) => {
        // Map snake_case → camelCase
        const mapped = {};
        const keyMap = { contact: 'phone', jan_att: 'janAtt', feb_att: 'febAtt', mar_att: 'marAtt', apr_att: 'aprAtt', may_att: 'mayAtt', jun_att: 'junAtt', jul_att: 'julAtt', aug_att: 'augAtt', sep_att: 'sepAtt', oct_att: 'octAtt', nov_att: 'novAtt', dec_att: 'decAtt', student_id: 'studentId', teacher_user_id: 'teacherUserId', department_id: 'departmentId', custom_data: 'customData' };
        Object.entries(updates).forEach(([k, v]) => { mapped[keyMap[k] || k] = v; });
        try {
            const data = await api.patch(`/students/${id}`, mapped);
            return data;
        } catch (err) { console.error(err); return null; }
    };

    const deleteStudent = async (id) => {
        try { await api.delete(`/students/${id}`); return true; }
        catch (err) { console.error(err); return false; }
    };

    const importStudents = async (rows) => {
        try {
            await api.post('/students/bulk', { rows, teacherUserId, departmentId });
            await fetch();
            return students;
        } catch (err) { console.error(err); return []; }
    };

    return { students, loading, addStudent, updateStudent, deleteStudent, importStudents, refetch: fetch };
}
