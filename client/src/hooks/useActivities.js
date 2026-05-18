import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api.js';
import socket from '../lib/socket.js';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/**
 * Activities hook — multiple entries per student per month
 * Data shape: { [studentId]: { [month]: [{ id, value, desc }] } }
 */
export function useActivities(teacherId) {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(false);
    const [saveError, setSaveError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!teacherId) return;
        setLoading(true);
        try {
            const raw = await api.get('/activities');
            setData(raw || {});
        } catch (err) {
            console.error('Activities fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [teacherId]);

    useEffect(() => {
        fetchData();
        // Real-time: refresh when activity data changes
        socket.on('activity_change', fetchData);
        return () => socket.off('activity_change', fetchData);
    }, [fetchData]);

    /** Add a NEW credit entry for a student in a month (always creates a new row) */
    const addEntry = async (studentId, month, value, desc = '') => {
        setSaveError(null);
        const pts = Number(value);
        if (!studentId || !month || isNaN(pts) || pts <= 0) {
            setSaveError('Enter a valid points value greater than 0.');
            return false;
        }
        try {
            const saved = await api.post('/activities', {
                studentId,
                month,
                points: pts,
                description: desc.trim(),
            });
            // Optimistically push the new entry into local state
            setData(prev => {
                const monthEntries = [...(prev[studentId]?.[month] || [])];
                monthEntries.push({ id: saved.id, value: saved.value, desc: saved.desc || '' });
                return {
                    ...prev,
                    [studentId]: { ...(prev[studentId] || {}), [month]: monthEntries }
                };
            });
            return true;
        } catch (err) {
            console.error('Add activity error:', err);
            setSaveError(err.message || 'Failed to save activity entry.');
            // Re-fetch to sync state
            await fetchData();
            return false;
        }
    };

    /** Delete a specific entry by its id */
    const deleteEntry = async (studentId, month, entryId) => {
        setSaveError(null);
        // Optimistic removal
        setData(prev => {
            const monthEntries = (prev[studentId]?.[month] || []).filter(e => e.id !== entryId);
            return {
                ...prev,
                [studentId]: { ...(prev[studentId] || {}), [month]: monthEntries }
            };
        });
        try {
            if (!String(entryId).startsWith('temp_')) {
                await api.delete(`/activities/${entryId}`);
            }
            return true;
        } catch (err) {
            console.error('Delete activity error:', err);
            setSaveError(err.message || 'Failed to delete activity entry.');
            await fetchData(); // Re-sync on failure
            return false;
        }
    };

    /** Get all entries for a student in a month → array */
    const getEntries = (studentId, month) => data[studentId]?.[month] || [];

    /** Total credits for a student across ALL months */
    const getTotal = (studentId) => {
        const studentData = data[studentId] || {};
        return MONTHS.reduce((sum, m) =>
            sum + (studentData[m] || []).reduce((s, e) => s + (Number(e.value) || 0), 0), 0);
    };

    /** Total credits for a student in one specific month */
    const getMonthTotal = (studentId, month) =>
        (data[studentId]?.[month] || []).reduce((s, e) => s + (Number(e.value) || 0), 0);

    return {
        data, loading, saveError, setSaveError,
        addEntry, deleteEntry,
        getEntries, getTotal, getMonthTotal,
        MONTHS, refetch: fetchData,
    };
}