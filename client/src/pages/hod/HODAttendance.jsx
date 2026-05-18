import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../lib/api.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import {
    Search, Filter, Calendar, Users, Loader2, ChevronRight,
    CheckCircle2, AlertTriangle, XCircle, X
} from 'lucide-react';

const YEARS = [{ value: '', label: 'All Years' }, ...[1, 2, 3, 4].map(y => ({ value: String(y), label: `${y}${['st', 'nd', 'rd', 'th'][y - 1]} Year` }))];
const SEMS = [{ value: '', label: 'All Sem' }, ...[1, 2, 3, 4, 5, 6, 7, 8].map(s => ({ value: String(s), label: `Sem ${s}` }))];
const SECS = [{ value: '', label: 'All Sections' }, ...['A', 'B', 'C', 'D'].map(s => ({ value: s, label: `Section ${s}` }))];

function AttBadge({ pct }) {
    if (pct == null) return <span className="text-gray-400 text-xs">—</span>;
    const clr = pct >= 75 ? 'bg-green-100 text-green-700 border-green-200'
        : pct >= 60 ? 'bg-amber-100 text-amber-700 border-amber-200'
            : 'bg-red-100 text-red-700 border-red-200';
    const Icon = pct >= 75 ? CheckCircle2 : pct >= 60 ? AlertTriangle : XCircle;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${clr}`}>
            <Icon className="w-3 h-3" />{pct.toFixed(1)}%
        </span>
    );
}

function AttBar({ pct }) {
    const clamped = Math.max(0, Math.min(100, pct || 0));
    const color = clamped >= 75 ? '#10b981' : clamped >= 60 ? '#f59e0b' : '#ef4444';
    return (
        <div className="flex items-center gap-2 min-w-[100px]">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${clamped}%`, background: color }} />
            </div>
            <span className="text-xs font-bold text-gray-600 w-9 text-right">{clamped.toFixed(0)}%</span>
        </div>
    );
}

export default function HODAttendance() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [yearF, setYear] = useState('');
    const [semF, setSem] = useState('');
    const [secF, setSec] = useState('');

    useEffect(() => {
        setLoading(true);
        api.get('/students')
            .then(data => setStudents(Array.isArray(data) ? data : []))
            .catch(() => setStudents([]))
            .finally(() => setLoading(false));
    }, []);

    // Compute per-student average attendance from monthly records if available
    const enriched = useMemo(() => students.map(s => {
        const enr = s.enrollments?.[0];
        const year = enr?.year || s.year;
        const semester = enr?.semester || s.semester;
        const section = enr?.section || s.section || 'A';
        // Calculate avg attendance from monthly records
        // Try multiple possible fields returned by backend
        const monthly =
            s.attendanceMonthly ||
            s.monthly ||
            s.attendance ||
            [];

        let avgAtt = null;

        if (Array.isArray(monthly) && monthly.length > 0) {

            const valid = monthly.filter(m => typeof m.percentage === "number");

            if (valid.length > 0) {
                avgAtt =
                    valid.reduce((sum, m) => sum + m.percentage, 0) /
                    valid.length;
            }
        }
        return { ...s, year, semester, section, avgAtt };
    }), [students]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return enriched.filter(s => {
            if (yearF && String(s.year) !== yearF) return false;
            if (semF && String(s.semester) !== semF) return false;
            if (secF && s.section !== secF) return false;
            if (q) {
                const nm = (s.fullName || s.name || '').toLowerCase();
                const sid = (s.studentId || '').toLowerCase();
                const em = (s.email || '').toLowerCase();
                if (!nm.includes(q) && !sid.includes(q) && !em.includes(q)) return false;
            }
            return true;
        });
    }, [enriched, search, yearF, semF, secF]);

    const clearFilters = () => { setSearch(''); setYear(''); setSem(''); setSec(''); };
    const hasFilters = search || yearF || semF || secF;

    // Section summary
    const secSummary = useMemo(() => {
        const map = {};
        filtered.forEach(s => {
            const sec = s.section || 'A';
            if (!map[sec]) map[sec] = { section: sec, count: 0, atRisk: 0 };
            map[sec].count++;
            if (s.avgAtt !== null && s.avgAtt < 75) map[sec].atRisk++;
        });
        return Object.values(map).sort((a, b) => a.section.localeCompare(b.section));
    }, [filtered]);

    const atRisk = useMemo(() => filtered.filter(s => s.avgAtt !== null && s.avgAtt < 75).length, [filtered]);

    return (
        <DashboardLayout title="Department Attendance" subtitle="Monitor attendance across all sections and years">
            <div className="space-y-5">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Total Students', value: filtered.length, color: 'bg-indigo-50 text-indigo-700', icon: Users },
                        { label: 'At Risk (<75%)', value: atRisk, color: 'bg-red-50 text-red-700', icon: XCircle },
                        { label: 'Good Standing', value: filtered.filter(s => s.avgAtt !== null && s.avgAtt >= 75).length, color: 'bg-green-50 text-green-700', icon: CheckCircle2 },
                        { label: 'No Data', value: filtered.filter(s => s.avgAtt === null).length, color: 'bg-gray-50 text-gray-600', icon: AlertTriangle },
                    ].map(card => (
                        <div key={card.label} className={`rounded-2xl p-4 border ${card.color.includes('indigo') ? 'border-indigo-200' : card.color.includes('red') ? 'border-red-200' : card.color.includes('green') ? 'border-green-200' : 'border-gray-200'} flex items-center gap-3 ${card.color}`}>
                            <card.icon className="w-7 h-7 opacity-70 flex-shrink-0" />
                            <div>
                                <p className="text-2xl font-black">{card.value}</p>
                                <p className="text-xs font-medium opacity-70">{card.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Section Summary */}
                

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search name, roll no, email…"
                                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
                        </div>
                        <select value={yearF} onChange={e => setYear(e.target.value)}
                            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            {YEARS.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
                        </select>
                        <select value={semF} onChange={e => setSem(e.target.value)}
                            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            {SEMS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        <select value={secF} onChange={e => setSec(e.target.value)}
                            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            {SECS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        {hasFilters && (
                            <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200">
                                <X className="w-3.5 h-3.5" /> Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            {filtered.length} Student{filtered.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-48 text-gray-400">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {['Roll No', 'Name', 'Email', 'Year', 'Sem', 'Section', 'Attendance'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.map(s => (
                                        <tr key={s.id}
                                            onClick={() => navigate(`/hod/students/${s.id}`)}
                                            className="hover:bg-indigo-50/40 cursor-pointer transition-colors group">
                                            <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-600">{s.studentId || '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                                                    {s.fullName || s.name || '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-500">{s.email || '—'}</td>
                                            <td className="px-4 py-3 text-xs text-center">
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-semibold">
                                                    {s.year ? `Yr ${s.year}` : '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-center">
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-semibold">
                                                    {s.semester ? `S${s.semester}` : '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-bold">
                                                    {s.section || 'A'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {s.avgAtt !== null ? (
                                                    <div className="flex items-center gap-3">
                                                        <AttBar pct={s.avgAtt} />
                                                        <AttBadge pct={s.avgAtt} />
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">No data</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="text-center py-16 text-gray-400">
                                                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                                <p className="font-semibold text-sm">No students found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}