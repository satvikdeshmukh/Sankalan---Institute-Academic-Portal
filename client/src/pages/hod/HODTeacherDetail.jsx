import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import {
    ArrowLeft, FileText, Download, FolderOpen, Loader2,
    BookOpen, GraduationCap, BarChart3, TrendingUp, Award, ClipboardList
} from 'lucide-react';
import { useTimetable } from '../../hooks/useTimetable.js';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6'];

function formatSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 cursor-default outline-none";

export default function HODTeacherDetail() {
    const { teacherId } = useParams();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [department, setDepartment] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [performance, setPerformance] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!teacherId) return;
        setLoading(true);
        apiFetch(`/hod/teachers/${teacherId}`)
            .then(data => {
                setProfile(data.profile || null);
                setDepartment(data.department || null);
                setDocuments(data.documents || []);
                setPerformance(data.performance || null);
            })
            .catch(err => console.error('HODTeacherDetail load error', err))
            .finally(() => setLoading(false));
    }, [teacherId]);

    const { entries: timetableEntries } = useTimetable({
        teacherId: teacherId
    });

    // 1. Load Distribution (Sessions by Subject)
    const loadDistribution = React.useMemo(() => {
        const counts = {};
        timetableEntries.forEach(entry => {
            const subjectName = entry.subject?.name || entry.subject || 'Unknown';
            counts[subjectName] = (counts[subjectName] || 0) + 1;
        });
        return Object.entries(counts).map(([name, sessions]) => ({ name, sessions })).sort((a, b) => b.sessions - a.sessions);
    }, [timetableEntries]);

    const handleDownload = (doc) => {
        const url = doc.url;
        if (url) {
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.name || doc.file_name || 'download';
            a.target = '_blank';
            a.click();
        }
    };

    const initials = (profile?.full_name || 'T').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <DashboardLayout title="About Teacher" subtitle="Teacher profile, performance insights and documents">

            {/* Back */}
            <button
                onClick={() => navigate('/hod/teachers')}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-amber-700 font-medium mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Teachers
            </button>

            {loading ? (
                <div className="flex justify-center py-24">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6 items-start">

                    {/* ── Left: Avatar Card ── */}
                    <div className="w-full lg:w-56 flex-shrink-0 space-y-4">
                        <div className="bg-white rounded-2xl shadow-card p-6 flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg mb-4 ring-4 ring-indigo-50">
                                {profile?.profilePhoto ? (
                                    <img
                                        src={profile.profilePhoto.startsWith('http') ? profile.profilePhoto : `http://localhost:3001${profile.profilePhoto}`}
                                        alt={profile?.full_name || ''}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-[linear-gradient(135deg,_rgb(180,83,9)_0%,_rgb(217,119,6)_100%)] flex items-center justify-center text-white font-bold text-3xl">
                                        {initials}
                                    </div>
                                )}
                            </div>
                            <h2 className="font-bold text-gray-900 text-base leading-tight">
                                {profile?.full_name || '—'}
                            </h2>
                            <p className="text-sm text-amber-700 font-semibold mt-0.5">
                                {department?.name || '—'}
                            </p>
                            <div className="mt-3 text-xs text-gray-500 space-y-0.5 text-left w-full border-t border-gray-100 pt-3">
                                <p><span className="font-medium text-gray-600">Role:</span> Teacher</p>
                                {profile?.email && (
                                    <p className="break-all">
                                        <span className="font-medium text-gray-600">Email:</span>{' '}
                                        {profile.email}
                                    </p>
                                )}
                                {profile?.phone && (
                                    <p><span className="font-medium text-gray-600">Phone:</span> {profile.phone}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Performance + Info + Documents ── */}
                    <div className="flex-1 space-y-6">

                        {/* ── Performance Summary ── */}
                        {performance && (
                            <div className="bg-white rounded-2xl shadow-card p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-base">
                                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                                    Performance Summary
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                    {[
                                        { icon: BookOpen, label: 'Subjects', value: performance.subject_count, color: 'text-blue-600', bg: 'bg-blue-50', iconColor: 'text-blue-500' },
                                        { icon: GraduationCap, label: 'Students', value: performance.student_count, color: 'text-emerald-600', bg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
                                        { icon: BarChart3, label: 'Avg Attendance', value: performance.avg_attendance != null ? `${performance.avg_attendance}%` : '—', color: performance.avg_attendance >= 75 ? 'text-emerald-600' : 'text-amber-600', bg: performance.avg_attendance >= 75 ? 'bg-emerald-50' : 'bg-amber-50', iconColor: 'text-amber-500' },
                                        { icon: Award, label: 'Avg Marks', value: performance.avg_marks ?? '—', color: 'text-purple-600', bg: 'bg-purple-50', iconColor: 'text-purple-500' },
                                        { icon: ClipboardList, label: 'Reports', value: performance.total_reports, color: 'text-indigo-600', bg: 'bg-indigo-50', iconColor: 'text-indigo-500' },
                                    ].map((stat, i) => (
                                        <div key={i} className={`${stat.bg} rounded-xl p-3 text-center`}>
                                            <stat.icon className={`w-5 h-5 mx-auto mb-1.5 ${stat.iconColor}`} />
                                            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                                            <p className="text-[10px] text-gray-500 font-medium mt-0.5">{stat.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Subjects taught list */}
                                {performance.subjects_taught && performance.subjects_taught.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-xs font-semibold text-gray-500 mb-2">Subjects Taught</p>
                                        <div className="flex flex-wrap gap-2">
                                            {performance.subjects_taught.map((sub, i) => (
                                                <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                                                    {sub}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Personal Information */}
                        <div className="bg-white rounded-2xl shadow-card p-6">
                            <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2 text-base">
                                👤 Personal Information
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                                    <input readOnly value={profile?.full_name || ''} className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                                    <input readOnly value={profile?.email || ''} className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                                    <input readOnly value={profile?.phone || ''} placeholder="Not provided" className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Designation</label>
                                    <input readOnly value={profile?.designation || ''} placeholder="Not provided" className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Qualifications</label>
                                    <input readOnly value={profile?.qualifications || ''} placeholder="Not provided" className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Experience</label>
                                    <input readOnly value={profile?.experience || ''} placeholder="Not provided" className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Date of Joining</label>
                                    <input readOnly value={profile?.joiningDate || ''} placeholder="Not provided" className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
                                    <input readOnly value={department?.name || ''} placeholder="—" className={inputCls} />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Bio</label>
                                    <textarea
                                        readOnly
                                        value={profile?.bio || ''}
                                        placeholder="No bio added"
                                        rows={3}
                                        className={`${inputCls} resize-none`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Load Distribution Chart */}
                        <div className="bg-white rounded-2xl shadow-card p-6">
                            <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2 text-base">
                                <BarChart3 className="w-5 h-5 text-indigo-500" />
                                Teacher Load Distribution (By Subject)
                            </h3>
                            {loadDistribution.length > 0 ? (
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={loadDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                                            <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                                cursor={{ fill: '#f3f4f6' }}
                                            />
                                            <Bar dataKey="sessions" radius={[6, 6, 0, 0]} maxBarSize={40}>
                                                {loadDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-48 flex items-center justify-center text-gray-400 italic text-sm">No load distribution data available.</div>
                            )}
                        </div>

                        {/* Documents */}
                        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-500" />
                                    <h3 className="font-semibold text-gray-900">Documents</h3>
                                </div>
                                <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-lg">
                                    {documents.length} file{documents.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {documents.length === 0 ? (
                                <div className="flex flex-col items-center py-16 text-gray-400">
                                    <FolderOpen className="w-11 h-11 mb-3 opacity-25" />
                                    <p className="text-sm font-medium">No documents uploaded yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {documents.map(doc => (
                                        <div key={doc.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                                            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                                                <FileText className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-900 truncate">{doc.name || doc.file_name}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {formatSize(doc.size || doc.file_size)} • {fmtDate(doc.createdAt || doc.created_at)}
                                                </p>
                                            </div>
                                            {doc.url && (
                                                <button
                                                    onClick={() => handleDownload(doc)}
                                                    title="Download"
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
