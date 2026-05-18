import React, { useEffect } from 'react';
import { useAdminData } from '../../hooks/useAdminData.js';
import { api } from '../../lib/api.js';
import socket from '../../lib/socket.js';
import { generateStudentPDF, generateClassPDF } from '../teacher/ReportTemplates.jsx';
import { generateAnnualReportPDF } from '../../utils/pdfGenerator.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { Download, FileText } from 'lucide-react';

export default function AdminReports() {
    const { reports, loading, refetch } = useAdminData();
    const [selectedReporter, setSelectedReporter] = React.useState(null);

    useEffect(() => {
        socket.on('report_change', refetch);
        socket.on('mark_change', refetch);
        socket.on('attendance_change', refetch);
        return () => {
            socket.off('report_change', refetch);
            socket.off('mark_change', refetch);
            socket.off('attendance_change', refetch);
        };
    }, [refetch]);

    const reporters = React.useMemo(() => {
        const groups = {};
        reports.forEach(r => {
            const uid = r.userId || r.reporter_user_id || 'unknown';
            if (!groups[uid]) {
                groups[uid] = {
                    id: uid,
                    name: r.teacherName,
                    role: r.reporterRole,
                    department: r.departmentName,
                    count: 0,
                    reports: []
                };
            }
            groups[uid].count++;
            groups[uid].reports.push(r);
        });
        return Object.values(groups).sort((a, b) => b.count - a.count);
    }, [reports]);

    const handleDownload = async (r) => {
        let parsed;
        try { parsed = JSON.parse(r.content); } catch { parsed = null; }

        if (parsed?.type === 'student') {
            try {
                const data = await api.get(`/reports/data/student-report/${r.id}`);
                const selectedSubjects = new Set(data.subjectIds || []);
                generateStudentPDF('royal', {
    student: data.student,
    marks: data.marks,
    monthly: data.monthly,
    daily: data.daily || [],
    progressTrend: data.progressTrend || data.progress || [],
    selectedSubjects,
    remarks: data.remarks || '',
}, { teacherName: data.teacherName || r.teacherName || '' });
            } catch (err) {
                console.error('Failed to download student report:', err);
                alert('Failed to download report: ' + err.message);
            }
        } else if (parsed?.type === 'class') {
            try {
                const data = await api.get(`/reports/data/class-report/${r.id}`);
                const { offering, remarks, teacherName } = data;

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

                generateClassPDF('royal',
                    { offering, students: studentSummary, examTypes, remarks },
                    { teacherName, department: offering.department?.name || offering.subject?.department?.name || '' }
                );
            } catch (err) {
                console.error('Failed to download class report:', err);
                alert('Failed to download report: ' + err.message);
            }
        } else {
            const cd = r.chart_data || {};
            generateAnnualReportPDF({ title: r.title, content: r.content, generatedBy: r.teacherName || r.reporter_user_id, date: new Date(r.createdAt || r.created_at).toLocaleDateString(), charts: { attendance: cd.attendance, grades: cd.grades }, summary: cd.summary });
        }
    };

    const activeReporter = selectedReporter ? reporters.find(rep => rep.id === selectedReporter) : null;

    return (
        <DashboardLayout 
            title={activeReporter ? activeReporter.name : "All Reports"} 
            subtitle={activeReporter ? `${activeReporter.reports.length} reports submitted` : `${reports.length} total reports`}
        >
            <div className="mb-6">
                {activeReporter && (
                    <button 
                        onClick={() => setSelectedReporter(null)}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm"
                    >
                        &larr; Back to all teachers
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                </div>
            ) : reports.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-card p-20 text-center text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No reports found.</p>
                </div>
            ) : !selectedReporter ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reporters.map(rep => (
                        <div 
                            key={rep.id} 
                            onClick={() => setSelectedReporter(rep.id)}
                            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    {rep.name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                                    {rep.count} {rep.count === 1 ? 'Report' : 'Reports'}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{rep.name}</h3>
                            <div className="flex flex-col gap-1">
                                <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">{rep.role}</p>
                                <p className="text-sm text-gray-500">{rep.department || 'General'}</p>
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-indigo-600 font-semibold text-sm">
                                <span>View all reports</span>
                                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-card overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                {['Title', 'Status', 'Date', 'Action'].map(h => (
                                    <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {activeReporter.reports.map(r => (
                                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <span className="font-semibold text-gray-900 max-w-xs truncate">{r.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                            r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                                            r.status.includes('principal') ? 'bg-purple-100 text-purple-700' : 
                                            r.status.includes('hod') ? 'bg-amber-100 text-amber-700' : 
                                            'bg-gray-100 text-gray-500'
                                        }`}>
                                            {r.status.replace(/_/g, ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 font-medium">
                                        {new Date(r.createdAt || r.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
})}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => handleDownload(r)} 
                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors shadow-sm"
                                            title="Download PDF"
                                        >
                                            <Download className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </DashboardLayout>
    );
}
