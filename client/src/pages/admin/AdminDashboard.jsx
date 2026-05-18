import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import {
    Users, GraduationCap, FileText, FolderOpen,
    ShieldAlert, TrendingUp, ArrowRight, CheckCircle2,
    Clock, CalendarDays, Trash2, AlertTriangle, X,
    Building2, Activity, BookOpen, Shield, Zap,
    UserCheck, UserX, BarChart3, Layers
} from 'lucide-react';

/* ─────────────────────────────────────────────────────
   Admin violet theme (mirrors Sidebar ROLE_THEMES.admin)
───────────────────────────────────────────────────── */
const A = {
    bg:         '#f8f6fd',
    surface:    '#ffffff',
    surfaceHov: '#f0ecfa',
    border:     'rgba(109,40,217,0.1)',
    borderMid:  'rgba(109,40,217,0.18)',

    accent:     '#6d28d9',
    accentDark: '#3b0764',
    accentSoft: 'rgba(109,40,217,0.08)',
    accentMid:  'rgba(109,40,217,0.15)',
    accentGlow: 'rgba(109,40,217,0.22)',
    accentLt:   '#ede9fe',

    ink:        '#120d1c',
    inkMid:     '#3a2a52',
    inkLight:   '#8878a8',
    inkFaint:   '#ddd8ec',

    gradA:      '#6d28d9',
    gradB:      '#7c3aed',
    gradC:      '#a78bfa',
};

/* Vibrant multi-color chart palette */
const CHART_COLORS = [
    '#6d28d9','#f59e0b','#10b981','#ef4444',
    '#38bdf8','#f97316','#a78bfa','#fb7185',
];

/* ─────────────────────────────────────────────────────
   CSS
───────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');

.ad * { box-sizing: border-box; margin: 0; padding: 0; }
.ad { font-family: 'DM Sans', sans-serif; background: ${A.bg}; min-height: 100vh; color: ${A.ink}; }

/* ── Entrance animations ── */
@keyframes ad-up {
    from { opacity:0; transform:translateY(20px) scale(0.97); }
    to   { opacity:1; transform:translateY(0)    scale(1);   }
}
@keyframes ad-left {
    from { opacity:0; transform:translateX(-14px); }
    to   { opacity:1; transform:translateX(0); }
}
@keyframes ad-scale {
    from { opacity:0; transform:scale(0.9); }
    to   { opacity:1; transform:scale(1); }
}
@keyframes ad-num-pop {
    0%   { transform:scale(0.6) translateY(10px); opacity:0; }
    65%  { transform:scale(1.1) translateY(-2px); opacity:1; }
    100% { transform:scale(1)   translateY(0);    opacity:1; }
}
@keyframes ad-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
}
@keyframes ad-bar-grow {
    from { width: 0; }
    to   { width: var(--w, 100%); }
}
@keyframes ad-float {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(-5px); }
}
@keyframes ad-orb {
    0%,100%{ transform:translate(0,0) scale(1); }
    33%    { transform:translate(18px,-16px) scale(1.06); }
    66%    { transform:translate(-12px,10px) scale(0.96); }
}
@keyframes ad-colon-blink {
    0%,49%  { opacity:1; }
    50%,99% { opacity:0.25; }
}
@keyframes ad-char-in {
    from { opacity:0; transform:translateY(-10px) scaleY(1.3); filter:blur(3px); }
    to   { opacity:1; transform:translateY(0)      scaleY(1);   filter:blur(0); }
}
@keyframes ad-kpi-in {
    from { opacity:0; transform:translateY(16px) scale(0.93); }
    to   { opacity:1; transform:translateY(0)    scale(1); }
}
@keyframes ad-badge-pop {
    0%  { transform: scale(0) rotate(-15deg); }
    65% { transform: scale(1.2) rotate(4deg); }
    100%{ transform: scale(1)   rotate(0); }
}
@keyframes ad-live-pulse {
    0%,100%{ box-shadow: 0 0 0 0 rgba(109,40,217,0.5); }
    50%    { box-shadow: 0 0 0 6px rgba(109,40,217,0); }
}
@keyframes ad-div-sweep {
    from { background-position: -300px 0; }
    to   { background-position:  300px 0; }
}

.ad-hero   { animation: ad-up    0.6s cubic-bezier(0.34,1.2,0.64,1) both; }
.ad-s1     { animation: ad-up    0.5s 0.08s cubic-bezier(0.34,1.1,0.64,1) both; }
.ad-s2     { animation: ad-up    0.5s 0.14s cubic-bezier(0.34,1.1,0.64,1) both; }
.ad-s3     { animation: ad-up    0.5s 0.20s cubic-bezier(0.34,1.1,0.64,1) both; }
.ad-s4     { animation: ad-up    0.5s 0.26s cubic-bezier(0.34,1.1,0.64,1) both; }
.ad-s5     { animation: ad-up    0.5s 0.32s cubic-bezier(0.34,1.1,0.64,1) both; }
.ad-s6     { animation: ad-up    0.5s 0.38s cubic-bezier(0.34,1.1,0.64,1) both; }

