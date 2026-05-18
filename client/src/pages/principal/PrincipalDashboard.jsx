import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../lib/api.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import {
    Building2, Users, GraduationCap, FileText,
    TrendingUp, ArrowRight, BookOpen, CheckCircle2,
    Activity, Star, BarChart3, AlertTriangle,
    ChevronRight, Layers, Shield, Zap
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';

/* ─────────────────────────────────────────────────────
   Principal red/rose theme — mirrors Sidebar ROLE_THEMES.principal
───────────────────────────────────────────────────── */
const P = {
    bg:         '#fdf5f5',
    surface:    '#ffffff',
    surfaceHov: '#fdeaea',
    border:     'rgba(190,18,60,0.1)',
    borderMid:  'rgba(190,18,60,0.18)',

    accent:     '#be123c',
    accentDark: '#881337',
    accentSoft: 'rgba(190,18,60,0.08)',
    accentMid:  'rgba(190,18,60,0.15)',
    accentGlow: 'rgba(190,18,60,0.22)',
    accentLt:   '#ffe4e6',

    ink:        '#1a0a0d',
    inkMid:     '#4a1a24',
    inkLight:   '#a07080',
    inkFaint:   '#e8ccd2',

    gradA:      '#7f1d1d',
    gradB:      '#be123c',
    gradC:      '#e11d48',
    gradD:      '#fb7185',
};

/* Vibrant multi-color chart palette */
const CHART_COLORS = [
    '#be123c','#b45309','#6d28d9','#059669',
    '#0284c7','#f97316','#a78bfa','#fbbf24',
];

/* ─────────────────────────────────────────────────────
   Global CSS
───────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');

.pd * { box-sizing: border-box; margin: 0; padding: 0; }
.pd { font-family: 'DM Sans', sans-serif; background: ${P.bg}; min-height: 100vh; color: ${P.ink}; }

@keyframes pd-up {
    from { opacity:0; transform:translateY(20px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
}
@keyframes pd-num-pop {
    0%   { transform:scale(0.6) translateY(10px); opacity:0; }
    65%  { transform:scale(1.1) translateY(-2px); opacity:1; }
    100% { transform:scale(1) translateY(0); opacity:1; }
}
@keyframes pd-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
}
@keyframes pd-bar-grow {
    from { width: 0; }
    to   { width: var(--w, 100%); }
}
@keyframes pd-float {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(-5px); }
}
@keyframes pd-orb {
    0%,100%{ transform:translate(0,0) scale(1); }
    33%    { transform:translate(18px,-14px) scale(1.05); }
    66%    { transform:translate(-12px,10px) scale(0.96); }
}
@keyframes pd-colon-blink {
    0%,49%  { opacity:1; }
    50%,99% { opacity:0.25; }
}
@keyframes pd-char-in {
    from { opacity:0; transform:translateY(-10px) scaleY(1.3); filter:blur(3px); }
    to   { opacity:1; transform:translateY(0) scaleY(1); filter:blur(0); }
}
@keyframes pd-kpi-in {
    from { opacity:0; transform:translateY(16px) scale(0.93); }
    to   { opacity:1; transform:translateY(0) scale(1); }
}
@keyframes pd-badge-pop {
    0%  { transform: scale(0) rotate(-15deg); }
    65% { transform: scale(1.2) rotate(4deg); }
    100%{ transform: scale(1) rotate(0); }
}
@keyframes pd-live-pulse {
    0%,100%{ box-shadow: 0 0 0 0 rgba(251,113,133,0.6); }
    50%    { box-shadow: 0 0 0 6px rgba(251,113,133,0); }
}
@keyframes pd-div-sweep {
    from { background-position: -300px 0; }
    to   { background-position:  300px 0; }
}
@keyframes pd-dept-in {
    from { opacity:0; transform:translateY(12px); }
    to   { opacity:1; transform:translateY(0); }
}

.pd-hero   { animation: pd-up    0.6s cubic-bezier(0.34,1.2,0.64,1) both; }
.pd-s1     { animation: pd-up    0.5s 0.06s cubic-bezier(0.34,1.1,0.64,1) both; }
.pd-s2     { animation: pd-up    0.5s 0.12s cubic-bezier(0.34,1.1,0.64,1) both; }
.pd-s3     { animation: pd-up    0.5s 0.18s cubic-bezier(0.34,1.1,0.64,1) both; }
.pd-s4     { animation: pd-up    0.5s 0.24s cubic-bezier(0.34,1.1,0.64,1) both; }
.pd-s5     { animation: pd-up    0.5s 0.30s cubic-bezier(0.34,1.1,0.64,1) both; }
.pd-s6     { animation: pd-up    0.5s 0.36s cubic-bezier(0.34,1.1,0.64,1) both; }

.pd-kpi-0  { animation: pd-kpi-in 0.4s 0.55s cubic-bezier(0.34,1.3,0.64,1) both; }
.pd-kpi-1  { animation: pd-kpi-in 0.4s 0.63s cubic-bezier(0.34,1.3,0.64,1) both; }
.pd-kpi-2  { animation: pd-kpi-in 0.4s 0.71s cubic-bezier(0.34,1.3,0.64,1) both; }
.pd-kpi-3  { animation: pd-kpi-in 0.4s 0.79s cubic-bezier(0.34,1.3,0.64,1) both; }

.pd-num    { animation: pd-num-pop 0.5s 0.4s cubic-bezier(0.34,1.56,0.64,1) both; display:inline-block; }
.pd-float  { animation: pd-float  3.5s ease-in-out infinite; }
.pd-badge  { animation: pd-badge-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }
.pd-live   { animation: pd-live-pulse 2s ease-in-out infinite; }

.pd-name-char {
    display: inline-block;
    opacity: 0;
    animation: pd-char-in 0.4s cubic-bezier(0.22,1,0.36,1) forwards;
}
.pd-colon { animation: pd-colon-blink 1s step-end infinite; }

.pd-skel {
    background: linear-gradient(90deg, ${P.accentLt} 25%, #fff8f8 50%, ${P.accentLt} 75%);
    background-size: 400px 100%;
    animation: pd-shimmer 1.6s infinite linear;
    border-radius: 10px;
}
.pd-div-line {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(251,113,133,0.55), rgba(255,255,255,0.7), rgba(251,113,133,0.55), transparent);
    background-size: 300px 100%;
    animation: pd-div-sweep 2.5s linear infinite;
}
.pd-card {
    background: ${P.surface};
    border: 1px solid ${P.border};
    border-radius: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px ${P.accentSoft};
    transition: box-shadow 0.25s, transform 0.25s;
}
.pd-card:hover {
    box-shadow: 0 4px 24px ${P.accentMid};
    transform: translateY(-1px);
}
.pd-dept-card {
    background: ${P.surface};
    border: 1px solid ${P.border};
    border-radius: 18px;
    padding: 20px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.22s cubic-bezier(0.34,1.1,0.64,1);
    text-align: left;
}
.pd-dept-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 36px ${P.accentMid};
    border-color: ${P.borderMid};
}
.pd-quick:hover { transform: translateY(-3px) scale(1.01); box-shadow: 0 12px 32px ${P.accentMid}; }
.pd-quick { transition: all 0.22s cubic-bezier(0.34,1.2,0.64,1); }
.pd-scroll::-webkit-scrollbar { width: 3px; }
.pd-scroll::-webkit-scrollbar-track { background: transparent; }
.pd-scroll::-webkit-scrollbar-thumb { background: ${P.inkFaint}; border-radius: 9px; }
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
    return <span className="pd-num">{val.toLocaleString()}</span>;
}

/* ─────────────────────────────────────────────────────
   Digital name — character drop-in
───────────────────────────────────────────────────── */
function DigitalName({ name }) {
    return (
        <span style={{ display:'inline-flex', alignItems:'baseline' }}>
            {(name || 'Principal').split('').map((ch, i) => (
                <span key={i} className="pd-name-char" style={{
                    animationDelay: `${0.3 + i * 0.05}s`,
                    fontFamily:"'DM Sans', sans-serif",
                    fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1,
                    letterSpacing: ch === ' ' ? '0.15em' : '-0.01em',
                }}>
                    {ch === ' ' ? '\u00A0' : ch}
                </span>
            ))}
        </span>
    );
}

/* ─────────────────────────────────────────────────────
   Live ticking clock
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
            <span className="pd-colon" style={{ fontFamily:"'DM Sans'", fontSize:30, fontWeight:700, color:'rgba(255,255,255,0.7)', lineHeight:1 }}>:</span>
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
            border:`1px solid ${P.border}`,
            boxShadow:`0 8px 24px ${P.accentSoft}`,
            fontFamily:"'DM Sans',sans-serif", fontSize:12,
        }}>
            <p style={{ fontWeight:700, color:P.ink, marginBottom:5, fontSize:11 }}>{label}</p>
            {payload.map((p,i)=>(
                <p key={i} style={{ color:p.color, fontWeight:500 }}>
                    {p.name}: <span style={{ color:P.inkMid, fontWeight:700 }}>{p.value}</span>
                </p>
            ))}
        </div>
    );
};

/* ─────────────────────────────────────────────────────
   Hero KPI card
───────────────────────────────────────────────────── */
function HeroKPI({ title, value, icon: Icon, accentClr, sub, loading, animClass }) {
    return (
        <div className={animClass} style={{
            background:'rgba(255,255,255,0.1)',
            backdropFilter:'blur(12px)',
            border:'1px solid rgba(255,255,255,0.16)',
            borderRadius:18, padding:'18px 20px',
            position:'relative', overflow:'hidden',
            transition:'all 0.22s cubic-bezier(0.34,1.2,0.64,1)', cursor:'default',
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
                    background:`${accentClr}18`, padding:'3px 9px', borderRadius:99, letterSpacing:'0.3px',
                }}>{sub}</span>
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
            <div style={{
                position:'absolute', bottom:-14, right:-14,
                width:60, height:60, borderRadius:'50%',
                background:`${accentClr}0e`, pointerEvents:'none',
            }}/>
        </div>
    );
}

/* ─────────────────────────────────────────────────────
   Gradient stat card
───────────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, colors, glow, sub, loading, to, animClass }) {
    const inner = (
        <div style={{
            position:'relative', overflow:'hidden', borderRadius:18, padding:'20px',
            background:`linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
            boxShadow:`0 8px 28px ${glow}`,
            transition:'transform 0.22s cubic-bezier(0.34,1.2,0.64,1), box-shadow 0.22s',
        }}
            onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-4px) scale(1.01)'; e.currentTarget.style.boxShadow=`0 16px 40px ${glow}`; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0) scale(1)'; e.currentTarget.style.boxShadow=`0 8px 28px ${glow}`; }}
        >
            <div style={{ position:'absolute', top:-24, right:-24, width:90, height:90, borderRadius:'50%', background:'rgba(255,255,255,0.12)', pointerEvents:'none' }}/>
            <div style={{ position:'absolute', bottom:-16, right:10, width:50, height:50, borderRadius:'50%', background:'rgba(255,255,255,0.07)', pointerEvents:'none' }}/>
            <div style={{ position:'relative' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                    <div style={{ width:38, height:38, borderRadius:11, background:'rgba(255,255,255,0.22)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Icon style={{ width:18, height:18, color:'#fff' }}/>
                    </div>
                    {to && <ArrowRight style={{ width:15, height:15, color:'rgba(255,255,255,0.5)' }}/>}
                </div>
                <p style={{ fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.65)', letterSpacing:'1px', textTransform:'uppercase', marginBottom:5 }}>{label}</p>
                <p style={{ fontFamily:"'DM Sans'", fontSize:32, fontWeight:800, color:'#fff', lineHeight:1, marginBottom:4 }}>
                    {loading
                        ? <span style={{ display:'inline-block', width:48, height:30, borderRadius:8, background:'rgba(255,255,255,0.2)' }}/>
                        : <AnimCounter to={typeof value === 'number' ? value : 0}/>
                    }
                </p>
                {sub && <p style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>{sub}</p>}
            </div>
        </div>
    );
    const wrapped = to
        ? <Link to={to} style={{ display:'block', textDecoration:'none' }}>{inner}</Link>
        : inner;
    return <div className={animClass}>{wrapped}</div>;
}

/* ─────────────────────────────────────────────────────
   Department card
───────────────────────────────────────────────────── */
function DeptCard({ dept, idx, onClick }) {
    const clr = CHART_COLORS[idx % CHART_COLORS.length];
    return (
        <button className="pd-dept-card" onClick={onClick} style={{ width:'100%', border:`1px solid ${P.border}`, animation:`pd-dept-in 0.4s ${idx*60}ms cubic-bezier(0.34,1.1,0.64,1) both`, opacity:0 }}>
            {/* Colored top stripe */}
            <div style={{
                position:'absolute', top:0, left:0, right:0, height:3,
                background:`linear-gradient(90deg, ${clr}, ${clr}aa)`,
                borderRadius:'18px 18px 0 0',
            }}/>

            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14, marginTop:8 }}>
                <div style={{
                    width:42, height:42, borderRadius:12,
                    background:`${clr}18`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    flexShrink:0,
                }}>
                    <span style={{ fontSize:16, fontWeight:800, color:clr, fontFamily:"'DM Sans'" }}>
                        {dept.shortId?.charAt(0) || dept.name?.charAt(0) || '?'}
                    </span>
                </div>
                <ChevronRight style={{ width:16, height:16, color:P.inkFaint, flexShrink:0, marginTop:4 }}/>
            </div>

            <p style={{ fontSize:14, fontWeight:700, color:P.ink, lineHeight:1.2, marginBottom:4 }}>
                {dept.name}
            </p>
            <p style={{ fontSize:11, color:P.inkLight, marginBottom:14 }}>
                {dept.hod_name ? `HOD: ${dept.hod_name}` : 'No HOD assigned'}
            </p>

            <div style={{ display:'flex', gap:16 }}>
                <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                    <span style={{ fontSize:18, fontWeight:800, color:clr, fontFamily:"'DM Sans'", lineHeight:1 }}>
                        {dept.teacher_count || 0}
                    </span>
                    <span style={{ fontSize:10, color:P.inkLight, fontWeight:500 }}>Teachers</span>
                </div>
                <div style={{ width:1, background:P.inkFaint }}/>
                <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                    <span style={{ fontSize:18, fontWeight:800, color:clr, fontFamily:"'DM Sans'", lineHeight:1 }}>
                        {dept.student_count || 0}
                    </span>
                    <span style={{ fontSize:10, color:P.inkLight, fontWeight:500 }}>Students</span>
                </div>
            </div>
        </button>
    );
}

