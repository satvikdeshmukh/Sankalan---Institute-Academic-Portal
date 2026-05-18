import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useReports } from '../../hooks/useReports.js';
import { useHODData } from '../../hooks/useHODData.js';
import { api } from '../../lib/api.js';
import socket from '../../lib/socket.js';
import { generateStudentPDF } from '../teacher/ReportTemplates.jsx';
import { generateAnnualReportPDF } from '../../utils/pdfGenerator.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line
} from 'recharts';
import {
    FileText, Download, Send, Trash2, Eye, X, Clock,
    CheckCircle2, AlertCircle, FolderOpen, Bell,
    Users, BookOpen, ArrowLeft,
} from 'lucide-react';

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* ── Status badge config ── */
function statusBadge(status) {
    switch (status) {
        case 'draft':
            return { label: 'Draft', cls: 'text-amber-500 border-amber-200 bg-amber-50' };
        case 'submitted_to_hod':
            return { label: 'New — Awaiting Review', cls: 'text-sky-600 border-sky-200 bg-sky-50' };
        case 'reviewed':
            return { label: 'Reviewed', cls: 'text-yellow-700 border-yellow-500 bg-yellow-50' };
        case 'submitted_to_principal':
            return { label: 'Sent to Principal', cls: 'text-violet-500 border-violet-200 bg-violet-50' };
        case 'approved':
            return { label: 'Approved', cls: 'text-emerald-600 border-emerald-200 bg-emerald-50' };
        default:
            return { label: status || 'Unknown', cls: 'text-gray-400 border-gray-200 bg-gray-50' };
    }
}

const TABS = [
    { key: 'all', label: 'All' },
    { key: 'unreviewed', label: 'Unreviewed' },
    { key: 'reviewed', label: 'Reviewed' },
    { key: 'forwarded', label: 'Forwarded' },
];

