import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../lib/api.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import {
    Users, Search, Plus, Upload, Download, Pencil, Trash2, X,
    ChevronDown, CheckCircle, AlertTriangle, Info, XCircle, GraduationCap,
    CheckSquare, Square, MinusSquare, Eye, Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import StudentProfileView from './StudentProfileView.jsx';

const YEAR_LABELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const YEAR_SEM = { 1: [1, 2], 2: [3, 4], 3: [5, 6], 4: [7, 8] };
const SECTIONS = ['ALL', 'A', 'B', 'C', 'D'];

const EMPTY_FORM = { studentId: '', fullName: '', email: '', year: '', semester: '', section: 'A' };
const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400';

const TOAST_ICONS = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info };
const TOAST_COLORS = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export default function TeacherStudents() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();

    const [students, setStudents] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedYear, setSelectedYear] = useState(searchParams.get('year') || 'ALL');
    const [selectedSem, setSelectedSem] = useState(searchParams.get('sem') || 'ALL');
    const [selectedSec, setSelectedSec] = useState(searchParams.get('sec') || 'ALL');
    const [search, setSearch] = useState('');
    const [profileStudentId, setProfileStudentId] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const [showImportPreview, setShowImportPreview] = useState(false);
    const [previewRows, setPreviewRows] = useState([]);
    const [parsedImportData, setParsedImportData] = useState([]);
    const [importing, setImporting] = useState(false);
    const fileRef = useRef();

    const [selectedIds, setSelectedIds] = useState(new Set());
    const [toast, setToast] = useState(null);

    const showToast = (type, title, message) => {
        setToast({ type, title, message });
        setTimeout(() => setToast(null), 3500);
    };

    /* ─── Fetch ──────────────────────────────── */
    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch with year/sem query params so server pre-filters
            const params = new URLSearchParams();

            if (selectedYear !== 'ALL') {
                params.append('year', selectedYear);
            }

            if (selectedSem !== 'ALL') {
                params.append('semester', selectedSem);
            }
            const data = await api.get(`/students?${params}`);
            // Normalize: flatten latest enrollment into top-level fields
            setStudents((data || []).map(s => {
                const latest = (s.enrollments || [])
                    .sort((a, b) => (b.academicYear || '').localeCompare(a.academicYear || ''))[0];
                return {
                    ...s,
                    email: s.email || '',
                    year: latest?.year ?? null,
                    semester: latest?.semester ?? null,
                    section: latest?.section ?? 'A',
                    academicYear: latest?.academicYear ?? null,
                };
            }));
        } catch (err) {
            showToast('error', 'Load Error', err.message);
        } finally {
            setLoading(false);
        }
    }, [selectedYear, selectedSem]);

    const fetchDepartments = useCallback(async () => {
        try {
            const data = await api.get('/auth/departments');
            setDepartments(data || []);
        } catch { }
    }, []);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);
    useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

    /* ─── Derive available sections from current list ─── */
    const availableSections = useMemo(() => {
        const secs = new Set(students.map(s => s.section).filter(Boolean));
        return ['ALL', ...Array.from(secs).sort()];
    }, [students]);

    /* ─── URL sync ──────────────────────────────── */
    useEffect(() => {
        const y = Number(searchParams.get('year'));
        const s = Number(searchParams.get('sem'));
        const sec = searchParams.get('sec');
        if (y >= 1 && y <= 4) { setSelectedYear(y); setSelectedSem(s >= 1 && s <= 8 ? s : YEAR_SEM[y][0]); }
        if (sec) setSelectedSec(sec);
    }, []);

    /* ─── Filter ──────────────────────────────── */
    const displayStudents = useMemo(() => {
        let list = students.filter(s => {
            if (selectedYear !== 'ALL') {
                if (s.year !== Number(selectedYear)) return false;
            }

            if (selectedSem !== 'ALL') {
                if (s.semester !== Number(selectedSem)) return false;
            }
            if (selectedSec !== 'ALL' && s.section !== selectedSec) return false;
            return true;
        });
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(s =>
                s.fullName?.toLowerCase().includes(q) ||
                s.studentId?.toLowerCase().includes(q) ||
                (s.email || '').toLowerCase().includes(q) ||
                s.department?.name?.toLowerCase().includes(q) ||
                (s.section || '').toLowerCase().includes(q)
            );
        }
        return list;
    }, [students, selectedYear, selectedSem, selectedSec, search]);

    const sectionCounts = useMemo(() => {
        const counts = { ALL: 0 };
        students.forEach(s => {
            if (s.year === selectedYear && s.semester === selectedSem) {
                counts.ALL = (counts.ALL || 0) + 1;
                counts[s.section || 'A'] = (counts[s.section || 'A'] || 0) + 1;
            }
        });
        return counts;
    }, [students, selectedYear, selectedSem]);

    const sems = YEAR_SEM[selectedYear] || [1, 2];

    /* ─── Navigation ──────────────────────────── */
    const handleYearChange = (y) => {
        const s = YEAR_SEM[y][0];
        setSelectedYear(y);
        setSelectedSem(s);
        setSelectedSec('ALL');
        setSearchParams({ year: y, sem: s, sec: 'ALL' }, { replace: true });
    };

    const handleSemChange = (s) => {
        setSelectedSem(s);
        setSelectedSec('ALL');
        setSearchParams({ year: selectedYear, sem: s, sec: 'ALL' }, { replace: true });
    };

    const handleSecChange = (sec) => {
        setSelectedSec(sec);
        setSearchParams({ year: selectedYear, sem: selectedSem, sec }, { replace: true });
    };

    /* ─── CRUD ──────────────────────────────── */
    const openAdd = () => {
        setEditingId(null);
        setForm({ ...EMPTY_FORM, year: String(selectedYear), semester: String(selectedSem), section: selectedSec !== 'ALL' ? selectedSec : 'A' });
        setShowModal(true);
    };

    const openEdit = (s) => {
        setEditingId(s.id);
        setForm({
            studentId: s.studentId || '',
            fullName: s.fullName || '',
            email: s.email || '',
            year: String(s.year || selectedYear),
            semester: String(s.semester || selectedSem),
            section: s.section || 'A',
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.fullName.trim()) return;
        setSaving(true);
        try {
            if (editingId) {
                await api.patch(`/students/${editingId}`, {
                    fullName: form.fullName.trim(),
                    email: form.email.trim() || null,
                });
            } else {
                // Determine department: use teacher's department (inferred server-side)
                // Pass section along with year/semester
                await api.post('/students', {
                    studentId: form.studentId.trim() || undefined,
                    fullName: form.fullName.trim(),
                    email: form.email.trim() || null,
                    departmentId: departments[0]?.id,
                    year: Number(form.year),
                    semester: Number(form.semester),
                    section: form.section,
                });
            }
            await fetchStudents();
            setShowModal(false);
            showToast('success', editingId ? 'Updated' : 'Created', `Student ${editingId ? 'updated' : 'added'}.`);
        } catch (err) {
            showToast('error', 'Error', err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this student? This action cannot be undone.')) return;
        try {
            await api.delete(`/students/${id}`);
            await fetchStudents();
            setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
            showToast('success', 'Deleted', 'Student removed.');
        } catch (err) {
            showToast('error', 'Error', err.message);
        }
    };

    /* ─── Multi-select ──────────────────────── */
    const toggleSelect = (id) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const toggleSelectAll = () => {
        if (selectedIds.size === displayStudents.length && displayStudents.length > 0) setSelectedIds(new Set());
        else setSelectedIds(new Set(displayStudents.map(s => s.id)));
    };
    const allSelected = displayStudents.length > 0 && selectedIds.size === displayStudents.length;
    const someSelected = selectedIds.size > 0 && selectedIds.size < displayStudents.length;

    const handleBulkDelete = async () => {
        const count = selectedIds.size;
        if (!window.confirm(`Delete ${count} student${count > 1 ? 's' : ''}?`)) return;
        try {
            for (const id of selectedIds) await api.delete(`/students/${id}`);
            setSelectedIds(new Set());
            await fetchStudents();
            showToast('success', 'Bulk Delete', `${count} student${count > 1 ? 's' : ''} removed.`);
        } catch (err) {
            showToast('error', 'Error', err.message);
            await fetchStudents();
        }
    };

    const handleBulkExport = () => {
        const rows = displayStudents.filter(s => selectedIds.has(s.id)).map(s => ({
            'Student ID': s.studentId || '',
            'Full Name': s.fullName,
            'Email': s.email || '',
            'Department': s.department?.name || '',
            'Year': s.year || '',
            'Semester': s.semester || '',
            'Section': s.section || 'A',
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Students');
        XLSX.writeFile(wb, `selected_students_${selectedIds.size}.xlsx`);
    };

    const handleExport = () => {
        const rows = displayStudents.map(s => ({
            'Student ID': s.studentId || '',
            'Full Name': s.fullName,
            'Email': s.email || '',
            'Department': s.department?.name || '',
            'Year': s.year || '',
            'Semester': s.semester || '',
            'Section': s.section || 'A',
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Students');
        XLSX.writeFile(wb, `students_y${selectedYear}_s${selectedSem}_sec${selectedSec}.xlsx`);
    };

    const confirmImport = async () => {
        if (!parsedImportData.length) return;
        setImporting(true);
        try {
            const data = parsedImportData.map(r => ({
                studentId: String(r['Student ID'] || r['studentId'] || '').trim(),
                fullName: String(r['Full Name'] || r['fullName'] || r['Name'] || '').trim(),
                email: String(r['Email'] || r['email'] || '').trim() || null,
                year: Number(r['Year'] || r['year'] || selectedYear),
                semester: Number(r['Semester'] || r['semester'] || selectedSem),
                section: String(r['Section'] || r['section'] || 'A').trim(),
            })).filter(r => r.fullName);

            await api.post('/students/bulk', { students: data });
            await fetchStudents();
            setShowImportPreview(false);
            showToast('success', 'Import Success', `Imported ${data.length} students.`);
        } catch (err) {
            showToast('error', 'Import Failed', err.message);
        } finally {
            setImporting(false);
        }
    };

    return (
        <DashboardLayout title="Students" subtitle="View and manage students by year, semester and section">
            {profileStudentId ? (
                <StudentProfileView studentId={profileStudentId} onBack={() => setProfileStudentId(null)} />
            ) : (
                <>
                    {/* Filters */}

                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-3 mb-6 bg-white border border-gray-200 rounded-xl p-3">

                            {/* Year */}
                            <select
                                value={selectedYear}
                                onChange={(e) => handleYearChange(e.target.value)}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            >
                                <option value="ALL">All Years</option>

                                {YEAR_LABELS.map((label, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {label}
                                    </option>
                                ))}
                            </select>

                            {/* Semester */}
                            <select
                                value={selectedSem}
                                onChange={(e) => handleSemChange(Number(e.target.value))}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            >
                                {sems.map((s) => (
                                    <option key={s} value={s}>
                                        Semester {s}
                                    </option>
                                ))}
                            </select>

                            {/* Section */}
                            <select
                                value={selectedSec}
                                onChange={(e) => handleSecChange(e.target.value)}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            >
                                {availableSections.map(sec => (
                                    <option key={sec} value={sec}>
                                        {sec === "ALL"
                                            ? `All Sections`
                                            : `Section ${sec} `}
                                    </option>
                                ))}
                            </select>

                            {/* Search */}
                            <div className="relative ml-auto w-[220px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search students..."
                                    className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                />
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                                    <Download className="w-4 h-4" /> Export
                                </button>



                            </div>

                        </div>

                        {/* Controls */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">


                            {/* Table */}
                            <div className="overflow-x-auto">
                                <div className="max-h-[500px] overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 z-20 bg-gray-50">
                                            <tr className="border-b border-gray-100">
                                                <th className="px-4 py-3 w-10">
                                                    <button onClick={toggleSelectAll} className="text-gray-400 hover:text-blue-600 transition-colors">
                                                        {allSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : someSelected ? <MinusSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4" />}
                                                    </button>
                                                </th>

                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student ID</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Full Name</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Section</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Year / Sem</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Profile</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {loading ? (
                                                <tr><td colSpan={10} className="py-16 text-center text-gray-400">
                                                    <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                                                    Loading…
                                                </td></tr>
                                            ) : displayStudents.length === 0 ? (
                                                <tr><td colSpan={10} className="py-16 text-center text-gray-400">
                                                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                                    <p>No students found for Year {selectedYear}, Semester {selectedSem}{selectedSec !== 'ALL' ? `, Section ${selectedSec}` : ''}</p>
                                                </td></tr>
                                            ) : displayStudents.map((s, i) => (
                                                <tr key={s.id} className={`transition-colors ${selectedIds.has(s.id) ? 'bg-blue-50/60' : 'hover:bg-blue-50/30'}`}>
                                                    <td className="px-4 py-3 w-10">
                                                        <button onClick={() => toggleSelect(s.id)} className="text-gray-400 hover:text-blue-600 transition-colors">
                                                            {selectedIds.has(s.id) ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                                                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{s.studentId || '—'}</td>
                                                    <td className="px-4 py-3 font-medium text-gray-900">{s.fullName}</td>
                                                    <td className="px-4 py-3 text-gray-500 text-xs">{s.email || '—'}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100">
                                                            {s.section || 'A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                                        Yr {s.year || '—'} / Sem {s.semester || '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button onClick={() => setProfileStudentId(s.id)}
                                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button onClick={() => openEdit(s)} className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50">
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {!loading && (
                                <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
                                    {displayStudents.length} student{displayStudents.length !== 1 ? 's' : ''}
                                    {selectedSec !== 'ALL' && <span className="ml-1 text-indigo-500">in Section {selectedSec}</span>}
                                    {selectedIds.size > 0 && <span className="ml-2 text-blue-600 font-medium">· {selectedIds.size} selected</span>}
                                </div>
                            )}

                            {/* Bulk Action Bar */}
                            {selectedIds.size > 0 && (
                                <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none" style={{ paddingLeft: '16rem' }}>
                                    <div className="flex items-center gap-3 px-5 py-3 bg-[#1a2b4b] text-white rounded-2xl shadow-2xl pointer-events-auto">
                                        <span className="text-sm font-medium">{selectedIds.size} selected</span>
                                        <div className="w-px h-5 bg-white/20" />
                                        <button onClick={handleBulkExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">
                                            <Download className="w-3.5 h-3.5" /> Export
                                        </button>
                                        <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/80 rounded-lg text-sm hover:bg-red-500 transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                        </button>
                                        <button onClick={() => setSelectedIds(new Set())} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">
                                            <X className="w-3.5 h-3.5" /> Clear
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ─── Add/Edit Modal ─── */}
                        {showModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                                    <div className="flex justify-between items-center mb-5">
                                        <h3 className="font-bold text-gray-900 text-lg">{editingId ? 'Edit Student' : 'Add Student'}</h3>
                                        <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 block mb-1">Student ID</label>
                                            <input value={form.studentId} onChange={e => setForm(p => ({ ...p, studentId: e.target.value }))} className={inputCls} placeholder="e.g., CS2024001" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 block mb-1">Full Name *</label>
                                            <input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} className={inputCls} placeholder="Enter full name" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 block mb-1">Email</label>
                                            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls} placeholder="student@example.com" />
                                        </div>
                                        {!editingId && (
                                            <>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-600 block mb-1">Year</label>
                                                        <select value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} className={inputCls}>
                                                            {[1, 2, 3, 4].map(y => <option key={y} value={y}>{YEAR_LABELS[y - 1]}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-600 block mb-1">Semester</label>
                                                        <select value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))} className={inputCls}>
                                                            {YEAR_SEM[Number(form.year) || 1].map(s => <option key={s} value={s}>Sem {s}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-600 block mb-1">Section</label>
                                                        <select value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))} className={inputCls}>
                                                            {['A', 'B', 'C', 'D'].map(sec => <option key={sec} value={sec}>Sec {sec}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        {editingId && (
                                            <div>
                                                <label className="text-xs font-semibold text-gray-600 block mb-1">Section</label>
                                                <select value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))} className={inputCls}>
                                                    {['A', 'B', 'C', 'D'].map(sec => <option key={sec} value={sec}>Sec {sec}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-3 mt-6">
                                        <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                                        <button onClick={handleSave} disabled={saving || !form.fullName.trim()} className="flex-1 py-2.5 bg-[#1a2b4b] text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-[#243557]">
                                            {saving ? 'Saving…' : (editingId ? 'Update' : 'Add Student')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── Import Preview ─── */}
                        {showImportPreview && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                                <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 max-h-[85vh] flex flex-col">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">Import Preview</h3>
                                            <p className="text-xs text-gray-500">{parsedImportData.length} rows · Showing first {previewRows.length}</p>
                                            <p className="text-xs text-blue-600 mt-0.5">Columns: Student ID, Full Name, Email, Year, Semester, Section</p>
                                        </div>
                                        <button onClick={() => setShowImportPreview(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                                    </div>
                                    <div className="overflow-auto flex-1 border rounded-xl mb-4">
                                        <table className="w-full text-xs">
                                            <thead><tr className="bg-gray-50 border-b">
                                                {Object.keys(previewRows[0] || {}).map(h => (
                                                    <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                                                ))}
                                            </tr></thead>
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
                                        <button onClick={() => setShowImportPreview(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                                        <button onClick={confirmImport} disabled={importing} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-green-700">
                                            {importing ? 'Importing…' : `Import ${parsedImportData.length} Students`}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── Toast ─── */}
                        {toast && (() => {
                            const Icon = TOAST_ICONS[toast.type] || Info;
                            return (
                                <div className={`fixed bottom-6 right-6 z-[100] flex items-start gap-3 px-5 py-4 rounded-xl border shadow-lg max-w-sm ${TOAST_COLORS[toast.type] || TOAST_COLORS.info}`}>
                                    <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-sm">{toast.title}</p>
                                        <p className="text-xs mt-0.5 opacity-80">{toast.message}</p>
                                    </div>
                                    <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
                                </div>
                            );
                        })()}
                    </>
                )}
        </DashboardLayout>
    );
}