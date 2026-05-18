import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../lib/api.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import {
    BookOpen, Plus, Pencil, Trash2, X, Search, ArrowLeft,
    Users, Info, Upload, CheckCircle, XCircle, AlertTriangle,
    GraduationCap, ChevronDown, Eye, FileText, Layers,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/* ─────────────────────────────────────────────────────
   HOD amber tokens — inline styles only, no injected CSS
───────────────────────────────────────────────────── */
const A = '#b45309';      // accent
const AD = '#78350f';     // accent dark
const AS = 'rgba(180,83,9,0.09)';   // accent soft
const AM = 'rgba(180,83,9,0.16)';   // accent mid
const AG = 'rgba(180,83,9,0.22)';   // accent glow
const AL = '#fef3c7';     // accent light
const BG  = '#fdfaf5';    // page bg
const SF  = '#ffffff';    // surface
const SH  = '#fdf5e8';    // surface hover
const BD  = 'rgba(180,83,9,0.1)';   // border
const BDM = 'rgba(180,83,9,0.22)';  // border mid
const INK  = '#1c150a';
const INKM = '#4a3a1a';
const INKL = '#a08060';
const INKF = '#e8dcc8';

/* ── Shared button helpers (always visible, no CSS class dependency) ── */
const PrimaryBtn = ({ children, onClick, disabled, type = 'button', style = {} }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px 20px', borderRadius: 12, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700,
            color: '#fff',
            background: disabled ? '#c4a882' : HERO_GRAD,
            boxShadow: disabled ? 'none' : `0 4px 14px ${AG}`,
            transition: 'all 0.18s',
            opacity: disabled ? 0.65 : 1,
            ...style,
        }}
        onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(180,83,9,0.45)`; e.currentTarget.style.filter = 'brightness(1.08)'; } }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = disabled ? 'none' : `0 4px 14px ${AG}`; e.currentTarget.style.filter = 'none'; }}
    >
        {children}
    </button>
);

const OutlineBtn = ({ children, onClick, disabled, style = {} }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px 20px', borderRadius: 12, cursor: disabled ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600,
            color: INKM, background: SF,
            border: `1.5px solid ${INKF}`,
            transition: 'all 0.18s',
            opacity: disabled ? 0.6 : 1,
            ...style,
        }}
        onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = SH; e.currentTarget.style.borderColor = INKL; } }}
        onMouseLeave={e => { e.currentTarget.style.background = SF; e.currentTarget.style.borderColor = INKF; }}
    >
        {children}
    </button>
);

const DangerBtn = ({ children, onClick, disabled, style = {} }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px 20px', borderRadius: 12, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700,
            color: '#fff', background: disabled ? '#fca5a5' : '#ef4444',
            boxShadow: '0 4px 14px rgba(239,68,68,0.28)',
            transition: 'all 0.18s',
            opacity: disabled ? 0.65 : 1,
            ...style,
        }}
        onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = '#dc2626'; }}
        onMouseLeave={e => { e.currentTarget.style.background = disabled ? '#fca5a5' : '#ef4444'; }}
    >
        {children}
    </button>
);

const GhostBtn = ({ children, onClick, style = {} }) => (
    <button
        type="button"
        onClick={onClick}
        style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
            color: INKL, padding: 0, transition: 'color 0.15s',
            ...style,
        }}
        onMouseEnter={e => e.currentTarget.style.color = INK}
        onMouseLeave={e => e.currentTarget.style.color = INKL}
    >
        {children}
    </button>
);

/* ── Small icon button ── */
const IconBtn = ({ icon: Icon, onClick, color = INKL, hoverColor = A, hoverBg = AS, style = {} }) => (
    <button
        type="button"
        onClick={onClick}
        style={{
            width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'transparent', color,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s', flexShrink: 0,
            ...style,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = hoverColor; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = color; }}
    >
        <Icon style={{ width: 13, height: 13 }} />
    </button>
);

/* ── Spinner ── */
const Spinner = ({ size = 16 }) => (
    <span style={{
        display: 'inline-block', width: size, height: size, borderRadius: '50%',
        border: `2px solid ${AL}`, borderTopColor: A,
        animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }}/>
);

/* ── Input ── */
const Input = ({ icon: Icon, value, onChange, placeholder, type = 'text', autoFocus, maxLength, style = {} }) => (
    <div style={{ position: 'relative' }}>
        {Icon && <Icon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: INKL, pointerEvents: 'none' }}/>}
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            autoFocus={autoFocus}
            maxLength={maxLength}
            style={{
                width: '100%',
                padding: Icon ? '11px 14px 11px 38px' : '11px 14px',
                border: `1.5px solid ${INKF}`,
                borderRadius: 12,
                fontFamily: 'inherit', fontSize: 13.5, fontWeight: 400,
                color: INK, background: SF, outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                ...style,
            }}
            onFocus={e => { e.target.style.borderColor = A; e.target.style.boxShadow = `0 0 0 3px ${AS}`; }}
            onBlur={e => { e.target.style.borderColor = INKF; e.target.style.boxShadow = 'none'; }}
        />
    </div>
);

/* ── Select ── */
const Select = ({ value, onChange, children, style = {} }) => (
    <select
        value={value}
        onChange={onChange}
        style={{
            width: '100%', padding: '11px 14px',
            border: `1.5px solid ${INKF}`, borderRadius: 12,
            fontFamily: 'inherit', fontSize: 13.5, fontWeight: 400,
            color: INK, background: SF, outline: 'none',
            appearance: 'none', cursor: 'pointer',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            ...style,
        }}
        onFocus={e => { e.target.style.borderColor = A; e.target.style.boxShadow = `0 0 0 3px ${AS}`; }}
        onBlur={e => { e.target.style.borderColor = INKF; e.target.style.boxShadow = 'none'; }}
    >
        {children}
    </select>
);

/* ── Label ── */
const Label = ({ children }) => (
    <span style={{ fontSize: 12, fontWeight: 700, color: INKM, display: 'block', marginBottom: 6 }}>
        {children}
    </span>
);

/* ── Overlay backdrop ── */
const Backdrop = ({ children, zIndex = 50 }) => (
    <div style={{
        position: 'fixed', inset: 0, zIndex,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(28,21,10,0.52)', backdropFilter: 'blur(4px)', padding: 16,
    }}>
        {children}
    </div>
);

/* ── Modal shell ── */
const ModalShell = ({ children, maxWidth = 420, style = {} }) => (
    <div style={{
        background: SF, borderRadius: 22,
        boxShadow: '0 24px 80px rgba(0,0,0,0.16)',
        width: '100%', maxWidth,
        fontFamily: "'DM Sans', sans-serif",
        ...style,
    }}>
        {children}
    </div>
);

/* ── Modal header ── */
const ModalHeader = ({ title, subtitle, onClose }) => (
    <div style={{
        padding: '18px 24px',
        borderBottom: `1px solid ${INKF}`,
        background: AS,
        borderRadius: '22px 22px 0 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
        <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: INK }}>{title}</p>
            {subtitle && <p style={{ fontSize: 11.5, color: INKL, marginTop: 2 }}>{subtitle}</p>}
        </div>
        <IconBtn icon={X} onClick={onClose} color={INKL} hoverColor={INK} hoverBg={AM}/>
    </div>
);

/* ── Badge ── */
const Badge = ({ children, type = 'amber', style = {} }) => {
    const styles = {
        amber:  { background: AS, color: A },
        violet: { background: 'rgba(109,40,217,0.09)', color: '#6d28d9' },
        green:  { background: 'rgba(5,150,105,0.09)',  color: '#065f46' },
        gray:   { background: INKF, color: INKM },
    };
    const s = styles[type] || styles.amber;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '3px 9px', borderRadius: 99,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.2px',
            ...s, ...style,
        }}>
            {children}
        </span>
    );
};

/* ─────────────────────────────────────────────────────
   Toast
───────────────────────────────────────────────────── */
const TOAST_CFG = {
    success: { icon: CheckCircle, bg: 'rgba(5,150,105,0.08)', border: 'rgba(5,150,105,0.2)', text: '#065f46' },
    error:   { icon: XCircle,    bg: 'rgba(220,38,38,0.08)',  border: 'rgba(220,38,38,0.2)',  text: '#991b1b' },
    warning: { icon: AlertTriangle, bg: AS, border: BDM,     text: AD },
    info:    { icon: Info,       bg: 'rgba(37,99,235,0.08)',  border: 'rgba(37,99,235,0.2)',  text: '#1e40af' },
};

function Toast({ toast, onClose }) {
    if (!toast) return null;
    const cfg = TOAST_CFG[toast.type] || TOAST_CFG.info;
    const Icon = cfg.icon;
    return (
        <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 200,
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '14px 18px', borderRadius: 16,
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            maxWidth: 340, fontFamily: "'DM Sans', sans-serif",
            animation: 'fadeUp 0.3s ease',
        }}>
            <Icon style={{ width: 17, height: 17, color: cfg.text, flexShrink: 0, marginTop: 1 }}/>
            <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: cfg.text }}>{toast.title}</p>
                {toast.message && <p style={{ fontSize: 12, color: cfg.text, opacity: 0.75, marginTop: 2 }}>{toast.message}</p>}
            </div>
            <IconBtn icon={X} onClick={onClose} color={cfg.text} hoverColor={cfg.text} hoverBg="rgba(0,0,0,0.06)"/>
        </div>
    );
}

/* ─────────────────────────────────────────────────────
   Confirm Modal
───────────────────────────────────────────────────── */
function ConfirmModal({ title, message, onConfirm, onCancel, loading, danger }) {
    return (
        <Backdrop zIndex={150}>
            <ModalShell maxWidth={380}>
                <div style={{ padding: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                            background: danger ? 'rgba(239,68,68,0.1)' : AS,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {danger
                                ? <Trash2 style={{ width: 18, height: 18, color: '#ef4444' }}/>
                                : <AlertTriangle style={{ width: 18, height: 18, color: A }}/>
                            }
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 800, color: INK, flex: 1 }}>{title}</p>
                        <IconBtn icon={X} onClick={onCancel} color={INKL} hoverColor={INK} hoverBg={AS}/>
                    </div>
                    <p style={{ fontSize: 13.5, color: INKM, lineHeight: 1.65, marginBottom: 22 }}>{message}</p>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <OutlineBtn onClick={onCancel} style={{ flex: 1 }}>Cancel</OutlineBtn>
                        {danger
                            ? <DangerBtn onClick={onConfirm} disabled={loading} style={{ flex: 1 }}>
                                {loading && <Spinner size={14}/>}
                                {loading ? 'Deleting…' : 'Delete'}
                              </DangerBtn>
                            : <PrimaryBtn onClick={onConfirm} disabled={loading} style={{ flex: 1 }}>
                                {loading && <Spinner size={14}/>}
                                {loading ? 'Processing…' : 'Confirm'}
                              </PrimaryBtn>
                        }
                    </div>
                </div>
            </ModalShell>
        </Backdrop>
    );
}

/* ─────────────────────────────────────────────────────
   Enrollment Preview
───────────────────────────────────────────────────── */
function EnrollmentPreview({ offeringId }) {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/subjects/offerings/${offeringId}/students`)
            .then(d => setStudents(d || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [offeringId]);

    if (loading) return (
        <div style={{ display: 'flex', gap: 5 }}>
            {[1,2,3].map(i => <div key={i} style={{ width: 28, height: 28, borderRadius: 8, background: AL }}/>)}
        </div>
    );
    if (!students.length) return (
        <p style={{ fontSize: 11, color: INKL, fontStyle: 'italic' }}>No students enrolled yet.</p>
    );
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {students.slice(0, 8).map(s => (
                <div key={s.id} title={s.fullName} style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: AS, border: `1px solid ${BD}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10.5, fontWeight: 800, color: A, cursor: 'help',
                }}>
                    {s.fullName[0].toUpperCase()}
                </div>
            ))}
            {students.length > 8 && (
                <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: SH, border: `1px dashed ${INKF}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9.5, fontWeight: 700, color: INKL,
                }}>
                    +{students.length - 8}
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────
   Enrollment Modal
───────────────────────────────────────────────────── */
function EnrollmentModal({ offering, onClose, showToast }) {
    const [enrolled, setEnrolled] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searching, setSearching] = useState(false);

    const fetchEnrolled = useCallback(async () => {
        setLoading(true);
        try {
            const [enrolledData, suggestedData] = await Promise.all([
                api.get(`/subjects/offerings/${offering.id}/students`),
                api.get(`/subjects/offerings/${offering.id}/enroll-preview?year=${offering.year}`)
            ]);
            setEnrolled(enrolledData || []);
            setSuggestions(suggestedData || []);
        } catch (err) { showToast('error', 'Error', err.message); }
        finally { setLoading(false); }
    }, [offering.id, offering.year, showToast]);

    useEffect(() => { fetchEnrolled(); }, [fetchEnrolled]);

    useEffect(() => {
        if (!search || search.length < 2) { setAllStudents([]); return; }
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const students = await api.get('/students');
                const q = search.toLowerCase();
                setAllStudents(students.filter(s => {
                    const matchesDept = s.departmentId === offering.subject?.departmentId;
                    const matchesYearSem = s.enrollments?.some(e =>
                        Number(e.year) === Number(offering.year) &&
                        Number(e.semester) === Number(offering.semester)
                    );
                    return matchesDept && matchesYearSem &&
                        ((s.fullName || '').toLowerCase().includes(q) || (s.studentId || '').toLowerCase().includes(q));
                }).slice(0, 10));
            } catch (err) { console.error(err); }
            finally { setSearching(false); }
        }, 300);
        return () => clearTimeout(timer);
    }, [search, offering]);

    const handleEnroll = async (student) => {
        try {
            await api.post(`/subjects/offerings/${offering.id}/enroll`, { studentId: student.id });
            showToast('success', 'Enrolled', `${student.fullName} added.`);
            setSearch(''); setAllStudents([]);
            fetchEnrolled();
        } catch (err) { showToast('error', 'Failed', err.message); }
    };

    const handleUnenroll = async (studentId) => {
        if (!window.confirm('Remove student from this section?')) return;
        try {
            await api.delete(`/subjects/offerings/${offering.id}/unenroll/${studentId}`);
            showToast('success', 'Removed', 'Student removed.');
            fetchEnrolled();
        } catch (err) { showToast('error', 'Error', err.message); }
    };

    return (
        <Backdrop zIndex={160}>
            <ModalShell maxWidth={620} style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                <ModalHeader
                    title="Manage Students"
                    subtitle={`${offering.year}Y · ${offering.semester}S · Sec ${offering.section}`}
                    onClose={onClose}
                />
                <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 22 }}>
                    {/* Search */}
                    <div>
                        <p style={{ fontSize: 10.5, fontWeight: 700, color: INKL, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Enroll New Student</p>
                        <div style={{ position: 'relative' }}>
                            <Input icon={Search} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or student ID…"/>
                            {searching && <Spinner size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}/>}
                        </div>
                        {allStudents.length > 0 && (
                            <div style={{
                                marginTop: 6, background: SF, border: `1.5px solid ${BDM}`,
                                borderRadius: 14, overflow: 'hidden',
                                boxShadow: `0 8px 28px ${AM}`,
                            }}>
                                <div style={{ padding: '7px 14px', background: AS, borderBottom: `1px solid ${BD}` }}>
                                    <p style={{ fontSize: 10, fontWeight: 700, color: A, textTransform: 'uppercase', letterSpacing: '1px' }}>Search Results</p>
                                </div>
                                {allStudents.map((s, i) => (
                                    <button key={s.id} type="button" onClick={() => handleEnroll(s)} style={{
                                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '11px 16px', border: 'none', cursor: 'pointer',
                                        background: SF, borderBottom: i < allStudents.length - 1 ? `1px solid ${INKF}` : 'none',
                                        fontFamily: 'inherit', transition: 'background 0.15s', textAlign: 'left',
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = SH}
                                        onMouseLeave={e => e.currentTarget.style.background = SF}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 10, background: AS, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: A }}>
                                                {s.fullName[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 13, fontWeight: 600, color: INK }}>{s.fullName}</p>
                                                <p style={{ fontSize: 10.5, color: INKL, fontFamily: 'monospace' }}>{s.studentId}</p>
                                            </div>
                                        </div>
                                        <Plus style={{ width: 15, height: 15, color: A }}/>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Suggestions */}
                    {!search && suggestions.length > 0 && (
                        <div style={{ background: AS, borderRadius: 16, padding: 16, border: `1px solid ${BD}` }}>
                            <p style={{ fontSize: 10.5, fontWeight: 700, color: A, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>Suggested — Year {offering.year}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                {suggestions.map(s => (
                                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: SF, borderRadius: 12, border: `1px solid ${BD}` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 9, background: AM, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                                                {(s.fullName?.[0] || '?').toUpperCase()}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <p style={{ fontSize: 12.5, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.fullName}</p>
                                                <p style={{ fontSize: 10, color: INKL, fontFamily: 'monospace' }}>{s.studentId}</p>
                                            </div>
                                        </div>
                                        <PrimaryBtn onClick={() => handleEnroll(s)} style={{ padding: '5px 10px', fontSize: 12, borderRadius: 8 }}>
                                            <Plus style={{ width: 12, height: 12 }}/>
                                        </PrimaryBtn>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Enrolled list */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <p style={{ fontSize: 10.5, fontWeight: 700, color: INKL, textTransform: 'uppercase', letterSpacing: '1px' }}>Enrolled Students</p>
                            <Badge>{enrolled.length}</Badge>
                        </div>
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}><Spinner size={24}/></div>
                        ) : enrolled.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px 0', background: BG, borderRadius: 14, border: `1px dashed ${INKF}` }}>
                                <Users style={{ width: 28, height: 28, color: INKF, margin: '0 auto 8px' }}/>
                                <p style={{ fontSize: 13, color: INKL }}>No students enrolled yet.</p>
                            </div>
                        ) : (
                            <div style={{ border: `1px solid ${INKF}`, borderRadius: 14, overflow: 'hidden' }}>
                                {enrolled.map((s, i) => (
                                    <div key={s.id} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '10px 14px',
                                        borderBottom: i < enrolled.length - 1 ? `1px solid ${INKF}` : 'none',
                                        transition: 'background 0.15s',
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = SH}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 30, height: 30, borderRadius: 9, background: AS, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: A }}>
                                                {s.fullName[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 13, fontWeight: 600, color: INK }}>{s.fullName}</p>
                                                <p style={{ fontSize: 10.5, color: INKL, fontFamily: 'monospace' }}>{s.studentId}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Badge>{`Sec ${s.section}`}</Badge>
                                            <button type="button" onClick={() => handleUnenroll(s.id)} style={{
                                                padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                                background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                                                fontSize: 12, fontWeight: 700, fontFamily: 'inherit', transition: 'background 0.15s',
                                            }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.16)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                                            >Remove</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ padding: '16px 24px', borderTop: `1px solid ${INKF}` }}>
                    <OutlineBtn onClick={onClose} style={{ width: '100%' }}>Done</OutlineBtn>
                </div>
            </ModalShell>
        </Backdrop>
    );
}

/* ─────────────────────────────────────────────────────
   Bulk Enroll Modal
───────────────────────────────────────────────────── */
function BulkEnrollModal({ offering, onClose, onConfirm, showToast }) {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);

    useEffect(() => {
        api.get(`/subjects/offerings/${offering.id}/enroll-preview?year=${offering.year}`)
            .then(d => setStudents(d || []))
            .catch(err => showToast('error', 'Preview Failed', err.message))
            .finally(() => setLoading(false));
    }, [offering, showToast]);

    const handleConfirm = async () => {
        setEnrolling(true);
        try {
            const res = await api.post(`/subjects/offerings/${offering.id}/enroll-bulk`, { year: offering.year });
            showToast('success', 'Bulk Enroll Complete', res.message);
            onConfirm();
        } catch (err) { showToast('error', 'Enrollment Failed', err.message); }
        finally { setEnrolling(false); }
    };

    return (
        <Backdrop zIndex={170}>
            <ModalShell maxWidth={500} style={{ display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
                <ModalHeader
                    title="Bulk Enroll Preview"
                    subtitle={`Year ${offering.year} · Sec ${offering.section}`}
                    onClose={onClose}
                />
                <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                    <div style={{ padding: '11px 14px', borderRadius: 12, marginBottom: 18, background: AS, border: `1px solid ${BD}` }}>
                        <p style={{ fontSize: 13.5, color: INKM }}>
                            Found <strong style={{ color: A }}>{students.length}</strong> students in Year {offering.year} not yet enrolled.
                        </p>
                    </div>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}><Spinner size={28}/></div>
                    ) : students.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '32px 0', color: INKL, fontSize: 13 }}>No new students available.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {students.map(s => (
                                <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: BG, borderRadius: 12, border: `1px solid ${INKF}` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 9, background: AS, border: `1px solid ${BD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: A }}>
                                            {(s.fullName?.[0] || '?').toUpperCase()}
                                        </div>
                                        <div>
                                            <p style={{ fontSize: 13, fontWeight: 700, color: INK }}>{s.fullName}</p>
                                            <p style={{ fontSize: 10.5, color: INKL, fontFamily: 'monospace' }}>{s.studentId}</p>
                                        </div>
                                    </div>
                                    <CheckCircle style={{ width: 16, height: 16, color: '#059669', flexShrink: 0 }}/>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div style={{ padding: '16px 24px', borderTop: `1px solid ${INKF}`, display: 'flex', gap: 10 }}>
                    <OutlineBtn onClick={onClose} style={{ flex: 1 }}>Cancel</OutlineBtn>
                    <PrimaryBtn onClick={handleConfirm} disabled={loading || students.length === 0 || enrolling} style={{ flex: 1 }}>
                        {enrolling && <Spinner size={14}/>}
                        {enrolling ? 'Enrolling…' : `Confirm (${students.length})`}
                    </PrimaryBtn>
                </div>
            </ModalShell>
        </Backdrop>
    );
}

/* ─────────────────────────────────────────────────────
   Assign Teacher Modal
───────────────────────────────────────────────────── */
function AssignTeacherModal({ subject, teachers, offering, onClose, onAssigned, showToast }) {
    const [selectedTeacher, setSelectedTeacher] = useState(offering?.teacher?.id || offering?.teacherId || '');
    const [section, setSection] = useState(offering?.section || 'A');
    const [loading, setLoading] = useState(false);

    const handleAssign = async () => {
        if (!selectedTeacher || !section) return;
        setLoading(true);
        try {
            if (offering) {
                await api.put(`/subjects/offerings/${offering.id}`, { teacherId: selectedTeacher, section });
                showToast('success', 'Updated', 'Teacher updated.');
            } else {
                await api.post(`/subjects/${subject.id}/assign-teacher`, { teacherId: selectedTeacher, section });
                showToast('success', 'Assigned', 'Teacher assigned.');
            }
            onAssigned();
        } catch (err) { showToast('error', 'Error', err.message); }
        finally { setLoading(false); }
    };

    return (
        <Backdrop zIndex={180}>
            <ModalShell maxWidth={420}>
                <ModalHeader
                    title={offering ? 'Edit Teacher Assignment' : 'Assign Teacher'}
                    onClose={onClose}
                />
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: AS, border: `1px solid ${BD}` }}>
                        <p style={{ fontSize: 12.5, color: INKM }}>
                            Subject: <strong style={{ color: INK }}>{subject.name}</strong> — Year {subject.year}, Sem {subject.semester}
                        </p>
                    </div>
                    <div>
                        <Label>Teacher *</Label>
                        <Select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}>
                            <option value="">Select Teacher</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName || t.email}</option>)}
                        </Select>
                        {teachers.length === 0 && (
                            <p style={{ fontSize: 11.5, color: A, marginTop: 5 }}>No teachers found in your department.</p>
                        )}
                    </div>
                    <div>
                        <Label>Section *</Label>
                        <Input value={section} onChange={e => setSection(e.target.value.toUpperCase())} placeholder="e.g. A" maxLength={5}/>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                        <OutlineBtn onClick={onClose} style={{ flex: 1 }}>Cancel</OutlineBtn>
                        <PrimaryBtn onClick={handleAssign} disabled={loading || !selectedTeacher || !section} style={{ flex: 1 }}>
                            {loading && <Spinner size={14}/>}
                            {loading ? 'Saving…' : (offering ? 'Save Changes' : 'Assign')}
                        </PrimaryBtn>
                    </div>
                </div>
            </ModalShell>
        </Backdrop>
    );
}

/* ─────────────────────────────────────────────────────
   Type metadata
───────────────────────────────────────────────────── */
/* ── Hero-style gradient (from HOD dashboard hero) ── */
const HERO_GRAD = 'linear-gradient(135deg, rgb(120,53,15) 0%, rgb(180,83,9) 40%, rgb(217,119,6) 75%, rgb(251,191,36) 100%)';
const HERO_GRAD_SM = 'linear-gradient(135deg, rgb(120,53,15) 0%, rgb(180,83,9) 40%, rgb(217,119,6) 75%, rgb(251,191,36) 100%)';

const TYPE_META = {
    THEORY:    { label: 'Theory',    badgeBg: AS, badgeTxt: A },
    PRACTICAL: { label: 'Practical', badgeBg: 'rgba(109,40,217,0.09)', badgeTxt: '#6d28d9' },
};

/* ─────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────── */
export default function HODCourses() {
    const { user } = useAuth();

    const [departmentId,   setDepartmentId]   = useState(null);
    const [departmentName, setDepartmentName] = useState('');
    const [deptLoading,    setDeptLoading]    = useState(true);
    const [subjects,  setSubjects]  = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [search,    setSearch]    = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form,      setForm]      = useState({ name: '', code: '', type: 'THEORY', year: '1', semester: '1' });
    const [saving,    setSaving]    = useState(false);
    const [deleteTarget,  setDeleteTarget]  = useState(null);
    const [deleting,      setDeleting]      = useState(false);
    const [selectedSubject,  setSelectedSubject]  = useState(null);
    const [subjectDetail,    setSubjectDetail]    = useState(null);
    const [detailLoading,    setDetailLoading]    = useState(false);
    const [activeTab,        setActiveTab]        = useState('info');
    const [assignModal,      setAssignModal]      = useState(false);
    const [editOfferingData, setEditOfferingData] = useState(null);
    const [deptTeachers,     setDeptTeachers]     = useState([]);
    const [enrollTarget,     setEnrollTarget]     = useState(null);
    const [bulkTarget,       setBulkTarget]       = useState(null);
    const [delOfferingId,    setDelOfferingId]    = useState(null);
    const [deletingOffering, setDeletingOffering] = useState(false);
    const [uploadingDoc,     setUploadingDoc]     = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = useCallback((type, title, message) => {
        setToast({ type, title, message });
        setTimeout(() => setToast(null), 3500);
    }, []);

    useEffect(() => {
        (async () => {
            setDeptLoading(true);
            try {
                const dept = await api.get('/hod/my-department');
                setDepartmentId(dept.id); setDepartmentName(dept.name);
            } catch { showToast('error', 'Error', 'Could not load your department.'); }
            finally { setDeptLoading(false); }
        })();
    }, [showToast]);

    const fetchSubjects = useCallback(async () => {
        if (!departmentId) return;
        setLoading(true);
        try {
            const all = await api.get('/subjects');
            setSubjects((all || []).filter(s => s.departmentId === departmentId));
        } catch (err) { showToast('error', 'Error', err.message); }
        finally { setLoading(false); }
    }, [departmentId, showToast]);

    useEffect(() => { if (departmentId) fetchSubjects(); }, [departmentId, fetchSubjects]);

    const fetchDetail = useCallback(async (id) => {
        setDetailLoading(true);
        try {
            setSubjectDetail(await api.get(`/subjects/${id}/details`));
        } catch (err) { showToast('error', 'Error', err.message); }
        finally { setDetailLoading(false); }
    }, [showToast]);

    const fetchTeachers = useCallback(async () => {
        try {
            const data = await api.get('/hod/teachers');
            setDeptTeachers((data || []).map(t => ({ id: t.user_id, fullName: t.full_name, email: t.email })));
        } catch { showToast('error', 'Error', 'Could not load teachers.'); }
    }, [showToast]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return subjects.filter(s => s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q));
    }, [subjects, search]);

    const openAdd = () => { setEditingId(null); setForm({ name: '', code: '', type: 'THEORY', year: '1', semester: '1' }); setShowModal(true); };
    const openEdit = (e, s) => {
        e.stopPropagation();
        setEditingId(s.id);
        setForm({ name: s.name, code: s.code || '', type: s.type || 'THEORY', year: String(s.year || 1), semester: String(s.semester || 1) });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            if (editingId) await api.put(`/subjects/${editingId}`, form);
            else await api.post('/subjects', { ...form, departmentId });
            await fetchSubjects();
            if (selectedSubject) fetchDetail(selectedSubject.id);
            setShowModal(false);
            showToast('success', editingId ? 'Updated' : 'Created', `Subject ${editingId ? 'updated' : 'added'}.`);
        } catch (err) { showToast('error', 'Error', err.message); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/subjects/${deleteTarget.id}`);
            await fetchSubjects();
            setDeleteTarget(null);
            if (selectedSubject?.id === deleteTarget.id) { setSelectedSubject(null); setSubjectDetail(null); }
            showToast('success', 'Deleted', 'Subject removed.');
        } catch (err) { showToast('error', 'Error', err.message); }
        finally { setDeleting(false); }
    };

    const handleDeleteOffering = async () => {
        setDeletingOffering(true);
        try {
            await api.delete(`/subjects/offerings/${delOfferingId}`);
            showToast('success', 'Removed', 'Assignment removed.');
            fetchDetail(subjectDetail.id);
            setDelOfferingId(null);
        } catch (err) { showToast('error', 'Error', err.message); }
        finally { setDeletingOffering(false); }
    };

    /* ── Card style helpers ── */
    const cardBase = {
        background: SF, borderRadius: 20,
        border: `1px solid ${BD}`,
        boxShadow: `0 2px 10px ${AS}`,
        padding: 24,
    };

    /* ── Loading screens ── */
    if (deptLoading) return (
        <DashboardLayout title="Courses" subtitle="Loading…">
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                <Spinner size={36}/>
            </div>
        </DashboardLayout>
    );
    if (!departmentId) return (
        <DashboardLayout title="Courses" subtitle="Department not assigned">
            <div style={{ ...cardBase, textAlign: 'center', padding: '64px 24px' }}>
                <BookOpen style={{ width: 40, height: 40, color: INKF, margin: '0 auto 12px' }}/>
                <p style={{ fontSize: 14, color: INKL, fontWeight: 500 }}>No department assigned to your account.</p>
            </div>
        </DashboardLayout>
    );

    /* ═══════════════════════════════════
       DETAIL VIEW
    ═══════════════════════════════════ */
    if (selectedSubject) {
        const meta = TYPE_META[subjectDetail?.type] || TYPE_META.THEORY;
        const totalEnrolled = subjectDetail?.offerings?.reduce((s, o) => s + (o._count?.enrollments || 0), 0) || 0;

        return (
            <DashboardLayout title="Courses" subtitle={`${departmentName} — Detail`}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }`}</style>
                <div style={{ fontFamily: "'DM Sans', sans-serif", animation: 'fadeUp 0.4s ease both' }}>
                    <GhostBtn onClick={() => { setSelectedSubject(null); setSubjectDetail(null); setActiveTab('info'); }} style={{ marginBottom: 20 }}>
                        <ArrowLeft style={{ width: 15, height: 15 }}/> Back to subjects
                    </GhostBtn>

                    {detailLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}><Spinner size={32}/></div>
                    ) : subjectDetail ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* Header */}
                            <div style={cardBase}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{
                                            width: 54, height: 54, borderRadius: 16, flexShrink: 0,
                                            background: HERO_GRAD,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: `0 6px 20px ${AG}`,
                                        }}>
                                            <BookOpen style={{ width: 24, height: 24, color: '#fff' }}/>
                                        </div>
                                        <div>
                                            <h2 style={{ fontSize: 21, fontWeight: 800, color: INK, lineHeight: 1.2, marginBottom: 7 }}>
                                                {subjectDetail.name}
                                            </h2>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {subjectDetail.code && <span style={{ fontSize: 12, color: INKL, fontFamily: 'monospace' }}>{subjectDetail.code}</span>}
                                                <Badge type={subjectDetail.type === 'THEORY' ? 'amber' : 'violet'}>{meta.label}</Badge>
                                                <Badge>{`${subjectDetail.year}Y / ${subjectDetail.semester}S`}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center', padding: '12px 18px', borderRadius: 14, background: AS, border: `1px solid ${BD}` }}>
                                        <p style={{ fontSize: 28, fontWeight: 800, color: A, lineHeight: 1 }}>{totalEnrolled}</p>
                                        <p style={{ fontSize: 10.5, color: INKL, fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.7px' }}>Enrolled</p>
                                    </div>
                                </div>
                                {/* Tabs */}
                                <div style={{ display: 'flex', gap: 24, borderBottom: `1px solid ${INKF}` }}>
                                    {[{ id: 'info', label: 'Info & Materials', icon: Info }, { id: 'students', label: 'Offerings & Students', icon: Users }].map(t => (
                                        <button key={t.id} type="button" onClick={() => setActiveTab(t.id)} style={{
                                            padding: '10px 4px', border: 'none', background: 'none', cursor: 'pointer',
                                            fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600,
                                            color: activeTab === t.id ? A : INKL,
                                            borderBottom: activeTab === t.id ? `2.5px solid ${A}` : '2.5px solid transparent',
                                            display: 'flex', alignItems: 'center', gap: 7,
                                            transition: 'color 0.15s',
                                        }}>
                                            <t.icon style={{ width: 15, height: 15 }}/>{t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tab: Info */}
                            {activeTab === 'info' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20 }}>
                                    <div style={cardBase}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Upload style={{ width: 16, height: 16, color: A }}/>
                                                <p style={{ fontSize: 14, fontWeight: 700, color: INK }}>Study Materials</p>
                                            </div>
                                            <label style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                                padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                                                background: HERO_GRAD,
                                                color: '#fff', fontSize: 12.5, fontWeight: 700,
                                                boxShadow: `0 3px 10px ${AG}`,
                                            }}>
                                                <input type="file" style={{ display: 'none' }} disabled={uploadingDoc}
                                                    onChange={async (e) => {
                                                        const file = e.target.files[0];
                                                        if (!file) return;
                                                        setUploadingDoc(true);
                                                        const fd = new FormData(); fd.append('file', file);
                                                        try {
                                                            await fetch(`${API_BASE}/api/subjects/subject/${subjectDetail.id}/documents`, {
                                                                method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, body: fd,
                                                            });
                                                            showToast('success', 'Uploaded', 'Document added.');
                                                            fetchDetail(subjectDetail.id);
                                                        } catch (err) { showToast('error', 'Upload Failed', err.message); }
                                                        finally { setUploadingDoc(false); }
                                                    }}/>
                                                <Upload style={{ width: 13, height: 13 }}/>
                                                {uploadingDoc ? 'Uploading…' : 'Upload'}
                                            </label>
                                        </div>
                                        {subjectDetail.documents?.length === 0 ? (
                                            <div style={{ padding: '48px 24px', textAlign: 'center', background: BG, borderRadius: 14, border: `1px dashed ${INKF}` }}>
                                                <Upload style={{ width: 32, height: 32, color: INKF, margin: '0 auto 10px' }}/>
                                                <p style={{ fontSize: 13, color: INKL }}>No documents uploaded yet.</p>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {subjectDetail.documents.map(doc => (
                                                    <div key={doc.id} style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        padding: '11px 14px', background: BG, borderRadius: 12,
                                                        border: `1px solid ${INKF}`, transition: 'border-color 0.15s',
                                                    }}
                                                        onMouseEnter={e => e.currentTarget.style.borderColor = BD}
                                                        onMouseLeave={e => e.currentTarget.style.borderColor = INKF}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: AS, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <FileText style={{ width: 16, height: 16, color: A }}/>
                                                            </div>
                                                            <div>
                                                                <p style={{ fontSize: 13, fontWeight: 600, color: INK, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</p>
                                                                <p style={{ fontSize: 10.5, color: INKL, marginTop: 1 }}>{new Date(doc.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 4 }}>
                                                            <a href={`${API_BASE}${doc.url}`} target="_blank" rel="noreferrer"
                                                                style={{ width: 30, height: 30, borderRadius: 8, background: AS, color: A, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                                                                <Eye style={{ width: 13, height: 13 }}/>
                                                            </a>
                                                            <IconBtn icon={Trash2} onClick={async () => {
                                                                if (!window.confirm('Delete document?')) return;
                                                                try { await api.delete(`/subjects/documents/${doc.id}`); showToast('success', 'Deleted', ''); fetchDetail(subjectDetail.id); }
                                                                catch (err) { showToast('error', 'Error', err.message); }
                                                            }} color={INKL} hoverColor="#ef4444" hoverBg="rgba(239,68,68,0.08)"/>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ ...cardBase, alignSelf: 'flex-start' }}>
                                        <p style={{ fontSize: 13.5, fontWeight: 700, color: INK, marginBottom: 14 }}>Quick Stats</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {[
                                                { label: 'Year / Sem', value: `${subjectDetail.year}Y / ${subjectDetail.semester}S` },
                                                { label: 'Offerings',  value: subjectDetail.offerings?.length || 0 },
                                                { label: 'Materials',  value: subjectDetail.documents?.length || 0 },
                                                { label: 'Type',       value: subjectDetail.type },
                                            ].map(stat => (
                                                <div key={stat.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 10, background: AS }}>
                                                    <span style={{ fontSize: 12, color: INKL, fontWeight: 600 }}>{stat.label}</span>
                                                    <span style={{ fontSize: 13, fontWeight: 800, color: A }}>{stat.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab: Offerings */}
                            {activeTab === 'students' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <p style={{ fontSize: 16, fontWeight: 800, color: INK }}>Offerings & Students</p>
                                        <PrimaryBtn onClick={() => { fetchTeachers(); setEditOfferingData(null); setAssignModal(true); }}>
                                            <Plus style={{ width: 14, height: 14 }}/> Assign Teacher
                                        </PrimaryBtn>
                                    </div>
                                    {!subjectDetail.offerings?.length ? (
                                        <div style={{ ...cardBase, textAlign: 'center', padding: '56px 24px' }}>
                                            <Users style={{ width: 36, height: 36, color: INKF, margin: '0 auto 12px' }}/>
                                            <p style={{ fontSize: 14, color: INKL, fontWeight: 500, marginBottom: 4 }}>No active offerings.</p>
                                            <p style={{ fontSize: 12, color: INKF, marginBottom: 16 }}>Assign a teacher to create offerings.</p>
                                            <PrimaryBtn onClick={() => { fetchTeachers(); setEditOfferingData(null); setAssignModal(true); }}>
                                                <Plus style={{ width: 14, height: 14 }}/> Assign Teacher
                                            </PrimaryBtn>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            {subjectDetail.offerings.map(o => (
                                                <div key={o.id} style={{
                                                    background: SF, borderRadius: 18,
                                                    border: `1px solid ${BD}`,
                                                    overflow: 'hidden',
                                                    boxShadow: `0 2px 8px ${AS}`,
                                                    transition: 'box-shadow 0.2s',
                                                }}>
                                                    <div style={{ height: 3, background: HERO_GRAD_SM }}/>
                                                    <div style={{ padding: 20 }}>
                                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                                <div style={{
                                                                    width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                                                                    background: HERO_GRAD,
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    color: '#fff', fontSize: 16, fontWeight: 800,
                                                                    boxShadow: `0 4px 14px ${AG}`,
                                                                }}>
                                                                    {(o.teacher?.profile?.fullName?.[0] || o.teacher?.email?.[0] || '?').toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>{o.teacher?.profile?.fullName || o.teacher?.email}</p>
                                                                    <Badge style={{ marginTop: 4 }}>Sec {o.section}</Badge>
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: 4 }}>
                                                                <IconBtn icon={Pencil} onClick={() => { fetchTeachers(); setEditOfferingData(o); setAssignModal(true); }} color={INKL} hoverColor={A} hoverBg={AS}/>
                                                                <IconBtn icon={Trash2} onClick={() => setDelOfferingId(o.id)} color={INKL} hoverColor="#ef4444" hoverBg="rgba(239,68,68,0.08)"/>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                                                            <PrimaryBtn onClick={() => setEnrollTarget(o)} style={{ fontSize: 12.5, padding: '9px 10px' }}>
                                                                <Users style={{ width: 13, height: 13 }}/> Manage
                                                            </PrimaryBtn>
                                                            <OutlineBtn onClick={() => setBulkTarget(o)} style={{ fontSize: 12.5, padding: '9px 10px' }}>
                                                                <Plus style={{ width: 13, height: 13 }}/> Bulk Enroll
                                                            </OutlineBtn>
                                                        </div>
                                                        <div style={{ paddingTop: 14, borderTop: `1px solid ${INKF}` }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                                                <p style={{ fontSize: 10.5, fontWeight: 700, color: INKL, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Enrolled</p>
                                                                <Badge>{o._count?.enrollments || 0}</Badge>
                                                            </div>
                                                            <EnrollmentPreview offeringId={o.id}/>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : null}

                    {enrollTarget    && <EnrollmentModal offering={enrollTarget} onClose={() => { setEnrollTarget(null); fetchDetail(subjectDetail.id); }} showToast={showToast}/>}
                    {bulkTarget      && <BulkEnrollModal offering={bulkTarget} onClose={() => setBulkTarget(null)} onConfirm={() => { setBulkTarget(null); fetchDetail(subjectDetail.id); }} showToast={showToast}/>}
                    {assignModal     && <AssignTeacherModal subject={subjectDetail} teachers={deptTeachers} offering={editOfferingData} onClose={() => { setAssignModal(false); setEditOfferingData(null); }} onAssigned={() => { setAssignModal(false); setEditOfferingData(null); fetchDetail(subjectDetail.id); }} showToast={showToast}/>}
                    {delOfferingId   && <ConfirmModal title="Remove Assignment" message="Remove this teacher assignment? Enrollments connected to this section will also be removed." onConfirm={handleDeleteOffering} onCancel={() => setDelOfferingId(null)} loading={deletingOffering} danger/>}
                    <Toast toast={toast} onClose={() => setToast(null)}/>
                </div>
            </DashboardLayout>
        );
    }

    /* ═══════════════════════════════════
       CARDS VIEW
    ═══════════════════════════════════ */
    return (
        <DashboardLayout title="Courses" subtitle={`${departmentName} — Subjects, teachers & enrollments`}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }`}</style>
            <div style={{ fontFamily: "'DM Sans', sans-serif", animation: 'fadeUp 0.4s ease both' }}>

                {/* Toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
                    <Input icon={Search} value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search subjects…" style={{ maxWidth: 340 }}/>
                    <PrimaryBtn onClick={openAdd}>
                        <Plus style={{ width: 15, height: 15 }}/> Add Subject
                    </PrimaryBtn>
                </div>

                {/* Stats bar */}
                {!loading && subjects.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
                        {[
                            { label: 'Total',     value: subjects.length,                                clr: A,        bg: AS },
                            { label: 'Theory',    value: subjects.filter(s => s.type === 'THEORY').length,   clr: '#b45309', bg: 'rgba(180,83,9,0.07)' },
                            { label: 'Practical', value: subjects.filter(s => s.type === 'PRACTICAL').length, clr: '#6d28d9', bg: 'rgba(109,40,217,0.07)' },
                        ].map(stat => (
                            <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px', borderRadius: 16, background: stat.bg, border: `1px solid ${INKF}` }}>
                                <p style={{ fontSize: 28, fontWeight: 800, color: stat.clr, lineHeight: 1, fontFamily: 'inherit' }}>{stat.value}</p>
                                <p style={{ fontSize: 12, fontWeight: 700, color: INKM, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Cards grid */}
                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 16 }}>
                        {[1,2,3,4,5,6].map(i => (
                            <div key={i} style={{ height: 110, borderRadius: 18, background: AL, animation: 'pulse 1.5s ease-in-out infinite' }}/>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ ...cardBase, textAlign: 'center', padding: '64px 24px' }}>
                        <BookOpen style={{ width: 36, height: 36, color: INKF, margin: '0 auto 12px' }}/>
                        <p style={{ fontSize: 14, color: INKL, fontWeight: 500 }}>
                            {search ? 'No subjects matched your search.' : 'No subjects added yet.'}
                        </p>
                        {!search && (
                            <GhostBtn onClick={openAdd} style={{ marginTop: 8, color: A }}>Add one →</GhostBtn>
                        )}
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 16 }}>
                            {filtered.map((s, idx) => {
                                const meta = TYPE_META[s.type] || TYPE_META.THEORY;
                                return (
                                    <div key={s.id}
                                        onClick={() => { setSelectedSubject(s); fetchDetail(s.id); setActiveTab('info'); }}
                                        style={{
                                            background: SF, borderRadius: 18, cursor: 'pointer',
                                            border: `1px solid ${BD}`, position: 'relative', overflow: 'hidden',
                                            boxShadow: `0 2px 8px ${AS}`,
                                            transition: 'all 0.2s cubic-bezier(0.34,1.1,0.64,1)',
                                            animation: `fadeUp 0.4s ${idx * 40}ms ease both`,
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${AM}`; e.currentTarget.style.borderColor = BDM; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 2px 8px ${AS}`; e.currentTarget.style.borderColor = BD; }}
                                    >
                                        <div style={{ height: 3, background: HERO_GRAD_SM }}/>
                                        <div style={{ padding: '16px 16px 14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 11 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                        width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                                                        background: HERO_GRAD,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        boxShadow: `0 3px 10px ${AG}`,
                                                    }}>
                                                        <BookOpen style={{ width: 17, height: 17, color: '#fff' }}/>
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <p style={{ fontSize: 13.5, fontWeight: 700, color: INK, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
                                                        {s.code && <p style={{ fontSize: 11, color: INKL, fontFamily: 'monospace', marginTop: 2 }}>{s.code}</p>}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 3, marginLeft: 8, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                                                    <IconBtn icon={Pencil} onClick={e => openEdit(e, s)} color={INKL} hoverColor={A} hoverBg={AS}/>
                                                    <IconBtn icon={Trash2} onClick={e => { e.stopPropagation(); setDeleteTarget(s); }} color={INKL} hoverColor="#ef4444" hoverBg="rgba(239,68,68,0.08)"/>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                <span style={{ padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: meta.badgeBg, color: meta.badgeTxt }}>{meta.label}</span>
                                                <span style={{ padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: AS, color: A }}>{s.year || 1}Y / {s.semester || 1}S</span>
                                                {s._count?.offerings > 0 && (
                                                    <span style={{ fontSize: 11, color: INKL, marginLeft: 'auto', fontWeight: 500 }}>{s._count.offerings} section{s._count.offerings !== 1 ? 's' : ''}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <p style={{ fontSize: 12, color: INKL, marginTop: 14 }}>{filtered.length} subject{filtered.length !== 1 ? 's' : ''}</p>
                    </>
                )}

                {/* Add/Edit Modal */}
                {showModal && (
                    <Backdrop zIndex={150}>
                        <ModalShell maxWidth={440}>
                            <ModalHeader title={editingId ? 'Edit Subject' : 'Add Subject'} onClose={() => setShowModal(false)}/>
                            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div><Label>Subject Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Data Structures" autoFocus/></div>
                                <div><Label>Subject Code</Label><Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. CS201"/></div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div>
                                        <Label>Year *</Label>
                                        <Select value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))}>
                                            {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Semester *</Label>
                                        <Select value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))}>
                                            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    <Label>Type *</Label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {[{ v: 'THEORY', label: '📖 Theory' }, { v: 'PRACTICAL', label: '🔬 Practical' }].map(t => (
                                            <button key={t.v} type="button" onClick={() => setForm(p => ({ ...p, type: t.v }))} style={{
                                                flex: 1, padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                                                fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                                                border: form.type === t.v
                                                    ? `1.5px solid ${t.v === 'THEORY' ? A : '#6d28d9'}`
                                                    : `1.5px solid ${INKF}`,
                                                background: form.type === t.v
                                                    ? (t.v === 'THEORY' ? AS : 'rgba(109,40,217,0.09)')
                                                    : SF,
                                                color: form.type === t.v
                                                    ? (t.v === 'THEORY' ? A : '#6d28d9')
                                                    : INKL,
                                                transition: 'all 0.18s',
                                            }}>{t.label}</button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                    <OutlineBtn onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</OutlineBtn>
                                    <PrimaryBtn onClick={handleSave} disabled={saving || !form.name.trim()} style={{ flex: 1 }}>
                                        {saving && <Spinner size={14}/>}
                                        {saving ? 'Saving…' : (editingId ? 'Update' : 'Add Subject')}
                                    </PrimaryBtn>
                                </div>
                            </div>
                        </ModalShell>
                    </Backdrop>
                )}

                {deleteTarget && (
                    <ConfirmModal title="Delete Subject"
                        message={<>Delete <strong style={{ color: INK }}>{deleteTarget.name}</strong>? This cannot be undone.</>}
                        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} danger/>
                )}
                <Toast toast={toast} onClose={() => setToast(null)}/>
            </div>
        </DashboardLayout>
    );
}