import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api.js';
import socket from '../../lib/socket.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import {
    ArrowLeft, Building2, Users, GraduationCap,
    Mail, Phone, User, ChevronRight, Search, Loader2
} from 'lucide-react';

const P_GRAD = 'linear-gradient(135deg, rgb(127,29,29) 0%, rgb(190,18,60) 40%, rgb(225,29,72) 75%, rgb(251,113,133) 100%)';
export default function PrincipalDepartmentDetail() {
    const { deptId } = useParams();
    const navigate = useNavigate();

    const [dept, setDept] = useState(null);
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('teachers');
    const [search, setSearch] = useState('');
    const [yearFilter, setYearFilter] = useState('');
const [sectionFilter, setSectionFilter] = useState('');

    const load = useCallback(async () => {
        if (!deptId) return;
        setLoading(true);
        try {
            // Fetch stats (departments + teachers already enriched)
            const [statsData, studentsData] = await Promise.all([
                apiFetch('/principal/stats'),
                apiFetch(`/students?departmentId=${deptId}`).catch(() => []),
            ]);

            // Find this department
            const deptInfo = (statsData?.departments || []).find(d => d.id === deptId);
            setDept(deptInfo || null);

            // Teachers for this department (from stats, filter by dept id or name)
            const allTeachers = statsData?.teachers || [];
            const deptTeachers = allTeachers.filter(t =>
                t.department_id === deptId ||
                (deptInfo && t.department_name === deptInfo.name)
            );
            setTeachers(deptTeachers);

            // Students
            setStudents(Array.isArray(studentsData) ? studentsData : []);
        } catch (err) {
            console.error('DeptDetail load error:', err);
        } finally {
            setLoading(false);
        }
    }, [deptId]);

    useEffect(() => {
        load();
        // Real-time: refresh when teacher or student data changes
        socket.on('user_change', load);
        socket.on('teacher_change', load);
        socket.on('student_change', load);
        return () => {
            socket.off('user_change', load);
            socket.off('teacher_change', load);
            socket.off('student_change', load);
        };
    }, [load]);

    const q = search.toLowerCase();
    const filteredTeachers = teachers.filter(t =>
        (t.full_name || t.fullName || '')?.toLowerCase().includes(q) ||
        (t.email || '')?.toLowerCase().includes(q)
    );
    const filteredStudents = students.filter(s => {
    const matchesSearch =
        s.fullName?.toLowerCase().includes(q) ||
        s.studentId?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q);

    const matchesYear =
        !yearFilter || String(s.year) === String(yearFilter);

    const matchesSection =
        !sectionFilter || s.section === sectionFilter;

    return matchesSearch && matchesYear && matchesSection;
});

    return (
        <DashboardLayout
            title={dept?.name || 'Department'}
            subtitle={loading ? 'Loading…' : `${teachers.length} teacher${teachers.length !== 1 ? 's' : ''}  •  ${students.length} student${students.length !== 1 ? 's' : ''}`}
        >
            {/* Back */}
            <button
                onClick={() => navigate('/principal/departments')}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 font-medium mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Departments
            </button>

            {loading ? (
                <div className="flex justify-center py-24">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                </div>
            ) : (
                <div className="space-y-5">

                    {/* Department Header Card */}
                    <div className="bg-white rounded-2xl shadow-card p-5 flex flex-wrap items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow" style={{ background: P_GRAD }}>
                            <Building2 className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="font-bold text-gray-900 text-lg">{dept?.name}</h2>
                            {(dept?.hod_name || dept?.hod_email) && (
                                <p className="text-sm text-gray-500 mt-0.5">
                                    HOD: <span className="font-medium text-gray-700">{dept.hod_name}</span>
                                    {dept.hod_email && <span className="text-gray-400"> · {dept.hod_email}</span>}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <div className="text-center px-4 py-2 bg-emerald-50 rounded-xl">
                                <p className="text-2xl font-bold text-emerald-700">{teachers.length}</p>
                                <p className="text-xs text-gray-500">Teachers</p>
                            </div>
                            <div className="text-center px-4 py-2 bg-sky-50 rounded-xl">
                                <p className="text-2xl font-bold text-sky-700">{students.length}</p>
                                <p className="text-xs text-gray-500">Students</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs + Search */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex bg-gray-100 rounded-xl p-1 w-fit">
                            {[
                                { key: 'teachers', label: 'Teachers', icon: Users, count: teachers.length },
                                { key: 'students', label: 'Students', icon: GraduationCap, count: students.length },
                            ].map(({ key, label, icon: Icon, count }) => (
                                <button
                                    key={key}
                                    onClick={() => { setTab(key); setSearch(''); }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                    <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${tab === key ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
                                        }`}>{count}</span>
                                </button>
                            ))}
                        </div>

                        <div className="relative">
                            <div className="flex items-center gap-3 flex-wrap">

    {/* Year Filter */}
  {tab === 'students' ? (
    <div className="flex items-center gap-3 flex-wrap">

        {/* Year Filter */}
        <select
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
        >
            <option value="">All Years</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
        </select>

        {/* Section Filter */}
        <select
            value={sectionFilter}
            onChange={e => setSectionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
        >
            <option value="">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
        </select>

        {/* Search */}
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search students..."
                className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-56"
            />
        </div>

    </div>
) : (
    <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search teachers..."
            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-56"
        />
    </div>
)}

</div>
                        </div>
                    </div>

                    {/* ── Teachers Tab ── */}
                    {tab === 'teachers' && (
                        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                            {filteredTeachers.length === 0 ? (
                                <div className="flex flex-col items-center py-16 text-gray-400">
                                    <Users className="w-11 h-11 mb-3 opacity-25" />
                                    <p className="text-sm font-medium">No teachers found</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {filteredTeachers.map(t => {
                                        const name = t.full_name || t.fullName || '—';
                                        const uid = t.id || t.user_id;
                                        return (
                                            <div
                                                key={uid}
                                                onClick={() => navigate(`/principal/teachers/${uid}`)}
                                                className="flex items-center gap-4 px-5 py-3.5 hover:bg-emerald-50 cursor-pointer transition-colors group"
                                            >
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: P_GRAD }}>
                                                    {name[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold text-gray-900 text-sm group-hover:text-emerald-700 transition-colors">{name}</p>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                                                        {t.email && (
                                                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                                                <Mail className="w-3 h-3" />{t.email}
                                                            </span>
                                                        )}
                                                        {t.phone && (
                                                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                                                <Phone className="w-3 h-3" />{t.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Students Tab ── */}
                    {tab === 'students' && (
                        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                            {filteredStudents.length === 0 ? (
                                <div className="flex flex-col items-center py-16 text-gray-400">
                                    <GraduationCap className="w-11 h-11 mb-3 opacity-25" />
                                    <p className="text-sm font-medium">No students found</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-100">
                                            <tr>
                                                {['#', 'Name', 'Roll No.', 'Email', 'Year / Sem', 'Section'].map(h => (
                                                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredStudents.map((s, idx) => (
                                                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-5 py-3 text-gray-400 text-xs">{idx + 1}</td>
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-2.5">
                                                            
                                                            <span className="font-medium text-gray-900">
    {s.fullName || s.profile?.fullName || '—'}
</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 text-gray-600 font-mono text-xs">{s.studentId || s.rollNo || '—'}</td>
                                                    <td className="px-5 py-3 text-gray-500 text-xs">{s.email || '—'}</td>
                                                    <td className="px-5 py-3 text-gray-500 text-xs">
                                                        {[s.year, s.semester ? `Sem ${s.semester}` : null].filter(Boolean).join(' · ') || '—'}
                                                    </td>
                                                    <td className="px-5 py-3 text-gray-500 text-xs">{s.section || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            )}
        </DashboardLayout>
    );
}
