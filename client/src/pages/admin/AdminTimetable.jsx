import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTimetable } from '../../hooks/useTimetable.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { api } from '../../lib/api.js';
import socket from '../../lib/socket.js';
import {
    CheckCircle2, Save, Building2, X, Trash2, Download, Clock,
    Calendar, Edit, Plus, Search, ChevronRight,
    ArrowLeft, Users, RefreshCw, GraduationCap,
    User, Edit3, AlertTriangle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_TIME_SLOTS = [
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

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_COLORS = {
    Monday:    { bg: 'bg-amber-50',   text: 'text-amber-700',   head: 'bg-amber-100'   },
    Tuesday:   { bg: 'bg-rose-50',    text: 'text-rose-600',    head: 'bg-rose-100'    },
    Wednesday: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', head: 'bg-fuchsia-100' },
    Thursday:  { bg: 'bg-violet-50',  text: 'text-violet-700',  head: 'bg-violet-100'  },
    Friday:    { bg: 'bg-sky-50',     text: 'text-sky-700',     head: 'bg-sky-100'     },
    Saturday:  { bg: 'bg-teal-50',    text: 'text-teal-700',    head: 'bg-teal-100'    },
};
const DEPT_COLORS = [
    'from-indigo-500 to-blue-600',
    'from-violet-500 to-purple-600',
    'from-rose-500 to-pink-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-sky-600',
];

function getOrdinalSuffix(n) {
    if (n === 1) return '1st';
    if (n === 2) return '2nd';
    if (n === 3) return '3rd';
    return n + 'th';
}

function buildGrid(entries, timeSlots) {
    const slots = timeSlots || DEFAULT_TIME_SLOTS;
    const grid = {};
    for (const d of DAYS) {
        grid[d] = {};
        for (const s of slots) grid[d][s.period] = null;
    }
    for (const e of entries) {
        const dayKey = e.dayOfWeek?.charAt(0).toUpperCase() + e.dayOfWeek?.slice(1).toLowerCase();
        if (grid[dayKey] !== undefined) {
            grid[dayKey][e.periodNumber] = e;
        }
    }
    return grid;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    if (!msg) return null;
    return (
        <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold border
            ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {msg.text}
            <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
        </div>
    );
}

// ─── Department Overview Card ─────────────────────────────────────────────────
function DeptCard({ dept, summaries, colorClass, onClick }) {
    const deptSummaries = summaries.filter(s => s.departmentId === dept.id);
    const totalEntries = deptSummaries.reduce((acc, s) => acc + (s.entryCount || 0), 0);
    const sections = [...new Set(deptSummaries.map(s => s.section).filter(Boolean))].sort();
    const years = [...new Set(deptSummaries.map(s => s.year).filter(Boolean))].sort();
    return (
        <button onClick={onClick} className="group relative bg-white rounded-2xl border border-gray-200 p-6 text-left hover:shadow-xl hover:border-gray-300 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${colorClass} rounded-t-2xl`} />
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-lg`}>
                    <Building2 className="w-6 h-6 text-white" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-0.5">{dept.name}</h3>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{dept.shortId}</p>
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-gray-800">{totalEntries}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Total Periods</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-gray-800">{deptSummaries.length}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Timetables</p>
                </div>
            </div>
            {sections.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                    {sections.map(sec => <span key={sec} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg">Sec {sec}</span>)}
                    {years.map(yr => <span key={yr} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg">Yr {yr}</span>)}
                </div>
            )}
            {totalEntries === 0 && <p className="mt-3 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5 font-medium">No timetable published yet</p>}
        </button>
    );
}

// ─── Year+Section Card ────────────────────────────────────────────────────────
function YearSectionCard({ year, section, semester, entryCount, colorClass, onClick, onDelete }) {
    return (
        <div className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300 hover:-translate-y-0.5">
            <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${colorClass}`} />
            {/* Delete button top-right */}
            <button
                onClick={e => { e.stopPropagation(); onDelete(); }}
                className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all z-10"
                title="Delete this timetable"
            >
                <Trash2 className="w-3 h-3" />
            </button>
            <button onClick={onClick} className="w-full p-5 text-left">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center shadow mb-3`}>
                    <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-base pr-6">{getOrdinalSuffix(year)} Year — Sec {section}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Semester {semester}</p>
                <div className="mt-3">
                    {entryCount > 0
                        ? <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg">{entryCount} periods</span>
                        : <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-xs font-medium rounded-lg">Not published</span>}
                </div>
            </button>
        </div>
    );
}

// ─── Add Year+Section Modal ───────────────────────────────────────────────────
function AddYearSectionModal({ onAdd, onClose, existing }) {
    const [year, setYear] = useState(1);
    const [section, setSection] = useState('A');
    const [semester, setSemester] = useState(1);

    // Custom section input — allow A-Z or custom
    const [customSection, setCustomSection] = useState('');
    const [useCustom, setUseCustom] = useState(false);

    const finalSection = useCustom ? customSection.toUpperCase() : section;
    const alreadyExists = existing.some(e => e.year === year && e.section === finalSection);

    const handleAdd = () => {
        if (!finalSection) return;
        if (alreadyExists) return;
        onAdd({ year, section: finalSection, semester });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Add Year & Section</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-6 space-y-4">
                    {/* Year */}
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">Year</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4].map(y => (
                                <button key={y} onClick={() => { setYear(y); setSemester(y * 2 - 1); }}
                                    className={`flex-1 h-10 rounded-xl text-sm font-bold transition-all ${year === y ? 'bg-indigo-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                    {y}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Semester */}
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">Semester</label>
                        <div className="flex gap-2">
                            {[year * 2 - 1, year * 2].map(s => (
                                <button key={s} onClick={() => setSemester(s)}
                                    className={`flex-1 h-10 rounded-xl text-sm font-bold transition-all ${semester === s ? 'bg-indigo-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                    Sem {s}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Section */}
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">Section</label>
                        {!useCustom ? (
                            <div className="flex gap-2 flex-wrap">
                                {['A', 'B', 'C', 'D', 'E'].map(s => (
                                    <button key={s} onClick={() => setSection(s)}
                                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${section === s ? 'bg-emerald-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                        {s}
                                    </button>
                                ))}
                                <button onClick={() => setUseCustom(true)}
                                    className="px-3 h-10 rounded-xl text-xs font-semibold bg-gray-100 text-gray-500 hover:bg-gray-200">
                                    Custom
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input value={customSection} onChange={e => setCustomSection(e.target.value)} maxLength={3}
                                    placeholder="e.g. F or G1"
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase" />
                                <button onClick={() => { setUseCustom(false); setCustomSection(''); }}
                                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-200">
                                    Preset
                                </button>
                            </div>
                        )}
                    </div>

                    {alreadyExists && (
                        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-xs font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            Year {year} Section {finalSection} already exists
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-1">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200">Cancel</button>
                        <button onClick={handleAdd} disabled={alreadyExists || !finalSection}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed">
                            Add
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Timetable Grid ───────────────────────────────────────────────────────────
function TimetableGrid({ entries, activeDays, timeSlots, onCellClick, editMode, grid }) {
    const displayDays = DAYS.filter(d => activeDays.includes(d));
    if (!entries.length && !editMode) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Calendar className="w-12 h-12 mb-3 opacity-30" />
                <p className="font-semibold">No timetable entries found</p>
                <p className="text-sm mt-1">Switch to Edit mode to create a timetable</p>
            </div>
        );
    }
    const displayGrid = editMode ? grid : buildGrid(entries, timeSlots);
    return (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-xs border-collapse min-w-[700px]">
                <thead>
                    <tr className="bg-gray-50">
                        <th className="sticky left-0 bg-gray-50 border-b border-r border-gray-200 px-4 py-3 font-bold text-gray-500 text-left w-28">Period / Time</th>
                        {displayDays.map(day => {
                            const c = DAY_COLORS[day];
                            return <th key={day} className={`border-b border-r border-gray-200 px-4 py-3 font-bold ${c.text} ${c.head} min-w-[130px]`}>{day.toUpperCase().slice(0, 3)}</th>;
                        })}
                    </tr>
                </thead>
                <tbody>
                    {timeSlots.map(slot => (
                        <tr key={slot.period} className="hover:bg-gray-50/50 transition-colors">
                            <td className="sticky left-0 bg-white border-b border-r border-gray-200 px-4 py-3 whitespace-nowrap">
                                <div className="font-bold text-gray-800">P{slot.period}</div>
                                <div className="text-gray-400 text-[10px]">{slot.start}–{slot.end}</div>
                            </td>
                            {displayDays.map(day => {
                                const cell = displayGrid[day]?.[slot.period];
                                const c = DAY_COLORS[day];
                                const hasContent = cell?.subject || cell?.id;
                                return (
                                    <td key={day}
                                        className={`border-b border-r border-gray-200 px-2 py-2 transition-all
                                            ${editMode ? 'cursor-pointer hover:' + c.bg : ''}
                                            ${hasContent ? c.bg : ''}`}
                                        onClick={() => editMode && onCellClick && onCellClick(day, slot.period)}>
                                        {hasContent ? (
                                            <div className="text-center p-1">
                                                <p className={`font-bold ${c.text} text-xs leading-tight`}>{cell.subject || '—'}</p>
                                                {cell.teacherName && <p className="text-gray-500 text-[10px] mt-0.5 truncate">{cell.teacherName}</p>}
                                                {cell.room && <p className="text-gray-400 text-[10px]">{cell.room}</p>}
                                            </div>
                                        ) : editMode ? (
                                            <div className="flex items-center justify-center h-10 text-gray-300 hover:text-gray-400"><Plus className="w-4 h-4" /></div>
                                        ) : (
                                            <div className="flex items-center justify-center h-10 text-gray-200">—</div>
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

// ─── Cell Edit Modal (all select boxes + smart teacher fetch) ─────────────────
function CellEditModal({ cellModal, cellForm, setCellForm, onSave, onClose, deptSubjects, deptId, dept, allEntries,
    showToast }) {
    const [subjectTeachers, setSubjectTeachers] = useState([]);
    const [loadingTeachers, setLoadingTeachers] = useState(false);
    const [teacherClash, setTeacherClash] = useState(null);
const [roomClash, setRoomClash] = useState(null);

    // Predefined rooms — can be extended
    const ROOMS = ['CR-101', 'CR-102', 'CR-103', 'CR-104', 'CR-105',
                   'Lab-1', 'Lab-2', 'Lab-3', 'Seminar Hall', 'Auditorium'];

    // When subject changes, fetch teachers who teach that subject
    useEffect(() => {
        if (!cellForm.subject) {
            setSubjectTeachers([]);
            return;
        }
        setLoadingTeachers(true);
        // Use the existing /timetable/teachers-by-subject endpoint
        api.get(`/timetable/teachers-by-subject?subjectName=${encodeURIComponent(cellForm.subject)}&departmentId=${deptId}`)
            .then(data => {
                setSubjectTeachers(data || []);
            })
            .catch(() => setSubjectTeachers([]))
            .finally(() => setLoadingTeachers(false));
    }, [cellForm.subject, deptId]);

    const handleSubjectChange = (e) => {
        // Reset teacher when subject changes
        setCellForm(p => ({ ...p, subject: e.target.value, teacherId: '', teacherName: '' }));
    };

    const handleTeacherChange = async (e) => {

    const tid = e.target.value;

    const teacher = subjectTeachers.find(t => t.id === tid);
    const name = teacher?.profile?.fullName || '';

    try {

        const result = await api.get(
            `/timetable/check-teacher-clash?teacherId=${tid}&dayOfWeek=${cellModal.day}&periodNumber=${cellModal.period}&academicYear=2025-26`
        );

        if (result.clash) {

            setTeacherClash(
                `${name} already teaching ${result.department} Year ${result.year} Sec ${result.section} on ${cellModal.day} Period ${cellModal.period}`
            );

        } else {
            setTeacherClash(null);
        }

    } catch (err) {
        console.error(err);
    }

    setCellForm(p => ({
        ...p,
        teacherId: tid,
        teacherName: name
    }));
};

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-900">Edit Period</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{cellModal.day} — Period {cellModal.period}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-6 space-y-4">
                    {/* Subject — select box */}
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">Subject</label>
                        <select value={cellForm.subject} onChange={handleSubjectChange}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                            <option value="">— Select Subject —</option>
                            {deptSubjects.map(s => (
                                <option key={s.id} value={s.name}>{s.name} {s.code ? `(${s.code})` : ''}</option>
                            ))}
                        </select>
                    </div>

                    {/* Teacher — select box, populated based on subject */}
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                            Teacher
                            {loadingTeachers && <span className="ml-2 text-indigo-400 font-normal">Loading…</span>}
                            {!loadingTeachers && cellForm.subject && subjectTeachers.length === 0 && (
                                <span className="ml-2 text-amber-500 font-normal text-[10px]">No teachers assigned to this subject</span>
                            )}
                        </label>
                        <select value={cellForm.teacherId} onChange={handleTeacherChange}
                            disabled={!cellForm.subject || loadingTeachers}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed">
                            <option value="">— No teacher assigned —</option>
                            {subjectTeachers.map(t => (
                                <option key={t.id} value={t.id}>{t.profile?.fullName || t.email}</option>
                            ))}
                        </select>
                        {cellForm.subject && subjectTeachers.length === 0 && !loadingTeachers && (
                            <p className="text-[10px] text-amber-600 mt-1 bg-amber-50 rounded-lg px-2 py-1">
                                Assign a teacher to this subject in Subject Management first.
                            </p>
                        )}
                    </div>

                    {/* Room — select box */}
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">Room</label>
                        <select
value={cellForm.room}
onChange={async e => {

    const room = e.target.value;

    try {

        const result = await api.get(
            `/timetable/check-room-clash?room=${room}&dayOfWeek=${cellModal.day}&periodNumber=${cellModal.period}&academicYear=2025-26`
        );

        if (result.clash) {

            setRoomClash(
                `Room ${room} already booked for ${result.department} Year ${result.year} Sec ${result.section} on ${cellModal.day} Period ${cellModal.period}`
            );

        } else {
            setRoomClash(null);
        }

    } catch (err) {
        console.error(err);
    }

    setCellForm(p => ({ ...p, room }));

}}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                            <option value="">— Select Room —</option>
                            {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    <div className="flex justify-between pt-2">
                        <button onClick={() => {
                            setCellForm({ subject: '', room: '', teacherName: '', teacherId: '' });
                            onSave({ subject: '', room: '', teacherName: '', teacherId: '' });
                        }} className="px-4 py-2 text-red-600 text-sm font-semibold hover:bg-red-50 rounded-xl">
                            Clear
                        </button>
                        
                        <button
    onClick={() => onSave(cellForm)}
    disabled={teacherClash || roomClash}
    className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
>
    Save
</button>
                    </div>
                </div>
                {teacherClash && (
    <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs font-semibold">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        {teacherClash}
    </div>
)}

{roomClash && (
    <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs font-semibold">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        {roomClash}
    </div>
)}
            </div>
        </div>
    );
}


// ─── Period Edit Modal ────────────────────────────────────────────────────────
function PeriodEditModal({ slot, onSave, onClose }) {
    const [form, setForm] = useState({ period: slot.period, start: slot.start, end: slot.end });
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Edit Period {slot.period} Timing</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">Period Number</label>
                        <input type="number" min={1} value={form.period}
                            onChange={e => setForm(p => ({ ...p, period: parseInt(e.target.value) || p.period }))}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Start Time</label>
                            <input type="time" value={form.start} onChange={e => setForm(p => ({ ...p, start: e.target.value }))}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1.5">End Time</label>
                            <input type="time" value={form.end} onChange={e => setForm(p => ({ ...p, end: e.target.value }))}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200">Cancel</button>
                        <button onClick={() => onSave(form)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Teacher Card ─────────────────────────────────────────────────────────────
function TeacherCard({ teacher, onClick }) {
    return (
        <button onClick={onClick} className="group bg-white rounded-2xl border border-gray-200 p-4 text-left hover:shadow-lg hover:border-indigo-200 transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-sm">
                    <User className="w-5 h-5 text-white" />
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 ml-auto group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="font-bold text-gray-900 text-sm leading-tight">{teacher.full_name || teacher.fullName || 'Unknown'}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{teacher.email}</p>
        </button>
    );
}

// ─── Teacher Schedule View ────────────────────────────────────────────────────
function TeacherTimetableView({ teacher, departments, onBack }) {
    const { entries, loading } = useTimetable({ teacherUserId: teacher.user_id || teacher.id });
    const deptName = useMemo(() => {
        const deptId = teacher.department_id || teacher.departmentId;
        if (!deptId) return '';
        return departments.find(d => d.id === deptId)?.name || '';
    }, [teacher, departments]);

    return (
        <div className="space-y-5">
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-medium group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Teachers
            </button>
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow">
                        <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">{teacher.full_name || teacher.fullName}</h3>
                        <p className="text-xs text-gray-500">{teacher.email}{deptName ? ' • ' + deptName : ''}</p>
                    </div>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center h-48 text-gray-400">
                        <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading…
                    </div>
                ) : (
                    <TimetableGrid entries={entries} activeDays={DAYS} timeSlots={DEFAULT_TIME_SLOTS} editMode={false} />
                )}
            </div>
        </div>
    );
}

// ─── Dept Detail View (class + teacher tabs) ──────────────────────────────────
function DeptDetailView({ dept, summaries, teachers, departments, onBack, showToast, selectedYearSec }) {
    const [activeTab, setActiveTab] = useState('class');
    const [selectedYear, setSelectedYear] = useState(selectedYearSec?.year || 1);
    const [selectedSem, setSelectedSem] = useState(selectedYearSec?.semester || 1);
    const [selectedSec, setSelectedSec] = useState(selectedYearSec?.section || 'A');
    const [editMode, setEditMode] = useState(false);
    const [grid, setGrid] = useState(null);
    const [activeDays, setActiveDays] = useState(DAYS.slice(0, 5));
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [cellModal, setCellModal] = useState(null);
    const [cellForm, setCellForm] = useState({ subject: '', room: '', teacherName: '', teacherId: '' });
    const [deptSubjects, setDeptSubjects] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [timeSlots, setTimeSlots] = useState(DEFAULT_TIME_SLOTS);
    const [periodEditModal, setPeriodEditModal] = useState(null);
    const [teacherSearch, setTeacherSearch] = useState('');
    const [selectedTeacherForView, setSelectedTeacherForView] = useState(null);
    const academicYear = '2025-26';

    const { entries, loading, refetch, addBulkEntries, deleteByDept } = useTimetable({
        departmentId: dept.id, year: selectedYear, semester: selectedSem, section: selectedSec, academicYear
    });

    // Fetch ALL entries for this dept across all years/sections to find every assigned teacher
    const { entries: allDeptEntries } = useTimetable({
        departmentId: dept.id,
        academicYear
    });

    const assignedTeacherIds = useMemo(() => {
        return new Set(allDeptEntries.map(e => e.teacherId).filter(Boolean));
    }, [allDeptEntries]);

    useEffect(() => {
        api.get('/subjects').then(data => setDeptSubjects((data || []).filter(s => s.departmentId === dept.id))).catch(() => {});
    }, [dept.id]);

    // Fetch all users via admin route (works for ADMIN role unlike /principal/stats)
    useEffect(() => {
        api.get('/admin/users').then(data => setAllUsers(data || [])).catch(() => {});
    }, []);

    useEffect(() => {
        if (editMode) setGrid(buildGrid(entries, timeSlots));
    }, [entries, editMode]);

    const handleCellClick = (day, period) => {
        const cell = grid?.[day]?.[period];
        setCellForm({ subject: cell?.subject || '', room: cell?.room || '', teacherName: cell?.teacherName || '', teacherId: cell?.teacherId || '' });
        setCellModal({ day, period });
    };

    const handleCellSave = (formData) => {
        const { day, period } = cellModal;
        const data = formData !== undefined ? formData : cellForm;
        setGrid(prev => ({ ...prev, [day]: { ...prev[day], [period]: { ...data, id: prev[day]?.[period]?.id } } }));
        setCellModal(null);
    };

    const handlePublish = async () => {
    setSaving(true);

    try {

        const toSave = [];

        for (const day of activeDays) {
            for (const slot of timeSlots) {

                const cell = grid?.[day]?.[slot.period];

                if (cell?.subject) {
                    toSave.push({
                        departmentId: dept.id,
                        dayOfWeek: day,
                        startTime: slot.start,
                        endTime: slot.end,
                        periodNumber: slot.period,
                        subject: cell.subject,
                        room: cell.room || '',
                        teacherName: cell.teacherName || '',
                        teacherId: cell.teacherId || null,
                        academicYear,
                        year: selectedYear,
                        semester: selectedSem,
                        section: selectedSec,
                    });
                }

            }
        }

        if (toSave.length === 0) {
            showToast('error', 'No periods filled.');
            setSaving(false);
            return;
        }

        await addBulkEntries(toSave, dept.id);

        await refetch();

        setEditMode(false);

        showToast('success', `Timetable published! (${toSave.length} periods)`);

    } catch (err) {

        showToast('error', err.message || 'Failed to publish');

    } finally {

        setSaving(false);

    }
};
    const handleDelete = async () => {
        if (!window.confirm('Delete entire timetable for this year/semester/section?')) return;
        setDeleting(true);
        try {
            await deleteByDept(dept.id, { year: selectedYear, semester: selectedSem, section: selectedSec, academicYear });
            await refetch(); showToast('success', 'Timetable deleted');
        } catch (err) { showToast('error', err.message); } finally { setDeleting(false); }
    };

    const handleExportPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(16);
        doc.text(`${dept.name} — Year ${selectedYear} Sem ${selectedSem} Sec ${selectedSec}`, 14, 18);
        const rows = timeSlots.map(slot => {
            const row = [`P${slot.period}\n${slot.start}-${slot.end}`];
            for (const day of activeDays) { const g = buildGrid(entries, timeSlots); const cell = g[day]?.[slot.period]; row.push(cell?.subject ? `${cell.subject}\n${cell.teacherName || ''}\n${cell.room || ''}` : ''); }
            return row;
        });
        doc.autoTable({ head: [['Period', ...activeDays.map(d => d.toUpperCase().slice(0, 3))]], body: rows, startY: 25, styles: { fontSize: 8, cellPadding: 3 }, headStyles: { fillColor: [79, 70, 229] } });
        doc.save(`timetable_${dept.shortId}_Y${selectedYear}S${selectedSem}${selectedSec}.pdf`);
    };

    const handlePeriodEdit = (updatedSlot) => {
        setTimeSlots(prev => prev.map(s => s.period === periodEditModal.period ? { ...s, ...updatedSlot } : s));
        if (updatedSlot.period !== periodEditModal.period && grid) {
            setGrid(prev => {
                const newGrid = { ...prev };
                for (const day of DAYS) {
                    const cell = prev[day]?.[periodEditModal.period];
                    newGrid[day] = { ...prev[day] };
                    delete newGrid[day][periodEditModal.period];
                    newGrid[day][updatedSlot.period] = cell;
                }
                return newGrid;
            });
        }
        setPeriodEditModal(null);
    };

    // Show only teachers (by role) who are assigned in this dept's timetable entries
    const filteredTeachers = useMemo(() => {
        return allUsers.filter(t => {
            if (t.role !== 'TEACHER') return false;
            const tid = t.id;
            if (!assignedTeacherIds.has(tid)) return false;
            const name = (t.fullName || t.full_name || '').toLowerCase();
            const email = (t.email || '').toLowerCase();
            const matchSearch = !teacherSearch || name.includes(teacherSearch.toLowerCase()) || email.includes(teacherSearch.toLowerCase());
            return matchSearch;
        });
    }, [allUsers, assignedTeacherIds, teacherSearch]);

    if (selectedTeacherForView) {
        return <TeacherTimetableView teacher={selectedTeacherForView} departments={departments} onBack={() => setSelectedTeacherForView(null)} />;
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-4 flex-wrap">
                <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-medium group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    {dept.name} — Timetables
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center"><Building2 className="w-5 h-5 text-white" /></div>
                    <div>
                        <h2 className="font-bold text-gray-900 text-lg">{dept.name}</h2>
                        <p className="text-xs text-gray-400 font-semibold uppercase">{dept.shortId} — Year {selectedYear} Sec {selectedSec}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {[{ id: 'class', label: '🏫 Class-wise' }, { id: 'teacher', label: '👨‍🏫 Teacher-wise' }].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all
                            ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* CLASS-WISE TAB */}
            {activeTab === 'class' && (
                <>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4">
                        <div className="flex flex-wrap gap-3 items-center justify-between">
                            <div className="flex flex-wrap gap-3">
                                <div>
                                    <label className="text-xs text-gray-500 font-semibold block mb-1">Year</label>
                                    <div className="flex gap-1.5">
                                        {[1,2,3,4].map(y => (
                                            <button key={y} onClick={() => { setSelectedYear(y); setSelectedSem(y*2-1); }}
                                                className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${selectedYear === y ? 'bg-indigo-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{y}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-semibold block mb-1">Semester</label>
                                    <div className="flex gap-1.5">
                                        {[selectedYear*2-1, selectedYear*2].map(s => (
                                            <button key={s} onClick={() => setSelectedSem(s)}
                                                className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${selectedSem === s ? 'bg-indigo-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-semibold block mb-1">Section</label>
                                    <div className="flex gap-1.5">
                                        {['A','B','C','D'].map(s => (
                                            <button key={s} onClick={() => setSelectedSec(s)}
                                                className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${selectedSec === s ? 'bg-emerald-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-semibold block mb-1">Days</label>
                                    <div className="flex gap-1.5">
                                        {DAYS.map(d => (
                                            <button key={d} onClick={() => setActiveDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                                                className={`px-2 h-9 rounded-lg text-xs font-bold transition-all ${activeDays.includes(d) ? 'bg-gray-800 text-white shadow' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                                {d.slice(0,3).toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {editMode ? (
                                    <>
                                        <button onClick={() => setEditMode(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200">Cancel</button>
                                        <button onClick={handlePublish} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
                                            <Save className="w-4 h-4" />{saving ? 'Publishing…' : 'Publish'}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200"><Download className="w-4 h-4" /> PDF</button>
                                        <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100"><Trash2 className="w-4 h-4" /> Delete</button>
                                        <button onClick={() => { setGrid(buildGrid(entries, timeSlots)); setEditMode(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"><Edit className="w-4 h-4" /> Edit</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Period timing toolbar (edit mode only) */}
                    {editMode && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Clock className="w-4 h-4 text-amber-600" />
                                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Edit Period Timings</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {timeSlots.map(slot => (
                                    <button key={slot.period} onClick={() => setPeriodEditModal(slot)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors">
                                        <Edit3 className="w-3 h-3" />P{slot.period} {slot.start}–{slot.end}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center h-48 text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading…</div>
                    ) : (
                        <TimetableGrid entries={entries} activeDays={activeDays} timeSlots={timeSlots} onCellClick={handleCellClick} editMode={editMode} grid={grid} />
                    )}
                </>
            )}

            {/* TEACHER-WISE TAB */}
            {activeTab === 'teacher' && (
                <div className="space-y-4">

                    <div className="bg-white rounded-2xl border border-gray-200 p-4">
                        <div className="flex flex-wrap gap-3 items-end">
                            <div className="flex-1 min-w-[200px]">
                                <label className="text-xs font-semibold text-gray-500 block mb-1">Search Teacher</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input value={teacherSearch} onChange={e => setTeacherSearch(e.target.value)}
                                        placeholder="Name or email…"
                                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 ml-auto font-medium">{filteredTeachers.length} teacher{filteredTeachers.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    {filteredTeachers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-200 text-gray-400">
                            <Users className="w-12 h-12 mb-3 opacity-30" />
                            <p className="font-semibold">No teachers found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {filteredTeachers.map(t => <TeacherCard key={t.user_id || t.id} teacher={t} onClick={() => setSelectedTeacherForView(t)} />)}
                        </div>
                    )}
                </div>
            )}

            {/* Cell Edit Modal — now uses CellEditModal with selects */}
            {cellModal && (
                <CellEditModal
    cellModal={cellModal}
    cellForm={cellForm}
    setCellForm={setCellForm}
    onSave={handleCellSave}
    onClose={() => setCellModal(null)}
    deptSubjects={deptSubjects}
    deptId={dept.id}
    dept={dept}
    allEntries={allDeptEntries}
    showToast={showToast}
/>
            )}

            {/* Period Edit Modal */}
            {periodEditModal && <PeriodEditModal slot={periodEditModal} onSave={handlePeriodEdit} onClose={() => setPeriodEditModal(null)} />}
        </div>
    );
}

// ─── Year+Section View (manual add/delete - Req #1) ───────────────────────────
function YearSectionView({ dept, summaries, teachers, departments, onBack, showToast }) {
    const [selectedYearSec, setSelectedYearSec] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [localCards, setLocalCards] = useState(null); // null = use summaries, array = manual additions

    const colorClasses = ['from-indigo-500 to-blue-600', 'from-violet-500 to-purple-600', 'from-rose-500 to-pink-600', 'from-emerald-500 to-teal-600'];
    const deptSummaries = summaries.filter(s => s.departmentId === dept.id);

    // Build base cards from summaries (published timetables), deduplicated by year+section
    const summaryCards = useMemo(() => {
        const seen = new Set();
        return deptSummaries
            .filter(s => s.year && s.section)
            .map(s => ({ year: s.year, section: s.section, semester: s.semester, entryCount: s.entryCount, fromSummary: true }))
            .filter(s => { const k = `${s.year}-${s.section}`; if (seen.has(k)) return false; seen.add(k); return true; })
            .sort((a, b) => a.year - b.year || a.section.localeCompare(b.section));
    }, [deptSummaries]);

    // Cards to display: if user has added manual cards, merge them with summary cards
    const cards = useMemo(() => {
        if (localCards === null) return summaryCards;
        // Merge: keep localCards, update entryCount from summaries where matching
        return localCards.map(c => {
            const match = summaryCards.find(s => s.year === c.year && s.section === c.section);
            return match ? { ...c, entryCount: match.entryCount } : c;
        });
    }, [localCards, summaryCards]);

    // Initialise localCards from summaries on first load
    useEffect(() => {
        if (localCards === null && summaryCards.length > 0) {
            setLocalCards(summaryCards);
        }
    }, [summaryCards]);

    const handleAdd = (combo) => {
        setLocalCards(prev => {
            const base = prev ?? summaryCards;
            return [...base, { ...combo, entryCount: 0, fromSummary: false }]
                .sort((a, b) => a.year - b.year || a.section.localeCompare(b.section));
        });
    };

    const handleDeleteCard = async (combo) => {
        if (!window.confirm(`Delete timetable card for Year ${combo.year} Section ${combo.section}? This will also delete any published timetable entries.`)) return;
        // If it has published entries, delete from server
        if (combo.entryCount > 0 || combo.fromSummary) {
            try {
                await api.delete(`/timetable/department/${dept.id}?year=${combo.year}&semester=${combo.semester}&section=${combo.section}&academicYear=2025-26`);
                showToast('success', `Deleted timetable for Year ${combo.year} Sec ${combo.section}`);
            } catch (err) {
                showToast('error', err.message || 'Failed to delete');
                return;
            }
        }
        setLocalCards(prev => {
            const base = prev ?? summaryCards;
            return base.filter(c => !(c.year === combo.year && c.section === combo.section));
        });
    };

    const byYear = useMemo(() => {
        const map = {};
        cards.forEach(c => { if (!map[c.year]) map[c.year] = []; map[c.year].push(c); });
        return map;
    }, [cards]);

    if (selectedYearSec) {
        return <DeptDetailView dept={dept} summaries={summaries} teachers={teachers} departments={departments}
            onBack={() => setSelectedYearSec(null)} showToast={showToast} selectedYearSec={selectedYearSec} />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-medium group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />All Departments
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center"><Building2 className="w-5 h-5 text-white" /></div>
                        <div>
                            <h2 className="font-bold text-gray-900 text-lg">{dept.name}</h2>
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{dept.shortId} — Select Year & Section</p>
                        </div>
                    </div>
                </div>
                {/* + New button */}
                <button onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-all">
                    <Plus className="w-4 h-4" /> New Timetable
                </button>
            </div>

            {/* Cards grouped by year */}
            {Object.keys(byYear).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400">
                    <Calendar className="w-12 h-12 mb-3 opacity-30" />
                    <p className="font-semibold text-gray-600">No timetables yet</p>
                    <p className="text-sm mt-1 mb-4">Click "+ New Timetable" to create your first one</p>
                    <button onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
                        <Plus className="w-4 h-4" /> New Timetable
                    </button>
                </div>
            ) : (
                Object.entries(byYear).map(([year, combos]) => (
                    <div key={year}>
                        <h3 className="font-bold text-gray-600 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-indigo-500" />{getOrdinalSuffix(parseInt(year))} Year
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {combos.map(combo => (
                                <YearSectionCard
                                    key={`${combo.year}-${combo.section}`}
                                    year={combo.year} section={combo.section}
                                    semester={combo.semester} entryCount={combo.entryCount}
                                    colorClass={colorClasses[(parseInt(year) - 1) % colorClasses.length]}
                                    onClick={() => setSelectedYearSec(combo)}
                                    onDelete={() => handleDeleteCard(combo)}
                                />
                            ))}
                        </div>
                    </div>
                ))
            )}

            {/* Add Modal */}
            {showAddModal && (
                <AddYearSectionModal
                    onAdd={handleAdd}
                    onClose={() => setShowAddModal(false)}
                    existing={cards}
                />
            )}
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminTimetable() {
    const [departments, setDepartments] = useState([]);
    const [summaries, setSummaries] = useState([]);
    const [allTeachers, setAllTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDept, setSelectedDept] = useState(null);
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState(null);
    const showToast = (type, text) => setToast({ type, text });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [depts, summs, principalData] = await Promise.all([
                api.get('/auth/departments'),
                api.get('/timetable/summary'),
                api.get('/principal/stats').catch(() => ({ teachers: [] })),
            ]);
            setDepartments(depts || []);
            setSummaries(summs || []);
            setAllTeachers(principalData?.teachers || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // Refresh when any timetable changes (admin sees all depts so reload on any change)
    useEffect(() => {
        socket.on('timetable_change', loadData);
        return () => socket.off('timetable_change', loadData);
    }, [loadData]);

    const filteredDepts = useMemo(() => {
        const q = search.toLowerCase();
        return departments.filter(d => d.name.toLowerCase().includes(q) || (d.shortId || '').toLowerCase().includes(q));
    }, [departments, search]);

    if (loading) return (
        <DashboardLayout title="Timetable Management" subtitle="Manage department timetables">
            <div className="flex items-center justify-center h-64 text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading departments…</div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout title="Timetable Management" subtitle="Create, edit and publish department timetables">
            <Toast msg={toast} onClose={() => setToast(null)} />
            {selectedDept ? (
                <YearSectionView dept={selectedDept} summaries={summaries} teachers={allTeachers} departments={departments}
                    onBack={() => setSelectedDept(null)} showToast={showToast} />
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Departments', value: departments.length, icon: Building2, color: 'bg-indigo-50 text-indigo-600' },
                            { label: 'Published Timetables', value: [...new Set(summaries.map(s => `${s.departmentId}-${s.year}-${s.semester}-${s.section}`))].length, icon: Calendar, color: 'bg-emerald-50 text-emerald-600' },
                            { label: 'Total Periods', value: summaries.reduce((a, s) => a + (s.entryCount || 0), 0), icon: Clock, color: 'bg-amber-50 text-amber-600' },
                        ].map(stat => (
                            <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center`}><stat.icon className="w-6 h-6" /></div>
                                <div><p className="text-2xl font-black text-gray-900">{stat.value}</p><p className="text-xs font-semibold text-gray-500">{stat.label}</p></div>
                            </div>
                        ))}
                    </div>
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search departments…"
                            className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm" />
                    </div>
                    <div>
                        <h2 className="font-bold mb-4 text-sm uppercase tracking-widest text-gray-500">{filteredDepts.length} Department{filteredDepts.length !== 1 ? 's' : ''}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredDepts.map((dept, i) => (
                                <DeptCard key={dept.id} dept={dept} summaries={summaries} colorClass={DEPT_COLORS[i % DEPT_COLORS.length]} onClick={() => setSelectedDept(dept)} />
                            ))}
                        </div>
                        {filteredDepts.length === 0 && (
                            <div className="text-center py-16 text-gray-400"><Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="font-semibold">No departments found</p></div>
                        )}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}