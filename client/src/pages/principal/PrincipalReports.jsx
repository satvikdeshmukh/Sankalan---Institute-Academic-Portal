import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useReports } from '../../hooks/useReports.js';
import { api } from '../../lib/api.js';
import socket from '../../lib/socket.js';
import { generateStudentPDF, generateClassPDF } from '../teacher/ReportTemplates.jsx';
import { generateAnnualReportPDF } from '../../utils/pdfGenerator.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { Download, CheckCircle, FileText, Loader2, Eye, X, Clock, BookOpen, XCircle, Trash2 } from 'lucide-react';
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* ── Status badge ── */
function statusBadge(status) {
    switch (status) {
        case 'submitted_to_principal':
            return { label: 'Pending Approval', cls: 'text-amber-600 border-amber-200 bg-amber-50' };
        case 'approved':
            return { label: 'Approved', cls: 'text-emerald-600 border-emerald-200 bg-emerald-50' };
        default:
            return { label: status?.replace(/_/g, ' ') || 'Unknown', cls: 'text-gray-400 border-gray-200 bg-gray-50' };
    }
}

/* ── Report Preview Modal ── */
function ReportPreviewModal({ report, onClose, onDownload, onApprove, approving }) {
    const [previewData, setPreviewData] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState(null);

    // Detect report type
    const parsed = React.useMemo(() => {
        try { return JSON.parse(report?.content); } catch { return null; }
    }, [report?.content]);
    const isStudentReport = parsed?.type === 'student';
    const isClassReport = parsed?.type === 'class';

    // Fetch student report preview data
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

    // Fetch class report preview data
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

    // Reset on report change
    useEffect(() => {
    setPreviewData(null);
    setPreviewError(null);
    setPreviewLoading(false);
}, [report]);

    if (!report) return null;
    const { label, cls } = statusBadge(report.status);
    const isPending = report.status === 'submitted_to_principal';

    // ── Student report aggregation ──
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

    // ── Class report aggregation ──
    const classPreviewStats = React.useMemo(() => {
        if (!previewData || !isClassReport) return null;
        const { offering, remarks } = previewData;
        if (!offering) return null;

        const studentMap = {};

for (const e of (offering.enrollments || [])) {

    studentMap[e.student.id] = {
        id: e.student.id,
        fullName: e.student.fullName,
        studentId: e.student.studentId,
        marks: {},
        totalMarks: 0,
        attMonths: [],
        avgAtt: 0
    };

}

/* Add marks */

for (const m of (offering.marks || [])) {

    if (studentMap[m.studentId]) {

        studentMap[m.studentId].marks[m.examType] = m.marks;
        studentMap[m.studentId].totalMarks += m.marks;

    }

}

/* Add attendance */

for (const a of (offering.monthly || [])) {

    if (studentMap[a.studentId]) {

        studentMap[a.studentId].attMonths.push(a.percentage);

    }

}

/* Calculate avg attendance */

Object.values(studentMap).forEach(s => {

    if (s.attMonths.length > 0) {

        s.avgAtt = Math.round(
            s.attMonths.reduce((a, b) => a + b, 0) / s.attMonths.length
        );

    } else {

        s.avgAtt = 0;

    }

});
const students = Object.values(studentMap);
        const studentSummary = Object.values(studentMap).map(s => ({
            ...s,
            avgAtt: s.attMonths.length ? Math.round(s.attMonths.reduce((a, b) => a + b, 0) / s.attMonths.length) : 0,
        }));

        const examTypes = [...new Set((offering.marks || []).map(m => m.examType))].sort();

        const examStats = examTypes.map(et => {
            const vals = studentSummary.filter(s => s.marks[et] !== undefined).map(s => s.marks[et]);
            return {
                name: et,
                Avg: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0,
                Max: vals.length ? Math.max(...vals) : 0,
                Min: vals.length ? Math.min(...vals) : 0,
            };
        });

        const attDist = [
            { name: '≥75%', value: studentSummary.filter(s => s.avgAtt >= 75).length, fill: '#10b981' },
            { name: '50–74%', value: studentSummary.filter(s => s.avgAtt >= 50 && s.avgAtt < 75).length, fill: '#f59e0b' },
            { name: '<50%', value: studentSummary.filter(s => s.avgAtt < 50).length, fill: '#ef4444' },
        ];

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
            avgAtt: studentSummary.length
                ? Math.round(studentSummary.reduce((s, st) => s + st.avgAtt, 0) / studentSummary.length)
                : 0,
        };
    }, [previewData, isClassReport]);

    const previewStats = studentPreviewStats;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto z-10 overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
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
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Status */}
                <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>
                        <Clock className="w-3 h-3" /> {label}
                    </span>
                </div>

                {/* Content */}
                <div className="px-6 py-4 overflow-y-auto flex-1">
                    {(isStudentReport || isClassReport) ? (
                        previewLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-7 h-7 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                                <span className="ml-3 text-sm text-gray-400">Loading preview…</span>
                            </div>
                        ) : previewError ? (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                                Failed to load preview: {previewError}
                            </div>
                        ) : isStudentReport && studentPreviewStats ? (
                            /* ── Student Report Preview ── */
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow">
                                        {studentPreviewStats.student?.fullName?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{studentPreviewStats.student?.fullName}</p>
                                        <p className="text-xs text-gray-500">
                                            {studentPreviewStats.student?.studentId || '—'} · {studentPreviewStats.student?.department?.name || '—'}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center">
                                        <p className="text-2xl font-black text-emerald-700">{studentPreviewStats.overallAtt}%</p>
                                        <p className="text-[10px] text-emerald-600 font-semibold uppercase">Avg Attendance</p>
                                    </div>
                                    <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100 text-center">
                                        <p className="text-2xl font-black text-indigo-700">{studentPreviewStats.totalMarks}</p>
                                        <p className="text-[10px] text-indigo-600 font-semibold uppercase">Total Marks</p>
                                    </div>
                                    <div className="bg-purple-50 rounded-xl p-3 border border-purple-100 text-center">
                                        <p className="text-2xl font-black text-purple-700">{Object.keys(studentPreviewStats.marksBySubject).length}</p>
                                        <p className="text-[10px] text-purple-600 font-semibold uppercase">Subjects</p>
                                    </div>
                                </div>
                                {studentPreviewStats.attSummary.length > 0 && (
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
                                                {studentPreviewStats.attSummary.map((s, i) => (
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
                                {Object.keys(studentPreviewStats.marksBySubject).length > 0 && (
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
                                                {Object.entries(studentPreviewStats.marksBySubject).map(([subj, exams]) =>
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

                {/* Footer actions */}
                <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap gap-2 justify-end flex-shrink-0">
                    <button
                        onClick={() => onDownload(report)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                    >
                        <Download className="w-4 h-4" /> Download PDF
                    </button>
                    {isPending && (
                        <button
                            onClick={() => onApprove(report.id)}
                            disabled={approving === report.id}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
                        >
                            {approving === report.id
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Approving…</>
                                : <><CheckCircle className="w-4 h-4" /> Approve</>
                            }
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Main Page ── */
export default function PrincipalReports() {
    const { user } = useAuth();
    const { reports, approveReport, rejectReport, deleteReport, loading, refetch } = useReports(user?.id, 'principal', null);
    const [approving, setApproving] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);

    // Real-time refresh
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

    const pending = reports.filter(r => r.status === 'submitted_to_principal');
    const approved = reports.filter(r => r.status === 'approved');
    const rejected = reports.filter(r => r.status === 'rejected');

    const handleDownload = async (r) => {

    let parsed;

    try {
        parsed = JSON.parse(r.content);
    } catch {
        parsed = null;
    }

    try {

        /* ───────── STUDENT REPORT ───────── */

        if (parsed?.type === 'student') {

            const data = await api.get(`/reports/data/student-report/${r.id}`);

            generateStudentPDF(
                'royal',   // default template
                {
                    student: data.student,
                    marks: data.marks || [],
                    monthly: data.monthly || [],
                    daily: data.daily || [],
                    progressTrend: [],
                    selectedSubjects: new Set(
                        (data.monthly || []).map(a => a.subjectOfferingId)
                    ),
                    remarks: data.remarks || ''
                },
                {
                    teacherName: data.teacherName || r.teacherName || ''
                }
            );

            return;
        }

        /* ───────── CLASS REPORT ───────── */

        if (parsed?.type === 'class') {

            const data = await api.get(`/reports/data/class-report/${r.id}`);

            const offering = data.offering || {};

            const studentMap = {};

            for (const e of (offering.enrollments || [])) {
                studentMap[e.student.id] = {
                    ...e.student,
                    marks: {},
                    totalMarks: 0,
                    attMonths: []
                };
            }

            for (const m of (offering.marks || [])) {
                if (studentMap[m.studentId]) {
                    studentMap[m.studentId].marks[m.examType] = m.marks;
                    studentMap[m.studentId].totalMarks += m.marks;
                }
            }

            for (const a of (offering.monthly || [])) {
                if (studentMap[a.studentId]) {
                    studentMap[a.studentId].attMonths.push(a.percentage);
                }
            }

            const students = Object.values(studentMap);

            const examTypes = [
                ...new Set((offering.marks || []).map(m => m.examType))
            ];

            generateClassPDF(
                'royal',
                {
                    offering,
                    students,
                    examTypes,
                    remarks: data.remarks || ''
                },
                {
                    teacherName: data.teacherName || r.teacherName || ''
                }
            );

            return;
        }

    } catch (err) {

        console.error('Report download failed:', err);
        alert('Failed to download report: ' + err.message);

    }
};

    const handleApprove = async (reportId) => {
        setApproving(reportId);
        try {
            await approveReport(reportId);
            if (selectedReport?.id === reportId) setSelectedReport(null);
        } catch (err) {
            alert('Failed to approve report: ' + err.message);
        } finally {
            setApproving(null);
        }
    };

    return (
        <DashboardLayout title="All Reports" subtitle="Final approval for submitted reports">
            <div className="space-y-6">

                {/* ── Pending ── */}
                <div className="bg-white rounded-2xl shadow-card p-6">
                    <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-yellow-500" />
                        Pending Approval ({pending.length})
                    </h2>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
                        </div>
                    ) : pending.length === 0 ? (
                        <p className="text-gray-400 text-center py-6 text-sm">No reports pending approval</p>
                    ) : (
                        <div className="space-y-3">
                            {pending.map(r => (
                                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                                    <div>
                                        <p className="font-medium text-sm text-gray-900">{r.title}</p>
                                        <p className="text-xs text-gray-400">
                                            {(r.reporterRole || r.reporter_role || 'teacher').toUpperCase()}
                                            {r.teacherName ? ` • ${r.teacherName}` : ''}
                                            {r.departmentName ? ` • ${r.departmentName}` : ''}
                                            {' • '}{new Date(r.createdAt || r.created_at).toLocaleDateString('en-IN')}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSelectedReport(r)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs hover:bg-white transition-colors"
                                            title="Preview"
                                        >
                                            <Eye className="w-3.5 h-3.5" /> Preview
                                        </button>
                                        <button
                                            onClick={() => handleDownload(r)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs hover:bg-white transition-colors"
                                        >
                                            <Download className="w-3.5 h-3.5" /> PDF
                                        </button>
                                        <button
                                            onClick={() => handleApprove(r.id)}
                                            disabled={approving === r.id}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 disabled:opacity-60 transition-colors"
                                        >
                                            {approving === r.id
                                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Approving…</>
                                                : <><CheckCircle className="w-3.5 h-3.5" /> Approve</>
                                            }
                                        </button>
                                        <button
    onClick={() => rejectReport(r.id)}
    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition-colors"
>
    Reject
</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Approved ── */}
                <div className="bg-white rounded-2xl shadow-card p-6">
                    <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Approved ({approved.length})
                    </h2>
                    {approved.length === 0 ? (
                        <p className="text-gray-400 text-center py-6 text-sm">No approved reports yet</p>
                    ) : (
                        <div className="space-y-3">
                            {approved.map(r => (
                                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                                    <div>
                                        <p className="font-medium text-sm text-gray-900">{r.title}</p>
                                        <p className="text-xs text-gray-400">
                                            {r.teacherName ? `${r.teacherName} • ` : ''}
                                            {r.departmentName ? `${r.departmentName} • ` : ''}
                                            {new Date(r.createdAt || r.created_at).toLocaleDateString('en-IN')}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setSelectedReport(r)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Preview">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDownload(r)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Download PDF">
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Rejected ── */}
<div className="bg-white rounded-2xl shadow-card p-6">
    <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <XCircle className="w-5 h-5 text-red-500" />
        Rejected ({rejected.length})
    </h2>

    {rejected.length === 0 ? (
        <p className="text-gray-400 text-center py-6 text-sm">
            No rejected reports
        </p>
    ) : (
        <div className="space-y-3">
            {rejected.map(r => (
                <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4 bg-red-50 rounded-xl border border-red-100"
                >
                    <div>
                        <p className="font-medium text-sm text-gray-900">
                            {r.title}
                        </p>

                        <p className="text-xs text-gray-400">
                            {r.teacherName ? `${r.teacherName} • ` : ''}
                            {r.departmentName ? `${r.departmentName} • ` : ''}
                            {new Date(r.createdAt || r.created_at).toLocaleDateString('en-IN')}
                        </p>
                    </div>

                    <div className="flex gap-2">

                        <button
                            onClick={() => setSelectedReport(r)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Preview"
                        >
                            <Eye className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => handleDownload(r)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Download PDF"
                        >
                            <Download className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => deleteReport(r.id)}
                            className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>

                    </div>
                </div>
            ))}
        </div>
    )}
</div>

            </div>

            {/* Preview Modal */}
            {selectedReport && (
                <ReportPreviewModal
                    report={selectedReport}
                    onClose={() => setSelectedReport(null)}
                    onDownload={handleDownload}
                    onApprove={handleApprove}
                    approving={approving}
                />  
            )}
        </DashboardLayout>
    );
}
