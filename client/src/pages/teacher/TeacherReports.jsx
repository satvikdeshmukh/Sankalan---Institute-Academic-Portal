import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../lib/api.js';
import { useActivities } from '../../hooks/useActivities.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import {
    BarChart3, Download, Search, Users, User, BookOpen,
    FileText, X, CheckCircle, AlertTriangle, Info, XCircle,
    Calendar, LayoutTemplate, ChevronRight, Sparkles
} from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie,
    AreaChart, Area
} from 'recharts';
import {
    STUDENT_TEMPLATES, CLASS_TEMPLATES,
    generateStudentPDF, generateClassPDF
} from './ReportTemplates.jsx';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const TOAST_ICONS = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info };
const TOAST_COLORS = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
};

/* ══════════════════════════════════════════════════════════════
   TEMPLATE CHOOSER MODAL
   Full-screen overlay that opens before PDF download.
   Shows 4 vivid template cards with live colour previews.
══════════════════════════════════════════════════════════════ */
function TemplateChooser({ templates, onChoose, onCancel }) {
    const [hovered, setHovered] = useState(null);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(10,10,30,0.72)', backdropFilter: 'blur(4px)' }}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden"
                onClick={e => e.stopPropagation()}>

                {/* Modal header */}
                <div className="px-8 pt-8 pb-5 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg">
                                <LayoutTemplate className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Choose a PDF Template</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Select a style — your report will be generated instantly</p>
                            </div>
                        </div>
                        <button onClick={onCancel}
                            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Template cards */}
                <div className="p-6 grid grid-cols-2 gap-4">
                    {templates.map(tpl => {
                        const isHot = hovered === tpl.id;
                        return (
                            <button key={tpl.id}
                                onClick={() => onChoose(tpl.id)}
                                onMouseEnter={() => setHovered(tpl.id)}
                                onMouseLeave={() => setHovered(null)}
                                className={`group relative text-left rounded-2xl overflow-hidden border-2 transition-all duration-200
                                    ${isHot ? 'border-transparent shadow-2xl scale-[1.02]' : 'border-gray-150 shadow-sm hover:shadow-lg'}`}
                                style={isHot ? { borderColor: tpl.accentColor } : {}}>

                                {/* --- PDF page visual mockup --- */}
                                <div className="w-full bg-gray-50 overflow-hidden" style={{ aspectRatio: '3/4', position: 'relative' }}>

                                    {/* Header band */}
                                    <div className="absolute inset-x-0 top-0"
                                        style={{ height: '30%', background: `linear-gradient(135deg, ${tpl.headerColor} 60%, ${tpl.accentColor})` }}>
                                        {/* Title lines */}
                                        <div className="absolute top-[14%] left-[7%] right-[20%]">
                                            <div className="h-[5px] rounded-full mb-1.5" style={{ background: 'rgba(255,255,255,0.9)', width: '72%' }} />
                                            <div className="h-[3px] rounded-full mb-1" style={{ background: 'rgba(255,255,255,0.55)', width: '50%' }} />
                                            <div className="h-[2.5px] rounded-full" style={{ background: 'rgba(255,255,255,0.4)', width: '60%' }} />
                                        </div>
                                        {/* Status chip mock */}
                                        <div className="absolute top-[12%] right-[5%] rounded"
                                            style={{ width: '18%', height: '12%', background: 'rgba(255,255,255,0.25)' }} />
                                        {/* Accent rule */}
                                        <div className="absolute bottom-0 inset-x-0 h-[4px]"
                                            style={{ background: tpl.accentColor, opacity: 0.85 }} />
                                    </div>

                                    {/* KPI boxes */}
                                    <div className="absolute flex gap-[2.5%] left-[4%] right-[4%]" style={{ top: '33%' }}>
                                        {[0, 1, 2, 3].map(i => (
                                            <div key={i} className="flex-1 rounded" style={{ height: '7%', background: i % 2 === 0 ? `${tpl.accentColor}1A` : `${tpl.headerColor}12`, border: `0.8px solid ${tpl.accentColor}30` }}>
                                                <div className="mt-[15%] mx-auto rounded" style={{ width: '55%', height: '30%', background: tpl.accentColor, opacity: 0.6 }} />
                                                <div className="mt-[8%] mx-auto rounded" style={{ width: '70%', height: '20%', background: '#ccc' }} />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Sparkline box */}
                                    <div className="absolute left-[4%] right-[4%]" style={{ top: '44%', height: '14%', background: `${tpl.accentColor}10`, borderRadius: '2px' }}>
                                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 28" preserveAspectRatio="none">
                                            <polyline
                                                points="5,20 18,14 30,18 44,9 57,13 70,7 84,11 95,8"
                                                fill="none" stroke={tpl.accentColor} strokeWidth="1.8" opacity="0.7" />
                                            {[5, 18, 30, 44, 57, 70, 84, 95].map((cx, ii) => {
                                                const cy = [20, 14, 18, 9, 13, 7, 11, 8][ii];
                                                return <circle key={ii} cx={cx} cy={cy} r="1.8" fill={tpl.accentColor} opacity="0.75" />;
                                            })}
                                        </svg>
                                    </div>

                                    {/* Two chart boxes */}
                                    <div className="absolute flex gap-[3%] left-[4%] right-[4%]" style={{ top: '62%', height: '16%' }}>
                                        {[0, 1].map(ci => (
                                            <div key={ci} className="flex-1 rounded" style={{ background: `${tpl.headerColor}0D`, border: `0.6px solid ${tpl.accentColor}25` }}>
                                                <div className="flex items-end justify-center gap-[4%] h-full px-[8%] pb-[10%]">
                                                    {[60, 85, 45, 95, 70, 55].map((bh, bi) => (
                                                        <div key={bi} className="flex-1 rounded-t"
                                                            style={{ height: `${bh}%`, background: bi % 2 === 0 ? tpl.accentColor : tpl.headerColor, opacity: 0.7 }} />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Table rows */}
                                    <div className="absolute left-[4%] right-[4%]" style={{ top: '82%' }}>
                                        <div className="h-[2px] rounded mb-[1.5%]" style={{ background: tpl.headerColor, opacity: 0.35 }} />
                                        {[100, 70, 100, 70].map((w, ri) => (
                                            <div key={ri} className="h-[3px] rounded mb-[1.5%]"
                                                style={{ width: `${w}%`, background: ri % 2 === 0 ? `${tpl.accentColor}18` : `${tpl.headerColor}0D` }} />
                                        ))}
                                    </div>

                                    {/* Footer bar */}
                                    <div className="absolute bottom-0 inset-x-0 h-[5%]"
                                        style={{ background: tpl.headerColor, opacity: 0.9 }} />

                                    {/* Hover CTA overlay */}
                                    {isHot && (
                                        <div className="absolute inset-0 flex items-center justify-center transition-all"
                                            style={{ background: `${tpl.headerColor}CC` }}>
                                            <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-xl"
                                                style={{ background: tpl.accentColor }}>
                                                <Download className="w-4 h-4" />
                                                Use this template
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Card label */}
                                <div className="px-4 py-3 bg-white">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: tpl.headerColor }} />
                                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: tpl.accentColor }} />
                                        <p className="text-sm font-bold text-gray-900">{tpl.name}</p>
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-0.5 pl-7">{tpl.desc}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-8 pb-6 flex items-center justify-between">
                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        All templates include attendance, marks, charts & remarks
                    </p>
                    <button onClick={onCancel}
                        className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   ATTENDANCE HEATMAP
───────────────────────────────────────────── */
function AttendanceHeatmap({ dailyData, subjectOfferingId }) {
    if (!dailyData?.length) return null;
    const filtered = subjectOfferingId ? dailyData.filter(d => d.offeringId === subjectOfferingId) : dailyData;
    if (!filtered.length) return null;

    const months = {};
    filtered.forEach(d => {
        const dt = new Date(d.date);
        const k = `${dt.getFullYear()}-${dt.getMonth() + 1}`;
        if (!months[k]) months[k] = { year: dt.getFullYear(), month: dt.getMonth() + 1, days: {} };
        months[k].days[dt.getDate()] = d.status;
    });

    return (
        <div className="flex flex-wrap gap-6 mt-2">
            {Object.values(months).sort((a, b) => a.year - b.year || a.month - b.month).map((m, idx) => {
                const daysInMonth = new Date(m.year, m.month, 0).getDate();
                const firstDay = new Date(m.year, m.month - 1, 1).getDay();
                return (
                    <div key={idx} className="min-w-[140px]">
                        <p className="text-[10px] font-bold text-gray-500 mb-1.5">{MONTH_FULL[m.month]} {m.year}</p>
                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} className="w-3 h-3" />)}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const st = m.days[day];
                                return (
                                    <div key={day} title={st !== undefined ? `${MONTH_FULL[m.month]} ${day}: ${st ? 'Present' : 'Absent'}` : ''}
                                        className={`w-3 h-3 rounded-[2px] ${st === true ? 'bg-emerald-500' : st === false ? 'bg-rose-500' : 'bg-gray-200'}`} />
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   SINGLE STUDENT REPORT
══════════════════════════════════════════════════════════════ */
function SingleStudentReport({ offerings, addToast, teacherName, savedReports, onReportSaved }) {
    const { user } = useAuth();
    const { getMonthTotal, MONTHS } = useActivities(user?.id);
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelected] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [loadingData, setLoadingData] = useState(false);
    const [search, setSearch] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [semFilter, setSemFilter] = useState('');
    const [selectedSubjects, setSubs] = useState(new Set());
    const [remarks, setRemarks] = useState('');
    const [saving, setSaving] = useState(false);
    const [showChooser, setShowChooser] = useState(false);
    const [reportTitle, setReportTitle] = useState('');

    // Build monthly credits trend for selected student
    const progressTrendData = useMemo(() => {
        if (!selectedStudent) return [];
        return MONTHS.map((m, i) => ({
            name: MONTH_LABELS[i],
            'Credits': getMonthTotal(selectedStudent.id, m),
        }));
    }, [selectedStudent, getMonthTotal, MONTHS]);

    // Build deduplicated student list from all offerings
    useEffect(() => {
        const map = {};
        for (const off of offerings) {
            for (const se of (off.enrollments || [])) {
                const student = se.student;
                // Get year/semester from the student's Enrollment records (latest), fallback to offering
                const latestEnrollment = (student.enrollments || [])
                    .sort((a, b) => (b.academicYear || '').localeCompare(a.academicYear || ''))[0];
                const sYear = latestEnrollment?.year ?? off.year;
                const sSemester = latestEnrollment?.semester ?? off.semester;

                if (!map[student.id]) {
                    map[student.id] = { ...student, _subjects: 0, _totalMarks: 0, year: sYear, semester: sSemester };
                } else {
                    // Keep highest year/semester if student appears in multiple offerings
                    if (sYear && (!map[student.id].year || sYear > map[student.id].year)) {
                        map[student.id].year = sYear;
                    }
                    if (sSemester && (!map[student.id].semester || sSemester > map[student.id].semester)) {
                        map[student.id].semester = sSemester;
                    }
                }
                map[student.id]._subjects++;
            }
            for (const m of (off.marks || [])) {
                if (map[m.studentId]) map[m.studentId]._totalMarks += m.marks;
            }
        }
        setStudents(Object.values(map));
    }, [offerings]);

    const filtered = useMemo(() => {
        let list = students;
        if (yearFilter) list = list.filter(s => String(s.year) === yearFilter);
        if (semFilter) list = list.filter(s => String(s.semester) === semFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(s => s.fullName?.toLowerCase().includes(q) || s.studentId?.toLowerCase().includes(q));
        }
        return list;
    }, [students, search, yearFilter, semFilter]);

    const fetchData = useCallback(async (studentId) => {
        setLoadingData(true);
        try {
            const data = await api.get(`/reports/data/student/${studentId}`);
            setReportData(data);
            const subs = new Set();
            (data.marks || []).forEach(m => subs.add(m.subjectOfferingId));
            (data.monthly || []).forEach(a => subs.add(a.subjectOfferingId));
            setSubs(subs);
        } catch (err) { addToast('error', 'Error', err.message); }
        finally { setLoadingData(false); }
    }, [addToast]);

    const subjectList = useMemo(() => {
        if (!reportData) return [];
        const map = {};
        (reportData.marks || []).forEach(m => { map[m.subjectOfferingId] = m.subjectOffering?.subject?.name || '?'; });
        (reportData.monthly || []).forEach(a => { map[a.subjectOfferingId] = a.subjectOffering?.subject?.name || '?'; });
        return Object.entries(map);
    }, [reportData]);

    const charts = useMemo(() => {
        if (!reportData) return {};
        const fm = (reportData.marks || []).filter(m => selectedSubjects.has(m.subjectOfferingId));
        const fa = (reportData.monthly || []).filter(a => selectedSubjects.has(a.subjectOfferingId));

        // Attendance trend
        const mmap = {};
        fa.forEach(a => {
            const k = `${a.year}-${String(a.month).padStart(2, '0')}`;
            if (!mmap[k]) mmap[k] = { vals: [], month: a.month, year: a.year };
            mmap[k].vals.push(a.percentage);
        });
        const trend = Object.entries(mmap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, d]) => ({
                name: `${MONTH_LABELS[d.month - 1]} '${String(d.year).slice(-2)}`,
                'Attendance %': Math.round(d.vals.reduce((s, v) => s + v, 0) / d.vals.length),
            }));

        // Marks by exam type per subject
        const subjectNames = [...new Set(fm.map(m => m.subjectOffering?.subject?.name || '—'))];
        const examTypes = [...new Set(fm.map(m => m.examType))];
        const examMap = {};
        fm.forEach(m => {
            const sn = m.subjectOffering?.subject?.name || '—';
            if (!examMap[m.examType]) examMap[m.examType] = { name: m.examType };
            examMap[m.examType][sn] = m.marks;
        });
        const marksByExam = Object.values(examMap);

        // Subject total marks
        const subTotals = {};
        fm.forEach(m => {
            const n = m.subjectOffering?.subject?.name || '—';
            subTotals[n] = (subTotals[n] || 0) + m.marks;
        });
        const subjectMarks = Object.entries(subTotals).map(([name, total], i) => ({ name, total, fill: COLORS[i % COLORS.length] }));

        // Attendance pie by subject
        const samap = {};
        fa.forEach(a => {
            const n = a.subjectOffering?.subject?.name || '—';
            if (!samap[n]) samap[n] = { vals: [] };
            samap[n].vals.push(a.percentage);
        });
        const attPie = Object.entries(samap).map(([name, d], i) => ({
            name, value: Math.round(d.vals.reduce((s, v) => s + v, 0) / d.vals.length), fill: COLORS[i % COLORS.length],
        }));

        return { trend, marksByExam, subjectMarks, attPie, subjectNames, examTypes };
    }, [reportData, selectedSubjects]);

    const handleDownload = () => {
        if (!reportData?.student) return;
        setShowChooser(true);
    };

    const handleChooseTemplate = async (templateId) => {
        setShowChooser(false);
        if (!selectedStudent) return;

        // Always fetch the latest data from server at download time
        // so the PDF reflects any changes made since the student was selected
        let freshData = reportData;
        try {
            freshData = await api.get(`/reports/data/student/${selectedStudent.id}`);
            setReportData(freshData); // update displayed data too
            const subs = new Set();
            (freshData.marks || []).forEach(m => subs.add(m.subjectOfferingId));
            (freshData.monthly || []).forEach(a => subs.add(a.subjectOfferingId));
            setSubs(subs);
        } catch (err) {
            // Fall back to cached data if re-fetch fails
            addToast('warning', 'Using cached data', 'Could not refresh — using last loaded data.');
        }

        // Recompute progress trend with latest activity data
        const freshProgressTrend = MONTHS.map((m, i) => ({
            name: MONTH_LABELS[i],
            'Credits': getMonthTotal(selectedStudent.id, m),
        }));

        generateStudentPDF(templateId, {
            student: freshData.student,
            marks: freshData.marks,
            monthly: freshData.monthly,
            daily: freshData.daily || [],
            progressTrend: freshProgressTrend,
            selectedSubjects,
            remarks,
        }, { teacherName });
        addToast('success', 'PDF Downloaded', `Report for ${freshData.student?.fullName}`);
    };

    // Generate a unique default title that won't clash with existing reports
    const getDefaultTitle = useCallback((studentName, isDraft) => {
        const prefix = isDraft ? 'Draft' : 'Final';
        const base = `${prefix} Report — ${studentName}`;
        const existingTitles = new Set((savedReports || []).map(r => r.title));
        if (!existingTitles.has(base)) return base;
        let n = 2;
        while (existingTitles.has(`${base} (${n})`)) n++;
        return `${base} (${n})`;
    }, [savedReports]);

    const handleSave = async (status) => {
        if (!reportData?.student) return;
        const isDraft = status === 'draft';
        const finalStatus = isDraft ? 'draft' : 'submitted_to_hod';
        const title = reportTitle.trim() || getDefaultTitle(reportData.student.fullName, isDraft);
        setSaving(true);
        try {
            await api.post('/reports', {
                title,
                content: JSON.stringify({ type: 'student', studentId: reportData.student.id, remarks, subjectIds: [...selectedSubjects] }),
                status: finalStatus,
            });
            onReportSaved?.();
            addToast('success', 'Saved', isDraft ? 'Saved as draft.' : 'Report sent to HOD.');
        } catch (e) { addToast('error', 'Save Failed', e.message); }
        finally { setSaving(false); }
    };

    /* ── STUDENT PICKER ────────────────────────── */
    const availableYears = [1, 2, 3, 4];
    const availableSems = yearFilter
        ? [Number(yearFilter) * 2 - 1, Number(yearFilter) * 2]
        : [1, 2, 3, 4, 5, 6, 7, 8];

    if (!selectedStudent) return (
        <div className="space-y-5">
            <div className="flex flex-wrap gap-3 items-end">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students…"
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Year</label>
                    <select value={yearFilter} onChange={e => { setYearFilter(e.target.value); setSemFilter(''); }}
                        className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-w-[90px]">
                        <option value="">All</option>
                        {availableYears.map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Semester</label>
                    <select value={semFilter} onChange={e => setSemFilter(e.target.value)}
                        className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-w-[100px]">
                        <option value="">All</option>
                        {availableSems.map(s => <option key={s} value={s}>Sem {s}</option>)}
                    </select>
                </div>
                {(yearFilter || semFilter) && (
                    <button onClick={() => { setYearFilter(''); setSemFilter(''); }}
                        className="px-3 py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition">
                        Clear Filters
                    </button>
                )}
            </div>
            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border py-16 text-center">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-400">No students found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filtered.map(s => (
                        <button key={s.id} onClick={() => { setSelected(s); fetchData(s.id); }}
                            className="bg-white rounded-2xl border border-gray-100 p-5 text-left hover:shadow-xl hover:border-indigo-200 hover:-translate-y-0.5 transition-all group">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-500 flex items-center justify-center text-white text-base font-bold group-hover:scale-105 transition-transform shadow-md">
                                    {s.fullName?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{s.fullName}</p>
                                    <p className="text-[11px] text-gray-400 font-mono">{s.studentId || '—'}</p>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-3 border-t border-gray-100">
                                <div><p className="text-lg font-black text-indigo-600">{s._subjects}</p><p className="text-[10px] text-gray-400">Subjects</p></div>
                                <div><p className="text-lg font-black text-yellow-600">{s._totalMarks}</p><p className="text-[10px] text-gray-400">Total Marks</p></div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    /* ── REPORT BUILDER ────────────────────────── */
    const enr = (reportData?.student?.enrollments || [])[0];

    return (
        <div className="space-y-5">
            {/* Top bar */}
            <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100">
                <div className="flex items-center gap-3">
                    <button onClick={() => { setSelected(null); setReportData(null); setReportTitle(''); }}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg transition">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow">
                        {selectedStudent.fullName?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg leading-tight">{selectedStudent.fullName}</h3>
                        <p className="text-xs text-gray-500">{selectedStudent.studentId} · {selectedStudent.department?.name || '—'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleSave('draft')} disabled={saving || !reportData}
                        className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition">
                        {saving ? 'Saving…' : 'Save Draft'}
                    </button>
                    <button onClick={() => handleSave('submitted_to_hod')} disabled={saving || !reportData}
                        className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 transition shadow-sm">
                        → HOD
                    </button>
                    <button onClick={handleDownload} disabled={!reportData}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition shadow-md">
                        <Download className="w-4 h-4" /> Download PDF
                    </button>
                </div>
            </div>

            {/* Report title */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Report Name</label>
                <input
                    value={reportTitle}
                    onChange={e => setReportTitle(e.target.value)}
                    placeholder={`Final Report — ${selectedStudent.fullName}`}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-gray-300"
                />
                <p className="text-[11px] text-gray-400 mt-1">Leave blank to auto-generate a unique name</p>
            </div>

            {/* Subject filter */}
            {subjectList.length > 1 && (
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Filter:</span>
                    {subjectList.map(([id, name]) => (
                        <button key={id} onClick={() => setSubs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${selectedSubjects.has(id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
                                }`}>{name}</button>
                    ))}
                </div>
            )}

            {loadingData ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                </div>
            ) : reportData ? (
                <>
                    {/* Charts grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {charts.trend?.length > 0 && (
                            <div className="bg-white rounded-2xl border p-5 shadow-sm">
                                <h4 className="text-sm font-bold text-gray-800 mb-4">📈 Attendance Trend</h4>
                                <ResponsiveContainer width="100%" height={210}>
                                    <AreaChart data={charts.trend}>
                                        <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="Attendance %" stroke="#6366f1" strokeWidth={2.5} fill="url(#ag)" dot={{ r: 4, fill: '#6366f1' }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                        {charts.marksByExam?.length > 0 && (
                            <div className="bg-white rounded-2xl border p-5 shadow-sm">
                                <h4 className="text-sm font-bold text-gray-800 mb-4">📊 Marks by Exam Type</h4>
                                <ResponsiveContainer width="100%" height={210}>
                                    <BarChart data={charts.marksByExam}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 10 }} />
                                        <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                                        {(charts.subjectNames || []).map((n, i) => (
                                            <Bar key={n} dataKey={n} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                        {charts.attPie?.length > 0 && (
                            <div className="bg-white rounded-2xl border p-5 shadow-sm">
                                <h4 className="text-sm font-bold text-gray-800 mb-4 text-center">🥧 Subject-wise Attendance</h4>
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie 
                                            data={charts.attPie} 
                                            cx="50%" 
                                            cy="45%" 
                                            innerRadius={65} 
                                            outerRadius={90}
                                            paddingAngle={4} 
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {charts.attPie.map((e, i) => (
                                                <Cell key={i} fill={e.fill} className="hover:opacity-80 transition-opacity" />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                            formatter={(value) => [`${value}%`, 'Attendance']}
                                        />
                                        <Legend 
                                            verticalAlign="bottom" 
                                            align="center" 
                                            iconType="circle"
                                            layout="horizontal"
                                            wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                        {charts.subjectMarks?.length > 0 && (
                            <div className="bg-white rounded-2xl border p-5 shadow-sm">
                                <h4 className="text-sm font-bold text-gray-800 mb-4">📋 Total Marks by Subject</h4>
                                <ResponsiveContainer width="100%" height={210}>
                                    <BarChart data={charts.subjectMarks} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis type="number" tick={{ fontSize: 10 }} />
                                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                                        <Tooltip />
                                        <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                                            {charts.subjectMarks.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* ── Progress Trend (Extracurricular Credits) ── */}
                    <div className="bg-white rounded-2xl border p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                ✨ Progress Trend
                            </h4>
                            <span className="text-xs text-gray-400 font-medium">
                                Total:{' '}
                                <span className="text-indigo-600 font-bold">
                                    {progressTrendData.reduce((s, d) => s + d.Credits, 0)} credits
                                </span>
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mb-4">Extracurricular credits earned per month</p>
                        {progressTrendData.every(d => d.Credits === 0) ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                                <span className="text-3xl mb-2">📭</span>
                                <p className="text-sm font-medium text-gray-400">No extracurricular credits recorded yet</p>
                                <p className="text-xs text-gray-300 mt-1">Add credits in the Extracurricular section</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={progressTrendData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="creditGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                                        formatter={(v) => [`${v} credits`, 'Credits']}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="Credits"
                                        stroke="#10b981"
                                        strokeWidth={2.5}
                                        dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 7 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Heatmap */}
                    {reportData.daily?.length > 0 && (
                        <div className="bg-white rounded-2xl border p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-bold text-gray-800">📆 Session Attendance</h4>
                                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Present</span>
                                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> Absent</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {subjectList.filter(([id]) => selectedSubjects.has(id)).map(([id, name]) => (
                                    <div key={id}>
                                        <p className="text-[11px] font-bold text-indigo-600 mb-1">{name}</p>
                                        <AttendanceHeatmap dailyData={reportData.daily} subjectOfferingId={id} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Data tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="bg-white rounded-2xl border shadow-sm">
                            <div className="px-5 py-4 border-b bg-gradient-to-r from-indigo-50 to-transparent">
                                <h4 className="text-sm font-bold text-gray-800">Monthly Attendance</h4>
                            </div>
                            <div className="overflow-auto max-h-64">
                                <table className="w-full text-xs">
                                    <thead><tr className="bg-gray-50 border-b sticky top-0">
                                        <th className="px-4 py-2.5 text-left font-semibold text-gray-500">Subject</th>
                                        <th className="px-4 py-2.5 text-left font-semibold text-gray-500">Month</th>
                                        <th className="px-4 py-2.5 text-center font-semibold text-gray-500">%</th>
                                    </tr></thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {(reportData.monthly || []).filter(a => selectedSubjects.has(a.subjectOfferingId)).length === 0
                                            ? <tr><td colSpan={3} className="py-8 text-center text-gray-300">No data</td></tr>
                                            : (reportData.monthly || []).filter(a => selectedSubjects.has(a.subjectOfferingId)).map((a, i) => (
                                                <tr key={i} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2.5 text-gray-700">{a.subjectOffering?.subject?.name}</td>
                                                    <td className="px-4 py-2.5 text-gray-500">{MONTH_LABELS[a.month - 1]} {a.year}</td>
                                                    <td className="px-4 py-2.5 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${a.percentage >= 75 ? 'bg-green-100 text-green-700' : a.percentage >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                            {Math.round(a.percentage)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl border shadow-sm">
                            <div className="px-5 py-4 border-b bg-gradient-to-r from-purple-50 to-transparent">
                                <h4 className="text-sm font-bold text-gray-800">Examination Marks</h4>
                            </div>
                            <div className="overflow-auto max-h-64">
                                <table className="w-full text-xs">
                                    <thead><tr className="bg-gray-50 border-b sticky top-0">
                                        <th className="px-4 py-2.5 text-left font-semibold text-gray-500">Subject</th>
                                        <th className="px-4 py-2.5 text-left font-semibold text-gray-500">Exam</th>
                                        <th className="px-4 py-2.5 text-center font-semibold text-gray-500">Marks</th>
                                    </tr></thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {(reportData.marks || []).filter(m => selectedSubjects.has(m.subjectOfferingId)).length === 0
                                            ? <tr><td colSpan={3} className="py-8 text-center text-gray-300">No data</td></tr>
                                            : (reportData.marks || []).filter(m => selectedSubjects.has(m.subjectOfferingId)).map((m, i) => (
                                                <tr key={i} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2.5 text-gray-700">{m.subjectOffering?.subject?.name}</td>
                                                    <td className="px-4 py-2.5 text-gray-500">{m.examType}</td>
                                                    <td className="px-4 py-2.5 text-center font-black text-indigo-700">{m.marks}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Remarks */}
                    <div className="bg-white rounded-2xl border p-5 shadow-sm">
                        <h4 className="text-sm font-bold text-gray-800 mb-3">✍️ Teacher Remarks</h4>
                        <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3}
                            placeholder="Add comments, recommendations or behavioural notes…"
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition" />
                    </div>
                </>
            ) : null}

            {showChooser && (
                <TemplateChooser
                    templates={STUDENT_TEMPLATES}
                    onChoose={handleChooseTemplate}
                    onCancel={() => setShowChooser(false)}
                />
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   CLASS REPORT
══════════════════════════════════════════════════════════════ */
function ClassReport({ offerings, addToast, teacherName, user, teacherDepartment, savedReports, onReportSaved }) {
    const [selectedOffering, setSelectedOffering] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [saving, setSaving] = useState(false);
    const [showChooser, setShowChooser] = useState(false);
    const [reportTitle, setReportTitle] = useState('');

    const current = offerings.find(o => o.id === selectedOffering) || offerings[0];
    useEffect(() => { if (offerings.length && !selectedOffering) setSelectedOffering(offerings[0].id); }, [offerings]);

    const { studentSummary, examTypes } = useMemo(() => {
        if (!current) return { studentSummary: [], examTypes: [] };
        const map = {};
        for (const se of (current.enrollments || [])) {
            map[se.student.id] = { ...se.student, marks: {}, totalMarks: 0, attMonths: [], avgAtt: 0 };
        }
        for (const m of (current.marks || [])) {
            if (map[m.studentId]) { map[m.studentId].marks[m.examType] = m.marks; map[m.studentId].totalMarks += m.marks; }
        }
        for (const a of (current.monthly || [])) {
            if (map[a.studentId]) map[a.studentId].attMonths.push(a.percentage);
        }
        
        // Use backend-calculated averages if available
        const calcMap = {};
        (current.calculatedAverages || []).forEach(ca => { calcMap[ca.studentId] = ca.avgAtt; });

        for (const s of Object.values(map)) {
            if (calcMap[s.id] !== undefined) {
                s.avgAtt = calcMap[s.id];
            } else {
                s.avgAtt = s.attMonths.length ? Math.round(s.attMonths.reduce((a, b) => a + b, 0) / s.attMonths.length) : 0;
            }
        }
        const ets = [...new Set((current.marks || []).map(m => m.examType))].sort();
        return { studentSummary: Object.values(map), examTypes: ets };
    }, [current]);

    const charts = useMemo(() => {
        const examStats = examTypes.map(et => {
            const vals = studentSummary.filter(s => s.marks[et] !== undefined).map(s => s.marks[et]);
            return { name: et, Avg: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0, Max: vals.length ? Math.max(...vals) : 0, Min: vals.length ? Math.min(...vals) : 0 };
        });
        
        const attDist = [
            { name: '≥75%', value: studentSummary.filter(s => s.avgAtt >= 75).length, fill: '#10b981' },
            { name: '50–74%', value: studentSummary.filter(s => s.avgAtt >= 50 && s.avgAtt < 75).length, fill: '#f59e0b' },
            { name: '<50%', value: studentSummary.filter(s => s.avgAtt < 50).length, fill: '#ef4444' },
        ];

        const mmap = {};
        (current?.monthly || []).forEach(a => {
            const k = `${a.year}-${String(a.month).padStart(2, '0')}`;
            if (!mmap[k]) mmap[k] = { vals: [], month: a.month, year: a.year };
            mmap[k].vals.push(a.percentage);
        });
        const trend = Object.entries(mmap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, d]) => ({ 
                name: `${MONTH_LABELS[d.month - 1]} '${String(d.year).slice(-2)}`, 
                'Class Avg %': Math.round(d.vals.reduce((s, v) => s + v, 0) / d.vals.length) 
            }));
            
        return { examStats, attDist, trend };
    }, [studentSummary, examTypes, current]);

    const handleDownload = () => {
        if (!current || !studentSummary.length) return;
        setShowChooser(true);
    };

    const handleChooseTemplate = (templateId) => {
        setShowChooser(false);
        generateClassPDF(templateId, { offering: current, students: studentSummary, examTypes, remarks }, { teacherName, department: teacherDepartment || user?.department?.name || user?.department || '' });
        addToast('success', 'PDF Downloaded', 'Class report generated.');
    };

    // Generate a unique default title that won't clash with existing reports
    const getDefaultTitle = useCallback((subjectName, isDraft) => {
        const prefix = isDraft ? 'Draft' : 'Final';
        const base = `${prefix} Class Report — ${subjectName}`;
        const existingTitles = new Set((savedReports || []).map(r => r.title));
        if (!existingTitles.has(base)) return base;
        let n = 2;
        while (existingTitles.has(`${base} (${n})`)) n++;
        return `${base} (${n})`;
    }, [savedReports]);

    const handleSave = async (status) => {
        if (!current || !studentSummary.length) return;
        const isDraft = status === 'draft';
        const finalStatus = isDraft ? 'draft' : 'submitted_to_hod';
        const title = reportTitle.trim() || getDefaultTitle(current.subject?.name, isDraft);
        setSaving(true);
        try {
            await api.post('/reports', {
                title,
                content: JSON.stringify({ type: 'class', offeringId: current.id, subjectName: current.subject?.name, remarks }),
                status: finalStatus,
            });
            onReportSaved?.();
            addToast('success', 'Saved', isDraft ? 'Saved as draft.' : 'Report sent to HOD.');
        } catch (e) { addToast('error', 'Save Failed', e.message); }
        finally { setSaving(false); }
    };

    return (
        <div className="space-y-5">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    {offerings.map(o => (
                        <button key={o.id} onClick={() => setSelectedOffering(o.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${selectedOffering === o.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
                                }`}>
                            <BookOpen className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                            {o.subject?.name || 'Subject'}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => handleSave('draft')} disabled={saving || !studentSummary.length}
                        className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-40">
                        {saving ? 'Saving…' : 'Save Draft'}
                    </button>
                    <button onClick={() => handleSave('submitted_to_hod')} disabled={saving || !studentSummary.length}
                        className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 shadow-sm">
                        → HOD
                    </button>
                    <button onClick={handleDownload} disabled={!studentSummary.length}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 shadow-md">
                        <Download className="w-4 h-4" /> Download PDF
                    </button>
                </div>
            </div>

            {/* Report title */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Report Name</label>
                <input
                    value={reportTitle}
                    onChange={e => setReportTitle(e.target.value)}
                    placeholder={`Final Class Report — ${current?.subject?.name || 'Subject'}`}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-gray-300"
                />
                <p className="text-[11px] text-gray-400 mt-1">Leave blank to auto-generate a unique name</p>
            </div>

            {studentSummary.length === 0 ? (
                <div className="bg-white rounded-2xl border py-16 text-center">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-400">No students in this offering.</p>
                </div>
            ) : (
                <>
                    {/* Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {charts.examStats.length > 0 && (
                            <div className="bg-white rounded-2xl border p-5 shadow-sm">
                                <h4 className="text-sm font-bold text-gray-800 mb-3">📊 Marks Summary</h4>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={charts.examStats}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
                                        <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                                        <Bar dataKey="Avg" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Max" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Min" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                        <div className="bg-white rounded-2xl border p-5 shadow-sm">
                            <h4 className="text-sm font-bold text-gray-800 mb-4 text-center">📊 Attendance Distribution</h4>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={charts.attDist} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                                        {charts.attDist.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        {charts.trend.length > 0 && (
                            <div className="bg-white rounded-2xl border p-5 shadow-sm">
                                <h4 className="text-sm font-bold text-gray-800 mb-3">📈 Monthly Trend</h4>
                                <ResponsiveContainer width="100%" height={200}>
                                    <LineChart data={charts.trend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="Class Avg %" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Remarks */}
                    <div className="bg-white rounded-2xl border p-5 shadow-sm">
                        <h4 className="text-sm font-bold text-gray-800 mb-3">✍️ Class Remarks</h4>
                        <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3}
                            placeholder="Overall class observations, syllabus notes, recommendations…"
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition" />
                    </div>

                    {/* Full student table */}
                    <div className="bg-white rounded-2xl border shadow-sm">
                        <div className="px-5 py-4 border-b">
                            <h4 className="text-sm font-bold text-gray-800">{current?.subject?.name} — All Students ({studentSummary.length})</h4>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead><tr className="bg-gray-50 border-b">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Name</th>
                                    {examTypes.map(et => <th key={et} className="px-4 py-3 text-center text-xs font-semibold text-indigo-600">{et}</th>)}
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Total</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Att %</th>
                                </tr></thead>
                                <tbody className="divide-y divide-gray-50">
                                    {studentSummary.map((s, i) => (
                                        <tr key={s.id} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-gray-600">{s.studentId}</td>
                                            <td className="px-4 py-3 font-medium text-gray-900">{s.fullName}</td>
                                            {examTypes.map(et => <td key={et} className="px-4 py-3 text-center text-sm">{s.marks[et] ?? '—'}</td>)}
                                            <td className="px-4 py-3 text-center font-bold text-gray-800">{s.totalMarks}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.avgAtt >= 75 ? 'bg-green-100 text-green-700' : s.avgAtt >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                    {s.avgAtt}%
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

            {showChooser && (
                <TemplateChooser
                    templates={CLASS_TEMPLATES}
                    onChoose={handleChooseTemplate}
                    onCancel={() => setShowChooser(false)}
                />
            )}
        </div>
    );
}
function ReportPreviewModal({ report, onClose }) {
    if (!report) return null;

    let parsed = {};
    try {
        parsed = JSON.parse(report.content || "{}");
    } catch {
        parsed = {};
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-auto">
                
                <div className="flex items-center justify-between p-5 border-b">
                    <h3 className="font-bold text-gray-900 text-lg">
                        {report.title}
                    </h3>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                <div className="p-6 space-y-4 text-sm">
                    
                    <div className="flex gap-4 text-xs text-gray-500">
                        <span>
                            Date: {new Date(report.createdAt).toLocaleDateString()}
                        </span>

                        <span className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px]
                        ${report.status === "forwarded" || report.status === "submitted_to_hod"
                            ? "bg-emerald-100 text-emerald-700"
                            : report.status === "submitted_to_principal"
                            ? "bg-violet-100 text-violet-700"
                            : "bg-amber-100 text-amber-700"}`}>
                            {report.status === 'submitted_to_hod' ? 'Sent to HOD' : report.status === 'submitted_to_principal' ? 'Sent to Principal' : report.status}
                        </span>
                    </div>

                    {parsed.type === "student" && (
                        <>
                            <h4 className="font-semibold text-gray-800">Student Report</h4>
                            <p className="text-gray-600">
                                Student ID: {parsed.studentId}
                            </p>

                            {parsed.remarks && (
                                <div>
                                    <p className="font-semibold text-gray-800 mb-1">Remarks</p>
                                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                                        {parsed.remarks}
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {parsed.type === "class" && (
                        <>
                            <h4 className="font-semibold text-gray-800">Class Report</h4>
                            <p className="text-gray-600">
                                Subject: {parsed.subjectName}
                            </p>

                            {parsed.remarks && (
                                <div>
                                    <p className="font-semibold text-gray-800 mb-1">Remarks</p>
                                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                                        {parsed.remarks}
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function TeacherReports() {
    const { user } = useAuth();
    const [tab, setTab] = useState('single');
    const [offerings, setOfferings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toasts, setToasts] = useState([]);
    const teacherName = user?.fullName || user?.name || user?.username || user?.email || 'Teacher';
    const [savedReports, setSavedReports] = useState([]);
    const [teacherDepartment, setTeacherDepartment] = useState('');
    const [previewReport, setPreviewReport] = useState(null);

    const addToast = (type, title, message = '') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, title, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const [d, r] = await Promise.all([api.get('/reports/data/class'), api.get('/reports')]);
                setOfferings(d.offerings || []);
                setTeacherDepartment(d.teacherDepartment || '');
                setSavedReports(r || []);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        })();
        if (user?.id) api.get('/auth/profile').then(p => setTeacherName(p?.profile?.fullName || '')).catch(() => { });
    }, [user]);

    const refreshReports = useCallback(async () => {
        try {
            const r = await api.get('/reports');
            setSavedReports(r || []);
        } catch { }
    }, []);

    const handleDeleteReport = async (id) => {
        if (!confirm('Delete this report?')) return;
        try {
            await api.delete(`/reports/${id}`);
            setSavedReports(prev => prev.filter(r => r.id !== id));
            addToast('success', 'Deleted', 'Report removed.');
        } catch (e) { addToast('error', 'Error', e.message); }
    };

    const TABS = [
        { key: 'single', label: 'Individual Student', icon: User },
        { key: 'class', label: 'Class Report', icon: Users },
        { key: 'saved', label: 'Saved Reports', icon: FileText },
    ];

    return (
        <DashboardLayout title="Reports & Analytics" subtitle="Generate PDF reports with attendance, marks and charts">
            {/* Tabs */}

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 rounded-xl max-w-md mb-7">
                    {TABS.map(t => {
                        const Icon = t.icon;
                        return (
                            <button key={t.key} onClick={() => setTab(t.key)}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}>
                                <Icon className="w-4 h-4" />{t.label}
                            </button>
                        );
                    })}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                    </div>
                ) : offerings.length === 0 && tab !== 'saved' ? (
                    <div className="bg-white rounded-2xl border py-16 text-center text-gray-400">
                        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-lg font-medium text-gray-500">No data available</p>
                        <p className="text-sm mt-1">Import attendance and marks data first.</p>
                    </div>
                ) : (
                    <>
                        {tab === 'single' && <SingleStudentReport offerings={offerings} addToast={addToast} teacherName={teacherName} savedReports={savedReports} onReportSaved={refreshReports} />}
                        {tab === 'class' && <ClassReport offerings={offerings} addToast={addToast} teacherName={teacherName} user={user} teacherDepartment={teacherDepartment} savedReports={savedReports} onReportSaved={refreshReports} />}
                        {tab === 'saved' && (
                            <div className="bg-white rounded-2xl border shadow-sm">
                                <div className="p-5 border-b flex items-center justify-between">
                                    <h3 className="font-bold text-gray-900">Saved Reports</h3>
                                    <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold">{savedReports.length} total</span>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {savedReports.length === 0 ? (
                                        <div className="py-16 text-center text-gray-400">
                                            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                            <p className="font-medium text-sm">No saved reports yet.</p>
                                        </div>
                                    ) : savedReports.map(r => (
                                        <div key={r.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition group">
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm mb-1">{r.title}</h4>
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(r.createdAt).toLocaleDateString()}</span>
                                                    <span className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px] ${r.status === 'forwarded' || r.status === 'submitted_to_hod' ? 'bg-emerald-100 text-emerald-700' : r.status === 'submitted_to_principal' ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {r.status === 'submitted_to_hod' ? 'Sent to HOD' : r.status === 'submitted_to_principal' ? 'Sent to Principal' : r.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">

    <button
        onClick={() => setPreviewReport(r)}
        className="text-indigo-500 hover:text-indigo-700 p-2 hover:bg-indigo-50 rounded-lg transition"
    >
        <FileText className="w-4 h-4"/>
    </button>

    <button
        onClick={() => handleDeleteReport(r.id)}
        className="text-rose-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-lg transition"
    >
        <X className="w-4 h-4"/>
    </button>

</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
                {previewReport && (
    <ReportPreviewModal
        report={previewReport}
        onClose={() => setPreviewReport(null)}
    />
)}

                {/* Toasts */}
                <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
                    {toasts.map(toast => {
                        const Icon = TOAST_ICONS[toast.type] || Info;
                        return (
                            <div key={toast.id} className={`flex items-start gap-3 px-5 py-4 rounded-xl border shadow-lg max-w-sm ${TOAST_COLORS[toast.type]}`}>
                                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-sm">{toast.title}</p>
                                    {toast.message && <p className="text-xs mt-0.5 opacity-80">{toast.message}</p>}
                                </div>
                                <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="ml-2 opacity-60 hover:opacity-100">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
        </DashboardLayout>
    );
}