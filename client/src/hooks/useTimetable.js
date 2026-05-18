import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api.js';
import socket from '../lib/socket.js';

export function useTimetable({ departmentId, teacherId, teacherUserId, year, semester, section, academicYear, fetchAll = false } = {}) {
    // Support both teacherId and teacherUserId for compatibility
    const effectiveTeacherId = teacherId || teacherUserId;
    
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchEntries = useCallback(async () => {
        if (!departmentId && !effectiveTeacherId && !fetchAll) {
            setEntries([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            const params = new URLSearchParams();

            if (departmentId) params.append('departmentId', departmentId);
            if (effectiveTeacherId) params.append('teacherId', effectiveTeacherId);
            if (year) params.append('year', year);
            if (semester) params.append('semester', semester);
            if (section) params.append('section', section);
            if (academicYear) params.append('academicYear', academicYear);

            const data = await api.get(`/timetable?${params}`);

            setEntries((data || []).map(e => ({
                ...e,
                _original: e,

                // Backward compatibility keys
                department_id: e.departmentId,
                day_of_week: e.dayOfWeek,
                period_number: e.periodNumber,
                teacher_name: e.teacherName,
                start_time: e.startTime,
                end_time: e.endTime,
                academic_year: e.academicYear,
            })));

        } catch (err) {
            console.error('fetchTimetable error:', err);
        } finally {
            setLoading(false);
        }

    }, [departmentId, effectiveTeacherId, year, semester, section, academicYear]);

    useEffect(() => {

        fetchEntries();

        const handler = (data) => {
            // Always refetch if we're watching by teacher (any dept change may affect their schedule)
            // Or refetch if the changed dept matches ours
            if (effectiveTeacherId || data.departmentId === departmentId) {
                fetchEntries();
            }
        };

        socket.on('timetable_change', handler);

        return () => {
            socket.off('timetable_change', handler);
        };

    }, [fetchEntries, departmentId, effectiveTeacherId]);



    const addEntry = async (entry) => {
        try {
            const data = await api.post('/timetable', entry);
            return data;
        } catch (err) {
            console.error('addEntry error:', err);
            return null;
        }
    };


    const addBulkEntries = async (entriesArr, deptId) => {
        try {
            await api.post('/timetable/bulk', {
                entries: entriesArr,
                departmentId: deptId
            });
        } catch (err) {
            console.error('addBulkEntries error:', err);
            throw err;
        }
    };


    const deleteByDept = async (deptId, filters = {}) => {
        try {
            const params = new URLSearchParams(filters);
            await api.delete(`/timetable/department/${deptId}?${params}`);
        } catch (err) {
            console.error('deleteByDept error:', err);
        }
    };


    const deleteEntry = async (id) => {
        try {
            await api.delete(`/timetable/${id}`);
        } catch (err) {
            console.error('deleteEntry error:', err);
        }
    };


    return {
        entries,
        loading,
        refetch: fetchEntries,
        addEntry,
        addBulkEntries,
        deleteByDept,
        deleteEntry,
        removeByDept: deleteByDept
    };
}