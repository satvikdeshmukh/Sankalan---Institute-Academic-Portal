import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useTimetable } from '../../hooks/useTimetable.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { api } from '../../lib/api.js';
import socket from '../../lib/socket.js';
import {
    Calendar, Download, Clock, BookOpen,
    MapPin, RefreshCw, Layers, Sun, Star,
    GraduationCap, ArrowLeft, CheckCircle2, Building2, ChevronRight
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const ACADEMIC_YEAR = '2025-26';

const DAYS = [
    { key: 'Monday',    label: 'MONDAY',    short: 'MON', bg: 'bg-amber-50',   text: 'text-amber-700',   head: 'bg-amber-100'   },
    { key: 'Tuesday',   label: 'TUESDAY',   short: 'TUE', bg: 'bg-rose-50',    text: 'text-rose-600',    head: 'bg-rose-100'    },
    { key: 'Wednesday', label: 'WEDNESDAY', short: 'WED', bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', head: 'bg-fuchsia-100' },
    { key: 'Thursday',  label: 'THURSDAY',  short: 'THU', bg: 'bg-violet-50',  text: 'text-violet-700',  head: 'bg-violet-100'  },
    { key: 'Friday',    label: 'FRIDAY',    short: 'FRI', bg: 'bg-sky-50',     text: 'text-sky-700',     head: 'bg-sky-100'     },
    { key: 'Saturday',  label: 'SATURDAY',  short: 'SAT', bg: 'bg-teal-50',    text: 'text-teal-700',    head: 'bg-teal-100'    },
];

const TIME_SLOTS = [
    { period: 1, start: '07:30', end: '08:30' },
    { period: 2, start: '08:30', end: '09:30' },
    { period: 3, start: '09:30', end: '10:30' },
    { period: 4, start: '10:30', end: '11:30' },
    { period: 5, start: '11:30', end: '12:30' },
    { period: 6, start: '12:30', end: '13:30' },
    { period: 7, start: '13:30', end: '14:30' },
    { period: 8, start: '14:30', end: '15:30' },
    { period: 9, start: '15:30', end: '16:30' },
];

const YEAR_COLORS = [
    { card: 'from-indigo-500 to-blue-600',   bg: 'bg-indigo-50',  text: 'text-indigo-700'  },
    { card: 'from-violet-500 to-purple-600', bg: 'bg-violet-50',  text: 'text-violet-700'  },
    { card: 'from-rose-500 to-pink-600',     bg: 'bg-rose-50',    text: 'text-rose-700'    },
    { card: 'from-emerald-500 to-teal-600',  bg: 'bg-emerald-50', text: 'text-emerald-700' },
];

function getOrdinal(n) {
    if (n === 1) return '1st'; if (n === 2) return '2nd'; if (n === 3) return '3rd'; return n + 'th';
}

function buildGrid(entries) {
    const grid = {};
    DAYS.forEach(d => { grid[d.key] = {}; TIME_SLOTS.forEach(s => { grid[d.key][s.period] = null; }); });
    for (const e of entries) {
        if (grid[e.dayOfWeek]?.[e.periodNumber] !== undefined) grid[e.dayOfWeek][e.periodNumber] = e;
    }
    return grid;
}

// ─── Read-only timetable grid ─────────────────────────────────────────────────
function TimetableGrid({ entries }) {
    const grid = useMemo(() => buildGrid(entries), [entries]);
    if (!entries.length) {
        return (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-200 text-gray-400">
                <Calendar className="w-10 h-10 mb-3 opacity-30" />
                <p className="font-semibold text-sm">No timetable entries found</p>
                <p className="text-xs mt-1">Contact your HOD or Admin to assign your schedule</p>
            </div>
        );
    }
    return (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-xs border-collapse min-w-[600px]">
                <thead>
                    <tr className="bg-gray-50">
                        <th className="sticky left-0 bg-gray-50 border-b border-r border-gray-200 px-4 py-3 font-bold text-gray-500 text-left w-24">Period</th>
                        {DAYS.map(day => (
                            <th key={day.key} className={`border-b border-r border-gray-200 px-3 py-3 font-bold ${day.text} ${day.head} min-w-[120px]`}>{day.short}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {TIME_SLOTS.map(slot => (
                        <tr key={slot.period} className="hover:bg-gray-50/40 transition-colors">
                            <td className="sticky left-0 bg-white border-b border-r border-gray-200 px-4 py-3">
                                <div className="font-bold text-gray-800">P{slot.period}</div>
                                <div className="text-[10px] text-gray-400">{slot.start}–{slot.end}</div>
                            </td>
                            {DAYS.map(day => {
                                const cell = grid[day.key]?.[slot.period];
                                return (
                                    <td key={day.key} className={`border-b border-r border-gray-200 px-2 py-2 ${cell?.subject ? day.bg : ''}`}>
                                        {cell?.subject ? (
                                            <div className="text-center p-0.5">
                                                <p className={`font-bold text-xs ${day.text} leading-tight`}>{cell.subject}</p>
                                                {cell.teacherName && <p className="text-gray-500 text-[10px] mt-0.5 truncate">{cell.teacherName}</p>}
                                                {cell.room && <p className="text-gray-400 text-[10px]">{cell.room}</p>}
                                                {cell.section && <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-white/70 rounded text-[9px] font-bold text-gray-500">Sec {cell.section}</span>}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-8 text-gray-200">—</div>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── Year/Section card (read-only, for teacher's dept view) ──────────────────
function YearSectionCard({ summary, colorScheme, onClick }) {
    return (
        <button onClick={onClick}
            className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300 hover:-translate-y-0.5 text-left w-full">
            <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${colorScheme.card}`} />
            <div className="p-5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorScheme.card} flex items-center justify-center shadow mb-3`}>
                    <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">{getOrdinal(summary.year)} Year — Sec {summary.section}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Semester {summary.semester}</p>
                <div className="flex items-center justify-between mt-3">
                    <span className={`px-2.5 py-1 ${colorScheme.bg} ${colorScheme.text} text-xs font-bold rounded-lg`}>
                        {summary.entryCount} periods
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </button>
    );
}

// ─── Dept timetable viewer (single year/section) ──────────────────────────────
function DeptTimetableViewer({ departmentId, deptName, selectedYearSec, onBack }) {
    // Only this component fetches for this specific year/sem/section
    // Passing all filters including academicYear prevents fetching other years
    const { entries, loading, refetch } = useTimetable({
        departmentId,
        year: selectedYearSec.year,
        semester: selectedYearSec.semester,
        section: selectedYearSec.section,
        academicYear: ACADEMIC_YEAR,
    });

    // Re-fetch when socket fires for this dept
    useEffect(() => {
        const handler = (data) => {
            if (data.departmentId === departmentId) refetch();
        };
        socket.on('timetable_change', handler);
        return () => socket.off('timetable_change', handler);
    }, [departmentId, refetch]);

    const colorScheme = YEAR_COLORS[(selectedYearSec.year - 1) % YEAR_COLORS.length];

    return (
        <div className="space-y-5">
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-medium group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to {deptName} Timetables
            </button>
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-4 flex-wrap justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorScheme.card} flex items-center justify-center shadow`}>
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900">
                                {getOrdinal(selectedYearSec.year)} Year — Section {selectedYearSec.section}
                            </h2>
                            <p className="text-xs text-gray-400">{deptName} • Semester {selectedYearSec.semester} • {ACADEMIC_YEAR}</p>
                        </div>
                    </div>
                    {!loading && entries.length > 0 && (
                        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {entries.length} periods published
                        </span>
                    )}
                </div>
            </div>
            {loading ? (
                <div className="flex items-center justify-center h-48 text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading timetable…
                </div>
            ) : (
                <TimetableGrid entries={entries} />
            )}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TeacherTimetable() {
    const { user, updateUser } = useAuth();

    // departmentId: prefer from user object; fallback-fetch if missing (stale localStorage)
    const [resolvedDeptId, setResolvedDeptId] = useState(user?.departmentId || null);
    const [deptName, setDeptName] = useState('');

    // Resolve departmentId for users logged in before the login fix
    useEffect(() => {
        if (resolvedDeptId) return; // already have it
        if (!user?.id) return;
        // Fetch the current user's profile to get their departmentId
        api.get('/auth/me').then(data => {
            const deptId = data?.departmentId || null;
            if (deptId) {
                setResolvedDeptId(deptId);
                // Persist into localStorage so it works next load without re-fetch
                if (updateUser) updateUser({ departmentId: deptId });
            }
        }).catch(() => {});
    }, [user?.id, resolvedDeptId, updateUser]);

    // Also resolve when user.departmentId becomes available after a fresh login
    useEffect(() => {
        if (user?.departmentId && !resolvedDeptId) setResolvedDeptId(user.departmentId);
    }, [user?.departmentId, resolvedDeptId]);

    const departmentId = resolvedDeptId;

    const [viewMode, setViewMode] = useState('my');   // 'my' | 'dept'
    // dept sub-view: 'cards' = show year/section cards, 'timetable' = show grid for one
    const [deptSubView, setDeptSubView] = useState('cards');
    const [selectedYearSec, setSelectedYearSec] = useState(null);

    // Summaries: list of published year/section combos for the dept
    const [summaries, setSummaries] = useState([]);
    const [sumLoading, setSumLoading] = useState(false);

    // Personal schedule — always fetched regardless of view
    const { entries: myEntries, loading: myLoading } = useTimetable({
        teacherUserId: user?.id,
        academicYear: ACADEMIC_YEAR,
    });

    // Fetch department name
    useEffect(() => {
        if (!departmentId) return;
        api.get('/auth/departments')
            .then(depts => { const d = (depts || []).find(x => x.id === departmentId); setDeptName(d?.name || ''); })
            .catch(() => {});
    }, [departmentId]);

    const fetchSummaries = useCallback(() => {
        if (!departmentId) return;
        setSumLoading(true);
        // Only fetch for this department — teacher can only see their own dept
        api.get(`/timetable/summary?departmentId=${departmentId}`)
            .then(data => setSummaries((data || []).filter(s => s.entryCount > 0)))
            .catch(() => setSummaries([]))
            .finally(() => setSumLoading(false));
    }, [departmentId]);

    // Fetch summaries when switching to dept view
    useEffect(() => {
        if (viewMode !== 'dept') return;
        fetchSummaries();
    }, [viewMode, fetchSummaries]);

    // Refresh summaries via socket when admin/HOD publishes a change
    useEffect(() => {
        if (!departmentId) return;
        const handler = (data) => {
            if (data.departmentId === departmentId) fetchSummaries();
        };
        socket.on('timetable_change', handler);
        return () => socket.off('timetable_change', handler);
    }, [departmentId, fetchSummaries]);

    // Group summaries by year — deduped (same year+section may appear once per semester; show latest)
    const summaryByYear = useMemo(() => {
        const seen = new Map();
        // Keep the entry with more periods if same year+section appears twice (two semesters)
        for (const s of summaries) {
            const k = `${s.year}-${s.section}`;
            if (!seen.has(k) || seen.get(k).entryCount < s.entryCount) seen.set(k, s);
        }
        const deduped = [...seen.values()].sort((a, b) => a.year - b.year || a.section.localeCompare(b.section));
        const map = {};
        deduped.forEach(s => { if (!map[s.year]) map[s.year] = []; map[s.year].push(s); });
        return map;
    }, [summaries]);

    // Today's classes
    const todayKey = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todaySchedule = useMemo(() =>
        [...myEntries]
            .filter(e => e.dayOfWeek?.toLowerCase() === todayKey.toLowerCase())
            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')),
        [myEntries, todayKey]);

    // Stats
    const weekStats = useMemo(() => {
        const subjects = [...new Set(myEntries.map(e => e.subject).filter(Boolean))];
        const sections = [...new Set(myEntries.map(e => e.section).filter(Boolean))];
        const busyDay = DAYS.reduce((max, d) => {
            const count = myEntries.filter(e => e.dayOfWeek === d.key).length;
            return count > myEntries.filter(e => e.dayOfWeek === max).length ? d.key : max;
        }, DAYS[0].key);
        return { total: myEntries.length, subjects: subjects.length, sections: sections.length, busyDay };
    }, [myEntries]);

    const handleExportPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        const title = `My Schedule — ${user?.name || ''}`;
        doc.setFontSize(14); doc.text(title, 14, 18);
        const grid = buildGrid(myEntries);
        const body = TIME_SLOTS.map(slot => {
            const row = [`P${slot.period}\n${slot.start}-${slot.end}`];
            DAYS.forEach(day => { const c = grid[day.key]?.[slot.period]; row.push(c?.subject ? `${c.subject}\n${c.teacherName||''}\n${c.room||''}` : ''); });
            return row;
        });
        doc.autoTable({ head: [['Period', ...DAYS.map(d => d.short)]], body, startY: 24, styles: { fontSize: 7, cellPadding: 2 }, headStyles: { fillColor: [99, 102, 241] } });
        doc.save('my_timetable.pdf');
    };

    return (
        <DashboardLayout title="Timetable" subtitle="View your schedule and department timetables">
            {/* Tab bar */}
            <div className="flex gap-2 mb-6">
                {[
                    { id: 'my',   label: '👤 My Schedule' },
                    { id: 'dept', label: '🏫 Department View', disabled: !departmentId },
                ].map(tab => (
                    <button key={tab.id}
                        onClick={() => { if (!tab.disabled) { setViewMode(tab.id); setDeptSubView('cards'); setSelectedYearSec(null); } }}
                        disabled={tab.disabled}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
                            ${viewMode === tab.id ? 'bg-gradient-to-br from-emerald-800 to-emerald-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                            ${tab.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
                        {tab.label}
                    </button>
                ))}
                {viewMode === 'my' && (
                    <button onClick={handleExportPDF} className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200">
                        <Download className="w-4 h-4" /> Export PDF
                    </button>
                )}
            </div>

            {/* ── MY SCHEDULE ── */}
            {viewMode === 'my' && (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Periods/Week', value: weekStats.total,    icon: Clock,    color: 'text-indigo-600 bg-indigo-50'  },
                            { label: 'Subjects',     value: weekStats.subjects, icon: BookOpen, color: 'text-emerald-600 bg-emerald-50' },
                            { label: 'Sections',     value: weekStats.sections, icon: Layers,   color: 'text-amber-600 bg-amber-50'    },
                            { label: 'Busiest Day',  value: weekStats.busyDay?.slice(0,3) || '—', icon: Star, color: 'text-violet-600 bg-violet-50' },
                        ].map(stat => (
                            <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
                                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center flex-shrink-0`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xl font-black text-gray-900">{stat.value}</p>
                                    <p className="text-xs text-gray-500">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Today's classes */}
                    {todaySchedule.length > 0 && (
                        <div className="mb-6 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Sun className="w-5 h-5 text-indigo-600" />
                                <h3 className="font-bold text-indigo-900 text-sm">Today — {todayKey}</h3>
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {todaySchedule.map((e, i) => (
                                    <div key={i} className="flex-shrink-0 bg-white rounded-xl border border-indigo-200 p-3 min-w-[130px] shadow-sm">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">P{e.periodNumber}</span>
                                            <span className="text-[10px] text-gray-500">{e.startTime}–{e.endTime}</span>
                                        </div>
                                        <p className="font-bold text-gray-800 text-xs">{e.subject || '—'}</p>
                                        {e.room && <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{e.room}</p>}
                                        {e.section && <span className="mt-1 inline-block px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-semibold">Sec {e.section}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Full schedule */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <h3 className="font-bold text-gray-900 mb-4 text-sm">Full Weekly Schedule</h3>
                        {myLoading
                            ? <div className="flex items-center justify-center h-40 text-gray-400"><RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading…</div>
                            : <TimetableGrid entries={myEntries} />}
                    </div>
                </>
            )}

            {/* ── DEPARTMENT VIEW ── */}
            {viewMode === 'dept' && (
                <>
                    {/* Sub-view: specific timetable grid */}
                    {deptSubView === 'timetable' && selectedYearSec && departmentId ? (
                        <DeptTimetableViewer
                            departmentId={departmentId}
                            deptName={deptName}
                            selectedYearSec={selectedYearSec}
                            onBack={() => { setDeptSubView('cards'); setSelectedYearSec(null); }}
                        />
                    ) : (
                        /* Sub-view: year/section cards */
                        <div className="space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-500 flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-900">{deptName || 'Department'}</h2>
                                    <p className="text-xs text-gray-400">Published timetables — tap to view</p>
                                </div>
                            </div>

                            {sumLoading ? (
                                <div className="flex items-center justify-center h-48 text-gray-400">
                                    <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading…
                                </div>
                            ) : Object.keys(summaryByYear).length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
                                    <Calendar className="w-12 h-12 mb-3 opacity-30" />
                                    <p className="font-semibold text-gray-600">No timetables published yet</p>
                                    <p className="text-xs mt-1">Ask your HOD or Admin to publish the department timetable</p>
                                </div>
                            ) : (
                                Object.entries(summaryByYear).map(([year, yearSummaries]) => (
                                    <div key={year}>
                                        <h3 className="font-bold text-gray-600 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <GraduationCap className="w-4 h-4 text-indigo-500" />
                                            {getOrdinal(parseInt(year))} Year
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {yearSummaries.map(summary => (
                                                <YearSectionCard
                                                    key={`${summary.year}-${summary.section}`}
                                                    summary={summary}
                                                    colorScheme={YEAR_COLORS[(parseInt(year) - 1) % YEAR_COLORS.length]}
                                                    onClick={() => { setSelectedYearSec(summary); setDeptSubView('timetable'); }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </>
            )}
        </DashboardLayout>
    );
}