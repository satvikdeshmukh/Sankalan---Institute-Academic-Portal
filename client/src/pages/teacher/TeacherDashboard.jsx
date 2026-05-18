import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../lib/api.js';
import { useTimetable } from '../../hooks/useTimetable.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import {
    Users, BookOpen, Clock, Calendar, BarChart3,
    Activity, TrendingUp, CheckCircle2, AlertCircle,
    Star, Sun, Zap, Award, MapPin, ArrowRight,
    ChevronLeft, ChevronRight, Sparkles, GraduationCap,
    Target, Layers
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie,
    Legend,
} from 'recharts';

/* ──────────────────────────────────────────────────
   Design Tokens
────────────────────────────────────────────────── */
const ACCENT   = '#2d6a4f';
const ACCENT2  = '#40916c';
const ACCENTLT = '#d8f3dc';
const ACCENTMD = 'rgba(45,106,79,0.12)';
const ACCENTGL = 'rgba(45,106,79,0.18)';

const CHART_COLORS = [
    '#2d6a4f','#e76f51','#f4a261','#a78bfa',
    '#38bdf8','#fb7185','#34d399','#fbbf24',
];

const DAY_ORDER = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
const DAY_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat'];

/* ──────────────────────────────────────────────────
   Global CSS
────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');

.td-root * { box-sizing: border-box; margin:0; padding:0; }

/* Base */
.td-root {
    font-family: 'DM Sans', sans-serif;
    background: #f4f6f4;
    min-height: 100vh;
    color: #141f1a;
}

/* Entrance animations */
@keyframes td-fade-up {
    from { opacity:0; transform:translateY(18px) scale(0.985); }
    to   { opacity:1; transform:translateY(0)    scale(1); }
}
@keyframes td-fade-in {
    from { opacity:0; }
    to   { opacity:1; }
}
@keyframes td-slide-right {
    from { opacity:0; transform:translateX(-16px); }
    to   { opacity:1; transform:translateX(0); }
}
@keyframes td-scale-in {
    from { opacity:0; transform:scale(0.93); }
    to   { opacity:1; transform:scale(1); }
}
@keyframes td-number-pop {
    0%   { transform:scale(0.7) translateY(8px); opacity:0; }
    70%  { transform:scale(1.08) translateY(-2px); opacity:1; }
    100% { transform:scale(1) translateY(0); opacity:1; }
}
@keyframes td-bar-grow {
    from { width:0; }
    to   { width:var(--w); }
}
@keyframes td-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
}
@keyframes td-ping {
    0%,100% { transform:scale(1); opacity:1; }
    50%     { transform:scale(1.5); opacity:0.4; }
}
@keyframes td-float {
    0%,100% { transform:translateY(0); }
    50%     { transform:translateY(-4px); }
}
@keyframes td-border-glow {
    0%,100% { box-shadow: 0 0 0 0 rgba(45,106,79,0); }
    50%     { box-shadow: 0 0 0 4px rgba(45,106,79,0.12); }
}

.td-hero      { animation: td-fade-up  0.6s cubic-bezier(0.34,1.2,0.64,1) both; }
.td-card-1    { animation: td-fade-up  0.55s 0.05s cubic-bezier(0.34,1.1,0.64,1) both; }
.td-card-2    { animation: td-fade-up  0.55s 0.10s cubic-bezier(0.34,1.1,0.64,1) both; }
.td-card-3    { animation: td-fade-up  0.55s 0.15s cubic-bezier(0.34,1.1,0.64,1) both; }
.td-card-4    { animation: td-fade-up  0.55s 0.20s cubic-bezier(0.34,1.1,0.64,1) both; }
.td-section-1 { animation: td-fade-up  0.55s 0.25s cubic-bezier(0.34,1.1,0.64,1) both; }
.td-section-2 { animation: td-fade-up  0.55s 0.30s cubic-bezier(0.34,1.1,0.64,1) both; }
.td-section-3 { animation: td-fade-up  0.55s 0.35s cubic-bezier(0.34,1.1,0.64,1) both; }
.td-section-4 { animation: td-fade-up  0.55s 0.40s cubic-bezier(0.34,1.1,0.64,1) both; }
.td-section-5 { animation: td-fade-up  0.55s 0.45s cubic-bezier(0.34,1.1,0.64,1) both; }

.td-num { animation: td-number-pop 0.6s 0.3s cubic-bezier(0.34,1.56,0.64,1) both; display:inline-block; }
.td-ping { animation: td-ping 2s ease-in-out infinite; }
.td-float { animation: td-float 3.5s ease-in-out infinite; }

/* ── Digital name scramble animation ── */
@keyframes td-char-drop {
    0%   { opacity:0; transform:translateY(-12px) scaleY(1.4); filter:blur(3px); }
    60%  { opacity:1; transform:translateY(2px)   scaleY(0.95); filter:blur(0); }
    100% { opacity:1; transform:translateY(0)     scaleY(1); filter:blur(0); }
}
@keyframes td-char-glow {
    0%,100% { text-shadow: 0 0 0px rgba(255,255,255,0); }
    40%     { text-shadow: 0 0 14px rgba(255,255,255,0.7), 0 0 28px rgba(180,255,200,0.4); }
}
.td-name-char {
    display:inline-block;
    opacity:0;
    animation: td-char-drop 0.45s cubic-bezier(0.22,1,0.36,1) forwards,
               td-char-glow  0.9s ease-out forwards;
}

/* ── Ticker live clock ── */
@keyframes td-clock-tick {
    0%   { opacity:1; }
    49%  { opacity:1; }
    50%  { opacity:0.3; }
    99%  { opacity:0.3; }
    100% { opacity:1; }
}
.td-colon { animation: td-clock-tick 1s step-end infinite; }

