import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { apiFetch } from '../../lib/api.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import socket from '../../lib/socket.js';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
    Activity, AlertTriangle, CheckCircle, XCircle,
    Bell, RefreshCw, Search, TrendingUp, TrendingDown,
    Minus, Users, ChevronDown, ChevronUp, Download, X
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, LineChart,
    Line, Legend, AreaChart, Area, ReferenceLine
} from 'recharts';

// ── Risk config ────────────────────────────────────────────────────────────
const RISK = {
    SAFE: { label: 'Safe', color: '#22c55e', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle },
    WARNING: { label: 'Warning', color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: AlertTriangle },
    HIGH_RISK: { label: 'High Risk', color: '#ef4444', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle },
    UNKNOWN: { label: 'Unknown', color: '#94a3b8', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', icon: Activity },
};
const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];
const YEAR_LABELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const YEAR_SEM = { 1: [1,2], 2: [3,4], 3: [5,6], 4: [7,8] };

// ── Small components ───────────────────────────────────────────────────────
function RiskBadge({ level }) {
    const cfg = RISK[level] || RISK.UNKNOWN;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold
            ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
            <Icon className="w-3 h-3" />{cfg.label}
        </span>
    );
}

function TrendIcon({ trend }) {
    if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
}

function StatCard({ label, value, icon: Icon, colorClass, subLabel }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-2xl font-bold text-gray-800">{value ?? '—'}</p>
                    <p className="text-sm font-medium text-gray-600 mt-0.5">{label}</p>
                    {subLabel && <p className="text-xs text-gray-400 mt-0.5">{subLabel}</p>}
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
}

