import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api.js';
import socket from '../lib/socket.js';

export function useReports(userId) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.get('/reports');
            setReports(data || []);
        } catch (e) { console.error('fetchReports error', e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchReports();
        // Real-time refresh on report changes
        socket.on('report_change', fetchReports);
        return () => socket.off('report_change', fetchReports);
    }, [fetchReports]);

    const createReport = async (reportData) => {
        try {
            const data = await api.post('/reports', reportData);
            setReports(prev => [data, ...prev]);
            return data;
        } catch (err) {
            console.error('createReport error', err);
            throw err;
        }
    };

    const submitReport = async (reportId, target = 'hod', notes = '') => {
        try {
            let status;
            if (target === 'principal') status = 'submitted_to_principal';
            else if (target === 'reviewed') status = 'reviewed';
            else status = 'submitted_to_hod';

            const data = await api.patch(`/reports/${reportId}`, { status, notes });
            setReports(prev => prev.map(r => r.id === reportId ? { ...r, ...data } : r));
            return data;
        } catch (err) {
            console.error('submitReport error', err);
            throw err;
        }
    };

    const deleteReport = async (id) => {
        try {
            await api.delete(`/reports/${id}`);
            setReports(prev => prev.filter(r => r.id !== id));
        } catch (err) { console.error('deleteReport error', err); throw err; }
    };

    const approveReport = async (reportId) => {
        try {
            const data = await api.patch(`/reports/${reportId}`, { status: 'approved' });
            setReports(prev => prev.map(r => r.id === reportId ? { ...r, ...data } : r));
            return data;
        } catch (err) {
            console.error('approveReport error', err);
            throw err;
        }
    };
    const rejectReport = async (reportId) => {
    try {
        const data = await api.patch(`/reports/${reportId}`, { status: 'rejected' });
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, ...data } : r));
        return data;
    } catch (err) {
        console.error('rejectReport error', err);
        throw err;
    }
};

    const editReport = async (reportId, updates) => {
        try {
            const data = await api.patch(`/reports/${reportId}`, updates);
            setReports(prev => prev.map(r => r.id === reportId ? { ...r, ...data } : r));
            return data;
        } catch (err) {
            console.error('editReport error', err);
            throw err;
        }
    };

    return { reports, loading, createReport, submitReport, approveReport, deleteReport, editReport,rejectReport, refetch: fetchReports };
}
