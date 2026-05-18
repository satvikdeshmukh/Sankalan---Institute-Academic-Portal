import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api.js';
import socket from '../lib/socket.js';

export function useAdminData() {
    const [users, setUsers] = useState([]);
    const [students, setStudents] = useState([]);
    const [reports, setReports] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [usersData, studentsData, reportsData, docsData] = await Promise.all([
                api.get('/admin/users'),
                api.get('/students'),
                api.get('/admin/reports'),
                api.get('/admin/documents'),
            ]);
            setUsers(usersData || []);
            // Normalize students
            setStudents((studentsData || []).map(s => {
                // Find most recent enrollment year
                const latestEnrollment = s.enrollments && s.enrollments.length > 0 
                    ? [...s.enrollments].sort((a,b) => b.academicYear.localeCompare(a.academicYear))[0]
                    : null;
                
                return {
                    ...s,
                    name: s.fullName, // Component expects 'name'
                    year: latestEnrollment?.year || null, // Extract year
                    student_id: s.studentId,
                    departments: s.department,
                    jan_att: s.janAtt, feb_att: s.febAtt, mar_att: s.marAtt,
                    apr_att: s.aprAtt, may_att: s.mayAtt, jun_att: s.junAtt,
                    jul_att: s.julAtt, aug_att: s.augAtt, sep_att: s.sepAtt,
                    oct_att: s.octAtt, nov_att: s.novAtt, dec_att: s.decAtt,
                };
            }));
            setReports(reportsData || []);
            setDocuments(docsData || []);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchAll();
        socket.on('student_change', fetchAll);
        socket.on('document_change', fetchAll);
        socket.on('user_change', fetchAll);
        return () => {
            socket.off('student_change', fetchAll);
            socket.off('document_change', fetchAll);
            socket.off('user_change', fetchAll);
        };
    }, [fetchAll]);

    return { users, students, reports, documents, loading, refetch: fetchAll };
}
