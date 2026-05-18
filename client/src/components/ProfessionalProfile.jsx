import React, { useState, useEffect, useRef } from 'react';
import { useProfile } from '../hooks/useProfile.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api, apiFetch } from '../lib/api.js';
import DashboardLayout from './layout/DashboardLayout.jsx';
import {
    Save, Upload, Download, Trash2, FileText, Loader2,
    User, Mail, Phone, Building2, Award, Briefcase, MapPin,
    Calendar, Edit3, CheckCircle2, Camera, FolderOpen, X, KeyRound, Eye, EyeOff, BarChart3, ChevronDown, ShieldCheck
} from 'lucide-react';

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const inp = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder-gray-400 transition";
const lbl = "text-xs font-semibold text-gray-500 block mb-1.5 uppercase tracking-wide";

const ROLE_STYLES = {
    TEACHER: { gradient: 'from-[#1a2b4b] via-[#1e3461] to-[#243c6e]', badge: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30', avatar: 'from-yellow-400 to-amber-500', avatarText: 'text-gray-900' },
    HOD: { gradient: 'from-[#1e3a5f] via-[#1a4a7a] to-[#1e5799]', badge: 'bg-amber-400/20 text-amber-300 border-amber-400/30', avatar: 'from-amber-400 to-orange-500', avatarText: 'text-white' },
    PRINCIPAL: { gradient: 'from-[#1b3a2a] via-[#1e4d37] to-[#215c42]', badge: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30', avatar: 'from-emerald-400 to-teal-500', avatarText: 'text-white' },
    ADMIN: { gradient: 'from-[#2d1b69] via-[#3730a3] to-[#4f46e5]', badge: 'bg-purple-300/20 text-purple-200 border-purple-300/30', avatar: 'from-purple-400 to-indigo-500', avatarText: 'text-white' },
};

export default function ProfessionalProfile({ user }) {
    const { updateUser } = useAuth();
    const { profile, loading: pLoading, updateProfile, refetch } = useProfile(user?.id);
    const [form, setForm] = useState({ name: '', phone: '', bio: '', qualifications: '', experience: '', designation: '', joiningDate: '', address: '' });
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [photoUploading, setPhotoUploading] = useState(false);
    const [photoUrl, setPhotoUrl] = useState(null);

    // Documents
    const [documents, setDocuments] = useState([]);
    const [docsLoading, setDocsLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(null);

    const fileRef = useRef();
    const photoRef = useRef();

    // Change Password
    const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
    const [pwSaving, setPwSaving] = useState(false);
    const [pwMsg, setPwMsg] = useState('');
    const [showPw, setShowPw] = useState(false);

    // Email Change with OTP
    const [editEmail, setEditEmail] = useState('');
    const [emailOtp, setEmailOtp] = useState('');
    const [emailChangeStep, setEmailChangeStep] = useState(null); // null | 'otp-sent' | 'verifying' | 'success'
    const [emailChangeMsg, setEmailChangeMsg] = useState('');
    const [emailChangeSaving, setEmailChangeSaving] = useState(false);
    const pendingEmailRef = useRef(''); // survives re-renders from profile refetch

    // Performance Data
    const [perfForm, setPerfForm] = useState({
        academicYear: '2025-2026',
        trainingsCompleted: 0,
        trainingDetails: '',
        totalStudents: 0,
        passedStudents: 0,
        committeesParticipated: 0,
        eventsOrganized: 0,
        studentsMentored: 0,
        adminResponsibilityNotes: '',
    });
    const [perfSaving, setPerfSaving] = useState(false);
    const [perfMsg, setPerfMsg] = useState('');
    const [perfRecords, setPerfRecords] = useState([]);

    // Accordion State
    const [openSection, setOpenSection] = useState({
        personal: true,
        performance: false,
        password: false,
        documents: false
    });

    const toggleSection = (key) => {
        setOpenSection(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const style = ROLE_STYLES[user?.role] || ROLE_STYLES.TEACHER;

    useEffect(() => {
        if (profile) {
            setForm({
                name: profile.fullName || profile.full_name || '',
                phone: profile.phone || '',
                bio: profile.bio || '',
                qualifications: profile.qualifications || '',
                experience: profile.experience || '',
                designation: profile.designation || '',
                joiningDate: profile.joiningDate || '',
                address: profile.address || '',
            });
            if (profile.profilePhoto) setPhotoUrl(profile.profilePhoto);
            // Don't overwrite editEmail if an email change OTP flow is active
            if (!emailChangeStep) {
                setEditEmail(profile.email || user?.email || '');
            }
        } else if (user) {
            setForm(f => ({ ...f, name: user.name || user.fullName || '' }));
            if (!emailChangeStep) {
                setEditEmail(user?.email || '');
            }
        }
    }, [profile, user]);

    // Fetch documents
    useEffect(() => {
        if (!user?.id) return;
        setDocsLoading(true);
        apiFetch('/documents')
            .then(d => setDocuments(Array.isArray(d) ? d : []))
            .catch(console.error)
            .finally(() => setDocsLoading(false));
    }, [user?.id]);

    // Fetch performance data
    useEffect(() => {
    (async () => {
        try {
            const data = await api.get(`/profiles/${user?.id}/performance`);

            if (Array.isArray(data)) {
                setPerfRecords(data);

                if (data.length > 0) {
                    const latest = data[0];
                    setPerfForm(f => ({ ...f, ...latest }));
                }
            }
        } catch (err) {
            console.error('Performance fetch error:', err);
        }
    })();
}, [user?.id]);

    // Sync perfForm when academicYear changes
    useEffect(() => {
        const match = perfRecords.find(r => r.academicYear === perfForm.academicYear);
        if (match) {
            setPerfForm(f => ({ ...f, ...match }));
        } else {
            // Reset to defaults for a new year (while keeping the selected year)
            setPerfForm({
                academicYear: perfForm.academicYear,
                trainingsCompleted: 0,
                trainingDetails: '',
                totalStudents: 0,
                passedStudents: 0,
                committeesParticipated: 0,
                eventsOrganized: 0,
                studentsMentored: 0,
                adminResponsibilityNotes: '',
            });
        }
    }, [perfForm.academicYear, perfRecords]);

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleSave = async () => {
        setSaving(true);
        setSaveMsg('');
        try {
            // Capture the new email BEFORE updateProfile triggers a refetch
            const currentEmail = (user?.email || '').toLowerCase().trim();
            const newEmail = (editEmail || '').toLowerCase().trim();
            const emailChanged = newEmail && newEmail !== currentEmail;

            // Save the pending email in a ref so it survives re-renders
            if (emailChanged) {
                pendingEmailRef.current = newEmail;
            }

            await updateProfile({
                fullName: form.name,
                phone: form.phone,
                bio: form.bio,
                qualifications: form.qualifications,
                experience: form.experience,
                designation: form.designation,
                joiningDate: form.joiningDate,
                address: form.address,
            });

            // Check if email was changed — trigger OTP flow
            if (emailChanged) {
                setEmailChangeSaving(true);
                setEmailChangeMsg('');
                try {
                    await api.post('/auth/request-email-change', { newEmail: pendingEmailRef.current });
                    setEmailChangeStep('otp-sent');
                    setEditEmail(pendingEmailRef.current); // ensure state matches ref
                    setEmailChangeMsg('OTP sent to your new email address');
                } catch (err) {
                    setEmailChangeMsg('error:' + (err.message || 'Failed to send OTP'));
                    setEditEmail(currentEmail); // revert
                    pendingEmailRef.current = '';
                } finally {
                    setEmailChangeSaving(false);
                }
            }

            setSaveMsg('saved');
            setIsEditing(false);
            setTimeout(() => setSaveMsg(''), 3000);
        } catch (err) {
            setSaveMsg('error:' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleVerifyEmailOtp = async () => {
        if (!emailOtp || emailOtp.length !== 6) {
            setEmailChangeMsg('error:Please enter a valid 6-digit OTP');
            return;
        }
        setEmailChangeSaving(true);
        setEmailChangeMsg('');
        setEmailChangeStep('verifying');
        // Use the ref value which is guaranteed to match the OTP store key
        const emailToVerify = pendingEmailRef.current || editEmail.toLowerCase().trim();
        try {
            const result = await api.post('/auth/verify-email-change', {
                newEmail: emailToVerify,
                otp: emailOtp,
            });
            // Update token and user in AuthContext
            if (result.token) {
                localStorage.setItem('token', result.token);
            }
            if (result.user) {
                updateUser(result.user);
            }
            setEmailChangeStep('success');
            setEmailChangeMsg('Email updated successfully!');
            setEmailOtp('');
            await refetch();
            // Auto-close after 2s
            setTimeout(() => {
                setEmailChangeStep(null);
                setEmailChangeMsg('');
            }, 2000);
        } catch (err) {
            setEmailChangeStep('otp-sent');
            setEmailChangeMsg('error:' + (err.message || 'Failed to verify OTP'));
        } finally {
            setEmailChangeSaving(false);
        }
    };

    const handleCancelEmailChange = () => {
        setEmailChangeStep(null);
        setEmailChangeMsg('');
        setEmailOtp('');
        setEditEmail(user?.email || '');
        pendingEmailRef.current = '';
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoUploading(true);
        try {
            const fd = new FormData();
            fd.append('photo', file);
            const BASE = 'http://localhost:3001/api';
            const token = localStorage.getItem('token');
            const res = await fetch(`${BASE}/profiles/photo`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            setPhotoUrl(`http://localhost:3001${data.profilePhoto}`);
            await refetch();
        } catch (err) {
            console.error('Photo upload error:', err);
        } finally {
            setPhotoUploading(false);
            e.target.value = '';
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const doc = await apiFetch('/documents', { method: 'POST', headers: {}, body: fd });
            if (doc?.id) setDocuments(prev => [doc, ...prev]);
        } catch (err) { console.error('Upload error:', err); }
        finally { setUploading(false); e.target.value = ''; }
    };

    const handleDelete = async (doc) => {
        if (!window.confirm(`Delete "${doc.name}"?`)) return;
        setDeleting(doc.id);
        try {
            await apiFetch(`/documents/${doc.id}`, { method: 'DELETE' });
            setDocuments(prev => prev.filter(d => d.id !== doc.id));
        } catch (err) { console.error(err); }
        finally { setDeleting(null); }
    };

    const handleDownload = (doc) => {
        const url = doc.url?.startsWith('http') ? doc.url : `http://localhost:3001${doc.url}`;
        const a = document.createElement('a');
        a.href = url; a.download = doc.name || 'document'; a.target = '_blank';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    const initials = (form.name || user?.email || 'U')
        .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const dept = profile?.department;

    if (pLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="About Me" subtitle="Your professional profile and documents">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* ── Hero Banner ── */}
                <div className={`relative bg-gradient-to-r ${style.gradient} rounded-2xl overflow-hidden`}>
                    {/* Decorative circles */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute top-0 right-0 w-72 h-72 bg-white rounded-full -translate-y-1/2 translate-x-1/3" />
                        <div className="absolute bottom-0 left-16 w-48 h-48 bg-yellow-400 rounded-full translate-y-1/2" />
                    </div>

                    <div className="relative p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        {/* Avatar with photo upload */}
                        <div className="relative flex-shrink-0 group">
                            <div className="w-28 h-28 rounded-2xl ring-4 ring-white/20 overflow-hidden shadow-xl">
                                {photoUrl ? (
                                    <img src={photoUrl} alt={form.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className={`w-full h-full bg-gradient-to-br ${style.avatar} flex items-center justify-center ${style.avatarText} font-black text-3xl`}>
                                        {initials}
                                    </div>
                                )}
                            </div>
                            {/* Photo upload overlay */}
                            <button
                                onClick={() => photoRef.current?.click()}
                                disabled={photoUploading}
                                className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                            >
                                {photoUploading
                                    ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                                    : <Camera className="w-6 h-6 text-white" />
                                }
                            </button>
                            <input ref={photoRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-black text-white leading-tight">
                                {form.name || 'Your Name'}
                            </h1>
                            <p className="text-blue-200 text-sm mt-0.5">{form.designation || `${user?.role?.charAt(0) + user?.role?.slice(1).toLowerCase() || 'Faculty'}`}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-3">
                                <span className={`px-3 py-1 text-xs font-bold rounded-full border uppercase tracking-wide ${style.badge}`}>
                                    {user?.role?.toLowerCase() || 'member'}
                                </span>
                                {dept && (
                                    <span className="flex items-center gap-1.5 text-xs text-blue-200">
                                        <Building2 className="w-3.5 h-3.5" />
                                        {dept.name || dept.shortId || 'Department'}
                                    </span>
                                )}
                                {user?.email && (
                                    <span className="flex items-center gap-1.5 text-xs text-blue-200">
                                        <Mail className="w-3.5 h-3.5" /> {user.email}
                                    </span>
                                )}
                                {form.phone && (
                                    <span className="flex items-center gap-1.5 text-xs text-blue-200">
                                        <Phone className="w-3.5 h-3.5" /> {form.phone}
                                    </span>
                                )}
                            </div>
                            {form.bio && (
                                <span className="flex items-center gap-1.5 text-xs text-blue-200 m-5">
                                    {form.bio || ''}
                                </span>
                            )}
                        </div>

                        {/* Edit button */}
                        <button
                            onClick={() => {
                                setIsEditing(!isEditing);
                                if (!openSection.personal) toggleSection('personal');
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex-shrink-0 ${isEditing ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white text-gray-800 hover:bg-gray-100'
                                }`}
                        >
                            <Edit3 className="w-4 h-4" />
                            {isEditing ? 'Cancel' : 'Edit Profile'}
                        </button>
                    </div>

                    {/* Stats bar */}
                    <div className="relative border-t border-white/10 px-8 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: 'Qualification', value: form.qualifications || '—', icon: Award },
                            { label: 'Experience', value: form.experience || '—', icon: Briefcase },
                            { label: 'Joined', value: form.joiningDate || '—', icon: Calendar },
                            { label: 'Location', value: form.address || '—', icon: MapPin },
                        ].map(({ label, value, icon: Icon }) => (
                            <div key={label} className="text-center">
                                <Icon className="w-4 h-4 text-blue-300 mx-auto mb-1" />
                                <p className="text-white font-semibold text-xs truncate">{value}</p>
                                <p className="text-blue-300 text-[10px] uppercase tracking-wider">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Profile Form ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div onClick={() => toggleSection('personal')} className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 cursor-pointer select-none">
                        <User className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-base font-bold text-gray-900">Personal Information</h2>
                        
                        <div className="ml-auto flex items-center gap-4">
                            {saveMsg === 'saved' && (
                                <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                                    <CheckCircle2 className="w-4 h-4" /> Saved successfully
                                </span>
                            )}
                            {saveMsg?.startsWith('error:') && (
                                <span className="text-red-500 text-sm font-medium">{saveMsg.replace('error:', '')}</span>
                            )}
                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openSection.personal ? 'rotate-180' : ''}`} />
                        </div>
                    </div>

                    {openSection.personal && (
                        <div className="p-6">
                            {!isEditing && !form.name && !form.designation && (
                                <div className="mb-5 flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-700">
                                    <Edit3 className="w-4 h-4 flex-shrink-0" />
                                    <span>Click <strong>Edit Profile</strong> above to fill in your details and save them to your profile.</span>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className={lbl}>Full Name</label>
                                    <input value={form.name} onChange={e => set('name', e.target.value)}
                                        className={inp} placeholder="Your full name" disabled={!isEditing} />
                                </div>
                                <div>
                                    <label className={lbl}>Email Address</label>
                                    {isEditing ? (
                                        <div className="relative">
                                            <input value={editEmail} onChange={e => setEditEmail(e.target.value)}
                                                className={inp} placeholder="your@email.com" />
                                            {editEmail.toLowerCase().trim() !== (user?.email || '').toLowerCase().trim() && editEmail && (
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-600 font-medium">OTP required</span>
                                            )}
                                        </div>
                                    ) : (
                                        <input value={user?.email || ''} readOnly
                                            className={`${inp} bg-gray-50 cursor-not-allowed text-gray-400`} />
                                    )}
                                </div>
                                <div>
                                    <label className={lbl}>Phone Number</label>
                                    <input value={form.phone} onChange={e => set('phone', e.target.value)}
                                        className={inp} placeholder="+91 XXXXXXXXXX" disabled={!isEditing} />
                                </div>
                                <div>
                                    <label className={lbl}>Designation</label>
                                    <input value={form.designation} onChange={e => set('designation', e.target.value)}
                                        className={inp} placeholder="e.g. Assistant Professor" disabled={!isEditing} />
                                </div>
                                <div>
                                    <label className={lbl}>Qualifications</label>
                                    <input value={form.qualifications} onChange={e => set('qualifications', e.target.value)}
                                        className={inp} placeholder="e.g. M.Tech, Ph.D in CSE" disabled={!isEditing} />
                                </div>
                                <div>
                                    <label className={lbl}>Experience</label>
                                    <input value={form.experience} onChange={e => set('experience', e.target.value)}
                                        className={inp} placeholder="e.g. 8 years" disabled={!isEditing} />
                                </div>
                                <div>
                                    <label className={lbl}>Date of Joining</label>
                                    <input value={form.joiningDate} onChange={e => set('joiningDate', e.target.value)}
                                        className={inp} placeholder="e.g. 01 Aug 2017" disabled={!isEditing} />
                                </div>
                                <div>
                                    <label className={lbl}>Address / City</label>
                                    <input value={form.address} onChange={e => set('address', e.target.value)}
                                        className={inp} placeholder="City, State" disabled={!isEditing} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={lbl}>Bio / About Me</label>
                                    <textarea value={form.bio} onChange={e => set('bio', e.target.value)}
                                        rows={3} className={`${inp} resize-none`}
                                        placeholder="Brief description about yourself, research interests, areas of expertise…"
                                        disabled={!isEditing} />
                                </div>
                            </div>

                            {isEditing && (
                                <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100">
                                    <button onClick={handleSave} disabled={saving}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {saving ? 'Saving…' : 'Save Changes'}
                                    </button>
                                    <button onClick={() => setIsEditing(false)}
                                        className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── My Performance Data ── */}
                {user?.role?.toLowerCase() === 'teacher' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div onClick={() => toggleSection('performance')} className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 cursor-pointer select-none">
                        <BarChart3 className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-base font-bold text-gray-900">My Performance Data</h2>
                        
                        <div className="ml-auto flex items-center gap-4">
                            {perfMsg && (
                                <span className={`text-sm font-medium ${perfMsg.includes('Failed') ? 'text-red-500' : 'text-emerald-600'}`}>
                                    {perfMsg}
                                </span>
                            )}
                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openSection.performance ? 'rotate-180' : ''}`} />
                        </div>
                    </div>

                    {openSection.performance && (
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className={lbl}>Academic Year</label>
                                    <select
                                        value={perfForm.academicYear}
                                        onChange={e => setPerfForm(f => ({ ...f, academicYear: e.target.value }))}
                                        className={inp}
                                    >
                                        <option value="2024-2025">2024-2025</option>
                                        <option value="2025-2026">2025-2026</option>
                                        <option value="2026-2027">2026-2027</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={lbl}>Trainings Completed</label>
                                    <input
                                        type="number"
                                        value={perfForm.trainingsCompleted}
                                        onChange={e => setPerfForm(f => ({ ...f, trainingsCompleted: parseInt(e.target.value) || 0 }))}
                                        className={inp}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className={lbl}>Training Details</label>
                                    <textarea
                                        value={perfForm.trainingDetails}
                                        onChange={e => setPerfForm(f => ({ ...f, trainingDetails: e.target.value }))}
                                        rows={2}
                                        className={`${inp} resize-none`}
                                    />
                                </div>

                                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
                                    <label className={lbl}>Total Enrollments</label>
                                    <div className="text-xl font-bold text-gray-900">{perfForm.totalStudents || 0}</div>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">Students assigned</p>
                                </div>

                                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
                                    <label className={lbl}>Appeared for Exam</label>
                                    <div className="text-xl font-bold text-indigo-600">{perfForm.appearedStudents || 0}</div>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">Students with marks</p>
                                </div>

                                <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100 flex flex-col justify-center">
                                    <label className={lbl}>Students Passed</label>
                                    <div className="text-xl font-bold text-emerald-600">{perfForm.passedStudents || 0}</div>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">Marks &ge; 40</p>
                                </div>

                                <div className="bg-red-50/30 p-4 rounded-xl border border-red-100 flex flex-col justify-center">
                                    <label className={lbl}>Students Failed</label>
                                    <div className="text-xl font-bold text-red-600">{perfForm.failedStudents || 0}</div>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">Marks &lt; 40</p>
                                </div>

                                {perfForm.appearedStudents > 0 && (
                                    <div className="md:col-span-2 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50 flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className={lbl}>Examination Pass Rate (on Appearances)</p>
                                            <p className="text-3xl font-black text-indigo-600">
                                                {((perfForm.passedStudents / perfForm.appearedStudents) * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                        <div className="w-1/2 ml-4">
                                            <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest">
                                                <span>Success Ratio</span>
                                                <span>{perfForm.passedStudents}/{perfForm.appearedStudents}</span>
                                            </div>
                                            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(79,70,229,0.3)]" 
                                                    style={{ width: `${Math.min(100, (perfForm.passedStudents / perfForm.appearedStudents) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className={lbl}>Committees Participated</label>
                                    <input
                                        type="number"
                                        value={perfForm.committeesParticipated}
                                        onChange={e => setPerfForm(f => ({ ...f, committeesParticipated: parseInt(e.target.value) || 0 }))}
                                        className={inp}
                                    />
                                </div>

                                <div>
                                    <label className={lbl}>Events Organized</label>
                                    <input
                                        type="number"
                                        value={perfForm.eventsOrganized}
                                        onChange={e => setPerfForm(f => ({ ...f, eventsOrganized: parseInt(e.target.value) || 0 }))}
                                        className={inp}
                                    />
                                </div>

                                <div>
                                    <label className={lbl}>Students Mentored</label>
                                    <input
                                        type="number"
                                        value={perfForm.studentsMentored}
                                        onChange={e => setPerfForm(f => ({ ...f, studentsMentored: parseInt(e.target.value) || 0 }))}
                                        className={inp}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className={lbl}>Admin Responsibility Notes</label>
                                    <textarea
                                        value={perfForm.adminResponsibilityNotes}
                                        onChange={e => setPerfForm(f => ({ ...f, adminResponsibilityNotes: e.target.value }))}
                                        rows={2}
                                        className={`${inp} resize-none`}
                                    />
                                </div>

                            </div>

                            <div className="mt-6 pt-5 border-t border-gray-100">
                                <button
                                    disabled={perfSaving}
                                    onClick={async () => {
                                        setPerfSaving(true);
                                        setPerfMsg('');
                                        try {
                                            const updated = await api.put('/profiles/my-performance', perfForm);
                                            setPerfRecords(prev => {
                                                const filtered = prev.filter(r => r.academicYear !== updated.academicYear);
                                                return [updated, ...filtered].sort((a,b) => b.academicYear.localeCompare(a.academicYear));
                                            });
                                            setPerfMsg('Performance data saved!');
                                            setTimeout(() => setPerfMsg(''), 3000);
                                        } catch (err) {
                                            setPerfMsg('Failed: ' + err.message);
                                        } finally {
                                            setPerfSaving(false);
                                        }
                                    }}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                >
                                    {perfSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {perfSaving ? 'Saving…' : 'Save Performance Data'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                )}

                {/* ── Change Password ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div onClick={() => toggleSection('password')} className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 cursor-pointer select-none">
                        <KeyRound className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-base font-bold text-gray-900">Change Password</h2>
                        
                        <div className="ml-auto flex items-center gap-4">
                            {pwMsg === 'saved' && <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium"><CheckCircle2 className="w-4 h-4" /> Password updated</span>}
                            {pwMsg?.startsWith('error:') && <span className="text-red-500 text-sm font-medium">{pwMsg.replace('error:', '')}</span>}
                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openSection.password ? 'rotate-180' : ''}`} />
                        </div>
                    </div>
                    
                    {openSection.password && (
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <label className={lbl}>Current Password</label>
                                    <div className="relative">
                                        <input value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                                            type={showPw ? 'text' : 'password'} className={inp} placeholder="Current password" />
                                        <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className={lbl}>New Password</label>
                                    <input value={pwForm.new} onChange={e => setPwForm(f => ({ ...f, new: e.target.value }))}
                                        type="password" className={inp} placeholder="Min 6 characters" />
                                </div>
                                <div>
                                    <label className={lbl}>Confirm New Password</label>
                                    <input value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                                        type="password" className={inp} placeholder="Repeat new password" />
                                </div>
                            </div>
                            <div className="mt-5 pt-4 border-t border-gray-100">
                                <button
                                    onClick={async () => {
                                        if (!pwForm.current || !pwForm.new) { setPwMsg('error:All fields are required'); return; }
                                        if (pwForm.new !== pwForm.confirm) { setPwMsg('error:Passwords do not match'); return; }
                                        if (pwForm.new.length < 6) { setPwMsg('error:Password must be at least 6 characters'); return; }
                                        setPwSaving(true); setPwMsg('');
                                        try {
                                            await api.post('/profiles/update-password', { 
                                                currentPassword: pwForm.current, 
                                                newPassword: pwForm.new 
                                            });
                                            setPwMsg('saved');
                                            setPwForm({ current: '', new: '', confirm: '' });
                                            setTimeout(() => setPwMsg(''), 3000);
                                        } catch (err) {
                                            setPwMsg('error:' + (err.message || 'Failed to update password'));
                                        } finally { setPwSaving(false); }
                                    }}
                                    disabled={pwSaving}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">
                                    {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {pwSaving ? 'Updating…' : 'Update Password'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Documents ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div onClick={() => toggleSection('documents')} className="px-6 py-4 border-b border-gray-100 flex items-center justify-between cursor-pointer select-none">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-base font-bold text-gray-900">Documents & Certificates</h2>
                            <span className="ml-1 text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-lg">{documents.length}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* stopPropagation prevents the accordion from toggling when the user clicks upload */}
                            <div onClick={(e) => e.stopPropagation()}>
                                <input ref={fileRef} type="file" className="hidden" onChange={handleUpload}
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png" />
                                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors">
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    {uploading ? 'Uploading…' : 'Upload File'}
                                </button>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openSection.documents ? 'rotate-180' : ''}`} />
                        </div>
                    </div>

                    {openSection.documents && (
                        <div className="p-6">
                            {docsLoading ? (
                                <div className="py-8 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Loading documents…
                                </div>
                            ) : !documents?.length ? (
                                <div className="py-12 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                        <FolderOpen className="w-8 h-8 text-gray-200" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-400">No documents uploaded yet</p>
                                    <p className="text-xs text-gray-300 mt-1">Upload certificates, CVs, research papers etc.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {documents.map(doc => (
                                        <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group">
                                            <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <FileText className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 truncate">{doc.name}</p>
                                                <p className="text-xs text-gray-400">{fmtDate(doc.createdAt)}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleDownload(doc)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(doc)} disabled={deleting === doc.id}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50">
                                                    {deleting === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Email Change OTP Modal ── */}
            {emailChangeStep && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                {emailChangeStep === 'success'
                                    ? <CheckCircle2 className="w-5 h-5 text-white" />
                                    : <ShieldCheck className="w-5 h-5 text-white" />
                                }
                            </div>
                            <div className="flex-1">
                                <h3 className="text-white font-bold text-lg">
                                    {emailChangeStep === 'success' ? 'Email Updated!' : 'Verify New Email'}
                                </h3>
                                <p className="text-blue-100 text-xs mt-0.5">
                                    {emailChangeStep === 'success'
                                        ? 'Your email has been changed successfully'
                                        : `OTP sent to ${editEmail}`
                                    }
                                </p>
                            </div>
                            {emailChangeStep !== 'success' && (
                                <button onClick={handleCancelEmailChange} className="text-white/70 hover:text-white transition">
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {emailChangeStep === 'success' ? (
                                <div className="text-center py-4">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <p className="text-gray-800 font-semibold">Email changed to</p>
                                    <p className="text-indigo-600 font-bold text-lg mt-1">{editEmail}</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-gray-600 text-sm mb-4">
                                        Enter the 6-digit OTP sent to <strong className="text-gray-900">{editEmail}</strong> to verify ownership of this email address.
                                    </p>

                                    {/* OTP Input */}
                                    <div className="mb-4">
                                        <label className={lbl}>Verification Code</label>
                                        <input
                                            value={emailOtp}
                                            onChange={e => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className={`${inp} text-center text-2xl font-bold tracking-[0.5em] !py-3`}
                                            placeholder="000000"
                                            maxLength={6}
                                            autoFocus
                                        />
                                    </div>

                                    {/* Error/Info message */}
                                    {emailChangeMsg && (
                                        <div className={`p-3 rounded-lg text-sm font-medium mb-4 ${
                                            emailChangeMsg.startsWith('error:')
                                                ? 'bg-red-50 text-red-700 border border-red-100'
                                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                                        }`}>
                                            {emailChangeMsg.replace('error:', '')}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleVerifyEmailOtp}
                                            disabled={emailChangeSaving || emailOtp.length !== 6}
                                            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                                        >
                                            {emailChangeSaving
                                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
                                                : <><ShieldCheck className="w-4 h-4" /> Verify & Update Email</>
                                            }
                                        </button>
                                        <button
                                            onClick={handleCancelEmailChange}
                                            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>

                                    {/* Resend link */}
                                    <p className="text-center text-xs text-gray-400 mt-4">
                                        Didn't receive the OTP?{' '}
                                        <button
                                            onClick={async () => {
                                                setEmailChangeSaving(true);
                                                setEmailChangeMsg('');
                                                try {
                                                    await api.post('/auth/request-email-change', { newEmail: editEmail.toLowerCase().trim() });
                                                    setEmailChangeMsg('New OTP sent to your email');
                                                } catch (err) {
                                                    setEmailChangeMsg('error:' + (err.message || 'Failed to resend'));
                                                } finally {
                                                    setEmailChangeSaving(false);
                                                }
                                            }}
                                            disabled={emailChangeSaving}
                                            className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors disabled:opacity-50"
                                        >
                                            Resend OTP
                                        </button>
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}