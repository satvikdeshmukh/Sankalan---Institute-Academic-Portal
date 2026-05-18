import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { api } from '../../lib/api.js';
import StudentProfileView from './StudentProfileView.jsx';
import {
    Search, ChevronDown, ChevronRight, Eye,
    GraduationCap, Upload, X, FileSpreadsheet,
    CheckCircle, AlertTriangle, Info, TrendingUp,
    Calendar, BarChart3, Pencil, Trash2, Settings, Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine
} from 'recharts';

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_OPTIONS = MONTH_FULL.slice(1).map((label, i) => ({ value: i + 1, label }));

function isPresentVal(v) {
    const s = String(v || '').trim().toUpperCase();
    return s === 'P' || s === 'PRESENT' || s === 'TRUE' || s === '1';
}

function isAbsentVal(v) {
    const s = String(v || '').trim().toUpperCase();
    return s === 'A' || s === 'ABSENT' || s === 'FALSE' || s === '0';
}

/* ─────────── TOAST ─────────── */
function Toast({ toast, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const styles = {
        success: 'bg-emerald-50 border-emerald-400 text-emerald-800',
        error: 'bg-red-50 border-red-400 text-red-800',
        info: 'bg-blue-50 border-blue-400 text-blue-800',
    };
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
        error: <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />,
        info: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />,
    };

    return (
        <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg
            ${styles[toast.type]} animate-slide-in`}>
            {icons[toast.type]}
            <div className="flex-1">
                <p className="font-semibold text-sm">{toast.title}</p>
                {toast.message && <p className="text-xs mt-0.5 opacity-80">{toast.message}</p>}
            </div>
            <button onClick={onClose} className="opacity-50 hover:opacity-100">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

/* ─────────── ATTENDANCE BADGE ─────────── */
function AttBadge({ value }) {
    const n = Number(value) || 0;
    const color =
        n >= 75 ? 'bg-green-100 text-green-700'
            : n >= 50 ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700';
    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
            {n}%
        </span>
    );
}

/* ─────────── MINI LINE CHART ─────────── */
function AttendanceLineChart({ monthlyData }) {
    const chartData = useMemo(() => {
        if (!monthlyData || monthlyData.length === 0) return [];
        return [...monthlyData]
            .sort((a, b) => a.year - b.year || a.month - b.month)
            .map(m => ({
                label: `${MONTH_NAMES[m.month]} ${m.year}`,
                percentage: m.percentage
            }));
    }, [monthlyData]);

    if (chartData.length < 1) return null;

    return (
        <div className="bg-white rounded-xl border p-4 mt-3">
            <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Attendance Trend</h4>
            </div>
            <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={35} />
                    <Tooltip
                        contentStyle={{
                            borderRadius: '8px', fontSize: '12px',
                            border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        formatter={(val) => [`${val}%`, 'Attendance']}
                    />
                    <ReferenceLine y={75} stroke="#22c55e" strokeDasharray="4 4" label={{ value: '75%', position: 'right', fontSize: 10, fill: '#22c55e' }} />
                    <Line
                        type="monotone"
                        dataKey="percentage"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

/* ─────────── ATTENDANCE HEATMAP ─────────── */
function AttendanceHeatmap({ dailyData }) {
    if (!dailyData || dailyData.length === 0) return null;

    const months = {};
    dailyData.forEach(d => {
        const dt = new Date(d.date);
        const mKey = `${dt.getFullYear()}-${dt.getMonth() + 1}`;
        if (!months[mKey]) months[mKey] = { year: dt.getFullYear(), month: dt.getMonth() + 1, days: {} };
        months[mKey].days[dt.getDate()] = d.status;
    });

    const sortedMonths = Object.values(months).sort((a, b) => a.year - b.year || a.month - b.month);

    return (
        <div className="mt-4 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-emerald-500" />
                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Daily Session Heatmap</h4>
            </div>
            <div className="flex flex-wrap gap-8">
                {sortedMonths.map((m, idx) => {
                    const daysInMonth = new Date(m.year, m.month, 0).getDate();
                    const firstDay = new Date(m.year, m.month - 1, 1).getDay();
                    const monthName = MONTH_FULL[m.month];
                    return (
                        <div key={idx} className="min-w-[150px]">
                            <p className="text-[11px] font-bold text-gray-500 mb-2 truncate">{monthName} {m.year}</p>
                            <div className="grid grid-cols-7 gap-1.5">
                                {Array.from({ length: firstDay }).map((_, i) => <div key={`p-${i}`} className="w-3.5 h-3.5" />)}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const status = m.days[day];
                                    const isPresent = status === true;
                                    const isAbsent = status === false;
                                    const hasClass = status !== undefined;
                                    return (
                                        <div key={day} title={hasClass ? `${monthName} ${day}: ${isPresent ? 'Present' : 'Absent'}` : ''}
                                            className={`w-3.5 h-3.5 rounded-sm transition-all duration-300
                                                ${isPresent ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)] hover:scale-125' :
                                                    isAbsent ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)] hover:scale-125' :
                                                        'bg-gray-200/50'}`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-5 flex items-center gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Present</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Absent</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-gray-200" /> No Class</div>
            </div>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════
   SUBJECT ATTENDANCE CARD — with manage (edit/delete) per month
   ════════════════════════════════════════════════════════════════= */

function SubjectAttendanceCard({ sub, studentId, addToast, onRefresh }) {
    const [managing, setManaging] = useState(false);
    const [selectedMonths, setSelectedMonths] = useState(new Set()); // "month-year" keys
    const [editing, setEditing] = useState(false);
    const [editValues, setEditValues] = useState({}); // "month-year" -> percentage
    const [deleting, setDeleting] = useState(false);
    const [saving, setSaving] = useState(false);

    const sorted = useMemo(() => {
        return [...(sub.monthly || [])].sort((a, b) => a.year - b.year || a.month - b.month);
    }, [sub.monthly]);

    const toggleMonth = (m) => {
        const key = `${m.month}-${m.year}`;
        setSelectedMonths(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const selectAll = () => {
        if (selectedMonths.size === sorted.length) {
            setSelectedMonths(new Set());
        } else {
            setSelectedMonths(new Set(sorted.map(m => `${m.month}-${m.year}`)));
        }
    };

    const startEdit = () => {
        const vals = {};
        sorted.forEach(m => {
            const key = `${m.month}-${m.year}`;
            if (selectedMonths.has(key)) vals[key] = m.percentage;
        });
        setEditValues(vals);
        setEditing(true);
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            const records = Object.entries(editValues).map(([key, pct]) => {
                const [month, year] = key.split('-').map(Number);
                return { studentId, subjectOfferingId: sub.offeringId, month, year, percentage: pct };
            });
            await api.put('/subjects/attendance-monthly', { records });
            addToast('success', `Updated ${records.length} month(s)`);
            setEditing(false);
            setManaging(false);
            setSelectedMonths(new Set());
            onRefresh();
        } catch (err) {
            addToast('error', 'Update failed', err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setSaving(true);
        try {
            const records = [...selectedMonths].map(key => {
                const [month, year] = key.split('-').map(Number);
                return { studentId, subjectOfferingId: sub.offeringId, month, year };
            });
            await api.delete('/subjects/attendance-monthly', { records });
            addToast('success', `Deleted ${records.length} month(s)`);
            setDeleting(false);
            setManaging(false);
            setSelectedMonths(new Set());
            onRefresh();
        } catch (err) {
            addToast('error', 'Delete failed', err.message);
        } finally {
            setSaving(false);
        }
    };

    const cancelManage = () => {
        setManaging(false);
        setEditing(false);
        setDeleting(false);
        setSelectedMonths(new Set());
    };

    return (
        <div className="mb-5 last:mb-0">
            {/* Subject header + manage button */}
            <div className="flex items-center gap-3 mb-3">
                <h3 className="font-bold text-gray-700">{sub.subjectName}</h3>
                <AttBadge value={sub.aggregate} />
                {sub.subjectCode && <span className="text-xs text-gray-400">({sub.subjectCode})</span>}

                <div className="ml-auto flex items-center gap-2">
                    {!managing ? (
                        sub.monthly && sub.monthly.length > 0 && (
                            <button onClick={(e) => { e.stopPropagation(); setManaging(true); }}
                                className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-white border
                                    rounded-lg hover:bg-gray-50 hover:text-gray-700 transition flex items-center gap-1.5">
                                <Settings className="w-3.5 h-3.5" />
                                Manage
                            </button>
                        )
                    ) : (
                        <button onClick={(e) => { e.stopPropagation(); cancelManage(); }}
                            className="px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 border border-red-200
                                rounded-lg hover:bg-red-100 transition">
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {/* Month cards */}
            {sub.monthly && sub.monthly.length > 0 ? (
                <>
                    {/* Select All + Actions bar when managing */}
                    {managing && !editing && !deleting && (
                        <div className="flex items-center gap-3 mb-3">
                            <button onClick={selectAll}
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition">
                                {selectedMonths.size === sorted.length ? 'Deselect All' : 'Select All'}
                            </button>
                            <span className="text-xs text-gray-400">{selectedMonths.size} selected</span>
                            <div className="ml-auto flex gap-2">
                                <button onClick={startEdit}
                                    disabled={selectedMonths.size === 0}
                                    className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200
                                        rounded-lg hover:bg-amber-100 transition disabled:opacity-40 disabled:cursor-not-allowed
                                        flex items-center gap-1.5">
                                    <Pencil className="w-3.5 h-3.5" />
                                    Edit
                                </button>
                                <button onClick={() => setDeleting(true)}
                                    disabled={selectedMonths.size === 0}
                                    className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200
                                        rounded-lg hover:bg-red-100 transition disabled:opacity-40 disabled:cursor-not-allowed
                                        flex items-center gap-1.5">
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Delete confirmation */}
                    {deleting && (
                        <div className="mb-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-sm text-red-700 font-semibold mb-2">
                                Delete {selectedMonths.size} month(s) of attendance?
                            </p>
                            <p className="text-xs text-red-500 mb-3">
                                This will permanently remove the monthly records and any associated daily session data.
                            </p>
                            <div className="flex gap-2">
                                <button onClick={handleDelete} disabled={saving}
                                    className="px-4 py-2 text-xs font-bold text-white bg-red-600 rounded-lg
                                        hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-1.5">
                                    {saving ? 'Deleting...' : <><Trash2 className="w-3.5 h-3.5" /> Confirm Delete</>}
                                </button>
                                <button onClick={() => setDeleting(false)}
                                    className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-50">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Edit mode */}
                    {editing && (
                        <div className="mb-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <p className="text-sm text-amber-700 font-semibold mb-3">
                                Edit attendance for {Object.keys(editValues).length} month(s)
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
                                {Object.entries(editValues).map(([key, pct]) => {
                                    const [m, y] = key.split('-').map(Number);
                                    return (
                                        <div key={key} className="bg-white p-3 rounded-lg border">
                                            <div className="text-xs text-gray-500 mb-1.5 font-semibold">
                                                {MONTH_NAMES[m]} {y}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    min="0" max="100"
                                                    value={pct}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => {
                                                        const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                                        setEditValues(prev => ({ ...prev, [key]: val }));
                                                    }}
                                                    className="w-16 border border-gray-300 rounded px-2 py-1.5 text-sm text-center
                                                        focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                                                />
                                                <span className="text-xs text-gray-400">%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleSaveEdit} disabled={saving}
                                    className="px-4 py-2 text-xs font-bold text-white bg-amber-600 rounded-lg
                                        hover:bg-amber-700 transition disabled:opacity-50 flex items-center gap-1.5">
                                    {saving ? 'Saving...' : <><Check className="w-3.5 h-3.5" /> Save Changes</>}
                                </button>
                                <button onClick={() => setEditing(false)}
                                    className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-50">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Month cards grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {sorted.map((m, i) => {
                            const key = `${m.month}-${m.year}`;
                            const isSelected = selectedMonths.has(key);
                            return (
                                <div key={i}
                                    onClick={(e) => { if (managing && !editing && !deleting) { e.stopPropagation(); toggleMonth(m); } }}
                                    className={`bg-white p-3 rounded-lg border text-center transition
                                        ${managing && !editing && !deleting ? 'cursor-pointer hover:shadow-md' : 'hover:shadow-md'}
                                        ${isSelected ? 'ring-2 ring-indigo-400 border-indigo-400 bg-indigo-50' : ''}`}>
                                    {managing && !editing && !deleting && (
                                        <div className="flex justify-end mb-1">
                                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition
                                                ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'}`}>
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-400 mb-1">
                                        {MONTH_NAMES[m.month]} {m.year}
                                    </div>
                                    <AttBadge value={m.percentage} />
                                </div>
                            );
                        })}
                    </div>

                    {sub.daily && sub.daily.length > 0 && (
                        <AttendanceHeatmap dailyData={sub.daily} />
                    )}

                    {sub.monthly.length >= 2 && (
                        <AttendanceLineChart monthlyData={sub.monthly} />
                    )}
                </>
            ) : (
                <p className="text-xs text-gray-400">No attendance data yet</p>
            )}
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════
   IMPORT MODAL — Manual format selection
   ════════════════════════════════════════════════════════════════= */

