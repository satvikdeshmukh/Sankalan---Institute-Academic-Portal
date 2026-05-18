import React, { useMemo, useState, useEffect } from 'react';
import { useTimetable } from '../hooks/useTimetable.js';
import { apiFetch } from '../lib/api.js';
import { generateTimetablePDF } from '../utils/pdfGenerator.js';
import { CalendarDays, Download, Trash2 } from 'lucide-react';

const DAYS = [
    { key: 'Monday', label: 'MON', bg: 'bg-amber-100', text: 'text-amber-700' },
    { key: 'Tuesday', label: 'TUE', bg: 'bg-rose-100', text: 'text-rose-600' },
    { key: 'Wednesday', label: 'WED', bg: 'bg-fuchsia-100', text: 'text-fuchsia-700' },
    { key: 'Thursday', label: 'THU', bg: 'bg-violet-100', text: 'text-violet-700' },
    { key: 'Friday', label: 'FRI', bg: 'bg-sky-100', text: 'text-sky-700' },
    { key: 'Saturday', label: 'SAT', bg: 'bg-teal-100', text: 'text-teal-700' },
];

/**
 * Read-only timetable viewer for teacher and HOD dashboards.
 * If departmentId is null but userId is provided, it self-looks up
 * the teacher's department from teacher_assignments.
 */
export default function DeptTimetableView({ departmentId: propDeptId, departmentName: propDeptName, userId }) {
    const [resolvedDeptId, setResolvedDeptId] = useState(propDeptId || null);
    const [resolvedDeptName, setResolvedDeptName] = useState(propDeptName || '');
    const [lookupDone, setLookupDone] = useState(!!propDeptId); // true immediately if already have deptId

    // localStorage key to hide this timetable per user
    const hiddenKey = userId ? `deptTTHidden_${userId}` : null;
    const [hidden, setHidden] = useState(() =>
        hiddenKey ? localStorage.getItem(hiddenKey) === 'true' : false
    );

    // If no departmentId from context, look it up via teacher_assignments
    useEffect(() => {
        if (propDeptId) {
            setResolvedDeptId(propDeptId);
            setResolvedDeptName(propDeptName || '');
            setLookupDone(true);
            return;
        }
        if (!userId) { setLookupDone(true); return; }

        apiFetch(`/teacher-assignments/${userId}`)
            .then(data => {
                if (data?.department_id) {
                    setResolvedDeptId(data.department_id);
                    setResolvedDeptName(data.departments?.name || '');
                }
                setLookupDone(true);
            })
            .catch(() => setLookupDone(true));
    }, [propDeptId, propDeptName, userId]);

    const { entries, loading } = useTimetable({ departmentId: resolvedDeptId });

    const daysWithData = useMemo(() =>
        DAYS.filter(d => entries.some(e => e.day_of_week === d.key)),
        [entries]);

    const periods = useMemo(() => {
        const nums = [...new Set(entries.map(e => e.period_number))].sort((a, b) => a - b);
        return nums;
    }, [entries]);

    const grid = useMemo(() => {
        const g = {};
        for (const e of entries) {
            if (!g[e.day_of_week]) g[e.day_of_week] = {};
            g[e.day_of_week][e.period_number] = e;
        }
        return g;
    }, [entries]);

    const periodTime = useMemo(() => {
        const map = {};
        for (const e of entries) {
            if (!map[e.period_number]) map[e.period_number] = { start: e.start_time, end: e.end_time };
        }
        return map;
    }, [entries]);

    const handleDownload = () => {
        generateTimetablePDF({
            title: `${resolvedDeptName || 'Department'} Timetable`,
            entries,
        });
    };

    const handleDelete = () => {
        if (hiddenKey) {
            localStorage.setItem(hiddenKey, 'true');
            setHidden(true);
        }
    };

    const handleRestore = () => {
        if (hiddenKey) {
            localStorage.removeItem(hiddenKey);
            setHidden(false);
        }
    };

    if (hidden) {
        return (
            <div className="bg-white rounded-2xl shadow-card p-5 flex items-center justify-between">
                <p className="text-sm text-gray-400">Department timetable is hidden.</p>
                <button onClick={handleRestore} className="text-xs text-blue-500 hover:underline">Restore</button>
            </div>
        );
    }

    if (!lookupDone || loading) {
        return (
            <div className="bg-white rounded-2xl shadow-card p-6">
                <div className="h-4 bg-gray-100 rounded w-40 mb-4 animate-pulse" />
                <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
                </div>
            </div>
        );
    }

    if (!entries.length) {
        return (
            <div className="bg-white rounded-2xl shadow-card p-6 text-center">
                <CalendarDays className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                <p className="text-gray-400 text-sm font-medium">No timetable published yet</p>
                <p className="text-gray-300 text-xs mt-0.5">Admin will publish the department schedule here</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-900">Class Timetable</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2.5 py-1 rounded-lg">
                        {resolvedDeptName || 'Department'}
                    </span>
                    <button
                        onClick={handleDownload}
                        title="Download PDF"
                        className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors font-medium"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Download PDF
                    </button>
                    <button
                        onClick={handleDelete}
                        title="Hide timetable"
                        className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors font-medium"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] border-collapse text-xs">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="px-3 py-2.5 text-left text-gray-400 font-semibold w-[110px]">TIME</th>
                            {daysWithData.map(d => (
                                <th key={d.key} className={`${d.bg} px-3 py-2.5 text-center`}>
                                    <span className={`text-xs font-black tracking-wider ${d.text}`}>{d.label}</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {periods.map(period => (
                            <tr key={period} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-3 py-2 text-gray-400 font-medium whitespace-nowrap">
                                    {periodTime[period]?.start && (
                                        <span>{periodTime[period].start.slice(0, 5)}–{periodTime[period].end.slice(0, 5)}</span>
                                    )}
                                </td>
                                {daysWithData.map(d => {
                                    const entry = grid[d.key]?.[period];
                                    return (
                                        <td key={d.key} className="px-3 py-2 text-center min-w-[90px]">
                                            {entry ? (
                                                <div>
                                                    <p className="font-semibold text-gray-800 leading-tight">{entry.subject}</p>
                                                    {entry.room && <p className="text-gray-400 mt-0.5 text-xs">{entry.room}</p>}
                                                    {entry.teacher_name && <p className="text-blue-400 mt-0.5 text-xs italic">{entry.teacher_name}</p>}
                                                </div>
                                            ) : (
                                                <span className="text-gray-200">—</span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