/* ── Forward Modal ── */
function ForwardModal({ report, teachers, onClose, onForward, forwarding }) {
    const [target, setTarget] = useState('principal');
    const [selectedTeacher, setSelectedTeacher] = useState('');

    if (!report) return null;

    const handleSend = () => {
        if (target === 'principal') {
            onForward(report.id, 'principal');
        } else if (target === 'teacher' && selectedTeacher) {
            onForward(report.id, 'teacher', selectedTeacher);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto z-10 overflow-hidden animate-fade-in">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <Send className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 text-base">Forward Report</h2>
                            <p className="text-xs text-gray-400 mt-0.5">{report.title}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">Forward To</label>
                        <div className="space-y-2">
                            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${target === 'principal' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                <input type="radio" name="target" checked={target === 'principal'} onChange={() => setTarget('principal')} className="accent-indigo-600" />
                                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                                    <Users className="w-4 h-4 text-violet-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-800">Principal</span>
                            </label>

                            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${target === 'teacher' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                <input type="radio" name="target" checked={target === 'teacher'} onChange={() => setTarget('teacher')} className="accent-indigo-600" />
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Users className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-800">Teacher</span>
                            </label>
                        </div>
                    </div>

                    {target === 'teacher' && (
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Select Teacher</label>
                            <select
                                value={selectedTeacher}
                                onChange={e => setSelectedTeacher(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                            >
                                <option value="">Choose a teacher…</option>
                                {teachers.map(t => (
                                    <option key={t.user_id} value={t.user_id}>{t.full_name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
                    <button
                        onClick={handleSend}
                        disabled={forwarding || (target === 'teacher' && !selectedTeacher)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-xl text-sm font-medium hover:bg-[#162d4a] disabled:opacity-50 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                        {forwarding ? 'Sending…' : 'Forward'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Report Detail Modal ── */
function ReportModal({ report, onClose, onForward, onDownload, onMarkReviewed, forwarding, onEditSubmit }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(report?.content || '');
    const [saving, setSaving] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState(null);

    // Detect report type
    const parsed = React.useMemo(() => {
        try { return JSON.parse(report?.content); } catch { return null; }
    }, [report?.content]);
    const isStudentReport = parsed?.type === 'student';
    const isClassReport = parsed?.type === 'class';

    // Fetch preview data for student reports
    useEffect(() => {
        if (!report?.id || !isStudentReport) return;
        setPreviewLoading(true);
        setPreviewError(null);
        setPreviewData(null);
        api.get(`/reports/data/student-report/${report.id}`)
            .then(data => setPreviewData(data))
            .catch(err => setPreviewError(err.message))
            .finally(() => setPreviewLoading(false));
    }, [report?.id, isStudentReport]);

    // Fetch preview data for class reports
    useEffect(() => {
        if (!report?.id || !isClassReport) return;
        setPreviewLoading(true);
        setPreviewError(null);
        setPreviewData(null);
        api.get(`/reports/data/class-report/${report.id}`)
            .then(data => setPreviewData(data))
            .catch(err => setPreviewError(err.message))
            .finally(() => setPreviewLoading(false));
    }, [report?.id, isClassReport]);

    useEffect(() => {
        setEditContent(report?.content || '');
        setIsEditing(false);
        setPreviewData(null);
        setPreviewError(null);
    }, [report]);

    if (!report) return null;
    const { label, cls } = statusBadge(report.status);
    const isSubmittedToHod = report.status === 'submitted_to_hod';

    const handleSaveEdit = async () => {
        setSaving(true);
        await onEditSubmit(report.id, { content: editContent });
        setSaving(false);
        setIsEditing(false);
    };

    // Build aggregated data for STUDENT report preview
    const studentPreviewStats = React.useMemo(() => {
        if (!previewData || !isStudentReport) return null;
        const { student, marks = [], monthly = [], daily = [] } = previewData;

        const attBySubject = {};
        monthly.forEach(a => {
            const name = a.subjectOffering?.subject?.name || '—';
            if (!attBySubject[name]) attBySubject[name] = { vals: [], name };
            attBySubject[name].vals.push(a.percentage);
        });
        const attSummary = Object.values(attBySubject).map(s => ({
            name: s.name,
            avg: s.vals.length ? Math.round(s.vals.reduce((a, b) => a + b, 0) / s.vals.length) : 0,
            count: s.vals.length,
        }));

        const marksBySubject = {};
        marks.forEach(m => {
            const name = m.subjectOffering?.subject?.name || '—';
            if (!marksBySubject[name]) marksBySubject[name] = [];
            marksBySubject[name].push({ examType: m.examType, marks: m.marks });
        });

        const allAtt = monthly.map(a => a.percentage);
        const overallAtt = allAtt.length ? Math.round(allAtt.reduce((a, b) => a + b, 0) / allAtt.length) : 0;
        const totalMarks = marks.reduce((s, m) => s + m.marks, 0);

        return { student, attSummary, marksBySubject, overallAtt, totalMarks, totalSessions: daily.length };
    }, [previewData, isStudentReport]);

    // Build aggregated data for CLASS report preview
    const classPreviewStats = React.useMemo(() => {
        if (!previewData || !isClassReport) return null;
        const { offering, remarks } = previewData;
        if (!offering) return null;

        const studentMap = {};
        for (const e of (offering.enrollments || [])) {
            studentMap[e.student.id] = { ...e.student, marks: {}, totalMarks: 0, attMonths: [] };
        }
        for (const m of (offering.marks || [])) {
            if (studentMap[m.studentId]) {
                studentMap[m.studentId].marks[m.examType] = m.marks;
                studentMap[m.studentId].totalMarks += m.marks;
            }
        }
        for (const a of (offering.monthly || [])) {
            if (studentMap[a.studentId]) studentMap[a.studentId].attMonths.push(a.percentage);
        }
        const studentSummary = Object.values(studentMap).map(s => ({
            ...s,
            avgAtt: s.attMonths.length ? Math.round(s.attMonths.reduce((a, b) => a + b, 0) / s.attMonths.length) : 0,
        }));

        const examTypes = [...new Set((offering.marks || []).map(m => m.examType))].sort();

        // Exam stats bar chart data
        const examStats = examTypes.map(et => {
            const vals = studentSummary.filter(s => s.marks[et] !== undefined).map(s => s.marks[et]);
            return {
                name: et,
                Avg: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0,
                Max: vals.length ? Math.max(...vals) : 0,
                Min: vals.length ? Math.min(...vals) : 0,
            };
        });

        // Attendance distribution pie
        const attDist = [
            { name: '≥75%', value: studentSummary.filter(s => s.avgAtt >= 75).length, fill: '#10b981' },
            { name: '50–74%', value: studentSummary.filter(s => s.avgAtt >= 50 && s.avgAtt < 75).length, fill: '#f59e0b' },
            { name: '<50%', value: studentSummary.filter(s => s.avgAtt < 50).length, fill: '#ef4444' },
        ];

        // Monthly trend
        const mmap = {};
        (offering.monthly || []).forEach(a => {
            const k = `${a.year}-${String(a.month).padStart(2, '0')}`;
            if (!mmap[k]) mmap[k] = { vals: [], month: a.month, year: a.year };
            mmap[k].vals.push(a.percentage);
        });
        const trend = Object.entries(mmap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, d]) => ({
                name: `${MONTH_LABELS[d.month - 1]} '${String(d.year).slice(-2)}`,
                'Class Avg %': Math.round(d.vals.reduce((s, v) => s + v, 0) / d.vals.length),
            }));

        return {
            offering, studentSummary, examTypes, examStats, attDist, trend, remarks,
            totalStudents: studentSummary.length,
            avgAtt: studentSummary.length ? Math.round(studentSummary.reduce((s, st) => s + st.avgAtt, 0) / studentSummary.length) : 0,
        };
    }, [previewData, isClassReport]);

    // Alias for backward-compat
    const previewStats = studentPreviewStats;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto z-10 overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
                <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 text-base leading-tight">{report.title}</h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(report.createdAt || report.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                {report.teacherName && <> · by <span className="text-gray-600 font-medium">{report.teacherName}</span></>}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors -mr-1">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>
                            <Clock className="w-3 h-3" />
                            {label}
                        </span>
                    </div>
                </div>

                {/* Content area — scrollable */}
                <div className="px-6 py-4 overflow-y-auto flex-1">
                    {isEditing ? (
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full h-40 p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none transition-shadow"
                            placeholder="Edit report content..."
                        />
                    ) : (isStudentReport || isClassReport) ? (
                        /* ── Loading / Error states ── */
                        previewLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-7 h-7 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                                <span className="ml-3 text-sm text-gray-400">Loading preview…</span>
                            </div>
                        ) : previewError ? (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                                Failed to load preview: {previewError}
                            </div>
                        ) : isStudentReport && previewStats ? (
                            /* ── Student Report Preview ── */
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow">
                                        {previewStats.student?.fullName?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{previewStats.student?.fullName}</p>
                                        <p className="text-xs text-gray-500">
                                            {previewStats.student?.studentId || '—'} · {previewStats.student?.department?.name || '—'}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center">
                                        <p className="text-2xl font-black text-emerald-700">{previewStats.overallAtt}%</p>
                                        <p className="text-[10px] text-emerald-600 font-semibold uppercase">Avg Attendance</p>
                                    </div>
                                    <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100 text-center">
                                        <p className="text-2xl font-black text-indigo-700">{previewStats.totalMarks}</p>
                                        <p className="text-[10px] text-indigo-600 font-semibold uppercase">Total Marks</p>
                                    </div>
                                    <div className="bg-purple-50 rounded-xl p-3 border border-purple-100 text-center">
                                        <p className="text-2xl font-black text-purple-700">{Object.keys(previewStats.marksBySubject).length}</p>
                                        <p className="text-[10px] text-purple-600 font-semibold uppercase">Subjects</p>
                                    </div>
                                </div>
                                {previewStats.attSummary.length > 0 && (
                                    <div className="border rounded-xl overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-2 border-b">
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">📊 Attendance Summary</p>
                                        </div>
                                        <table className="w-full text-xs">
                                            <thead><tr className="bg-gray-50/50 border-b">
                                                <th className="px-4 py-2 text-left font-semibold text-gray-500">Subject</th>
                                                <th className="px-4 py-2 text-center font-semibold text-gray-500">Avg %</th>
                                                <th className="px-4 py-2 text-center font-semibold text-gray-500">Records</th>
                                            </tr></thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {previewStats.attSummary.map((s, i) => (
                                                    <tr key={i} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2 text-gray-700 font-medium">{s.name}</td>
                                                        <td className="px-4 py-2 text-center">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.avg >= 75 ? 'bg-green-100 text-green-700' : s.avg >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                                {s.avg}%
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2 text-center text-gray-400">{s.count}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {Object.keys(previewStats.marksBySubject).length > 0 && (
                                    <div className="border rounded-xl overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-2 border-b">
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">📝 Examination Marks</p>
                                        </div>
                                        <table className="w-full text-xs">
                                            <thead><tr className="bg-gray-50/50 border-b">
                                                <th className="px-4 py-2 text-left font-semibold text-gray-500">Subject</th>
                                                <th className="px-4 py-2 text-left font-semibold text-gray-500">Exam</th>
                                                <th className="px-4 py-2 text-center font-semibold text-gray-500">Marks</th>
                                            </tr></thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {Object.entries(previewStats.marksBySubject).map(([subj, exams]) =>
                                                    exams.map((m, j) => (
                                                        <tr key={`${subj}-${j}`} className="hover:bg-gray-50">
                                                            <td className="px-4 py-2 text-gray-700 font-medium">{j === 0 ? subj : ''}</td>
                                                            <td className="px-4 py-2 text-gray-500">{m.examType}</td>
                                                            <td className="px-4 py-2 text-center font-bold text-indigo-700">{m.marks}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {previewData?.remarks && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1">✍️ Teacher Remarks</p>
                                        <p className="text-sm text-gray-700">{previewData.remarks}</p>
                                    </div>
                                )}
                            </div>
                        ) : isClassReport && classPreviewStats ? (
                            /* ── Class Report Preview ── */
                            <div className="space-y-4">
                                {/* Header */}
                                <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow">
                                        <BookOpen className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">📚 {classPreviewStats.offering?.subject?.name || 'Class Report'}</p>
                                        <p className="text-xs text-gray-500">
                                            {classPreviewStats.totalStudents} students · by {previewData?.teacherName || '—'}
                                        </p>
                                    </div>
                                </div>

                                {/* KPI Cards */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 text-center">
                                        <p className="text-2xl font-black text-blue-700">{classPreviewStats.totalStudents}</p>
                                        <p className="text-[10px] text-blue-600 font-semibold uppercase">Students</p>
                                    </div>
                                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center">
                                        <p className="text-2xl font-black text-emerald-700">{classPreviewStats.avgAtt}%</p>
                                        <p className="text-[10px] text-emerald-600 font-semibold uppercase">Class Avg Att.</p>
                                    </div>
                                    <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100 text-center">
                                        <p className="text-2xl font-black text-indigo-700">{classPreviewStats.examTypes.length}</p>
                                        <p className="text-[10px] text-indigo-600 font-semibold uppercase">Exam Types</p>
                                    </div>
                                </div>

                                {/* Charts row */}
                                {(classPreviewStats.examStats.length > 0 || classPreviewStats.attDist.some(d => d.value > 0)) && (
                                    <div className="grid grid-cols-2 gap-3">
                                        {classPreviewStats.examStats.length > 0 && (
                                            <div className="border rounded-xl p-3">
                                                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">📊 Marks Summary</p>
                                                <ResponsiveContainer width="100%" height={160}>
                                                    <BarChart data={classPreviewStats.examStats} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                                                        <YAxis tick={{ fontSize: 9 }} />
                                                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                                                        <Legend wrapperStyle={{ fontSize: 10 }} />
                                                        <Bar dataKey="Avg" fill="#6366f1" radius={[3, 3, 0, 0]} />
                                                        <Bar dataKey="Max" fill="#10b981" radius={[3, 3, 0, 0]} />
                                                        <Bar dataKey="Min" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                        {classPreviewStats.attDist.some(d => d.value > 0) && (
                                            <div className="border rounded-xl p-3">
                                                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">🥧 Attendance Distribution</p>
                                                <ResponsiveContainer width="100%" height={160}>
                                                    <PieChart>
                                                        <Pie data={classPreviewStats.attDist} cx="50%" cy="50%"
                                                            innerRadius={35} outerRadius={60} paddingAngle={3}
                                                            dataKey="value"
                                                            label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                                                            labelLine={false}>
                                                            {classPreviewStats.attDist.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                                        </Pie>
                                                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Monthly trend */}
                                {classPreviewStats.trend.length > 0 && (
                                    <div className="border rounded-xl p-3">
                                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">📈 Monthly Attendance Trend</p>
                                        <ResponsiveContainer width="100%" height={130}>
                                            <LineChart data={classPreviewStats.trend} margin={{ top: 0, right: 8, left: -24, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                                                <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                                                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                                                <Line type="monotone" dataKey="Class Avg %" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* Student table */}
                                {classPreviewStats.studentSummary.length > 0 && (
                                    <div className="border rounded-xl overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">👥 Student Summary</p>
                                            <span className="text-[10px] text-gray-400">{classPreviewStats.studentSummary.length} students</span>
                                        </div>
                                        <div className="overflow-x-auto max-h-48">
                                            <table className="w-full text-xs">
                                                <thead><tr className="bg-gray-50/50 border-b sticky top-0">
                                                    <th className="px-3 py-2 text-left font-semibold text-gray-500">#</th>
                                                    <th className="px-3 py-2 text-left font-semibold text-gray-500">Name</th>
                                                    {classPreviewStats.examTypes.map(et => (
                                                        <th key={et} className="px-3 py-2 text-center font-semibold text-indigo-600">{et}</th>
                                                    ))}
                                                    <th className="px-3 py-2 text-center font-semibold text-gray-500">Total</th>
                                                    <th className="px-3 py-2 text-center font-semibold text-gray-500">Att %</th>
                                                </tr></thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {classPreviewStats.studentSummary.map((s, i) => (
                                                        <tr key={s.id} className="hover:bg-gray-50">
                                                            <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                                                            <td className="px-3 py-2 font-medium text-gray-800">{s.fullName}</td>
                                                            {classPreviewStats.examTypes.map(et => (
                                                                <td key={et} className="px-3 py-2 text-center text-gray-600">{s.marks[et] ?? '—'}</td>
                                                            ))}
                                                            <td className="px-3 py-2 text-center font-bold text-gray-800">{s.totalMarks}</td>
                                                            <td className="px-3 py-2 text-center">
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.avgAtt >= 75 ? 'bg-green-100 text-green-700' : s.avgAtt >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {s.avgAtt}%
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Remarks */}
                                {classPreviewStats.remarks && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1">✍️ Class Remarks</p>
                                        <p className="text-sm text-gray-700">{classPreviewStats.remarks}</p>
                                    </div>
                                )}
                            </div>
                        ) : null
                    ) : report.content ? (
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{report.content}</p>
                    ) : (
                        <p className="text-sm text-gray-400 italic">No content provided.</p>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap gap-2 justify-end flex-shrink-0">
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => { setIsEditing(false); setEditContent(report.content || ''); }}
                                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={saving}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    ) : (
                        <>
                            {(isSubmittedToHod || report.status === 'reviewed') && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                                >
                                    Edit Content
                                </button>
                            )}
                            {isSubmittedToHod && (
                                <button
                                    onClick={() => onMarkReviewed(report.id)}
                                    className="flex items-center gap-2 px-4 py-2 border border-emerald-200 text-emerald-700 bg-emerald-50 rounded-xl text-sm hover:bg-emerald-100 transition-colors"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Mark Reviewed
                                </button>
                            )}
                            <button
                                onClick={() => onDownload(report)}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                            >
                                <Download className="w-4 h-4" /> Download PDF
                            </button>
                            <button
                                onClick={() => onForward(report)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-xl text-sm hover:bg-[#162d4a] transition-colors"
                            >
                                <Send className="w-4 h-4" /> Forward
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Report Card ── */
function ReportCard({ report, onView, onDelete, onForward, onDownload, forwarding, deleting, isNew }) {
    const { label, cls } = statusBadge(report.status);

    return (
        <div className={`bg-white rounded-2xl shadow-card p-5 flex flex-col gap-4 border transition-all hover:shadow-md ${isNew ? 'border-sky-200 ring-1 ring-sky-100' : 'border-gray-50'}`}>
            {/* Top: icon + status + notification dot */}
            <div className="flex items-start justify-between">
                <div className="relative">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-gray-400" />
                    </div>
                    {isNew && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                    )}
                </div>
                <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
                    <Clock className="w-3 h-3" /> {label}
                </span>
            </div>

            {/* Title + author + date */}
            <div>
                <p className="font-bold text-gray-900 text-sm truncate">{report.title}</p>
                {report.teacherName && (
                    <p className="text-xs text-amber-700 font-medium mt-0.5">by {report.teacherName}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(report.createdAt || report.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'numeric', year: 'numeric' })}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <button onClick={() => onView(report)} title="View"
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(report.id)} disabled={deleting === report.id} title="Delete"
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                    <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => onForward(report)} title="Forward"
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Send className="w-4 h-4" />
                </button>
                <button onClick={() => onDownload(report)} title="Download PDF"
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-xl text-xs hover:bg-gray-50 transition-colors">
                    <Download className="w-3.5 h-3.5" /> Download
                </button>
            </div>
        </div>
    );
}

/* ══ Main Page ════════════════════════════════════════════════════════════ */
export default function HODReports() {
    const { user, departmentId } = useAuth();
    const { reports, loading, refetch, submitReport, deleteReport, editReport } = useReports(user?.id, 'hod', departmentId);
    const { teachers } = useHODData(departmentId);

    // Real-time refresh when reports change
    useEffect(() => {
        const refresh = () => refetch?.();
        socket.on('report_change', refresh);
        socket.on('mark_change', refresh);
        socket.on('attendance_change', refresh);
        return () => {
            socket.off('report_change', refresh);
            socket.off('mark_change', refresh);
            socket.off('attendance_change', refresh);
        };
    }, [refetch]);

    const [selectedReport, setSelectedReport] = useState(null);
    const [forwardReport, setForwardReport] = useState(null);
    const [forwarding, setForwarding] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedTeacherId, setSelectedTeacherId] = useState(null);

    const visible = reports;
      /* Filter by tab */
    const filtered = visible.filter(r => {
        if (activeTab === 'unreviewed') return r.status === 'submitted_to_hod';
        if (activeTab === 'reviewed') return r.status === 'reviewed' || r.status === 'approved';
        if (activeTab === 'forwarded') return r.status === 'submitted_to_principal';
        return true; // 'all'
    });

    const visibleReports = filtered.filter(r => r.status !== 'draft');

    /* Group ALL non-draft reports by teacher (unfiltered by tab) so that
       selectedTeacher stays valid when switching tabs inside the detail view. */
    const allNonDraft = visible.filter(r => r.status !== 'draft');
    const groupedReports = allNonDraft.reduce((acc, report) => {

        const teacherId = report.userId;
        const teacherName = report.teacherName || 'Unknown Teacher';
        const teacherRole = report.reporterRole || 'teacher';
        const teacherDepartment = report.departmentName || '';

        const isNew =
            report.status === 'submitted_to_hod' &&
            (report.reporterRole === 'teacher' || report.reporter_role === 'teacher');

        if (!acc[teacherId]) {
            acc[teacherId] = {
                id: teacherId,
                name: teacherName,
                role: teacherRole,
                department: teacherDepartment,
                items: [],
                hasNew: false
            };
        }

        acc[teacherId].items.push(report);

        if (isNew) {
            acc[teacherId].hasNew = true;
        }

        return acc;

    }, {});

    const teacherList = Object.values(groupedReports);

    const selectedTeacher = selectedTeacherId
        ? groupedReports[selectedTeacherId]
        : null;
    const teacherFilteredReports = selectedTeacher
    ? selectedTeacher.items.filter(r => {
        if (activeTab === 'unreviewed') return r.status === 'submitted_to_hod';
        if (activeTab === 'reviewed') return r.status === 'reviewed' || r.status === 'approved';
        if (activeTab === 'forwarded') return r.status === 'submitted_to_principal';
        return true;
    })
    : [];

    /* New reports count — submitted_to_hod from teachers */
    const newCount = visible.filter(r => r.status === 'submitted_to_hod' && (r.reporterRole === 'teacher' || r.reporter_role === 'teacher')).length;

  

    const handleForwardFromModal = async (id, target) => {
        setForwarding(id);
        if (target === 'principal') {
            await submitReport(id, 'principal');
        } else {
            // Forward to teacher = just mark reviewed since teachers can see their own reports
            await submitReport(id, 'reviewed');
        }
        setForwarding(null);
        setForwardReport(null);
        if (selectedReport?.id === id) setSelectedReport(null);
    };

    const handleMarkReviewed = async (id) => {
        await submitReport(id, 'reviewed');
        if (selectedReport?.id === id) setSelectedReport(null);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this report?')) return;
        setDeleting(id);
        await deleteReport(id);
        setDeleting(null);
        if (selectedReport?.id === id) setSelectedReport(null);
    };

    const handleDownload = async (r) => {
        // Check if this is a student report by parsing the stored content
        let parsed;
        try { parsed = JSON.parse(r.content); } catch { parsed = null; }

        if (parsed?.type === 'student') {
            // Fetch the same data teacher used and generate identical PDF
            try {
                const data = await api.get(`/reports/data/student-report/${r.id}`);
                const selectedSubjects = new Set(data.subjectIds || []);
                generateStudentPDF('royal', {
                    student: data.student,
                    marks: data.marks,
                    monthly: data.monthly,
                    daily: data.daily || [],
                    progressTrend: [],
                    selectedSubjects,
                    remarks: data.remarks || '',
                }, { teacherName: data.teacherName || r.teacherName || '' });
            } catch (err) {
                console.error('Failed to download student report:', err);
                alert('Failed to download report: ' + err.message);
            }
        } else {
            // Fallback for class/other reports
            const cd = r.chart_data || r.chartData || {};
            generateAnnualReportPDF({
                title: r.title,
                content: r.content,
                generatedBy: r.teacherName || r.reporter_user_id || r.teacherUserId,
                date: new Date(r.createdAt || r.created_at).toLocaleDateString(),
                charts: { attendance: cd.attendance, grades: cd.grades },
                summary: cd.summary,
            });
        }
    };

    return (
        <DashboardLayout title="Department Reports" subtitle="View, review, and manage reports from teachers">

           

            {/* ── New-report notification banner ── */}
            {!loading && newCount > 0 && (
                <div className="mb-5 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-800">
                            {newCount} new report{newCount > 1 ? 's' : ''} submitted by teacher{newCount > 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-amber-600 mt-0.5">Review and forward to the Principal when ready.</p>
                    </div>
                </div>
            )}

            {loading ? (
    <div className="flex justify-center py-24">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
    </div>
) : selectedTeacher ? (

    /* ── Teacher Detail View ── */
    <div className="space-y-6">

        {/* ✅ Tabs ALWAYS visible */}
        <div className="flex items-center justify-between mb-5">
            <button
                onClick={() => setSelectedTeacherId(null)}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-amber-700 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 w-fit"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Teachers
            </button>

            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                            activeTab === tab.key
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Teacher Header */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-gray-100">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-4">

                <div className="w-12 h-12 rounded-full bg-amber-700/10 flex items-center justify-center text-amber-700">
                    <Users className="w-6 h-6" />
                </div>

                <div>
                    <h3 className="text-lg font-bold text-gray-900">{selectedTeacher.name}</h3>

                    {selectedTeacher.department && (
                        <span className="text-xs text-gray-500 block">
                            {selectedTeacher.department}
                        </span>
                    )}

                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                        {selectedTeacher.role.replace(/_/g, ' ')} • {selectedTeacher.items.length} Reports
                    </span>
                </div>

            </div>
        </div>

        {/* ✅ EMPTY STATE FIX */}
        {teacherFilteredReports.length === 0 ? (

    <div className="flex flex-col items-center py-20 text-gray-400">
        <FolderOpen className="w-14 h-14 mb-3 opacity-20" />
        <p className="text-sm font-medium">
            No {activeTab !== 'all' ? activeTab : ''} reports for this teacher
        </p>
    </div>

) : (

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {teacherFilteredReports.map(r => (
                    <ReportCard
                        key={r.id}
                        report={r}
                        isNew={r.status === 'submitted_to_hod' &&
                            (r.reporterRole === 'teacher' || r.reporter_role === 'teacher')}
                        onView={setSelectedReport}
                        onDelete={handleDelete}
                        onForward={setForwardReport}
                        onDownload={handleDownload}
                        forwarding={forwarding}
                        deleting={deleting}
                    />
                ))}
            </div>
        )}

    </div>

) : (

    /* ── Teacher Grid ── */
    <>
    {teacherList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                <FolderOpen className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-base font-semibold text-gray-500">No reports found</p>
                <p className="text-sm text-gray-400 mt-1">
                    Reports submitted by teachers will appear here.
                </p>
            </div>
    
    ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {teacherList.map(teacher => (

            <div
                key={teacher.id}
                onClick={() => setSelectedTeacherId(teacher.id)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-100 hover:-translate-y-1 transition-all"
            >

                <div className="px-5 py-5 flex items-center justify-between">

                    <div className="flex items-center gap-4">

                        <div className="relative">

                            <div className="w-12 h-12 rounded-full bg-amber-700/10 flex items-center justify-center text-amber-700">
                                <Users className="w-6 h-6" />
                            </div>

                            {teacher.hasNew && (
                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                            )}

                        </div>

                        <div>

                            <h3 className="text-base font-bold text-gray-900">
                                {teacher.name}
                            </h3>

                            {teacher.department && (
                                <span className="text-[11px] text-gray-500 block">
                                    {teacher.department}
                                </span>
                            )}

                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                                {teacher.role.replace(/_/g, ' ')}
                            </span>

                        </div>

                    </div>

                    <div className="text-xs font-medium text-amber-700 bg-amber-700/10 px-2.5 py-1 rounded-md border border-amber-100">
                        {teacher.items.length} Reports
                    </div>

                </div>

            </div>

        ))}

    </div>
    )
    }
    </>

)}

            {/* Report Detail Modal */}
            {selectedReport && (
                <ReportModal
                    report={selectedReport}
                    onClose={() => setSelectedReport(null)}
                    onForward={setForwardReport}
                    onDownload={handleDownload}
                    onMarkReviewed={handleMarkReviewed}
                    onEditSubmit={editReport}
                    forwarding={forwarding === selectedReport.id}
                />
            )}

            {/* Forward Modal */}
            {forwardReport && (
                <ForwardModal
                    report={forwardReport}
                    teachers={teachers}
                    onClose={() => setForwardReport(null)}
                    onForward={handleForwardFromModal}
                    forwarding={!!forwarding}
                />
            )}
        </DashboardLayout>
    );
}