function ImportModal({ offeringId, subjectName, onClose, onSuccess }) {
    // Step 1: choose format, Step 2: configure & upload
    const [importType, setImportType] = useState(null); // 'MONTHLY' or 'DAILY'
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const fileRef = useRef(null);

    // Reset file & preview when format changes
    useEffect(() => {
        setFile(null);
        setPreview([]);
        setError('');
    }, [importType]);

    // ── Parse file based on chosen format ──
    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        setFile(f);
        setError('');

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'array' });
                const sheet = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });

                if (rows.length < 2) {
                    setError('Excel file has no data rows');
                    setPreview([]);
                    return;
                }

                const headers = rows[0];
                const data = [];

                if (importType === 'MONTHLY') {
                    // ── Monthly: Student ID | Name | Percentage ──
                    for (let i = 1; i < rows.length; i++) {
                        const row = rows[i];
                        if (!row[0]) continue;
                        data.push({
                            studentId: String(row[0]).trim(),
                            name: String(row[1] || '').trim(),
                            percentage: Number(row[2]) || 0,
                        });
                    }
                } else if (importType === 'DAILY') {
                    // ── Daily: Student ID | Name | Day1 | Day2 | ... (P/A values) ──
                    // Columns 2+ are day columns (dates or day numbers)
                    const dayCols = [];
                    for (let j = 2; j < headers.length; j++) {
                        const h = headers[j];
                        if (h !== undefined && h !== null && h !== '') {
                            dayCols.push({ col: j, label: String(h) });
                        }
                    }

                    for (let i = 1; i < rows.length; i++) {
                        const row = rows[i];
                        if (!row[0]) continue;

                        let present = 0;
                        let total = 0;
                        const dayDetails = [];

                        for (const dc of dayCols) {
                            const val = row[dc.col];
                            if (val === undefined || val === null || val === '') continue;

                            total++;
                            const isP = isPresentVal(val);
                            if (isP) present++;

                            dayDetails.push({
                                day: dc.label,
                                status: isP ? 'P' : 'A'
                            });
                        }

                        const pct = total > 0 ? Math.round((present / total) * 100) : 0;

                        data.push({
                            studentId: String(row[0]).trim(),
                            name: String(row[1] || '').trim(),
                            present,
                            total,
                            percentage: pct,
                            dayDetails
                        });
                    }
                }

                setPreview(data);
            } catch {
                setError('Failed to parse Excel file');
                setPreview([]);
            }
        };
        reader.readAsArrayBuffer(f);
    };

    // ── Upload ──
    const handleImport = async () => {
        if (!file || !offeringId) return;
        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('offeringId', offeringId);
        formData.append('format', importType);
        formData.append('month', String(month));
        formData.append('year', String(year));

        try {
            const res = await api.upload('/subjects/import-attendance', formData);
            onSuccess(res);
        } catch (err) {
            setError(err.message || 'Import failed');
        } finally {
            setUploading(false);
        }
    };

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">

                {/* ── HEADER ── */}
                <div className="px-6 py-4 border-b bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FileSpreadsheet className="w-6 h-6" />
                            <div>
                                <h2 className="text-lg font-bold">Import Attendance</h2>
                                <p className="text-xs text-indigo-100">{subjectName}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ── BODY ── */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">

                    {/* STEP 1: Format Selection */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
                            Step 1 — Select File Type
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Monthly Option */}
                            <button
                                onClick={() => setImportType('MONTHLY')}
                                className={`p-4 rounded-xl border-2 text-left transition-all
                                    ${importType === 'MONTHLY'
                                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <BarChart3 className={`w-5 h-5 ${importType === 'MONTHLY' ? 'text-indigo-600' : 'text-gray-400'}`} />
                                    <span className={`font-bold text-sm ${importType === 'MONTHLY' ? 'text-indigo-700' : 'text-gray-700'}`}>
                                        Monthly Percentage
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Excel has: <strong>Student ID | Name | %</strong><br />
                                    Each row has the overall attendance % for one month.
                                </p>
                            </button>

                            {/* Daily Option */}
                            <button
                                onClick={() => setImportType('DAILY')}
                                className={`p-4 rounded-xl border-2 text-left transition-all
                                    ${importType === 'DAILY'
                                        ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                                        : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className={`w-5 h-5 ${importType === 'DAILY' ? 'text-amber-600' : 'text-gray-400'}`} />
                                    <span className={`font-bold text-sm ${importType === 'DAILY' ? 'text-amber-700' : 'text-gray-700'}`}>
                                        Daily / Session-wise
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Excel has: <strong>Student ID | Name | Date1 | Date2 | ...</strong><br />
                                    Each column is a day with <strong>P/A</strong> values. Calculates aggregate %.
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Only show the rest after format is chosen */}
                    {importType && (
                        <>
                            {/* STEP 2: Month & Year */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
                                    Step 2 — Select Month & Year
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Month</label>
                                        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                                                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                                            {MONTH_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Year</label>
                                        <select value={year} onChange={(e) => setYear(Number(e.target.value))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                                                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                                            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                </div>
                                {importType === 'DAILY' && (
                                    <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 mt-2">
                                        The attendance from this file will be stored for <strong>{MONTH_FULL[month]} {year}</strong>.
                                        All P/A values across all day-columns will be aggregated into one monthly %.
                                    </p>
                                )}
                            </div>

                            {/* STEP 3: File Upload */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
                                    Step 3 — Upload Excel File
                                </label>
                                <div
                                    onClick={() => fileRef.current?.click()}
                                    className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center
                                        cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition group"
                                >
                                    <Upload className="w-7 h-7 mx-auto text-gray-400 group-hover:text-indigo-500 transition" />
                                    <p className="mt-2 text-sm text-gray-500 group-hover:text-indigo-600">
                                        {file ? file.name : 'Click to select .xlsx or .xls file'}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {importType === 'MONTHLY'
                                            ? 'Format: Student ID | Name | Percentage'
                                            : 'Format: Student ID | Name | Day1 (P/A) | Day2 (P/A) | ...'
                                        }
                                    </p>
                                    <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={handleFileChange} />
                                </div>
                            </div>

                            {/* ERROR */}
                            {error && (
                                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            {/* PREVIEW TABLE */}
                            {preview.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-semibold text-gray-700">
                                            Preview ({preview.length} students) — {MONTH_FULL[month]} {year}
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold
                                            ${importType === 'MONTHLY' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {importType === 'MONTHLY' ? 'Monthly %' : 'Daily P/A'}
                                        </span>
                                    </div>
                                    <div className="border rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500">#</th>
                                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500">Student ID</th>
                                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500">Name</th>

                                                    {importType === 'DAILY' && (
                                                        <>
                                                            <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500">Present</th>
                                                            <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500">Total</th>
                                                        </>
                                                    )}
                                                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500">Attendance %</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {preview.map((row, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                                                        <td className="px-3 py-2 font-medium">{row.studentId}</td>
                                                        <td className="px-3 py-2">{row.name}</td>

                                                        {importType === 'DAILY' && (
                                                            <>
                                                                <td className="px-3 py-2 text-center font-medium text-green-600">{row.present}</td>
                                                                <td className="px-3 py-2 text-center text-gray-500">{row.total}</td>
                                                            </>
                                                        )}
                                                        <td className="px-3 py-2 text-center">
                                                            <AttBadge value={row.percentage} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ── FOOTER ── */}
                <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
                    <button onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-50 transition">
                        Cancel
                    </button>
                    <button onClick={handleImport}
                        disabled={!file || !preview.length || uploading || !importType}
                        className="px-5 py-2.5 text-sm font-bold text-white rounded-lg transition
                            bg-gradient-to-r from-indigo-500 to-purple-600
                            hover:from-indigo-600 hover:to-purple-700
                            disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                        {uploading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                Confirm Import ({preview.length} students)
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */

export default function TeacherManagedStudents() {

    const [data, setData] = useState({ offerings: [], students: [] });
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [expandedStudent, setExpandedStudent] = useState(null);
    const [profileStudentId, setProfileStudentId] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [filterTarget, setFilterTarget] = useState(null);
    const [search, setSearch] = useState('');
    const [showImportModal, setShowImportModal] = useState(false);
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((type, title, message = '') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, title, message }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const result = await api.get('/subjects/managed');
            setData(result || { offerings: [], students: [] });
        } catch (err) {
            console.error('[TeacherManagedStudents] fetch error:', err);
            setFetchError(err.message || 'Failed to load attendance data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredStudents = useMemo(() => {
        let list = data.students || [];

        if (filterTarget?.type === 'SUBJECT') {
            list = list.filter(s => s.subjects?.[filterTarget.id]);
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(s =>
                s.fullName?.toLowerCase().includes(q) ||
                s.studentId?.toLowerCase().includes(q)
                
            );
        }

        return list;
    }, [data.students, filterTarget, search]);

    const toggleExpand = (id) => {
        if (expandedStudent === id) {
            setExpandedStudent(null);
            setSelectedSubject(null);
        } else {
            setExpandedStudent(id);
            const student = data.students.find(s => s.id === id);
            let subs = Object.keys(student?.subjects || {});
            if (filterTarget?.type === 'SUBJECT') {
                subs = subs.filter(sid => sid === filterTarget.id);
            }
            setSelectedSubject(subs[0] || null);
        }
    };

    const handleImportSuccess = (res) => {
        setShowImportModal(false);

        const fmtLabel = res.format === 'DAILY' ? 'Daily P/A' : 'Monthly %';
        addToast(
            'success',
            `Imported ${res.records} records (${fmtLabel})`,
            res.skipped > 0 ? `${res.skipped} rows skipped` : ''
        );

        if (res.errors?.length) {
            addToast('info', 'Some rows had issues', res.errors.slice(0, 3).join('; '));
        }

        setLoading(true);
        fetchData();
    };

    const selectedOffering = filterTarget?.type === 'SUBJECT'
        ? data.offerings.find(o => o.id === filterTarget.id)
        : null;

    // Overall trend across all subjects
    const getOverallMonthlyTrend = (student) => {
        const monthMap = {};
        Object.values(student.subjects || {}).forEach(sub => {
            (sub.monthly || []).forEach(m => {
                const key = `${m.year}-${m.month}`;
                if (!monthMap[key]) {
                    monthMap[key] = { month: m.month, year: m.year, total: 0, count: 0 };
                }
                monthMap[key].total += m.percentage;
                monthMap[key].count += 1;
            });
        });
        return Object.values(monthMap)
            .map(m => ({ month: m.month, year: m.year, percentage: Math.round(m.total / m.count) }))
            .sort((a, b) => a.year - b.year || a.month - b.month);
    };

    return (
        <DashboardLayout title="Student Attendance" subtitle="Track attendance and marks for your assigned students">

                {/* STUDENT PROFILE VIEW */}
                {profileStudentId ? (
                    <StudentProfileView studentId={profileStudentId} onBack={() => setProfileStudentId(null)} />
                ) : (
                    <>

                        {/* TOAST CONTAINER */}
                        <div className="fixed top-4 right-4 z-[100] space-y-2 w-96">
                            {toasts.map(t => (
                                <Toast key={t.id} toast={t} onClose={() => removeToast(t.id)} />
                            ))}
                        </div>

                        {/* HEADER */}
                       

                        {/* SUBJECT FILTER PILLS */}
                        <div className="flex gap-2 mb-6 flex-wrap">
                            <button
                                onClick={() => setFilterTarget(null)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition
                        ${!filterTarget ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white hover:bg-gray-50'}`}
                            >
                                All
                            </button>
                            {data.offerings.map(o => (
                                <button
                                    key={o.id}
                                    onClick={() => setFilterTarget({ type: 'SUBJECT', id: o.id })}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition
                            ${filterTarget?.id === o.id
                                            ? 'bg-gradient-to-br from-emerald-800 to-emerald-500 text-white border-indigo-600'
                                            : 'bg-white hover:bg-gradient-to-br from-emerald-50 to-emerald-100'}`}
                                >
                                    {o.subjectName} ({o.section})
                                </button>
                            ))}
                        </div>

                        {/* SEARCH */}
                        <div className="mb-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="mb-4 relative max-w-md  ">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm
                            focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                            
                        </div>
                        <button
                                onClick={() => setShowImportModal(true)}
                                disabled={filterTarget?.type !== 'SUBJECT'}
                                className={`px-5 py-2.5 text-xs font-bold rounded-lg transition flex items-center gap-2
                        ${filterTarget?.type === 'SUBJECT'
                                        ? 'bg-gradient-to-br from-emerald-800 to-emerald-500 text-white hover:bg-gradient-to-br from-emerald-500 hover:to-emerald-300 shadow-md hover:shadow-lg'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                            >
                                <Upload className="w-4 h-4" />
                                Import Attendance
                            </button>
                        </div>

                        {/* STUDENT TABLE */}
                        <div className="bg-white rounded-xl border shadow">
                            <div className="max-h-[500px] overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b sticky top-0 z-10">
                                    <tr>
                                        <th className="w-12 px-4 py-3" />
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                                        
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Student ID</th>
                                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                                            {filterTarget?.type === 'SUBJECT' ? 'Attendance %' : 'Overall %'}
                                        </th>
                                        <th className="w-14 px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Profile</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr><td colSpan={5} className="p-10 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                                <span>Loading enrolled students...</span>
                                            </div>
                                        </td></tr>
                                    ) : fetchError ? (
                                        <tr><td colSpan={5} className="p-10 text-center">
                                            <div className="flex flex-col items-center gap-2 text-red-500">
                                                <AlertTriangle className="w-6 h-6" />
                                                <span className="font-semibold text-sm">Failed to load students</span>
                                                <span className="text-xs text-gray-500">{fetchError}</span>
                                                <button onClick={fetchData} className="mt-2 px-4 py-2 text-xs font-semibold bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition">
                                                    Retry
                                                </button>
                                            </div>
                                        </td></tr>
                                    ) : filteredStudents.length === 0 ? (
                                        <tr><td colSpan={5} className="p-10 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-400">
                                                <GraduationCap className="w-8 h-8 opacity-40" />
                                                {data.offerings.length === 0 ? (
                                                    <>
                                                        <p className="text-sm font-semibold text-gray-500">No subjects assigned</p>
                                                        <p className="text-xs text-gray-400">Ask your HOD or Admin to assign you to a subject offering.</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="text-sm font-semibold text-gray-500">No enrolled students</p>
                                                        <p className="text-xs text-gray-400">
                                                            {filterTarget?.type === 'SUBJECT'
                                                                ? 'No students are enrolled in this subject offering yet.'
                                                                : 'No students are enrolled in any of your subject offerings yet.'}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </td></tr>
                                    ) : filteredStudents.map(s => {

                                        const isExpanded = expandedStudent === s.id;
                                        let subsArr = Object.values(s.subjects || {});
                                        if (filterTarget?.type === 'SUBJECT') {
                                            subsArr = subsArr.filter(sub => sub.offeringId === filterTarget.id);
                                        }

                                        // Subject-specific or overall aggregate
                                        const displayPct = filterTarget?.type === 'SUBJECT'
                                            ? (subsArr[0]?.aggregate || 0)
                                            : s.overallAggregate;

                                        return (
                                            <React.Fragment key={s.id}>
                                                <tr onClick={() => toggleExpand(s.id)}
                                                    className="cursor-pointer hover:bg-gray-50 transition">
                                                    <td className="px-4 py-3 text-gray-400">
                                                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold text-gray-800">{s.fullName}</td>
                                                    
                                                    <td className="px-4 py-3 text-gray-500">{s.studentId}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <AttBadge value={displayPct} />
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setProfileStudentId(s.id); }}
                                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                            title="View Profile"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>

                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={5} className="bg-gray-50/70 px-6 py-5">

                                                            {subsArr.length === 0 ? (
                                                                <p className="text-sm text-gray-400 text-center">No subjects enrolled</p>
                                                            ) : (
                                                                <>
                                                                    {subsArr.map(sub => (
                                                                        <SubjectAttendanceCard
                                                                            key={sub.offeringId}
                                                                            sub={sub}
                                                                            studentId={s.id}
                                                                            addToast={addToast}
                                                                            onRefresh={() => { fetchData(); }}
                                                                        />
                                                                    ))}

                                                                    {/* Overall trend across subjects */}
                                                                    {subsArr.length > 1 && (() => {
                                                                        const overallTrend = getOverallMonthlyTrend(s);
                                                                        if (overallTrend.length < 2) return null;
                                                                        return (
                                                                            <div className="mt-4 pt-4 border-t">
                                                                                <h4 className="text-sm font-bold text-gray-600 mb-1">Overall Trend (all subjects avg)</h4>
                                                                                <AttendanceLineChart monthlyData={overallTrend} />
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </>
                                                            )}

                                                        </td>
                                                    </tr>
                                                )}

                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                            </div>
                        </div>

                    </>)}
            {/* IMPORT MODAL */}
            {showImportModal && selectedOffering && (
                <ImportModal
                    offeringId={selectedOffering.id}
                    subjectName={`${selectedOffering.subjectName} (${selectedOffering.section})`}
                    onClose={() => setShowImportModal(false)}
                    onSuccess={handleImportSuccess}
                />
            )}

            {/* CSS ANIMATION */}
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in {
                    animation: slideIn 0.3s ease-out;
                }
            `}</style>
        </DashboardLayout>
    );
}