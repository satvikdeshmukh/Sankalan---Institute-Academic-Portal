import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../lib/api.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import {
    GraduationCap, Search, X, User, Edit, Trash2,
    CheckCircle2, XCircle, Plus, Download, Upload,
    Filter, RefreshCw, Eye, Mail, ChevronDown, ChevronUp
} from 'lucide-react';
import * as XLSX from 'xlsx';

function Toast({ type, title, message, onClose }) {
    const colors = {
        success: 'bg-emerald-50 border-emerald-300 text-emerald-800',
        error: 'bg-red-50 border-red-300 text-red-800',
        info: 'bg-blue-50 border-blue-300 text-blue-800',
    };
    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium max-w-sm ${colors[type] || colors.info}`}>
            <div className="flex-1">
                <p className="font-bold">{title}</p>
                {message && <p className="text-xs opacity-80 mt-0.5">{message}</p>}
            </div>
            <button onClick={onClose} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
    );
}

const SECTIONS = ['A', 'B', 'C', 'D'];

export default function AdminStudents() {
    const [students, setStudents] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Filters
    const [search, setSearch]   = useState('');
    const [deptF, setDeptF]     = useState('');
    const [yearF, setYearF]     = useState('');
    const [secF, setSecF]       = useState('');

    // Edit/Add modal
    const [modal, setModal]     = useState(null); // { mode: 'add'|'edit', student? }
    const [form, setForm]       = useState({});
    const [saving, setSaving]   = useState(false);

    // Selection
    const [selected, setSelected] = useState(new Set());

    // Profile view
    const [profileId, setProfileId] = useState(null);

    const showToast = (type, title, message) => {
        setToast({ type, title, message });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [studs, depts] = await Promise.all([
                api.get('/students'),
                api.get('/auth/departments'),
            ]);

            const normalized = (Array.isArray(studs) ? studs : []).map(s => {
                const enr = (s.enrollments || []).sort((a, b) =>
                    (b.academicYear || '').localeCompare(a.academicYear || '')
                )[0];
                return {
                    ...s,
                    email: s.email || '',
                    year: enr?.year ?? s.year ?? null,
                    semester: enr?.semester ?? s.semester ?? null,
                    section: enr?.section ?? s.section ?? 'A',
                    academicYear: enr?.academicYear ?? null,
                    deptName: s.department?.name || '',
                };
            });

            setStudents(normalized);
            setDepartments(Array.isArray(depts) ? depts : []);
        } catch (err) {
            showToast('error', 'Load failed', err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Filtered list
    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return students.filter(s => {
            if (deptF && s.departmentId !== deptF) return false;
            if (yearF && String(s.year) !== yearF) return false;
            if (secF && s.section !== secF) return false;
            if (q) {
                const match = [s.fullName, s.studentId, s.email, s.deptName]
                    .map(v => (v || '').toLowerCase())
                    .some(v => v.includes(q));
                if (!match) return false;
            }
            return true;
        });
    }, [students, deptF, yearF, secF, search]);

    const clearFilters = () => { setSearch(''); setDeptF(''); setYearF(''); setSecF(''); };
    const hasFilters = search || deptF || yearF || secF;

    // Stats
    const stats = useMemo(() => {
        const bySec = {};
        filtered.forEach(s => { const sec = s.section || 'A'; bySec[sec] = (bySec[sec] || 0) + 1; });
        return { total: filtered.length, bySec };
    }, [filtered]);

    // Open add/edit modal
    const openAdd = () => {
        setForm({ studentId: '', fullName: '', email: '', year: '', semester: '', section: 'A', departmentId: departments[0]?.id || '' });
        setModal({ mode: 'add' });
    };
    const openEdit = (s) => {
        setForm({ studentId: s.studentId, fullName: s.fullName, email: s.email, year: String(s.year || ''), semester: String(s.semester || ''), section: s.section || 'A', departmentId: s.departmentId });
        setModal({ mode: 'edit', student: s });
    };

    const handleSave = async () => {
        if (!form.fullName || !form.departmentId) {
            showToast('error', 'Validation', 'Name and department are required');
            return;
        }
        setSaving(true);
        try {
            if (modal.mode === 'add') {
                await api.post('/students', {
                    fullName: form.fullName,
                    email: form.email || null,
                    studentId: form.studentId || undefined,
                    departmentId: form.departmentId,
                    year: form.year ? Number(form.year) : undefined,
                    semester: form.semester ? Number(form.semester) : undefined,
                    section: form.section || 'A',
                });
                showToast('success', 'Student added');
            } else {
                await api.patch(`/students/${modal.student.id}`, {
                    fullName: form.fullName,
                    email: form.email || null,
                    year: form.year ? Number(form.year) : undefined,
                    semester: form.semester ? Number(form.semester) : undefined,
                    section: form.section || 'A',
                });
                showToast('success', 'Student updated');
            }
            setModal(null);
            await fetchAll();
        } catch (err) {
            showToast('error', 'Save failed', err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this student? This cannot be undone.')) return;
        try {
            await api.delete(`/students/${id}`);
            showToast('success', 'Student deleted');
            await fetchAll();
        } catch (err) {
            showToast('error', 'Delete failed', err.message);
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selected.size} student(s)?`)) return;
        try {
            for (const id of selected) await api.delete(`/students/${id}`);
            setSelected(new Set());
            showToast('success', `Deleted ${selected.size} students`);
            await fetchAll();
        } catch (err) {
            showToast('error', 'Bulk delete failed', err.message);
        }
    };

    const exportCSV = () => {
        const rows = filtered.map(s => ({
            'Student ID': s.studentId,
            'Full Name': s.fullName,
            'Email': s.email || '',
            'Department': s.deptName,
            'Year': s.year || '',
            'Semester': s.semester || '',
            'Section': s.section || '',
            'Academic Year': s.academicYear || '',
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Students');
        XLSX.writeFile(wb, `students_${Date.now()}.xlsx`);
    };

    const toggleSelect = (id) => {
        setSelected(prev => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    };

    const toggleAll = () => {
        if (selected.size === filtered.length) setSelected(new Set());
        else setSelected(new Set(filtered.map(s => s.id)));
    };

    const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
    const lbl = 'text-xs font-semibold text-gray-600 block mb-1.5';

    return (
        <DashboardLayout title="Students" subtitle="Manage all student records across departments">
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            <div className="space-y-5">
                {/* Header actions */}
                <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                        
                    </div>
                    
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search name, roll no, email…"
                                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <select value={deptF} onChange={e => setDeptF(e.target.value)}
                            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">All Departments</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <select value={yearF} onChange={e => setYearF(e.target.value)}
                            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">All Years</option>
                            {[1,2,3,4].map(y => <option key={y} value={String(y)}>Year {y}</option>)}
                        </select>
                        <select value={secF} onChange={e => setSecF(e.target.value)}
                            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">All Sections</option>
                            {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                        </select>
                        {hasFilters && (
                            <button onClick={clearFilters}
                                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200">
                                <X className="w-3.5 h-3.5" /> Clear
                            </button>
                        )}
                        <div className="flex gap-2">
                        {selected.size > 0 && (
                            <button onClick={handleBulkDelete}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100">
                                <Trash2 className="w-4 h-4" /> Delete ({selected.size})
                            </button>
                        )}
                        <button onClick={exportCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200">
                            <Download className="w-4 h-4" /> Export
                        </button>
                        <button onClick={openAdd}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm">
                            <Plus className="w-4 h-4" /> Add Student
                        </button>
                    </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            {filtered.length} Student{filtered.length !== 1 ? 's' : ''} {hasFilters ? '(filtered)' : ''}
                        </span>
                        <button onClick={fetchAll} className="text-gray-400 hover:text-gray-700 transition-colors">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 w-10">
                                        <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                                            onChange={toggleAll} className="rounded border-gray-300 text-indigo-600" />
                                    </th>
                                    {['Roll No', 'Name', 'Email', 'Department', 'Year', 'Section', 'Actions'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? [1,2,3,4,5].map(i => (
                                    <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-6 bg-gray-100 rounded animate-pulse" /></td></tr>
                                )) : filtered.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-4 py-3">
                                            <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)}
                                                className="rounded border-gray-300 text-indigo-600" />
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-500">{s.studentId || '—'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                
                                                <span className="font-semibold text-gray-900 text-sm">{s.fullName || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">
                                            {s.email ? (
                                                <a href={`mailto:${s.email}`} onClick={e => e.stopPropagation()}
                                                    className="flex items-center gap-1 text-indigo-600 hover:underline">
                                                    <Mail className="w-3 h-3" />{s.email}
                                                </a>
                                            ) : <span className="text-gray-400">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600">{s.deptName || '—'}</td>
                                        <td className="px-4 py-3 text-xs text-center">
                                            {s.year ? (
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-semibold">
                                                    {s.year}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-bold">
                                                {s.section || 'A'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => openEdit(s)}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Edit">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(s.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="text-center py-16 text-gray-400">
                                            <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                            <p className="font-semibold text-sm">No students found</p>
                                            {hasFilters && <p className="text-xs mt-1">Try clearing your filters</p>}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900">{modal.mode === 'add' ? 'Add Student' : 'Edit Student'}</h3>
                            <button onClick={() => setModal(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={lbl}>Student ID</label>
                                    <input value={form.studentId} onChange={e => setForm(p => ({...p, studentId: e.target.value}))}
                                        placeholder="e.g. STU001" className={inp} />
                                </div>
                                <div>
                                    <label className={lbl}>Full Name *</label>
                                    <input value={form.fullName} onChange={e => setForm(p => ({...p, fullName: e.target.value}))}
                                        placeholder="Student full name" className={inp} />
                                </div>
                            </div>
                            <div>
                                <label className={lbl}>Email</label>
                                <input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))}
                                    placeholder="student@email.com" className={inp} />
                            </div>
                            <div>
                                <label className={lbl}>Department *</label>
                                <select value={form.departmentId} onChange={e => setForm(p => ({...p, departmentId: e.target.value}))} className={inp}>
                                    <option value="">Select department</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className={lbl}>Year</label>
                                    <select value={form.year} onChange={e => setForm(p => ({...p, year: e.target.value}))} className={inp}>
                                        <option value="">—</option>
                                        {[1,2,3,4].map(y => <option key={y} value={String(y)}>Year {y}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={lbl}>Semester</label>
                                    <select value={form.semester} onChange={e => setForm(p => ({...p, semester: e.target.value}))} className={inp}>
                                        <option value="">—</option>
                                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={String(s)}>Sem {s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={lbl}>Section</label>
                                    <select value={form.section} onChange={e => setForm(p => ({...p, section: e.target.value}))} className={inp}>
                                        {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setModal(null)}
                                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-300">
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
                                {saving ? 'Saving…' : modal.mode === 'add' ? 'Add Student' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}