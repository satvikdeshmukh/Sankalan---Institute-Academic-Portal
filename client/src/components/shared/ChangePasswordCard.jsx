import React, { useState } from 'react';
import { api } from '../../lib/api.js';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder-gray-400";

export default function ChangePasswordCard() {
    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [show, setShow] = useState({ current: false, newPwd: false, confirm: false });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null); // { type: 'success'|'error', text: string }

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
    const toggle = (key) => setShow(s => ({ ...s, [key]: !s[key] }));

    const handleSubmit = async () => {
        setMsg(null);
        if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
            setMsg({ type: 'error', text: 'All fields are required.' }); return;
        }
        if (form.newPassword.length < 6) {
            setMsg({ type: 'error', text: 'New password must be at least 6 characters.' }); return;
        }
        if (form.newPassword !== form.confirmPassword) {
            setMsg({ type: 'error', text: 'New passwords do not match.' }); return;
        }
        setSaving(true);
        try {
            await api.post('/profiles/update-password', {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            });
            setMsg({ type: 'success', text: 'Password updated successfully!' });
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setMsg(null), 4000);
        } catch (err) {
            setMsg({ type: 'error', text: err.message || 'Failed to update password.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-500" /> Update Password
            </h2>
            <p className="text-xs text-gray-400 mb-5">Your new password will replace the existing one in the database.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Current Password */}
                <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1.5">Current Password</label>
                    <div className="relative">
                        <input
                            type={show.current ? 'text' : 'password'}
                            value={form.currentPassword}
                            onChange={e => set('currentPassword', e.target.value)}
                            className={`${inputCls} pr-10`}
                            placeholder="Enter current password"
                        />
                        <button type="button" onClick={() => toggle('current')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {show.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* New Password */}
                <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1.5">New Password</label>
                    <div className="relative">
                        <input
                            type={show.newPwd ? 'text' : 'password'}
                            value={form.newPassword}
                            onChange={e => set('newPassword', e.target.value)}
                            className={`${inputCls} pr-10`}
                            placeholder="Min. 6 characters"
                        />
                        <button type="button" onClick={() => toggle('newPwd')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {show.newPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {/* Strength indicator */}
                    {form.newPassword && (
                        <div className="flex gap-1 mt-1.5">
                            {[6, 10, 14].map((threshold, i) => (
                                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${form.newPassword.length >= threshold
                                    ? i === 0 ? 'bg-red-400' : i === 1 ? 'bg-yellow-400' : 'bg-green-500'
                                    : 'bg-gray-200'
                                    }`} />
                            ))}
                            <span className="text-[10px] text-gray-400 ml-1">
                                {form.newPassword.length < 6 ? 'Too short' : form.newPassword.length < 10 ? 'Weak' : form.newPassword.length < 14 ? 'Good' : 'Strong'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Confirm Password */}
                <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1.5">Confirm New Password</label>
                    <div className="relative">
                        <input
                            type={show.confirm ? 'text' : 'password'}
                            value={form.confirmPassword}
                            onChange={e => set('confirmPassword', e.target.value)}
                            className={`${inputCls} pr-10 ${form.confirmPassword && form.confirmPassword !== form.newPassword ? 'border-red-300 focus:ring-red-400' : ''}`}
                            placeholder="Re-enter new password"
                        />
                        <button type="button" onClick={() => toggle('confirm')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {form.confirmPassword && form.confirmPassword !== form.newPassword && (
                        <p className="text-[10px] text-red-500 mt-1">Passwords don't match</p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3 mt-5">
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    {saving ? 'Updating…' : 'Update Password'}
                </button>

                {msg && (
                    <div className={`flex items-center gap-1.5 text-sm font-medium ${msg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {msg.type === 'success'
                            ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                            : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                        {msg.text}
                    </div>
                )}
            </div>
        </div>
    );
}