function AttendanceBar({ pct }) {
    const clamped = Math.max(0, Math.min(100, pct || 0));
    const barColor = clamped >= 75 ? 'bg-green-500' : clamped >= 65 ? 'bg-amber-400' : 'bg-red-500';
    return (
        <div className="flex items-center gap-2 min-w-[120px]">
            <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${clamped}%` }} />
            </div>
            <span className="text-sm font-semibold text-gray-700 w-10 text-right">{clamped.toFixed(1)}%</span>
        </div>
    );
}

// ── Monthly trend mini-chart for row expansion ─────────────────────────────
function MonthlyTrendChart({ monthly }) {
    if (!monthly?.length) return <p className="text-xs text-gray-400 py-2">No monthly data available.</p>;
    const data = monthly.map(m => ({
        name: MONTHS[m.month] || `M${m.month}`,
        pct: m.percentage
    }));
    return (
        <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip
                        formatter={v => [`${v.toFixed(1)}%`, 'Attendance']}
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    />
                    <Line type="monotone" dataKey="pct" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

// ── Notify Modal ───────────────────────────────────────────────────────────
function NotifyModal({ students, onClose, onNotify }) {
    const [selected, setSelected] = useState(new Set());
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);
    const [modalSearch, setModalSearch] = useState('');

    const highRiskStudents = useMemo(() => {
        return students.filter(r => r.risk_level === 'HIGH_RISK');
    }, [students]);

    const filteredStudents = useMemo(() => {
        if (!modalSearch) return highRiskStudents;
        const q = modalSearch.toLowerCase();
        return highRiskStudents.filter(r =>
            r.name?.toLowerCase().includes(q) ||
            r.student_id?.toLowerCase().includes(q) ||
            r.department?.toLowerCase().includes(q)
        );
    }, [highRiskStudents, modalSearch]);

    const allVisibleSelected = filteredStudents.length > 0 && filteredStudents.every(r => selected.has(r.student_id));

    const toggleOne = (sid) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(sid)) next.delete(sid);
            else next.add(sid);
            return next;
        });
    };

    const toggleAll = () => {
        if (allVisibleSelected) {
            setSelected(prev => {
                const next = new Set(prev);
                filteredStudents.forEach(r => next.delete(r.student_id));
                return next;
            });
        } else {
            setSelected(prev => {
                const next = new Set(prev);
                filteredStudents.forEach(r => next.add(r.student_id));
                return next;
            });
        }
    };

    const selectAllStudents = () => {
        setSelected(new Set(highRiskStudents.map(r => r.student_id)));
    };

    const handleSendNotifications = async (studentIds) => {
        setSending(true);
        setResult(null);
        try {
            const studentsToNotify = highRiskStudents.filter(r => studentIds.has(r.student_id));
            const res = await onNotify(studentsToNotify);
            setResult({ success: true, message: `✅ Sent ${res.sent} notifications (${res.failed || 0} failed)` });
        } catch (e) {
            setResult({ success: false, message: `❌ Notification failed: ${e.message}` });
        } finally {
            setSending(false);
        }
    };

    const handleNotifySelected = () => {
        if (selected.size === 0) return;
        handleSendNotifications(selected);
    };

    const handleNotifyAll = () => {
        const allIds = new Set(highRiskStudents.map(r => r.student_id));
        selectAllStudents();
        handleSendNotifications(allIds);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-[95vw] max-w-5xl max-h-[85vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                            <Bell className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Notify At-Risk Students</h2>
                            <p className="text-xs text-gray-500">
                                {highRiskStudents.length} high-risk student{highRiskStudents.length !== 1 ? 's' : ''} found
                                {selected.size > 0 && <span className="ml-1 text-red-600 font-semibold">· {selected.size} selected</span>}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Result toast */}
                {result && (
                    <div className={`mx-6 mt-3 p-3 rounded-lg text-sm font-medium border ${
                        result.success
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                        {result.message}
                    </div>
                )}

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-gray-100">
                    <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            value={modalSearch}
                            onChange={e => setModalSearch(e.target.value)}
                            placeholder="Search high-risk students..."
                            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                        />
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <button
                            onClick={handleNotifySelected}
                            disabled={sending || selected.size === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1a2b4b] hover:bg-[#1e3460]
                                text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Bell className="w-4 h-4" />
                            {sending ? 'Sending…' : `Notify Selected (${selected.size})`}
                        </button>
                        <button
                            onClick={handleNotifyAll}
                            disabled={sending || highRiskStudents.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700
                                text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Bell className="w-4 h-4" />
                            {sending ? 'Sending…' : `Notify All (${highRiskStudents.length})`}
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto px-6 py-2">
                    {highRiskStudents.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 text-sm">
                            No high-risk students found.
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                                <tr>
                                    <th className="px-3 py-3 text-left w-10">
                                        <input
                                            type="checkbox"
                                            checked={allVisibleSelected}
                                            onChange={toggleAll}
                                            className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Student ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Dept</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Year</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Sem</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Attendance</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Trend</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Risk Level</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Confidence</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredStudents.map(r => (
                                    <tr
                                        key={r.student_id}
                                        className={`transition-colors cursor-pointer ${
                                            selected.has(r.student_id)
                                                ? 'bg-red-50/60 hover:bg-red-50'
                                                : 'hover:bg-gray-50'
                                        }`}
                                        onClick={() => toggleOne(r.student_id)}
                                    >
                                        <td className="px-3 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(r.student_id)}
                                                onChange={() => toggleOne(r.student_id)}
                                                onClick={e => e.stopPropagation()}
                                                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.student_id}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800">{r.name || '—'}</td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{r.deptShort || r.department || '—'}</td>
                                        <td className="px-4 py-3 text-gray-600 text-xs font-medium">{r.year ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-600 text-xs font-medium">{r.semester ?? '—'}</td>
                                        <td className="px-4 py-3"><AttendanceBar pct={r.attendance} /></td>
                                        <td className="px-4 py-3"><TrendIcon trend={r.trend} /></td>
                                        <td className="px-4 py-3"><RiskBadge level={r.risk_level} /></td>
                                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                                            {r.risk_probability != null
                                                ? `${(r.risk_probability * 100).toFixed(1)}%`
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-400 flex items-center justify-between">
                    <span>Showing {filteredStudents.length} of {highRiskStudents.length} high-risk students</span>
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function AttendanceRiskDashboard({ role: roleProp }) {
    const { user } = useAuth();
    const role = roleProp || user?.role || 'teacher';
    const isAdminOrPrincipal = role === 'admin' || role === 'principal';

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notifying, setNotifying] = useState(false);
    const [notifMsg, setNotifMsg] = useState(null);
    const [showNotifyModal, setShowNotifyModal] = useState(false);
    const [search, setSearch] = useState('');
    const [year, setYear] = useState('ALL');
    const [semester, setSemester] = useState('ALL');
    const [department, setDepartment] = useState('ALL');
    const [section, setSection] = useState('ALL');
const [filter, setFilter] = useState('ALL');
const [expanded, setExpanded] = useState(null);
const [sortBy, setSortBy] = useState('attendance');
const [sortDir, setSortDir] = useState('asc');
const [downloading, setDownloading] = useState(false);
const chartsRef = useRef(null);

    // ── Attendance Trend state ──────────────────────────────────────────────
    const [trendData, setTrendData] = useState(null);
    const [trendPeriod, setTrendPeriod] = useState('month');
    const [trendStudent, setTrendStudent] = useState('');
    const [trendLoading, setTrendLoading] = useState(false);

    // ── Fetch dashboard data ───────────────────────────────────────────────
    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiFetch('/attendance-risk/dashboard');
            setData(res);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

    // ── Fetch attendance trend ──────────────────────────────────────────────
    const fetchTrend = useCallback(async () => {
        setTrendLoading(true);
        try {
            const params = new URLSearchParams({ period: trendPeriod });
            if (isAdminOrPrincipal && department !== 'ALL') params.append('department', department);
            if (year !== 'ALL') params.append('year', year);
            if (section !== 'ALL') params.append('section', section);
            if (trendStudent) params.append('studentId', trendStudent);
            const res = await apiFetch(`/attendance-risk/attendance-trend?${params.toString()}`);
            setTrendData(res);
        } catch (e) {
            console.error('Trend fetch failed:', e);
        } finally {
            setTrendLoading(false);
        }
    }, [trendPeriod, department, year, section, trendStudent, isAdminOrPrincipal]);

    useEffect(() => { if (data) fetchTrend(); }, [fetchTrend, data]);

    // ── Real-time updates ──
    useEffect(() => {
        const refresh = () => fetchDashboard();
        socket.on('attendance_change', refresh);
        socket.on('mark_change', refresh);
        socket.on('risk_update', refresh);
        return () => {
            socket.off('attendance_change', refresh);
            socket.off('mark_change', refresh);
            socket.off('risk_update', refresh);
        };
    }, [fetchDashboard]);

    // ── Notify ─────────────────────────────────────────────────────────────
    const handleOpenNotifyModal = () => {
        if (!data?.results?.length) return;
        setShowNotifyModal(true);
    };

    const handleNotifyStudents = async (studentsToNotify) => {
        const res = await apiFetch('/attendance-risk/notify', {
            method: 'POST',
            body: { results: studentsToNotify }
        });
        return res;
    };

    // ── Download Report ─────────────────────────────────────────────────────
    const handleDownloadReport = async () => {
        if (!data?.results?.length) return;
        setDownloading(true);
        try {
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const margin = 12;
            const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

            // ── Page 1: Title + Charts screenshot ──
            pdf.setFillColor(26, 43, 75);
            pdf.rect(0, 0, pageW, 22, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(16);
            pdf.setFont(undefined, 'bold');
            pdf.text('Attendance Risk Report', margin, 14);
            pdf.setFontSize(9);
            pdf.setFont(undefined, 'normal');
            pdf.text(`Generated: ${today}  |  Total Students: ${data.summary?.total || 0}  |  Safe: ${data.summary?.safe || 0}  |  Warning: ${data.summary?.warning || 0}  |  High Risk: ${data.summary?.highRisk || 0}`, margin, 19);

            // Capture charts area
            if (chartsRef.current) {
                const canvas = await html2canvas(chartsRef.current, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#f8fafc',
                    logging: false,
                });
                const imgData = canvas.toDataURL('image/png');
                const imgW = pageW - margin * 2;
                const imgH = (canvas.height / canvas.width) * imgW;
                const maxImgH = pageH - 30;
                const finalH = Math.min(imgH, maxImgH);
                pdf.addImage(imgData, 'PNG', margin, 25, imgW, finalH);
            }

            // ── Page 2+: Student list table ──
            pdf.addPage();
            pdf.setFillColor(26, 43, 75);
            pdf.rect(0, 0, pageW, 16, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(12);
            pdf.setFont(undefined, 'bold');
            pdf.text('Student List', margin, 11);

            // Table header
            const cols = [
                { label: '#', w: 10 },
                { label: 'Student ID', w: 40 },
                { label: 'Name', w: 55 },
                { label: 'Department', w: 50 },
                { label: 'Attendance %', w: 30 },
                { label: 'Trend', w: 25 },
                { label: 'Risk Level', w: 30 },
                { label: 'Confidence', w: 28 },
            ];
            const tableX = margin;
            let y = 22;
            const rowH = 7;

            const drawHeader = () => {
                pdf.setFillColor(241, 245, 249);
                pdf.rect(tableX, y, cols.reduce((s, c) => s + c.w, 0), rowH, 'F');
                pdf.setTextColor(100, 116, 139);
                pdf.setFontSize(7);
                pdf.setFont(undefined, 'bold');
                let cx = tableX;
                cols.forEach(c => {
                    pdf.text(c.label.toUpperCase(), cx + 2, y + 5);
                    cx += c.w;
                });
                y += rowH;
            };

            drawHeader();

            const students = filtered.length ? filtered : data.results;
            students.forEach((r, idx) => {
                if (y + rowH > pageH - 10) {
                    pdf.addPage();
                    y = 12;
                    drawHeader();
                }

                // Alternating row background
                if (idx % 2 === 0) {
                    pdf.setFillColor(248, 250, 252);
                    pdf.rect(tableX, y, cols.reduce((s, c) => s + c.w, 0), rowH, 'F');
                }

                pdf.setTextColor(55, 65, 81);
                pdf.setFontSize(7);
                pdf.setFont(undefined, 'normal');
                let cx = tableX;
                const riskLabel = r.risk_level === 'HIGH_RISK' ? 'High Risk' : r.risk_level === 'WARNING' ? 'Warning' : r.risk_level === 'SAFE' ? 'Safe' : r.risk_level;
                const values = [
                    String(idx + 1),
                    r.student_id || '—',
                    r.name || '—',
                    r.department || r.deptShort || '—',
                    r.attendance != null ? `${r.attendance.toFixed(1)}%` : '—',
                    r.trend || '—',
                    riskLabel,
                    r.risk_probability != null ? `${(r.risk_probability * 100).toFixed(1)}%` : '—',
                ];
                values.forEach((v, vi) => {
                    // Color-code the risk level cell
                    if (vi === 6) {
                        if (r.risk_level === 'HIGH_RISK') pdf.setTextColor(239, 68, 68);
                        else if (r.risk_level === 'WARNING') pdf.setTextColor(245, 158, 11);
                        else if (r.risk_level === 'SAFE') pdf.setTextColor(34, 197, 94);
                        pdf.setFont(undefined, 'bold');
                    }
                    pdf.text(String(v).substring(0, 25), cx + 2, y + 5);
                    if (vi === 6) {
                        pdf.setTextColor(55, 65, 81);
                        pdf.setFont(undefined, 'normal');
                    }
                    cx += cols[vi].w;
                });
                y += rowH;
            });

            // Footer
            const totalPages = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                pdf.setFontSize(7);
                pdf.setTextColor(160, 174, 192);
                pdf.text(`Page ${i} of ${totalPages}  |  Sankalan ERP  |  Generated ${today}`, margin, pageH - 5);
            }

            pdf.save(`attendance_risk_report_${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (e) {
            console.error('Report download failed:', e);
            setNotifMsg(`❌ Report download failed: ${e.message}`);
            setTimeout(() => setNotifMsg(null), 6000);
        } finally {
            setDownloading(false);
        }
    };

    // ── Filter + sort ──────────────────────────────────────────────────────
    const filtered = useMemo(() => {
    if (!data?.results) return [];

    let rows = data.results.filter(r => {

        const q = search.toLowerCase();

        const matchSearch =
            !q ||
            r.name?.toLowerCase().includes(q) ||
            r.student_id?.toLowerCase().includes(q) ||
            r.department?.toLowerCase().includes(q);

        const matchRisk =
            filter === 'ALL' || r.risk_level === filter;

        const matchDept =
            department === 'ALL' || r.department === department;

        // Year filter
        const matchYear =
            year === 'ALL' || Number(r.year) === Number(year);

        // Semester filter
        const matchSem =
            semester === 'ALL' || Number(r.semester) === Number(semester);

        // Section filter
        const matchSection =
            section === 'ALL' || r.section === section;

        return matchSearch && matchRisk && matchDept && matchYear && matchSem && matchSection;
    });

    rows = [...rows].sort((a, b) => {

        let valA, valB;

        if (sortBy === 'attendance') {
            valA = a.attendance;
            valB = b.attendance;
        }
        else if (sortBy === 'name') {
            valA = a.name || '';
            valB = b.name || '';
        }
        else {
            const order = { HIGH_RISK: 0, WARNING: 1, SAFE: 2 };
            valA = order[a.risk_level] ?? 3;
            valB = order[b.risk_level] ?? 3;
        }

        if (typeof valA === 'string') {
            return sortDir === 'asc'
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
        }

        return sortDir === 'asc'
            ? valA - valB
            : valB - valA;
    });

    return rows;

}, [data, search, filter, department, year, semester, section, sortBy, sortDir]);

    // ── Pie chart data ─────────────────────────────────────────────────────
    const pieData = data?.summary ? [
        { name: 'Safe', value: data.summary.safe },
        { name: 'Warning', value: data.summary.warning },
        { name: 'High Risk', value: data.summary.highRisk },
    ].filter(d => d.value > 0) : [];

    const departments = useMemo(() => {
    if (!data?.results) return [];
    const set = new Set();

    data.results.forEach(r => {
        if (r.department) set.add(r.department);
    });

    return ['ALL', ...Array.from(set)];
}, [data]);

    const sections = useMemo(() => {
        if (!data?.results) return [];
        const set = new Set();
        data.results.forEach(r => {
            if (r.section) set.add(r.section);
        });
        return ['ALL', ...Array.from(set).sort()];
    }, [data]);

    // Build merged trend chart data
    const trendChartData = useMemo(() => {
        if (!trendData?.trend?.length) return [];
        const studentMap = {};
        if (trendData.studentTrend) {
            trendData.studentTrend.forEach(s => { studentMap[s.period] = s.studentAttendance; });
        }
        return trendData.trend.map(t => ({
            period: t.period,
            classAverage: t.classAverage,
            ...(trendStudent ? { studentAttendance: studentMap[t.period] ?? null } : {})
        }));
    }, [trendData, trendStudent]);

    // ── Drop-off Prediction ─────────────────────────────────────────────────
    const [dropoffStudent, setDropoffStudent] = useState('');

    const dropoffFilteredStudents = useMemo(() => {
    if (!data?.results) return [];

    return data.results.filter(r => {

        const matchDept =
            !isAdminOrPrincipal || department === 'ALL' || r.department === department;

        const matchYear =
            year === 'ALL' || Number(r.year) === Number(year);

        const matchSem =
            semester === 'ALL' || Number(r.semester) === Number(semester);

        const matchSection =
            section === 'ALL' || r.section === section;

        return matchDept && matchYear && matchSem && matchSection;
    });
}, [data, department, year, semester, section, isAdminOrPrincipal]);

    const dropoffPrediction = useMemo(() => {
        if (!dropoffStudent || !data?.results) return null;

        const student = data.results.find(r => r.student_id === dropoffStudent);
        if (!student?.monthly?.length || student.monthly.length < 2) return null;

        // Sort monthly by time
        const sorted = [...student.monthly].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);

        // Build data points: x = index, y = percentage
        const points = sorted.map((m, i) => ({ x: i, y: m.percentage, label: `${MONTHS[m.month]} ${m.year}` }));

        // Simple linear regression: y = mx + b
        const n = points.length;
        const sumX = points.reduce((s, p) => s + p.x, 0);
        const sumY = points.reduce((s, p) => s + p.y, 0);
        const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
        const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
        const denom = n * sumX2 - sumX * sumX;
        const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
        const intercept = (sumY - slope * sumX) / n;

        // Build historical points with fitted line
        const chartData = points.map(p => ({
            period: p.label,
            actual: Math.round(p.y * 10) / 10,
            predicted: Math.round((slope * p.x + intercept) * 10) / 10,
            type: 'historical'
        }));

        // Extrapolate 4 future periods
        const lastMonth = sorted[sorted.length - 1];
        let futureMonth = lastMonth.month;
        let futureYear = lastMonth.year;
        let weeksBelow65 = null;

        for (let i = 1; i <= 4; i++) {
            futureMonth++;
            if (futureMonth > 12) { futureMonth = 1; futureYear++; }
            const futureX = n - 1 + i;
            const predictedVal = Math.max(0, Math.min(100, Math.round((slope * futureX + intercept) * 10) / 10));
            chartData.push({
                period: `${MONTHS[futureMonth]} ${futureYear}`,
                actual: null,
                predicted: predictedVal,
                type: 'forecast'
            });

            if (weeksBelow65 === null && predictedVal < 65) {
                weeksBelow65 = i * 4; // approximate weeks (month ~ 4 weeks)
            }
        }

        // Check if already below 65
        const currentPct = student.attendance;
        const alreadyBelow = currentPct < 65;

        return {
            studentName: student.name || student.student_id,
            chartData,
            slope,
            currentPct: Math.round(currentPct * 10) / 10,
            weeksBelow65,
            alreadyBelow,
            isDeclining: slope < -0.5
        };
    }, [dropoffStudent, data]);

    // ── Sort helper ────────────────────────────────────────────────────────
    const handleSort = (col) => {
        if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(col); setSortDir('asc'); }
    };
    const SortIcon = ({ col }) => sortBy !== col ? null
        : sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-1" />
            : <ChevronDown className="w-3 h-3 inline ml-1" />;

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <DashboardLayout>
            <div className="p-6 max-w-7xl mx-auto space-y-6">

                {/* ── Page Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#1a2b4b] rounded-xl flex items-center justify-center flex-shrink-0">
                            <Activity className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Attendance Risk Prediction</h1>
                            <p className="text-xs text-gray-400">
                                ML-powered · Random Forest · Auto-scanned weekly
                                {data && ` · ${data.results?.length || 0} students loaded`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={fetchDashboard} disabled={loading}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200
                                text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button onClick={handleOpenNotifyModal} disabled={loading || !data?.results?.length}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1a2b4b] hover:bg-[#1e3460]
                                    text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                            <Bell className="w-4 h-4" />
                            Notify At-Risk
                        </button>
                        <button onClick={handleDownloadReport} disabled={downloading || loading || !data?.results?.length}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700
                                    text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                            <Download className="w-4 h-4" />
                            {downloading ? 'Generating…' : 'Download Report'}
                        </button>
                    </div>
                </div>

                {/* ── Toast ── */}
                {notifMsg && (
                    <div className={`p-3 rounded-lg text-sm font-medium border ${notifMsg.startsWith('✅')
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-red-50 border-red-200 text-red-700'
                        }`}>{notifMsg}</div>
                )}

                {/* ── Error ── */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                        <strong>Error loading data:</strong> {error}
                        <br /><span className="text-xs text-red-500">Check that the FastAPI service is running on port 8001 (or the fallback rule-based mode is active).</span>
                    </div>
                )}

                {/* ── Loading skeleton ── */}
                {loading && (
                    <div className="flex items-center justify-center py-24 gap-3 text-gray-500">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Fetching attendance data &amp; computing ML predictions…</span>
                    </div>
                )}

                {!loading && data && (
                    <>
                        {/* ── Capturable area for PDF ── */}
                        <div ref={chartsRef}>
                            {/* ── Stat cards ── */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard label="Total Students" value={data.summary?.total} icon={Users} colorClass="bg-blue-100 text-blue-600" />
                                <StatCard label="Safe" value={data.summary?.safe} icon={CheckCircle} colorClass="bg-green-100 text-green-600" subLabel="≥ 75% attendance" />
                                <StatCard label="Warning" value={data.summary?.warning} icon={AlertTriangle} colorClass="bg-amber-100 text-amber-600" subLabel="65–75% attendance" />
                                <StatCard label="High Risk" value={data.summary?.highRisk} icon={XCircle} colorClass="bg-red-100 text-red-600" subLabel="< 65% attendance" />
                            </div>

                            {/* ── Charts row ── */}
                            {data.summary?.total > 0 && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                                    {/* Pie chart */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Risk Distribution</h3>
                                        {pieData.length ? (
                                            <div className="flex items-center gap-4">
                                                <ResponsiveContainer width="50%" height={160}>
                                                    <PieChart>
                                                        <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                                                            {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                                                        </Pie>
                                                        <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <div className="space-y-3 flex-1">
                                                    {pieData.map((d, i) => (
                                                        <div key={d.name} className="flex items-center justify-between text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                                                                <span className="text-gray-600">{d.name}</span>
                                                            </div>
                                                            <span className="font-semibold text-gray-800">
                                                                {d.value} <span className="text-xs text-gray-400">
                                                                    ({((d.value / data.summary.total) * 100).toFixed(0)}%)
                                                                </span>
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : <p className="text-sm text-gray-400 text-center py-10">No data yet</p>}
                                    </div>

                                    {/* Department bar chart — shown ONLY for admin/principal */}
                                    {isAdminOrPrincipal && data.deptChart?.length > 0 && (
                                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                                            <h3 className="text-sm font-semibold text-gray-700 mb-4">Risk by Department</h3>
                                            <ResponsiveContainer width="100%" height={160}>
                                                <BarChart data={data.deptChart} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                    <XAxis dataKey="dept" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                                                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                                                    <Bar dataKey="safe" name="Safe" fill="#22c55e" radius={[3, 3, 0, 0]} />
                                                    <Bar dataKey="warning" name="Warning" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                                                    <Bar dataKey="highRisk" name="High Risk" fill="#ef4444" radius={[3, 3, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}

                                    {/* For teacher/hod OR single-dept: attendance % spread chart */}
                                    {(!isAdminOrPrincipal || !data.deptChart || data.deptChart.length <= 1) && data.results?.length > 0 && (
                                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                                            <h3 className="text-sm font-semibold text-gray-700 mb-4">Attendance % Spread</h3>
                                            <ResponsiveContainer width="100%" height={160}>
                                                <BarChart
                                                    data={[
                                                        { range: '<50%', count: data.results.filter(r => r.attendance < 50).length },
                                                        { range: '50–65%', count: data.results.filter(r => r.attendance >= 50 && r.attendance < 65).length },
                                                        { range: '65–75%', count: data.results.filter(r => r.attendance >= 65 && r.attendance < 75).length },
                                                        { range: '75–90%', count: data.results.filter(r => r.attendance >= 75 && r.attendance < 90).length },
                                                        { range: '≥90%', count: data.results.filter(r => r.attendance >= 90).length },
                                                    ]}
                                                    margin={{ top: 0, right: 4, left: -20, bottom: 0 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                    <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={v => [v, 'Students']} />
                                                    <Bar dataKey="count" name="Students" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Attendance Trend Over Time ── */}
                            {data.summary?.total > 0 && (
                                <div className="bg-white rounded-xl border border-gray-200 p-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-700">Attendance Trend Over Time</h3>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {isAdminOrPrincipal
                                                    ? 'All students across all departments'
                                                    : 'Students in your department'}
                                                {trendStudent && ' · Showing selected student'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {/* Period toggle */}
                                            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                                                <button
                                                    onClick={() => setTrendPeriod('week')}
                                                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                                        trendPeriod === 'week'
                                                            ? 'bg-[#1a2b4b] text-white'
                                                            : 'bg-white text-gray-600 hover:bg-gray-50'
                                                    }`}
                                                >Weekly</button>
                                                <button
                                                    onClick={() => setTrendPeriod('month')}
                                                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                                        trendPeriod === 'month'
                                                            ? 'bg-[#1a2b4b] text-white'
                                                            : 'bg-white text-gray-600 hover:bg-gray-50'
                                                    }`}
                                                >Monthly</button>
                                            </div>
                                            
                                            
                                        </div>
                                    </div>

                                    {trendLoading ? (
                                        <div className="flex items-center justify-center py-12 text-gray-400 text-sm gap-2">
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Loading trend data…
                                        </div>
                                    ) : trendChartData.length > 0 ? (
                                        <>
                                            <div className="h-56">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={trendChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                        <XAxis
                                                            dataKey="period"
                                                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                                                            angle={-30}
                                                            textAnchor="end"
                                                            height={50}
                                                        />
                                                        <YAxis
                                                            domain={[0, 100]}
                                                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                                                            tickFormatter={v => `${v}%`}
                                                        />
                                                        <Tooltip
                                                            formatter={(v, name) => [`${v}%`, name === 'classAverage' ? 'Class Average' : 'Selected Student']}
                                                            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                                                        />
                                                        <Legend
                                                            iconSize={10}
                                                            wrapperStyle={{ fontSize: 11 }}
                                                            formatter={name => name === 'classAverage' ? 'Class Average' : 'Selected Student'}
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="classAverage"
                                                            stroke="#a51befff"
                                                            strokeWidth={2.5}
                                                            dot={{ r: 4, fill: '#0c10fdff' }}
                                                            activeDot={{ r: 6 }}
                                                        />
                                                        {trendStudent && (
                                                            <Line
                                                                type="monotone"
                                                                dataKey="studentAttendance"
                                                                stroke="#f97316"
                                                                strokeWidth={2}
                                                                strokeDasharray="5 5"
                                                                dot={{ r: 4, fill: '#f97316' }}
                                                                activeDot={{ r: 6 }}
                                                            />
                                                        )}
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>

                                            {/* Insight: Declining students */}
                                            {trendData?.decliningStudents?.length > 0 && (
                                                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                                                        <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Early Warning — Attendance Dropping</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                        {trendData.decliningStudents.map((s, i) => (
                                                            <div key={i} className="flex items-center justify-between text-xs bg-white/70 rounded-lg px-3 py-2 border border-amber-100">
                                                                <div>
                                                                    <span className="font-medium text-gray-700">{s.name}</span>
                                                                    <span className="text-gray-400 ml-1">({s.enrollmentId})</span>
                                                                </div>
                                                                <span className="text-red-600 font-semibold">↓ {s.drop}%</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-sm text-gray-400 text-center py-10">No attendance trend data available</p>
                                    )}
                                </div>
                            )}

                            
                        </div>{/* end chartsRef */}
                        {/* ── Drop-off Prediction Graph ── */}
                            {data.results?.length > 0 && (
                                <div className="bg-white rounded-xl border border-gray-200 p-5">
                                    <div>
                                            <h3 className="text-sm font-semibold text-gray-700">Drop-off Prediction</h3>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Predicted future attendance % based on historical trend
                                            </p>
                                        </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-5 mb-2">
                                        

    {/* Department (admin/principal only) */}
    {isAdminOrPrincipal && (
        <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
        >
            {departments.map(d => (
                <option key={d} value={d}>
                    {d === 'ALL' ? 'All Departments' : d}
                </option>
            ))}
        </select>
    )}

    {/* Year */}
    <select
        value={year}
        onChange={(e) => setYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
    >
        <option value="ALL">All Years</option>
        {YEAR_LABELS.map((label, i) => (
            <option key={i+1} value={i+1}>{label}</option>
        ))}
    </select>

    {/* Section */}
    <select
        value={section}
        onChange={(e) => setSection(e.target.value)}
        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
    >
        {sections.map(s => (
            <option key={s} value={s}>
                {s === 'ALL' ? 'All Sections' : `Section ${s}`}
            </option>
        ))}
    </select>

    {/* Semester */}
    <select
        value={semester}
        onChange={(e) => setSemester(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
    >
        <option value="ALL">All Semesters</option>
        {[...new Set(Object.values(YEAR_SEM).flat())].sort().map(s => (
            <option key={s} value={s}>Semester {s}</option>
        ))}
    </select>

    {/* Student */}
    <select
        value={dropoffStudent}
        onChange={e => setDropoffStudent(e.target.value)}
        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white max-w-[250px]"
    >
        <option value="">Select a student…</option>
        {dropoffFilteredStudents.map(r => (
            <option key={r.student_id} value={r.student_id}>
                {r.name || r.student_id} ({r.attendance?.toFixed(1)}%)
            </option>
        ))}
    </select>

</div>

                                    {!dropoffStudent ? (
                                        <div className="text-center py-12">
                                            <TrendingDown className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                            <p className="text-sm text-gray-400">Select a student to see their predicted attendance trajectory</p>
                                        </div>
                                    ) : !dropoffPrediction ? (
                                        <p className="text-sm text-gray-400 text-center py-10">Not enough monthly data for this student to generate prediction</p>
                                    ) : (
                                        <>
                                            {/* Prediction insight banner */}
                                            {dropoffPrediction.alreadyBelow ? (
                                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                                    <span className="text-sm text-red-700">
                                                        <strong>{dropoffPrediction.studentName}</strong> is already below 65% at <strong>{dropoffPrediction.currentPct}%</strong>. Immediate intervention required.
                                                    </span>
                                                </div>
                                            ) : dropoffPrediction.weeksBelow65 ? (
                                                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                                                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                    <span className="text-sm text-amber-700">
                                                        <strong>{dropoffPrediction.studentName}</strong> is predicted to fall below 65% in approximately <strong>{dropoffPrediction.weeksBelow65} weeks</strong> if the current trend continues.
                                                    </span>
                                                </div>
                                            ) : dropoffPrediction.isDeclining ? (
                                                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                                                    <TrendingDown className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                                                    <span className="text-sm text-yellow-700">
                                                        <strong>{dropoffPrediction.studentName}</strong> has a declining trend but is not predicted to drop below 65% in the next 4 months.
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                    <span className="text-sm text-green-700">
                                                        <strong>{dropoffPrediction.studentName}</strong> is on a stable/improving trajectory. No risk of dropping below 65%.
                                                    </span>
                                                </div>
                                            )}

                                            {/* Area chart */}
                                            <div className="h-56">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={dropoffPrediction.chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                                        <defs>
                                                            <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                                                            </linearGradient>
                                                            <linearGradient id="gradPredicted" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                        <XAxis
                                                            dataKey="period"
                                                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                                                            angle={-30}
                                                            textAnchor="end"
                                                            height={50}
                                                        />
                                                        <YAxis
                                                            domain={[0, 100]}
                                                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                                                            tickFormatter={v => `${v}%`}
                                                        />
                                                        <Tooltip
                                                            formatter={(v, name) => {
                                                                if (v === null) return ['—', name];
                                                                const label = name === 'actual' ? 'Actual' : 'Predicted';
                                                                return [`${v}%`, label];
                                                            }}
                                                            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                                                            labelStyle={{ fontWeight: 600 }}
                                                        />
                                                        <Legend
                                                            iconSize={10}
                                                            wrapperStyle={{ fontSize: 11 }}
                                                            formatter={name => name === 'actual' ? 'Actual Attendance' : 'Predicted Attendance'}
                                                        />
                                                        {/* 65% danger threshold */}
                                                        <ReferenceLine
                                                            y={65}
                                                            stroke="#ef4444"
                                                            strokeDasharray="8 4"
                                                            strokeWidth={1.5}
                                                            label={{ value: '65% Threshold', position: 'insideTopRight', fill: '#ef4444', fontSize: 10, fontWeight: 600 }}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="actual"
                                                            stroke="#3b82f6"
                                                            strokeWidth={2}
                                                            fill="url(#gradActual)"
                                                            dot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                                                            activeDot={{ r: 6 }}
                                                            connectNulls={false}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="predicted"
                                                            stroke="#f97316"
                                                            strokeWidth={2}
                                                            strokeDasharray="6 3"
                                                            fill="url(#gradPredicted)"
                                                            dot={{ r: 4, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
                                                            activeDot={{ r: 6 }}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>

                                            <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <div className="w-3 h-0.5 bg-blue-500 rounded" /> Historical actual attendance
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <div className="w-3 h-0.5 bg-orange-500 rounded" style={{ borderTop: '1px dashed #f97316' }} /> Predicted (linear regression)
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <div className="w-3 h-0.5 bg-red-500 rounded" style={{ borderTop: '1px dashed #ef4444' }} /> 65% danger threshold
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                        {/* ── Filters ── */}
                        <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-xl p-3">

    {/* Risk Level Filter Pills */}
    <div className="flex items-center gap-1 mr-2">
        {[
            { key: 'ALL', label: 'All', colorClass: 'bg-gray-100 text-gray-700 hover:bg-gray-200', activeClass: 'bg-gray-800 text-white' },
            { key: 'SAFE', label: 'Safe', colorClass: 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200', activeClass: 'bg-green-600 text-white border-green-600' },
            { key: 'WARNING', label: 'Warning', colorClass: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200', activeClass: 'bg-amber-500 text-white border-amber-500' },
            { key: 'HIGH_RISK', label: 'High Risk', colorClass: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200', activeClass: 'bg-red-600 text-white border-red-600' },
        ].map(pill => (
            <button
                key={pill.key}
                onClick={() => setFilter(pill.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    filter === pill.key ? pill.activeClass : pill.colorClass
                }`}
            >
                {pill.label}
                {pill.key !== 'ALL' && data?.summary && (
                    <span className="ml-1 opacity-80">
                        ({pill.key === 'SAFE' ? data.summary.safe : pill.key === 'WARNING' ? data.summary.warning : data.summary.highRisk})
                    </span>
                )}
            </button>
        ))}
    </div>

    <div className="w-px h-6 bg-gray-200" />

    {/* Department — admin/principal only */}
    {isAdminOrPrincipal && (
        <select
            value={department}
            onChange={(e)=>setDepartment(e.target.value)}
            className="px-3 py-1.5 w-[200px] border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
            {departments.map(d => (
                <option key={d} value={d}>
                    {d === 'ALL' ? 'All Departments' : d}
                </option>
            ))}
        </select>
    )}

    {/* Year */}
    <select
        value={year}
        onChange={(e)=>setYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
    >
        <option value="ALL">All Years</option>
        {YEAR_LABELS.map((label,i)=>(
            <option key={i+1} value={i+1}>{label}</option>
        ))}
    </select>

    {/* Section */}
    <select
        value={section}
        onChange={(e)=>setSection(e.target.value)}
        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
    >
        {sections.map(s => (
            <option key={s} value={s}>
                {s === 'ALL' ? 'All Sections' : `Section ${s}`}
            </option>
        ))}
    </select>

    {/* Semester */}
    <select
        value={semester}
        onChange={(e)=>setSemester(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
    >
        <option value="ALL">All Semesters</option>
        {[...new Set(Object.values(YEAR_SEM).flat())].sort().map(s=>(
            <option key={s} value={s}>Semester {s}</option>
        ))}
    </select>

    {/* Search */}
    <div className="relative ml-auto w-[160px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder="Search students..."
            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
    </div>

</div>

                        {/* ── Table ── */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            {filtered.length === 0 ? (
                                <div className="text-center py-16 text-gray-400 text-sm">
                                    {data.results?.length === 0
                                        ? 'No students found. Make sure students have attendance records.'
                                        : 'No students match your search or filter.'}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-8"></th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                    Student ID
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700"
                                                    onClick={() => handleSort('name')}>
                                                    Name <SortIcon col="name" />
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                                                    Dept
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
Year
</th>

<th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
Sem
</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700"
                                                    onClick={() => handleSort('attendance')}>
                                                    Attendance <SortIcon col="attendance" />
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                    Trend
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700"
                                                    onClick={() => handleSort('risk')}>
                                                    Risk Level <SortIcon col="risk" />
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                                                    Confidence
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filtered.map(r => (
                                                <React.Fragment key={r.student_id}>
                                                    <tr
                                                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                                                        onClick={() => setExpanded(expanded === r.student_id ? null : r.student_id)}
                                                    >
                                                        <td className="px-4 py-3 text-gray-400">
                                                            {expanded === r.student_id
                                                                ? <ChevronUp className="w-4 h-4" />
                                                                : <ChevronDown className="w-4 h-4" />}
                                                        </td>
                                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.student_id}</td>
                                                        <td className="px-4 py-3 font-medium text-gray-800">{r.name || '—'}</td>
                                                       <td className="px-4 py-3 text-gray-500 text-xs">
{r.deptShort || r.department || '—'}
</td>

<td className="px-4 py-3 text-gray-600 text-xs font-medium">
{r.year ?? '—'}
</td>

<td className="px-4 py-3 text-gray-600 text-xs font-medium">
{r.semester ?? '—'}
</td>
                                                        <td className="px-4 py-3"><AttendanceBar pct={r.attendance} /></td>
                                                        <td className="px-4 py-3"><TrendIcon trend={r.trend} /></td>
                                                        <td className="px-4 py-3"><RiskBadge level={r.risk_level} /></td>
                                                        <td className="px-4 py-3 text-xs text-gray-400 font-mono hidden lg:table-cell">
                                                            {r.risk_probability != null
                                                                ? `${(r.risk_probability * 100).toFixed(1)}%`
                                                                : '—'}
                                                        </td>
                                                    </tr>
                                                    {/* Expanded row — monthly trend chart */}
                                                    {expanded === r.student_id && (
                                                        <tr className="bg-blue-50/40">
                                                            <td colSpan={10} className="px-6 py-4">
                                                                <div className="flex flex-col sm:flex-row gap-6">
                                                                    <div className="flex-1">
                                                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                                                            Monthly Attendance Trend
                                                                        </p>
                                                                        <MonthlyTrendChart monthly={r.monthly} />
                                                                    </div>
                                                                    <div className="sm:w-52 space-y-2">
                                                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Details</p>
                                                                        {[
                                                                            ['Student ID', r.student_id],
                                                                            ['Email', r.email || '—'],
                                                                            ['Department', r.department || '—'],
                                                                            ['Avg Attendance', `${r.attendance?.toFixed(1)}%`],
                                                                            ['Risk Level', r.risk_level],
                                                                            ['Trend', r.trend],
                                                                        ].map(([k, v]) => (
                                                                            <div key={k} className="flex justify-between text-xs">
                                                                                <span className="text-gray-400">{k}</span>
                                                                                <span className="font-medium text-gray-700">{v}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-gray-400 text-right">
                            Showing {filtered.length} of {data.results?.length || 0} students
                            · Thresholds: Safe ≥75% · Warning 65–75% · High Risk &lt;65%
                            · Weekly auto-scan every Monday 8:00 AM IST
                        </p>
                    </>
                )}

                {/* ── Notify Modal ── */}
                {showNotifyModal && data?.results && (
                    <NotifyModal
                        students={data.results}
                        onClose={() => setShowNotifyModal(false)}
                        onNotify={handleNotifyStudents}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}