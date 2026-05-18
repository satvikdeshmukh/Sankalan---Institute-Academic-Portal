import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../lib/api.js';
import socket from '../../lib/socket.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import {
    Users, Search, X, Upload, Download, RefreshCw, Calendar,
    CheckCircle2, XCircle, Building2
} from 'lucide-react';
import * as XLSX from 'xlsx';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function Toast({ type, title, message, onClose }) {
    const c = { success: 'bg-emerald-50 border-emerald-300 text-emerald-800', error: 'bg-red-50 border-red-300 text-red-800', info: 'bg-blue-50 border-blue-300 text-blue-800', warning: 'bg-amber-50 border-amber-300 text-amber-800' };
    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium max-w-sm ${c[type] || c.info}`}>
            <div className="flex-1"><p className="font-bold">{title}</p>{message && <p className="text-xs opacity-80 mt-0.5">{message}</p>}</div>
            <button onClick={onClose} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
    );
}

function AttendanceCell({ value }) {
    if (value === null || value === undefined) return <span className="text-gray-300">—</span>;
    const pct = parseFloat(value);
    const color = pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600';
    const bg = pct >= 75 ? 'bg-emerald-50' : pct >= 50 ? 'bg-amber-50' : 'bg-red-50';
    return <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold ${color} ${bg}`}>{pct.toFixed(1)}%</span>;
}