/* ── KPI card pop-in ── */
@keyframes td-kpi-in {
    0%   { opacity:0; transform:translateY(14px) scale(0.94); }
    100% { opacity:1; transform:translateY(0)    scale(1); }
}
.td-kpi-0 { animation: td-kpi-in 0.4s 0.55s cubic-bezier(0.34,1.3,0.64,1) both; }
.td-kpi-1 { animation: td-kpi-in 0.4s 0.65s cubic-bezier(0.34,1.3,0.64,1) both; }
.td-kpi-2 { animation: td-kpi-in 0.4s 0.75s cubic-bezier(0.34,1.3,0.64,1) both; }
.td-kpi-3 { animation: td-kpi-in 0.4s 0.85s cubic-bezier(0.34,1.3,0.64,1) both; }

/* ── Hero orb drift ── */
@keyframes td-orb-drift {
    0%,100% { transform:translate(0,0) scale(1); }
    33%     { transform:translate(18px,-14px) scale(1.06); }
    66%     { transform:translate(-10px,10px) scale(0.96); }
}
.td-orb-a { animation: td-orb-drift 14s ease-in-out infinite; }
.td-orb-b { animation: td-orb-drift 10s ease-in-out infinite reverse; }
.td-orb-c { animation: td-orb-drift 18s ease-in-out infinite 3s; }

/* ── Divider shimmer line ── */
@keyframes td-div-shimmer {
    from { background-position: -300px 0; }
    to   { background-position:  300px 0; }
}
.td-div-line {
    height:1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), rgba(180,255,200,0.5), rgba(255,255,255,0.35), transparent);
    background-size:300px 100%;
    animation: td-div-shimmer 2.5s linear infinite;
}

/* ── Live dot pulse ── */
@keyframes td-live-pulse {
    0%,100% { box-shadow:0 0 0 0 rgba(180,255,180,0.7); }
    50%     { box-shadow:0 0 0 6px rgba(180,255,180,0); }
}
.td-live-dot { animation: td-live-pulse 1.8s ease-in-out infinite; }

/* Skeleton shimmer */
.td-skel {
    background: linear-gradient(90deg, #e8ede9 25%, #f0f4f1 50%, #e8ede9 75%);
    background-size: 400px 100%;
    animation: td-shimmer 1.6s infinite linear;
    border-radius: 10px;
}

/* Cards */
.td-card {
    background: #ffffff;
    border: 1px solid rgba(45,106,79,0.1);
    border-radius: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(45,106,79,0.06);
    transition: box-shadow 0.25s ease, transform 0.25s ease;
}
.td-card:hover {
    box-shadow: 0 4px 20px rgba(45,106,79,0.1), 0 1px 3px rgba(0,0,0,0.06);
    transform: translateY(-1px);
}

/* Scrollbar */
.td-scroll::-webkit-scrollbar { height:4px; width:4px; }
.td-scroll::-webkit-scrollbar-track { background:transparent; }
.td-scroll::-webkit-scrollbar-thumb { background:${ACCENTLT}; border-radius:9px; }

/* Period pill hover */
.td-period:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(45,106,79,0.12); }
.td-period { transition: transform 0.2s, box-shadow 0.2s; }

/* Calendar cell hover */
.td-cal-cell:hover { background:${ACCENTMD}; color:${ACCENT}; }
.td-cal-cell { transition: background 0.15s, color 0.15s; cursor:pointer; }

/* Stat hover */
.td-stat:hover { transform:translateY(-3px) scale(1.01); }
.td-stat { transition: transform 0.25s cubic-bezier(0.34,1.2,0.64,1); }

