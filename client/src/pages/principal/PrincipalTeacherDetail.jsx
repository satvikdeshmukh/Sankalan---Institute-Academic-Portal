import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api.js';
import { useTimetable } from '../../hooks/useTimetable.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { ArrowLeft, FileText, Download, FolderOpen, Loader2, BookOpen, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const P_GRAD = 'linear-gradient(135deg, rgb(127,29,29) 0%, rgb(190,18,60) 40%, rgb(225,29,72) 75%, rgb(251,113,133) 100%)';
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

export default function PrincipalTeacherDetail() {
    const { teacherId } = useParams();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [department, setDepartment] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!teacherId) return;
        setLoading(true);
        setError(null);

        // Use principal endpoint which is accessible by principal role
        apiFetch(`/principal/user/${teacherId}`)
            .then(data => {
                setProfile(data.profile || null);
                setDepartment(data.department || null);
                setDocuments(data.documents || []);
            })
            .catch(err => {
                console.error('TeacherDetail load error:', err);
                setError('Failed to load teacher profile');
            })
            .finally(() => setLoading(false));
    }, [teacherId]);

    // Fetch timetable for load distribution
    const { entries: timetableEntries } = useTimetable({ teacherId });

    const loadDistribution = useMemo(() => {
        const counts = {};
        timetableEntries.forEach(entry => {
            const subj = entry.subject || 'Unknown';
            counts[subj] = (counts[subj] || 0) + 1;
        });
        return Object.entries(counts).map(([name, sessions]) => ({
            name: name.length > 12 ? name.slice(0, 10) + '..' : name,
            fullName: name,
            sessions
        }));
    }, [timetableEntries]);


    const handleDownload = (doc) => {
        if (doc.url) {
            const a = document.createElement('a');
            a.href = doc.url;
            a.download = doc.name || doc.file_name || 'document';
            a.target = '_blank';
            a.click();
        }
    };

    const name = profile?.full_name || profile?.fullName || '—';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'T';

    return (
        <DashboardLayout title="About Teacher" subtitle="Teacher profile and uploaded documents">
            <button
                onClick={() => navigate('/principal/teachers')}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-[rgb(190,18,60)] font-medium mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Teachers
            </button>

            {loading ? (
                <div className="flex justify-center py-24">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                </div>
            ) : error ? (
                <div className="text-center py-20 text-red-500 text-sm">{error}</div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6 items-start">

                    {/* ── Left: Avatar Card ── */}
                    <div className="w-full lg:w-56 flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-card p-6 flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg mb-4 ring-4 ring-emerald-50">
                                {profile?.profilePhoto ? (
                                    <img
                                        src={profile.profilePhoto.startsWith('http') ? profile.profilePhoto : `http://localhost:3001${profile.profilePhoto}`}
                                        alt={name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-3xl" style={{ background: P_GRAD }}>
                                        {initials}
                                    </div>
                                )}
                            </div>
                            <h2 className="font-bold text-gray-900 text-base leading-tight">{name}</h2>
                            <p className="text-sm text-[rgb(190,18,60)]  font-semibold mt-0.5">
                                {department?.name || profile?.department || '—'}
                            </p>
                            <div className="mt-3 text-xs text-gray-500 space-y-0.5 text-left w-full border-t border-gray-100 pt-3">
                                <p><span className="font-medium text-gray-600">Role:</span> Teacher</p>
                                {profile?.email && (
                                    <p className="break-all"><span className="font-medium text-gray-600">Email:</span> {profile.email}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Info + Documents ── */}
                    <div className="flex-1 space-y-6">

                        {/* Personal Information */}
                        <div className="bg-white rounded-2xl shadow-card p-6">
                            <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2 text-base">👤 Personal Information</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                                    <input readOnly value={name !== '—' ? name : ''} className={inputCls} />
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
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
                                    <input readOnly value={department?.name || profile?.department || ''} placeholder="—" className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Qualifications</label>
                                    <input readOnly value={profile?.qualifications || ''} placeholder="Not provided" className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Experience</label>
                                    <input readOnly value={profile?.experience || profile?.experience_years || ''} placeholder="—" className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Date of Joining</label>
                                    <input readOnly value={profile?.joiningDate || ''} placeholder="Not provided" className={inputCls} />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Bio</label>
                                    <textarea readOnly value={profile?.bio || ''} placeholder="No bio added" rows={3} className={`${inputCls} resize-none`} />
                                </div>
                            </div>
                        </div>

                        {/* Teacher Load Distribution */}
                        <div className="bg-white rounded-2xl shadow-card p-6">
                            <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2 text-base">📊 Teaching Load Distribution</h3>
                            {timetableEntries.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 text-sm">No active teaching assignments found</div>
                            ) : (
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={loadDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                            <Tooltip
                                                cursor={{ fill: '#f9fafb' }}
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="bg-white p-3 shadow-lg rounded-xl border border-gray-100">
                                                                <p className="text-xs font-bold text-gray-800 mb-1">{payload[0].payload.fullName}</p>
                                                                <p className="text-xs text-emerald-600 font-medium">{payload[0].value} Sessions / Week</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar dataKey="sessions" radius={[6, 6, 0, 0]} maxBarSize={40}>
                                                {loadDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][index % 5]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                                <div className="p-3 bg-gray-50 rounded-xl">
                                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Total Sessions</p>
                                    <p className="text-lg font-black text-gray-900">{timetableEntries.length}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl">
                                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Subjects</p>
                                    <p className="text-lg font-black text-gray-900">{loadDistribution.length}</p>
                                </div>
                            </div>
                        </div>

                        {/* Documents */}
                        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-emerald-500" />
                                    <h3 className="font-semibold text-gray-900">My Documents</h3>
                                </div>
                                <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-lg">
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
                                            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                                <FileText className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-900 truncate">{doc.name || doc.file_name}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {formatSize(doc.size || doc.file_size)} • {fmtDate(doc.createdAt || doc.created_at)}
                                                </p>
                                            </div>
                                            {doc.url && (
                                                <button onClick={() => handleDownload(doc)} title="Download"
                                                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
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
