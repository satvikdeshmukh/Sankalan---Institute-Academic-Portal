import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useReports } from '../../hooks/useReports.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { Send, FileText, CheckCircle2, XCircle, Plus, X, Save } from 'lucide-react';

const STATUS_BADGE = {
    draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-500' },
    submitted_to_hod: { label: 'Submitted To HOD', cls: 'bg-yellow-100 text-yellow-700' },
    submitted_to_principal: { label: 'Submitted To Principal', cls: 'bg-purple-100 text-purple-700' },
    approved: { label: 'Approved', cls: 'bg-green-100 text-green-700' },
};

export default function HODSubmit() {
    const { user, departmentId } = useAuth();
    const { reports = [], createReport, submitReport, loading } = useReports(user?.id, 'hod', departmentId);

    const [selected, setSelected] = useState(new Set());
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    /* New report form */
    const [showNew, setShowNew] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [creating, setCreating] = useState(false);

    /* Toast */
    const [toast, setToast] = useState(null);
    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    /* Selectable reports: HOD's own drafts + teacher reports submitted to HOD */
    const hodDrafts = reports.filter(r =>
        (r.reporterRole === 'hod' || r.reporter_role === 'hod') && r.status === 'draft'
    );
    const teacherSubmitted = reports.filter(r => r.status === 'submitted_to_hod');
    const drafts = [...hodDrafts, ...teacherSubmitted];

    /* Already forwarded / approved */
    const submittedReports = reports.filter(r =>
        r.status === 'submitted_to_principal' || r.status === 'approved'
    );

    const toggle = (id) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleCreate = async () => {
        if (!title.trim()) return;
        setCreating(true);
        try {
            await createReport({ title, content, chart_data: {}, reporter_role: 'hod' });
            setTitle(''); setContent(''); setShowNew(false);
            showToast('success', 'Report saved as draft!');
        } catch {
            showToast('error', 'Failed to create report.');
        } finally {
            setCreating(false);
        }
    };

    const handleSubmit = async () => {
        if (!selected.size) return;
        setSaving(true);
        try {
            const count = selected.size;
            await Promise.all(
                Array.from(selected).map(id => submitReport(id, 'principal', notes))
            );
            setSelected(new Set());
            setNotes('');
            showToast('success', `${count} report${count > 1 ? 's' : ''} successfully submitted to the Principal!`);
        } catch (err) {
            console.error('Submission failed:', err);
            showToast('error', 'Submission failed. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const fmtDate = (d) => {
        if (!d) return '—';
        const dt = new Date(d);
        return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
    };

    return (
        <DashboardLayout title="Submit to Principal" subtitle="Create and send department reports to the Principal for review">
            {/* ── Toast ── */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium transition-all
                    ${toast.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-red-50 border border-red-200 text-red-800'}`
                }>
                    {toast.type === 'success'
                        ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    }
                    {toast.message}
                </div>
            )}

            <div className="mb-6 flex items-center justify-between">
                <div>
                </div>
                <button
                    onClick={() => setShowNew(!showNew)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#1e3a5f] text-white rounded-xl text-sm font-medium hover:bg-[#162d4a] transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Report
                </button>
            </div>

            {/* ── New Report Form ── */}
            {showNew && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-gray-900">New HOD Report</h2>
                        <button onClick={() => setShowNew(false)} className="p-1 text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Title *</label>
                            <input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Department Monthly Report"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Content</label>
                            <textarea
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                rows={4}
                                placeholder="Write your report content here…"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button onClick={() => setShowNew(false)} className="px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={creating || !title.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-xl text-sm font-medium hover:bg-[#162d4a] disabled:opacity-50 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            {creating ? 'Saving…' : 'Save Draft'}
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl border border-gray-200 p-6">

                    <h2 className="font-semibold text-gray-900 mb-4">Select Reports to Submit</h2>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-6 h-6 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                        </div>
                    ) : drafts.length === 0 ? (
                        <div className="py-8 text-center text-gray-400 text-sm">
                            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            No draft reports available. Click "New Report" to create one.
                        </div>
                    ) : (
                        <div className="space-y-3 mb-6">
                            {drafts.map(r => (
                                <label
                                    key={r.id}
                                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selected.has(r.id)
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected.has(r.id)}
                                        onChange={() => toggle(r.id)}
                                        className="mt-1 accent-blue-600"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-gray-400" />
                                            <p className="font-medium text-gray-900 text-sm">{r.title}</p>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5 ml-6">
                                            {fmtDate(r.createdAt || r.created_at)}
                                            {r.teacherName && <> • by <span className="text-gray-600 font-medium">{r.teacherName}</span></>}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_BADGE[r.status]?.cls || STATUS_BADGE.draft.cls}`}>
                                        {STATUS_BADGE[r.status]?.label || r.status}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}

                    {/* Notes */}
                    <div className="mb-6">
                        <label className="text-sm font-medium block mb-2">Additional Notes (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={4}
                            placeholder="Add any comments or notes for the Principal…"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={saving || !selected.size}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-[#1e3a5f] text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-[#162d4a] transition-colors"
                    >
                        <Send className="w-4 h-4" />
                        {saving
                            ? 'Submitting…'
                            : `Submit to Principal (${selected.size} selected)`}
                    </button>
                </div>

                {/* Previously Submitted */}
                {submittedReports.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-sm font-semibold text-gray-500 mb-3">Previously Submitted</h3>
                        <div className="space-y-2">
                            {submittedReports.map(r => (
                                <div key={r.id} className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-200">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{r.title}</p>
                                        <p className="text-xs text-gray-400">{fmtDate(r.createdAt || r.created_at)}</p>
                                    </div>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[r.status]?.cls || STATUS_BADGE.approved.cls}`}>
                                        {STATUS_BADGE[r.status]?.label || r.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
