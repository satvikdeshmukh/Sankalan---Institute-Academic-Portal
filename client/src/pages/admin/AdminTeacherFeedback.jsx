import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api.js';
import socket from '../../lib/socket.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import {
    Star, Search, X, RefreshCw, Send, Link, Building2, Users, MessageSquare
} from 'lucide-react';

function Toast({ type, title, message, onClose }) {
    const c = { success: 'bg-emerald-50 border-emerald-300 text-emerald-800', error: 'bg-red-50 border-red-300 text-red-800', info: 'bg-blue-50 border-blue-300 text-blue-800' };
    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium max-w-sm ${c[type] || c.info}`}>
            <div className="flex-1"><p className="font-bold">{title}</p>{message && <p className="text-xs opacity-80 mt-0.5">{message}</p>}</div>
            <button onClick={onClose} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
    );
}

function StarRating({ value, onChange, size = 'w-6 h-6' }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(i => (
                <button key={i} type="button" onClick={() => onChange?.(i)}
                    className={`${size} transition-colors ${i <= value ? 'text-amber-400' : 'text-gray-300'} ${onChange ? 'hover:text-amber-500 cursor-pointer' : 'cursor-default'}`}>
                    <Star className="w-full h-full" fill={i <= value ? 'currentColor' : 'none'} />
                </button>
            ))}
        </div>
    );
}

export default function AdminTeacherFeedback() {
    const [teachers, setTeachers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Feedback form sending
    const [formDept, setFormDept] = useState('');
    const [formLink, setFormLink] = useState('');
    const [sending, setSending] = useState(false);

    // Rating input
    const [ratingTeacher, setRatingTeacher] = useState('');
    const [ratingValue, setRatingValue] = useState(0);
    const [ratingSemester, setRatingSemester] = useState('');
    const [ratingRemarks, setRatingRemarks] = useState('');
    const [savingRating, setSavingRating] = useState(false);

    const showToast = (t, ti, m) => { setToast({ type: t, title: ti, message: m }); setTimeout(() => setToast(null), 4000); };

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [tchrs, depts, fLogs] = await Promise.all([
                api.get('/admin/teachers'),
                api.get('/auth/departments'),
                api.get('/admin/feedback-logs'),
            ]);
            setTeachers(Array.isArray(tchrs) ? tchrs : []);
            setDepartments(Array.isArray(depts) ? depts : []);
            setLogs(Array.isArray(fLogs) ? fLogs : []);
        } catch (err) { showToast('error', 'Load failed', err.message); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);
    useEffect(() => {
        socket.on('teacher_feedback_change', fetchAll);
        return () => socket.off('teacher_feedback_change', fetchAll);
    }, [fetchAll]);

    // Send feedback form
    const handleSendForm = async () => {
        if (!formDept || !formLink) return showToast('error', 'Fill both fields');
        setSending(true);
        try {
            const res = await api.post('/admin/send-feedback-form', { departmentId: formDept, formLink });
            showToast('success', 'Form sent!', `Sent to ${res.sentTo} students`);
            setFormLink('');
            fetchAll();
        } catch (err) { showToast('error', 'Send failed', err.message); }
        finally { setSending(false); }
    };

    // Save rating
    const handleSaveRating = async () => {
        if (!ratingTeacher || ratingValue === 0) return showToast('error', 'Select teacher and rating');
        setSavingRating(true);
        try {
            await api.post('/admin/teacher-feedback', {
                teacherId: ratingTeacher,
                rating: ratingValue,
                semester: ratingSemester || undefined,
                remarks: ratingRemarks || undefined,
            });
            showToast('success', 'Rating saved');
            setRatingTeacher(''); setRatingValue(0); setRatingSemester(''); setRatingRemarks('');
            fetchAll();
        } catch (err) { showToast('error', 'Save failed', err.message); }
        finally { setSavingRating(false); }
    };

    const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';

    return (
        <DashboardLayout title="Teacher Feedback" subtitle="Send feedback forms and manage teacher ratings">
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            <div className="space-y-5">

                {/* Send Feedback Form Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Send className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-gray-900">Send Feedback Form to Students</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">Paste your Google Form link below and select a department. An email with the form link will be sent to all students in that department.</p>
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[250px]">
                            <label className="text-xs font-semibold text-gray-600 block mb-1">Google Form Link</label>
                            <div className="relative">
                                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input value={formLink} onChange={e => setFormLink(e.target.value)}
                                    placeholder="https://docs.google.com/forms/d/e/..."
                                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                        </div>
                        <div className="min-w-[180px]">
                            <label className="text-xs font-semibold text-gray-600 block mb-1">Department</label>
                            <select value={formDept} onChange={e => setFormDept(e.target.value)} className={inp}>
                                <option value="">Select department</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <button onClick={handleSendForm} disabled={sending}
                            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                            <Send className="w-4 h-4" /> {sending ? 'Sending…' : 'Send to Students'}
                        </button>
                    </div>
                </div>

                {/* Rating Input Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Star className="w-5 h-5 text-amber-500" />
                        <h3 className="font-bold text-gray-900">Add Teacher Rating</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">Based on feedback responses, assign a rating (1–5 stars) to each teacher.</p>
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs font-semibold text-gray-600 block mb-1">Teacher</label>
                            <select value={ratingTeacher} onChange={e => setRatingTeacher(e.target.value)} className={inp}>
                                <option value="">Select teacher</option>
                                {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName} ({t.departmentName})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1">Rating</label>
                            <StarRating value={ratingValue} onChange={setRatingValue} />
                        </div>
                        <div className="min-w-[140px]">
                            <label className="text-xs font-semibold text-gray-600 block mb-1">Semester</label>
                            <input value={ratingSemester} onChange={e => setRatingSemester(e.target.value)}
                                placeholder="e.g. 2025-26 Sem 1" className={inp} />
                        </div>
                        <div className="min-w-[160px]">
                            <label className="text-xs font-semibold text-gray-600 block mb-1">Remarks</label>
                            <input value={ratingRemarks} onChange={e => setRatingRemarks(e.target.value)}
                                placeholder="Optional remarks" className={inp} />
                        </div>
                        <button onClick={handleSaveRating} disabled={savingRating}
                            className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 disabled:opacity-60">
                            {savingRating ? 'Saving…' : 'Save Rating'}
                        </button>
                    </div>
                </div>

                {/* Sent Form Logs */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" /> Feedback Form History ({logs.length})
                        </span>
                        <button onClick={fetchAll} className="text-gray-400 hover:text-gray-700"><RefreshCw className="w-4 h-4" /></button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['#', 'Form Link', 'Recipients', 'Sent At'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {logs.map((log, i) => (
                                    <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">{i + 1}</td>
                                        <td className="px-4 py-3 text-xs">
                                            <a href={log.formLink} target="_blank" rel="noopener noreferrer"
                                                className="text-indigo-600 hover:underline truncate block max-w-[300px]">{log.formLink}</a>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-700">{log.recipientCount}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{new Date(log.sentAt).toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr><td colSpan={4} className="text-center py-12 text-gray-400">
                                        <Send className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p className="font-semibold text-sm">No forms sent yet</p>
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
