import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../lib/api.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import {
    Users, GraduationCap, FileText, BarChart2, ArrowRight, Send,
    BookOpen, Calendar, Activity, TrendingUp, TrendingDown, Minus,
    Building2, Star, AlertTriangle, CheckCircle2, Clock, Layers,
    Shield, Zap, Sun
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';

/* ─────────────────────────────────────────────────────
   HOD amber/orange theme — mirrors Sidebar ROLE_THEMES.hod
───────────────────────────────────────────────────── */
const H = {
    bg:         '#fdfaf5',
    surface:    '#ffffff',
    surfaceHov: '#fdf5e8',
    border:     'rgba(180,83,9,0.1)',
    borderMid:  'rgba(180,83,9,0.18)',

    accent:     '#b45309',
    accentDark: '#78350f',
    accentSoft: 'rgba(180,83,9,0.08)',
    accentMid:  'rgba(180,83,9,0.15)',
    accentGlow: 'rgba(180,83,9,0.22)',
    accentLt:   '#fef3c7',

    ink:        '#1c150a',
    inkMid:     '#4a3a1a',
    inkLight:   '#a08060',
    inkFaint:   '#e8dcc8',

    gradA:      '#78350f',
    gradB:      '#b45309',
    gradC:      '#d97706',
    gradD:      '#fbbf24',
};

/* Vibrant multi-color chart palette */
const CHART_COLORS = [
    '#b45309','#6d28d9','#10b981','#ef4444',
    '#38bdf8','#f97316','#a78bfa','#fb7185',
];

/* ─────────────────────────────────────────────────────
   Global CSS
───────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');

.hd * { box-sizing: border-box; margin: 0; padding: 0; }
.hd { font-family: 'DM Sans', sans-serif; background: ${H.bg}; min-height: 100vh; color: ${H.ink}; }

@keyframes hd-up {
    from { opacity:0; transform:translateY(20px) scale(0.97); }
    to   { opacity:1; transform:translateY(0)    scale(1);   }
}
@keyframes hd-num-pop {
    0%   { transform:scale(0.6) translateY(10px); opacity:0; }
    65%  { transform:scale(1.1) translateY(-2px); opacity:1; }
    100% { transform:scale(1)   translateY(0);    opacity:1; }
}
@keyframes hd-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
}
@keyframes hd-bar-grow {
    from { width: 0; }
    to   { width: var(--w, 100%); }
}
@keyframes hd-float {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(-5px); }
}
@keyframes hd-orb {
    0%,100%{ transform:translate(0,0) scale(1); }
    33%    { transform:translate(16px,-14px) scale(1.05); }
    66%    { transform:translate(-10px,9px) scale(0.96); }
}
@keyframes hd-colon-blink {
    0%,49%  { opacity:1; }
    50%,99% { opacity:0.25; }
}
@keyframes hd-char-in {
    from { opacity:0; transform:translateY(-10px) scaleY(1.3); filter:blur(3px); }
    to   { opacity:1; transform:translateY(0)      scaleY(1);   filter:blur(0); }
}
@keyframes hd-kpi-in {
    from { opacity:0; transform:translateY(16px) scale(0.93); }
    to   { opacity:1; transform:translateY(0)    scale(1); }
}
@keyframes hd-badge-pop {
    0%  { transform: scale(0) rotate(-15deg); }
    65% { transform: scale(1.2) rotate(4deg); }
    100%{ transform: scale(1)   rotate(0); }
}
@keyframes hd-live-pulse {
    0%,100%{ box-shadow: 0 0 0 0 rgba(251,191,36,0.6); }
    50%    { box-shadow: 0 0 0 6px rgba(251,191,36,0); }
}
@keyframes hd-div-sweep {
    from { background-position: -300px 0; }
    to   { background-position:  300px 0; }
}
@keyframes hd-scale {
    from { opacity:0; transform:scale(0.92); }
    to   { opacity:1; transform:scale(1); }
}

.hd-hero   { animation: hd-up    0.6s cubic-bezier(0.34,1.2,0.64,1) both; }
.hd-s1     { animation: hd-up    0.5s 0.08s cubic-bezier(0.34,1.1,0.64,1) both; }
.hd-s2     { animation: hd-up    0.5s 0.14s cubic-bezier(0.34,1.1,0.64,1) both; }
.hd-s3     { animation: hd-up    0.5s 0.20s cubic-bezier(0.34,1.1,0.64,1) both; }
.hd-s4     { animation: hd-up    0.5s 0.26s cubic-bezier(0.34,1.1,0.64,1) both; }
.hd-s5     { animation: hd-up    0.5s 0.32s cubic-bezier(0.34,1.1,0.64,1) both; }
.hd-s6     { animation: hd-up    0.5s 0.38s cubic-bezier(0.34,1.1,0.64,1) both; }

.hd-kpi-0  { animation: hd-kpi-in 0.4s 0.55s cubic-bezier(0.34,1.3,0.64,1) both; }
.hd-kpi-1  { animation: hd-kpi-in 0.4s 0.63s cubic-bezier(0.34,1.3,0.64,1) both; }
.hd-kpi-2  { animation: hd-kpi-in 0.4s 0.71s cubic-bezier(0.34,1.3,0.64,1) both; }
.hd-kpi-3  { animation: hd-kpi-in 0.4s 0.79s cubic-bezier(0.34,1.3,0.64,1) both; }

.hd-num    { animation: hd-num-pop 0.5s 0.4s cubic-bezier(0.34,1.56,0.64,1) both; display:inline-block; }
.hd-float  { animation: hd-float  3.5s ease-in-out infinite; }
.hd-badge  { animation: hd-badge-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }
.hd-live   { animation: hd-live-pulse 2s ease-in-out infinite; }

.hd-name-char {
    display: inline-block;
    opacity: 0;
    animation: hd-char-in 0.4s cubic-bezier(0.22,1,0.36,1) forwards;
}
.hd-colon { animation: hd-colon-blink 1s step-end infinite; }

.hd-skel {
    background: linear-gradient(90deg, ${H.accentLt} 25%, #fffbf0 50%, ${H.accentLt} 75%);
    background-size: 400px 100%;
    animation: hd-shimmer 1.6s infinite linear;
    border-radius: 10px;
}
.hd-div-line {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(251,191,36,0.55), rgba(255,255,255,0.7), rgba(251,191,36,0.55), transparent);
    background-size: 300px 100%;
    animation: hd-div-sweep 2.5s linear infinite;
}
.hd-card {
    background: ${H.surface};
    border: 1px solid ${H.border};
    border-radius: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px ${H.accentSoft};
    transition: box-shadow 0.25s, transform 0.25s;
}
.hd-card:hover {
    box-shadow: 0 4px 24px ${H.accentMid};
    transform: translateY(-1px);
}
.hd-tr:hover { background: ${H.surfaceHov}; }
.hd-tr { transition: background 0.15s; }
.hd-scroll::-webkit-scrollbar { width: 3px; height: 3px; }
.hd-scroll::-webkit-scrollbar-track { background: transparent; }
.hd-scroll::-webkit-scrollbar-thumb { background: ${H.inkFaint}; border-radius: 9px; }
.hd-quick:hover { transform: translateY(-3px) scale(1.01); box-shadow: 0 12px 32px ${H.accentMid}; }
.hd-quick { transition: all 0.22s cubic-bezier(0.34,1.2,0.64,1); }
.hd-teacher-row:hover { background: ${H.surfaceHov}; border-color: ${H.borderMid}; }
.hd-teacher-row { transition: all 0.18s; }
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
    return <span className="hd-num">{val.toLocaleString()}</span>;
}

/* ─────────────────────────────────────────────────────
   Digital name — character drop-in
───────────────────────────────────────────────────── */
function DigitalName({ name }) {
    return (
        <span style={{ display:'inline-flex', alignItems:'baseline' }}>
            {(name || 'HOD').split('').map((ch, i) => (
                <span key={i} className="hd-name-char" style={{
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
            <span className="hd-colon" style={{ fontFamily:"'DM Sans'", fontSize:30, fontWeight:700, color:'rgba(255,255,255,0.7)', lineHeight:1 }}>:</span>
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
            border:`1px solid ${H.border}`,
            boxShadow:`0 8px 24px ${H.accentSoft}`,
            fontFamily:"'DM Sans',sans-serif", fontSize:12,
        }}>
            <p style={{ fontWeight:700, color:H.ink, marginBottom:5, fontSize:11 }}>{label}</p>
            {payload.map((p,i)=>(
                <p key={i} style={{ color:p.color, fontWeight:500 }}>
                    {p.name}: <span style={{ color:H.inkMid, fontWeight:700 }}>{p.value}</span>
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
                    background:`${accentClr}18`, padding:'3px 9px', borderRadius:99,
                    letterSpacing:'0.3px',
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
   Gradient stat card (below hero)
───────────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, colors, glow, sub, loading, to, animClass }) {
    const inner = (
        <div style={{
            position:'relative', overflow:'hidden',
            borderRadius:18, padding:'20px',
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
   HOD Dashboard
───────────────────────────────────────────────────── */
export default function HODDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [dashData,   setDashData]   = useState(null);
    const [students,   setStudents]   = useState([]);
    const [teachers,   setTeachers]   = useState([]);
    const [reports,    setReports]    = useState([]);
    const [offerings,  setOfferings]  = useState([]);
    const [perfData,   setPerfData]   = useState([]);
    const [loading,    setLoading]    = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [dash, studs, tchs, reps, offs] = await Promise.all([
                    api.get('/hod/dashboard').catch(()=>null),
                    api.get('/students').catch(()=>[]),
                    api.get('/hod/teachers').catch(()=>[]),
                    api.get('/reports').catch(()=>[]),
                    api.get('/subjects/offerings').catch(()=>[]),
                ]);
                setDashData(dash);
                setStudents(Array.isArray(studs) ? studs : []);
                setTeachers(Array.isArray(tchs)  ? tchs  : []);
                setReports(Array.isArray(reps)   ? reps  : []);
                setOfferings(Array.isArray(offs) ? offs  : []);

                // Fetch performance leaderboard
                const dId = dash?.departmentId || user?.departmentId;
                if (dId) {
                    const perf = await api.get(`/teacher-performance/department/${dId}`).catch(()=>[]);
                    setPerfData(Array.isArray(perf) ? perf : []);
                }
            } catch(e){ console.error(e); }
            finally { setLoading(false); }
        })();
    }, [user?.departmentId]);

    /* ── Derived data ── */
    const yearData = useMemo(()=>{
        const counts = {1:0,2:0,3:0,4:0};
        students.forEach(s=>{
            const y = s.enrollments?.[0]?.year || s.year;
            if(y>=1&&y<=4) counts[y]++;
        });
        return [
            {name:'1st Yr',students:counts[1]},
            {name:'2nd Yr',students:counts[2]},
            {name:'3rd Yr',students:counts[3]},
            {name:'4th Yr',students:counts[4]},
        ];
    },[students]);

    const sectionData = useMemo(()=>{
        const map={};
        students.forEach(s=>{
            const sec = s.enrollments?.[0]?.section || s.section || 'A';
            map[sec] = (map[sec]||0)+1;
        });
        return Object.entries(map).map(([name,value])=>({name:`Sec ${name}`,value}));
    },[students]);

    const topTeachers = useMemo(() => {
        return [...perfData]
            .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
            .slice(0, 5);
    }, [perfData]);

    const teacherWorkload = useMemo(()=>
        teachers.slice(0,6).map(t=>({
            name:(t.full_name||t.fullName||'Teacher').split(' ')[0],
            subjects: t.subject_count||0,
            students: t.student_count||0,
        })),
    [teachers]);

    const atRisk = useMemo(()=>
        students.filter(s=>{
            const monthly = s.monthly||[];
            if(!monthly.length) return false;
            const avg = monthly.reduce((sum,m)=>sum+m.percentage,0)/monthly.length;
            return avg < 75;
        }).length,
    [students]);

    const pendingReports = useMemo(()=>
        reports.filter(r=>r.status==='submitted_to_hod'||r.status==='submitted').length,
    [reports]);

    const deptName = dashData?.department || user?.department || '—';
    const now = new Date();

    const STATUS_STYLE = {
        draft:                  { bg:'rgba(180,83,9,0.08)',   color:'#78350f' },
        submitted:              { bg:'rgba(56,189,248,0.1)',  color:'#0284c7' },
        submitted_to_hod:       { bg:'rgba(245,158,11,0.1)',  color:'#b45309' },
        submitted_to_principal: { bg:'rgba(109,40,217,0.1)',  color:'#6d28d9' },
        approved:               { bg:'rgba(16,185,129,0.1)',  color:'#059669' },
    };

    return (
        <>
            <style>{CSS}</style>
            <DashboardLayout title="HOD Dashboard" subtitle={deptName}>
                <div className="hd" style={{ padding:'0 0 32px' }}>

                    {/* ── HERO BANNER ── */}
                    <div className="hd-hero" style={{
                        background:`linear-gradient(135deg, ${H.gradA} 0%, ${H.gradB} 40%, ${H.gradC} 75%, ${H.gradD} 100%)`,
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
                            animation:'hd-orb 14s ease-in-out infinite',
                        }}/>
                        <div style={{
                            position:'absolute', bottom:-50, right:220, width:160, height:160,
                            borderRadius:'50%', pointerEvents:'none',
                            background:'radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 65%)',
                            animation:'hd-orb 10s ease-in-out infinite reverse',
                        }}/>

                        {/* Top row: name + clock */}
                        <div style={{
                            position:'relative',
                            display:'grid', gridTemplateColumns:'1fr auto',
                            gap:24, alignItems:'center', marginBottom:22,
                        }}>
                            <div>
                                {/* HOD badge pill */}
                                <div style={{
                                    display:'inline-flex', alignItems:'center', gap:7,
                                    background:'rgba(255,255,255,0.12)',
                                    border:'1px solid rgba(255,255,255,0.2)',
                                    borderRadius:99, padding:'5px 14px', marginBottom:14,
                                }}>
                                    <Building2 style={{ width:13, height:13, color:'rgba(255,255,255,0.8)' }}/>
                                    <span style={{ color:'rgba(255,255,255,0.85)', fontSize:12.5, fontWeight:600, letterSpacing:'0.3px' }}>
                                        {deptName} — HOD
                                    </span>
                                    <span className="hd-live" style={{
                                        width:7, height:7, borderRadius:'50%',
                                        background:'#fde68a', display:'inline-block', marginLeft:2,
                                    }}/>
                                </div>

                                {/* Digital animated name */}
                                <div style={{ marginBottom:10, display:'flex', alignItems:'center', gap:10 }}>
                                    <DigitalName name={user?.name || 'HOD'} />
                                    <span style={{ fontSize:32, lineHeight:1 }}>👋</span>
                                </div>

                                <p style={{
                                    color:'rgba(255,255,255,0.58)', fontSize:14, fontWeight:400,
                                    display:'flex', alignItems:'center', gap:8,
                                }}>
                                    <span style={{ width:6, height:6, borderRadius:'50%', background:'#fde68a', display:'inline-block', flexShrink:0 }}/>
                                    {students.length > 0
                                        ? `Overseeing ${students.length} students & ${teachers.length} teachers`
                                        : 'Loading department data…'
                                    }
                                    {pendingReports > 0 && (
                                        <span style={{
                                            marginLeft:4, padding:'2px 8px', borderRadius:99,
                                            background:'rgba(239,68,68,0.25)',
                                            border:'1px solid rgba(239,68,68,0.35)',
                                            color:'#fca5a5', fontSize:11, fontWeight:700,
                                        }}>
                                            {pendingReports} pending reports
                                        </span>
                                    )}
                                </p>
                            </div>

                            {/* Clock */}
                            <div style={{
                                background:'rgba(0,0,0,0.2)',
                                backdropFilter:'blur(16px)',
                                borderRadius:20, padding:'20px 26px',
                                textAlign:'center', minWidth:160,
                                border:'1px solid rgba(255,255,255,0.12)',
                            }}>
                                <LiveClock/>
                                <div className="hd-div-line" style={{ margin:'10px 0 8px' }}/>
                                <p style={{ color:'rgba(255,255,255,0.45)', fontSize:11, fontWeight:500, letterSpacing:'0.3px' }}>
                                    {now.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}
                                </p>
                            </div>
                        </div>

                        {/* Sweep divider */}
                        <div className="hd-div-line" style={{ marginBottom:22 }}/>

                        {/* Hero KPI row */}
                        <div style={{ position:'relative', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
                            {[
                                { title:'Teachers',       value:dashData?.totalTeachers ?? teachers.length,  icon:Users,        accentClr:'#fde68a', to:'/hod/teachers', sub:'In dept',      l:loading },
                                { title:'Students',       value:dashData?.totalStudents ?? students.length,  icon:GraduationCap,accentClr:'#86efac', to:'/hod/students', sub:'Enrolled',     l:loading },
                                { title:'Subjects',       value:dashData?.totalSubjects ?? offerings.length, icon:BookOpen,     accentClr:'#c4b5fd', to:'/hod/subjects', sub:'Active',       l:loading },
                                { title:'Reports',        value:reports.length,                                      icon:FileText,accentClr:'#fca5a5', to:'/hod/reports', sub:'Reports',l:loading },
                            ].map((k,i)=>(
                                <HeroKPI key={i} {...k} loading={k.l} animClass={`hd-kpi-${i}`}/>
                            ))}
                        </div>
                    </div>

                    {/* ── STAT CARDS ── */}
                    {/* <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
                        {[
                            { label:'Teachers',  value:dashData?.totalTeachers ?? teachers.length, icon:Users,        colors:['#78350f','#b45309'], glow:'rgba(180,83,9,0.28)',  to:'/hod/teachers',   sub:'In your dept',           animClass:'hd-s1' },
                            { label:'Students',  value:dashData?.totalStudents ?? students.length, icon:GraduationCap,colors:['#059669','#10b981'], glow:'rgba(16,185,129,0.28)',to:'/hod/students',   sub:'Enrolled students',       animClass:'hd-s2' },
                            { label:'Subjects',  value:dashData?.totalSubjects ?? offerings.length,icon:BookOpen,     colors:['#6d28d9','#7c3aed'], glow:'rgba(109,40,217,0.28)',to:undefined,         sub:'Active this semester',    animClass:'hd-s3' },
                            { label:'Reports',   value:reports.length,                             icon:FileText,     colors:['#be123c','#e11d48'], glow:'rgba(190,18,60,0.28)', to:'/hod/reports',    sub:`${pendingReports} pending`,animClass:'hd-s4' },
                        ].map(s=>(
                            <StatCard key={s.label} {...s} loading={loading}/>
                        ))}
                    </div> */}

                    {/* ── CHARTS ROW ── */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20, marginBottom:20 }}>

                        {/* Students by Year */}
                        <div className="hd-card hd-s1" style={{ padding:26 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                                <div style={{ width:34, height:34, borderRadius:10, background:H.accentMid, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    <BarChart2 style={{ width:16, height:16, color:H.accent }}/>
                                </div>
                                <div>
                                    <p style={{ fontSize:15, fontWeight:700, color:H.ink, lineHeight:1 }}>Students by Year</p>
                                    <p style={{ fontSize:11, color:H.inkLight, marginTop:2 }}>{students.length} total enrolled</p>
                                </div>
                            </div>
                            {loading ? <div className="hd-skel" style={{ height:200 }}/> : (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={yearData} margin={{top:4,right:4,bottom:4,left:-20}}>
                                        <defs>
                                            {CHART_COLORS.map((c,i)=>(
                                                <linearGradient key={i} id={`hdg${i}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%"   stopColor={c} stopOpacity={1}/>
                                                    <stop offset="100%" stopColor={c} stopOpacity={0.5}/>
                                                </linearGradient>
                                            ))}
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={H.inkFaint}/>
                                        <XAxis dataKey="name" tick={{ fontSize:10, fill:H.inkLight }} axisLine={false} tickLine={false}/>
                                        <YAxis tick={{ fontSize:10, fill:H.inkLight }} axisLine={false} tickLine={false}/>
                                        <Tooltip content={<CustomTooltip/>}/>
                                        <Bar dataKey="students" name="Students" radius={[8,8,0,0]} maxBarSize={52}>
                                            {yearData.map((_,i)=><Cell key={i} fill={`url(#hdg${i%CHART_COLORS.length})`}/>)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Teacher Leaderboard */}
                        <div className="hd-card hd-s2" style={{ padding:26 }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                    <div style={{ width:34, height:34, borderRadius:10, background:H.accentMid, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                        <Star style={{ width:16, height:16, color:H.accent }}/>
                                    </div>
                                    <div>
                                        <p style={{ fontSize:15, fontWeight:700, color:H.ink, lineHeight:1 }}>Top Performers</p>
                                        <p style={{ fontSize:11, color:H.inkLight, marginTop:2 }}>Teacher Leaderboard</p>
                                    </div>
                                </div>
                                <Link to="/hod/teacher-performance" style={{ fontSize:11, fontWeight:700, color:H.accent, textDecoration:'none' }}>Details</Link>
                            </div>
                            
                            {loading ? [1,2,3,4].map(i => <div key={i} className="hd-skel" style={{ height:40, marginBottom:8 }}/>) : topTeachers.length > 0 ? (
                                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                                    {topTeachers.map((t, idx) => (
                                        <div key={t.id} style={{ 
                                            display:'flex', alignItems:'center', gap:12, 
                                            padding:'8px 12px', borderRadius:14,
                                            background: idx === 0 ? `${H.accentSoft}` : 'transparent',
                                            border: idx === 0 ? `1px solid ${H.accentMid}` : `1px solid transparent`
                                        }}>
                                            <div style={{
                                                width:24, height:24, borderRadius:'50%', 
                                                background: idx === 0 ? H.accent : idx === 1 ? '#94a3b8' : idx === 2 ? '#b4530988' : '#f1f5f9',
                                                display:'flex', alignItems:'center', justifyContent:'center',
                                                fontSize:11, fontWeight:800, color: idx < 3 ? '#fff' : '#64748b',
                                                flexShrink:0
                                            }}>
                                                {idx + 1}
                                            </div>
                                            <div style={{ flex:1, minWidth:0 }}>
                                                <p style={{ fontSize:13, fontWeight:600, color:H.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                                                    {t.fullName}
                                                </p>
                                            </div>
                                            <div style={{ textAlign:'right' }}>
                                                <p style={{ fontSize:14, fontWeight:800, color:H.accent }}>{t.performanceScore}</p>
                                                <p style={{ fontSize:9, fontWeight:700, color:H.inkLight, textTransform:'uppercase', letterSpacing:'0.5px' }}>Score</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:H.inkLight, fontSize:13 }}>
                                    No data available
                                </div>
                            )}
                        </div>

                        {/* Teacher Workload */}
                        <div className="hd-card hd-s3" style={{ padding:26 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                                <div style={{ width:34, height:34, borderRadius:10, background:H.accentMid, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    <Activity style={{ width:16, height:16, color:H.accent }}/>
                                </div>
                                <div>
                                    <p style={{ fontSize:15, fontWeight:700, color:H.ink, lineHeight:1 }}>Teacher Workload</p>
                                    <p style={{ fontSize:11, color:H.inkLight, marginTop:2 }}>Subjects & students per teacher</p>
                                </div>
                            </div>
                            {loading ? <div className="hd-skel" style={{ height:200 }}/> : teacherWorkload.length > 0 ? (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={teacherWorkload} margin={{top:4,right:4,bottom:4,left:-20}}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={H.inkFaint}/>
                                        <XAxis dataKey="name" tick={{ fontSize:10, fill:H.inkLight }} axisLine={false} tickLine={false}/>
                                        <YAxis tick={{ fontSize:10, fill:H.inkLight }} axisLine={false} tickLine={false}/>
                                        <Tooltip content={<CustomTooltip/>}/>
                                        <Bar dataKey="subjects" name="Subjects" fill={H.accent}     radius={[6,6,0,0]} maxBarSize={18}/>
                                        <Bar dataKey="students" name="Students" fill={CHART_COLORS[2]} radius={[6,6,0,0]} maxBarSize={18}/>
                                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:10, fontFamily:"'DM Sans'" }}/>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:H.inkLight, fontSize:13 }}>
                                    No teacher data
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── BOTTOM ROW: teachers + reports ── */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>

                        {/* Teachers list */}
                        <div className="hd-card hd-s4" style={{ padding:26 }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                    <div style={{ width:32, height:32, borderRadius:9, background:H.accentMid, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                        <Users style={{ width:15, height:15, color:H.accent }}/>
                                    </div>
                                    <div>
                                        <p style={{ fontSize:14, fontWeight:700, color:H.ink, lineHeight:1 }}>Department Teachers</p>
                                        <p style={{ fontSize:11, color:H.inkLight, marginTop:2 }}>{teachers.length} members</p>
                                    </div>
                                </div>
                                <Link to="/hod/teachers" style={{
                                    display:'flex', alignItems:'center', gap:5,
                                    fontSize:12, fontWeight:600, color:H.accent,
                                    textDecoration:'none', padding:'5px 10px',
                                    borderRadius:8, background:H.accentSoft,
                                    transition:'all 0.15s',
                                }}>
                                    View all <ArrowRight style={{ width:13, height:13 }}/>
                                </Link>
                            </div>
                            <div className="hd-scroll" style={{ maxHeight:280, overflowY:'auto', display:'flex', flexDirection:'column', gap:6 }}>
                                {loading ? [1,2,3].map(i=>(
                                    <div key={i} className="hd-skel" style={{ height:52 }}/>
                                )) : teachers.slice(0,6).map((t,i)=>(
                                    <button key={t.user_id||i}
                                        onClick={()=>navigate(`/hod/teachers/${t.user_id}`)}
                                        className="hd-teacher-row"
                                        style={{
                                            width:'100%', display:'flex', alignItems:'center', gap:12,
                                            padding:'10px 12px', borderRadius:12,
                                            border:`1px solid ${H.border}`,
                                            background:'transparent', cursor:'pointer',
                                            textAlign:'left',
                                        }}
                                    >
                                        <div style={{
                                            width:36, height:36, borderRadius:10, flexShrink:0,
                                            background:`${CHART_COLORS[i%CHART_COLORS.length]}18`,
                                            display:'flex', alignItems:'center', justifyContent:'center',
                                        }}>
                                            <span style={{
                                                fontSize:14, fontWeight:800,
                                                color:CHART_COLORS[i%CHART_COLORS.length],
                                                fontFamily:"'DM Sans'",
                                            }}>
                                                {(t.full_name||'T').charAt(0)}
                                            </span>
                                        </div>
                                        <div style={{ flex:1, minWidth:0 }}>
                                            <p style={{ fontSize:13, fontWeight:600, color:H.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                                {t.full_name}
                                            </p>
                                            <p style={{ fontSize:10.5, color:H.inkLight, marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                                {t.email}
                                            </p>
                                        </div>
                                        <div style={{ textAlign:'right', flexShrink:0 }}>
                                            <p style={{ fontSize:12, fontWeight:700, color:H.accent }}>{t.subject_count||0} subj</p>
                                            <p style={{ fontSize:10, color:H.inkLight }}>{t.student_count||0} stu</p>
                                        </div>
                                        <ArrowRight style={{ width:13, height:13, color:H.inkFaint, flexShrink:0 }}/>
                                    </button>
                                ))}
                                {teachers.length===0 && !loading && (
                                    <div style={{ textAlign:'center', padding:'32px 0', color:H.inkLight, fontSize:13 }}>No teachers found</div>
                                )}
                            </div>
                        </div>

                        {/* Reports list */}
                        <div className="hd-card hd-s5" style={{ padding:26 }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                    <div style={{ width:32, height:32, borderRadius:9, background:H.accentMid, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                        <FileText style={{ width:15, height:15, color:H.accent }}/>
                                    </div>
                                    <div>
                                        <p style={{ fontSize:14, fontWeight:700, color:H.ink, lineHeight:1 }}>Recent Reports</p>
                                        <p style={{ fontSize:11, color:H.inkLight, marginTop:2 }}>
                                            {pendingReports > 0
                                                ? <span style={{ color:'#ef4444', fontWeight:600 }}>{pendingReports} pending review</span>
                                                : `${reports.length} total`
                                            }
                                        </p>
                                    </div>
                                </div>
                                <Link to="/hod/reports" style={{
                                    display:'flex', alignItems:'center', gap:5,
                                    fontSize:12, fontWeight:600, color:H.accent,
                                    textDecoration:'none', padding:'5px 10px',
                                    borderRadius:8, background:H.accentSoft,
                                }}>
                                    View all <ArrowRight style={{ width:13, height:13 }}/>
                                </Link>
                            </div>
                            <div className="hd-scroll" style={{ maxHeight:280, overflowY:'auto', display:'flex', flexDirection:'column', gap:6 }}>
                                {loading ? [1,2,3].map(i=>(
                                    <div key={i} className="hd-skel" style={{ height:52 }}/>
                                )) : reports.slice(0,6).map((r,i)=>{
                                    const s = STATUS_STYLE[r.status] || { bg:H.accentSoft, color:H.accent };
                                    return (
                                        <div key={r.id} className="hd-tr" style={{
                                            display:'flex', alignItems:'center', gap:12,
                                            padding:'10px 12px', borderRadius:12,
                                            border:`1px solid ${H.border}`,
                                        }}>
                                            <div style={{
                                                width:34, height:34, borderRadius:9, flexShrink:0,
                                                background:H.accentSoft,
                                                display:'flex', alignItems:'center', justifyContent:'center',
                                            }}>
                                                <FileText style={{ width:15, height:15, color:H.accent }}/>
                                            </div>
                                            <div style={{ flex:1, minWidth:0 }}>
                                                <p style={{ fontSize:12.5, fontWeight:600, color:H.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                                    {r.title}
                                                </p>
                                                <p style={{ fontSize:10.5, color:H.inkLight, marginTop:1 }}>
                                                    {r.teacherName || r.user?.profile?.fullName || 'Unknown'}
                                                </p>
                                            </div>
                                            <span style={{
                                                padding:'3px 9px', borderRadius:99, flexShrink:0,
                                                fontSize:9.5, fontWeight:700,
                                                textTransform:'capitalize', letterSpacing:'0.3px',
                                                background:s.bg, color:s.color,
                                            }}>
                                                {(r.status||'').replace(/_/g,' ')}
                                            </span>
                                        </div>
                                    );
                                })}
                                {reports.length===0 && !loading && (
                                    <div style={{ textAlign:'center', padding:'32px 0', color:H.inkLight, fontSize:13 }}>No reports yet</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── QUICK ACTIONS ── */}
                    <div className="hd-s6" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
                        {[
                            { to:'/hod/students',        label:'View Students',  icon:GraduationCap, clr:['#78350f','#b45309'], glow:'rgba(180,83,9,0.3)'   },
                            { to:'/hod/attendance',      label:'Attendance',     icon:CheckCircle2,  clr:['#059669','#10b981'], glow:'rgba(16,185,129,0.3)' },
                            { to:'/hod/marks',           label:'View Marks',     icon:Star,          clr:['#6d28d9','#7c3aed'], glow:'rgba(109,40,217,0.3)' },
                            { to:'/hod/attendance-risk', label:'Risk Analysis',  icon:AlertTriangle, clr:['#be123c','#e11d48'], glow:'rgba(190,18,60,0.3)'  },
                        ].map(a=>(
                            <Link key={a.to} to={a.to} style={{ textDecoration:'none' }}>
                                <div className="hd-quick" style={{
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
            </DashboardLayout>
        </>
    );
}