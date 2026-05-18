import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrincipalData } from '../../hooks/usePrincipalData.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { Search, Users, Mail, Phone, Building2, ChevronDown, ChevronRight } from 'lucide-react';

const P_GRAD = 'linear-gradient(135deg, rgb(127,29,29) 0%, rgb(190,18,60) 40%, rgb(225,29,72) 75%, rgb(251,113,133) 100%)';
export default function PrincipalTeachers() {
    const { departments, teachers, loading } = usePrincipalData();
    const navigate = useNavigate();
    const [selectedDeptId, setSelectedDeptId] = useState('all');
    const [search, setSearch] = useState('');

    // Filter by selected department and search term
    const filtered = teachers.filter(t => {
        const matchDept = selectedDeptId === 'all' || t.department_id === selectedDeptId;
        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            t.full_name?.toLowerCase().includes(q) ||
            t.email?.toLowerCase().includes(q) ||
            t.department_name?.toLowerCase().includes(q) ||
            t.phone?.toLowerCase().includes(q);
        return matchDept && matchSearch;
    });

    const selectedDept = departments.find(d => d.id === selectedDeptId);

    return (
        <DashboardLayout
            title="All Teachers"
            subtitle={`${teachers.length} teacher${teachers.length !== 1 ? 's' : ''} across ${departments.length} departments`}
        >
            {loading ? (
                <div className="flex justify-center py-24">
                    <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* ── Filter Bar ── */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        {/* Department dropdown */}
                        <div className="relative min-w-[230px]">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(190,18,60)] pointer-events-none" />
                            <select
                                value={selectedDeptId}
                                onChange={e => setSelectedDeptId(e.target.value)}
                                className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(190,18,60)]  appearance-none font-medium text-gray-700 cursor-pointer"
                            >
                                <option value="all">All Departments</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}  ({d.teacher_count} teachers)
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Search */}
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search name, email, phone…"
                                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(190,18,60)]"
                            />
                        </div>
                    </div>

                    {/* ── Department Info Banner ── */}
                    {selectedDept && (
                        <div className="mb-5 flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3.5">
                            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-emerald-800 text-sm">{selectedDept.name}</p>
                                <p className="text-xs text-emerald-600">
                                    {selectedDept.teacher_count} teacher{selectedDept.teacher_count !== 1 ? 's' : ''} &middot; {selectedDept.student_count} students
                                    {selectedDept.hod_name && ` · HOD: ${selectedDept.hod_name}`}
                                </p>
                            </div>
                            <span className="ml-auto text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                                {filtered.length} shown
                            </span>
                        </div>
                    )}

                    {/* Result count */}
                    {selectedDeptId === 'all' && (
                        <p className="text-sm text-gray-500 mb-4">
                            Showing <span className="font-semibold text-gray-700">{filtered.length}</span> teacher{filtered.length !== 1 ? 's' : ''}
                            {search && <> matching &ldquo;<span className="italic">{search}</span>&rdquo;</>}
                        </p>
                    )}

                    {/* ── Teacher Cards ── */}
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center py-20 text-gray-400">
                            <Users className="w-12 h-12 mb-3 opacity-30" />
                            <p className="text-sm font-medium">No teachers found</p>
                            <p className="text-xs mt-1">Try selecting a different department or clearing the search</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map(t => (
                                <div
                                    key={`${t.user_id}-${t.department_id}`}
                                    onClick={() => navigate(`/principal/teachers/${t.user_id}`)}
                                    className="bg-white rounded-2xl shadow-card p-5 border border-gray-50 hover:shadow-md hover:border-emerald-100 transition-all cursor-pointer group"
                                >
                                    {/* Avatar + Name */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow" style={{ background: P_GRAD }}>
                                            {t.full_name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-gray-900 truncate text-sm group-hover:text-[rgb(190,18,60)]  transition-colors">{t.full_name}</p>
                                            <p className="text-xs text-[rgb(190,18,60)]  font-medium truncate">Teacher</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[rgb(190,18,60)]  flex-shrink-0 transition-colors" />
                                    </div>

                                    {/* Contact details */}
                                    <div className="space-y-2">
                                        {t.email && (
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Mail className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                                                <span className="truncate">{t.email}</span>
                                            </div>
                                        )}
                                        {t.phone && (
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Phone className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                                                <span>{t.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Department badge (shown in All view) */}
                                    {selectedDeptId === 'all' && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <span className="inline-flex items-center gap-1 text-xs bg-[rgba(190,18,60,0.09)] text-[rgb(190,18,60)] font-medium px-2.5 py-1 rounded-lg">
                                                <Building2 className="w-3 h-3" />
                                                {t.department_name}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </DashboardLayout>
    );
}