.ad-kpi-0  { animation: ad-kpi-in 0.4s 0.55s cubic-bezier(0.34,1.3,0.64,1) both; }
.ad-kpi-1  { animation: ad-kpi-in 0.4s 0.63s cubic-bezier(0.34,1.3,0.64,1) both; }
.ad-kpi-2  { animation: ad-kpi-in 0.4s 0.71s cubic-bezier(0.34,1.3,0.64,1) both; }
.ad-kpi-3  { animation: ad-kpi-in 0.4s 0.79s cubic-bezier(0.34,1.3,0.64,1) both; }
.ad-kpi-4  { animation: ad-kpi-in 0.4s 0.87s cubic-bezier(0.34,1.3,0.64,1) both; }
.ad-kpi-5  { animation: ad-kpi-in 0.4s 0.95s cubic-bezier(0.34,1.3,0.64,1) both; }

.ad-num    { animation: ad-num-pop 0.5s 0.4s cubic-bezier(0.34,1.56,0.64,1) both; display:inline-block; }
.ad-float  { animation: ad-float  3.5s ease-in-out infinite; }
.ad-badge  { animation: ad-badge-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }
.ad-live   { animation: ad-live-pulse 2s ease-in-out infinite; }

.ad-name-char {
    display: inline-block;
    opacity: 0;
    animation: ad-char-in 0.4s cubic-bezier(0.22,1,0.36,1) forwards;
}

.ad-colon { animation: ad-colon-blink 1s step-end infinite; }

.ad-skel {
    background: linear-gradient(90deg, ${A.accentLt} 25%, #f3f0fb 50%, ${A.accentLt} 75%);
    background-size: 400px 100%;
    animation: ad-shimmer 1.6s infinite linear;
    border-radius: 10px;
}

.ad-div-line {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(167,139,250,0.5), rgba(255,255,255,0.7), rgba(167,139,250,0.5), transparent);
    background-size: 300px 100%;
    animation: ad-div-sweep 2.5s linear infinite;
}

.ad-card {
    background: ${A.surface};
    border: 1px solid ${A.border};
    border-radius: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px ${A.accentSoft};
    transition: box-shadow 0.25s, transform 0.25s;
}
.ad-card:hover {
    box-shadow: 0 4px 24px ${A.accentMid};
    transform: translateY(-1px);
}

.ad-tr:hover { background: ${A.surfaceHov}; }
.ad-tr { transition: background 0.15s; }

.ad-scroll::-webkit-scrollbar { width: 3px; height: 3px; }
.ad-scroll::-webkit-scrollbar-track { background: transparent; }
.ad-scroll::-webkit-scrollbar-thumb { background: ${A.inkFaint}; border-radius: 9px; }

.ad-quick:hover { transform: translateY(-3px) scale(1.01); box-shadow: 0 12px 32px ${A.accentMid}; }
.ad-quick { transition: all 0.22s cubic-bezier(0.34,1.2,0.64,1); }

