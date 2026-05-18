import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../lib/api.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import {
    FileText, Search, Upload, Download, Pencil, X, Save, Trash2,
    CheckCircle, AlertTriangle, Info, XCircle, BookOpen, Plus, Check, Settings
} from 'lucide-react';
import * as XLSX from 'xlsx';

const HERO_GRAD = 'linear-gradient(135deg, rgb(120,53,15) 0%, rgb(180,83,9) 40%, rgb(217,119,6) 75%, rgb(251,191,36) 100%)';
const EXAM_PRESETS = ['Mid-Sem 1', 'Mid-Sem 2', 'End-Sem', 'Assignment', 'Lab Internal', 'Lab External'];
const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400';

/* ── Toast Component ──────────────────────────── */
const TOAST_ICONS = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info };
const TOAST_COLORS = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
};

export default function TeacherMarks() {
    const { user } = useAuth();

    // Data
    const [offerings, setOfferings] = useState([]);
    const [selectedOffering, setSelectedOffering] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Inline edit
    const [editingMark, setEditingMark] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [saving, setSaving] = useState(false);

    // Column rename
    const [renamingCol, setRenamingCol] = useState(null);
    const [renameValue, setRenameValue] = useState('');

    // Delete selection
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [confirmDelete, setConfirmDelete] = useState(false);

    // Import
    const [showImportModal, setShowImportModal] = useState(false);
    const [importExamType, setImportExamType] = useState('');
    const [customExamType, setCustomExamType] = useState('');
    const [previewRows, setPreviewRows] = useState([]);
    const [parsedImportData, setParsedImportData] = useState([]);
    const [importing, setImporting] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const fileRef = useRef();

    // Toast
    const [toasts, setToasts] = useState([]);
    const addToast = (type, title, message = '') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, title, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await api.get('/marks/teacher');
            setOfferings(data || []);
            if (data?.length > 0 && !selectedOffering) {
                setSelectedOffering(data[0].id);
            }
        } catch (err) {
            console.error('Failed to load marks:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Current offering data
    const currentOffering = useMemo(() =>
        offerings.find(o => o.id === selectedOffering),
        [offerings, selectedOffering]
    );

    // Build marks table: group by student then by exam type
    const marksData = useMemo(() => {
        if (!currentOffering?.marks) return { students: [], examTypes: [] };

        const examTypes = [...new Set(currentOffering.marks.map(m => m.examType))].sort();
        const studentMap = {};

        for (const mark of currentOffering.marks) {
            if (!studentMap[mark.studentId]) {
                studentMap[mark.studentId] = {
                    id: mark.studentId,
                    studentId: mark.student?.studentId || '',
                    fullName: mark.student?.fullName || '',
                    department: mark.student?.department?.name || '',
                    marks: {}
                };
            }
            studentMap[mark.studentId].marks[mark.examType] = {
                id: mark.id,
                value: mark.marks
            };
        }

        let students = Object.values(studentMap);
        if (search.trim()) {
            const q = search.toLowerCase();
            students = students.filter(s =>
                s.fullName?.toLowerCase().includes(q) ||
                s.studentId?.toLowerCase().includes(q)
            );
        }

        return { students, examTypes };
    }, [currentOffering, search]);

    // Save inline edit
    const handleSaveEdit = async () => {
        if (!editingMark) return;
        setSaving(true);
        try {
            await api.post('/marks', {
                studentId: editingMark.studentId,
                subjectOfferingId: selectedOffering,
                examType: editingMark.examType,
                marks: Number(editValue) || 0
            });
            await fetchData();
            setEditingMark(null);
            addToast('success', 'Saved', 'Mark updated.');
        } catch (err) {
            addToast('error', 'Error', err.message);
        } finally {
            setSaving(false);
        }
    };

    // Rename exam type column
    const handleRenameColumn = async () => {
        if (!renamingCol || !renameValue.trim() || renameValue === renamingCol) {
            setRenamingCol(null);
            return;
        }
        setSaving(true);
        try {
            await api.put('/marks/rename-exam', {
                subjectOfferingId: selectedOffering,
                oldName: renamingCol,
                newName: renameValue.trim()
            });
            await fetchData();
            setRenamingCol(null);
            addToast('success', 'Renamed', `Column "${renamingCol}" → "${renameValue.trim()}"`);
        } catch (err) {
            addToast('error', 'Error', err.message);
        } finally {
            setSaving(false);
        }
    };

    // Delete selected students' marks
    const handleDeleteSelected = async () => {
        setSaving(true);
        try {
            const ids = [];
            for (const studentId of selectedRows) {
                const student = marksData.students.find(s => s.id === studentId);
                if (!student) continue;
                for (const mkData of Object.values(student.marks)) {
                    if (mkData?.id) ids.push(mkData.id);
                }
            }
            if (ids.length === 0) { addToast('warning', 'No marks', 'Selected students have no marks to delete.'); return; }

            await api.post('/marks/bulk-delete', { ids });
            await fetchData();
            setSelectedRows(new Set());
            setConfirmDelete(false);
            addToast('success', 'Deleted', `${ids.length} mark(s) removed.`);
        } catch (err) {
            addToast('error', 'Error', err.message);
        } finally {
            setSaving(false);
        }
    };

    // Export
    const handleExport = () => {
        if (!currentOffering) return;
        const rows = marksData.students.map(s => {
            const row = { 'Student ID': s.studentId, 'Name': s.fullName };
            let total = 0;
            for (const et of marksData.examTypes) {
                const val = s.marks[et]?.value ?? '';
                row[et] = val;
                total += Number(val) || 0;
            }
            row['Total'] = total;
            return row;
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Marks');
        XLSX.writeFile(wb, `marks_${currentOffering.subject?.name || 'subject'}.xlsx`);
    };

    // Import — file picked
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const wb = XLSX.read(ev.target.result, { type: 'binary' });
                const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: false, defval: '' });
                if (!raw.length) { addToast('warning', 'Empty File', 'Excel file is empty.'); return; }
                setPreviewRows(raw.slice(0, 10));
                setParsedImportData(raw);
            } catch {
                addToast('error', 'Read Error', 'Failed to read Excel file.');
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    const confirmImport = async () => {
        if (!selectedOffering) return;
        const examType = importExamType === '__custom__' ? customExamType.trim() : importExamType;
        if (!examType) { addToast('warning', 'Missing', 'Select or enter an exam type.'); return; }

        setImporting(true);
        try {
            // Step 1: Fetch ONLY students enrolled in this specific offering.
            // This is the single source of truth — students not in this list are never imported.
            const enrolledStudents = await api.get(`/subjects/offerings/${selectedOffering}/students`);
            if (!Array.isArray(enrolledStudents) || enrolledStudents.length === 0) {
                addToast('warning', 'No Enrolled Students', 'No students are enrolled in this subject offering. Enroll students first before importing marks.');
                setImporting(false);
                return;
            }

            // Step 2: Build lookup maps from ENROLLED students only.
            // s.id = DB UUID, s.studentId = college roll number, s.fullName = display name
            const studentByCode = {};
            const studentByName = {};
            for (const s of enrolledStudents) {
                if (s.studentId) studentByCode[s.studentId.toLowerCase()] = s.id;
                if (s.fullName)  studentByName[s.fullName.toLowerCase()]  = s.id;
            }

            // Step 3: Match Excel rows against enrolled-only lookups.
            // Any row whose student is not enrolled is automatically skipped.
            const headers = Object.keys(parsedImportData[0] || {});
            const NON_MARK_COLS = new Set(['student id', 'studentid', 'student_id', 'name', 'fullname', 'full name', 'department']);
            const markHeaders = headers.filter(h => !NON_MARK_COLS.has(h.toLowerCase()));

            const rows = [];
            let skippedCount = 0;
            for (const r of parsedImportData) {
                // Normalize keys for case-insensitive matching
                const rowLower = {};
                for (const [k, v] of Object.entries(r)) rowLower[k.toLowerCase().trim()] = v;

                const sid  = String(rowLower['studentid'] || rowLower['student_id'] || rowLower['student id'] || rowLower['roll no'] || rowLower['rollno'] || '').trim();
                const name = String(rowLower['fullname'] || rowLower['full name'] || rowLower['name'] || '').trim();

                // Look up only in enrolled-students maps — unmatched = not enrolled, skip
                const studentDbId = studentByCode[sid.toLowerCase()] || studentByName[name.toLowerCase()];
                if (!studentDbId) { skippedCount++; continue; }

                if (markHeaders.length === 1) {
                    // Single marks column → use the exam type chosen in the modal
                    const val = r[markHeaders[0]];
                    if (val !== undefined && val !== '' && val !== null) {
                        rows.push({ studentId: studentDbId, subjectOfferingId: selectedOffering, examType, marks: Number(val) || 0 });
                    }
                } else {
                    // Multiple mark columns → each column header is an exam type
                    for (const col of markHeaders) {
                        const val = r[col];
                        if (val !== undefined && val !== '' && val !== null) {
                            rows.push({ studentId: studentDbId, subjectOfferingId: selectedOffering, examType: col, marks: Number(val) || 0 });
                        }
                    }
                }
            }

            if (rows.length === 0) {
                addToast('warning', 'No Matches',
                    skippedCount > 0
                        ? `${skippedCount} row(s) skipped — none matched enrolled students in this subject.`
                        : 'No valid student rows found in the file.');
                setImporting(false);
                return;
            }

            const result = await api.post('/marks/bulk', { rows });
            await fetchData();
            setShowImportModal(false);
            resetImportState();
            const skipMsg = skippedCount > 0 ? ` (${skippedCount} skipped — not enrolled)` : '';
            addToast('success', 'Import Done', `${result.inserted} added, ${result.updated} updated${skipMsg}.`);
        } catch (err) {
            addToast('error', 'Import Failed', err.message);
        } finally {
            setImporting(false);
        }
    };
    const resetImportState = () => {
        setImportFile(null);
        setPreviewRows([]);
        setParsedImportData([]);
        setImportExamType('');
        setCustomExamType('');
    };

    // Toggle selection
    const toggleRow = (id) => {
        setSelectedRows(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };
    const toggleAll = () => {
        if (selectedRows.size === marksData.students.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(marksData.students.map(s => s.id)));
    };

    return (
        <DashboardLayout title="Student Marks" subtitle="View, import, edit and manage marks for your subjects">
            {/* Subject Offering Selector */}

                {/* Subject Offering Selector */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {offerings.map(o => (
                        <button
                            key={o.id}
                            onClick={() => { setSelectedOffering(o.id); setSelectedRows(new Set()); }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedOffering === o.id
                                ? 'bg-gradient-to-br from-emerald-800 to-emerald-500 text-white shadow-md'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300' 
                                }` }  
                        >
                            <BookOpen className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
                            {o.subject?.name || 'Subject'} {o.section ? `(${o.section})` : ''} — Y{o.year} S{o.semester}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-3 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                    </div>
                ) : offerings.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center text-gray-400">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-lg font-medium text-gray-500">No subject offerings assigned</p>
                        <p className="text-sm mt-1">Contact your HOD to assign subjects.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                        {/* Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-100">
                            <div className="relative flex-1 min-w-[200px] max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search students..." className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                            </div>
                            <div className="flex gap-2">
                                {selectedRows.size > 0 && (
                                    <button onClick={() => setConfirmDelete(true)}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-100 transition">
                                        <Trash2 className="w-4 h-4" /> Delete ({selectedRows.size})
                                    </button>
                                )}
                                <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                                    <Download className="w-4 h-4" /> Export
                                </button>
                                <button onClick={() => { resetImportState(); setShowImportModal(true); }}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-br from-emerald-800 to-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
                                    <Upload className="w-4 h-4" /> Import
                                </button>
                            </div>
                        </div>

                        {/* Marks Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="w-10 px-3 py-3">
                                            <input type="checkbox"
                                                checked={marksData.students.length > 0 && selectedRows.size === marksData.students.length}
                                                onChange={toggleAll}
                                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">College ID</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                                        {marksData.examTypes.map(et => (
                                            <th key={et} className="px-4 py-3 text-center text-xs font-semibold text-indigo-600 uppercase tracking-wider whitespace-nowrap">
                                                {renamingCol === et ? (
                                                    <div className="flex items-center gap-1 justify-center">
                                                        <input
                                                            type="text" value={renameValue}
                                                            onChange={e => setRenameValue(e.target.value)}
                                                            onKeyDown={e => { if (e.key === 'Enter') handleRenameColumn(); if (e.key === 'Escape') setRenamingCol(null); }}
                                                            className="w-24 px-1.5 py-0.5 border border-indigo-300 rounded text-xs text-center focus:outline-none"
                                                            autoFocus
                                                        />
                                                        <button onClick={handleRenameColumn} className="text-green-600 hover:text-green-800"><Check className="w-3.5 h-3.5" /></button>
                                                        <button onClick={() => setRenamingCol(null)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => { setRenamingCol(et); setRenameValue(et); }}
                                                        className="group inline-flex items-center gap-1 hover:text-indigo-800">
                                                        {et}
                                                        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </button>
                                                )}
                                            </th>
                                        ))}
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Marks</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">%</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {marksData.students.length === 0 ? (
                                        <tr><td colSpan={6 + marksData.examTypes.length} className="py-16 text-center text-gray-400">
                                            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                            <p>No marks recorded for this subject yet.</p>
                                            <p className="text-xs mt-1">Import marks from Excel or add them individually.</p>
                                        </td></tr>
                                    ) : marksData.students.map((s, i) => {
                                        const total = marksData.examTypes.reduce((sum, et) => sum + (s.marks[et]?.value || 0), 0);
                                        const maxPossible = marksData.examTypes.length * 100;
                                        const pct = maxPossible > 0 ? Math.round((total / maxPossible) * 100) : 0;
                                        const isSelected = selectedRows.has(s.id);

                                        return (
                                            <tr key={s.id} className={`transition-colors ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-gray-50/50'}`}>
                                                <td className="px-3 py-3">
                                                    <input type="checkbox" checked={isSelected} onChange={() => toggleRow(s.id)}
                                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                </td>
                                                <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                                                <td className="px-4 py-3 font-mono text-xs text-gray-600">{s.studentId || '—'}</td>
                                                <td className="px-4 py-3 font-medium text-gray-900">{s.fullName}</td>
                                                {marksData.examTypes.map(et => {
                                                    const isEditing = editingMark?.studentId === s.id && editingMark?.examType === et;
                                                    const val = s.marks[et]?.value;
                                                    return (
                                                        <td key={et} className="px-4 py-3 text-center">
                                                            {isEditing ? (
                                                                <div className="flex items-center gap-1 justify-center">
                                                                    <input
                                                                        type="number" value={editValue}
                                                                        onChange={e => setEditValue(e.target.value)}
                                                                        onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingMark(null); }}
                                                                        className="w-16 px-2 py-1 border border-indigo-300 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                                                        autoFocus
                                                                    />
                                                                    <button onClick={handleSaveEdit} disabled={saving} className="text-green-600 hover:text-green-800 p-0.5"><Save className="w-3.5 h-3.5" /></button>
                                                                    <button onClick={() => setEditingMark(null)} className="text-gray-400 hover:text-gray-600 p-0.5"><X className="w-3.5 h-3.5" /></button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => { setEditingMark({ studentId: s.id, examType: et }); setEditValue(String(val ?? '')); }}
                                                                    className="group inline-flex items-center gap-1 text-gray-700 hover:text-indigo-600"
                                                                >
                                                                    <span className="font-medium">{val ?? '—'}</span>
                                                                    <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                </button>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-4 py-3 text-center font-bold text-gray-800">{total}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${pct >= 75 ? 'bg-green-100 text-green-700'
                                                        : pct >= 50 ? 'bg-amber-100 text-amber-700'
                                                            : pct >= 33 ? 'bg-orange-100 text-orange-700'
                                                                : 'bg-red-100 text-red-700'}`}>
                                                        {pct}%
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {marksData.students.length > 0 && (
                            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
                                <span>{marksData.students.length} student{marksData.students.length !== 1 ? 's' : ''} · {marksData.examTypes.length} exam type{marksData.examTypes.length !== 1 ? 's' : ''}</span>
                                <span className="text-gray-500">💡 Click column name to rename · Click mark to edit</span>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Delete Confirmation ─── */}
                {confirmDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
                            <h3 className="font-bold text-gray-900 text-lg mb-2">Delete Marks</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Are you sure you want to delete all marks for <strong>{selectedRows.size}</strong> selected student(s)? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                                <button onClick={handleDeleteSelected} disabled={saving}
                                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {saving ? 'Deleting...' : <><Trash2 className="w-4 h-4" /> Confirm Delete</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Import Modal ─── */}
                {showImportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 max-h-[85vh] flex flex-col">
                            <div className="flex justify-between items-center mb-5">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">Import Marks</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Excel format: <code className="bg-gray-100 px-1 rounded">Student ID | Name | Marks</code>{' '}
                                        or <code className="bg-gray-100 px-1 rounded">Student ID | Name | Mid-Sem 1 | Mid-Sem 2 | End-Sem</code>
                                    </p>
                                    <p className="text-xs text-amber-600 mt-1 font-medium">
                                        ⚠ Only marks for students enrolled in this subject will be imported. Others will be skipped.
                                    </p>
                                </div>
                                <button onClick={() => { setShowImportModal(false); resetImportState(); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                            </div>

                            {/* Step 1: Exam Type */}
                            <div className="mb-4">
                                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                                    Exam Type <span className="text-gray-400 font-normal">(for single-column files)</span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {EXAM_PRESETS.map(p => (
                                        <button key={p} onClick={() => { setImportExamType(p); setCustomExamType(''); }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${importExamType === p
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                                            {p}
                                        </button>
                                    ))}
                                    <button onClick={() => setImportExamType('__custom__')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${importExamType === '__custom__'
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                                        <Plus className="w-3 h-3 inline mr-1" />Custom
                                    </button>
                                </div>
                                {importExamType === '__custom__' && (
                                    <input value={customExamType} onChange={e => setCustomExamType(e.target.value)}
                                        placeholder="Enter exam type name..." className={`${inputCls} mt-2 max-w-xs`} autoFocus />
                                )}
                                <p className="text-[11px] text-gray-400 mt-1.5">
                                    If your file has multiple mark columns (e.g., Mid-Sem 1, Mid-Sem 2), each column name will be used as the exam type automatically.
                                </p>
                            </div>

                            {/* Step 2: File */}
                            <div className="mb-4">
                                <button onClick={() => fileRef.current?.click()}
                                    className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition w-full justify-center">
                                    <Upload className="w-4 h-4" />
                                    {importFile ? importFile.name : 'Choose Excel file (.xlsx, .xls, .csv)'}
                                </button>
                                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileSelect} />
                            </div>

                            {/* Preview */}
                            {previewRows.length > 0 && (
                                <div className="overflow-auto flex-1 border rounded-xl mb-4 max-h-60">
                                    <table className="w-full text-xs">
                                        <thead><tr className="bg-gray-50 border-b sticky top-0">
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
                                    <div className="px-3 py-1.5 text-xs text-gray-400 bg-gray-50 border-t">
                                        Showing first {previewRows.length} of {parsedImportData.length} rows
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 mt-auto">
                                <button onClick={() => { setShowImportModal(false); resetImportState(); }}
                                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                                <button onClick={confirmImport}
                                    disabled={importing || !previewRows.length}
                                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-indigo-700">
                                    {importing ? 'Importing…' : 'Import Marks'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Toasts ─── */}
                <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
                    {toasts.map(toast => {
                        const Icon = TOAST_ICONS[toast.type] || Info;
                        return (
                            <div key={toast.id} className={`flex items-start gap-3 px-5 py-4 rounded-xl border shadow-lg max-w-sm animate-fade-in ${TOAST_COLORS[toast.type]}`}>
                                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-sm">{toast.title}</p>
                                    {toast.message && <p className="text-xs mt-0.5 opacity-80">{toast.message}</p>}
                                </div>
                                <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
                            </div>
                        );
                    })}
                </div>
        </DashboardLayout>
    );
}