import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { api } from '../../lib/api.js';
import socket from '../../lib/socket.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { Users, Star, Loader2, BarChart3, Search, ChevronDown, PlusCircle, CalendarDays, MessageSquare, ClipboardList, CheckCircle2, ArrowLeft, BookOpen, Layers } from 'lucide-react';
import {
    ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const HERO_GRAD = 'linear-gradient(135deg, rgb(120,53,15) 0%, rgb(180,83,9) 40%, rgb(217,119,6) 75%, rgb(251,191,36) 100%)';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500';
const lbl = 'text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1';

export default function HODTeacherPerformance() {
    const { user } = useAuth();
    const deptId = user?.departmentId;
    const [teachers, setTeachers] = useState([]);
    const [summaryData, setSummaryData] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [perfData, setPerfData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(true);
    const [teacherSearch, setTeacherSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Input panel state
    const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'feedback' | 'perf'
    const [inputMsg, setInputMsg] = useState('');
    const [inputErr, setInputErr] = useState('');
    const [inputLoading, setInputLoading] = useState(false);

    // Attendance form
    const now = new Date();
    const [attMonth, setAttMonth] = useState(String(now.getMonth() + 1));
    const [attYear, setAttYear] = useState(String(now.getFullYear()));
    const [attPct, setAttPct] = useState('');

    // Feedback form
    const [fbRating, setFbRating] = useState(0);
    const [fbHover, setFbHover] = useState(0);
    const [fbComment, setFbComment] = useState('');
    const [fbSemester, setFbSemester] = useState('');

    // Performance form
    const [perfYear, setPerfYear] = useState(`${now.getFullYear() - 1}-${String(now.getFullYear()).slice(2)}`);
    const [perfFormData, setPerfFormData] = useState({
        totalStudents: '', passedStudents: '',
        trainingsCompleted: '', trainingDetails: '',
        committeesParticipated: '', eventsOrganized: '', studentsMentored: '',
        adminResponsibilityNotes: '',
    });

    const fetchTeachers = useCallback(async () => {
        setListLoading(true);
        try {
            // Fetch performance summary if deptId is available
            if (deptId) {
                const summary = await api.get(`/teacher-performance/department/${deptId}`);
                if (Array.isArray(summary)) {
                    setSummaryData(summary);
                    // Use summary to populate the simple teachers list for the cards
                    setTeachers(summary.map(s => ({
                        id: s.id,
                        email: s.email,
                        profile: { fullName: s.fullName },
                        department: { name: user?.department || 'Department' }
                    })));
                }
            } else {
                // Fallback for non-HOD/Admin or if deptId is missing
                const data = await api.get('/auth/users?role=TEACHER');
                setTeachers(Array.isArray(data) ? data : []);
            }
        } catch (err) { 
            console.error('Fetch error:', err);
            setTeachers([]); 
            setSummaryData([]); 
        }
        finally { setListLoading(false); }
    }, [deptId, user?.department]);

    useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

    useEffect(() => {
        const handler = () => { if (selectedId) fetchPerf(selectedId); };
        socket.on('teacher_attendance_change', handler);
        socket.on('teacher_feedback_change', handler);
        socket.on('teacher_perf_change', handler);
        return () => {
            socket.off('teacher_attendance_change', handler);
            socket.off('teacher_feedback_change', handler);
            socket.off('teacher_perf_change', handler);
        };
    }, [selectedId]);

    useEffect(() => {
        const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchPerf = async (id) => {
        setLoading(true);
        try {
            const data = await api.get(`/teacher-performance/${id}`);
            setPerfData(data);
        } catch { setPerfData(null); }
        finally { setLoading(false); }
    };

    const handleSelect = (id) => {
        setSelectedId(id);
        setShowDropdown(false);
        const t = teachers.find(t => t.id === id);
        setTeacherSearch(t ? (t.profile?.fullName || t.email) : '');
        setInputMsg(''); setInputErr('');
        if (id) fetchPerf(id);
        else setPerfData(null);
    };

    const filteredTeacherList = useMemo(() => {
        const q = teacherSearch.toLowerCase().trim();
        if (!q) return teachers;
        return teachers.filter(t => {
            const name = (t.profile?.fullName || t.email || '').toLowerCase();
            const dept = (t.department?.name || '').toLowerCase();
            return name.includes(q) || dept.includes(q);
        });
    }, [teachers, teacherSearch]);

    const attChartData = useMemo(() => {
        if (!perfData?.attendance?.monthly) return [];
        return perfData.attendance.monthly.map(m => ({ month: m.month, 'Attendance %': parseFloat(m.percentage) }));
    }, [perfData]);

    const feedbackChartData = useMemo(() => {
        if (!perfData?.feedback?.history?.length) return [];
        return perfData.feedback.history.slice(0, 10).reverse().map((f, i) => ({
            name: f.semester || `#${i + 1}`, Rating: f.rating,
        }));
    }, [perfData]);

    const passRateData = useMemo(() => {
        if (!perfData?.performance?.current) return [];
        const p = perfData.performance.current;
        // Use appearedStudents as the base for the pie chart
        const total = p.appearedStudents || 0;
        if (total === 0) return [];
        
        return [
            { name: 'Passed', value: p.passedStudents || 0 },
            { name: 'Failed', value: p.failedStudents || 0 },
        ];
    }, [perfData]);

    const radarData = useMemo(() => {
        if (!perfData?.breakdown) return [];
        const b = perfData.breakdown;
        return [
            { metric: 'Attendance', score: b.attendance },
            { metric: 'Feedback', score: b.feedback },
            { metric: 'Trainings', score: b.trainings },
            { metric: 'Pass Rate', score: b.passRate },
            { metric: 'Responsibilities', score: b.responsibilities },
        ];
    }, [perfData]);

    const workloadChartData = useMemo(() => {
        if (!perfData?.workload?.breakdown) return [];
        return perfData.workload.breakdown.map(b => ({
            subject: b.name,
            Lectures: b.count
        }));
    }, [perfData]);

    const handleAttendanceSubmit = async (e) => {
        e.preventDefault();
        if (!selectedId) return setInputErr('Select a teacher first');
        setInputLoading(true); setInputMsg(''); setInputErr('');
        try {
            await api.post(`/teacher-performance/${selectedId}/attendance`, {
                month: parseInt(attMonth), year: parseInt(attYear), percentage: parseFloat(attPct)
            });
            setInputMsg('✅ Attendance saved successfully');
            setAttPct('');
            fetchPerf(selectedId);
        } catch (err) { setInputErr(err.message || 'Failed to save attendance'); }
        finally { setInputLoading(false); }
    };

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        if (!selectedId) return setInputErr('Select a teacher first');
        if (!fbRating) return setInputErr('Select a rating (1-5 stars)');
        setInputLoading(true); setInputMsg(''); setInputErr('');
        try {
            await api.post(`/teacher-performance/${selectedId}/feedback`, {
                rating: fbRating, comment: fbComment, semester: fbSemester
            });
            setInputMsg('✅ Feedback saved successfully');
            setFbRating(0); setFbComment(''); setFbSemester('');
            fetchPerf(selectedId);
        } catch (err) { setInputErr(err.message || 'Failed to save feedback'); }
        finally { setInputLoading(false); }
    };

    const handlePerfSubmit = async (e) => {
        e.preventDefault();
        if (!selectedId) return setInputErr('Select a teacher first');
        if (!perfYear) return setInputErr('Academic year is required');
        setInputLoading(true); setInputMsg(''); setInputErr('');
        try {
            await api.post(`/teacher-performance/${selectedId}/performance`, {
                academicYear: perfYear, ...perfFormData
            });
            setInputMsg('✅ Performance data saved successfully');
            fetchPerf(selectedId);
        } catch (err) { setInputErr(err.message || 'Failed to save performance data'); }
        finally { setInputLoading(false); }
    };

    const pf = (k) => (v) => setPerfFormData(f => ({ ...f, [k]: v }));

    const yearOptions = Array.from({ length: 6 }, (_, i) => {
        const y = now.getFullYear() - 2 + i;
        return `${y}-${String(y + 1).slice(2)}`;
    });

    return (
        <DashboardLayout title="Teacher Performance" subtitle="Analyze teacher performance metrics across your department">
            <div className="space-y-5">
                {/* Teacher selector */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Select Teacher</label>
                    <div className="relative w-full max-w-md" ref={dropdownRef}>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={teacherSearch}
                                onChange={e => { setTeacherSearch(e.target.value); setShowDropdown(true); if (!e.target.value) { setSelectedId(''); setPerfData(null); } }}
                                onFocus={() => setShowDropdown(true)}
                                placeholder="Search teacher by name…"
                                className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                        </div>
                        {showDropdown && (
                            <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                {filteredTeacherList.length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-gray-400">No teachers found</div>
                                ) : filteredTeacherList.map(t => (
                                    <button key={t.id} onClick={() => handleSelect(t.id)}
                                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors flex items-center gap-2 ${selectedId === t.id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700'}`}>
                                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-black flex-shrink-0">
                                            {((t.profile?.fullName || t.email)?.[0] || '?').toUpperCase()}
                                        </div>
                                        <div>{t.profile?.fullName || t.email} <span className="text-xs text-gray-400">({t.department?.name || ''})</span></div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Teacher Cards */}
                {!selectedId && !listLoading && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {teachers.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => handleSelect(t.id)}
                                    className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[linear-gradient(135deg,_rgb(180,83,9)_0%,_rgb(217,119,6)_100%)] flex items-center justify-center text-white font-bold">
                                            {((t.profile?.fullName || t.email)?.[0] || '?').toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate">
                                                {t.profile?.fullName || t.email}
                                            </h3>
                                            <p className="text-xs text-gray-500 truncate">
                                                {t.department?.name || 'Department'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                                        <span>View Performance</span>
                                        <BarChart3 className="w-4 h-4 text-indigo-500"/>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Department Workload Summary */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-6">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-indigo-500" />
                                    <h3 className="text-base font-bold text-gray-900">Department Workload Distribution</h3>
                                </div>
                                <div className="text-xs text-gray-400 font-medium bg-white px-2 py-1 rounded-md border border-gray-100">
                                    Comparative Weekly Overview
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-white border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                                            <th className="px-6 py-4">Teacher Name</th>
                                            <th className="px-6 py-4">Subjects Taught</th>
                                            <th className="px-6 py-4">Periods / Week</th>
                                            <th className="px-6 py-4">Load Balance</th>
                                            <th className="px-6 py-4 text-right">Performance Rank</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {summaryData.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-8 text-center text-gray-400">Loading workload metrics...</td>
                                            </tr>
                                        ) : summaryData.sort((a,b) => (b.workload?.lectures || 0) - (a.workload?.lectures || 0)).map((s, idx) => (
                                            <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors group cursor-pointer" onClick={() => handleSelect(s.id)}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold text-xs shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                            {(s.fullName?.[0] || '?').toUpperCase()}
                                                        </div>
                                                        <span className="font-semibold text-gray-800">{s.fullName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg w-fit">
                                                        <BookOpen className="w-3.5 h-3.5"/>
                                                        {s.workload?.subjects || 0}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-black text-gray-700">{s.workload?.lectures || 0} <span className="text-[10px] text-gray-400 font-medium">Lectures</span></span>
                                                </td>
                                                <td className="px-6 py-4 min-w-[140px]">
                                                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${(s.workload?.lectures || 0) > 18 ? 'bg-orange-500' : (s.workload?.lectures || 0) > 12 ? 'bg-indigo-500' : 'bg-emerald-500'}`} 
                                                            style={{ width: `${Math.min(((s.workload?.lectures || 0) / 24) * 100, 100)}%` }} />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter ${idx === 0 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'}`}>
                                                        {idx === 0 ? '👑 Leader' : `#${idx + 1}`}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {loading && (
                    
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                    
                )}

                {!loading && perfData && (
                    <>
                    <div className="mb-2">
<button
onClick={() => {
setSelectedId('');
setPerfData(null);
setTeacherSearch('');
}}
className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm transition"
>
<ArrowLeft className="w-4 h-4"/>
Back to Teachers
</button>
</div>
                        {/* Overall Score */}
                        <div className="rounded-2xl p-6 text-white shadow-lg" style={{ background: HERO_GRAD }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold">{perfData.teacher.fullName}</h3>
                                    <p className="text-indigo-200 text-sm">{perfData.teacher.departmentName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-5xl font-black">{perfData.performanceScore}</p>
                                    <p className="text-indigo-200 text-xs">Overall Score / 100</p>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs">
                                {[
                                    { label: 'Attendance', val: perfData.breakdown.attendance, color: 'bg-blue-400' },
                                    { label: 'Feedback', val: perfData.breakdown.feedback, color: 'bg-amber-400' },
                                    { label: 'Trainings', val: perfData.breakdown.trainings, color: 'bg-emerald-400' },
                                    { label: 'Pass Rate', val: perfData.breakdown.passRate, color: 'bg-purple-400' },
                                    { label: 'Responsibilities', val: perfData.breakdown.responsibilities, color: 'bg-pink-400' },
                                ].map(s => (
                                    <div key={s.label}>
                                        <div className="bg-white/20 rounded-full h-2 mb-1">
                                            <div className={`${s.color} h-2 rounded-full`} style={{ width: `${Math.min(s.val, 100)}%` }} />
                                        </div>
                                        <span className="text-white/80">{s.label}: {s.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                <h4 className="text-sm font-bold text-gray-700 mb-4">📊 Attendance Trend (Monthly)</h4>
                                {attChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <LineChart data={attChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="Attendance %" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : <p className="text-center py-12 text-gray-400 text-sm">No attendance data</p>}
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                <h4 className="text-sm font-bold text-gray-700 mb-2">⭐ Feedback Rating</h4>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <Star key={i} className={`w-6 h-6 ${i <= Math.round(perfData.feedback.avgRating || 0) ? 'text-amber-400' : 'text-gray-300'}`}
                                                fill={i <= Math.round(perfData.feedback.avgRating || 0) ? 'currentColor' : 'none'} />
                                        ))}
                                    </div>
                                    <span className="text-2xl font-bold text-gray-700">{perfData.feedback.avgRating || '—'}</span>
                                    <span className="text-xs text-gray-400">({perfData.feedback.totalFeedbacks} reviews)</span>
                                </div>
                                {feedbackChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={180}>
                                        <BarChart data={feedbackChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                            <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                                            <Tooltip />
                                            <Bar dataKey="Rating" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <p className="text-center py-8 text-gray-400 text-sm">No feedback history</p>}
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-bold text-gray-700">📈 Examination Pass Rate</h4>
                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 uppercase tracking-tighter">
                                        Based on Appearances
                                    </span>
                                </div>
                                {passRateData.length > 0 ? (
                                    <div className="flex items-center justify-center gap-6">
                                        <div className="relative">
                                            <ResponsiveContainer width={160} height={160}>
                                                <PieChart>
                                                    <Pie 
                                                        data={passRateData} 
                                                        dataKey="value" 
                                                        cx="50%" 
                                                        cy="50%" 
                                                        innerRadius={45} 
                                                        outerRadius={70} 
                                                        paddingAngle={5}
                                                        stroke="none"
                                                    >
                                                        <Cell fill="#10b981" />
                                                        <Cell fill="#ef4444" />
                                                    </Pie>
                                                    <Tooltip 
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '11px' }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                <span className="text-2xl font-black text-gray-800">{perfData.performance.passRate}%</span>
                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Pass</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Appeared</p>
                                                <p className="text-xl font-black text-gray-900">{perfData.performance.current.appearedStudents}</p>
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.4)]" /> 
                                                    Passed: <span className="text-emerald-600 font-bold">{perfData.performance.current.passedStudents}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.4)]" /> 
                                                    Failed: <span className="text-red-600 font-bold">{perfData.performance.current.failedStudents}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : <div className="py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center text-gray-400 text-sm">No exam data recorded for this academic year</div>}
                            </div>

                             <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                <h4 className="text-sm font-bold text-gray-700 mb-4">🏛️ Overall Performance Radar</h4>
                                {radarData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <RadarChart data={radarData}>
                                            <PolarGrid />
                                            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                                            <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                                            <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                ) : <p className="text-center py-12 text-gray-400 text-sm">No data</p>}
                            </div>

                            {/* ── NEW: Workload Distribution ── */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm lg:col-span-2">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-700">📅 Weekly Load Distribution</h4>
                                        <p className="text-xs text-gray-400 mt-0.5">Periods allocated per subject in a full week</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Lectures</p>
                                            <p className="text-xl font-black text-indigo-600">{perfData.workload.totalLectures}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Unique Subjects</p>
                                            <p className="text-xl font-black text-amber-500">{perfData.workload.subjectCount}</p>
                                        </div>
                                    </div>
                                </div>
                                {workloadChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={240}>
                                        <BarChart data={workloadChartData} layout="vertical" margin={{ left: 30, right: 30 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="subject" type="category" tick={{ fontSize: 11, fontWeight: 600 }} width={120} />
                                            <Tooltip 
                                                cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                            />
                                            <Bar dataKey="Lectures" fill="url(#workloadGradient)" radius={[0, 6, 6, 0]} barSize={28}>
                                                {workloadChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#8b5cf6'} />
                                                ))}
                                            </Bar>
                                            <defs>
                                                <linearGradient id="workloadGradient" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#6366f1" />
                                                    <stop offset="100%" stopColor="#8b5cf6" />
                                                </linearGradient>
                                            </defs>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <div className="py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center text-gray-400 text-sm">No scheduled lectures found in the active timetable</div>}
                            </div>
                        </div>

                        {perfData.performance.current && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                    <h4 className="text-sm font-bold text-gray-700 mb-3">🎓 Trainings Completed</h4>
                                    <p className="text-4xl font-black text-emerald-600">{perfData.performance.current.trainingsCompleted}</p>
                                    {perfData.performance.current.trainingDetails && (
                                        <p className="text-xs text-gray-500 mt-2">{perfData.performance.current.trainingDetails}</p>
                                    )}
                                </div>
                                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                    <h4 className="text-sm font-bold text-gray-700 mb-3">🏛️ Administrative Responsibilities</h4>
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <p className="text-2xl font-black text-purple-600">{perfData.performance.current.committeesParticipated}</p>
                                            <p className="text-xs text-gray-500">Committees</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-purple-600">{perfData.performance.current.eventsOrganized}</p>
                                            <p className="text-xs text-gray-500">Events</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-purple-600">{perfData.performance.current.studentsMentored}</p>
                                            <p className="text-xs text-gray-500">Mentored</p>
                                        </div>
                                    </div>
                                    {perfData.performance.current.adminResponsibilityNotes && (
                                        <p className="text-xs text-gray-500 mt-3 border-t border-gray-100 pt-2">{perfData.performance.current.adminResponsibilityNotes}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {!loading && !perfData && selectedId && (
                    <div className="text-center py-20 text-gray-400">
                        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-semibold">No performance data found</p>
                        <p className="text-sm mt-1">Use the form below to add data for this teacher</p>
                    </div>
                )}

                {!selectedId && (
                    <div className="text-center py-20 text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-semibold">Select a teacher to view performance</p>
                    </div>
                )}

                {/* ── Data Entry Panel ── */}
                {/* {selectedId && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                            <PlusCircle className="w-5 h-5 text-indigo-500" />
                            <h3 className="text-base font-bold text-gray-900">Add / Update Data</h3>
                            <span className="ml-2 text-xs bg-amber-700/10 text-amber-700 font-semibold px-2 py-0.5 rounded-lg">
                                {perfData?.teacher?.fullName || teachers.find(t => t.id === selectedId)?.profile?.fullName || 'Selected Teacher'}
                            </span>
                        </div> */}

                        {/* Tab bar */}
                        {/* <div className="flex border-b border-gray-100">
                            {[
                                { id: 'attendance', label: 'Attendance', icon: CalendarDays },
                                { id: 'feedback', label: 'Feedback', icon: MessageSquare },
                                { id: 'perf', label: 'Performance Data', icon: ClipboardList },
                            ].map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button key={tab.id} onClick={() => { setActiveTab(tab.id); setInputMsg(''); setInputErr(''); }}
                                        className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab.id ? 'border-amber-700 text-amber-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                        <Icon className="w-4 h-4" /> {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="p-6"> */}
                            {/* Feedback messages */}
                            {/* {inputMsg && <div className="mb-4 flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm font-medium"><CheckCircle2 className="w-4 h-4" />{inputMsg}</div>}
                            {inputErr && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2.5 text-sm">{inputErr}</div>} */}

                            {/* ── Attendance Tab ── */}
                            {/* {activeTab === 'attendance' && (
                                <form onSubmit={handleAttendanceSubmit} className="space-y-4">
                                    <p className="text-xs text-gray-500">Record monthly attendance percentage for this teacher.</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className={lbl}>Month</label>
                                            <select value={attMonth} onChange={e => setAttMonth(e.target.value)} className={inp}>
                                                {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={lbl}>Year</label>
                                            <input type="number" value={attYear} onChange={e => setAttYear(e.target.value)}
                                                min="2020" max="2035" className={inp} placeholder="e.g. 2026" />
                                        </div>
                                        <div>
                                            <label className={lbl}>Attendance % (0–100)</label>
                                            <input type="number" value={attPct} onChange={e => setAttPct(e.target.value)}
                                                min="0" max="100" step="0.1" required className={inp} placeholder="e.g. 88.5" />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={inputLoading}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors" style={{ background: HERO_GRAD }}>
                                        {inputLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                                        {inputLoading ? 'Saving…' : 'Save Attendance'}
                                    </button>
                                </form>
                            )} */}

                            {/* ── Feedback Tab ── */}
                            {/* {activeTab === 'feedback' && (
                                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                                    <p className="text-xs text-gray-500">Submit a star rating and optional comment for this teacher.</p>
                                    <div>
                                        <label className={lbl}>Rating (1–5 Stars)</label>
                                        <div className="flex gap-1 mt-1">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <button key={i} type="button"
                                                    onClick={() => setFbRating(i)}
                                                    onMouseEnter={() => setFbHover(i)}
                                                    onMouseLeave={() => setFbHover(0)}
                                                    className="focus:outline-none transition-transform hover:scale-110">
                                                    <Star className={`w-9 h-9 transition-colors ${i <= (fbHover || fbRating) ? 'text-amber-400' : 'text-gray-300'}`}
                                                        fill={i <= (fbHover || fbRating) ? 'currentColor' : 'none'}  />
                                                </button>
                                            ))}
                                            {fbRating > 0 && <span className="ml-2 self-center text-sm font-semibold text-gray-600">{['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][fbRating]}</span>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className={lbl}>Semester / Period (optional)</label>
                                            <input value={fbSemester} onChange={e => setFbSemester(e.target.value)} className={inp} placeholder="e.g. Sem 3 (2025-26)" />
                                        </div>
                                        <div>
                                            <label className={lbl}>Comment (optional)</label>
                                            <input value={fbComment} onChange={e => setFbComment(e.target.value)} className={inp} placeholder="Any additional remarks…" />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={inputLoading}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors" style={{ background: HERO_GRAD }}>
                                        {inputLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                                        {inputLoading ? 'Saving…' : 'Submit Feedback'}
                                    </button>
                                </form>
                            )} */}

                            {/* ── Performance Data Tab ── */}
                            {/* {activeTab === 'perf' && (
                                <form onSubmit={handlePerfSubmit} className="space-y-5">
                                    <p className="text-xs text-gray-500">Enter annual performance data. Existing entry for the same academic year will be updated.</p>
                                    <div>
                                        <label className={lbl}>Academic Year</label>
                                        <select value={perfYear} onChange={e => setPerfYear(e.target.value)} className={`${inp} max-w-xs`}>
                                            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <label className={lbl}>Total Students</label>
                                            <input type="number" min="0" value={perfFormData.totalStudents} onChange={e => pf('totalStudents')(e.target.value)} className={inp} placeholder="0" />
                                        </div>
                                        <div>
                                            <label className={lbl}>Passed Students</label>
                                            <input type="number" min="0" value={perfFormData.passedStudents} onChange={e => pf('passedStudents')(e.target.value)} className={inp} placeholder="0" />
                                        </div>
                                        <div>
                                            <label className={lbl}>Trainings Completed</label>
                                            <input type="number" min="0" value={perfFormData.trainingsCompleted} onChange={e => pf('trainingsCompleted')(e.target.value)} className={inp} placeholder="0" />
                                        </div>
                                        <div>
                                            <label className={lbl}>Committees Participated</label>
                                            <input type="number" min="0" value={perfFormData.committeesParticipated} onChange={e => pf('committeesParticipated')(e.target.value)} className={inp} placeholder="0" />
                                        </div>
                                        <div>
                                            <label className={lbl}>Events Organized</label>
                                            <input type="number" min="0" value={perfFormData.eventsOrganized} onChange={e => pf('eventsOrganized')(e.target.value)} className={inp} placeholder="0" />
                                        </div>
                                        <div>
                                            <label className={lbl}>Students Mentored</label>
                                            <input type="number" min="0" value={perfFormData.studentsMentored} onChange={e => pf('studentsMentored')(e.target.value)} className={inp} placeholder="0" />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className={lbl}>Training Details (optional)</label>
                                            <input value={perfFormData.trainingDetails} onChange={e => pf('trainingDetails')(e.target.value)} className={inp} placeholder="e.g. ML Workshop, Data Science Bootcamp" />
                                        </div>
                                        <div className="sm:col-span-2 lg:col-span-3">
                                            <label className={lbl}>Administrative Notes (optional)</label>
                                            <input value={perfFormData.adminResponsibilityNotes} onChange={e => pf('adminResponsibilityNotes')(e.target.value)} className={inp} placeholder="Any additional responsibilities or achievements…" />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={inputLoading}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors" style={{ background: HERO_GRAD }}>
                                        {inputLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
                                        {inputLoading ? 'Saving…' : 'Save Performance Data'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                )} */}
            </div>
        </DashboardLayout>
    );
}
