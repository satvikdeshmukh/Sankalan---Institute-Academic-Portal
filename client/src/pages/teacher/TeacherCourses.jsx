import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import {
    BookOpen, Users, FileText, GraduationCap, Layers,
    ArrowLeft, Upload, Trash2, ExternalLink, Download, X,
    CheckCircle, AlertTriangle, Info, XCircle, Eye, File,
    Calendar, Hash
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const TOAST_ICONS = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info };
const TOAST_COLORS = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error:   'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info:    'bg-blue-50 border-blue-200 text-blue-800',
};

function TypeBadge({ type }) {
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
            ${type === 'THEORY' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
            {type === 'THEORY' ? 'Theory' : 'Practical'}
        </span>
    );
}

/* ══════════════════════════════════
   COURSE DETAIL VIEW
══════════════════════════════════ */
function CourseDetail({ offering, onBack, addToast }) {
    const [docs, setDocs]           = useState([]);
    const [students, setStudents]   = useState([]);
    const [loadingDocs, setLoadingDocs]         = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
    const fileRef = React.useRef();

    const fetchDocs = useCallback(async () => {
        setLoadingDocs(true);
        try {
            const data = await api.get(`/courses/${offering.id}/documents`);
            setDocs(data || []);
        } catch { /* silent */ }
        finally { setLoadingDocs(false); }
    }, [offering.id]);

    const fetchStudents = useCallback(async () => {
        setLoadingStudents(true);
        try {
            const data = await api.get(`/courses/${offering.id}/students`);
            setStudents(data || []);
        } catch { /* silent */ }
        finally { setLoadingStudents(false); }
    }, [offering.id]);

    useEffect(() => { fetchDocs(); fetchStudents(); }, [fetchDocs, fetchStudents]);

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            await api.upload(`/courses/${offering.id}/documents`, formData);
            await fetchDocs();
            addToast('success', 'Uploaded', file.name);
        } catch (err) {
            addToast('error', 'Upload Failed', err.message);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDeleteDoc = async (docId) => {
        try {
            await api.delete(`/courses/documents/${docId}`);
            await fetchDocs();
            addToast('success', 'Deleted', 'Document removed.');
        } catch (err) {
            addToast('error', 'Delete Failed', err.message);
        }
    };

    const tabs = [
        { id: 'info',     label: 'Overview',  icon: BookOpen },
        { id: 'students', label: `Students (${students.length})`, icon: Users },
        { id: 'docs',     label: `Materials (${docs.length})`,    icon: FileText },
    ];

    return (
        <div className="space-y-5">
            {/* Back + Title */}
            <div className="flex items-center gap-3">
                <button onClick={onBack}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="w-px h-5 bg-gray-200" />
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{offering.subject?.name}</h2>
                    <p className="text-xs text-gray-500">
                        {offering.subject?.code && `${offering.subject.code} · `}
                        Year {offering.year} · Semester {offering.semester} · Section {offering.section}
                    </p>
                </div>
                <div className="ml-auto">
                    {offering.subject?.type && <TypeBadge type={offering.subject.type} />}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === t.id
                                ? 'bg-white shadow-sm text-gray-900'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}>
                        <t.icon className="w-3.5 h-3.5" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Overview tab */}
            {activeTab === 'info' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: 'Subject Name',  value: offering.subject?.name || '—',       icon: BookOpen },
                        { label: 'Subject Code',  value: offering.subject?.code || '—',       icon: Hash },
                        { label: 'Type',          value: offering.subject?.type || '—',       icon: Layers },
                        { label: 'Year',          value: `Year ${offering.year}`,             icon: GraduationCap },
                        { label: 'Semester',      value: `Semester ${offering.semester}`,     icon: Calendar },
                        { label: 'Section',       value: `Section ${offering.section}`,       icon: Users },
                        { label: 'Sessions Held', value: offering._count?.sessions ?? '—',   icon: CheckCircle },
                        { label: 'Enrolled',      value: offering._count?.enrollments ?? '—', icon: Users },
                        { label: 'Department',    value: offering.subject?.department?.name || '—', icon: FileText },
                    ].map(item => (
                        <div key={item.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                <item.icon className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-medium">{item.label}</p>
                                <p className="text-sm font-bold text-gray-800 mt-0.5">{String(item.value)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Students tab */}
            {activeTab === 'students' && (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {loadingStudents ? (
                        <div className="py-12 text-center text-gray-400 text-sm">Loading students…</div>
                    ) : students.length === 0 ? (
                        <div className="py-12 text-center">
                            <Users className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                            <p className="text-sm text-gray-400">No students enrolled in this subject offering.</p>
                            <p className="text-xs text-gray-300 mt-1">Students are enrolled via the admin panel.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {students.map((s, i) => (
                                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{s.studentId || '—'}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800">{s.fullName}</td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{s.department || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Documents tab */}
            {activeTab === 'docs' && (
                <div className="space-y-4">
                    {/* Upload button */}
                    <div className="flex items-center gap-3">
                        <input ref={fileRef} type="file" className="hidden" onChange={handleUpload}
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip" />
                        <button onClick={() => fileRef.current?.click()} disabled={uploading}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-emerald-800 to-emerald-600 text-white rounded-lg text-sm font-medium
                                hover:bg-[#243557] disabled:opacity-50 transition-colors">
                            <Upload className="w-4 h-4" />
                            {uploading ? 'Uploading…' : 'Upload Material'}
                        </button>
                        <p className="text-xs text-gray-400">PDF, DOC, PPT, XLS, ZIP · Max 20MB</p>
                    </div>

                    {loadingDocs ? (
                        <div className="py-12 text-center text-gray-400 text-sm">Loading documents…</div>
                    ) : docs.length === 0 ? (
                        <div className="py-12 text-center bg-white rounded-xl border border-gray-100">
                            <FileText className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                            <p className="text-sm text-gray-400">No documents uploaded yet.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">File</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Uploaded</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {docs.map(doc => (
                                        <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <span className="font-medium text-gray-800 truncate max-w-[300px]">{doc.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-xs">
                                                {new Date(doc.createdAt).toLocaleDateString('en-IN')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <a href={`${doc.url}`} target="_blank" rel="noreferrer"
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                                        <Eye className="w-4 h-4" />
                                                    </a>
                                                    <a href={`${doc.url}`} download
                                                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition">
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                    <button onClick={() => handleDeleteDoc(doc.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════
   MAIN PAGE
══════════════════════════════════ */
export default function TeacherCourses() {
    const [offerings, setOfferings]   = useState([]);
    const [loading, setLoading]       = useState(true);
    const [selectedOffering, setSelectedOffering] = useState(null);
    const [toasts, setToasts]         = useState([]);

    const addToast = useCallback((type, title, message = '') => {
        const id = Date.now();
        setToasts(p => [...p, { id, type, title, message }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
    }, []);

    const fetchOfferings = useCallback(async () => {
        setLoading(true);
        try {
            // GET /api/courses → returns teacher's SubjectOfferings with subject, docs, count
            const data = await api.get('/courses');
            setOfferings(data || []);
        } catch (err) {
            addToast('error', 'Failed to load courses', err.message);
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => { fetchOfferings(); }, [fetchOfferings]);

    return (
        <DashboardLayout title="Courses" subtitle="Manage your courses">
            {/* Toast container */}
            <div className="fixed top-4 right-4 z-[100] space-y-2 w-80">
                {toasts.map(t => {
                    const Icon = TOAST_ICONS[t.type] || Info;
                    return (
                        <div key={t.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg ${TOAST_COLORS[t.type]}`}>
                            <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold">{t.title}</p>
                                {t.message && <p className="text-xs mt-0.5 opacity-80">{t.message}</p>}
                            </div>
                            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="opacity-50 hover:opacity-100">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {selectedOffering ? (
                <CourseDetail
                    offering={selectedOffering}
                    onBack={() => { setSelectedOffering(null); fetchOfferings(); }}
                    addToast={addToast}
                />
            ) : (
                <div className="space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <BookOpen className="w-6 h-6 text-emerald-800" /> My Courses
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {offerings.length} subject offering{offerings.length !== 1 ? 's' : ''} assigned to you
                            </p>
                        </div>
                    </div>

                    {/* Cards grid */}
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                        </div>
                    ) : offerings.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
                            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                            <p className="text-gray-500 font-medium">No courses assigned yet</p>
                            <p className="text-gray-400 text-sm mt-1">Ask your admin to assign subject offerings to you.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {offerings.map((o, i) => {
                                const CARD_COLORS = [
                                    'from-indigo-500 to-indigo-700',
                                    'from-violet-500 to-violet-700',
                                    'from-blue-500 to-blue-700',
                                    'from-emerald-500 to-emerald-700',
                                    'from-amber-500 to-amber-700',
                                    'from-rose-500 to-rose-700',
                                ];
                                const grad = CARD_COLORS[i % CARD_COLORS.length];
                                return (
                                    <button
                                        key={o.id}
                                        onClick={() => setSelectedOffering(o)}
                                        className="text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden group"
                                    >
                                        {/* Color bar */}
                                        <div className={`h-2 bg-gradient-to-br from-emerald-800 to-emerald-500`} />
                                        <div className="p-5">
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <h3 className="font-bold text-gray-900 text-base leading-tight">
                                                    {o.subject?.name || 'Unnamed Subject'}
                                                </h3>
                                                {o.subject?.type && <TypeBadge type={o.subject.type} />}
                                            </div>
                                            {o.subject?.code && (
                                                <p className="text-xs text-gray-400 font-mono mb-3">{o.subject.code}</p>
                                            )}
                                            <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                                                <span className="flex items-center gap-1">
                                                    <GraduationCap className="w-3.5 h-3.5" />
                                                    Yr {o.year} · Sem {o.semester}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Layers className="w-3.5 h-3.5" />
                                                    Sec {o.section}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs border-t border-gray-100 pt-3">
                                                <div className="flex items-center gap-1.5 text-gray-600">
                                                    <Users className="w-3.5 h-3.5 text-blue-500" />
                                                    <span><strong>{o._count?.enrollments || 0}</strong> enrolled</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-gray-600">
                                                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                                    <span><strong>{o._count?.sessions || 0}</strong> sessions</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-gray-600">
                                                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                                                    <span><strong>{o.documents?.length || 0}</strong> docs</span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </DashboardLayout>
    );
}