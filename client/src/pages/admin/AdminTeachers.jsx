import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../lib/api.js';
import socket from '../../lib/socket.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import {
    Users, Search, X, Mail, Building2,
    RefreshCw, BookOpen, Phone, Calendar, Eye, Star
} from 'lucide-react';

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

export default function AdminTeachers() {
    const [teachers, setTeachers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Filters
    const [search, setSearch] = useState('');
    const [deptF, setDeptF] = useState('');

    // Profile modal
    const [profileModal, setProfileModal] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);

    const showToast = (type, title, message) => {
        setToast({ type, title, message });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [tchrs, depts] = await Promise.all([
                api.get('/admin/teachers'),
                api.get('/auth/departments'),
            ]);
            setTeachers(Array.isArray(tchrs) ? tchrs : []);
            setDepartments(Array.isArray(depts) ? depts : []);
        } catch (err) {
            showToast('error', 'Load failed', err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
        // Real-time: refetch when users change (new teacher registered, etc.)
        socket.on('user_change', fetchAll);
        return () => socket.off('user_change', fetchAll);
    }, [fetchAll]);

    // Filtered list
    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return teachers.filter(t => {
            if (deptF && t.departmentId !== deptF) return false;
            if (q) {
                const match = [t.fullName, t.email, t.departmentName, t.phone]
                    .map(v => (v || '').toLowerCase())
                    .some(v => v.includes(q));
                if (!match) return false;
            }
            return true;
        });
    }, [teachers, deptF, search]);

    const clearFilters = () => { setSearch(''); setDeptF(''); };
    const hasFilters = search || deptF;

    // Department-wise counts
    const deptCounts = useMemo(() => {
        const counts = {};
        teachers.forEach(t => {
            const name = t.departmentName || 'Unassigned';
            counts[name] = (counts[name] || 0) + 1;
        });
        return counts;
    }, [teachers]);

    return (
        <DashboardLayout title="Teachers" subtitle="View all department teachers across the institution">
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            <div className="space-y-5">
                {/* Department stat pills */}
                

                {/* Search + Filter */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search name, email, phone, department…"
                                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <select value={deptF} onChange={e => setDeptF(e.target.value)}
                            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">All Departments</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        {hasFilters && (
                            <button onClick={clearFilters}
                                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200">
                                <X className="w-3.5 h-3.5" /> Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            {filtered.length} Teacher{filtered.length !== 1 ? 's' : ''} {hasFilters ? '(filtered)' : ''}
                        </span>
                        <button onClick={fetchAll} className="text-gray-400 hover:text-gray-700 transition-colors">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['#', 'Name', 'Email', 'Phone', 'Department', 'Subjects', 'Joined', ''].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-6 bg-gray-100 rounded animate-pulse" /></td></tr>
                                )) : filtered.map((t, idx) => (
                                    <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">{idx + 1}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                
                                                <div>
                                                    <span className="font-semibold text-gray-900 text-sm">{t.fullName}</span>
                                                    {t.isBlocked && (
                                                        <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded">BLOCKED</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">
                                            {t.email ? (
                                                <a href={`mailto:${t.email}`} className="flex items-center gap-1 text-indigo-600 hover:underline">
                                                    <Mail className="w-3 h-3" />{t.email}
                                                </a>
                                            ) : <span className="text-gray-400">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">
                                            {t.phone ? (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3 text-gray-400" />{t.phone}
                                                </span>
                                            ) : <span className="text-gray-400">—</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold">
                                                <Building2 className="w-3 h-3" /> {t.departmentName}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {t.subjectCount > 0 ? (
                                                <div className="flex items-center gap-1">
                                                    <BookOpen className="w-3 h-3 text-gray-400" />
                                                    <span className="text-xs text-gray-600 font-semibold">{t.subjectCount}</span>
                                                    <span className="text-[10px] text-gray-400 truncate max-w-[120px]" title={t.subjects.join(', ')}>
                                                        ({t.subjects.slice(0, 2).join(', ')}{t.subjects.length > 2 ? '…' : ''})
                                                    </span>
                                                </div>
                                            ) : <span className="text-gray-400 text-xs">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button onClick={async () => {
                                                setProfileModal(t); setProfileLoading(true);
                                                try {
                                                    const data = await api.get(`/admin/teacher-profile/${t.id}`);
                                                    setProfileData(data);
                                                } catch { setProfileData(null); }
                                                finally { setProfileLoading(false); }
                                            }}
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="View Performance">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="text-center py-16 text-gray-400">
                                            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                            <p className="font-semibold text-sm">No teachers found</p>
                                            {hasFilters && <p className="text-xs mt-1">Try clearing your filters</p>}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Performance Profile Modal */}
            {profileModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600">
                            <div>
                                <h3 className="font-bold text-white text-lg">{profileModal.fullName}</h3>
                                <p className="text-indigo-200 text-xs">{profileModal.departmentName} • {profileModal.email}</p>
                            </div>
                            <button onClick={() => { setProfileModal(null); setProfileData(null); }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            {profileLoading ? (
                                <div className="text-center py-8"><div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mx-auto" /></div>
                            ) : profileData ? (
                                <>
                                    {/* Attendance */}
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">📊 Weighted Attendance</h4>
                                            <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-1.5 py-0.5 rounded">AUTO</span>
                                        </div>
                                        <div className="flex items-end gap-3">
                                            <div className="text-4xl font-black text-indigo-600 leading-none">{profileData.attendance?.overall || '—'}<span className="text-lg">%</span></div>
                                            <div className="text-[10px] text-gray-500 pb-1">
                                                <p className="font-semibold">{profileData.attendance?.presentDays || 0} days recorded</p>
                                                <p>Weighted monthly average</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Feedback Rating */}
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">⭐ Student Feedback</h4>
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <Star key={i} className={`w-4 h-4 ${i <= Math.round(profileData.feedback?.avgRating || 0) ? 'text-amber-400' : 'text-gray-200'}`}
                                                        fill={i <= Math.round(profileData.feedback?.avgRating || 0) ? 'currentColor' : 'none'} />
                                                ))}
                                            </div>
                                            <span className="text-xl font-bold text-gray-700">{profileData.feedback?.avgRating || '—'}</span>
                                            <span className="text-[10px] text-gray-400 font-medium">({profileData.feedback?.count || 0} reviews)</span>
                                        </div>
                                    </div>

                                    {/* Performance Stats */}
                                    {profileData.performance ? (
                                        <div className="space-y-4">
                                            {/* Pass Rate Card */}
                                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-4 text-white shadow-lg overflow-hidden relative">
                                                <div className="absolute top-0 right-0 p-3 opacity-10">
                                                    <BookOpen className="w-16 h-16" />
                                                </div>
                                                <div className="relative z-10">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="text-xs font-bold text-blue-100 uppercase tracking-widest">📈 Examination Performance</h4>
                                                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm font-bold">
                                                            AY {profileData.performance.academicYear}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-end justify-between">
                                                        <div>
                                                            <div className="text-4xl font-black">{profileData.performance.passRate || '—'}<span className="text-xl">%</span></div>
                                                            <p className="text-[10px] text-blue-100 mt-1 font-medium italic">Calculated from subjects & marks</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xl font-bold">{profileData.performance.passedStudents}</p>
                                                            <p className="text-[10px] text-blue-100">Passed / {profileData.performance.appearedStudents} Appeared</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-400 rounded-full transition-all duration-1000" 
                                                             style={{ width: `${profileData.performance.passRate || 0}%` }} />
                                                    </div>
                                                    <p className="mt-2 text-[10px] text-blue-50 font-medium">Total Enrollment: {profileData.performance.totalEnrollments} students</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                                                    <h4 className="text-[10px] font-bold text-emerald-600 uppercase mb-1">🎓 Prof Dev</h4>
                                                    <p className="text-xl font-black text-emerald-800">{profileData.performance.trainingsCompleted}</p>
                                                    <p className="text-[10px] text-emerald-600 font-medium">Trainings Completed</p>
                                                </div>
                                                <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                                                    <h4 className="text-[10px] font-bold text-purple-600 uppercase mb-1">🏛️ Responsibilities</h4>
                                                    <p className="text-xl font-black text-purple-800">
                                                        {(profileData.performance.committeesParticipated || 0) + (profileData.performance.eventsOrganized || 0) + (profileData.performance.studentsMentored || 0)}
                                                    </p>
                                                    <p className="text-[10px] text-purple-600 font-medium">Active engagements</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                            <p className="text-sm font-bold text-gray-400">Academic Records Missing</p>
                                            <p className="text-[10px] text-gray-400 mt-1 max-w-[200px] mx-auto">Teacher has no subject offerings or manually saved reports for the current period</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-8 text-gray-400">Failed to load performance data</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
