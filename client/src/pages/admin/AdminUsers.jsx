import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useAdminData } from '../../hooks/useAdminData.js';
import { useUserBlocks } from '../../hooks/useUserBlocks.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { Search, ShieldOff, ShieldAlert, User, X, Mail, Building2, BookOpen, Calendar, Trash2 } from 'lucide-react';

export default function AdminUsers() {
    const { user } = useAuth();
    const { users, loading, refetch } = useAdminData();
    const { blockUser, unblockUser, deleteUser } = useUserBlocks();
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [working, setWorking] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        const matchQ = u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
        const matchRole = roleFilter ? u.role === roleFilter : true;
        return matchQ && matchRole;
    });

    const handleBlock = async (u) => {
        if (!window.confirm(`Block ${u.fullName}?`)) return;
        setWorking(u.id);
        await blockUser(u.id, user.id, '');
        await refetch();
        setWorking(null);
    };

    const handleUnblock = async (u) => {
        setWorking(u.id);
        await unblockUser(u.id);
        await refetch();
        setWorking(null);
    };

    const handleDelete = async (u) => {
        if (!window.confirm(`Are you absolutely sure you want to PERMANENTLY DELETE ${u.fullName}? This cannot be undone.`)) return;
        if (!window.confirm(`LAST CHANCE: All associated data for ${u.fullName} will be purged. Proceed?`)) return;
        
        setWorking(u.id);
        const success = await deleteUser(u.id);
        if (success) {
            setSelectedUser(null);
            await refetch();
        }
        setWorking(null);
    };

    const roleBadgeColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-rose-100 text-rose-700';
            case 'hod': return 'bg-amber-100 text-amber-700';
            case 'principal': return 'bg-violet-100 text-violet-700';
            case 'teacher': return 'bg-sky-100 text-sky-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <DashboardLayout title="User Management" subtitle={`${users.length} total users`}>
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white shadow-sm" />
                </div>
                {/* <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white shadow-sm appearance-none cursor-pointer">
                    <option value="">All Roles</option>
                    {['teacher', 'hod', 'principal', 'admin'].map(r => <option key={r} value={r} className="capitalize">{r.toUpperCase()}</option>)}
                </select> */}
            </div>

            {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" /></div>
                : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map(u => (
                        <div
                            key={u.id}
                            onClick={() => setSelectedUser(u)}
                            className={`bg-white rounded-[28px] shadow-sm border border-gray-100 p-6 flex flex-col gap-4 cursor-pointer hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group ${u.isBlocked ? 'opacity-70 border-red-200' : ''}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center text-white font-black text-xl shadow-inner ${u.isBlocked ? 'bg-red-400' : 'bg-gradient-to-br from-indigo-500 to-violet-600'}`}>
                                    {u.fullName?.[0] || <User className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{u.fullName}</p>
                                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                </div>
                                {u.id !== user?.id && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(u); }}
                                        className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        title="Quick Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${roleBadgeColor(u.role)}`}>{u.role}</span>
                                {u.isBlocked && <span className="text-[10px] px-3 py-1 bg-red-100 text-red-700 rounded-full font-bold uppercase tracking-wider">Blocked</span>}
                            </div>
                            <div className="mt-auto" onClick={e => e.stopPropagation()}>
                                {u.id !== user?.id && (
                                    u.isBlocked ? (
                                        <button onClick={() => handleUnblock(u)} disabled={working === u.id} className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 disabled:opacity-60 transition-colors">
                                            <ShieldOff className="w-4 h-4" /> Unblock User
                                        </button>
                                    ) : (
                                        <button onClick={() => handleBlock(u)} disabled={working === u.id} className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 disabled:opacity-60 transition-colors">
                                            <ShieldAlert className="w-4 h-4" /> Block User
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    ))}
                </div>}

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setSelectedUser(null)}>
                    <div className="bg-white rounded-[36px] max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-400" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className={`px-10 py-10 text-center relative ${selectedUser.isBlocked ? 'bg-red-500' : 'bg-gradient-to-br from-indigo-600 to-violet-600'}`}>
                            <button onClick={() => setSelectedUser(null)} className="absolute top-5 right-5 p-2 text-white/60 hover:text-white transition-colors rounded-xl hover:bg-white/10">
                                <X className="w-5 h-5" />
                            </button>
                            <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center text-white font-black text-4xl mx-auto mb-5 shadow-inner backdrop-blur-md ${selectedUser.isBlocked ? 'bg-white/20' : 'bg-white/20'}`}>
                                {(selectedUser.fullName || 'U').charAt(0)}
                            </div>
                            <h2 className="text-white text-2xl font-black uppercase tracking-wide">{selectedUser.fullName}</h2>
                            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">{selectedUser.email}</p>
                            <div className="flex items-center justify-center gap-2 mt-4">
                                <span className="px-5 py-1.5 bg-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-full">{selectedUser.role}</span>
                                {selectedUser.isBlocked && <span className="px-5 py-1.5 bg-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Blocked</span>}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="p-10 space-y-5">
                            {[
                                { icon: Mail, label: 'Email', value: selectedUser.email },
                                { icon: User, label: 'Full Name', value: selectedUser.fullName || '—' },
                                // { icon: Building2, label: 'Department', value: selectedUser.departmentName || selectedUser.department?.name || '—' },
                                { icon: BookOpen, label: 'Role', value: (selectedUser.role || '—').toUpperCase() },
                                { icon: Calendar, label: 'Joined', value: selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : '—' },
                            ].map(item => (
                                <div key={item.label} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                                    <div className="p-2.5 bg-gray-50 rounded-xl text-gray-400">
                                        <item.icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
                                        <p className="text-sm font-bold text-gray-800 truncate">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="px-10 pb-8 flex gap-3">
                            {selectedUser.id !== user?.id && (
                                <>
                                    <div className="flex-[2]" onClick={e => e.stopPropagation()}>
                                        {selectedUser.isBlocked ? (
                                            <button onClick={() => { handleUnblock(selectedUser); setSelectedUser(null); }} className="w-full py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2">
                                                <ShieldOff className="w-4 h-4" /> Unblock
                                            </button>
                                        ) : (
                                            <button onClick={() => { handleBlock(selectedUser); setSelectedUser(null); }} className="w-full py-3 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-rose-100 transition-colors flex items-center justify-center gap-2">
                                                <ShieldAlert className="w-4 h-4" /> Block
                                            </button>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(selectedUser)}
                                        disabled={working === selectedUser.id}
                                        className="flex-1 py-3 bg-rose-600 text-white font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-200"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete
                                    </button>
                                </>
                            )}
                            <button onClick={() => setSelectedUser(null)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs uppercase tracking-widest rounded-2xl transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
