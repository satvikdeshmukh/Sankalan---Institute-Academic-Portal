import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../lib/api.js';
import {
    ArrowLeft, GraduationCap, BookOpen, Calendar, Award, User,
    Mail, MapPin, Hash, Building2, TrendingUp, Clock, Star, Target
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, AreaChart, Area
} from 'recharts';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

/* ── Ring / Donut for aggregate ── */
function RingChart({ value, size = 100, label, color = '#6366f1' }) {
    const total = 100;
    const data = [{ value: Math.min(value, 100) }, { value: Math.max(total - value, 0) }];
    return (
        <div className="relative" style={{ width: size, height: size }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={size * 0.35} outerRadius={size * 0.45}
                        startAngle={90} endAngle={-270} paddingAngle={2} dataKey="value" stroke="none">
                        <Cell fill={color} /><Cell fill="#f1f5f9" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold" style={{ color }}>{Math.round(value)}%</span>
                {label && <span className="text-[9px] text-gray-400 font-medium">{label}</span>}
            </div>
        </div>
    );
}

/* ── Progress Bar ── */
function ProgressBar({ label, value, max = 100, color = '#6366f1' }) {
    const pct = Math.min((value / max) * 100, 100);
    return (
        <div className="mb-2.5">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-700">{label}</span>
                <span className="text-xs font-bold" style={{ color }}>{Math.round(pct)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
        </div>
    );
}

/* ─────────── ATTENDANCE HEATMAP ─────────── */
function AttendanceHeatmap({ dailyData, subjectOfferingId }) {
    if (!dailyData || dailyData.length === 0) return null;

    const filtered = subjectOfferingId
        ? dailyData.filter(d => d.offeringId === subjectOfferingId)
        : dailyData;

    if (filtered.length === 0) return null;

    const months = {};
    filtered.forEach(d => {
        const dt = new Date(d.date);
        const mKey = `${dt.getFullYear()}-${dt.getMonth() + 1}`;
        if (!months[mKey]) months[mKey] = { year: dt.getFullYear(), month: dt.getMonth() + 1, days: {} };
        months[mKey].days[dt.getDate()] = d.status;
    });

    const sortedMonths = Object.values(months).sort((a, b) => a.year - b.year || a.month - b.month);

    return (
        <div className="mt-2 p-3 bg-gray-50/50 rounded-xl border border-gray-100 overflow-x-auto">
            <div className="flex gap-4 min-w-max pb-1">
                {sortedMonths.map((m, idx) => {
                    const daysInMonth = new Date(m.year, m.month, 0).getDate();
                    const firstDay = new Date(m.year, m.month - 1, 1).getDay();
                    const monthName = MONTH_FULL[m.month];
                    return (
                        <div key={idx} className="w-[100px]">
                            <p className="text-[9px] font-bold text-gray-400 mb-1.5 truncate uppercase tracking-wider">{monthName} {m.year}</p>
                            <div className="grid grid-cols-7 gap-0.5">
                                {Array.from({ length: firstDay }).map((_, i) => <div key={`p-${i}`} className="w-2 h-2" />)}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const status = m.days[day];
                                    const isPresent = status === true;
                                    const isAbsent = status === false;
                                    const hasClass = status !== undefined;
                                    return (
                                        <div key={day} title={hasClass ? `${monthName} ${day}: ${isPresent ? 'Present' : 'Absent'}` : ''}
                                            className={`w-2 h-2 rounded-[1.5px] transition-all duration-300
                                                ${isPresent ? 'bg-emerald-500' :
                                                    isAbsent ? 'bg-rose-500' :
                                                        'bg-gray-200/50'}`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function StudentProfileView({ studentId, onBack }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const result = await api.get(`/students/${studentId}/profile`);
                setData(result);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        })();
    }, [studentId]);

    // Computed summaries
    const summary = useMemo(() => {
        if (!data) return {};
        const { student, marks, monthly, daily } = data;
        const latestEnroll = (student?.enrollments || [])[0];

        // Subject-wise attendance averages
        const subAttMap = {};
        for (const a of (monthly || [])) {
            const name = a.subjectOffering?.subject?.name || 'Unknown';
            if (!subAttMap[name]) subAttMap[name] = { vals: [], offeringId: a.subjectOfferingId };
            subAttMap[name].vals.push(a.percentage);
        }
        const subjectAttendance = Object.entries(subAttMap).map(([name, d], i) => ({
            name, offeringId: d.offeringId, avg: Math.round(d.vals.reduce((s, v) => s + v, 0) / d.vals.length), color: COLORS[i % COLORS.length]
        }));

        // Overall attendance
        const allAtt = (monthly || []).map(a => a.percentage);
        const overallAtt = allAtt.length > 0 ? Math.round(allAtt.reduce((s, v) => s + v, 0) / allAtt.length) : 0;

        // Monthly trend
        const monthMap = {};
        for (const a of (monthly || [])) {
            const key = `${a.year}-${String(a.month).padStart(2, '0')}`;
            if (!monthMap[key]) monthMap[key] = { vals: [], month: a.month, year: a.year };
            monthMap[key].vals.push(a.percentage);
        }
        const monthlyTrend = Object.entries(monthMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, d]) => ({
                name: `${MONTH_LABELS[d.month - 1]}`,
                'Attendance': Math.round(d.vals.reduce((s, v) => s + v, 0) / d.vals.length)
            }));

        // Flatten daily data for component
        const flatDaily = (daily || []).map(d => ({
            date: d.session.date,
            status: d.status,
            offeringId: d.session.offeringId
        }));

        // Subject-wise marks
        const subMarksMap = {};
        for (const m of (marks || [])) {
            const name = m.subjectOffering?.subject?.name || 'Unknown';
            if (!subMarksMap[name]) subMarksMap[name] = { exams: {}, total: 0 };
            subMarksMap[name].exams[m.examType] = m.marks;
            subMarksMap[name].total += m.marks;
        }

        // Marks chart data
        const marksChart = Object.entries(subMarksMap).map(([name, d], i) => ({
            name, total: d.total, fill: COLORS[i % COLORS.length]
        }));

        // Total marks
        const totalMarks = (marks || []).reduce((s, m) => s + m.marks, 0);
        const examCount = (marks || []).length;
        const avgMarks = examCount > 0 ? Math.round(totalMarks / examCount) : 0;

        // Enrolled subjects with teacher
        const subjects = (student?.subjectEnrollments || []).map((se, i) => ({
            id: se.subjectOffering?.id,
            name: se.subjectOffering?.subject?.name || 'Unknown',
            code: se.subjectOffering?.subject?.code || '',
            type: se.subjectOffering?.subject?.type || 'THEORY',
            teacher: se.subjectOffering?.teacher?.profile?.fullName || 'Unknown',
            year: se.subjectOffering?.year,
            semester: se.subjectOffering?.semester,
            section: se.subjectOffering?.section,
            color: COLORS[i % COLORS.length]
        }));

        return { student, latestEnroll, subjectAttendance, overallAtt, monthlyTrend, flatDaily, subMarksMap, marksChart, totalMarks, avgMarks, examCount, subjects };
    }, [data]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-3 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!data?.student) {
        return <div className="text-center py-20 text-gray-400">Student not found</div>;
    }

    const s = summary.student;
    const enr = summary.latestEnroll;

    return (
        <div>
            {/* Back button */}
            <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-2 mb-5 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="w-4 h-4" /> Back to Students
            </button>

            {/* ═══ DASHBOARD GRID — matching reference UI layout ═══ */}
            <div className="grid grid-cols-12 gap-4">

                {/* ── Profile Card (right column in ref) ── */}
                <div className="col-span-12 lg:col-span-3 order-first lg:order-last space-y-4">
                    {/* Avatar + Info */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center shadow-sm">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3 shadow-lg">
                            {s.fullName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">{s.fullName}</h2>
                        <p className="text-xs text-gray-400 font-mono">{s.studentId}</p>

                        <div className="mt-4 space-y-2.5 text-left">
                            {[
                                { icon: Calendar, label: s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                                { icon: Building2, label: s.department?.name || '—' },
                                { icon: Mail, label: s.email || '—' },
                                { icon: MapPin, label: s.address || '—' },
                                { icon: Hash, label: enr ? `Year ${enr.year} · Sem ${enr.semester} · Sec ${enr.section}` : '—' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                                        <item.icon className="w-3.5 h-3.5 text-indigo-500" />
                                    </div>
                                    <p className="text-xs text-gray-600 leading-snug pt-1">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Stats (like "Reward" card) */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-500" /> Quick Stats
                        </h3>
                        <p className="text-[11px] text-gray-400 mb-3">Performance overview</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Overall Attendance', value: `${summary.overallAtt}%`, color: summary.overallAtt >= 75 ? 'text-green-600' : 'text-amber-600', bg: 'bg-green-50' },
                                { label: 'Total Marks', value: summary.totalMarks, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                { label: 'Avg per Exam', value: summary.avgMarks, color: 'text-purple-600', bg: 'bg-purple-50' },
                                { label: 'Subjects', value: summary.subjects.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { label: 'Exams Taken', value: summary.examCount, color: 'text-amber-600', bg: 'bg-amber-50' },
                                { label: 'Sessions Tracked', value: summary.flatDaily?.length || 0, color: 'text-cyan-600', bg: 'bg-cyan-50' },
                            ].map((stat, i) => (
                                <div key={i} className={`${stat.bg} rounded-xl p-2.5`}>
                                    <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
                                    <p className="text-[9px] text-gray-500 font-medium leading-tight">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Main Content (left columns in ref) ── */}
                <div className="col-span-12 lg:col-span-9 space-y-4">

                    {/* Row 1: Attendance Section with Heatmap integration */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-indigo-500" /> Attendance Trends
                                </h3>
                                <p className="text-[11px] text-gray-400">Monthly averages and session heatmap</p>
                            </div>
                            <div className="text-right">
                                <span className={`text-2xl font-black ${summary.overallAtt >= 75 ? 'text-emerald-500' : 'text-amber-500'}`}>{summary.overallAtt}%</span>
                                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">Overall Avg</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1 space-y-4">
                                {summary.subjectAttendance.map((sa, i) => (
                                    <div key={i}>
                                        <ProgressBar label={sa.name} value={sa.avg} color={sa.color} />
                                        <AttendanceHeatmap dailyData={summary.flatDaily} subjectOfferingId={sa.offeringId} />
                                    </div>
                                ))}
                                {summary.subjectAttendance.length === 0 && <p className="text-xs text-gray-400">No data</p>}
                            </div>
                            <div className="md:col-span-2 pt-2">
                                {summary.monthlyTrend.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={240}>
                                        <AreaChart data={summary.monthlyTrend}>
                                            <defs>
                                                <linearGradient id="profAttGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="Attendance" stroke="#6366f1" strokeWidth={3}
                                                fill="url(#profAttGrad)" dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : <div className="h-full flex items-center justify-center text-gray-400 text-xs italic">Not enough data for chart</div>}
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Marks + Subjects */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Marks Summary */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                                <Target className="w-4 h-4 text-purple-500" /> Marks Distribution
                            </h3>
                            <p className="text-[11px] text-gray-400 mb-4">Total marks per subject</p>
                            {summary.marksChart.length > 0 ? (
                                <ResponsiveContainer width="100%" height={180}>
                                    <BarChart data={summary.marksChart}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                                        <YAxis tick={{ fontSize: 9 }} />
                                        <Tooltip />
                                        <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                            {summary.marksChart.map((mc, i) => <Cell key={i} fill={mc.fill} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <p className="text-xs text-gray-400 py-8 text-center italic">No marks data available</p>}
                        </div>

                        {/* Enrolled Subjects */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-emerald-500" /> Enrolled Subjects
                            </h3>
                            <p className="text-[11px] text-gray-400 mb-3">{summary.subjects.length} active enrollments</p>
                            <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1 scrollbar-thin">
                                {summary.subjects.map((sub, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50/50 border border-gray-100/50 hover:bg-white hover:border-indigo-100 transition-all cursor-default group">
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm" style={{ backgroundColor: sub.color }}>
                                            {sub.code || sub.name[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-800 truncate">{sub.name}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">Prof. {sub.teacher}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${sub.type === 'THEORY' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                                {sub.type}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {summary.subjects.length === 0 && <p className="text-xs text-center py-4 text-gray-400 italic">No courses found</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
