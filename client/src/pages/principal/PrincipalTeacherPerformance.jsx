import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { api } from '../../lib/api.js';
import socket from '../../lib/socket.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { Users, Star, X, Loader2, BarChart3, Building2, Search, ChevronDown, ArrowLeft } from 'lucide-react';
import {
    ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

const P_GRAD = 'linear-gradient(135deg, rgb(127,29,29) 0%, rgb(190,18,60) 40%, rgb(225,29,72) 75%, rgb(251,113,133) 100%)';
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function PrincipalTeacherPerformance() {
    const [departments, setDepartments] = useState([]);
    const [deptF, setDeptF] = useState('');
    const [teachers, setTeachers] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [perfData, setPerfData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(true);
    const [teacherSearch, setTeacherSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    const fetchInit = useCallback(async () => {
        setListLoading(true);
        try {
            const [depts, tchrs] = await Promise.all([
                api.get('/auth/departments'),
                api.get('/auth/users?role=TEACHER'),
            ]);
            setDepartments(Array.isArray(depts) ? depts : []);
            setTeachers(Array.isArray(tchrs) ? tchrs : []);
        } catch { }
        finally { setListLoading(false); }
    }, []);

    useEffect(() => { fetchInit(); }, [fetchInit]);
    useEffect(() => {
        const handler = () => { if (selectedId) fetchPerf(selectedId); };
        socket.on('teacher_attendance_change', handler);
        socket.on('teacher_feedback_change', handler);
        socket.on('teacher_perf_change', handler);
        return () => { socket.off('teacher_attendance_change', handler); socket.off('teacher_feedback_change', handler); socket.off('teacher_perf_change', handler); };
    }, [selectedId]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const workloadChartData = useMemo(() => {
            if (!perfData?.workload?.breakdown) return [];
            return perfData.workload.breakdown.map(b => ({
                subject: b.name,
                Lectures: b.count
            }));
        }, [perfData]);
    const filteredTeachers = useMemo(() => {
        let list = teachers;
        if (deptF) list = list.filter(t => t.department?.id === deptF || t.departmentId === deptF);
        const q = teacherSearch.toLowerCase().trim();
        if (q) list = list.filter(t => {
            const name = (t.profile?.fullName || t.email || '').toLowerCase();
            const dept = (t.department?.name || '').toLowerCase();
            return name.includes(q) || dept.includes(q);
        });
        return list;
    }, [teachers, deptF, teacherSearch]);

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
        if (id) fetchPerf(id);
        else setPerfData(null);
    };

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

    return (
        <DashboardLayout title="Teacher Performance" subtitle="Analyze teacher performance across all departments">
            <div className="space-y-5">
                {/* Selectors */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex flex-wrap gap-3">
                        <div className="flex-1 min-w-[180px]">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Department</label>
                            <select value={deptF} onChange={e => { setDeptF(e.target.value); setSelectedId(''); setPerfData(null); setTeacherSearch(''); }}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(190,18,60)]">
                                <option value="">All Departments</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Teacher</label>
                            <div className="relative" ref={dropdownRef}>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={teacherSearch}
                                        onChange={e => { setTeacherSearch(e.target.value); setShowDropdown(true); if (!e.target.value) { setSelectedId(''); setPerfData(null); } }}
                                        onFocus={() => setShowDropdown(true)}
                                        placeholder="Search teacher by name…"
                                        className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(190,18,60)]"
                                    />
                                    <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                                </div>
                                {showDropdown && (
                                    <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                        {filteredTeachers.length === 0 ? (
                                            <div className="px-4 py-3 text-sm text-gray-400">No teachers found</div>
                                        ) : filteredTeachers.map(t => (
                                            <button key={t.id} onClick={() => handleSelect(t.id)}
                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors flex items-center gap-2 ${selectedId === t.id ? 'bg- text-indigo-700 font-semibold' : 'text-gray-700'}`}>
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
                    </div>
                </div>

                {/* Teacher Cards */}
                {!selectedId && !listLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                
                {filteredTeachers.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">No teachers found matching the criteria</p>
                    </div>
                ) : filteredTeachers.map(t => (
                <button
                    key={t.id}
                    onClick={() => handleSelect(t.id)}
                    className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left"
                >
                
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[linear-gradient(135deg,_rgb(127,29,29)_0%,_rgb(190,18,60)_40%,_rgb(225,29,72)_75%,_rgb(251,113,133)_100%)] flex items-center justify-center text-white font-bold">
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
                )}

                {loading && (
                    <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
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
                        <div className="rounded-2xl p-6 text-white shadow-lg" style={{ background: P_GRAD }}>
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

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                <h4 className="text-sm font-bold text-gray-700 mb-4">📊 Attendance Trend</h4>
                                {attChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <LineChart data={attChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                                            <Tooltip /><Line type="monotone" dataKey="Attendance %" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
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
                                            <XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                                            <Tooltip /><Bar dataKey="Rating" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <p className="text-center py-8 text-gray-400 text-sm">No feedback history</p>}
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-bold text-gray-700">📈 Examination Pass Rate</h4>
                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 uppercase tracking-tighter">
                                        Data-Driven Result
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
                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-rose-500">Academic</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-rose-600/60">Total Appeared</p>
                                                <p className="text-xl font-black text-gray-900">{perfData.performance.current.appearedStudents}</p>
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.3)]" /> 
                                                    Passed: <span className="text-emerald-600 font-bold">{perfData.performance.current.passedStudents}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.3)]" /> 
                                                    Failed: <span className="text-red-600 font-bold">{perfData.performance.current.failedStudents}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : <div className="py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center text-gray-400 text-sm">No exam data found for this period</div>}
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                <h4 className="text-sm font-bold text-gray-700 mb-4">🏛️ Overall Performance Radar</h4>
                                {radarData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <RadarChart data={radarData}>
                                            <PolarGrid /><PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                                            <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                                            <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                ) : <p className="text-center py-12 text-gray-400 text-sm">No data</p>}
                            </div>
                        </div>
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

                        {perfData.performance.current && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                    <h4 className="text-sm font-bold text-gray-700 mb-3">🎓 Trainings</h4>
                                    <p className="text-4xl font-black text-emerald-600">{perfData.performance.current.trainingsCompleted}</p>
                                    {perfData.performance.current.trainingDetails && <p className="text-xs text-gray-500 mt-2">{perfData.performance.current.trainingDetails}</p>}
                                </div>
                                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                    <h4 className="text-sm font-bold text-gray-700 mb-3">🏛️ Responsibilities</h4>
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div><p className="text-2xl font-black text-purple-600">{perfData.performance.current.committeesParticipated}</p><p className="text-xs text-gray-500">Committees</p></div>
                                        <div><p className="text-2xl font-black text-purple-600">{perfData.performance.current.eventsOrganized}</p><p className="text-xs text-gray-500">Events</p></div>
                                        <div><p className="text-2xl font-black text-purple-600">{perfData.performance.current.studentsMentored}</p><p className="text-xs text-gray-500">Mentored</p></div>
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
                    <div className="text-center py-20 text-gray-400"><BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="font-semibold">No performance data found</p></div>
                )}
                {!selectedId && (
                    <div className="text-center py-20 text-gray-400"><Users className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="font-semibold">Select a teacher to view performance</p></div>
                )}
            </div>
        </DashboardLayout>
    );
}