.ad-stat-row:hover { background: ${A.surfaceHov}; }
.ad-stat-row { transition: background 0.15s; border-radius: 10px; }
`;

/* ─────────────────────────────────────────────────────
   Animated counter
───────────────────────────────────────────────────── */
function AnimCounter({ to, duration = 900 }) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        if (!to) return;
        let cur = 0;
        const step = Math.max(1, Math.ceil(to / (duration / 16)));
        const id = setInterval(() => {
            cur += step;
            if (cur >= to) { setVal(to); clearInterval(id); }
            else setVal(cur);
        }, 16);
        return () => clearInterval(id);
    }, [to]);
    return <span className="ad-num">{val.toLocaleString()}</span>;
}

/* ─────────────────────────────────────────────────────
   Digital name (character-drop animation)
───────────────────────────────────────────────────── */
function DigitalName({ name }) {
    return (
        <span style={{ display:'inline-flex', alignItems:'baseline', gap:0 }}>
            {(name||'Admin').split('').map((ch, i) => (
                <span key={i} className="ad-name-char" style={{
                    animationDelay: `${0.3 + i * 0.05}s`,
                    fontFamily:"'DM Sans', sans-serif",
                    fontSize: 36, fontWeight: 800,
                    color: '#fff', lineHeight: 1,
                    letterSpacing: ch === ' ' ? '0.15em' : '-0.01em',
                }}>
                    {ch === ' ' ? '\u00A0' : ch}
                </span>
            ))}
        </span>
    );
}

/* ─────────────────────────────────────────────────────
   Live clock
───────────────────────────────────────────────────── */
function LiveClock() {
    const [t, setT] = useState(new Date());
    useEffect(() => {
        const id = setInterval(() => setT(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    const h  = t.getHours().toString().padStart(2,'0');
    const m  = t.getMinutes().toString().padStart(2,'0');
    const ap = t.getHours() >= 12 ? 'PM' : 'AM';
    return (
        <div style={{ display:'flex', alignItems:'baseline', gap:2 }}>
            <span style={{ fontFamily:"'DM Sans'", fontSize:34, fontWeight:800, color:'#fff', lineHeight:1, letterSpacing:'-0.03em' }}>{h}</span>
            <span className="ad-colon" style={{ fontFamily:"'DM Sans'", fontSize:30, fontWeight:700, color:'rgba(255,255,255,0.7)', lineHeight:1 }}>:</span>
            <span style={{ fontFamily:"'DM Sans'", fontSize:34, fontWeight:800, color:'#fff', lineHeight:1, letterSpacing:'-0.03em' }}>{m}</span>
            <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.45)', marginLeft:5, alignSelf:'flex-end', paddingBottom:3 }}>{ap}</span>
        </div>
    );
}

/* ─────────────────────────────────────────────────────
   Custom chart tooltip
───────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background:'#fff', borderRadius:12, padding:'10px 14px',
            border:`1px solid ${A.border}`,
            boxShadow:`0 8px 24px ${A.accentSoft}`,
            fontFamily:"'DM Sans',sans-serif", fontSize:12,
        }}>
            <p style={{ fontWeight:700, color:A.ink, marginBottom:5, fontSize:11 }}>{label}</p>
            {payload.map((p,i) => (
                <p key={i} style={{ color:p.color, fontWeight:500 }}>
                    {p.name}: <span style={{ color:A.inkMid, fontWeight:700 }}>{p.value}</span>
                </p>
            ))}
        </div>
    );
};

/* ─────────────────────────────────────────────────────
   KPI card (inside hero banner)
───────────────────────────────────────────────────── */
function HeroKPI({ title, value, icon: Icon, accentClr, sub, loading, animClass }) {
    return (
        <div className={animClass} style={{
            background:'rgba(255,255,255,0.1)',
            backdropFilter:'blur(12px)',
            border:'1px solid rgba(255,255,255,0.16)',
            borderRadius:18, padding:'18px 20px',
            position:'relative', overflow:'hidden',
            transition:'all 0.22s cubic-bezier(0.34,1.2,0.64,1)',
            cursor:'default',
        }}
            onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.18)'; e.currentTarget.style.transform='translateY(-3px)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.1)';  e.currentTarget.style.transform='translateY(0)'; }}
        >
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{
                    width:36, height:36, borderRadius:11,
                    background:`${accentClr}22`, border:`1px solid ${accentClr}44`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                    <Icon style={{ width:17, height:17, color:accentClr }}/>
                </div>
                <span style={{
                    fontSize:10, fontWeight:700, color:accentClr,
                    background:`${accentClr}18`, padding:'3px 9px', borderRadius:99,
                    letterSpacing:'0.3px',
                }}>
                    {sub}
                </span>
            </div>
            {loading
                ? <div style={{ height:36, width:64, borderRadius:10, background:'rgba(255,255,255,0.15)', marginBottom:6 }}/>
                : <p style={{ fontFamily:"'DM Sans'", fontSize:34, fontWeight:800, color:'#fff', lineHeight:1, marginBottom:5 }}>
                    <AnimCounter to={value||0}/>
                  </p>
            }
            <p style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.9px' }}>
                {title}
            </p>
            {/* Corner glow */}
            <div style={{
                position:'absolute', bottom:-14, right:-14,
                width:60, height:60, borderRadius:'50%',
                background:`${accentClr}10`, pointerEvents:'none',
            }}/>
        </div>
    );
}

/* ─────────────────────────────────────────────────────
   Main stat card (below hero)
───────────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color, glow, sub, loading, link, animClass }) {
    const inner = (
        <div style={{
            position:'relative', overflow:'hidden',
            borderRadius:18, padding:'20px',
            background:`linear-gradient(135deg, ${color[0]} 0%, ${color[1]} 100%)`,
            boxShadow:`0 8px 28px ${glow}`,
            transition:'transform 0.22s cubic-bezier(0.34,1.2,0.64,1), box-shadow 0.22s',
        }}
            onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-4px) scale(1.01)'; e.currentTarget.style.boxShadow=`0 16px 40px ${glow}`; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0) scale(1)'; e.currentTarget.style.boxShadow=`0 8px 28px ${glow}`; }}
        >
            {/* Decorative circles */}
            <div style={{ position:'absolute', top:-24, right:-24, width:90, height:90, borderRadius:'50%', background:'rgba(255,255,255,0.12)', pointerEvents:'none' }}/>
            <div style={{ position:'absolute', bottom:-16, right:10, width:50, height:50, borderRadius:'50%', background:'rgba(255,255,255,0.07)', pointerEvents:'none' }}/>
            <div style={{ position:'relative' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                    <div style={{
                        width:38, height:38, borderRadius:11,
                        background:'rgba(255,255,255,0.22)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                        <Icon style={{ width:18, height:18, color:'#fff' }}/>
                    </div>
                    {link && <ArrowRight style={{ width:15, height:15, color:'rgba(255,255,255,0.5)', transition:'all 0.2s' }}/>}
                </div>
                <p style={{ fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.65)', letterSpacing:'1px', textTransform:'uppercase', marginBottom:5 }}>
                    {label}
                </p>
                <p style={{ fontFamily:"'DM Sans'", fontSize:32, fontWeight:800, color:'#fff', lineHeight:1, marginBottom:4 }}>
                    {loading ? <span style={{ display:'inline-block', width:48, height:30, borderRadius:8, background:'rgba(255,255,255,0.2)' }}/> : <AnimCounter to={value||0}/>}
                </p>
                {sub && <p style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>{sub}</p>}
            </div>
        </div>
    );
    const wrapped = link
        ? <Link to={link} style={{ display:'block', textDecoration:'none' }}>{inner}</Link>
        : inner;
    return <div className={animClass}>{wrapped}</div>;
}

/* ─────────────────────────────────────────────────────
   Progress bar row (for table-like stats)
───────────────────────────────────────────────────── */
function ProgressRow({ label, value, max, color, idx }) {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0' }}>
            <div style={{
                width:32, height:32, borderRadius:9, flexShrink:0,
                background:`${color}18`,
                display:'flex', alignItems:'center', justifyContent:'center',
            }}>
                <span style={{ fontSize:13, fontWeight:800, color, fontFamily:"'DM Sans'" }}>{label.charAt(0)}</span>
            </div>
            <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontSize:12.5, fontWeight:600, color:A.ink }}>{label}</span>
                    <span style={{ fontSize:11, color:A.inkLight }}>{value}</span>
                </div>
                <div style={{ height:6, background:A.accentLt, borderRadius:99, overflow:'hidden' }}>
                    <div style={{
                        height:'100%', borderRadius:99, background:color,
                        width:`${pct}%`,
                        animation:'ad-bar-grow 0.9s cubic-bezier(0.34,1,0.64,1) both',
                        animationDelay:`${idx*80}ms`,
                    }}/>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────
   Admin Dashboard
───────────────────────────────────────────────────── */
export default function AdminDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [users_,     setUsers]       = useState([]);
    const [students,   setStudents]    = useState([]);
    const [reports,    setReports]     = useState([]);
    const [departments,setDepartments] = useState([]);
    const [loading,    setLoading]     = useState(true);
    const [deleteModal,setDeleteModal] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const [us, stu, reps, depts] = await Promise.all([
                    api.get('/admin/users').catch(()=>[]),
                    api.get('/students').catch(()=>[]),
                    api.get('/admin/reports').catch(()=>[]),
                    api.get('/auth/departments').catch(()=>[]),
                ]);
                setUsers(Array.isArray(us) ? us : []);
                setStudents(Array.isArray(stu) ? stu : []);
                setReports(Array.isArray(reps) ? reps : []);
                setDepartments(Array.isArray(depts) ? depts : []);
            } catch(e){ console.error(e); }
            finally { setLoading(false); }
        })();
    }, []);

    const blockedUsers    = useMemo(()=>users_.filter(u=>u.isBlocked).length, [users_]);
    const approvedReports = useMemo(()=>reports.filter(r=>r.status==='approved').length, [reports]);
    const pendingReports  = useMemo(()=>reports.filter(r=>r.status?.includes('submitted')).length, [reports]);
    const teacherCount    = useMemo(()=>users_.filter(u=>u.role==='TEACHER').length, [users_]);
    const hodCount        = useMemo(()=>users_.filter(u=>u.role==='HOD').length, [users_]);

    const deptStats = useMemo(()=>
        departments.map((d,i)=>({
            name: d.shortId || d.name?.slice(0,6),
            students: students.filter(s=>s.departmentId===d.id||s.department?.id===d.id).length,
            teachers: users_.filter(u=>u.role==='TEACHER'&&u.departmentId===d.id).length,
            fill: CHART_COLORS[i%CHART_COLORS.length],
        })),
    [departments,students,users_]);

    const roleData = useMemo(()=>{
        const c={TEACHER:0,HOD:0,PRINCIPAL:0,ADMIN:0};
        users_.forEach(u=>{ if(c[u.role]!==undefined) c[u.role]++; });
        return Object.entries(c).filter(([,v])=>v>0).map(([name,value])=>({name,value}));
    },[users_]);

    const reportStatusData = useMemo(()=>{
        const m={};
        reports.forEach(r=>{ const s=r.status||'draft'; m[s]=(m[s]||0)+1; });
        return Object.entries(m).map(([name,value])=>({name:name.replace(/_/g,' '),value}));
    },[reports]);

    const recentUsers = useMemo(()=>
        [...users_].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,8),
    [users_]);

    const handleDeleteUser = async (uid) => {
        try {
            await api.delete(`/admin/users/${uid}`);
            setUsers(prev=>prev.filter(u=>u.id!==uid));
            setDeleteModal(null);
        } catch(err){ alert(err.message); }
    };

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

    const ROLE_BADGE_STYLE = {
        TEACHER:   { bg:'rgba(109,40,217,0.1)',   color:'#6d28d9' },
        HOD:       { bg:'rgba(245,158,11,0.1)',   color:'#b45309' },
        PRINCIPAL: { bg:'rgba(190,18,60,0.1)',    color:'#be123c' },
        ADMIN:     { bg:'rgba(109,40,217,0.15)',  color:'#4c1d95' },
    };

    return (
        <>
            <style>{CSS}</style>
            <DashboardLayout title="Control Panel" subtitle={dateStr}>
                <div className="ad" style={{ padding:'0 0 32px' }}>

                    {/* ── HERO BANNER ── */}
                    <div className="ad-hero" style={{
                        background:`linear-gradient(135deg, #3b0764 0%, #6d28d9 45%, #7c3aed 75%, #a78bfa 100%)`,
                        borderRadius:28, padding:'32px 36px 28px',
                        marginBottom:24, position:'relative', overflow:'hidden',
                    }}>
                        {/* Dot grid */}
                        <div style={{
                            position:'absolute', inset:0, opacity:0.06, pointerEvents:'none',
                            backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
                            backgroundSize:'24px 24px',
                        }}/>
                        {/* Drifting orbs */}
                        <div style={{
                            position:'absolute', top:-80, right:-60, width:280, height:280,
                            borderRadius:'50%', pointerEvents:'none',
                            background:'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 65%)',
                            animation:'ad-orb 14s ease-in-out infinite',
                        }}/>
                        <div style={{
                            position:'absolute', bottom:-50, right:220, width:160, height:160,
                            borderRadius:'50%', pointerEvents:'none',
                            background:'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 65%)',
                            animation:'ad-orb 10s ease-in-out infinite reverse',
                        }}/>

                        {/* Top row: name + clock */}
                        <div style={{
                            position:'relative',
                            display:'grid', gridTemplateColumns:'1fr auto',
                            gap:24, alignItems:'center', marginBottom:22,
                        }}>
                            <div>
                                {/* Admin badge pill */}
                                <div style={{
                                    display:'inline-flex', alignItems:'center', gap:7,
                                    background:'rgba(255,255,255,0.12)',
                                    border:'1px solid rgba(255,255,255,0.2)',
                                    borderRadius:99, padding:'5px 14px', marginBottom:14,
                                }}>
                                    <Shield style={{ width:13, height:13, color:'rgba(255,255,255,0.8)' }}/>
                                    <span style={{ color:'rgba(255,255,255,0.85)', fontSize:12.5, fontWeight:600, letterSpacing:'0.3px' }}>
                                        Admin Control Panel
                                    </span>
                                    <span className="ad-live" style={{
                                        width:7, height:7, borderRadius:'50%',
                                        background:'#c4b5fd', display:'inline-block', marginLeft:2,
                                    }}/>
                                </div>

                                {/* Animated name */}
                                <div style={{ marginBottom:10, display:'flex', alignItems:'center', gap:10 }}>
                                    <DigitalName name={user?.name || 'Admin'} />
                                    <span style={{ fontSize:32, lineHeight:1 }}>⚡</span>
                                </div>

                                <p style={{
                                    color:'rgba(255,255,255,0.58)', fontSize:14, fontWeight:400,
                                    display:'flex', alignItems:'center', gap:8,
                                }}>
                                    <span style={{ width:6, height:6, borderRadius:'50%', background:'#c4b5fd', display:'inline-block' }}/>
                                    {users_.length > 0
                                        ? `Managing ${users_.length} users across ${departments.length} departments`
                                        : 'Loading system stats…'
                                    }
                                </p>
                            </div>

                            {/* Clock */}
                            <div style={{
                                background:'rgba(0,0,0,0.22)',
                                backdropFilter:'blur(16px)',
                                borderRadius:20, padding:'20px 26px',
                                textAlign:'center', minWidth:160,
                                border:'1px solid rgba(255,255,255,0.12)',
                            }}>
                                <LiveClock/>
                                <div className="ad-div-line" style={{ margin:'10px 0 8px' }}/>
                                <p style={{ color:'rgba(255,255,255,0.45)', fontSize:11, fontWeight:500, letterSpacing:'0.3px' }}>
                                    {now.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}
                                </p>
                            </div>
                        </div>

                        {/* Divider sweep */}
                        

                        {/* KPI cards */}
                        
                    </div>

                    {/* ── STAT CARDS ROW ── */}
                    <div style={{
                        display:'grid', gridTemplateColumns:'repeat(6,1fr)',
                        gap:14, marginBottom:20,
                    }}>
                        {[
                            { label:'All Users',    value:users_.length,     icon:Users,        color:['#6d28d9','#7c3aed'], glow:'rgba(109,40,217,0.25)', link:'/admin/users',      animClass:'ad-s1' },
                            { label:'Students',     value:students.length,   icon:GraduationCap,color:['#059669','#10b981'], glow:'rgba(16,185,129,0.25)', link:'/admin/students',   animClass:'ad-s2' },
                            { label:'Teachers',     value:teacherCount,      icon:BookOpen,      color:['#0284c7','#38bdf8'], glow:'rgba(56,189,248,0.25)', link:'/admin/users',      animClass:'ad-s3' },
                            { label:'Departments',  value:departments.length,icon:Building2,     color:['#b45309','#f59e0b'], glow:'rgba(245,158,11,0.25)', link:'/admin/departments',animClass:'ad-s4' },
                            { label:'Reports',      value:reports.length,    icon:FileText,      color:['#be123c','#f43f5e'], glow:'rgba(244,63,94,0.25)',  link:'/admin/reports',    sub:`${approvedReports} approved`, animClass:'ad-s5' },
                            { label:'Blocked',      value:blockedUsers,      icon:ShieldAlert,   color:['#374151','#6b7280'], glow:'rgba(107,114,128,0.25)',link:'/admin/users',      animClass:'ad-s6' },
                        ].map(s=>(
                            <StatCard key={s.label} {...s} loading={loading}/>
                        ))}
                    </div>

                    {/* ── CHARTS ROW ── */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20, marginBottom:20 }}>

                        {/* Students by Dept */}
                        <div className="ad-card ad-s1" style={{ padding:26 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                                <div style={{ width:34, height:34, borderRadius:10, background:A.accentMid, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    <Building2 style={{ width:16, height:16, color:A.accent }}/>
                                </div>
                                <div>
                                    <p style={{ fontSize:15, fontWeight:700, color:A.ink, lineHeight:1 }}>Students by Dept</p>
                                    <p style={{ fontSize:11, color:A.inkLight, marginTop:2 }}>Enrollment distribution</p>
                                </div>
                            </div>
                            {loading ? <div className="ad-skel" style={{ height:200 }}/> : (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={deptStats} margin={{top:4,right:4,bottom:20,left:-20}}>
                                        <defs>
                                            {CHART_COLORS.map((c,i)=>(
                                                <linearGradient key={i} id={`adg${i}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={c} stopOpacity={1}/>
                                                    <stop offset="100%" stopColor={c} stopOpacity={0.5}/>
                                                </linearGradient>
                                            ))}
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={A.inkFaint}/>
                                        <XAxis dataKey="name" tick={{ fontSize:10, fill:A.inkLight }} angle={-15} textAnchor="end" height={36} axisLine={false} tickLine={false}/>
                                        <YAxis tick={{ fontSize:10, fill:A.inkLight }} axisLine={false} tickLine={false}/>
                                        <Tooltip content={<CustomTooltip/>}/>
                                        <Bar dataKey="students" name="Students" radius={[8,8,0,0]} maxBarSize={44}>
                                            {deptStats.map((_,i)=><Cell key={i} fill={`url(#adg${i%CHART_COLORS.length})`}/>)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Role Distribution */}
                        <div className="ad-card ad-s2" style={{ padding:26 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                                <div style={{ width:34, height:34, borderRadius:10, background:A.accentMid, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    <Shield style={{ width:16, height:16, color:A.accent }}/>
                                </div>
                                <div>
                                    <p style={{ fontSize:15, fontWeight:700, color:A.ink, lineHeight:1 }}>Role Distribution</p>
                                    <p style={{ fontSize:11, color:A.inkLight, marginTop:2 }}>Users by role type</p>
                                </div>
                            </div>
                            {loading ? <div className="ad-skel" style={{ height:200 }}/> : (
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie data={roleData} cx="50%" cy="50%" outerRadius={78} innerRadius={34} dataKey="value" paddingAngle={4}>
                                            {roleData.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
                                        </Pie>
                                        <Tooltip formatter={(v,n)=>[`${v} users`,n]}/>
                                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:10, fontFamily:"'DM Sans'" }}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Reports by Status */}
                        <div className="ad-card ad-s3" style={{ padding:26 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                                <div style={{ width:34, height:34, borderRadius:10, background:A.accentMid, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    <FileText style={{ width:16, height:16, color:A.accent }}/>
                                </div>
                                <div>
                                    <p style={{ fontSize:15, fontWeight:700, color:A.ink, lineHeight:1 }}>Reports by Status</p>
                                    <p style={{ fontSize:11, color:A.inkLight, marginTop:2 }}>Pipeline overview</p>
                                </div>
                            </div>
                            {loading ? <div className="ad-skel" style={{ height:200 }}/> : (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={reportStatusData} layout="vertical" margin={{top:0,right:10,bottom:0,left:8}}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={A.inkFaint}/>
                                        <XAxis type="number" tick={{ fontSize:10, fill:A.inkLight }} axisLine={false} tickLine={false}/>
                                        <YAxis type="category" dataKey="name" tick={{ fontSize:9, fill:A.inkLight }} axisLine={false} tickLine={false} width={82}/>
                                        <Tooltip content={<CustomTooltip/>}/>
                                        <Bar dataKey="value" name="Reports" radius={[0,8,8,0]}>
                                            {reportStatusData.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* ── BOTTOM ROW: table + dept breakdown ── */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20, marginBottom:20 }}>

                        {/* Recent Users Table */}
                        <div className="ad-card ad-s4" style={{ overflow:'hidden' }}>
                            <div style={{
                                padding:'18px 24px',
                                borderBottom:`1px solid ${A.border}`,
                                display:'flex', alignItems:'center', justifyContent:'space-between',
                            }}>
                                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                    <div style={{ width:32, height:32, borderRadius:9, background:A.accentMid, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                        <Users style={{ width:15, height:15, color:A.accent }}/>
                                    </div>
                                    <div>
                                        <p style={{ fontSize:14, fontWeight:700, color:A.ink, lineHeight:1 }}>Recently Registered</p>
                                        <p style={{ fontSize:11, color:A.inkLight, marginTop:2 }}>Latest {recentUsers.length} users</p>
                                    </div>
                                </div>
                                <Link to="/admin/users" style={{
                                    display:'flex', alignItems:'center', gap:5,
                                    fontSize:12, fontWeight:600, color:A.accent,
                                    textDecoration:'none', padding:'5px 10px',
                                    borderRadius:8, background:A.accentSoft,
                                    transition:'all 0.15s',
                                }}>
                                    Manage all <ArrowRight style={{ width:13, height:13 }}/>
                                </Link>
                            </div>
                            <div className="ad-scroll" style={{ overflowX:'auto' }}>
                                <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:"'DM Sans'" }}>
                                    <thead>
                                        <tr style={{ background:A.bg }}>
                                            {['Name','Email','Role','Status','Actions'].map(h=>(
                                                <th key={h} style={{
                                                    padding:'10px 16px', textAlign:'left',
                                                    fontSize:10, fontWeight:700, color:A.inkLight,
                                                    letterSpacing:'1px', textTransform:'uppercase',
                                                    borderBottom:`1px solid ${A.border}`,
                                                }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? [1,2,3,4].map(i=>(
                                            <tr key={i}><td colSpan={5} style={{ padding:'10px 16px' }}>
                                                <div className="ad-skel" style={{ height:28 }}/>
                                            </td></tr>
                                        )) : recentUsers.map(u=>(
                                            <tr key={u.id} className="ad-tr">
                                                <td style={{ padding:'10px 16px', fontSize:13, fontWeight:600, color:A.ink }}>
                                                    {u.fullName || '—'}
                                                </td>
                                                <td style={{ padding:'10px 16px', fontSize:11.5, color:A.inkLight }}>
                                                    {u.email}
                                                </td>
                                                <td style={{ padding:'10px 16px' }}>
                                                    <span style={{
                                                        padding:'3px 9px', borderRadius:99,
                                                        fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px',
                                                        background:(ROLE_BADGE_STYLE[u.role]||{}).bg||A.accentSoft,
                                                        color:(ROLE_BADGE_STYLE[u.role]||{}).color||A.accent,
                                                    }}>{u.role}</span>
                                                </td>
                                                <td style={{ padding:'10px 16px' }}>
                                                    <span style={{
                                                        padding:'3px 9px', borderRadius:99,
                                                        fontSize:10, fontWeight:700,
                                                        background: u.isBlocked ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                                                        color: u.isBlocked ? '#ef4444' : '#059669',
                                                    }}>
                                                        {u.isBlocked ? 'Blocked' : 'Active'}
                                                    </span>
                                                </td>
                                                <td style={{ padding:'10px 16px' }}>
                                                    <button onClick={()=>setDeleteModal(u)} style={{
                                                        width:30, height:30, borderRadius:8,
                                                        border:'none', cursor:'pointer',
                                                        background:'transparent', color:A.inkLight,
                                                        display:'flex', alignItems:'center', justifyContent:'center',
                                                        transition:'all 0.15s',
                                                    }}
                                                        onMouseEnter={e=>{ e.currentTarget.style.background='rgba(239,68,68,0.08)'; e.currentTarget.style.color='#ef4444'; }}
                                                        onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color=A.inkLight; }}
                                                    >
                                                        <Trash2 style={{ width:14, height:14 }}/>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Department breakdown */}
                        <div className="ad-card ad-s4" style={{ padding:26 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                                <div style={{ width:34, height:34, borderRadius:10, background:A.accentMid, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    <Layers style={{ width:16, height:16, color:A.accent }}/>
                                </div>
                                <div>
                                    <p style={{ fontSize:15, fontWeight:700, color:A.ink, lineHeight:1 }}>Departments</p>
                                    <p style={{ fontSize:11, color:A.inkLight, marginTop:2 }}>Students per dept</p>
                                </div>
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                                {loading ? [1,2,3,4].map(i=>(
                                    <div key={i} className="ad-skel" style={{ height:44 }}/>
                                )) : deptStats.length > 0 ? deptStats.map((d,i)=>(
                                    <ProgressRow
                                        key={d.name} label={d.name}
                                        value={d.students}
                                        max={Math.max(...deptStats.map(x=>x.students),1)}
                                        color={CHART_COLORS[i%CHART_COLORS.length]} idx={i}
                                    />
                                )) : (
                                    <div style={{ textAlign:'center', padding:'32px 0', color:A.inkLight, fontSize:13 }}>
                                        No departments found
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── QUICK ACTIONS ── */}
                    <div className="ad-s5" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
                        {[
                            { to:'/admin/users',           label:'Manage Users',   icon:Users,        clr:['#6d28d9','#7c3aed'], glow:'rgba(109,40,217,0.3)' },
                            { to:'/admin/students',        label:'Students',        icon:GraduationCap,clr:['#059669','#10b981'], glow:'rgba(16,185,129,0.3)' },
                            { to:'/admin/timetable',       label:'Timetable',       icon:CalendarDays, clr:['#b45309','#d97706'], glow:'rgba(245,158,11,0.3)' },
                            { to:'/admin/attendance-risk', label:'Risk Monitor',    icon:Activity,     clr:['#be123c','#e11d48'], glow:'rgba(244,63,94,0.3)' },
                        ].map(a=>(
                            <Link key={a.to} to={a.to} style={{ textDecoration:'none' }}>
                                <div className="ad-quick" style={{
                                    display:'flex', alignItems:'center', gap:12,
                                    padding:'16px 18px', borderRadius:16,
                                    background:`linear-gradient(135deg, ${a.clr[0]} 0%, ${a.clr[1]} 100%)`,
                                    boxShadow:`0 6px 20px ${a.glow}`,
                                    cursor:'pointer',
                                }}>
                                    <div style={{
                                        width:36, height:36, borderRadius:10, flexShrink:0,
                                        background:'rgba(255,255,255,0.2)',
                                        display:'flex', alignItems:'center', justifyContent:'center',
                                    }}>
                                        <a.icon style={{ width:18, height:18, color:'#fff' }}/>
                                    </div>
                                    <span style={{ fontSize:13.5, fontWeight:700, color:'#fff', flex:1 }}>{a.label}</span>
                                    <ArrowRight style={{ width:15, height:15, color:'rgba(255,255,255,0.6)' }}/>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ── DELETE MODAL ── */}
                {deleteModal && (
                    <div style={{
                        position:'fixed', inset:0, zIndex:50,
                        display:'flex', alignItems:'center', justifyContent:'center', padding:16,
                        background:'rgba(18,13,28,0.55)', backdropFilter:'blur(4px)',
                    }}>
                        <div style={{
                            background:'#fff', borderRadius:24,
                            boxShadow:`0 24px 80px rgba(0,0,0,0.18), 0 0 0 1px ${A.border}`,
                            padding:28, maxWidth:360, width:'100%',
                            fontFamily:"'DM Sans'",
                            animation:'ad-scale 0.25s cubic-bezier(0.34,1.3,0.64,1) both',
                        }}>
                            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                                <div style={{ width:44, height:44, borderRadius:13, background:'rgba(239,68,68,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    <Trash2 style={{ width:20, height:20, color:'#ef4444' }}/>
                                </div>
                                <div>
                                    <p style={{ fontSize:15, fontWeight:800, color:A.ink }}>Delete User</p>
                                    <p style={{ fontSize:11.5, color:A.inkLight, marginTop:2 }}>This cannot be undone</p>
                                </div>
                                <button onClick={()=>setDeleteModal(null)} style={{
                                    marginLeft:'auto', width:28, height:28, borderRadius:8,
                                    border:'none', cursor:'pointer', background:A.accentSoft,
                                    color:A.inkLight, display:'flex', alignItems:'center', justifyContent:'center',
                                }}>
                                    <X style={{ width:13, height:13 }}/>
                                </button>
                            </div>
                            <p style={{ fontSize:13.5, color:A.inkMid, marginBottom:22, lineHeight:1.6 }}>
                                Are you sure you want to delete{' '}
                                <strong style={{ color:A.ink }}>{deleteModal.fullName}</strong>?
                            </p>
                            <div style={{ display:'flex', gap:10 }}>
                                <button onClick={()=>setDeleteModal(null)} style={{
                                    flex:1, padding:'11px 0', borderRadius:12,
                                    border:`1px solid ${A.border}`, background:'transparent',
                                    fontSize:13, fontWeight:600, color:A.inkMid,
                                    cursor:'pointer', fontFamily:"'DM Sans'",
                                    transition:'background 0.15s',
                                }}
                                    onMouseEnter={e=>e.currentTarget.style.background=A.accentSoft}
                                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                                >Cancel</button>
                                <button onClick={()=>handleDeleteUser(deleteModal.id)} style={{
                                    flex:1, padding:'11px 0', borderRadius:12,
                                    border:'none', background:'linear-gradient(135deg,#ef4444,#dc2626)',
                                    fontSize:13, fontWeight:700, color:'#fff',
                                    cursor:'pointer', fontFamily:"'DM Sans'",
                                    boxShadow:'0 4px 14px rgba(239,68,68,0.35)',
                                    transition:'opacity 0.15s',
                                }}
                                    onMouseEnter={e=>e.currentTarget.style.opacity='0.9'}
                                    onMouseLeave={e=>e.currentTarget.style.opacity='1'}
                                >Delete</button>
                            </div>
                        </div>
                    </div>
                )}
            </DashboardLayout>
        </>
    );
}