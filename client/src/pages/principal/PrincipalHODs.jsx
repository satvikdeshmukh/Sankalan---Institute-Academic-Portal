import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrincipalData } from '../../hooks/usePrincipalData.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { ChevronRight, Building2, Mail } from 'lucide-react';

const P_GRAD = 'linear-gradient(135deg, rgb(127,29,29) 0%, rgb(190,18,60) 40%, rgb(225,29,72) 75%, rgb(251,113,133) 100%)';
export default function PrincipalHODs() {
    const { hods, loading } = usePrincipalData();
    const navigate = useNavigate();

    return (
        <DashboardLayout title="Heads of Department" subtitle={`${hods.length} HODs`}>
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin" />
                </div>
            ) : hods.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-gray-400">
                    <Building2 className="w-12 h-12 mb-3 opacity-25" />
                    <p className="text-sm font-medium">No HODs assigned yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hods.map(h => (
                        <div
                            key={h.user_id}
                            onClick={() => navigate(`/principal/hods/${h.user_id}`)}
                            className="bg-white rounded-2xl shadow-card p-5 animate-fade-in cursor-pointer group hover:shadow-md hover:border-violet-100 border border-transparent transition-all"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ background: P_GRAD }}>
                                    {h.full_name?.[0]?.toUpperCase() || 'H'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-gray-900 truncate group-hover:text-[rgb(190,18,60)]  transition-colors">
                                        {h.full_name}
                                    </p>
                                    {h.email && (
                                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                            <Mail className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">{h.email}</span>
                                        </div>
                                    )}
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-violet-500 flex-shrink-0 transition-colors" />
                            </div>

                            <div className="flex items-center gap-1.5 bg-[rgba(190,18,60,0.09)] rounded-xl px-3 py-2 text-sm mb-2">
                                <Building2 className="w-3.5 h-3.5 text-[rgb(190,18,60)]  flex-shrink-0" />
                                <span className="font-semibold text-[rgb(190,18,60)]  truncate">{h.department_name}</span>
                            </div>
                            <div className="text-xs text-gray-400">{h.teacher_count} teacher{h.teacher_count !== 1 ? 's' : ''} under management</div>
                        </div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