export default function AdminTeacherAttendance() {
    const [records, setRecords] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [deptF, setDeptF] = useState('');
    const [search, setSearch] = useState('');
    const [dateF, setDateF] = useState('');
    const [monthF, setMonthF] = useState('');

    const showToast = (t, ti, m) => { setToast({ type: t, title: ti, message: m }); setTimeout(() => setToast(null), 4000); };

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const params = deptF ? `?departmentId=${deptF}` : '';
            const [recs, tchrs, depts] = await Promise.all([
                api.get(`/admin/teacher-attendance${params}`),
                api.get('/admin/teachers'),
                api.get('/auth/departments'),
            ]);
            setRecords(Array.isArray(recs) ? recs : []);
            setTeachers(Array.isArray(tchrs) ? tchrs : []);
            setDepartments(Array.isArray(depts) ? depts : []);
        } catch (err) { showToast('error', 'Load failed', err.message); }
        finally { setLoading(false); }
    }, [deptF]);

    useEffect(() => { fetchAll(); }, [fetchAll]);
    useEffect(() => {
        socket.on('teacher_attendance_change', fetchAll);
        return () => socket.off('teacher_attendance_change', fetchAll);
    }, [fetchAll]);

    // ─── Summary: per teacher, Jan-Dec attendance % ───
    // Sources: 1) MONTHLY records (imported directly), 2) Auto-computed from DAILY records per month
    const teacherSummary = useMemo(() => {
        const map = {}; // teacherId -> { name, dept, months: { 1: pct, 2: pct, ... } }

        // Helper to init teacher entry
        const ensure = (r) => {
            if (!map[r.teacherId]) {
                map[r.teacherId] = { teacherId: r.teacherId, name: r.teacherName, dept: r.departmentName, months: {} };
            }
        };

        // 1) Auto-compute from DAILY records: group by teacher+month, compute present/total %
        const dailyMap = {}; // `${teacherId}-${month}` -> { present, total }
        records.forEach(r => {
            if (r.type !== 'DAILY') return;
            ensure(r);
            const m = r.month || (new Date(r.date).getMonth() + 1);
            const key = `${r.teacherId}-${m}`;
            if (!dailyMap[key]) dailyMap[key] = { present: 0, total: 0, teacherId: r.teacherId, month: m };
            dailyMap[key].total++;
            if (r.status) dailyMap[key].present++;
        });
        // Write computed daily data into map
        Object.values(dailyMap).forEach(d => {
            if (map[d.teacherId]) {
                const pct = d.total > 0 ? ((d.present / d.total) * 100) : null;
                map[d.teacherId].months[d.month] = pct;
            }
        });

        // 2) Override/supplement with MONTHLY records (they have explicit percentage)
        records.forEach(r => {
            if (r.type !== 'MONTHLY') return;
            ensure(r);
            const m = r.month;
            const pct = r.percentage != null ? parseFloat(r.percentage) : (r.status ? 100 : 0);
            map[r.teacherId].months[m] = pct;
        });

        // Build final array with Jan-Dec + average
        return Object.values(map).map(t => {
            const monthValues = [];
            const monthData = {};
            for (let m = 1; m <= 12; m++) {
                const val = t.months[m] !== undefined ? t.months[m] : null;
                monthData[m] = val;
                if (val !== null) monthValues.push(val);
            }
            const avg = monthValues.length > 0 ? (monthValues.reduce((a, b) => a + b, 0) / monthValues.length) : null;
            return { ...t, monthData, avg };
        });
    }, [records]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return teacherSummary.filter(t => {
            if (q && !t.name.toLowerCase().includes(q) && !t.dept.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [teacherSummary, search]);

    // Only show months that have data for at least one teacher
    const activeMonths = useMemo(() => {
        const monthsWithData = new Set();
        filtered.forEach(t => {
            for (let m = 1; m <= 12; m++) {
                if (t.monthData[m] !== null && t.monthData[m] !== undefined) monthsWithData.add(m);
            }
        });
        return Array.from(monthsWithData).sort((a, b) => a - b);
    }, [filtered]);

    // Daily records filtered by date
    const dailyRecords = useMemo(() => {
        let recs = records.filter(r => r.type === 'DAILY');
        if (dateF) recs = recs.filter(r => new Date(r.date).toISOString().slice(0, 10) === dateF);
        const q = search.toLowerCase().trim();
        if (q) recs = recs.filter(r => (r.teacherName || '').toLowerCase().includes(q));
        return recs.slice(0, 500);
    }, [records, dateF, search]);

    // Monthly records
    const monthlyRecords = useMemo(() => {
        let recs = records.filter(r => r.type === 'MONTHLY');
        if (monthF) {
            const [y, m] = monthF.split('-').map(Number);
            recs = recs.filter(r => r.month === m && r.year === y);
        }
        const q = search.toLowerCase().trim();
        if (q) recs = recs.filter(r => (r.teacherName || '').toLowerCase().includes(q));
        return recs.slice(0, 500);
    }, [records, monthF, search]);

    // Excel import with preview
    const [showImportPreview, setShowImportPreview] = useState(false);
    const [previewRows, setPreviewRows] = useState([]);
    const [parsedImportData, setParsedImportData] = useState([]);
    const [importing, setImporting] = useState(false);
    const [importType, setImportType] = useState('DAILY');

    const handleImport = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'binary' });
                const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                if (!raw.length) { showToast('error', 'Empty file', 'The Excel file has no data rows.'); return; }
                setPreviewRows(raw.slice(0, 10));
                setParsedImportData(raw);
                setImportType('DAILY');
                setShowImportPreview(true);
            } catch {
                showToast('error', 'Read Error', 'Failed to read Excel file.');
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    const confirmImport = async () => {
        setImporting(true);
        try {
            const rowsWithType = parsedImportData.map(r => ({ ...r, type: importType }));
            const res = await api.post('/admin/teacher-attendance/import', { rows: rowsWithType });
            showToast('success', 'Import complete', `${res.imported} imported, ${res.failed} failed out of ${res.total}`);
            if (res.errors?.length) console.warn('Import errors:', res.errors);
            fetchAll();
            setShowImportPreview(false);
        } catch (err) {
            showToast('error', 'Import failed', err.message);
        } finally {
            setImporting(false);
        }
    };

    // Export — data if present, template if empty
    const handleExport = () => {
        if (viewMode === 'summary') {
            if (filtered.length > 0) {
                const rows = filtered.map(t => {
                    const row = { 'Name': t.name, 'Department': t.dept };
                    MONTHS.forEach((m, i) => { row[m] = t.monthData[i + 1] != null ? t.monthData[i + 1].toFixed(1) + '%' : '—'; });
                    row['Average'] = t.avg != null ? t.avg.toFixed(1) + '%' : '—';
                    return row;
                });
                const ws = XLSX.utils.json_to_sheet(rows);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Summary');
                XLSX.writeFile(wb, `teacher_attendance_summary_${Date.now()}.xlsx`);
            } else {
                exportTemplate('MONTHLY');
            }
        } else if (viewMode === 'daily') {
            if (dailyRecords.length > 0) {
                const rows = dailyRecords.map(r => ({
                    'Name': r.teacherName, 'Department': r.departmentName,
                    'Date': new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                    'Status': r.status ? 'Present' : 'Absent'
                }));
                const ws = XLSX.utils.json_to_sheet(rows);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Daily Attendance');
                XLSX.writeFile(wb, `teacher_daily_attendance_${Date.now()}.xlsx`);
            } else {
                exportTemplate('DAILY');
            }
        } else {
            if (monthlyRecords.length > 0) {
                const rows = monthlyRecords.map(r => ({
                    'Name': r.teacherName, 'Department': r.departmentName,
                    'Month': r.month, 'Year': r.year,
                    'Attendance %': r.percentage != null ? r.percentage : (r.status ? '100' : '0')
                }));
                const ws = XLSX.utils.json_to_sheet(rows);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Monthly Attendance');
                XLSX.writeFile(wb, `teacher_monthly_attendance_${Date.now()}.xlsx`);
            } else {
                exportTemplate('MONTHLY');
            }
        }
    };

    const exportTemplate = (type) => {
        const wb = XLSX.utils.book_new();
        if (type === 'DAILY') {
            const demoRows = [
                { 'Name': 'Ankita Deshmukh', 'Date': '2026-03-01', 'Status': 'Present' },
                { 'Name': 'Yash Bakde', 'Date': '2026-03-01', 'Status': 'Absent' },
                { 'Name': 'Mayank Gaur', 'Date': '2026-03-02', 'Status': 'Present' },
            ];
            const ws = XLSX.utils.json_to_sheet(demoRows);
            XLSX.utils.book_append_sheet(wb, ws, 'Daily Template');
        } else {
            const demoRows = [
                { 'Name': 'Ankita Deshmukh', 'Month': 3, 'Year': 2026, 'Attendance %': '92.5' },
                { 'Name': 'Yash Bakde', 'Month': 3, 'Year': 2026, 'Attendance %': '85.0' },
                { 'Name': 'Mayank Gaur', 'Month': 3, 'Year': 2026, 'Attendance %': '97.0' },
            ];
            const ws = XLSX.utils.json_to_sheet(demoRows);
            XLSX.utils.book_append_sheet(wb, ws, 'Monthly Template');
        }
        XLSX.writeFile(wb, `teacher_attendance_template_${type.toLowerCase()}_${Date.now()}.xlsx`);
        showToast('info', 'Template Downloaded', `A demo ${type.toLowerCase()} template Excel has been downloaded. Fill it with your data and import.`);
    };

    const [viewMode, setViewMode] = useState('summary');
    const hasFilters = search || deptF || dateF || monthF;
    const clearFilters = () => { setSearch(''); setDeptF(''); setDateF(''); setMonthF(''); };

    const tabBtn = (mode, label) => (
        <button onClick={() => setViewMode(mode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${viewMode === mode ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {label}
        </button>
    );

    const totalCols = 3 + activeMonths.length + 1; // #, Name, Dept, active months, Avg

    return (
        <DashboardLayout title="Teacher Attendance" subtitle="Manage and track teacher attendance across all departments">
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            <div className="space-y-5">
                {/* Actions */}
                <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex gap-2">
                        {tabBtn('summary', 'Summary')}
                        {tabBtn('daily', 'Daily Records')}
                        {tabBtn('monthly', 'Monthly Records')}
                    </div>
                    <div className="flex gap-2">
                        <label className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-semibold hover:bg-emerald-100 cursor-pointer">
                            <Upload className="w-4 h-4" /> Import Excel
                            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" />
                        </label>
                        <button onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200">
                            <Download className="w-4 h-4" /> {
                                (viewMode === 'summary' && filtered.length === 0) ||
                                    (viewMode === 'daily' && dailyRecords.length === 0) ||
                                    (viewMode === 'monthly' && monthlyRecords.length === 0)
                                    ? 'Download Template' : 'Export'
                            }
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search teacher name…"
                                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <select value={deptF} onChange={e => setDeptF(e.target.value)}
                            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">All Departments</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        {viewMode === 'daily' && (
                            <input type="date" value={dateF} onChange={e => setDateF(e.target.value)}
                                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        )}
                        {viewMode === 'monthly' && (
                            <input type="month" value={monthF} onChange={e => setMonthF(e.target.value)}
                                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        )}
                        {hasFilters && (
                            <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200">
                                <X className="w-3.5 h-3.5" /> Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            {viewMode === 'summary' ? `${filtered.length} Teachers` : viewMode === 'daily' ? `${dailyRecords.length} Daily Records` : `${monthlyRecords.length} Monthly Records`}
                        </span>
                        <button onClick={fetchAll} className="text-gray-400 hover:text-gray-700 transition-colors">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        {viewMode === 'summary' ? (
                            /* ═══ SUMMARY TABLE: #, Name, Dept, Jan-Dec, Average ═══ */
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide sticky left-0 bg-gray-50 z-10">#</th>
                                        <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide sticky left-8 bg-gray-50 z-10 min-w-[140px]">Name</th>
                                        <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide min-w-[120px]">Department</th>
                                        {activeMonths.map(m => (
                                            <th key={m} className="px-2 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wide min-w-[60px]">{MONTHS[m - 1]}</th>
                                        ))}
                                        <th className="px-3 py-3 text-center text-xs font-bold text-indigo-600 uppercase tracking-wide min-w-[80px] bg-indigo-50/50">Attendance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? [1, 2, 3].map(i => (
                                        <tr key={i}><td colSpan={totalCols} className="px-4 py-3"><div className="h-6 bg-gray-100 rounded animate-pulse" /></td></tr>
                                    )) : filtered.map((t, i) => (
                                        <tr key={t.teacherId} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-3 py-3 text-xs text-gray-400 font-mono sticky left-0 bg-white">{i + 1}</td>
                                            <td className="px-3 py-3 sticky left-8 bg-white">
                                                <div className="flex items-center gap-2">
                                                    
                                                    <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">{t.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold whitespace-nowrap">
                                                    <Building2 className="w-3 h-3" /> {t.dept}
                                                </span>
                                            </td>
                                            {activeMonths.map(m => (
                                                <td key={m} className="px-2 py-3 text-center">
                                                    <AttendanceCell value={t.monthData[m]} />
                                                </td>
                                            ))}
                                            <td className="px-3 py-3 text-center bg-indigo-50/30">
                                                {t.avg != null ? (
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <span className={`text-sm font-black ${t.avg >= 75 ? 'text-emerald-600' : t.avg >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                                            {t.avg.toFixed(1)}%
                                                        </span>
                                                        <div className="w-12 bg-gray-200 rounded-full h-1.5">
                                                            <div className={`h-1.5 rounded-full ${t.avg >= 75 ? 'bg-emerald-500' : t.avg >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                                style={{ width: `${Math.min(t.avg, 100)}%` }} />
                                                        </div>
                                                    </div>
                                                ) : <span className="text-gray-300">—</span>}
                                            </td>
                                        </tr>
                                    ))}
                                    {!loading && filtered.length === 0 && (
                                        <tr><td colSpan={totalCols} className="text-center py-16 text-gray-400">
                                            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                            <p className="font-semibold text-sm">No attendance records found</p>
                                            <p className="text-xs mt-1">Import daily or monthly attendance from Excel.</p>
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>

                        ) : viewMode === 'daily' ? (
                            /* ═══ DAILY TABLE ═══ */
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {['#', 'Teacher', 'Department', 'Date', 'Status'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? [1, 2, 3].map(i => (
                                        <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-6 bg-gray-100 rounded animate-pulse" /></td></tr>
                                    )) : dailyRecords.map((r, i) => (
                                        <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-4 py-3 text-xs text-gray-400 font-mono">{i + 1}</td>
                                            <td className="px-4 py-3 font-semibold text-gray-900 text-sm">{r.teacherName}</td>
                                            <td className="px-4 py-3 text-xs text-gray-600">{r.departmentName}</td>
                                            <td className="px-4 py-3 text-xs text-gray-600">
                                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.status ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-xs font-bold">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Present
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 rounded-md text-xs font-bold">
                                                        <XCircle className="w-3.5 h-3.5" /> Absent
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {!loading && dailyRecords.length === 0 && (
                                        <tr><td colSpan={5} className="text-center py-16 text-gray-400">
                                            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                            <p className="font-semibold text-sm">No daily records found</p>
                                            <p className="text-xs mt-1">Click "Download Template" to get the daily import template.</p>
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>

                        ) : (
                            /* ═══ MONTHLY TABLE ═══ */
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {['#', 'Teacher', 'Department', 'Month', 'Year', 'Attendance %'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? [1, 2, 3].map(i => (
                                        <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-6 bg-gray-100 rounded animate-pulse" /></td></tr>
                                    )) : monthlyRecords.map((r, i) => {
                                        const pct = r.percentage != null ? parseFloat(r.percentage) : (r.status ? 100 : 0);
                                        return (
                                            <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="px-4 py-3 text-xs text-gray-400 font-mono">{i + 1}</td>
                                                <td className="px-4 py-3 font-semibold text-gray-900 text-sm">{r.teacherName}</td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold">
                                                        <Building2 className="w-3 h-3" /> {r.departmentName}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{MONTHS[r.month - 1] || r.month}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{r.year}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                                                            <div className={`h-2 rounded-full ${pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                                style={{ width: `${Math.min(pct, 100)}%` }} />
                                                        </div>
                                                        <span className={`text-sm font-bold ${pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                                            {pct.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {!loading && monthlyRecords.length === 0 && (
                                        <tr><td colSpan={6} className="text-center py-16 text-gray-400">
                                            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                            <p className="font-semibold text-sm">No monthly records found</p>
                                            <p className="text-xs mt-1">Click "Download Template" to get the monthly import template.</p>
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Import Preview Modal */}
                {showImportPreview && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 animate-fade-in max-h-[85vh] flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">Import Attendance</h3>
                                    <p className="text-xs text-gray-500">{parsedImportData.length} rows found. Showing first {previewRows.length}.</p>
                                </div>
                                <button onClick={() => setShowImportPreview(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                            </div>

                            {/* TYPE SELECTOR */}
                            <div className="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                                <p className="text-sm font-bold text-indigo-800 mb-2">What type of attendance is this?</p>
                                <div className="flex gap-3">
                                    <label className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${importType === 'DAILY' ? 'border-indigo-500 bg-indigo-100' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                                        <input type="radio" name="importType" value="DAILY" checked={importType === 'DAILY'} onChange={() => setImportType('DAILY')} className="accent-indigo-600" />
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">📅 Daily Attendance</p>
                                            <p className="text-xs text-gray-500">Stored in Daily tab, auto-summarized in Summary</p>
                                        </div>
                                    </label>
                                    <label className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${importType === 'MONTHLY' ? 'border-indigo-500 bg-indigo-100' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                                        <input type="radio" name="importType" value="MONTHLY" checked={importType === 'MONTHLY'} onChange={() => setImportType('MONTHLY')} className="accent-indigo-600" />
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">📊 Monthly Attendance</p>
                                            <p className="text-xs text-gray-500">Stored in Monthly tab & shown in Summary</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                                {importType === 'DAILY' ? (
                                    <>
                                        <p className="font-bold mb-1">Expected columns for Daily:</p>
                                        <p><strong>Teacher:</strong> Name, Teacher, Teacher Name, Full Name, Email</p>
                                        <p><strong>Date:</strong> Date or Attendance Date</p>
                                        <p><strong>Status:</strong> Status or Attendance (Present/Absent/P/A/Yes/No)</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-bold mb-1">Expected columns for Monthly:</p>
                                        <p><strong>Teacher:</strong> Name, Teacher, Teacher Name, Full Name, Email</p>
                                        <p><strong>Month:</strong> Month (1-12)</p>
                                        <p><strong>Year:</strong> Year (e.g. 2026)</p>
                                        <p><strong>Percentage:</strong> Attendance % (e.g. 92.5)</p>
                                    </>
                                )}
                            </div>

                            <div className="overflow-auto flex-1 border rounded-xl mb-4">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-gray-50 border-b">
                                            {Object.keys(previewRows[0] || {}).map(h => (
                                                <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {previewRows.map((r, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                {Object.values(r).map((v, j) => (
                                                    <td key={j} className="px-3 py-2 text-gray-700 whitespace-nowrap">{String(v)}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowImportPreview(false)}
                                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button onClick={confirmImport} disabled={importing}
                                    className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-emerald-700">
                                    {importing ? 'Importing…' : `Import as ${importType === 'DAILY' ? 'Daily' : 'Monthly'} (${parsedImportData.length} rows)`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
