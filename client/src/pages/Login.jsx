import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import {
    GraduationCap, Eye, EyeOff, User, Users,
    KeyRound, ArrowRight, Mail, Lock,
    ChevronLeft, Building2, CheckCircle2, Shield
} from 'lucide-react';

/* ─────────────────────────────────────────────────────
   Roles
───────────────────────────────────────────────────── */
const ROLES = [
    { value: 'TEACHER', label: 'Teacher', icon: User,  desc: 'Manage students & reports' },
    { value: 'HOD',     label: 'HOD',     icon: Users, desc: 'Oversee your department'   },
];

/* ─────────────────────────────────────────────────────
   CSS
───────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.lp { display: flex; min-height: 100vh; font-family: 'DM Sans', sans-serif; }

/* ── Left panel ── */
.lp-left {
    display: none;
    flex-direction: column;
    justify-content: center;
    width: 50%;
    padding: 60px 64px;
    position: relative;
    overflow: hidden;
    background: linear-gradient(150deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
}
@media (min-width: 1024px) { .lp-left { display: flex; } }

.lp-left::before {
    content: '';
    position: absolute; inset: 0;
    background-image: radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px);
    background-size: 30px 30px;
    pointer-events: none;
}

/* orbs */
@keyframes lp-orb {
    0%,100% { transform: translate(0,0) scale(1); }
    40%      { transform: translate(18px,-16px) scale(1.06); }
    70%      { transform: translate(-12px,10px) scale(0.95); }
}
.lp-orb {
    position: absolute; border-radius: 50%; pointer-events: none;
}
.lp-orb-1 { width:380px; height:380px; top:-100px; right:-100px;
    background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%);
    animation: lp-orb 14s ease-in-out infinite; }
.lp-orb-2 { width:240px; height:240px; bottom:40px; left:-60px;
    background: radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 65%);
    animation: lp-orb 10s ease-in-out infinite reverse; }
.lp-orb-3 { width:180px; height:180px; top:42%; left:38%;
    background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 65%);
    animation: lp-orb 18s ease-in-out infinite 5s; }

/* shimmer line */
@keyframes lp-sweep { from { background-position:-300px 0; } to { background-position:300px 0; } }
.lp-shine {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
    background-size: 300px 100%;
    animation: lp-sweep 3s linear infinite;
}

/* left content stagger */
@keyframes lp-up {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
}
.lp-lc > * { opacity:0; animation: lp-up 0.55s cubic-bezier(0.34,1.1,0.64,1) both; }
.lp-lc > *:nth-child(1) { animation-delay:.08s; }
.lp-lc > *:nth-child(2) { animation-delay:.16s; }
.lp-lc > *:nth-child(3) { animation-delay:.24s; }
.lp-lc > *:nth-child(4) { animation-delay:.32s; }
.lp-lc > *:nth-child(5) { animation-delay:.40s; }

/* ── Right panel ── */
.lp-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
    background: #f8fafc;
    position: relative;
    overflow: hidden;
}
.lp-right::before {
    content:''; position:absolute; top:-180px; right:-180px;
    width:420px; height:420px; border-radius:50%;
    background: radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 65%);
    pointer-events:none;
}
.lp-right::after {
    content:''; position:absolute; bottom:-140px; left:-140px;
    width:340px; height:340px; border-radius:50%;
    background: radial-gradient(circle, rgba(15,23,42,0.04) 0%, transparent 65%);
    pointer-events:none;
}

/* ── Card ── */
@keyframes lp-card-in {
    from { opacity:0; transform:translateY(18px) scale(0.97); }
    to   { opacity:1; transform:translateY(0)    scale(1);    }
}
.lp-card {
    position: relative; z-index: 2;
    width: 100%; max-width: 430px;
    background: #ffffff;
    border-radius: 24px;
    border: 1px solid rgba(15,23,42,0.07);
    box-shadow: 0 2px 8px rgba(0,0,0,0.04), 0 16px 48px rgba(15,23,42,0.07);
    padding: 38px 38px 34px;
    animation: lp-card-in 0.5s cubic-bezier(0.34,1.1,0.64,1) both;
}
@media (max-width: 480px) { .lp-card { padding: 28px 22px 24px; border-radius: 20px; } }

