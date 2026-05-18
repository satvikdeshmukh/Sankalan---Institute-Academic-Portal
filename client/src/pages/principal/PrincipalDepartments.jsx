import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrincipalData } from '../../hooks/usePrincipalData.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { Building2, ChevronRight, Users, GraduationCap } from 'lucide-react';

const P_GRAD = 'linear-gradient(135deg, rgb(127,29,29) 0%, rgb(190,18,60) 40%, rgb(225,29,72) 75%, rgb(251,113,133) 100%)';
export default function PrincipalDepartments() {
    const { departments, loading } = usePrincipalData();
    const navigate = useNavigate();

    return (
        <DashboardLayout title="Departments" subtitle={`${departments.length} departments`}>
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                </div>
            ) : departments.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-gray-400">
                    <Building2 className="w-12 h-12 mb-3 opacity-25" />
                    <p className="text-sm font-medium">No departments found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departments.map(d => (
                        <div
                            key={d.id}
                            onClick={() => navigate(`/principal/departments/${d.id}`)}
                            className="bg-white rounded-2xl shadow-card p-5 animate-fade-in cursor-pointer group hover:shadow-md hover:border-emerald-100 border border-transparent transition-all"
                        >
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow flex-shrink-0" style={{ background: P_GRAD }}>
                                    <Building2 className="w-5 h-5 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-gray-900 truncate group-hover:text-[rgb(190,18,60)]  transition-colors">{d.name}</p>
                                    {d.hod_name && (
                                        <p className="text-xs text-gray-400 truncate">HOD: {d.hod_name}</p>
                                    )}
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[rgb(190,18,60)]  flex-shrink-0 transition-colors" />
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-emerald-50 rounded-xl p-3 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                    <div>
                                        <p className="text-xl font-bold text-emerald-700">{d.teacher_count}</p>
                                        <p className="text-xs text-gray-500">Teachers</p>
                                    </div>
                                </div>
                                <div className="bg-sky-50 rounded-xl p-3 flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-sky-500 flex-shrink-0" />
                                    <div>
                                        <p className="text-xl font-bold text-sky-700">{d.student_count}</p>
                                        <p className="text-xs text-gray-500">Students</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