/* ─────────────────────────────────────────────────────
   Principal Dashboard
───────────────────────────────────────────────────── */
export default function PrincipalDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data,    setData]    = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/principal/stats')
            .then(d=>setData(d))
            .catch(err=>console.error(err))
            .finally(()=>setLoading(false));
    }, []);

    const stats       = data?.stats       || {};
    const departments = data?.departments || [];
    const teachers    = data?.teachers    || [];
    const hods        = data?.hods        || [];

    /* ── Derived chart data ── */
    const deptCompare = useMemo(()=>
        departments.slice(0,8).map((d,i)=>({
            name: d.shortId || d.name?.slice(0,6),
            teachers: d.teacher_count||0,
            students: d.student_count||0,
        })),
    [departments]);

    const reportPie = useMemo(()=>[
        { name:'Approved', value:stats.approvedReports||0 },
        { name:'Pending',  value:stats.pendingReports||0  },
        { name:'Other',    value:Math.max(0,(stats.totalReports||0)-(stats.approvedReports||0)-(stats.pendingReports||0)) },
    ].filter(r=>r.value>0), [stats]);

    const now = new Date();

    return (
        <>
            <style>{CSS}</style>
            <DashboardLayout title="Principal Dashboard" subtitle={now.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}>
                <div className="pd" style={{ padding:'0 0 32px' }}>

                    {/* ── HERO BANNER ── */}
                    <div className="pd-hero" style={{
                        background:`linear-gradient(135deg, ${P.gradA} 0%, ${P.gradB} 40%, ${P.gradC} 75%, ${P.gradD} 100%)`,
                        borderRadius:28, padding:'32px 36px 28px',
                        marginBottom:24, position:'relative', overflow:'hidden',
                    }}>
                        {/* Dot grid */}
                        <div style={{
                            position:'absolute', inset:0, opacity:0.06, pointerEvents:'none',
                            backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
                            backgroundSize:'24px 24px',
                        }}/>
                        {/* Orbs */}
                        <div style={{
                            position:'absolute', top:-80, right:-60, width:280, height:280,
                            borderRadius:'50%', pointerEvents:'none',
                            background:'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 65%)',
                            animation:'pd-orb 14s ease-in-out infinite',
                        }}/>
                        <div style={{
                            position:'absolute', bottom:-50, right:220, width:160, height:160,
                            borderRadius:'50%', pointerEvents:'none',
                            background:'radial-gradient(circle, rgba(251,113,133,0.15) 0%, transparent 65%)',
                            animation:'pd-orb 10s ease-in-out infinite reverse',
                        }}/>

                        {/* Top row: name + clock */}
                        <div style={{
                            position:'relative',
                            display:'grid', gridTemplateColumns:'1fr auto',
                            gap:24, alignItems:'center', marginBottom:22,
                        }}>
                            <div>
                                {/* Principal badge pill */}
                                <div style={{
                                    display:'inline-flex', alignItems:'center', gap:7,
                                    background:'rgba(255,255,255,0.12)',
                                    border:'1px solid rgba(255,255,255,0.2)',
                                    borderRadius:99, padding:'5px 14px', marginBottom:14,
                                }}>
                                    <Shield style={{ width:13, height:13, color:'rgba(255,255,255,0.8)' }}/>
                                    <span style={{ color:'rgba(255,255,255,0.85)', fontSize:12.5, fontWeight:600, letterSpacing:'0.3px' }}>
                                        Principal — Institute Overview
                                    </span>
                                    <span className="pd-live" style={{
                                        width:7, height:7, borderRadius:'50%',
                                        background:'#fda4af', display:'inline-block', marginLeft:2,
                                    }}/>
                                </div>

                                {/* Digital animated name */}
                                <div style={{ marginBottom:10, display:'flex', alignItems:'center', gap:10 }}>
                                    <DigitalName name={user?.name || 'Principal'} />
                                    <span style={{ fontSize:32, lineHeight:1 }}>👋</span>
                                </div>

                                <p style={{
                                    color:'rgba(255,255,255,0.58)', fontSize:14, fontWeight:400,
                                    display:'flex', alignItems:'center', gap:8, flexWrap:'wrap',
                                }}>
                                    <span style={{ width:6, height:6, borderRadius:'50%', background:'#fda4af', display:'inline-block', flexShrink:0 }}/>
                                    {departments.length > 0
                                        ? `Overseeing ${departments.length} departments, ${stats.totalTeachers||0} teachers & ${stats.totalStudents||0} students`
                                        : 'Loading institute data…'
                                    }
                                    {(stats.pendingReports||0) > 0 && (
                                        <span style={{
                                            padding:'2px 8px', borderRadius:99,
                                            background:'rgba(239,68,68,0.25)',
                                            border:'1px solid rgba(239,68,68,0.35)',
                                            color:'#fca5a5', fontSize:11, fontWeight:700,
                                        }}>
                                            {stats.pendingReports} pending reports
                                        </span>
                                    )}
                                </p>
                            </div>

                            {/* Clock */}
                            <div style={{
                                background:'rgba(0,0,0,0.2)', backdropFilter:'blur(16px)',
                                borderRadius:20, padding:'20px 26px',
                                textAlign:'center', minWidth:160,
                                border:'1px solid rgba(255,255,255,0.12)',
                            }}>
                                <LiveClock/>
                                <div className="pd-div-line" style={{ margin:'10px 0 8px' }}/>
                                <p style={{ color:'rgba(255,255,255,0.45)', fontSize:11, fontWeight:500, letterSpacing:'0.3px' }}>
                                    {now.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}
                                </p>
                            </div>
                        </div>

                        {/* Sweep divider */}
                        <div className="pd-div-line" style={{ marginBottom:22 }}/>

                        {/* Hero KPI row */}
                        <div style={{ position:'relative', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
                            {[
                                { title:'Departments',  value:stats.totalDepartments,  icon:Building2,    accentClr:'#fda4af', sub:'Active',           l:loading },
                                { title:'Teachers',     value:stats.totalTeachers,     icon:Users,        accentClr:'#fde68a', sub:'Institute-wide',   l:loading },
                                { title:'Students',     value:stats.totalStudents,     icon:GraduationCap,accentClr:'#86efac', sub:'All enrolled',     l:loading },
                                { title:'Reports',      value:stats.totalReports,      icon:FileText,     accentClr:'#c4b5fd', sub:`${stats.approvedReports||0} approved`, l:loading },
                            ].map((k,i)=>(
                                <HeroKPI key={i} {...k} loading={k.l} animClass={`pd-kpi-${i}`}/>
                            ))}
                        </div>
                    </div>

                    {/* ── STAT CARDS ── */}
                    {/* <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
                        {[
                            { label:'Departments', value:stats.totalDepartments, icon:Building2,    colors:['#7f1d1d','#be123c'], glow:'rgba(190,18,60,0.28)',  to:'/principal/departments', sub:'Active departments',         animClass:'pd-s1' },
                            { label:'HODs',        value:stats.totalHODs,        icon:Layers,       colors:['#6d28d9','#7c3aed'], glow:'rgba(109,40,217,0.28)', to:'/principal/hods',        sub:'Heads of department',        animClass:'pd-s2' },
                            { label:'Teachers',    value:stats.totalTeachers,    icon:Users,        colors:['#059669','#10b981'], glow:'rgba(16,185,129,0.28)', to:'/principal/teachers',    sub:'Across all depts',           animClass:'pd-s3' },
                            { label:'Reports',     value:stats.totalReports,     icon:FileText,     colors:['#b45309','#d97706'], glow:'rgba(180,83,9,0.28)',   to:'/principal/reports',     sub:`${stats.approvedReports||0} approved`, animClass:'pd-s4' },
                        ].map(s=>(
                            <StatCard key={s.label} {...s} loading={loading}/>
                        ))}
                    </div> */}

                    {/* ── CHARTS ROW ── */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>

                        {/* Dept comparison bar */}
                        <div className="pd-card pd-s1" style={{ padding:26 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                                <div style={{ width:34, height:34, borderRadius:10, background:P.accentMid, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    <BarChart3 style={{ width:16, height:16, color:P.accent }}/>
                                </div>
                                <div>
                                    <p style={{ fontSize:15, fontWeight:700, color:P.ink, lineHeight:1 }}>Department Comparison</p>
                                    <p style={{ fontSize:11, color:P.inkLight, marginTop:2 }}>Teachers & students per dept</p>
                                </div>
                            </div>
                            {loading ? <div className="pd-skel" style={{ height:220 }}/> : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={deptCompare} margin={{top:4,right:4,bottom:4,left:-20}}>
                                        <defs>
                                            <linearGradient id="pdTeacher" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={P.accent}     stopOpacity={1}/>
                                                <stop offset="100%" stopColor={P.accentDark} stopOpacity={0.6}/>
                                            </linearGradient>
                                            <linearGradient id="pdStudent" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#059669" stopOpacity={1}/>
                                                <stop offset="100%" stopColor="#047857" stopOpacity={0.6}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={P.inkFaint}/>
                                        <XAxis dataKey="name" tick={{ fontSize:10, fill:P.inkLight }} axisLine={false} tickLine={false}/>
                                        <YAxis tick={{ fontSize:10, fill:P.inkLight }} axisLine={false} tickLine={false}/>
                                        <Tooltip content={<CustomTooltip/>}/>
                                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:10, fontFamily:"'DM Sans'" }}/>
                                        <Bar dataKey="teachers" name="Teachers" fill="url(#pdTeacher)" radius={[6,6,0,0]} maxBarSize={20}/>
                                        <Bar dataKey="students" name="Students" fill="url(#pdStudent)" radius={[6,6,0,0]} maxBarSize={20}/>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Report status pie */}
                        <div className="pd-card pd-s2" style={{ padding:26 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                                <div style={{ width:34, height:34, borderRadius:10, background:P.accentMid, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    <FileText style={{ width:16, height:16, color:P.accent }}/>
                                </div>
                                <div>
                                    <p style={{ fontSize:15, fontWeight:700, color:P.ink, lineHeight:1 }}>Report Status</p>
                                    <p style={{ fontSize:11, color:P.inkLight, marginTop:2 }}>Approval pipeline overview</p>
                                </div>
                            </div>
                            {loading ? <div className="pd-skel" style={{ height:220 }}/> : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={reportPie} cx="50%" cy="50%" outerRadius={82} innerRadius={36} dataKey="value" paddingAngle={4}>
                                            {reportPie.map((_,i)=><Cell key={i} fill={[P.accent,'#f59e0b','#6d28d9'][i%3]}/>)}
                                        </Pie>
                                        <Tooltip formatter={(v,n)=>[`${v} reports`,n]}/>
                                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:10, fontFamily:"'DM Sans'" }}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            )}

                            {/* Mini summary pills */}
                            {!loading && (
                                <div style={{ display:'flex', gap:8, marginTop:16, flexWrap:'wrap' }}>
                                    {[
                                        { label:'Approved', value:stats.approvedReports||0, color:'#059669', bg:'rgba(5,150,105,0.08)' },
                                        { label:'Pending',  value:stats.pendingReports||0,  color:P.accent,  bg:P.accentSoft },
                                        { label:'Total',    value:stats.totalReports||0,     color:P.inkMid,  bg:P.accentSoft },
                                    ].map(pill=>(
                                        <div key={pill.label} style={{
                                            flex:1, minWidth:60, padding:'7px 10px', borderRadius:10,
                                            background:pill.bg, textAlign:'center',
                                        }}>
                                            <p style={{ fontSize:16, fontWeight:800, color:pill.color, fontFamily:"'DM Sans'", lineHeight:1, marginBottom:3 }}>
                                                {pill.value}
                                            </p>
                                            <p style={{ fontSize:10, color:P.inkLight, fontWeight:500 }}>{pill.label}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── DEPARTMENT CARDS GRID ── */}
                    <div className="pd-s3" style={{ marginBottom:20 }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                <div style={{ width:34, height:34, borderRadius:10, background:P.accentMid, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    <Building2 style={{ width:16, height:16, color:P.accent }}/>
                                </div>
                                <div>
                                    <p style={{ fontSize:15, fontWeight:700, color:P.ink, lineHeight:1 }}>Departments</p>
                                    <p style={{ fontSize:11, color:P.inkLight, marginTop:2 }}>{departments.length} active departments</p>
                                </div>
                            </div>
                            <Link to="/principal/departments" style={{
                                display:'flex', alignItems:'center', gap:5,
                                fontSize:12, fontWeight:600, color:P.accent,
                                textDecoration:'none', padding:'5px 10px',
                                borderRadius:8, background:P.accentSoft,
                            }}>
                                View all <ArrowRight style={{ width:13, height:13 }}/>
                            </Link>
                        </div>

                        {loading ? (
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                                {[1,2,3].map(i=>(
                                    <div key={i} className="pd-skel" style={{ height:148 }}/>
                                ))}
                            </div>
                        ) : (
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                                {departments.slice(0,6).map((dept,i)=>(
                                    <DeptCard
                                        key={dept.id} dept={dept} idx={i}
                                        onClick={()=>navigate(`/principal/departments/${dept.id}`)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── QUICK ACTIONS ── */}
                    <div className="pd-s4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
                        {[
                            { to:'/principal/teachers',        label:'All Teachers',  icon:Users,        clr:['#7f1d1d','#be123c'], glow:'rgba(190,18,60,0.3)'   },
                            { to:'/principal/hods',            label:'HODs',           icon:Layers,       clr:['#6d28d9','#7c3aed'], glow:'rgba(109,40,217,0.3)' },
                            { to:'/principal/reports',         label:'Reports',        icon:FileText,     clr:['#059669','#10b981'], glow:'rgba(16,185,129,0.3)' },
                            { to:'/principal/attendance-risk', label:'Risk Monitor',   icon:Activity,     clr:['#b45309','#d97706'], glow:'rgba(180,83,9,0.3)'   },
                        ].map(a=>(
                            <Link key={a.to} to={a.to} style={{ textDecoration:'none' }}>
                                <div className="pd-quick" style={{
                                    display:'flex', alignItems:'center', gap:12,
                                    padding:'16px 18px', borderRadius:16,
                                    background:`linear-gradient(135deg, ${a.clr[0]} 0%, ${a.clr[1]} 100%)`,
                                    boxShadow:`0 6px 20px ${a.glow}`, cursor:'pointer',
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
            </DashboardLayout>
        </>
    );
}