/* ── Input ── */
.lp-field { display:flex; flex-direction:column; gap:5px; }
.lp-label { font-size:13px; font-weight:600; color:#374151; letter-spacing:0.1px; }
.lp-input-wrap { position:relative; }
.lp-icon {
    position:absolute; left:13px; top:50%; transform:translateY(-50%);
    width:15px; height:15px; color:#9ca3af;
    pointer-events:none; transition:color 0.18s;
}
.lp-input-wrap:focus-within .lp-icon { color:#1e293b; }
.lp-input {
    width:100%; padding:11px 14px 11px 40px;
    border:1.5px solid #e5e7eb; border-radius:12px;
    font-family:'DM Sans',sans-serif; font-size:14px; font-weight:400;
    color:#111827; background:#fff; outline:none;
    transition: border-color 0.2s, box-shadow 0.2s;
}
.lp-input::placeholder { color:#9ca3af; }
.lp-input:focus { border-color:#334155; box-shadow: 0 0 0 3px rgba(51,65,85,0.1); }
.lp-input-pad-r { padding-right: 42px; }
.lp-eye {
    position:absolute; right:12px; top:50%; transform:translateY(-50%);
    background:none; border:none; cursor:pointer; color:#9ca3af;
    display:flex; align-items:center; justify-content:center;
    padding:2px; transition:color 0.15s;
}
.lp-eye:hover { color:#374151; }

/* Select */
.lp-select {
    width:100%; padding:11px 14px 11px 40px;
    border:1.5px solid #e5e7eb; border-radius:12px;
    font-family:'DM Sans',sans-serif; font-size:14px; font-weight:400;
    color:#111827; background:#fff; outline:none;
    transition: border-color 0.2s, box-shadow 0.2s;
    appearance: none; cursor:pointer;
}
.lp-select:focus { border-color:#334155; box-shadow: 0 0 0 3px rgba(51,65,85,0.1); }

/* ── Role cards ── */
.lp-role-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.lp-role-card {
    padding:14px 12px; border-radius:12px;
    border:1.5px solid #e5e7eb; background:#fff;
    cursor:pointer; text-align:left;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}
.lp-role-card:hover { border-color:#94a3b8; background:#f8fafc; }
.lp-role-card.active { border-color:#0f172a; background:#f8fafc; box-shadow: 0 0 0 3px rgba(15,23,42,0.07); }

/* ── Primary button ── */
.lp-btn {
    width:100%; padding:13px 20px;
    border-radius:12px; border:none; cursor:pointer;
    font-family:'DM Sans',sans-serif; font-size:14.5px; font-weight:700;
    color:#fff; letter-spacing:0.1px;
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    box-shadow: 0 4px 14px rgba(15,23,42,0.25);
    display:flex; align-items:center; justify-content:center; gap:8px;
    transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
}
.lp-btn:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(15,23,42,0.3); }
.lp-btn:active { transform:translateY(0); }
.lp-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none; }

/* ── Ghost button ── */
.lp-btn-ghost {
    background:none; border:none; cursor:pointer;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500;
    color:#6b7280; padding:0; transition:color 0.15s;
}
.lp-btn-ghost:hover { color:#111827; }

/* ── Link button ── */
.lp-link {
    background:none; border:none; cursor:pointer;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600;
    color:#1e293b; text-decoration:underline; text-underline-offset:3px;
    transition:color 0.15s;
}
.lp-link:hover { color:#0f172a; }

/* ── Alerts ── */
.lp-error {
    padding:11px 14px; border-radius:10px;
    background:#fef2f2; border:1px solid #fecaca;
    color:#b91c1c; font-size:13px; font-weight:500; line-height:1.5;
}
.lp-success {
    padding:11px 14px; border-radius:10px;
    background:#f0fdf4; border:1px solid #bbf7d0;
    color:#15803d; font-size:13px; font-weight:500; line-height:1.5;
}

/* ── Divider ── */
.lp-hr {
    display:flex; align-items:center; gap:12px; margin:4px 0;
    color:#d1d5db; font-size:12px; font-weight:500;
}
.lp-hr::before, .lp-hr::after {
    content:''; flex:1; height:1px; background:#f1f5f9;
}

/* ── Spinner ── */
.lp-spin {
    width:16px; height:16px; border-radius:50%;
    border:2px solid rgba(255,255,255,0.3); border-top-color:#fff;
    animation: lp-spinner 0.7s linear infinite; flex-shrink:0;
}
@keyframes lp-spinner { to { transform:rotate(360deg); } }

/* ── OTP input ── */
.lp-otp {
    width:100%; padding:14px;
    border:1.5px solid #e5e7eb; border-radius:12px;
    font-family:'DM Sans',sans-serif; font-size:26px; font-weight:800;
    color:#111827; text-align:center; letter-spacing:0.4em;
    outline:none; transition:border-color 0.2s, box-shadow 0.2s;
}
.lp-otp:focus { border-color:#334155; box-shadow:0 0 0 3px rgba(51,65,85,0.1); }
.lp-otp::placeholder { font-size:14px; letter-spacing:normal; font-weight:400; color:#d1d5db; }

/* Feature list */
.lp-feature {
    display:flex; align-items:flex-start; gap:12px;
    padding:12px 0;
}
.lp-feature-icon {
    width:34px; height:34px; border-radius:10px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
}
`;

/* ─────────────────────────────────────────────────────
   Shared Input component
───────────────────────────────────────────────────── */
function Field({ label, icon: Icon, children }) {
    return (
        <div className="lp-field">
            {label && <label className="lp-label">{label}</label>}
            <div className="lp-input-wrap">
                {Icon && <Icon className="lp-icon"/>}
                {children}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────
   Login Page
───────────────────────────────────────────────────── */
export default function Login() {
    const { login, signUp, isAuthenticated, user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [isSignUp,     setIsSignUp]     = useState(false);
    const [role,         setRole]         = useState('TEACHER');
    const [email,        setEmail]        = useState('');
    const [password,     setPassword]     = useState('');
    const [fullName,     setFullName]     = useState('');
    const [deptId,       setDeptId]       = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [departments,  setDepartments]  = useState([]);
    const [error,        setError]        = useState('');
    const [success,      setSuccess]      = useState('');
    const [loading,      setLoading]      = useState(false);

    // Forgot password: 'none' | 'email' | 'otp' | 'newpass'
    const [forgotStep, setForgotStep] = useState('none');
    const [fpEmail,    setFpEmail]    = useState('');
    const [fpOtp,      setFpOtp]      = useState('');
    const [fpNew,      setFpNew]      = useState('');
    const [fpConfirm,  setFpConfirm]  = useState('');
    const [showFpNew,  setShowFpNew]  = useState(false);

    useEffect(() => {
        if (!authLoading && isAuthenticated && user?.role) navigate(`/${user.role}`);
    }, [isAuthenticated, user, authLoading, navigate]);

    useEffect(() => {
        api.get('/auth/departments')
            .then(d => setDepartments(d))
            .catch(err => console.error('Failed to load departments:', err));
    }, []);

    /* ── Submit ── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);
        try {
            if (isSignUp) {
                if (!fullName.trim())                                                   { setError('Enter your full name'); return; }
                if (password.length < 6)                                                { setError('Password must be at least 6 characters'); return; }
                if ((role === 'TEACHER' || role === 'HOD') && !deptId)                 { setError('Select a department'); return; }
                const res = await signUp(email, password, fullName, role, deptId || undefined);
                if (res.success) {
                    if (!res.autoSignedIn) {
                        setSuccess(res.needsConfirmation
                            ? '✅ Account created! Check your email and click the confirmation link, then sign in.'
                            : 'Account created! Please sign in.');
                        setIsSignUp(false);
                    }
                } else {
                    setError(res.error || 'Failed to create account');
                }
            } else {
                const res = await login(email, password);
                if (!res.success) setError(res.error || 'Invalid credentials');
            }
        } finally {
            setLoading(false);
        }
    };

    /* ── Forgot password ── */
    const handleFpSendOtp = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email: fpEmail });
            setSuccess('OTP sent to your email. Check your inbox.');
            setForgotStep('otp');
        } catch (err) { setError(err.message || 'Failed to send OTP'); }
        finally       { setLoading(false); }
    };

    const handleFpVerifyOtp = (e) => {
        e.preventDefault();
        if (fpOtp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
        setForgotStep('newpass'); setError('');
    };

    const handleFpReset = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        if (fpNew !== fpConfirm)  { setError('Passwords do not match'); setLoading(false); return; }
        if (fpNew.length < 6)     { setError('Password must be at least 6 characters'); setLoading(false); return; }
        try {
            await api.post('/auth/reset-password', { email: fpEmail, otp: fpOtp, newPassword: fpNew });
            setSuccess('✅ Password reset! Please sign in with your new password.');
            cancelFp();
        } catch (err) { setError(err.message || 'Failed to reset password'); }
        finally       { setLoading(false); }
    };

    const cancelFp = () => {
        setForgotStep('none'); setError(''); setSuccess('');
        setFpEmail(''); setFpOtp(''); setFpNew(''); setFpConfirm('');
    };

    const switchForm = () => { setIsSignUp(v => !v); setError(''); setSuccess(''); };

    /* ── Loading screen ── */
    if (authLoading) return (
        <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc' }}>
            <div className="lp-spin" style={{ width:36, height:36, borderColor:'rgba(15,23,42,0.15)', borderTopColor:'#1e293b', borderWidth:3 }}/>
        </div>
    );

    return (
        <>
            <style>{CSS}</style>
            <div className="lp">

                {/* ══════════════════════════════════
                    LEFT PANEL
                ══════════════════════════════════ */}
                <div className="lp-left">
                    <div className="lp-orb lp-orb-1"/>
                    <div className="lp-orb lp-orb-2"/>
                    <div className="lp-orb lp-orb-3"/>

                    <div className="lp-lc" style={{ position:'relative', zIndex:2 }}>
                        {/* Logo */}
                        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:48 }}>
                            <div style={{
                                width:50, height:50, borderRadius:14, flexShrink:0,
                                background:'rgba(255,255,255,0.12)',
                                border:'1px solid rgba(255,255,255,0.2)',
                                display:'flex', alignItems:'center', justifyContent:'center',
                            }}>
                                <GraduationCap style={{ width:24, height:24, color:'#fff' }}/>
                            </div>
                            <div>
                                <p style={{ fontFamily:"'DM Sans'", fontSize:22, fontWeight:800, color:'#fff', lineHeight:1.1, letterSpacing:'-0.3px' }}>
                                    Sankalan
                                </p>
                                <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:500, marginTop:2, letterSpacing:'0.5px' }}>
                                    PORTAL
                                </p>
                            </div>
                        </div>

                        {/* Headline */}
                        <p style={{
                            fontFamily:"'DM Sans'", fontSize:38, fontWeight:800,
                            color:'#fff', lineHeight:1.15, letterSpacing:'-0.8px',
                            marginBottom:14,
                        }}>
                            Streamline your<br/>
                            <span style={{ color:'rgba(255,255,255,0.5)' }}>academic</span> reporting.
                        </p>

                        <p style={{ fontSize:15, color:'rgba(255,255,255,0.55)', lineHeight:1.7, maxWidth:380, marginBottom:36 }}>
                            A unified platform for managing students, faculty, and departmental reports — built for institutions that value clarity.
                        </p>

                        <div className="lp-shine" style={{ marginBottom:36 }}/>

                        {/* Features */}
                        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                            {[
                                { icon:'🎓', label:'Student & attendance management',   sub:'Track every student across departments' },
                                { icon:'📊', label:'Real-time analytics & risk alerts', sub:'Identify at-risk students instantly'    },
                                { icon:'📄', label:'Streamlined report submission',     sub:'HOD to Principal, one seamless flow'   },
                            ].map((f,i) => (
                                <div key={i} className="lp-feature">
                                    <div style={{
                                        width:38, height:38, borderRadius:11, flexShrink:0,
                                        background:'rgba(255,255,255,0.08)',
                                        border:'1px solid rgba(255,255,255,0.12)',
                                        display:'flex', alignItems:'center', justifyContent:'center',
                                        fontSize:18,
                                    }}>
                                        {f.icon}
                                    </div>
                                    <div>
                                        <p style={{ fontSize:13.5, fontWeight:600, color:'rgba(255,255,255,0.9)', lineHeight:1.2 }}>{f.label}</p>
                                        <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{f.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Stats row */}
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginTop:40 }}>
                            {[['500+','Students'],['50+','Faculty'],['4','Roles']].map(([v,l]) => (
                                <div key={l} style={{
                                    padding:'14px 10px', borderRadius:14, textAlign:'center',
                                    background:'rgba(255,255,255,0.07)',
                                    border:'1px solid rgba(255,255,255,0.1)',
                                }}>
                                    <p style={{ fontFamily:"'DM Sans'", fontSize:22, fontWeight:800, color:'#fff', lineHeight:1 }}>{v}</p>
                                    <p style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:4, fontWeight:500 }}>{l}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════
                    RIGHT PANEL
                ══════════════════════════════════ */}
                <div className="lp-right">
                    {/* Mobile logo */}
                    <div style={{
                        display:'none', position:'absolute', top:24, left:24,
                        alignItems:'center', gap:10,
                    }}>
                        <div style={{
                            width:36, height:36, borderRadius:10,
                            background:'#1e293b',
                            display:'flex', alignItems:'center', justifyContent:'center',
                        }}>
                            <GraduationCap style={{ width:18, height:18, color:'#fff' }}/>
                        </div>
                        <span style={{ fontFamily:"'DM Sans'", fontSize:17, fontWeight:800, color:'#111827' }}>Sankalan</span>
                    </div>

                    <div className="lp-card">

                        {/* ══ FORGOT PASSWORD ══ */}
                        {forgotStep !== 'none' ? (
                            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                                {/* Back + title */}
                                <div>
                                    <button className="lp-btn-ghost" onClick={cancelFp}
                                        style={{ display:'flex', alignItems:'center', gap:4, marginBottom:16, fontSize:12 }}>
                                        <ChevronLeft style={{ width:14, height:14 }}/> Back to sign in
                                    </button>
                                    <div style={{
                                        width:44, height:44, borderRadius:12, marginBottom:14,
                                        background:'#f1f5f9',
                                        display:'flex', alignItems:'center', justifyContent:'center',
                                    }}>
                                        <KeyRound style={{ width:20, height:20, color:'#475569' }}/>
                                    </div>
                                    <p style={{ fontFamily:"'DM Sans'", fontSize:22, fontWeight:800, color:'#111827', marginBottom:6 }}>
                                        {forgotStep === 'email'   && 'Forgot Password'}
                                        {forgotStep === 'otp'     && 'Check Your Email'}
                                        {forgotStep === 'newpass' && 'Set New Password'}
                                    </p>
                                    <p style={{ fontSize:13.5, color:'#6b7280', lineHeight:1.6 }}>
                                        {forgotStep === 'email'   && 'Enter your registered email and we\'ll send you a 6-digit OTP.'}
                                        {forgotStep === 'otp'     && `We sent a code to ${fpEmail}. Enter it below.`}
                                        {forgotStep === 'newpass' && 'OTP verified. Choose a strong new password.'}
                                    </p>
                                </div>

                                {/* Alerts */}
                                {error   && <div className="lp-error">{error}</div>}
                                {success && <div className="lp-success">{success}</div>}

                                {/* Step: email */}
                                {forgotStep === 'email' && (
                                    <form onSubmit={handleFpSendOtp} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                                        <Field label="Email address" icon={Mail}>
                                            <input className="lp-input" type="email" required
                                                value={fpEmail} onChange={e=>setFpEmail(e.target.value)}
                                                placeholder="your@institute.edu"/>
                                        </Field>
                                        <button className="lp-btn" type="submit" disabled={loading}>
                                            {loading && <span className="lp-spin"/>}
                                            Send OTP <ArrowRight style={{ width:15, height:15 }}/>
                                        </button>
                                    </form>
                                )}

                                {/* Step: otp */}
                                {forgotStep === 'otp' && (
                                    <form onSubmit={handleFpVerifyOtp} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                                        <div className="lp-field">
                                            <label className="lp-label">6-digit OTP</label>
                                            <input className="lp-otp" type="text" inputMode="numeric"
                                                maxLength={6} required
                                                value={fpOtp} onChange={e=>setFpOtp(e.target.value.replace(/\D/g,''))}
                                                placeholder="••••••"/>
                                        </div>
                                        <button className="lp-btn" type="submit">
                                            Verify OTP <ArrowRight style={{ width:15, height:15 }}/>
                                        </button>
                                        <div style={{ textAlign:'center' }}>
                                            <button type="button" className="lp-btn-ghost" disabled={loading}
                                                onClick={handleFpSendOtp}>
                                                Didn't receive it? Resend OTP
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Step: new password */}
                                {forgotStep === 'newpass' && (
                                    <form onSubmit={handleFpReset} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                                        <Field label="New password" icon={Lock}>
                                            <input className={`lp-input lp-input-pad-r`}
                                                type={showFpNew ? 'text' : 'password'} required minLength={6}
                                                value={fpNew} onChange={e=>setFpNew(e.target.value)}
                                                placeholder="Min 6 characters"/>
                                            <button type="button" className="lp-eye" onClick={()=>setShowFpNew(v=>!v)}>
                                                {showFpNew ? <EyeOff style={{width:15,height:15}}/> : <Eye style={{width:15,height:15}}/>}
                                            </button>
                                        </Field>
                                        <Field label="Confirm password" icon={Lock}>
                                            <input className="lp-input" type="password" required
                                                value={fpConfirm} onChange={e=>setFpConfirm(e.target.value)}
                                                placeholder="Repeat new password"/>
                                        </Field>
                                        <button className="lp-btn" type="submit" disabled={loading}>
                                            {loading && <span className="lp-spin"/>}
                                            Reset Password
                                        </button>
                                    </form>
                                )}
                            </div>

                        ) : (
                        /* ══ LOGIN / SIGNUP ══ */
                            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                                {/* Header */}
                                <div>
                                    <p style={{ fontFamily:"'DM Sans'", fontSize:24, fontWeight:800, color:'#111827', marginBottom:5, letterSpacing:'-0.3px' }}>
                                        {isSignUp ? 'Create an account' : 'Welcome back'}
                                    </p>
                                    <p style={{ fontSize:13.5, color:'#6b7280' }}>
                                        {isSignUp ? 'Register to access the Sankalan portal' : 'Sign in to continue to your dashboard'}
                                    </p>
                                </div>

                                {/* Alerts */}
                                {error   && <div className="lp-error">{error}</div>}
                                {success && <div className="lp-success">{success}</div>}

                                {/* Role picker — signup only */}
                                {isSignUp && (
                                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                                        <label className="lp-label">Select your role</label>
                                        <div className="lp-role-grid">
                                            {ROLES.map(r => {
                                                const Icon = r.icon;
                                                const active = role === r.value;
                                                return (
                                                    <button key={r.value} type="button"
                                                        className={`lp-role-card${active ? ' active' : ''}`}
                                                        onClick={() => setRole(r.value)}>
                                                        <div style={{
                                                            width:28, height:28, borderRadius:8, marginBottom:8,
                                                            background: active ? '#1e293b' : '#f1f5f9',
                                                            display:'flex', alignItems:'center', justifyContent:'center',
                                                        }}>
                                                            <Icon style={{ width:14, height:14, color: active ? '#fff' : '#6b7280' }}/>
                                                        </div>
                                                        <p style={{ fontSize:13, fontWeight:700, color: active ? '#111827' : '#374151', lineHeight:1.2, marginBottom:2 }}>
                                                            {r.label}
                                                        </p>
                                                        <p style={{ fontSize:11, color:'#9ca3af', lineHeight:1.4 }}>{r.desc}</p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Form */}
                                <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                                    {isSignUp && (
                                        <Field label="Full name" icon={Shield}>
                                            <input className="lp-input" type="text" required
                                                value={fullName} onChange={e=>setFullName(e.target.value)}
                                                placeholder="Your full name"/>
                                        </Field>
                                    )}

                                    <Field label="Email address" icon={Mail}>
                                        <input className="lp-input" type="email" required
                                            value={email} onChange={e=>setEmail(e.target.value)}
                                            placeholder="you@institute.edu"/>
                                    </Field>

                                    <div className="lp-field">
                                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                                            <label className="lp-label">Password</label>
                                            {!isSignUp && (
                                                <button type="button" className="lp-btn-ghost" style={{ fontSize:12 }}
                                                    onClick={()=>{ setForgotStep('email'); setError(''); setSuccess(''); }}>
                                                    Forgot password?
                                                </button>
                                            )}
                                        </div>
                                        <div className="lp-input-wrap">
                                            <Lock className="lp-icon"/>
                                            <input className={`lp-input lp-input-pad-r`}
                                                type={showPassword ? 'text' : 'password'} required
                                                value={password} onChange={e=>setPassword(e.target.value)}
                                                placeholder={isSignUp ? 'Min 6 characters' : 'Your password'}/>
                                            <button type="button" className="lp-eye"
                                                onClick={()=>setShowPassword(v=>!v)}>
                                                {showPassword ? <EyeOff style={{width:15,height:15}}/> : <Eye style={{width:15,height:15}}/>}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Department */}
                                    {isSignUp && (role === 'TEACHER' || role === 'HOD') && (
                                        <Field label="Department" icon={Building2}>
                                            <select className="lp-select" value={deptId} onChange={e=>setDeptId(e.target.value)}>
                                                <option value="">Select department…</option>
                                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                            </select>
                                        </Field>
                                    )}

                                    <button className="lp-btn" type="submit" disabled={loading} style={{ marginTop:4 }}>
                                        {loading && <span className="lp-spin"/>}
                                        {isSignUp ? 'Create Account' : 'Sign In'}
                                        {!loading && <ArrowRight style={{ width:15, height:15 }}/>}
                                    </button>
                                </form>

                                {/* Switch mode */}
                                <div style={{ textAlign:'center', paddingTop:4 }}>
                                    <span style={{ fontSize:13, color:'#9ca3af' }}>
                                        {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                                    </span>
                                    <button className="lp-link" onClick={switchForm}>
                                        {isSignUp ? 'Sign in' : 'Sign up'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}