import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../../lib/api.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import {
    Building2, Plus, Pencil, Trash2, X, Search, ArrowLeft, Edit, User as UserIcon,
    BookOpen, GraduationCap, Upload, CheckCircle, XCircle,
    AlertTriangle, Info, Users, Hash
} from 'lucide-react';
import * as XLSX from 'xlsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/* ── Shared styles ─── */
const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white';
const btnPrimary = 'px-4 py-2.5 bg-[linear-gradient(135deg,_rgb(109,40,217)_0%,_rgb(124,58,237)_100%)] text-white rounded-xl text-sm font-semibold hover:bg-[#243557] transition-colors disabled:opacity-50';
const btnOutline = 'px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors';
const btnDanger = 'px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50';

/* ── Toast Component ─── */
const TOAST_ICONS = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info };
const TOAST_COLORS = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
};

function Toast({ toast, onClose }) {
    if (!toast) return null;
    const Icon = TOAST_ICONS[toast.type] || Info;
    return (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-start gap-3 px-5 py-4 rounded-xl border shadow-lg max-w-sm animate-fade-in ${TOAST_COLORS[toast.type]}`}>
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
                <p className="font-semibold text-sm">{toast.title}</p>
                <p className="text-xs mt-0.5 opacity-80">{toast.message}</p>
            </div>
            <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
    );
}

/* ── Confirm Modal ─── */
function ConfirmModal({ title, message, onConfirm, onCancel, loading, danger }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className={`flex items-center gap-2 ${danger ? 'text-red-600' : 'text-gray-800'}`}>
                        {danger && <AlertTriangle className="w-5 h-5" />}
                        <h3 className="font-bold text-sm">{title}</h3>
                    </div>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-4 h-4" /></button>
                </div>
                <div className="px-6 py-5">
                    <p className="text-sm text-gray-600">{message}</p>
                </div>
                <div className="flex gap-3 px-6 pb-5">
                    <button onClick={onCancel} className={`flex-1 ${btnOutline}`}>Cancel</button>
                    <button onClick={onConfirm} disabled={loading} className={`flex-1 ${danger ? btnDanger : btnPrimary} flex items-center justify-center gap-2`}>
                        {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {loading ? 'Processing...' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════
   SUBJECTS TAB
   ═══════════════════════════════════════════════ */
const TYPE_BADGE = {
    THEORY: { label: 'Theory', cls: 'bg-blue-100 text-blue-700', gradient: 'from-blue-500 to-indigo-600' },
    PRACTICAL: { label: 'Practical', cls: 'bg-amber-100 text-amber-700', gradient: 'from-amber-500 to-orange-500' },
};

function SubjectsTab({ departmentId, showToast }) {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    // Include year and semester at the Subject creation stage
    const [form, setForm] = useState({ name: '', code: '', type: 'THEORY', year: '1', semester: '1' });
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Detail panel
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [subjectDetail, setSubjectDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [enrollmentTarget, setEnrollmentTarget] = useState(null);
    const [activeSubjectTab, setActiveSubjectTab] = useState('info'); // 'info' or 'students'
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [bulkEnrollPreview, setBulkEnrollPreview] = useState(null);

    // Teacher Assign/Edit 
    const [assignTeacherModal, setAssignTeacherModal] = useState(false);
    const [editOfferingData, setEditOfferingData] = useState(null);
    const [departmentTeachers, setDepartmentTeachers] = useState([]);

    const fetchSubjects = async () => {
        setLoading(true);
        try {
            const all = await api.get('/subjects');
            setSubjects((all || []).filter(s => s.departmentId === departmentId));
        } catch (err) {
            showToast('error', 'Error', err.message);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchSubjects(); }, [departmentId]);

    const fetchSubjectDetail = async (id) => {
        setDetailLoading(true);
        try {
            const data = await api.get(`/subjects/${id}/details`);
            setSubjectDetail(data);
        } catch (err) {
            showToast('error', 'Error', err.message);
        } finally { setDetailLoading(false); }
    };

    const fetchDepartmentTeachers = async () => {
        try {
            const staff = await api.get(`/admin/departments/${departmentId}/staff`);
            const teachers = staff.filter(s => s.role === 'TEACHER');
            setDepartmentTeachers(teachers);
        } catch (err) {
            showToast('error', 'Error', err.message);
        }
    };

    const handleCardClick = (s) => {
        setSelectedSubject(s);
        fetchSubjectDetail(s.id);
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return subjects.filter(s =>
            s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q)
        );
    }, [subjects, search]);

    const openAdd = () => { setEditingId(null); setForm({ name: '', code: '', type: 'THEORY', year: '1', semester: '1' }); setShowModal(true); };
    const openEdit = (e, s) => {
        e.stopPropagation();
        setEditingId(s.id);
        setForm({ name: s.name, code: s.code || '', type: s.type || 'THEORY', year: s.year?.toString() || '1', semester: s.semester?.toString() || '1' });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            if (editingId) {
                await api.put(`/subjects/${editingId}`, {
                    name: form.name,
                    code: form.code,
                    type: form.type,
                    year: form.year,
                    semester: form.semester
                });
            } else {
                await api.post('/subjects', {
                    name: form.name,
                    code: form.code,
                    type: form.type,
                    departmentId,
                    year: form.year,
                    semester: form.semester
                });
            }
            await fetchSubjects();
            if (selectedSubject) fetchSubjectDetail(selectedSubject.id);
            setShowModal(false);
            showToast('success', editingId ? 'Updated' : 'Created', `Subject ${editingId ? 'updated' : 'added'} successfully.`);
        } catch (err) {
            showToast('error', 'Error', err.message);
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/subjects/${deleteTarget.id}`);
            await fetchSubjects();
            setDeleteTarget(null);
            if (selectedSubject?.id === deleteTarget.id) {
                setSelectedSubject(null);
                setSubjectDetail(null);
            }
            showToast('success', 'Deleted', 'Subject removed.');
        } catch (err) {
            showToast('error', 'Error', err.message);
        } finally { setDeleting(false); }
    };

    const handleDeleteOffering = async (offeringId) => {
        if (!window.confirm("Are you sure you want to remove this assigned teacher? This will also remove any active enrollments connected to this specific section.")) return;
        try {
            await api.delete(`/subjects/offerings/${offeringId}`);
            showToast('success', 'Removed', 'Assigned teacher offering was removed.');
            fetchSubjectDetail(subjectDetail.id);
        } catch (err) {
            showToast('error', 'Error', err.message);
        }
    };

    // ── Subject Detail Panel ──
    if (selectedSubject) {
        const badge = TYPE_BADGE[subjectDetail?.type] || TYPE_BADGE.THEORY;
        const totalEnrolled = subjectDetail?.offerings?.reduce((sum, o) => sum + (o._count?.enrollments || 0), 0) || 0;

        return (
            <div>
                <button onClick={() => { setSelectedSubject(null); setSubjectDetail(null); }}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to subjects
                </button>

                {detailLoading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-3 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                ) : subjectDetail ? (
                    <div className="animate-fade-in">
                        {/* Subject Header */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 bg-gradient-to-br ${badge.gradient} rounded-xl flex items-center justify-center shadow-md`}>
                                        <BookOpen className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{subjectDetail.name}</h2>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            {subjectDetail.code && <span className="text-sm text-gray-400 font-mono">{subjectDetail.code}</span>}
                                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="text-center px-4 py-2 bg-emerald-50 rounded-xl">
                                        <p className="text-2xl font-bold text-emerald-700">{totalEnrolled}</p>
                                        <p className="text-[10px] text-emerald-500 font-medium uppercase tracking-wider">Total Enrolled</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-6 mt-8 border-b border-gray-100">
                                {[
                                    { id: 'info', label: 'Info & Materials', icon: Info },
                                    { id: 'students', label: 'Enrolled Students', icon: Users }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setActiveSubjectTab(t.id)}
                                        className={`pb-3 text-sm font-bold flex items-center gap-2 transition-all relative ${activeSubjectTab === t.id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <t.icon className="w-4 h-4" />
                                        {t.label}
                                        {activeSubjectTab === t.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content: Info & Materials */}
                        {activeSubjectTab === 'info' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2 space-y-6">
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                    <Upload className="w-4 h-4 text-blue-500" />
                                                    Study Materials & Documents
                                                </h3>
                                                <label className={`cursor-pointer flex items-center gap-2 ${btnPrimary} py-2`}>
                                                    <input type="file" className="hidden" onChange={async (e) => {
                                                        const file = e.target.files[0];
                                                        if (!file) return;
                                                        setUploadingDoc(true);
                                                        const fd = new FormData();
                                                        fd.append('file', file);
                                                        try {
                                                            await api.post(`/subjects/subject/${subjectDetail.id}/documents`, fd);
                                                            showToast('success', 'Uploaded', 'Document added to subject.');
                                                            fetchSubjectDetail(subjectDetail.id);
                                                        } catch (err) { showToast('error', 'Upload Failed', err.message); }
                                                        finally { setUploadingDoc(false); }
                                                    }} disabled={uploadingDoc} />
                                                    {uploadingDoc ? 'Uploading...' : 'Upload Doc'}
                                                </label>
                                            </div>

                                            {subjectDetail.documents?.length === 0 ? (
                                                <div className="py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                    <Upload className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                                                    <p className="text-sm text-gray-400">No documents uploaded yet.</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-2">
                                                    {subjectDetail.documents.map(doc => (
                                                        <div key={doc.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between group hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                                                                    <BookOpen className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{doc.name}</p>
                                                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{new Date(doc.createdAt).toLocaleDateString()}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <a href={`${API_BASE}${doc.url}`} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Hash className="w-4 h-4" /></a>
                                                                <button onClick={async () => {
                                                                    if (!window.confirm('Delete this document?')) return;
                                                                    try {
                                                                        await api.delete(`/subjects/documents/${doc.id}`);
                                                                        showToast('success', 'Deleted', 'Document removed.');
                                                                        fetchSubjectDetail(subjectDetail.id);
                                                                    } catch (err) { showToast('error', 'Error', err.message); }
                                                                }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                            <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl">
                                                    <span className="text-xs font-semibold text-gray-500 uppercase">Year / Sem</span>
                                                    <span className="font-bold text-indigo-700">{subjectDetail.year || 1}Y / {subjectDetail.semester || 1}S</span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl">
                                                    <span className="text-xs font-semibold text-gray-500 uppercase">Offerings</span>
                                                    <span className="font-bold text-blue-700">{subjectDetail.offerings?.length || 0}</span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-violet-50/50 rounded-xl">
                                                    <span className="text-xs font-semibold text-gray-500 uppercase">Materials</span>
                                                    <span className="font-bold text-violet-700">{subjectDetail.documents?.length || 0}</span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                                                    <span className="text-xs font-semibold text-amber-600 uppercase">Type</span>
                                                    <span className="font-bold text-amber-700">{subjectDetail.type}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab Content: Students & Enrollment */}
                        {activeSubjectTab === 'students' && (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-gray-900 text-lg">Course Offerings & Students</h3>

                                    {/* Additional Assign Teacher Button shown when sections > 0 */}
                                    {subjectDetail.offerings?.length > 0 && (
                                        <button
                                            onClick={() => {
                                                fetchDepartmentTeachers();
                                                setEditOfferingData(null);
                                                setAssignTeacherModal(true);
                                            }}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-[#1a2b4b] text-white rounded-xl text-xs font-bold hover:bg-[#243557] transition-all"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Assign Teacher
                                        </button>
                                    )}
                                </div>
                                {subjectDetail.offerings?.length === 0 ? (
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                                        <Users className="w-12 h-12 mx-auto text-gray-200 mb-3" />
                                        <p className="text-gray-500 font-medium">No active offerings for this subject.</p>
                                        <p className="text-xs text-gray-400 mt-1">Assign teachers to create offerings.</p>
                                        <button
                                            onClick={() => {
                                                fetchDepartmentTeachers();
                                                setEditOfferingData(null);
                                                setAssignTeacherModal(true);
                                            }}
                                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                                        >
                                            Assign Teacher
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {subjectDetail.offerings.map(o => (
                                            <div key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:border-blue-500/30 hover:shadow-md transition-all">
                                                <div className="p-6 border-b border-gray-50 bg-gray-50/20">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg ring-4 ring-blue-50">
                                                                {(o.teacher.profile?.fullName?.[0] || o.teacher.email?.[0] || '?').toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-gray-900 leading-tight">{o.teacher.profile?.fullName || o.teacher.email}</h4>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg uppercase">Sec {o.section}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => {
                                                                    fetchDepartmentTeachers();
                                                                    setEditOfferingData(o);
                                                                    setAssignTeacherModal(true);
                                                                }}
                                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => handleDeleteOffering(o.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 mt-6">
                                                        <button onClick={() => setEnrollmentTarget(o)} className="flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-sm active:scale-[0.98]">
                                                            <Users className="w-3.5 h-3.5" /> Manage Enrolled
                                                        </button>
                                                        <button onClick={() => setBulkEnrollPreview({ offering: o, students: [] })} className="flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all shadow-sm active:scale-[0.98]">
                                                            <Plus className="w-3.5 h-3.5" /> Bulk Enroll
                                                        </button>
                                                    </div>

                                                    {/* Enrolled Students Preview */}
                                                    <div className="mt-6 pt-6 border-t border-gray-50">
                                                        <div className="flex items-center justify-between mb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                            <span >Enrolled Students      {o._count?.enrollments || 0}</span>
                                                           
                                                        </div>
                                                        
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {enrollmentTarget && (
                            <EnrollmentModal
                                offering={enrollmentTarget}
                                onClose={() => { setEnrollmentTarget(null); fetchSubjectDetail(subjectDetail.id); }}
                                showToast={showToast}
                            />
                        )}

                        {bulkEnrollPreview && (
                            <BulkEnrollPreviewModal
                                offering={bulkEnrollPreview.offering}
                                onClose={() => setBulkEnrollPreview(null)}
                                onConfirm={() => {
                                    setBulkEnrollPreview(null);
                                    fetchSubjectDetail(subjectDetail.id);
                                }}
                                showToast={showToast}
                            />
                        )}
                        {assignTeacherModal && (
                            <AssignTeacherModal
                                subject={subjectDetail}
                                teachers={departmentTeachers}
                                offering={editOfferingData}
                                onClose={() => {
                                    setAssignTeacherModal(false);
                                    setEditOfferingData(null);
                                }}
                                onAssigned={() => {
                                    setAssignTeacherModal(false);
                                    setEditOfferingData(null);
                                    fetchSubjectDetail(subjectDetail.id);
                                }}
                                showToast={showToast}
                            />
                        )}
                    </div>
                ) : null}
            </div>
        );
    }

    // ── Cards View ──
    return (
        <div>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="relative flex-1 min-w-48 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subjects..."
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                </div>
                <button onClick={openAdd} className={`flex items-center gap-1.5 ${btnPrimary}`}>
                    <Plus className="w-4 h-4" /> Add Subject
                </button>
            </div>

            {/* Subject Cards */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-3 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                    <BookOpen className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                    <p className="text-gray-400 text-sm">No subjects found</p>
                    <button onClick={openAdd} className="text-xs text-blue-500 hover:underline mt-1">Add one →</button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filtered.map(s => {
                            const badge = TYPE_BADGE[s.type] || TYPE_BADGE.THEORY;
                            return (
                                <div key={s.id}
                                    onClick={() => handleCardClick(s)}
                                    className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden"
                                >
                                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${badge.gradient} rounded-t-2xl`} />
                                    <div className="p-5 pt-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 bg-gradient-to-br ${badge.gradient} rounded-xl flex items-center justify-center shadow-md`}>
                                                    <BookOpen className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 text-sm leading-tight">{s.name}</h4>
                                                    {s.code && <p className="text-xs text-gray-400 font-mono mt-0.5">{s.code}</p>}
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                                <button onClick={(e) => openEdit(e, s)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                                                <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(s); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
                                            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                                {s.year || 1}Y / {s.semester || 1}S
                                            </span>
                                            {s._count?.offerings > 0 && (
                                                <span className="text-[11px] text-gray-400 font-medium ml-auto">{s._count.offerings} section{s._count.offerings !== 1 ? 's' : ''}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-xs text-gray-400 mt-4">{filtered.length} subject{filtered.length !== 1 ? 's' : ''}</p>
                </>
            )}

            {/* Add/Edit Subject Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-bold text-gray-900 text-lg">{editingId ? 'Edit Subject' : 'Add Subject'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-600 block mb-1">Subject Name *</label>
                                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="e.g., Data Structures" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 block mb-1">Subject Code</label>
                                <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} className={inputCls} placeholder="e.g., CS201" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 block mb-1">Year *</label>
                                    <select value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} className={inputCls}>
                                        {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 block mb-1">Semester *</label>
                                    <select value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))} className={inputCls}>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 block mb-1">Type *</label>
                                <div className="flex gap-3">
                                    {['THEORY', 'PRACTICAL'].map(t => (
                                        <button key={t} type="button" onClick={() => setForm(p => ({ ...p, type: t }))}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${form.type === t
                                                ? t === 'THEORY'
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-amber-500 bg-amber-50 text-amber-700'
                                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                                }`}>
                                            {t === 'THEORY' ? '📖 Theory' : '🔬 Practical'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className={`flex-1 ${btnOutline}`}>Cancel</button>
                            <button onClick={handleSave} disabled={saving || !form.name.trim()} className={`flex-1 ${btnPrimary}`}>
                                {saving ? 'Saving…' : (editingId ? 'Update' : 'Add Subject')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteTarget && (
                <ConfirmModal
                    title="Delete Subject"
                    message={<>Are you sure you want to delete <span className="font-bold text-gray-900">{deleteTarget.name}</span>? This cannot be undone.</>}
                    onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} danger
                />
            )}
        </div>
    );
}

/* ── Enrollment Preview (On Card) ─── */
function EnrollmentPreview({ offeringId }) {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const data = await api.get(`/subjects/offerings/${offeringId}/students`);
                setStudents(data || []);
            } catch (err) {
                console.error('Failed to fetch preview students:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [offeringId]);

    if (loading) return <div className="flex gap-1.5 overflow-hidden animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="w-7 h-7 bg-gray-100 rounded-lg flex-shrink-0" />)}
    </div>;

    if (students.length === 0) return <p className="text-[10px] text-gray-400 italic">No students enrolled yet.</p>;

    return (
        <div className="flex flex-wrap gap-1.5">
            {students.slice(0, 8).map(s => (
                <div key={s.id} className="group relative" title={s.fullName}>
                    <div className="w-7 h-7 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-gray-600 shadow-sm hover:border-blue-200 hover:text-blue-600 transition-all cursor-help">
                        {s.fullName[0].toUpperCase()}
                    </div>
                </div>
            ))}
            {students.length > 8 && (
                <div className="w-7 h-7 bg-gray-50 border border-dashed border-gray-200 rounded-lg flex items-center justify-center text-[9px] font-bold text-gray-400">
                    +{students.length - 8}
                </div>
            )}
        </div>
    );
}

/* ── Enrollment Modal ─── */
function EnrollmentModal({ offering, onClose, showToast }) {
    const [enrolled, setEnrolled] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [allStudents, setAllStudents] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [searching, setSearching] = useState(false);

    const fetchEnrolled = async () => {
        setLoading(true);
        try {
            const [enrolledData, suggestedData] = await Promise.all([
                api.get(`/subjects/offerings/${offering.id}/students`),
                api.get(`/subjects/offerings/${offering.id}/enroll-preview?year=${offering.year}`)
            ]);
            setEnrolled(enrolledData || []);
            setSuggestions(suggestedData || []);
        } catch (err) {
            showToast('error', 'Error', err.message);
        } finally { setLoading(false); }
    };

    const searchStudents = async (q) => {
        if (!q || q.length < 2) { setAllStudents([]); return; }
        setSearching(true);
        try {
            const students = await api.get('/students');
            setAllStudents(students.filter(s => {
                const matchesDept = s.departmentId === offering.subject.departmentId;
                const matchesYearSem = s.enrollments?.some(e =>
                    Number(e.year) === Number(offering.year) &&
                    Number(e.semester) === Number(offering.semester)
                );
                const queryMatch = (s.fullName || '').toLowerCase().includes(q.toLowerCase()) ||
                    (s.studentId || '').toLowerCase().includes(q.toLowerCase());

                return matchesDept && matchesYearSem && queryMatch;
            }).slice(0, 10));
        } catch (err) {
            console.error(err);
        } finally { setSearching(false); }
    };

    useEffect(() => { fetchEnrolled(); }, [offering.id]);
    useEffect(() => {
        const timer = setTimeout(() => searchStudents(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleEnroll = async (student) => {
        try {
            await api.post(`/subjects/offerings/${offering.id}/enroll`, { studentId: student.id });
            showToast('success', 'Enrolled', `${student.fullName} added to course.`);
            setSearch('');
            setAllStudents([]);
            fetchEnrolled();
        } catch (err) {
            showToast('error', 'Enrollment Failed', err.message);
        }
    };

    const handleUnenroll = async (studentId) => {
        if (!window.confirm('Remove student from this section?')) return;
        try {
            await api.delete(`/subjects/offerings/${offering.id}/unenroll/${studentId}`);
            showToast('success', 'Removed', 'Student removed from section.');
            fetchEnrolled();
        } catch (err) {
            showToast('error', 'Error', err.message);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h3 className="font-bold text-gray-900">Manage Students</h3>
                        <p className="text-xs text-gray-500">{offering.year}Y {offering.semester}S — Sec {offering.section}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
                </div>

                <div className="p-6 flex-1 overflow-auto space-y-6">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Enroll New Student</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by name or student ID..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                            {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />}
                        </div>

                        {allStudents.length > 0 && (
                            <div className="bg-white border border-blue-200 rounded-2xl shadow-xl overflow-hidden animate-slide-up ring-4 ring-blue-500/10">
                                <div className="px-4 py-2 bg-blue-50 text-[10px] font-bold text-blue-600 uppercase tracking-widest border-b border-blue-100">Search Results</div>
                                {allStudents.map(s => (
                                    <button key={s.id} onClick={() => handleEnroll(s)}
                                        className="w-full px-4 py-3 text-left hover:bg-blue-50/50 flex items-center justify-between group transition-colors border-b last:border-0 border-gray-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-bold text-xs ring-2 ring-white">
                                                {s.fullName[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">{s.fullName}</p>
                                                <p className="text-[10px] text-gray-500 font-mono tracking-tighter uppercase">{s.studentId}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase">Enroll</span>
                                            <Plus className="w-4 h-4 text-blue-500" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {!search && suggestions.length > 0 && (
                        <div className="space-y-3 bg-indigo-50/30 p-4 rounded-3xl border border-indigo-100/50">
                            <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest ml-1">Suggested Students (Year {offering.year})</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {suggestions.map(s => (
                                    <div key={s.id} className="p-3 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center justify-between group hover:border-blue-300 transition-colors shadow-sm">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 bg-white border border-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold text-sm shadow-sm">
                                                {(s.fullName?.[0] || '?').toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">{s.fullName}</p>
                                                <p className="text-[10px] text-gray-400 font-mono tracking-tight uppercase">{s.studentId}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleEnroll(s)} className="p-2 text-blue-500 hover:bg-blue-100 rounded-xl transition-all">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Enrolled Students ({enrolled.length})</label>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>
                        ) : enrolled.length === 0 ? (
                            <div className="bg-gray-50 rounded-2xl p-10 text-center">
                                <Users className="w-8 h-8 mx-auto text-gray-200 mb-2" />
                                <p className="text-sm text-gray-400">No students enrolled in this course yet.</p>
                            </div>
                        ) : (
                            <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50">
                                {enrolled.map(s => (
                                    <div key={s.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                                                {s.fullName[0].toUpperCase()}
                                            </div>

                                            <input
                                                value={s.fullName}
                                                onChange={(e) => {
                                                    setEnrolled(prev =>
                                                        prev.map(st =>
                                                            st.id === s.id ? { ...st, fullName: e.target.value } : st
                                                        )
                                                    );
                                                }}
                                                className="text-sm font-semibold text-gray-900 bg-transparent border-b border-transparent focus:border-blue-400 focus:outline-none"
                                            />

                                            <p className="text-[10px] text-gray-400 font-mono">{s.studentId}</p>
                                        </div>

                                        <div className="mx-4">
                                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg uppercase">Sec {s.section}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          
                                            

                                            {/* Remove from Subject */}
                                            <button
                                                onClick={() => handleUnenroll(s.id)}
                                                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                    <button onClick={onClose} className="w-full py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Bulk Enroll Preview Modal ─── */
function BulkEnrollPreviewModal({ offering, onClose, onConfirm, showToast }) {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);

    useEffect(() => {
        const fetchPreview = async () => {
            setLoading(true);
            try {
                const data = await api.get(`/subjects/offerings/${offering.id}/enroll-preview?year=${offering.year}`);
                setStudents(data || []);
            } catch (err) {
                showToast('error', 'Preview Failed', err.message);
            } finally { setLoading(false); }
        };
        fetchPreview();
    }, [offering, showToast]);

    const handleConfirm = async () => {
        setEnrolling(true);
        try {
            const res = await api.post(`/subjects/offerings/${offering.id}/enroll-bulk`, { year: offering.year });
            showToast('success', 'Bulk Enroll Complete', res.message);
            onConfirm();
        } catch (err) {
            showToast('error', 'Enrollment Failed', err.message);
        } finally { setEnrolling(false); }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in flex flex-col max-h-[80vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
                    <div className="flex items-center gap-2 text-blue-700">
                        <Users className="w-5 h-5" />
                        <h3 className="font-bold text-gray-900 border-none m-0 p-0 text-base">Bulk Enroll Preview</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
                </div>

                <div className="p-6 flex-1 overflow-auto">
                    <div className="mb-4">
                        <p className="text-sm text-gray-600">
                            Found <span className="font-bold text-blue-600">{students.length}</span> students in the same department and Year {offering.year} who are not yet enrolled.
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" /></div>
                    ) : students.length === 0 ? (
                        <p className="text-center py-10 text-gray-400 text-sm italic">No new students available for enrollment in this criteria.</p>
                    ) : (
                        <div className="space-y-2">
                            {students.map(s => (
                                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 font-bold text-xs uppercase shadow-sm flex-shrink-0">
                                            {s.fullName?.[0] || '?'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-900 m-0 p-0 leading-tight truncate">{s.fullName}</p>
                                            <p className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase m-0 p-0 leading-tight truncate">{s.studentId}</p>
                                        </div>
                                    </div>
                                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50/30">
                    <button onClick={onClose} className="flex-1 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading || students.length === 0 || enrolling}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {enrolling && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {enrolling ? 'Enrolling...' : 'Confirm Enroll'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Re-purposed to act as an Edit or Assign Teacher Modal
function AssignTeacherModal({ subject, teachers, offering, onClose, onAssigned, showToast }) {

    const [selectedTeacher, setSelectedTeacher] = useState(offering?.teacherId || '');
    const [section, setSection] = useState(offering?.section || 'A');
    const [loading, setLoading] = useState(false);

    const handleAssign = async () => {
        if (!selectedTeacher || !section) return;

        setLoading(true);
        try {
            if (offering) {
                // EDIT Existing Offering
                await api.put(`/subjects/offerings/${offering.id}`, {
                    teacherId: selectedTeacher,
                    section
                });
                showToast('success', 'Updated', 'Assigned teacher details updated.');
            } else {
                // ADD New Offering
                await api.post(`/subjects/${subject.id}/assign-teacher`, {
                    teacherId: selectedTeacher,
                    section
                });
                showToast('success', 'Assigned', 'Teacher assigned successfully.');
            }
            onAssigned();
        } catch (err) {
            showToast('error', 'Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4">
                <h3 className="font-bold text-lg">
                    {offering ? 'Edit Assigned Teacher' : 'Assign Teacher'}
                </h3>

                <p className="text-xs text-gray-500">
                    Applying to: {subject.year}Y {subject.semester}S
                </p>

                <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Teacher *</label>
                    <select
                        className={inputCls}
                        value={selectedTeacher}
                        onChange={e => setSelectedTeacher(e.target.value)}
                    >
                        <option value="">Select Teacher</option>
                        {teachers.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.fullName || t.email}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Section *</label>
                    <input
                        value={section}
                        onChange={e => setSection(e.target.value)}
                        className={inputCls}
                        placeholder="e.g. A"
                    />
                </div>

                <div className="flex gap-3 pt-3">
                    <button onClick={onClose} className="flex-1 border rounded-xl py-2">Cancel</button>
                    <button
                        onClick={handleAssign}
                        disabled={loading || !selectedTeacher || !section}
                        className="flex-1 bg-blue-600 text-white rounded-xl py-2 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : (offering ? 'Save Changes' : 'Assign')}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════
   STUDENTS TAB
   ═══════════════════════════════════════════════ */
function StudentsTab({ departmentId, showToast }) {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [profileStudent, setProfileStudent] = useState(null);

    // Add modal
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ studentId: '', fullName: '', year: '1', semester: '1' });
    const [saving, setSaving] = useState(false);

    // Delete
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Import
    const fileRef = useRef();
    const [showImportPreview, setShowImportPreview] = useState(false);
    const [previewRows, setPreviewRows] = useState([]);
    const [parsedImportData, setParsedImportData] = useState([]);
    const [importing, setImporting] = useState(false);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const all = await api.get('/students');
            setStudents((all || []).filter(s => s.departmentId === departmentId));
        } catch (err) {
            showToast('error', 'Error', err.message);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchStudents(); }, [departmentId]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return students.filter(s =>
            s.fullName?.toLowerCase().includes(q) || s.studentId?.toLowerCase().includes(q)
        );
    }, [students, search]);

    // Add student
    const openAdd = () => { setForm({ studentId: '', fullName: '', year: '1', semester: '1' }); setShowModal(true); };

    const handleSave = async () => {
        if (!form.fullName.trim()) return;
        setSaving(true);
        try {
            await api.post('/students', {
                studentId: form.studentId,
                fullName: form.fullName,
                departmentId,
                year: Number(form.year),
                semester: Number(form.semester),
            });
            await fetchStudents();
            setShowModal(false);
            showToast('success', 'Created', 'Student added successfully.');
        } catch (err) {
            showToast('error', 'Error', err.message);
        } finally { setSaving(false); }
    };

    // Delete student
    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/students/${deleteTarget.id}`);
            await fetchStudents();
            setDeleteTarget(null);
            showToast('success', 'Deleted', 'Student removed.');
        } catch (err) {
            showToast('error', 'Error', err.message);
        } finally { setDeleting(false); }
    };

    // Import from Excel
    const handleImport = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const wb = XLSX.read(ev.target.result, { type: 'binary' });
                const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: false, defval: '' });
                if (!raw.length) { showToast('warning', 'Empty File', 'Excel file is empty.'); return; }
                setPreviewRows(raw.slice(0, 10));
                setParsedImportData(raw);
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
            const rows = parsedImportData.map(r => {
                // Normalize keys to lowercase for robust detection
                const rowLower = {};
                for (const [k, v] of Object.entries(r)) rowLower[k.toLowerCase().trim()] = v;

                return {
                    studentId: String(rowLower['studentid'] || rowLower['student_id'] || rowLower['student id'] || rowLower['roll no'] || rowLower['rollno'] || '').trim(),
                    fullName: String(rowLower['fullname'] || rowLower['full name'] || rowLower['name'] || '').trim(),
                    email: String(rowLower['email'] || rowLower['e-mail'] || rowLower['email address'] || '').trim(),
                    year: Number(rowLower['year']) || 1,
                    semester: Number(rowLower['semester'] || rowLower['sem']) || 1,
                    section: String(rowLower['section'] || rowLower['sec'] || 'A').trim().toUpperCase() || 'A',
                };
            }).filter(r => r.fullName);

            const result = await api.post('/students/bulk', { rows, departmentId });
            await fetchStudents();
            setShowImportPreview(false);
            showToast('success', 'Import Successful', `${result.inserted} added, ${result.updated} updated.`);
        } catch (err) {
            showToast('error', 'Import Failed', err.message);
        } finally { setImporting(false); }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };
    const toggleSelectAll = () => {
        if (selectedIds.size === filtered.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(filtered.map(s => s.id)));
    };
    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedIds.size} selected student(s)?`)) return;
        try {
            for (const id of selectedIds) await api.delete(`/students/${id}`);
            await fetchStudents();
            setSelectedIds(new Set());
            showToast('success', 'Deleted', `${selectedIds.size} student(s) removed.`);
        } catch (err) { showToast('error', 'Error', err.message); }
    };

    return (
        <div>
            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <div className="mb-4 flex items-center gap-4 px-5 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl animate-fade-in">
                    <span className="text-sm font-bold text-indigo-600">{selectedIds.size} selected</span>
                    <div className="flex-1" />
                    <button onClick={handleBulkDelete} className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-600 hover:text-white transition-all">
                        <Trash2 className="w-3.5 h-3.5" /> Delete Selected
                    </button>
                    <button onClick={() => setSelectedIds(new Set())} className="p-2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="relative flex-1 min-w-48 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..."
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => fileRef.current?.click()} className={`flex items-center gap-1.5 ${btnOutline}`}>
                        <Upload className="w-4 h-4" /> Import Excel
                    </button>
                    <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
                    <button onClick={openAdd} className={`flex items-center gap-1.5 ${btnPrimary}`}>
                        <Plus className="w-4 h-4" /> Add Student
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-3 py-3 w-10">
                                <input type="checkbox" checked={filtered.length > 0 && selectedIds.size === filtered.length} onChange={toggleSelectAll}
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student ID</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Full Name</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Year</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Semester</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase text-center">Section</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan={7} className="py-16 text-center text-gray-400">
                                <div className="w-8 h-8 border-3 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />Loading…
                            </td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={7} className="py-16 text-center text-gray-400">
                                <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p>No students found</p>
                                <p className="text-xs mt-1">Add manually or import from Excel.</p>
                            </td></tr>
                        ) : filtered.map((s, i) => (
                            <tr key={s.id} className={`transition-colors ${selectedIds.has(s.id) ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}>
                                <td className="px-3 py-3">
                                    <input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => toggleSelect(s.id)}
                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                                </td>
                                <td className="px-5 py-3 text-gray-400 text-xs">{i + 1}</td>
                                <td className="px-5 py-3 font-mono text-xs text-gray-600">{s.studentId || '—'}</td>
                                <td className="px-5 py-3 font-medium text-gray-900">{s.fullName}</td>
                                <td className="px-5 py-3 text-gray-500">{s.enrollments?.[0]?.year || '—'}</td>
                                <td className="px-5 py-3 text-gray-500">{s.enrollments?.[0]?.semester || '—'}</td>
                                <td className="px-5 py-3 text-center">
                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100">
                                        {s.enrollments?.[0]?.section || '—'}
                                    </span>
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        <button onClick={() => setProfileStudent(s)} className="text-gray-300 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 transition-all" title="View Profile">
                                            <UserIcon className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => setDeleteTarget(s)} className="text-red-400 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-all" title="Delete">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">{filtered.length} student{filtered.length !== 1 ? 's' : ''}</div>}
            </div>

            {/* Add Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-bold text-gray-900 text-lg">Add Student</h3>
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
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 block mb-1">Year</label>
                                    <select value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} className={inputCls}>
                                        {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 block mb-1">Semester</label>
                                    <select value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))} className={inputCls}>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className={`flex-1 ${btnOutline}`}>Cancel</button>
                            <button onClick={handleSave} disabled={saving || !form.fullName.trim()} className={`flex-1 ${btnPrimary}`}>
                                {saving ? 'Saving…' : 'Add Student'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Preview Modal */}
            {showImportPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 animate-fade-in max-h-[85vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">Import Preview</h3>
                                <p className="text-xs text-gray-500">{parsedImportData.length} rows found. Showing first {previewRows.length}.</p>
                            </div>
                            <button onClick={() => setShowImportPreview(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
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
                            <button onClick={() => setShowImportPreview(false)} className={`flex-1 ${btnOutline}`}>Cancel</button>
                            <button onClick={confirmImport} disabled={importing} className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-green-700">
                                {importing ? 'Importing…' : `Import ${parsedImportData.length} Students`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteTarget && (
                <ConfirmModal
                    title="Remove Student"
                    message={<>Are you sure you want to remove <span className="font-bold text-gray-900">{deleteTarget.fullName}</span> from this department?</>}
                    onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} danger
                />
            )}

            {/* Student Profile Modal */}
            {profileStudent && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={() => setProfileStudent(null)}>
                    <div className="bg-white rounded-[32px] max-w-md w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-8 py-8 text-center relative">
                            <button onClick={() => setProfileStudent(null)} className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            <div className="w-20 h-20 bg-white/20 rounded-[28px] flex items-center justify-center text-white font-black text-3xl mx-auto mb-4 shadow-inner backdrop-blur-md">
                                {(profileStudent.fullName || 'S').charAt(0)}
                            </div>
                            <h2 className="text-white text-xl font-black uppercase tracking-wide">{profileStudent.fullName}</h2>
                            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">{profileStudent.studentId || 'No ID'}</p>
                        </div>
                        <div className="p-8 space-y-4">
                            {[
                                { label: 'Student ID', value: profileStudent.studentId || '—' },
                                { label: 'Full Name', value: profileStudent.fullName || '—' },
                                { label: 'Email', value: profileStudent.email || '—' },
                                { label: 'Year', value: profileStudent.enrollments?.[0]?.year ? `Year ${profileStudent.enrollments[0].year}` : '—' },
                                { label: 'Semester', value: profileStudent.enrollments?.[0]?.semester ? `Sem ${profileStudent.enrollments[0].semester}` : '—' },
                            ].map(item => (
                                <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                                    <span className="text-sm font-bold text-gray-800">{item.value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="px-8 pb-8">
                            <button onClick={() => setProfileStudent(null)} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs uppercase tracking-widest rounded-2xl transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════
   STAFF TAB
   ═══════════════════════════════════════════════ */
function StaffTab({ departmentId, showToast }) {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState(null);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const data = await api.get(`/admin/departments/${departmentId}/staff`);
            setStaff(data || []);
        } catch (err) {
            showToast('error', 'Error', err.message);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchStaff(); }, [departmentId]);

    return (
        <div className="space-y-4">
            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-3 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
                </div>
            ) : staff.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                    <Users className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                    <p className="text-gray-400 text-sm">No staff assigned to this department</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {staff.map(u => (
                        <div key={u.id} onClick={() => setSelectedMember(u)}
                            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-violet-700 to-violet-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                    {(u.fullName?.[0] || u.email?.[0] || '?').toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 truncate group-hover:text-violet-600 transition-colors">{u.fullName || u.email}</p>
                                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${u.role === 'HOD' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                    {u.role}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Profile Modal */}
            {selectedMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex justify-end">
                            <button onClick={() => setSelectedMember(null)} className="text-white/80 hover:text-white"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="px-8 pb-8 -mt-12 text-center">
                            <div className="w-24 h-24 bg-white rounded-full p-1.5 mx-auto mb-4 shadow-lg">
                                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-gray-400 font-bold text-3xl">
                                    {(selectedMember.fullName?.[0] || selectedMember.email?.[0] || '?').toUpperCase()}
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">{selectedMember.fullName || selectedMember.email}</h3>
                            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mt-1">{selectedMember.role}</p>

                            <div className="mt-8 space-y-4 text-left">
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400"><Search className="w-5 h-5" /></div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Email Address</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedMember.email}</p>
                                    </div>
                                </div>
                                {selectedMember.profile?.phone && (
                                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400"><Hash className="w-5 h-5" /></div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Phone Number</p>
                                            <p className="text-sm font-semibold text-gray-900">{selectedMember.profile.phone}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400"><Users className="w-5 h-5" /></div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Account Status</p>
                                        <p className="text-sm font-semibold text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Active</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════
   MAIN: AdminDepartments
   ═══════════════════════════════════════════════ */
export default function AdminDepartments() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Selected department (detail view)
    const [selectedDept, setSelectedDept] = useState(null);
    const [activeTab, setActiveTab] = useState('subjects');

    // Add/Edit dept modal
    const [showModal, setShowModal] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [deptForm, setDeptForm] = useState({ name: '', shortId: '' });
    const [saving, setSaving] = useState(false);

    // Delete dept
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Toast
    const [toast, setToast] = useState(null);
    const showToast = (type, title, message) => {
        setToast({ type, title, message });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const data = await api.get('/admin/departments');
            setDepartments(data || []);
        } catch (err) {
            showToast('error', 'Error', err.message);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchDepartments(); }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return departments.filter(d =>
            d.name?.toLowerCase().includes(q) || d.shortId?.toLowerCase().includes(q)
        );
    }, [departments, search]);

    // CRUD
    const openAdd = () => { setEditingDept(null); setDeptForm({ name: '', shortId: '' }); setShowModal(true); };
    const openEdit = (d) => { setEditingDept(d); setDeptForm({ name: d.name, shortId: d.shortId || '' }); setShowModal(true); };

    const handleSave = async () => {
        if (!deptForm.name.trim() || !deptForm.shortId.trim()) return;
        setSaving(true);
        try {
            if (editingDept) {
                await api.put(`/admin/departments/${editingDept.id}`, { name: deptForm.name, shortId: deptForm.shortId });
            } else {
                await api.post('/admin/departments', { name: deptForm.name, shortId: deptForm.shortId });
            }
            await fetchDepartments();
            setShowModal(false);
            showToast('success', editingDept ? 'Updated' : 'Created', `Department ${editingDept ? 'updated' : 'added'} successfully.`);
        } catch (err) {
            showToast('error', 'Error', err.message);
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/admin/departments/${deleteTarget.id}`);
            await fetchDepartments();
            setDeleteTarget(null);
            showToast('success', 'Deleted', 'Department removed.');
        } catch (err) {
            showToast('error', 'Error', err.message);
        } finally { setDeleting(false); }
    };

    // ── Detail View ──
    if (selectedDept) {
        const TABS = [
            { key: 'subjects', label: 'Subjects', icon: BookOpen },
            { key: 'students', label: 'Students', icon: GraduationCap },
            { key: 'staff', label: 'Staff', icon: Users },
        ];

        return (
            <DashboardLayout title={selectedDept.name} subtitle={`${selectedDept.shortId} — Department Management`}>
                {/* Back button */}
                <button onClick={() => setSelectedDept(null)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to all departments
                </button>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
                    {TABS.map(t => {
                        const Icon = t.icon;
                        return (
                            <button key={t.key} onClick={() => setActiveTab(t.key)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === t.key
                                    ? 'bg-white shadow-sm text-gray-900'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}>
                                <Icon className="w-4 h-4" />{t.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                {activeTab === 'subjects' && <SubjectsTab departmentId={selectedDept.id} showToast={showToast} />}
                {activeTab === 'students' && <StudentsTab departmentId={selectedDept.id} showToast={showToast} />}
                {activeTab === 'staff' && <StaffTab departmentId={selectedDept.id} showToast={showToast} />}

                <Toast toast={toast} onClose={() => setToast(null)} />
            </DashboardLayout>
        );
    }

    // ── List View ──
    return (
        <DashboardLayout title="Departments" subtitle={`${departments.length} departments`}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="relative flex-1 min-w-48 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search departments..."
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white shadow-sm" />
                </div>
                <button onClick={openAdd} className={`flex items-center gap-2 ${btnPrimary}`}>
                    <Plus className="w-4 h-4" /> Add Department
                </button>
            </div>

            {/* Department Cards */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                    <Building2 className="w-12 h-12 mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-400 text-sm">No departments found</p>
                    <button onClick={openAdd} className="text-xs text-blue-500 hover:underline mt-2">Create one →</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filtered.map(d => (
                        <div key={d.id}
                            className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden"
                            onClick={() => { setSelectedDept(d); setActiveTab('subjects'); }}
                        >
                            {/* Top accent */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-[linear-gradient(135deg,_rgb(109,40,217)_0%,_rgb(124,58,237)_100%)] rounded-t-2xl" />

                            <div className="p-5 pt-6">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 bg-[linear-gradient(135deg,_rgb(109,40,217)_0%,_rgb(124,58,237)_100%)] rounded-xl flex items-center justify-center shadow-md">
                                            <Building2 className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-base">{d.name}</h3>
                                            <p className="text-xs text-gray-400 font-mono mt-0.5">{d.shortId}</p>
                                        </div>
                                    </div>
                                    {/* Action buttons */}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                        <button onClick={() => openEdit(d)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => setDeleteTarget(d)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="flex items-center gap-2 bg-blue-50/60 rounded-xl px-3 py-2.5">
                                        <BookOpen className="w-4 h-4 text-blue-500" />
                                        <div>
                                            <p className="text-lg font-bold text-gray-900 leading-none">{d.subjectCount || 0}</p>
                                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">Subjects</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-emerald-50/60 rounded-xl px-3 py-2.5">
                                        <GraduationCap className="w-4 h-4 text-emerald-500" />
                                        <div>
                                            <p className="text-lg font-bold text-gray-900 leading-none">{d.studentCount || 0}</p>
                                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">Students</p>
                                        </div>
                                    </div>
                                </div>

                                {/* HOD */}
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Users className="w-3.5 h-3.5" />
                                    <span>HOD: {d.hod?.name || <span className="italic text-gray-300">Not assigned</span>}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Dept Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-bold text-gray-900 text-lg">{editingDept ? 'Edit Department' : 'Add Department'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-600 block mb-1">Department Name *</label>
                                <input value={deptForm.name} onChange={e => setDeptForm(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="e.g., Computer Science & Engineering" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 block mb-1">Short ID *</label>
                                <input value={deptForm.shortId} onChange={e => setDeptForm(p => ({ ...p, shortId: e.target.value.toUpperCase() }))} className={inputCls} placeholder="e.g., CSE" />
                                <p className="text-[10px] text-gray-400 mt-1">Short identifier used across the system (e.g., IT, CSE, MECH)</p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className={`flex-1 ${btnOutline}`}>Cancel</button>
                            <button onClick={handleSave} disabled={saving || !deptForm.name.trim() || !deptForm.shortId.trim()} className={`flex-1 ${btnPrimary}`}>
                                {saving ? 'Saving…' : (editingDept ? 'Update' : 'Add Department')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteTarget && (
                <ConfirmModal
                    title="Delete Department"
                    message={<>Are you sure you want to delete <span className="font-bold text-gray-900">{deleteTarget.name}</span>? All associated subjects and students must be removed first.</>}
                    onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} danger
                />
            )}

            <Toast toast={toast} onClose={() => setToast(null)} />
        </DashboardLayout>
    );
}