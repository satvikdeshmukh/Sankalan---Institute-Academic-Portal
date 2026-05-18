import React, { useState, useEffect, useMemo } from 'react';
import { useTimetable } from '../hooks/useTimetable.js';
import { apiFetch } from '../lib/api.js';
import { generateTimetablePDF } from '../utils/pdfGenerator.js';
import { User, Trash2, RefreshCw, CalendarCheck, Download } from 'lucide-react';

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DAY_STYLE = {
    Monday: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-400' },
    Tuesday: { bg: 'bg-rose-100', text: 'text-rose-600', dot: 'bg-rose-400' },
    Wednesday: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', dot: 'bg-fuchsia-400' },
    Thursday: { bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-400' },
    Friday: { bg: 'bg-sky-100', text: 'text-sky-700', dot: 'bg-sky-400' },
    Saturday: { bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-400' },
};

function fmt(t) {
    if (!t) return '';
    return t.slice(0, 5);
}

/**
 * PersonalTimetable
 * Props: userId (string), departmentId (string|null)
 *
 * - On first load with no saved name: shows a name-input form
 * - After name is saved (localStorage): filters department timetable by teacher_name match
 * - Deleted entry IDs stored in localStorage per user
 */
export default function PersonalTimetable({ userId, departmentId: propDeptId }) {
    // Resolve department if not provided
    const [resolvedDeptId, setResolvedDeptId] = useState(propDeptId || null);

    useEffect(() => {
        if (propDeptId) { setResolvedDeptId(propDeptId); return; }
        if (!userId) return;
        apiFetch(`/teacher-assignments/${userId}`)
            .then(data => {
                if (data?.department_id) setResolvedDeptId(data.department_id);
            })
            .catch(() => { });
    }, [propDeptId, userId]);

    // Teacher name stored in localStorage
    const nameKey = userId ? `ptName_${userId}` : 'ptName_guest';
    const deletedKey = userId ? `ptDeleted_${userId}` : 'ptDeleted_guest';

    const [teacherName, setTeacherName] = useState(() => localStorage.getItem(nameKey) || '');
    const [inputValue, setInputValue] = useState('');
    const [deletedIds, setDeletedIds] = useState(() => {
        try { return new Set(JSON.parse(localStorage.getItem(deletedKey) || '[]')); }
        catch { return new Set(); }
    });

    const { entries, loading } = useTimetable({ departmentId: resolvedDeptId });

    // Filter entries by teacher name (case-insensitive, trim)
    const myEntries = useMemo(() => {
        if (!teacherName || !entries.length) return [];
        const name = teacherName.trim().toLowerCase();
        return entries.filter(e =>
            e.teacher_name?.trim().toLowerCase() === name &&
            !deletedIds.has(e.id)
        );
    }, [entries, teacherName, deletedIds]);

    // Group by day, sorted
    const grouped = useMemo(() => {
        const g = {};
        for (const e of myEntries) {
            if (!g[e.day_of_week]) g[e.day_of_week] = [];
            g[e.day_of_week].push(e);
        }
        // Sort each day's entries by period_number
        for (const day of Object.keys(g)) {
            g[day].sort((a, b) => a.period_number - b.period_number);
        }
        return g;
    }, [myEntries]);

    const orderedDays = DAY_ORDER.filter(d => grouped[d]);

    const handleSaveName = () => {
        const name = inputValue.trim();
        if (!name) return;
        localStorage.setItem(nameKey, name);
        setTeacherName(name);
        setInputValue('');
    };

    const handleDelete = (entryId) => {
        setDeletedIds(prev => {
            const next = new Set(prev);
            next.add(entryId);
            localStorage.setItem(deletedKey, JSON.stringify([...next]));
            return next;
        });
    };

    const handleReset = () => {
        localStorage.removeItem(nameKey);
        localStorage.removeItem(deletedKey);
        setTeacherName('');
        setDeletedIds(new Set());
    };

    const handleDeleteAll = () => {
        // Mark every visible entry as deleted
        setDeletedIds(prev => {
            const next = new Set(prev);
            for (const e of myEntries) next.add(e.id);
            localStorage.setItem(deletedKey, JSON.stringify([...next]));
            return next;
        });
    };

    const handleDownload = () => {
        generateTimetablePDF({
            title: `My Timetable — ${teacherName}`,
            entries: myEntries,
            teacherName,
        });
    };

    // ── Name input screen ────────────────────────────────────────────────────
    if (!teacherName) {
        return (
            <div className="bg-white rounded-2xl shadow-card p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <User className="w-7 h-7 text-blue-500" />
                </div>
                <h3 className="font-bold text-gray-800 text-base mb-1">Setup Your Personal Timetable</h3>
                <p className="text-gray-400 text-sm mb-6">
                    Enter your name <span className="text-blue-500 font-medium">exactly as it appears in the department timetable</span> to see your personalised schedule.
                </p>
                <div className="flex gap-2 max-w-sm mx-auto">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                        placeholder="e.g. M. Gaur"
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
                        autoFocus
                    />
                    <button
                        onClick={handleSaveName}
                        disabled={!inputValue.trim()}
                        className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
                    >
                        Show
                    </button>
                </div>
            </div>
        );
    }

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-card p-6">
                <div className="h-4 bg-gray-100 rounded w-48 mb-4 animate-pulse" />
                <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
                </div>
            </div>
        );
    }

    // ── No matches ───────────────────────────────────────────────────────────
    return (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-900">My Timetable</h3>
                    <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2.5 py-1 rounded-lg ml-1">
                        {teacherName}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {myEntries.length > 0 && (
                        <>
                            <button
                                onClick={handleDownload}
                                title="Download PDF"
                                className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors font-medium"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Download PDF
                            </button>
                            <button
                                onClick={handleDeleteAll}
                                title="Delete all my slots"
                                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors font-medium"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete All
                            </button>
                        </>
                    )}
                    <button
                        onClick={handleReset}
                        title="Change name / reset"
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Change name
                    </button>
                </div>
            </div>

            {myEntries.length === 0 ? (
                <div className="px-6 py-10 text-center">
                    <p className="text-gray-400 text-sm font-medium">No slots found for <span className="text-blue-500">"{teacherName}"</span></p>
                    <p className="text-gray-300 text-xs mt-1">Make sure the name matches exactly as entered by the admin</p>
                    <button onClick={handleReset} className="mt-4 text-xs text-blue-500 hover:underline">
                        Try a different name
                    </button>
                </div>
            ) : (
                <div className="divide-y divide-gray-50">
                    {orderedDays.map(day => {
                        const style = DAY_STYLE[day] || DAY_STYLE.Monday;
                        return (
                            <div key={day} className="px-6 py-4">
                                {/* Day header */}
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                                    <span className={`text-xs font-black tracking-widest uppercase ${style.text}`}>{day}</span>
                                </div>
                                {/* Slots */}
                                <div className="space-y-2">
                                    {grouped[day].map(entry => (
                                        <div
                                            key={entry.id}
                                            className={`flex items-center gap-4 ${style.bg} rounded-xl px-4 py-3 group`}
                                        >
                                            {/* Time */}
                                            <div className="w-28 flex-shrink-0">
                                                <p className={`text-xs font-semibold ${style.text}`}>
                                                    {fmt(entry.start_time)} – {fmt(entry.end_time)}
                                                </p>
                                            </div>
                                            {/* Subject */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-800 truncate">{entry.subject}</p>
                                                {entry.room && (
                                                    <p className="text-xs text-gray-500 mt-0.5">Room: {entry.room}</p>
                                                )}
                                            </div>
                                            {/* Period badge */}
                                            <span className="text-xs text-gray-400 font-medium flex-shrink-0">
                                                P{entry.period_number}
                                            </span>
                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDelete(entry.id)}
                                                title="Remove from my timetable"
                                                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