/* Course row */
.td-course-row:hover { background:#f4f6f4; }
.td-course-row { transition: background 0.15s; }

/* Chart tooltip */
.td-tooltip {
    background:#fff;
    border:1px solid rgba(45,106,79,0.15);
    border-radius:12px;
    padding:10px 14px;
    box-shadow:0 8px 24px rgba(0,0,0,0.1);
    font-family:'DM Sans',sans-serif;
    font-size:12px;
}
`;

/* ──────────────────────────────────────────────────
   Custom Tooltip
────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="td-tooltip">
            <p style={{ fontWeight:600, color:'#141f1a', marginBottom:6, fontSize:11 }}>{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color:p.color, fontWeight:500 }}>
                    {p.name}: <span style={{ color:'#3d524a', fontWeight:700 }}>{p.value}</span>
                </p>
            ))}
        </div>
    );
};

/* ──────────────────────────────────────────────────
   Animated Counter
────────────────────────────────────────────────── */
function AnimCounter({ to, duration = 900 }) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        if (!to) return;
        let start = 0;
        const step = Math.ceil(to / (duration / 16));
        const id = setInterval(() => {
            start += step;
            if (start >= to) { setVal(to); clearInterval(id); }
            else setVal(start);
        }, 16);
        return () => clearInterval(id);
    }, [to]);
    return <span className="td-num">{val.toLocaleString()}</span>;
}

/* ──────────────────────────────────────────────────
   KPI Stat Card
────────────────────────────────────────────────── */
function StatCard({ title, value, icon: Icon, accentColor, sub, loading, animClass }) {
    return (
        <div className={`td-card td-stat ${animClass}`} style={{ padding:24, position:'relative', overflow:'hidden' }}>
            {/* Decorative circle */}
            <div style={{
                position:'absolute', top:-28, right:-28,
                width:90, height:90, borderRadius:'50%',
                background:`${accentColor}12`,
            }}/>
            <div style={{
                position:'absolute', bottom:-16, left:8,
                width:50, height:50, borderRadius:'50%',
                background:`${accentColor}07`,
            }}/>
            <div style={{ position:'relative' }}>
                <div style={{
                    width:40, height:40, borderRadius:12,
                    background:`${accentColor}14`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    marginBottom:14,
                }}>
                    <Icon style={{ width:18, height:18, color:accentColor }} />
                </div>
                <p style={{
                    fontSize:10.5, fontWeight:600, color:'#8fa89e',
                    letterSpacing:'1px', textTransform:'uppercase', marginBottom:6,
                }}>
                    {title}
                </p>
                <p style={{
                    fontFamily:"'DM Sans', sans-serif",
                    fontSize:36, fontWeight:600, color:'#141f1a', lineHeight:1,
                    marginBottom:5,
                }}>
                    {loading
                        ? <span className="td-skel" style={{ display:'inline-block', width:60, height:34 }}/>
                        : <AnimCounter to={value ?? 0} />
                    }
                </p>
                {sub && (
                    <p style={{ fontSize:11.5, color:'#8fa89e', fontWeight:400 }}>{sub}</p>
                )}
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────
   Mini Calendar
────────────────────────────────────────────────── */
function MiniCalendar({ scheduleMap }) {
    const today = new Date();
    const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });

    const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
    const firstDay    = new Date(current.year, current.month, 1).getDay(); // 0=Sun
    const adjustedFirst = (firstDay + 6) % 7; // Mon=0

    const monthLabel = new Date(current.year, current.month).toLocaleDateString('en-US', { month:'long', year:'numeric' });
    const WEEKDAYS = ['Mo','Tu','We','Th','Fr','Sa','Su'];

    const prev = () => setCurrent(c => c.month === 0 ? { year:c.year-1, month:11 } : { year:c.year, month:c.month-1 });
    const next = () => setCurrent(c => c.month === 11 ? { year:c.year+1, month:0 } : { year:c.year, month:c.month+1 });

    const cells = [];
    for (let i = 0; i < adjustedFirst; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const isToday = (d) =>
        d === today.getDate() && current.month === today.getMonth() && current.year === today.getFullYear();

    // Map day number to weekday string
    const dayNameForDate = (d) => {
        const date = new Date(current.year, current.month, d);
        return date.toLocaleDateString('en-US', { weekday:'long' }).toUpperCase();
    };

    const hasClass = (d) => d && scheduleMap && scheduleMap[dayNameForDate(d)] > 0;

    return (
        <div>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                <p style={{
                    fontFamily:"'DM Sans', sans-serif",
                    fontSize:17, color:'#141f1a', fontWeight:500,
                }}>
                    {monthLabel}
                </p>
                <div style={{ display:'flex', gap:4 }}>
                    {[prev, next].map((fn, i) => (
                        <button key={i} onClick={fn} style={{
                            width:28, height:28, borderRadius:8,
                            border:'1px solid rgba(45,106,79,0.15)',
                            background:'transparent', cursor:'pointer', color:'#8fa89e',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            transition:'all 0.15s',
                        }}
                            onMouseEnter={e=>{ e.currentTarget.style.background=ACCENTMD; e.currentTarget.style.color=ACCENT; }}
                            onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#8fa89e'; }}
                        >
                            {i===0 ? <ChevronLeft style={{width:13,height:13}}/> : <ChevronRight style={{width:13,height:13}}/>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Weekday headers */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:2, marginBottom:6 }}>
                {WEEKDAYS.map(d => (
                    <div key={d} style={{
                        textAlign:'center', fontSize:10, fontWeight:700,
                        color:'#8fa89e', letterSpacing:'0.5px', padding:'2px 0',
                    }}>{d}</div>
                ))}
            </div>

            {/* Day cells */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:3 }}>
                {cells.map((d, i) => (
                    <div key={i} className={d ? 'td-cal-cell' : ''} style={{
                        position:'relative',
                        height:32, borderRadius:8,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:12, fontWeight: isToday(d) ? 700 : 400,
                        color: isToday(d) ? '#fff' : d ? '#3d524a' : 'transparent',
                        background: isToday(d) ? ACCENT : 'transparent',
                        boxShadow: isToday(d) ? `0 4px 12px ${ACCENTGL}` : 'none',
                    }}>
                        {d}
                        {d && hasClass(d) && !isToday(d) && (
                            <span style={{
                                position:'absolute', bottom:3, left:'50%', transform:'translateX(-50%)',
                                width:4, height:4, borderRadius:'50%', background:ACCENT2,
                            }}/>
                        )}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div style={{
                marginTop:16, paddingTop:14,
                borderTop:'1px solid rgba(45,106,79,0.08)',
                display:'flex', gap:16,
            }}>
                {[
                    { dot:ACCENT, label:'Today' },
                    { dot:ACCENT2, label:'Classes' },
                ].map((l,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ width:7, height:7, borderRadius:'50%', background:l.dot, flexShrink:0 }}/>
                        <span style={{ fontSize:11, color:'#8fa89e' }}>{l.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────
   Period Card
────────────────────────────────────────────────── */
function PeriodCard({ entry, isNow, idx }) {
    const PERIOD_PALETTES = [
        { bg:'#f0fdf4', border:'#bbf7d0', text:'#166534', dot:'#22c55e' },
        { bg:'#fef3c7', border:'#fde68a', text:'#92400e', dot:'#f59e0b' },
        { bg:'#fce7f3', border:'#fbcfe8', text:'#9d174d', dot:'#ec4899' },
        { bg:'#ede9fe', border:'#ddd6fe', text:'#5b21b6', dot:'#8b5cf6' },
        { bg:'#e0f2fe', border:'#bae6fd', text:'#0c4a6e', dot:'#0ea5e9' },
        { bg:'#f0fdf4', border:'#bbf7d0', text:'#166534', dot:'#22c55e' },
    ];
    const c = isNow
        ? { bg:'#f0fdf4', border:ACCENT, text:ACCENT, dot:ACCENT }
        : PERIOD_PALETTES[idx % PERIOD_PALETTES.length];

    return (
        <div className="td-period" style={{
            flexShrink:0, width:152,
            borderRadius:16,
            border:`1.5px solid ${c.border}`,
            background: c.bg,
            padding:'14px 14px 12px',
            position:'relative',
        }}>
            {isNow && (
                <div style={{
                    position:'absolute', top:-9, left:'50%', transform:'translateX(-50%)',
                    background:ACCENT, color:'#fff',
                    fontSize:8.5, fontWeight:800, letterSpacing:'0.8px',
                    padding:'3px 8px', borderRadius:99,
                    textTransform:'uppercase', whiteSpace:'nowrap',
                    boxShadow:`0 2px 8px ${ACCENTGL}`,
                }}>
                    Now
                </div>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                <span style={{
                    width:22, height:22, borderRadius:7,
                    background: isNow ? ACCENT : c.dot,
                    color:'#fff', fontSize:9, fontWeight:800,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    flexShrink:0,
                }}>
                    P{entry.periodNumber}
                </span>
                <span style={{ fontSize:10, color:'#8fa89e', fontWeight:400 }}>
                    {entry.startTime}–{entry.endTime}
                </span>
            </div>
            <p style={{ fontWeight:600, fontSize:12.5, color:c.text, lineHeight:1.3, marginBottom:5 }}>
                {entry.subject || '—'}
            </p>
            {entry.room && (
                <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:4 }}>
                    <MapPin style={{ width:10, height:10, color:'#8fa89e' }}/>
                    <span style={{ fontSize:10, color:'#8fa89e' }}>{entry.room}</span>
                </div>
            )}
            {entry.section && (
                <span style={{
                    display:'inline-block',
                    padding:'2px 7px', borderRadius:99,
                    background:`${c.dot}22`, color:c.text,
                    fontSize:9.5, fontWeight:700,
                }}>
                    Sec {entry.section}
                </span>
            )}
        </div>
    );
}

/* ──────────────────────────────────────────────────
   Section Progress Bar
────────────────────────────────────────────────── */
function SectionBar({ sec, total, idx, colors }) {
    const pct = total > 0 ? Math.min(100, (sec.students / total) * 100) : 0;
    return (
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{
                width:34, height:34, borderRadius:10,
                background:`${colors[idx % colors.length]}18`,
                display:'flex', alignItems:'center', justifyContent:'center',
                flexShrink:0,
            }}>
                <span style={{
                    fontSize:13, fontWeight:800,
                    color:colors[idx % colors.length],
                    fontFamily:"'DM Sans', sans-serif",
                }}>
                    {sec.section}
                </span>
            </div>
            <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:'#3d524a' }}>Section {sec.section}</span>
                    <span style={{ fontSize:11, color:'#8fa89e' }}>{sec.students} students · {sec.subjects} subj</span>
                </div>
                <div style={{ height:6, background:'#f0f4f1', borderRadius:99, overflow:'hidden' }}>
                    <div style={{
                        height:'100%', borderRadius:99,
                        background:colors[idx % colors.length],
                        width:`${pct}%`,
                        animation:'td-bar-grow 0.9s cubic-bezier(0.34,1,0.64,1) both',
                        animationDelay:`${idx*80}ms`,
                    }}/>
                </div>
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────
   Course Row
────────────────────────────────────────────────── */
function CourseRow({ offering, idx }) {
    const initial = (offering.subject?.name || '?').charAt(0).toUpperCase();
    const clr = CHART_COLORS[idx % CHART_COLORS.length];
    return (
        <div className="td-course-row" style={{
            display:'flex', alignItems:'center', gap:12,
            padding:'9px 12px', borderRadius:12,
            cursor:'default',
        }}>
            <div style={{
                width:34, height:34, borderRadius:10, flexShrink:0,
                background:`${clr}18`,
                display:'flex', alignItems:'center', justifyContent:'center',
            }}>
                <span style={{
                    fontFamily:"'DM Sans', sans-serif",
                    fontSize:16, fontWeight:600, color:clr,
                }}>
                    {initial}
                </span>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:12.5, fontWeight:600, color:'#1c2e26', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {offering.subject?.name || '—'}
                </p>
                <p style={{ fontSize:10.5, color:'#8fa89e', marginTop:1 }}>
                    Yr{offering.year} · Sem{offering.semester} · Sec {offering.section}
                </p>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
                <p style={{ fontSize:13, fontWeight:700, color:'#2d6a4f' }}>
                    {offering._count?.enrollments || 0}
                </p>
                <p style={{ fontSize:10, color:'#8fa89e' }}>students</p>
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────
   Digital Name — character-by-character drop-in with glow
────────────────────────────────────────────────── */
function DigitalName({ name }) {
    const chars = (name || 'Teacher').split('');
    return (
        <span style={{ display:'inline-flex', alignItems:'baseline', gap:0 }}>
            {chars.map((ch, i) => (
                <span
                    key={i}
                    className="td-name-char"
                    style={{
                        animationDelay: `${0.35 + i * 0.055}s`,
                        fontFamily:"'DM Sans', sans-serif",
                        fontSize:38, fontWeight:700, color:'#fff',
                        lineHeight:1,
                        letterSpacing: ch === ' ' ? '0.18em' : '-0.01em',
                    }}
                >
                    {ch === ' ' ? '\u00A0' : ch}
                </span>
            ))}
        </span>
    );
}

/* ──────────────────────────────────────────────────
   Live Clock — ticking colon
────────────────────────────────────────────────── */
function LiveClock() {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const id = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    const h = time.getHours().toString().padStart(2,'0');
    const m = time.getMinutes().toString().padStart(2,'0');
    const s = time.getSeconds().toString().padStart(2,'0');
    const ampm = time.getHours() >= 12 ? 'PM' : 'AM';
    return (
        <div style={{ display:'flex', alignItems:'baseline', gap:1 }}>
            <span style={{
                fontFamily:"'DM Sans', sans-serif",
                fontSize:34, fontWeight:500, color:'#fff', lineHeight:1,
                letterSpacing:'-0.02em',
            }}>
                {h}
            </span>
            <span className="td-colon" style={{
                fontFamily:"'DM Sans', sans-serif",
                fontSize:30, fontWeight:500, color:'rgba(255,255,255,0.85)', lineHeight:1,
                margin:'0 1px',
            }}>:</span>
            <span style={{
                fontFamily:"'DM Sans', sans-serif",
                fontSize:34, fontWeight:500, color:'#fff', lineHeight:1,
                letterSpacing:'-0.02em',
            }}>
                {m}
            </span>
            <span style={{
                fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.55)',
                marginLeft:5, alignSelf:'flex-end', paddingBottom:3,
            }}>
                {ampm}
            </span>
        </div>
    );
}

/* ──────────────────────────────────────────────────
   Main Dashboard
────────────────────────────────────────────────── */
export default function TeacherDashboard() {
    const { user } = useAuth();
    const [offerings, setOfferings]   = useState([]);
    const [students,  setStudents]    = useState([]);
    const [loading,   setLoading]     = useState(true);

    const { entries: timetableEntries, loading: ttLoading } = useTimetable({ teacherUserId: user?.id });

    useEffect(() => {
        if (!user?.id) return;
        (async () => {
            try {
                const [off, studs] = await Promise.all([
                    api.get('/courses').catch(() => []),
                    api.get('/students').catch(() => [])
                ]);
                setOfferings(off || []);
                setStudents(studs || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [user?.id]);

    const now       = new Date();
    const todayKey  = now.toLocaleDateString('en-US', { weekday:'long' }).toUpperCase();

    const todaySchedule = useMemo(() =>
        [...timetableEntries]
            .filter(e => e.dayOfWeek?.toUpperCase() === todayKey)
            .sort((a, b) => (a.startTime||'').localeCompare(b.startTime||'')),
        [timetableEntries, todayKey]
    );

    const currentHour = now.getHours() + now.getMinutes() / 60;
    const currentPeriod = todaySchedule.find(e => {
        const [sh,sm] = (e.startTime||'0:0').split(':').map(Number);
        const [eh,em] = (e.endTime||'0:0').split(':').map(Number);
        return currentHour >= (sh+sm/60) && currentHour < (eh+em/60);
    });

    const totalStudents  = useMemo(() => students.length, [students]);
    const totalSubjects  = useMemo(() => new Set(offerings.map(o=>o.subject?.id)).size, [offerings]);
    const totalSessions  = useMemo(() => offerings.reduce((a,o) => a+(o._count?.sessions||0), 0), [offerings]);
    const weeklyPeriods  = timetableEntries.length;

    // Schedule map for calendar: day → count
    const scheduleMap = useMemo(() => {
        const m = {};
        timetableEntries.forEach(e => {
            const k = e.dayOfWeek?.toUpperCase();
            m[k] = (m[k]||0) + 1;
        });
        return m;
    }, [timetableEntries]);

    const attendanceData = useMemo(() =>
        offerings.slice(0, 7).map(o => ({
            name: (o.subject?.name||'Sub').slice(0,11),
            sessions: o._count?.sessions||0,
            enrolled: o._count?.enrollments||0,
        })),
        [offerings]
    );

    const dayData = useMemo(() => {
        const counts = Object.fromEntries(DAY_ORDER.map(d=>[d,0]));
        timetableEntries.forEach(e => { const k=e.dayOfWeek?.toUpperCase(); if(counts[k]!==undefined) counts[k]++; });
        return DAY_ORDER.map((day,i) => ({
            name: DAY_SHORT[i],
            periods: counts[day],
            fill: ['#2d6a4f','#e76f51','#a78bfa','#38bdf8','#fbbf24','#fb7185'][i],
        }));
    }, [timetableEntries]);

    const pieData = useMemo(() =>
        offerings.filter(o=>(o._count?.enrollments||0)>0)
            .map(o => ({ name:`${(o.subject?.name||'').slice(0,10)} ${o.section}`, value:o._count?.enrollments||0 }))
            .slice(0,7),
        [offerings]
    );

    const sectionData = useMemo(() => {
        const map = {};
        students.forEach(s => {
            const sec = s.section || 'A';
            if (!map[sec]) map[sec] = { section: sec, subjects: 0, students: 0 };
            map[sec].students++;
        });
        
        // Add subject counts per section from offerings
        offerings.forEach(o => {
            const sec = o.section || 'A';
            if (map[sec]) map[sec].subjects++;
        });

        return Object.values(map);
    }, [students, offerings]);

    const greetHour = now.getHours();
    const greeting  = greetHour < 12 ? 'Good morning' : greetHour < 17 ? 'Good afternoon' : 'Good evening';
    const dateLabel = now.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
    const timeLabel = now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });

    return (
        <>
            <style>{CSS}</style>
            <DashboardLayout title="Teacher Dashboard" subtitle={`Welcome back, ${user?.name||'Teacher'}`} showCalendar>
                <div className="td-root" style={{ padding:'0 0 32px' }}>
                    {/* ── Hero Banner ── */}
                    <div className="td-hero" style={{
                        background:`linear-gradient(135deg, #1b4332 0%, ${ACCENT} 40%, ${ACCENT2} 75%, #52b788 100%)`,
                        borderRadius:28,
                        padding:'32px 36px 28px',
                        marginBottom:24,
                        position:'relative', overflow:'hidden',
                    }}>
                        {/* Fine dot-grid texture */}
                        <div style={{
                            position:'absolute', inset:0, opacity:0.06,
                            backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
                            backgroundSize:'24px 24px',
                            pointerEvents:'none',
                        }}/>
                        {/* Drifting orbs */}
                        <div className="td-orb-a" style={{
                            position:'absolute', top:-80, right:-60,
                            width:280, height:280, borderRadius:'50%',
                            background:'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 65%)',
                            pointerEvents:'none',
                        }}/>
                        <div className="td-orb-b" style={{
                            position:'absolute', bottom:-60, right:200,
                            width:180, height:180, borderRadius:'50%',
                            background:'radial-gradient(circle, rgba(180,255,200,0.08) 0%, transparent 65%)',
                            pointerEvents:'none',
                        }}/>
                        <div className="td-orb-c" style={{
                            position:'absolute', top:40, left:'45%',
                            width:120, height:120, borderRadius:'50%',
                            background:'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
                            pointerEvents:'none',
                        }}/>

                        {/* ── TOP ROW: Greeting + Clock ── */}
                        <div style={{
                            position:'relative',
                            display:'grid',
                            gridTemplateColumns:'1fr auto',
                            gap:24,
                            alignItems:'center',
                            marginBottom:22,
                        }}>
                            {/* Left: greeting + name + subtitle */}
                            <div>
                                {/* Greeting pill */}
                                <div style={{
                                    display:'inline-flex', alignItems:'center', gap:7,
                                    background:'rgba(255,255,255,0.12)',
                                    border:'1px solid rgba(255,255,255,0.2)',
                                    borderRadius:99, padding:'5px 14px',
                                    marginBottom:14,
                                }}>
                                    <Sun style={{ width:13, height:13, color:'rgba(255,255,255,0.8)' }}/>
                                    <span style={{ color:'rgba(255,255,255,0.85)', fontSize:12.5, fontWeight:500, letterSpacing:'0.2px' }}>
                                        {greeting}
                                    </span>
                                    {/* Live dot */}
                                    <span className="td-live-dot" style={{
                                        width:7, height:7, borderRadius:'50%',
                                        background:'#86efac', display:'inline-block', marginLeft:2,
                                    }}/>
                                </div>

                                {/* Digital animated name */}
                                <div style={{ marginBottom:10 }}>
                                    <DigitalName name={user?.name || 'Teacher'} />
                                    <span style={{
                                        fontFamily:"'DM Sans', sans-serif",
                                        fontSize:38, fontWeight:500, color:'rgba(255,255,255,0.5)',
                                        marginLeft:10, lineHeight:1,
                                    }}>👋</span>
                                </div>

                                {/* Subtitle */}
                                <p style={{
                                    color:'rgba(255,255,255,0.6)', fontSize:14, fontWeight:400,
                                    display:'flex', alignItems:'center', gap:8,
                                }}>
                                    <span style={{
                                        display:'inline-block', width:6, height:6, borderRadius:'50%',
                                        background:'#86efac',
                                    }}/>
                                    {todaySchedule.length > 0
                                        ? `${todaySchedule.length} period${todaySchedule.length!==1?'s':''} scheduled today`
                                        : 'No classes today — enjoy your day!'
                                    }
                                </p>
                            </div>

                            {/* Right: Live clock + date */}
                            <div style={{
                                background:'rgba(0,0,0,0.18)',
                                backdropFilter:'blur(16px)',
                                borderRadius:20,
                                padding:'20px 26px',
                                textAlign:'center',
                                border:'1px solid rgba(255,255,255,0.12)',
                                minWidth:160,
                            }}>
                                <LiveClock />
                                <div className="td-div-line" style={{ margin:'10px 0 8px' }}/>
                                <p style={{
                                    color:'rgba(255,255,255,0.5)', fontSize:11,
                                    fontWeight:500, letterSpacing:'0.3px',
                                }}>
                                    {now.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}
                                </p>
                            </div>
                        </div>

                        {/* Shimmer divider */}
                        <div className="td-div-line" style={{ marginBottom:22 }}/>

                        {/* ── KPI Cards Row ── */}
                        <div style={{
                            position:'relative',
                            display:'grid',
                            gridTemplateColumns:'repeat(4,1fr)',
                            gap:14,
                        }}>
                            {[
                                {
                                    title:'Total Students', value:totalStudents,
                                    icon:Users, sub:'enrolled in your courses',
                                    l:loading, accentClr:'#86efac',
                                    trend:'+4.2%',
                                },
                                {
                                    title:'Subjects', value:totalSubjects,
                                    icon:BookOpen, sub:'active this semester',
                                    l:loading, accentClr:'#fde68a',
                                    trend:'Active',
                                },
                                {
                                    title:'Sessions Taken', value:totalSessions,
                                    icon:CheckCircle2, sub:'attendance sessions',
                                    l:loading, accentClr:'#c4b5fd',
                                    trend:'Logged',
                                },
                                {
                                    title:'Periods / Week', value:weeklyPeriods,
                                    icon:Calendar, sub:'in your timetable',
                                    l:ttLoading, accentClr:'#fdba74',
                                    trend:'Scheduled',
                                },
                            ].map((k,i) => (
                                <div key={i} className={`td-kpi-${i}`} style={{
                                    background:'rgba(255,255,255,0.1)',
                                    backdropFilter:'blur(12px)',
                                    border:'1px solid rgba(255,255,255,0.15)',
                                    borderRadius:18,
                                    padding:'18px 20px',
                                    transition:'all 0.22s cubic-bezier(0.34,1.2,0.64,1)',
                                    cursor:'default',
                                    position:'relative', overflow:'hidden',
                                }}
                                    onMouseEnter={e=>{
                                        e.currentTarget.style.background='rgba(255,255,255,0.18)';
                                        e.currentTarget.style.transform='translateY(-3px)';
                                        e.currentTarget.style.boxShadow='0 12px 32px rgba(0,0,0,0.15)';
                                    }}
                                    onMouseLeave={e=>{
                                        e.currentTarget.style.background='rgba(255,255,255,0.1)';
                                        e.currentTarget.style.transform='translateY(0)';
                                        e.currentTarget.style.boxShadow='none';
                                    }}
                                >
                                    {/* Top: icon + trend */}
                                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                                        <div style={{
                                            width:36, height:36, borderRadius:11,
                                            background:`${k.accentClr}22`,
                                            border:`1px solid ${k.accentClr}44`,
                                            display:'flex', alignItems:'center', justifyContent:'center',
                                        }}>
                                            <k.icon style={{ width:17, height:17, color:k.accentClr }}/>
                                        </div>
                                        <span style={{
                                            fontSize:10, fontWeight:700,
                                            color:k.accentClr,
                                            background:`${k.accentClr}18`,
                                            padding:'3px 9px', borderRadius:99,
                                            letterSpacing:'0.3px',
                                        }}>
                                            {k.trend}
                                        </span>
                                    </div>

                                    {/* Value */}
                                    {k.l
                                        ? <div style={{ height:36, width:64, borderRadius:10, background:'rgba(255,255,255,0.15)', marginBottom:6 }}/>
                                        : <p style={{
                                            fontFamily:"'DM Sans', sans-serif",
                                            fontSize:34, fontWeight:500, color:'#fff',
                                            lineHeight:1, marginBottom:5,
                                          }}>
                                            <AnimCounter to={k.value||0}/>
                                          </p>
                                    }

                                    {/* Label */}
                                    <p style={{
                                        fontSize:10, fontWeight:600,
                                        color:'rgba(255,255,255,0.5)',
                                        textTransform:'uppercase', letterSpacing:'0.9px',
                                        marginBottom:2,
                                    }}>
                                        {k.title}
                                    </p>
                                    <p style={{ fontSize:11, color:'rgba(255,255,255,0.38)' }}>{k.sub}</p>

                                    {/* Decorative corner accent */}
                                    <div style={{
                                        position:'absolute', bottom:-12, right:-12,
                                        width:56, height:56, borderRadius:'50%',
                                        background:`${k.accentClr}0e`,
                                    }}/>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Main Grid ── */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:20, marginBottom:20 }}>

                        {/* LEFT: Today's Schedule */}
                        <div className="td-card td-section-1" style={{ padding:26 }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                    <div style={{
                                        width:36, height:36, borderRadius:11,
                                        background:ACCENTMD,
                                        display:'flex', alignItems:'center', justifyContent:'center',
                                    }}>
                                        <Zap style={{ width:17, height:17, color:ACCENT }}/>
                                    </div>
                                    <div>
                                        <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:19, fontWeight:500, color:'#141f1a', lineHeight:1 }}>
                                            Today's Schedule
                                        </p>
                                        <p style={{ fontSize:11, color:'#8fa89e', marginTop:2 }}>
                                            {now.toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <span style={{
                                    padding:'5px 12px', borderRadius:99,
                                    background: todaySchedule.length>0 ? ACCENTMD : '#f4f6f4',
                                    color: todaySchedule.length>0 ? ACCENT : '#8fa89e',
                                    fontSize:11, fontWeight:700,
                                }}>
                                    {todaySchedule.length} period{todaySchedule.length!==1?'s':''}
                                </span>
                            </div>

                            {ttLoading ? (
                                <div style={{ display:'flex', gap:12, overflow:'hidden' }}>
                                    {[1,2,3,4].map(i=>(
                                        <div key={i} className="td-skel" style={{ flexShrink:0, width:152, height:130 }}/>
                                    ))}
                                </div>
                            ) : todaySchedule.length > 0 ? (
                                <div className="td-scroll" style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:4 }}>
                                    {todaySchedule.map((e,i) => (
                                        <PeriodCard key={i} entry={e} isNow={currentPeriod?.id===e.id} idx={i}/>
                                    ))}
                                </div>
                            ) : (
                                <div style={{
                                    textAlign:'center', padding:'40px 0',
                                    color:'#8fa89e',
                                }}>
                                    <div className="td-float" style={{ display:'inline-block', marginBottom:12 }}>
                                        <Star style={{ width:32, height:32, opacity:0.3 }}/>
                                    </div>
                                    <p style={{ fontSize:13, fontWeight:500 }}>No classes today — enjoy your day! 🌿</p>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Calendar */}
                        <div className="td-card td-section-1" style={{ padding:22 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
                                <div style={{
                                    width:34, height:34, borderRadius:10,
                                    background:ACCENTMD,
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                }}>
                                    <Calendar style={{ width:16, height:16, color:ACCENT }}/>
                                </div>
                                <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:17, fontWeight:500, color:'#141f1a' }}>
                                    Calendar
                                </p>
                            </div>
                            <MiniCalendar scheduleMap={scheduleMap}/>

                            {/* Upcoming period teaser */}
                            {!ttLoading && currentPeriod && (
                                <div style={{
                                    marginTop:16, padding:'11px 13px',
                                    borderRadius:12,
                                    background:ACCENTMD,
                                    border:`1px solid ${ACCENTLT}`,
                                }}>
                                    <p style={{ fontSize:9.5, fontWeight:700, color:ACCENT2, letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:4 }}>
                                        Current Period
                                    </p>
                                    <p style={{ fontSize:13, fontWeight:600, color:ACCENT }}>
                                        P{currentPeriod.periodNumber} · {currentPeriod.subject}
                                    </p>
                                    <p style={{ fontSize:11, color:ACCENT2, marginTop:2 }}>
                                        {currentPeriod.startTime}–{currentPeriod.endTime}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Charts Row ── */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>

                        {/* Sessions per Subject */}
                        <div className="td-card td-section-2" style={{ padding:26 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:22 }}>
                                <div style={{
                                    width:34, height:34, borderRadius:10, background:ACCENTMD,
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                }}>
                                    <BarChart3 style={{ width:16, height:16, color:ACCENT }}/>
                                </div>
                                <div>
                                    <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:17, fontWeight:500, color:'#141f1a', lineHeight:1 }}>
                                        Sessions per Subject
                                    </p>
                                    <p style={{ fontSize:11, color:'#8fa89e', marginTop:2 }}>Attendance sessions logged</p>
                                </div>
                            </div>
                            {loading ? (
                                <div className="td-skel" style={{ height:220 }}/>
                            ) : attendanceData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={attendanceData} margin={{ top:5, right:5, bottom:28, left:0 }}>
                                        <defs>
                                            {CHART_COLORS.map((c,i) => (
                                                <linearGradient key={i} id={`cg${i}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%"   stopColor={c} stopOpacity={1}/>
                                                    <stop offset="100%" stopColor={c} stopOpacity={0.45}/>
                                                </linearGradient>
                                            ))}
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2ef"/>
                                        <XAxis dataKey="name" tick={{ fontSize:10, fill:'#8fa89e', fontFamily:'Geist' }}
                                            angle={-18} textAnchor="end" height={44} axisLine={false} tickLine={false}/>
                                        <YAxis tick={{ fontSize:10, fill:'#8fa89e' }} axisLine={false} tickLine={false}/>
                                        <Tooltip content={<CustomTooltip/>}/>
                                        <Bar dataKey="sessions" name="Sessions" radius={[8,8,0,0]} maxBarSize={40}>
                                            {attendanceData.map((_,i) => (
                                                <Cell key={i} fill={`url(#cg${i%CHART_COLORS.length})`}/>
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ height:220, display:'flex', alignItems:'center', justifyContent:'center', color:'#8fa89e', fontSize:13 }}>
                                    No data yet
                                </div>
                            )}
                        </div>

                        {/* Weekly Distribution */}
                        <div className="td-card td-section-2" style={{ padding:26 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:22 }}>
                                <div style={{
                                    width:34, height:34, borderRadius:10, background:ACCENTMD,
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                }}>
                                    <Activity style={{ width:16, height:16, color:ACCENT }}/>
                                </div>
                                <div>
                                    <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:17, fontWeight:500, color:'#141f1a', lineHeight:1 }}>
                                        Weekly Load
                                    </p>
                                    <p style={{ fontSize:11, color:'#8fa89e', marginTop:2 }}>Periods per day</p>
                                </div>
                            </div>
                            {ttLoading ? (
                                <div className="td-skel" style={{ height:220 }}/>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={dayData} margin={{ top:5, right:5, bottom:5, left:0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2ef"/>
                                        <XAxis dataKey="name" tick={{ fontSize:11, fill:'#8fa89e', fontFamily:'Geist' }} axisLine={false} tickLine={false}/>
                                        <YAxis tick={{ fontSize:10, fill:'#8fa89e' }} axisLine={false} tickLine={false}/>
                                        <Tooltip content={<CustomTooltip/>}/>
                                        <Bar dataKey="periods" name="Periods" radius={[8,8,0,0]} maxBarSize={44}>
                                            {dayData.map((d,i) => (
                                                <Cell key={i} fill={d.fill}/>
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* ── Bottom 3-col Row ── */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20 }}>

                        {/* Pie: Students by Course */}
                        <div className="td-card td-section-3" style={{ padding:26 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:22 }}>
                                <div style={{
                                    width:34, height:34, borderRadius:10, background:ACCENTMD,
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                }}>
                                    <Users style={{ width:16, height:16, color:ACCENT }}/>
                                </div>
                                <div>
                                    <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:17, fontWeight:500, color:'#141f1a', lineHeight:1 }}>
                                        Students by Course
                                    </p>
                                    <p style={{ fontSize:11, color:'#8fa89e', marginTop:2 }}>Enrollment distribution</p>
                                </div>
                            </div>
                            {loading ? (
                                <div className="td-skel" style={{ height:200 }}/>
                            ) : pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%"
                                            outerRadius={78} innerRadius={34}
                                            dataKey="value" paddingAngle={3}>
                                            {pieData.map((_,i) => (
                                                <Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v,n) => [`${v} students`, n]}/>
                                        <Legend iconType="circle" iconSize={7}
                                            wrapperStyle={{ fontSize:10, color:'#8fa89e', fontFamily:'Geist' }}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'#8fa89e', fontSize:13 }}>
                                    No enrollments yet
                                </div>
                            )}
                        </div>

                        {/* Section Breakdown */}
                        <div className="td-card td-section-4" style={{ padding:26 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:22 }}>
                                <div style={{
                                    width:34, height:34, borderRadius:10, background:ACCENTMD,
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                }}>
                                    <Layers style={{ width:16, height:16, color:ACCENT }}/>
                                </div>
                                <div>
                                    <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:17, fontWeight:500, color:'#141f1a', lineHeight:1 }}>
                                        Section Summary
                                    </p>
                                    <p style={{ fontSize:11, color:'#8fa89e', marginTop:2 }}>Students per section</p>
                                </div>
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                                {sectionData.length > 0 ? sectionData.map((sec,i) => (
                                    <SectionBar key={sec.section} sec={sec} total={totalStudents} idx={i} colors={CHART_COLORS}/>
                                )) : (
                                    <div style={{ textAlign:'center', padding:'32px 0', color:'#8fa89e', fontSize:13 }}>
                                        No section data
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Course list */}
                        <div className="td-card td-section-5" style={{ padding:26, display:'flex', flexDirection:'column' }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                    <div style={{
                                        width:34, height:34, borderRadius:10, background:ACCENTMD,
                                        display:'flex', alignItems:'center', justifyContent:'center',
                                    }}>
                                        <BookOpen style={{ width:16, height:16, color:ACCENT }}/>
                                    </div>
                                    <div>
                                        <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:17, fontWeight:500, color:'#141f1a', lineHeight:1 }}>
                                            Your Courses
                                        </p>
                                        <p style={{ fontSize:11, color:'#8fa89e', marginTop:2 }}>{offerings.length} total assigned</p>
                                    </div>
                                </div>
                            </div>
                            <div className="td-scroll" style={{ flex:1, overflowY:'auto', maxHeight:280 }}>
                                {loading ? [1,2,3].map(i=>(
                                    <div key={i} className="td-skel" style={{ height:52, marginBottom:8 }}/>
                                )) : offerings.length > 0 ? offerings.slice(0,10).map((o,i) => (
                                    <CourseRow key={o.id} offering={o} idx={i}/>
                                )) : (
                                    <div style={{ textAlign:'center', padding:'40px 0', color:'#8fa89e', fontSize:13 }}>
                                        No courses assigned yet
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </>
    );
}