import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../lib/api.js';
import socket from '../../lib/socket.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import {
    FolderOpen, FileText, Download, ChevronDown, ChevronUp,
    Users, GraduationCap, Building2, Mail, Phone, BookOpen, Search, Filter, Loader2
} from 'lucide-react';

function formatSize(b) {
    if (!b) return '—';
    if (b < 1024) return `${b}B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)}KB`;
    return `${(b / 1048576).toFixed(1)}MB`;
}

function fileIcon(type) {
    if (!type) return '📄';
    if (type.includes('pdf')) return '📕';
    if (type.includes('image')) return '🖼️';
    if (type.includes('word') || type.includes('document')) return '📘';
    if (type.includes('sheet') || type.includes('excel')) return '📗';
    if (type.includes('zip') || type.includes('rar')) return '🗜️';
    return '📄';
}

const ROLE_TABS = [
    { key: 'TEACHER', label: 'Teachers', icon: GraduationCap, gradient: 'from-emerald-800 to-emerald-600', light: 'bg-blue-50 text-blue-700 border-blue-200' },
    { key: 'HOD', label: 'HODs', icon: Building2, gradient: 'from-amber-600 to-amber-800', light: 'bg-violet-50 text-violet-700 border-violet-200' },
    { key: 'PRINCIPAL', label: 'Principals', icon: Users, gradient: 'from-rose-600 to-rose-800', light: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

/* ─── Single Person Card ─── */
function PersonCard({ person, tabInfo }) {
    const [open, setOpen] = useState(false);
    const docs = person.documents || [];

    const handleDownload = (doc) => {
        if (!doc.url) return;
        const a = document.createElement('a');
        a.href = doc.url;
        a.download = doc.name || 'document';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className={`bg-white rounded-2xl shadow-sm border transition-all duration-200 ${open ? 'border-gray-200 shadow-md' : 'border-gray-100 hover:shadow-md hover:border-gray-200'}`}>
            {/* Header — always visible */}
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left"
            >
                {/* Avatar */}
                <div className={`w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-base bg-gradient-to-br ${tabInfo.gradient} shadow-sm`}>
                    {person.fullName?.[0]?.toUpperCase() || '?'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{person.fullName || '—'}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-0.5">
                        {person.email && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Mail className="w-3 h-3" /> {person.email}
                            </span>
                        )}
                        {person.department && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                <BookOpen className="w-3 h-3" /> {person.department}
                            </span>
                        )}
                        {person.phone && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Phone className="w-3 h-3" /> {person.phone}
                            </span>
                        )}
                    </div>
                </div>

                {/* Doc count + chevron */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${docs.length > 0 ? tabInfo.light : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                        {docs.length} doc{docs.length !== 1 ? 's' : ''}
                    </span>
                    {open
                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                </div>
            </button>

            {/* Expanded: profile + documents */}
            {open && (
                <div className="border-t border-gray-100 px-5 py-4">
                    {/* Extra profile fields */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                        {[
                            { label: 'Full Name', value: person.fullName },
                            { label: 'Email', value: person.email },
                            { label: 'Department', value: person.department },
                            { label: 'Phone', value: person.phone },
                            { label: 'Qualification', value: person.qualifications },
                        ].filter(f => f.value).map(f => (
                            <div key={f.label} className="bg-gray-50 rounded-xl px-3 py-2">
                                <p className="text-xs text-gray-400 mb-0.5">{f.label}</p>
                                <p className="text-sm font-medium text-gray-800 truncate">{f.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Documents list */}
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                        Uploaded Documents ({docs.length})
                    </h4>

                    {docs.length === 0 ? (
                        <div className="flex flex-col items-center py-6 text-gray-300">
                            <FolderOpen className="w-8 h-8 mb-1" />
                            <p className="text-xs">No documents uploaded yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {docs.map(doc => (
                                <div key={doc.id} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                                    <span className="text-lg flex-shrink-0">{fileIcon(doc.fileType)}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">{doc.name || '—'}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-gray-400">{formatSize(doc.size)}</span>
                                            <span className="text-gray-300">·</span>
                                            <span className="text-xs text-gray-400">{doc.fileType?.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                                            <span className="text-gray-300">·</span>
                                            <span className="text-xs text-gray-400">{new Date(doc.createdAt).toLocaleDateString('en-IN')}</span>
                                            {doc.category && doc.category !== 'personal' && (
                                                <>
                                                    <span className="text-gray-300">·</span>
                                                    <span className="text-xs font-semibold text-indigo-500 capitalize">{doc.category}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDownload(doc)}
                                        className="flex-shrink-0 p-2 text-blue-500 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                        title="Download"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─── Main Page ─── */
export default function AdminDocuments() {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('TEACHER');
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('');

    const fetchStaff = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.get('/admin/staff-documents');
            setStaff(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('fetchStaff error', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStaff();
        // Real-time: refresh when any document changes
        socket.on('document_change', fetchStaff);
        socket.on('user_change', fetchStaff);
        return () => {
            socket.off('document_change', fetchStaff);
            socket.off('user_change', fetchStaff);
        };
    }, [fetchStaff]);

    const tabInfo = ROLE_TABS.find(t => t.key === activeTab);

    // Unique departments for the active role
    const departments = useMemo(() => {
        const depts = staff
            .filter(u => u.role === activeTab && u.department)
            .map(u => u.department);
        return [...new Set(depts)].sort();
    }, [staff, activeTab]);

    const showDeptFilter = activeTab === 'TEACHER' || activeTab === 'HOD';

    const filteredUsers = staff
        .filter(u => u.role === activeTab)
        .filter(u => !deptFilter || u.department === deptFilter)
        .filter(u => {
            const q = search.toLowerCase();
            return !q || u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.department?.toLowerCase().includes(q);
        });

    const totalDocsForRole = staff
        .filter(u => u.role === activeTab)
        .reduce((sum, u) => sum + (u.documents?.length || 0), 0);

    return (
        <DashboardLayout title="Documents" subtitle="Browse uploaded documents by role">
            {/* Role Tabs */}
            <div className="flex flex-wrap gap-3 mb-6">
                {ROLE_TABS.map(tab => {
                    const Icon = tab.icon;
                    const roleUsers = staff.filter(u => u.role === tab.key);
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => { setActiveTab(tab.key); setSearch(''); setDeptFilter(''); }}
                            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-medium text-sm transition-all duration-200 border
                                ${isActive
                                    ? `bg-gradient-to-r ${tab.gradient} text-white border-transparent shadow-md`
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ml-1
                                ${isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {roleUsers.length}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Stats bar */}
            {!loading && (
                <div className="flex flex-wrap items-center gap-4 mb-5 px-1">
                    <p className="text-sm text-gray-500">
                        <span className="font-semibold text-gray-800">{filteredUsers.length}</span> {tabInfo?.label.toLowerCase()} found
                        {' · '}
                        <span className="font-semibold text-gray-800">{totalDocsForRole}</span> total documents
                    </p>
                </div>
            )}

            {/* Search + Department Filter */}
            <div className="flex flex-wrap gap-3 mb-5">
                <div className="relative flex-1 min-w-52">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={`Search ${tabInfo?.label.toLowerCase()} by name, email or department...`}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 shadow-sm"
                    />
                </div>

                {showDeptFilter && (
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <select
                            value={deptFilter}
                            onChange={e => setDeptFilter(e.target.value)}
                            className="pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 shadow-sm appearance-none cursor-pointer"
                        >
                            <option value="">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                )}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-24">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-20 text-center">
                    <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-400 font-medium">No {tabInfo?.label.toLowerCase()} found</p>
                    {search && <p className="text-gray-300 text-sm mt-1">Try a different search term</p>}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredUsers.map(person => (
                        <PersonCard
                            key={person.id}
                            person={person}
                            tabInfo={tabInfo}
                        />
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
