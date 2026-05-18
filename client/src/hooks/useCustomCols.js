import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api.js';

/**
 * Manages custom column definitions for a teacher, scoped per year + semester.
 * Reads/writes to local API /api/custom-cols
 */
export function useCustomCols(teacherUserId, year, semester) {
    const [cols, setCols] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCols = useCallback(async () => {
        if (!teacherUserId || !year || !semester) { setLoading(false); return; }
        setLoading(true);
        try {
            const data = await api.get(`/custom-cols?year=${year}&semester=${semester}`);
            setCols((data || []).map(r => r.colName || r.col_name));
        } catch (e) { console.error('fetchCols error', e); }
        finally { setLoading(false); }
    }, [teacherUserId, year, semester]);

    useEffect(() => { fetchCols(); }, [fetchCols]);

    const addCol = async (colName) => {
        if (!colName || cols.includes(colName)) return;
        try {
            await api.post('/custom-cols', { colName, year, semester });
            setCols(prev => [...prev, colName]);
        } catch (e) { console.error('addCol error', e); }
    };

    const removeCol = async (colName) => {
        try {
            await api.delete(`/custom-cols?colName=${encodeURIComponent(colName)}&year=${year}&semester=${semester}`);
            setCols(prev => prev.filter(c => c !== colName));
        } catch (e) { console.error('removeCol error', e); }
    };

    return { cols, loading, addCol, removeCol, refetch: fetchCols };
}
