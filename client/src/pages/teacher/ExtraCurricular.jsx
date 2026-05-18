import React, { useState } from 'react';
import { useActivities } from '../../hooks/useActivities.js';
import { Award, Download, Plus, Star, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const MONTH_LABELS = [
    { key: 'jan', label: 'January' }, { key: 'feb', label: 'February' }, { key: 'mar', label: 'March' },
    { key: 'apr', label: 'April' }, { key: 'may', label: 'May' }, { key: 'jun', label: 'June' },
    { key: 'jul', label: 'July' }, { key: 'aug', label: 'August' }, { key: 'sep', label: 'September' },
    { key: 'oct', label: 'October' }, { key: 'nov', label: 'November' }, { key: 'dec', label: 'December' },
];

const ACT_YEAR_SEM    = { 1: [1, 2], 2: [3, 4], 3: [5, 6], 4: [7, 8] };
const ACT_YEAR_LABELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

/* ── EntryPopup ── */
function EntryPopup({ month, saving, onSave, onClose }) {
    const [val,  setVal]  = useState('');
    const [desc, setDesc] = useState('');
    const [justSaved, setJustSaved] = useState(false);

    const handleAdd = async () => {
        if (!val) return;
        const ok = await onSave(val, desc);
        if (ok) {
            setJustSaved(true);
            setVal('');
            setDesc('');
            setTimeout(() => setJustSaved(false), 1200);
        }
    };

    return (
        <div
            className="absolute z-50 top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-amber-100 p-3 w-60"
            onClick={e => e.stopPropagation()}
        >
            <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                    <Award className="w-3 h-3" /> Add Activity — {month}
                </p>
                <button onClick={onClose} className="text-gray-300 hover:text-gray-500">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {justSaved && (
                <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-semibold mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved! Add another or close.
                </div>
            )}

            <input
                autoFocus
                type="number" min="0"
                value={val} onChange={e => setVal(e.target.value)}
                placeholder="Points (e.g. 5)"
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') onClose(); }}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs mb-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <input
                type="text"
                value={desc} onChange={e => setDesc(e.target.value)}
                placeholder="Activity name (e.g. Sports, Debate)"
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') onClose(); }}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs mb-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <div className="flex gap-1.5">
                <button onClick={onClose}
                    className="flex-1 py-1.5 border border-gray-200 rounded-lg text-[11px] text-gray-500 hover:bg-gray-50">
                    Done
                </button>
                <button onClick={handleAdd} disabled={saving || !val}
                    className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 disabled:opacity-50">
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    {saving ? 'Saving…' : 'Add'}
                </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 text-center">You can add multiple activities per month</p>
        </div>
    );
}

/* ── ExtraCurricular ── */
export default function ExtraCurricular({ students, userId }) {
    const {
        addEntry, deleteEntry,
        getEntries, getTotal, getMonthTotal,
        saveError, setSaveError,
    } = useActivities(userId);

    const [actYear,   setActYear]   = useState(1);
    const [actSem,    setActSem]    = useState(1);
    const [actSearch, setActSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [openCell, setOpenCell]   = useState(null);
    const [saving,   setSaving]     = useState(false);

    const sems     = ACT_YEAR_SEM[actYear] || [1, 2];
    const filtered = students.filter(s => {
        const matchSem    = Number(s.year) === actYear && Number(s.semester) === actSem;
        const q           = actSearch.toLowerCase();
        const matchSearch = !q || s.name?.toLowerCase().includes(q) || s.student_id?.toLowerCase().includes(q);
        return matchSem && matchSearch;
    });

    const activeStudent = selectedStudent
        ? students.find(s => s.id === selectedStudent.id) || selectedStudent
        : null;

    const handleSave = async (monthKey, val, desc) => {
        if (!val || !activeStudent) return false;
        setSaving(true);
        const ok = await addEntry(activeStudent.id, monthKey, val, desc);
        setSaving(false);
        return ok;
    };

    const handleExport = () => {
        const rows = [];
        const exportList = activeStudent ? [activeStudent] : filtered;
        MONTH_LABELS.forEach(m => {
            exportList.forEach(s => {
                const entries = getEntries(s.id, m.key);
                if (!entries.length) return;
                entries.forEach(e => rows.push({
                    Month: m.label,
                    'Student ID': s.student_id || '',
                    Name: s.name || '',
                    'Credit Points': e.value,
                    'Activity': e.desc || '',
                }));
            });
        });
        if (!rows.length) { alert('No data to export.'); return; }
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Activities');
        XLSX.writeFile(wb, 'extra_curricular_activities.xlsx');
    };

    return (
        <div onClick={() => setOpenCell(null)}>

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 text-base font-bold text-gray-900">
                    {activeStudent && (
                        <button onClick={() => { setSelectedStudent(null); setOpenCell(null); setSaveError(null); }}
                            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 mr-1">
                            <X className="w-4 h-4" /> Back
                        </button>
                    )}
                    <Award className="w-5 h-5 text-amber-500" />
                    {activeStudent
                        ? <><span>{activeStudent.name}</span><span className="text-xs font-normal text-gray-400 ml-1">— Extra Curricular Credits</span></>
                        : <>Extra Curricular Activities<span className="text-xs font-normal text-gray-400 ml-1">Click a student to add credits</span></>
                    }
                </div>
                <div className="flex items-center gap-2">
                    {!activeStudent && (
                        <input value={actSearch} onChange={e => setActSearch(e.target.value)}
                            placeholder="Search student…"
                            className="pl-3 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-40" />
                    )}
                    <button onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                        <Download className="w-4 h-4" /> Export
                    </button>
                </div>
            </div>

            {/* Error banner */}
            {saveError && (
                <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{saveError}</span>
                    <button onClick={() => setSaveError(null)}><X className="w-4 h-4 text-red-400 hover:text-red-600" /></button>
                </div>
            )}

            {/* Year & Semester pills */}
            {/* Filters */}
{!activeStudent && (
    <div className="flex flex-wrap items-center gap-3 mb-5">

        {/* Year Select */}
        <select
            value={actYear}
            onChange={(e) => {
                const yr = Number(e.target.value);
                setActYear(yr);
                setActSem(ACT_YEAR_SEM[yr][0]);
            }}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
            {ACT_YEAR_LABELS.map((label, i) => (
                <option key={i + 1} value={i + 1}>
                    {label}
                </option>
            ))}
        </select>

        {/* Semester Select */}
        <select
            value={actSem}
            onChange={(e) => setActSem(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
            {sems.map((sem) => {
                const cnt = students.filter(
                    (s) =>
                        Number(s.year) === actYear &&
                        Number(s.semester) === sem
                ).length;

                return (
                    <option key={sem} value={sem}>
                        Sem {sem} ({cnt})
                    </option>
                );
            })}
        </select>

        {/* Search */}
        <input
            value={actSearch}
            onChange={(e) => setActSearch(e.target.value)}
            placeholder="Search student..."
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-48"
        />

    </div>
)}

            {/* Student card grid */}
            {!activeStudent && (
                filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center text-gray-400">
                        <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">No students in Year {actYear} · Sem {actSem}</p>
                        <p className="text-xs mt-1">Add students from the Semesters tab first.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {filtered.map(s => {
        const tot = getTotal(s.id);
        return (
            <button
                key={s.id}
                onClick={() => setSelectedStudent(s)}
                className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4 hover:border-amber-400 hover:shadow-md transition-all group"
            >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
                    {s.name?.[0]?.toUpperCase() || '?'}
                </div>

                {/* Student info */}
                <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                        {s.name}
                    </p>

                    <p className="text-[11px] text-gray-400 font-mono">
                        {s.student_id || '—'}
                    </p>

                    <p className="text-[11px] text-gray-400 mt-0.5">
                        Year {s.year} · Sem {s.semester}
                    </p>
                </div>

                {/* Points badge */}
                <div className="flex flex-col items-end">
                    {tot > 0 ? (
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                            {tot} pts
                        </span>
                    ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-400 rounded-full text-xs">
                            No credits
                        </span>
                    )}

                    <span className="text-[10px] text-gray-400 mt-1">
                        View
                    </span>
                </div>
            </button>
        );
    })}
</div>
                )
            )}

            {/* Single student credit table */}
            {activeStudent && (
                <div onClick={e => e.stopPropagation()}>
                    {/* Info bar */}
                    <div className="flex items-center gap-3 mb-4 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-base">
                            {activeStudent.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800">{activeStudent.name}</p>
                            <p className="text-xs text-gray-400">ID: {activeStudent.student_id || '—'} · Year {activeStudent.year} · Sem {activeStudent.semester}</p>
                        </div>
                        <div className="ml-auto">
                            <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-bold">
                                Total: {getTotal(activeStudent.id)} pts
                            </span>
                        </div>
                    </div>

                    {/* Monthly table */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-28">Month</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Activities</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-amber-600 uppercase w-24">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {MONTH_LABELS.map(m => {
                                    const entries  = getEntries(activeStudent.id, m.key);
                                    const monthTot = getMonthTotal(activeStudent.id, m.key);
                                    return (
                                        <tr key={m.key} className="hover:bg-amber-50/30 transition-colors align-top">
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-bold text-gray-700">{m.label}</span>
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="flex flex-wrap gap-1.5 items-center min-h-[28px]">
                                                    {entries.map(entry => (
                                                        <div key={entry.id}
                                                            className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 group">
                                                            <span className="shrink-0 bg-amber-500 text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                                                {entry.value}
                                                            </span>
                                                            {entry.desc && (
                                                                <span className="text-[11px] text-amber-900 max-w-[120px] truncate">{entry.desc}</span>
                                                            )}
                                                            <button
                                                                onClick={() => deleteEntry(activeStudent.id, m.key, entry.id)}
                                                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity ml-0.5"
                                                                title="Remove">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {/* Add button */}
                                                    <div className="relative" onClick={e => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => setOpenCell(prev => prev === m.key ? null : m.key)}
                                                            className="flex items-center gap-0.5 px-2 py-1 rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50 transition-colors text-xs">
                                                            <Plus className="w-3 h-3" /> Add
                                                        </button>
                                                        {openCell === m.key && (
                                                            <EntryPopup
                                                                month={m.label}
                                                                saving={saving}
                                                                onSave={(v, d) => handleSave(m.key, v, d)}
                                                                onClose={() => setOpenCell(null)}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {monthTot > 0
                                                    ? <span className="inline-flex items-center justify-center h-6 px-2 rounded-lg text-xs font-bold bg-amber-500 text-white">{monthTot}</span>
                                                    : <span className="text-gray-300 text-xs">—</span>
                                                }
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-amber-50 border-t-2 border-amber-200">
                                <tr>
                                    <td className="px-4 py-3 text-xs font-bold text-amber-700">Grand Total</td>
                                    <td></td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex items-center justify-center h-7 px-3 rounded-lg text-xs font-bold bg-[#1a2b4b] text-white">
                                            {getTotal(activeStudent.id)}
                                        </span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}