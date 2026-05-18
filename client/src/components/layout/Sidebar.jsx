import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../lib/api.js';
import { apiFetch } from '../../lib/api.js';
import socket from '../../lib/socket.js';
import {
    LayoutDashboard, Users, BookOpen, FileText, Send, User,
    LogOut, GraduationCap, ChevronDown,
    Building2, FolderOpen, Calendar, ShieldAlert, Award,
    Activity, TrendingUp, Menu, X,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────
   Per-role theme palettes
   teacher   → forest green   (original)
   hod       → amber / orange
   principal → red / rose
   admin     → violet / purple
───────────────────────────────────────────────────── */
const ROLE_THEMES = {
    teacher: {
        /* greens */
        bg:          '#f6f8f6',
        surface:     '#ffffff',
        surfaceHov:  '#eff3f0',
        border:      'rgba(0,0,0,0.065)',
        borderHov:   'rgba(0,0,0,0.12)',
        accent:      '#2d6a4f',
        accentDark:  '#1a3d2e',
        accentSoft:  'rgba(45,106,79,0.09)',
        accentMid:   'rgba(45,106,79,0.16)',
        accentGlow:  'rgba(45,106,79,0.22)',
        accentShimA: '#2d6a4f',
        accentShimB: '#52b788',
        ink:         '#141f1a',
        inkMid:      '#3d524a',
        inkLight:    '#8fa89e',
        inkFaint:    '#dde6e2',
        scrollThumb: '#dde6e2',
        roleDot:     '#2d6a4f',
        roleBg:      'rgba(45,106,79,0.09)',
        roleText:    '#1a3d2e',
        breatheRgb:  '45,106,79',
    },
    hod: {
        /* amber / orange */
        bg:          '#fdfaf5',
        surface:     '#ffffff',
        surfaceHov:  '#fdf5e8',
        border:      'rgba(0,0,0,0.065)',
        borderHov:   'rgba(0,0,0,0.12)',
        accent:      '#b45309',
        accentDark:  '#78350f',
        accentSoft:  'rgba(180,83,9,0.09)',
        accentMid:   'rgba(180,83,9,0.16)',
        accentGlow:  'rgba(180,83,9,0.22)',
        accentShimA: '#d97706',
        accentShimB: '#f59e0b',
        ink:         '#1c150a',
        inkMid:      '#4a3a1a',
        inkLight:    '#a08060',
        inkFaint:    '#e8dcc8',
        scrollThumb: '#e8dcc8',
        roleDot:     '#f59e0b',
        roleBg:      'rgba(245,158,11,0.1)',
        roleText:    '#78350f',
        breatheRgb:  '180,83,9',
    },
    principal: {
        /* red / rose */
        bg:          '#fdf5f5',
        surface:     '#ffffff',
        surfaceHov:  '#fdeaea',
        border:      'rgba(0,0,0,0.065)',
        borderHov:   'rgba(0,0,0,0.12)',
        accent:      '#be123c',
        accentDark:  '#881337',
        accentSoft:  'rgba(190,18,60,0.09)',
        accentMid:   'rgba(190,18,60,0.16)',
        accentGlow:  'rgba(190,18,60,0.22)',
        accentShimA: '#e11d48',
        accentShimB: '#fb7185',
        ink:         '#1a0a0d',
        inkMid:      '#4a1a24',
        inkLight:    '#a07080',
        inkFaint:    '#e8ccd2',
        scrollThumb: '#e8ccd2',
        roleDot:     '#f43f5e',
        roleBg:      'rgba(244,63,94,0.1)',
        roleText:    '#881337',
        breatheRgb:  '190,18,60',
    },
    admin: {
        /* violet / purple */
        bg:          '#f8f6fd',
        surface:     '#ffffff',
        surfaceHov:  '#f0ecfa',
        border:      'rgba(0,0,0,0.065)',
        borderHov:   'rgba(0,0,0,0.12)',
        accent:      '#6d28d9',
        accentDark:  '#3b0764',
        accentSoft:  'rgba(109,40,217,0.09)',
        accentMid:   'rgba(109,40,217,0.16)',
        accentGlow:  'rgba(109,40,217,0.22)',
        accentShimA: '#7c3aed',
        accentShimB: '#a78bfa',
        ink:         '#120d1c',
        inkMid:      '#3a2a52',
        inkLight:    '#8878a8',
        inkFaint:    '#ddd8ec',
        scrollThumb: '#ddd8ec',
        roleDot:     '#a78bfa',
        roleBg:      'rgba(167,139,250,0.1)',
        roleText:    '#3b0764',
        breatheRgb:  '109,40,217',
    },
};

const NAV_STATIC = {
    teacher: [
        { label: 'Dashboard',        icon: LayoutDashboard, path: '/teacher' },
        { label: 'Students',         icon: Users,           path: '/teacher/students',
          children: [
              { label: 'All Students',     path: '/teacher/students' },
              { label: 'Managed Students', path: '/teacher/managed-students',
                children: [
                    { label: 'Attendance', path: '/teacher/managed-students' },
                    { label: 'Marks',      path: '/teacher/marks' },
                ],
              },
          ],
        },
        { label: 'Extra Curricular',  icon: Award,    path: '/teacher/extra-curricular' },
        { label: 'Reports',           icon: FileText, path: '/teacher/reports' },
        { label: 'Timetable',         icon: Calendar, path: '/teacher/timetable' },
        { label: 'Attendance Risk',   icon: Activity, path: '/teacher/attendance-risk' },
        { label: 'Submit Report',     icon: Send,     path: '/teacher/submit' },
        { label: 'About Me',          icon: User,     path: '/teacher/profile' },
    ],
    hod: [
        { label: 'Dashboard',           icon: LayoutDashboard, path: '/hod' },
        { label: 'Teachers',            icon: Users,           path: '/hod/teachers' },
        { label: 'Courses',             icon: BookOpen,        path: '/hod/courses' },
        { label: 'Students',            icon: GraduationCap,   path: '/hod/students',
          children: [
              { label: 'All Students', path: '/hod/students' },
              { label: 'Attendance',   path: '/hod/attendance' },
              { label: 'Marks',        path: '/hod/marks' },
          ],
        },
        { label: 'Timetable',           icon: Calendar,   path: '/hod/timetable' },
        { label: 'Reports',             icon: FileText,   path: '/hod/reports' },
        { label: 'Teacher Performance', icon: TrendingUp, path: '/hod/teacher-performance' },
        { label: 'Attendance Risk',     icon: Activity,   path: '/hod/attendance-risk' },
        { label: 'Submit',              icon: Send,       path: '/hod/submit' },
        { label: 'About Me',            icon: User,       path: '/hod/profile' },
    ],
    principal: [
        { label: 'Dashboard',           icon: LayoutDashboard, path: '/principal' },
        { label: 'Departments',         icon: Building2,       path: '/principal/departments' },
        { label: 'HODs',                icon: Users,           path: '/principal/hods' },
        { label: 'Teachers',            icon: GraduationCap,   path: '/principal/teachers' },
        { label: 'Reports',             icon: FileText,        path: '/principal/reports' },
        { label: 'Teacher Performance', icon: TrendingUp,      path: '/principal/teacher-performance' },
        { label: 'Attendance Risk',     icon: Activity,        path: '/principal/attendance-risk' },
        { label: 'About Me',            icon: User,            path: '/principal/profile' },
    ],
    admin: [
        { label: 'Dashboard',       icon: LayoutDashboard, path: '/admin' },
        { label: 'Users',           icon: ShieldAlert,     path: '/admin/users' },
        { label: 'Students',        icon: GraduationCap,   path: '/admin/students' },
        { label: 'Teachers',        icon: Users,           path: '/admin/teachers',
          children: [
              { label: 'All Teachers',       path: '/admin/teachers' },
              { label: 'Teacher Attendance', path: '/admin/teacher-attendance' },
              { label: 'Teacher Feedback',   path: '/admin/teacher-feedback' },
          ],
        },
        { label: 'Departments',     icon: Building2,  path: '/admin/departments' },
        { label: 'Reports',         icon: FileText,   path: '/admin/reports' },
        { label: 'Documents',       icon: FolderOpen, path: '/admin/documents' },
        { label: 'Timetable',       icon: Calendar,   path: '/admin/timetable' },
        { label: 'Attendance Risk', icon: Activity,   path: '/admin/attendance-risk' },
        { label: 'About Me',        icon: User,       path: '/admin/profile' },
    ],
};

const ROLE_LABEL = { teacher: 'Teacher', hod: 'HOD', principal: 'Principal', admin: 'Admin' };

/* ─────────────────────────────────────────────────────
   Build CSS string — called with the active theme
   so every color token is injected dynamically
───────────────────────────────────────────────────── */
function buildCSS(T) {
    return `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;1,500;1,600&family=Geist:wght@300;400;500;600&display=swap');

.sb * { box-sizing: border-box; margin:0; padding:0; }
.sb button { font-family: inherit; }

@keyframes sb-in {
    from { opacity:0; transform:translateX(-20px) scale(0.985); filter:blur(4px); }
    to   { opacity:1; transform:translateX(0) scale(1); filter:blur(0); }
}
.sb { animation: sb-in 0.55s cubic-bezier(0.34,1.4,0.64,1) both; }

@keyframes sb-item {
    from { opacity:0; transform:translateY(10px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
}
.sb-item { opacity:0; animation: sb-item 0.4s cubic-bezier(0.34,1.3,0.64,1) forwards; }

@keyframes sb-bar {
    from { height:0; opacity:0; }
    to   { height:18px; opacity:1; }
}
.sb-bar { animation: sb-bar 0.3s cubic-bezier(0.34,1.56,0.64,1) both; }

@keyframes sb-drop {
    from { opacity:0; transform:translateY(-6px) scale(0.98); }
    to   { opacity:1; transform:translateY(0) scale(1); }
}
.sb-drop { animation: sb-drop 0.22s cubic-bezier(0.34,1.2,0.64,1) both; }

@keyframes sb-badge {
    0%   { transform:scale(0) rotate(-15deg); }
    65%  { transform:scale(1.2) rotate(4deg); }
    100% { transform:scale(1) rotate(0); }
}
.sb-badge { animation: sb-badge 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }

@keyframes sb-breathe {
    0%,100% { box-shadow:0 0 0 0 rgba(${T.breatheRgb},0.28); }
    50%      { box-shadow:0 0 0 5px rgba(${T.breatheRgb},0); }
}
.sb-breathe { animation: sb-breathe 3.5s ease-in-out infinite; }

@keyframes sb-wiggle {
    0%,100%{ transform:rotate(0); }
    25%    { transform:rotate(-12deg); }
    75%    { transform:rotate(10deg); }
}
.sb-wiggle { animation: sb-wiggle 0.38s ease both; }

@keyframes sb-float {
    0%,100%{ transform:translate(0,0) scale(1); }
    40%    { transform:translate(10px,-14px) scale(1.04); }
    70%    { transform:translate(-7px,9px) scale(0.97); }
}

@keyframes sb-shimmer {
    from { background-position:200% center; }
    to   { background-position:-200% center; }
}

@keyframes sb-spin-in {
    from { transform:rotate(-90deg) scale(0.7); opacity:0; }
    to   { transform:rotate(0) scale(1); opacity:1; }
}
.sb-icon-spin { animation: sb-spin-in 0.25s cubic-bezier(0.34,1.56,0.64,1) both; }

/* Role-specific accent line on active items */
.sb-active-line {
    background: linear-gradient(to bottom, ${T.accentShimA}, ${T.accentShimB});
    box-shadow: 2px 0 10px ${T.accentGlow};
}

/* Scrollbar */
.sb-nav::-webkit-scrollbar { width:2px; }
.sb-nav::-webkit-scrollbar-track { background:transparent; }
.sb-nav::-webkit-scrollbar-thumb { background:${T.scrollThumb}; border-radius:9px; }
`;
}

/* ─────────────────────────────────────────────────────
   Tooltip
───────────────────────────────────────────────────── */
function Tip({ label, children, T }) {
    const [show, setShow] = useState(false);
    return (
        <div style={{ position:'relative', display:'flex', justifyContent:'center' }}
            onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
            {children}
            {show && (
                <div style={{
                    position:'absolute', left:'calc(100% + 12px)', top:'50%',
                    transform:'translateY(-50%)', zIndex:999,
                    background:T.ink, color:'#fafaf9',
                    fontSize:12, fontWeight:400,
                    padding:'5px 12px', borderRadius:8, whiteSpace:'nowrap',
                    boxShadow:'0 8px 24px rgba(0,0,0,0.14)',
                    animation:'sb-drop 0.15s ease both',
                    fontFamily:"'Geist', sans-serif",
                }}>
                    {label}
                    <div style={{
                        position:'absolute', right:'100%', top:'50%',
                        transform:'translateY(-50%)',
                        border:'4px solid transparent',
                        borderRightColor: T.ink,
                    }}/>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────
   Leaf (depth 3)
───────────────────────────────────────────────────── */
function Leaf({ label, path, location, T }) {
    const navigate = useNavigate();
    const active = location.pathname === path;
    const [hov, setHov] = useState(false);
    return (
        <button onClick={()=>navigate(path)}
            onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
            style={{
                width:'100%', display:'flex', alignItems:'center', gap:8,
                padding:'5px 12px 5px 36px',
                borderRadius:8, border:'none', cursor:'pointer',
                background: active ? T.accentSoft : hov ? T.surfaceHov : 'transparent',
                color: active ? T.accent : hov ? T.inkMid : T.inkLight,
                fontFamily:"'Geist', sans-serif",
                fontSize:12.5, fontWeight: active ? 500 : 400,
                textAlign:'left', transition:'all 0.18s ease',
            }}>
            <span style={{
                width:5, height:5, borderRadius:'50%', flexShrink:0,
                background: active ? T.accent : T.inkFaint,
                boxShadow: active ? `0 0 5px ${T.accentGlow}` : 'none',
                transition:'all 0.18s',
            }}/>
            {label}
        </button>
    );
}

/* ─────────────────────────────────────────────────────
   Group (depth 2)
───────────────────────────────────────────────────── */
function Group({ item, location, T }) {
    const navigate = useNavigate();
    const anyDeep = item.children?.some(d=>location.pathname===d.path);
    const [open, setOpen] = useState(anyDeep||false);
    const active = item.children ? anyDeep : location.pathname===item.path;
    const [hov, setHov] = useState(false);
    return (
        <div>
            <button onClick={()=>{
                if(item.children){ setOpen(o=>!o); navigate(item.children[0].path); }
                else navigate(item.path);
            }}
                onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
                style={{
                    width:'100%', display:'flex', alignItems:'center', gap:8,
                    padding:'6px 12px 6px 32px',
                    borderRadius:9, border:'none', cursor:'pointer',
                    background: active ? T.accentSoft : hov ? T.surfaceHov : 'transparent',
                    color: active ? T.accent : hov ? T.inkMid : T.inkLight,
                    fontFamily:"'Geist', sans-serif",
                    fontSize:12.5, fontWeight: active ? 500 : 400,
                    textAlign:'left', transition:'all 0.18s',
                }}>
                <span style={{
                    width:5, height:5, borderRadius:'50%', flexShrink:0,
                    background: active ? T.accent : T.inkFaint,
                    transition:'all 0.18s',
                }}/>
                <span style={{flex:1}}>{item.label}</span>
                {item.children && (
                    <ChevronDown style={{
                        width:11, height:11, opacity:0.35, flexShrink:0,
                        transition:'transform 0.22s cubic-bezier(0.34,1.2,0.64,1)',
                        transform: open ? 'rotate(0)' : 'rotate(-90deg)',
                    }}/>
                )}
            </button>
            {item.children && open && (
                <div className="sb-drop">
                    {item.children.map(d=>(
                        <Leaf key={d.path} label={d.label} path={d.path} location={location} T={T}/>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────
   Expanded Nav Item (top-level)
───────────────────────────────────────────────────── */
function NavExp({ item, location, idx, T }) {
    const navigate = useNavigate();
    const anyChildActive = item.children?.some(c=>{
        if(c.children) return c.children.some(d=>location.pathname===d.path);
        return location.pathname===c.path;
    });
    const isActive = item.children ? anyChildActive : location.pathname===item.path;
    const [open, setOpen] = useState(anyChildActive||false);
    const [hov, setHov] = useState(false);

    const iconStyle = {
        width:30, height:30, borderRadius:9, flexShrink:0,
        display:'flex', alignItems:'center', justifyContent:'center',
        background: isActive ? T.accentMid : hov ? T.inkFaint : T.inkFaint+'60',
        color: isActive ? T.accent : hov ? T.inkMid : T.inkLight,
        transition:'all 0.22s cubic-bezier(0.34,1.2,0.64,1)',
        transform: hov && !isActive ? 'scale(1.1) rotate(-5deg)' : 'scale(1) rotate(0)',
    };

    const activeLine = (
        <span className="sb-bar sb-active-line" style={{
            position:'absolute', left:0, top:'50%', transform:'translateY(-50%)',
            width:3, borderRadius:'0 99px 99px 0',
        }}/>
    );

    if (item.children) return (
        <div className="sb-item" style={{ animationDelay:`${idx*40}ms` }}>
            <button onClick={()=>setOpen(o=>!o)}
                onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
                style={{
                    position:'relative', width:'100%',
                    display:'flex', alignItems:'center', gap:10,
                    padding:'8px 10px', borderRadius:12,
                    border:'none', cursor:'pointer',
                    background: anyChildActive ? T.accentSoft : hov ? T.surfaceHov : 'transparent',
                    color: anyChildActive ? T.accent : hov ? T.inkMid : T.inkLight,
                    fontFamily:"'Geist', sans-serif",
                    fontSize:13.5, fontWeight: anyChildActive ? 500 : 400,
                    textAlign:'left',
                    transition:'all 0.2s cubic-bezier(0.34,1,0.64,1)',
                    transform: hov && !anyChildActive ? 'translateX(2px)' : 'translateX(0)',
                }}>
                {anyChildActive && activeLine}
                <span style={iconStyle}><item.icon style={{width:14,height:14}}/></span>
                <span style={{flex:1}}>{item.label}</span>
                {item.badge > 0 && (
                    <span className="sb-badge" style={{
                        background:`linear-gradient(135deg,${T.accent},${T.accentDark})`,
                        color:'#fff', fontSize:9, fontWeight:700,
                        minWidth:18, height:18, borderRadius:9, padding:'0 4px',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        boxShadow:`0 2px 8px ${T.accentGlow}`,
                    }}>{item.badge}</span>
                )}
                <ChevronDown style={{
                    width:13, height:13, opacity:0.3, flexShrink:0,
                    transition:'transform 0.25s cubic-bezier(0.34,1.2,0.64,1)',
                    transform:(open||anyChildActive)?'rotate(0)':'rotate(-90deg)',
                }}/>
            </button>
            <div style={{
                overflow:'hidden',
                maxHeight:(open||anyChildActive)?500:0,
                transition:'max-height 0.35s cubic-bezier(0.34,1,0.64,1)',
            }}>
                <div className={(open||anyChildActive)?'sb-drop':''} style={{
                    margin:'2px 0 2px 19px',
                    paddingLeft:12,
                    borderLeft:`1.5px solid ${T.inkFaint}`,
                }}>
                    {item.children.map(c=>
                        c.children
                            ? <Group key={c.label} item={c} location={location} T={T}/>
                            : <Leaf key={c.path} label={c.label} path={c.path} location={location} T={T}/>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="sb-item" style={{ animationDelay:`${idx*40}ms` }}>
            <button onClick={()=>navigate(item.path)}
                onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
                style={{
                    position:'relative', width:'100%',
                    display:'flex', alignItems:'center', gap:10,
                    padding:'8px 10px', borderRadius:12,
                    border:'none', cursor:'pointer',
                    background: isActive ? T.accentSoft : hov ? T.surfaceHov : 'transparent',
                    color: isActive ? T.accent : hov ? T.inkMid : T.inkLight,
                    fontFamily:"'Geist', sans-serif",
                    fontSize:13.5, fontWeight: isActive ? 500 : 400,
                    textAlign:'left',
                    transition:'all 0.2s cubic-bezier(0.34,1,0.64,1)',
                    transform: hov && !isActive ? 'translateX(2px)' : 'translateX(0)',
                }}>
                {isActive && activeLine}
                <span style={iconStyle}><item.icon style={{width:14,height:14}}/></span>
                <span style={{flex:1}}>{item.label}</span>
                {item.badge > 0 && (
                    <span className="sb-badge" style={{
                        background:`linear-gradient(135deg,${T.accent},${T.accentDark})`,
                        color:'#fff', fontSize:9, fontWeight:700,
                        minWidth:18, height:18, borderRadius:9, padding:'0 4px',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        boxShadow:`0 2px 8px ${T.accentGlow}`,
                    }}>{item.badge}</span>
                )}
            </button>
        </div>
    );
}

/* ─────────────────────────────────────────────────────
   Collapsed Nav Item
───────────────────────────────────────────────────── */
function NavCol({ item, location, T }) {
    const navigate = useNavigate();
    const anyChildActive = item.children?.some(c=>{
        if(c.children) return c.children.some(d=>location.pathname===d.path);
        return location.pathname===c.path;
    });
    const isActive = item.children ? anyChildActive : location.pathname===item.path;
    const [hov, setHov] = useState(false);
    return (
        <Tip label={item.label} T={T}>
            <button onClick={()=>{
                if(item.children) navigate(item.children[0]?.children?.[0]?.path||item.children[0]?.path||'/');
                else navigate(item.path);
            }}
                onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
                style={{
                    position:'relative', width:40, height:40, borderRadius:12,
                    border:'none', cursor:'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    background: isActive ? T.accentSoft : hov ? T.surfaceHov : 'transparent',
                    color: isActive ? T.accent : hov ? T.inkMid : T.inkLight,
                    transition:'all 0.2s cubic-bezier(0.34,1.3,0.64,1)',
                    transform: hov && !isActive ? 'scale(1.1)' : 'scale(1)',
                }}>
                {isActive && (
                    <span className="sb-bar sb-active-line" style={{
                        position:'absolute', left:0, top:'50%', transform:'translateY(-50%)',
                        width:3, borderRadius:'0 99px 99px 0',
                    }}/>
                )}
                <item.icon style={{width:15,height:15}}/>
                {item.badge > 0 && (
                    <span className="sb-badge" style={{
                        position:'absolute', top:3, right:3,
                        background:T.accent, color:'#fff',
                        fontSize:8, fontWeight:700, minWidth:14, height:14,
                        borderRadius:7, padding:'0 3px',
                        display:'flex', alignItems:'center', justifyContent:'center',
                    }}>{item.badge>9?'9+':item.badge}</span>
                )}
            </button>
        </Tip>
    );
}

/* ─────────────────────────────────────────────────────
   Sidebar
───────────────────────────────────────────────────── */
export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const role = user?.role || 'teacher';
    const T = ROLE_THEMES[role] || ROLE_THEMES.teacher;

    const initials = user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '??';
    const [collapsed, setCollapsed] = useState(false);
    const [logoHov, setLogoHov] = useState(false);
    const [logoutWiggle, setLogoutWiggle] = useState(false);

    const handleLogout = () => { logout(); navigate('/login'); };

    const [courses, setCourses] = useState([]);
    useEffect(()=>{
        if(role !== 'teacher') return;
        api.get('/courses').then(d=>{
            setCourses((d||[]).map(o=>({ id:o.id, name:o.subject?.name||'Unnamed' })));
        }).catch(()=>{});
    }, [role]);

    const [pendingCount, setPendingCount] = useState(0);
    useEffect(()=>{
        if(role !== 'hod' && role !== 'principal') return;
        const fetch = async () => {
            try {
                if(role === 'principal'){ const d = await apiFetch('/principal/stats'); setPendingCount(d?.stats?.pendingReports ?? 0); }
                else { const r = await apiFetch('/reports'); setPendingCount((r||[]).filter(x=>x.status==='submitted_to_hod').length); }
            } catch { setPendingCount(0); }
        };
        fetch();
        socket.on('report_change', fetch);
        return () => socket.off('report_change', fetch);
    }, [role, user?.departmentId]);

    const navItems = React.useMemo(()=>{
        const base = NAV_STATIC[role] || [];
        const withBadge = base.map(item=>{
            if(item.label === 'Reports' && (role === 'hod' || role === 'principal') && pendingCount > 0)
                return { ...item, badge: pendingCount };
            return item;
        });
        if(role !== 'teacher') return withBadge;
        const coursesItem = { label:'Courses', icon:BookOpen, path:'/teacher/courses' };
        return [withBadge[0], withBadge[1], coursesItem, ...withBadge.slice(2)];
    }, [role, courses, pendingCount]);

    const footerItems = navItems.filter(i => ['About Me','Submit Report','Submit'].includes(i.label));
    const mainItems   = navItems.filter(i => !['About Me','Submit Report','Submit'].includes(i.label));

    /* Rebuild CSS whenever role changes so all color vars update */
    const css = React.useMemo(() => buildCSS(T), [role]);

    return (
        <>
            <style>{css}</style>

            <aside className="sb" style={{
                width: collapsed ? 62 : 232,
                transition:'width 0.35s cubic-bezier(0.34,1,0.64,1)',
                background: T.bg,
                borderRight:`1px solid ${T.border}`,
                boxShadow:'4px 0 28px rgba(0,0,0,0.04)',
                display:'flex', flexDirection:'column',
                minHeight:'100vh', flexShrink:0,
                position:'relative', overflow:'hidden',
                fontFamily:"'Geist', sans-serif",
            }}>

                {/* ── Ambient blobs (role-tinted) ── */}
                <div style={{
                    position:'absolute', top:-100, right:-80,
                    width:280, height:280, borderRadius:'50%', pointerEvents:'none',
                    background:`radial-gradient(circle, ${T.accentSoft.replace('0.09','0.07')} 0%, transparent 65%)`,
                    animation:'sb-float 12s ease-in-out infinite',
                }}/>
                <div style={{
                    position:'absolute', bottom:20, left:-70,
                    width:200, height:200, borderRadius:'50%', pointerEvents:'none',
                    background:`radial-gradient(circle, ${T.accentSoft.replace('0.09','0.05')} 0%, transparent 65%)`,
                    animation:'sb-float 9s ease-in-out infinite reverse',
                }}/>

                {/* ── Logo ── */}
                <div style={{
                    height:62, flexShrink:0,
                    display:'flex', alignItems:'center',
                    padding: collapsed ? 0 : '0 14px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap:10, borderBottom:`1px solid ${T.border}`,
                    position:'relative', zIndex:10,
                }}>
                    <div
                        onMouseEnter={()=>setLogoHov(true)}
                        onMouseLeave={()=>setLogoHov(false)}
                        style={{
                            width:34, height:34, borderRadius:10, flexShrink:0,
                            background:`linear-gradient(135deg, ${T.accent} 0%, ${T.accentDark} 100%)`,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            cursor:'pointer',
                            transition:'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s',
                            transform: logoHov ? 'rotate(-8deg) scale(1.08)' : 'rotate(0) scale(1)',
                            boxShadow: logoHov ? `0 6px 24px ${T.accentGlow}` : `0 4px 16px ${T.accentGlow}`,
                        }}>
                        <GraduationCap style={{width:17,height:17,color:'#fff'}}/>
                    </div>

                    {!collapsed && (
                        <div style={{overflow:'hidden',minWidth:0}}>
                            <p style={{
                                fontFamily:"'Lora', serif",
                                fontStyle:'italic',
                                fontSize:19, lineHeight:1.1,
                                letterSpacing:'-0.2px',
                                whiteSpace:'nowrap',
                                ...(logoHov ? {
                                    background:`linear-gradient(90deg, ${T.accentShimA}, ${T.accentShimB}, ${T.accentShimA})`,
                                    backgroundSize:'200% auto',
                                    WebkitBackgroundClip:'text',
                                    WebkitTextFillColor:'transparent',
                                    backgroundClip:'text',
                                    animation:'sb-shimmer 1.8s linear infinite',
                                } : { color: T.ink }),
                                transition:'all 0.2s',
                            }}>
                                Sankalan
                            </p>
                            <p style={{
                                fontSize:10, fontWeight:500, color:T.inkLight,
                                letterSpacing:'0.9px', textTransform:'uppercase',
                                whiteSpace:'nowrap', marginTop:1,
                            }}>
                                Portal
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Collapse toggle ── */}
                <button onClick={()=>setCollapsed(c=>!c)} style={{
                    position:'absolute', top:70, right:-11, zIndex:50,
                    width:22, height:22, borderRadius:'50%',
                    background:T.surface, border:`1.5px solid ${T.border}`,
                    boxShadow:'0 2px 10px rgba(0,0,0,0.08)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    cursor:'pointer', color:T.inkLight,
                    transition:'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                }}
                    onMouseEnter={e=>{
                        e.currentTarget.style.background = T.accent;
                        e.currentTarget.style.borderColor = T.accent;
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.transform = 'scale(1.25)';
                        e.currentTarget.style.boxShadow = `0 4px 14px ${T.accentGlow}`;
                    }}
                    onMouseLeave={e=>{
                        e.currentTarget.style.background = T.surface;
                        e.currentTarget.style.borderColor = T.border;
                        e.currentTarget.style.color = T.inkLight;
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
                    }}
                >
                    <span className="sb-icon-spin" key={collapsed?'c':'e'}>
                        {collapsed ? <Menu style={{width:10,height:10}}/> : <X style={{width:10,height:10}}/>}
                    </span>
                </button>

                {/* ── Role chip ── */}
                {!collapsed && (
                    <div style={{
                        margin:'10px 12px 0',
                        padding:'4px 10px', borderRadius:99,
                        background: T.roleBg,
                        width:'fit-content',
                        display:'flex', alignItems:'center', gap:6,
                    }}>
                        <span style={{
                            width:6, height:6, borderRadius:'50%',
                            background: T.roleDot,
                            boxShadow:`0 0 5px ${T.roleDot}`,
                        }}/>
                        <span style={{
                            fontSize:11, fontWeight:600, color:T.roleText, letterSpacing:'0.15px',
                        }}>
                            {ROLE_LABEL[role]}
                        </span>
                    </div>
                )}

                {/* ── Nav ── */}
                <nav className="sb-nav" style={{
                    flex:1, overflowY:'auto', overflowX:'hidden',
                    padding: collapsed ? '10px 8px' : '6px 8px',
                    display:'flex', flexDirection:'column',
                    gap: collapsed ? 3 : 1,
                    alignItems: collapsed ? 'center' : 'stretch',
                    position:'relative', zIndex:10,
                }}>
                    {!collapsed && (
                        <p style={{
                            fontSize:9.5, fontWeight:600, color:T.inkFaint,
                            letterSpacing:'1.5px', textTransform:'uppercase',
                            padding:'10px 12px 5px',
                        }}>Navigate</p>
                    )}

                    {collapsed ? (
                        <>
                            {mainItems.map(item => <NavCol key={item.label} item={item} location={location} T={T}/>)}
                            {footerItems.length > 0 && (
                                <>
                                    <div style={{
                                        width:20, height:1, background:T.inkFaint,
                                        borderRadius:1, margin:'8px 0',
                                    }}/>
                                    {footerItems.map(item => <NavCol key={item.label} item={item} location={location} T={T}/>)}
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            {mainItems.map((item,i) => <NavExp key={item.label} item={item} location={location} idx={i} T={T}/>)}
                            {footerItems.length > 0 && (
                                <>
                                    <div style={{
                                        height:1, margin:'10px 6px',
                                        background:`linear-gradient(to right, transparent, ${T.inkFaint}, transparent)`,
                                    }}/>
                                    <p style={{
                                        fontSize:9.5, fontWeight:600, color:T.inkFaint,
                                        letterSpacing:'1.5px', textTransform:'uppercase',
                                        padding:'2px 12px 5px',
                                    }}>Quick</p>
                                    {footerItems.map((item,i) => <NavExp key={item.label} item={item} location={location} idx={mainItems.length+i} T={T}/>)}
                                </>
                            )}
                        </>
                    )}
                </nav>

                {/* ── User footer ── */}
                <div style={{
                    borderTop:`1px solid ${T.border}`,
                    padding: collapsed ? '10px 8px' : '10px',
                    position:'relative', zIndex:10,
                }}>
                    {collapsed ? (
                        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                            <Tip label={`${user?.name||'User'} · ${ROLE_LABEL[role]}`} T={T}>
                                <div className="sb-breathe" style={{
                                    width:36, height:36, borderRadius:10,
                                    background:`linear-gradient(135deg,${T.accent},${T.accentDark})`,
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                    color:'#fff', fontSize:12, fontWeight:600,
                                    cursor:'default',
                                }}>{initials}</div>
                            </Tip>
                            <Tip label="Sign out" T={T}>
                                <button onClick={handleLogout} style={{
                                    width:36, height:36, borderRadius:10,
                                    border:'none', cursor:'pointer',
                                    background:'transparent', color:T.inkLight,
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                    transition:'all 0.2s',
                                }}
                                    onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,0.08)';e.currentTarget.style.color='#ef4444';}}
                                    onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=T.inkLight;}}
                                >
                                    <LogOut style={{width:14,height:14}}/>
                                </button>
                            </Tip>
                        </div>
                    ) : (
                        <>
                            {/* User card */}
                            <div style={{
                                display:'flex', alignItems:'center', gap:9,
                                padding:'8px 9px', borderRadius:12,
                                background:T.surface, border:`1px solid ${T.border}`,
                                marginBottom:6, cursor:'default',
                                transition:'border-color 0.2s, box-shadow 0.2s',
                            }}
                                onMouseEnter={e=>{ e.currentTarget.style.borderColor=T.borderHov; e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.06)'; }}
                                onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.boxShadow='none'; }}
                            >
                                <div className="sb-breathe" style={{
                                    width:32, height:32, borderRadius:9, flexShrink:0,
                                    background:`linear-gradient(135deg,${T.accent},${T.accentDark})`,
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                    color:'#fff', fontSize:11, fontWeight:600,
                                    boxShadow:`0 3px 10px ${T.accentGlow}`,
                                }}>{initials}</div>
                                <div style={{minWidth:0,flex:1}}>
                                    <p style={{
                                        fontSize:12.5, fontWeight:500, color:T.ink,
                                        lineHeight:1.3, whiteSpace:'nowrap',
                                        overflow:'hidden', textOverflow:'ellipsis',
                                    }}>{user?.name||'User'}</p>
                                    <p style={{
                                        fontSize:10.5, color:T.inkLight,
                                        lineHeight:1.3, whiteSpace:'nowrap',
                                        overflow:'hidden', textOverflow:'ellipsis',
                                    }}>{user?.department||ROLE_LABEL[role]}</p>
                                </div>
                            </div>

                            {/* Logout */}
                            <button
                                onClick={()=>{
                                    setLogoutWiggle(true);
                                    setTimeout(()=>{ setLogoutWiggle(false); handleLogout(); }, 380);
                                }}
                                style={{
                                    width:'100%', display:'flex', alignItems:'center', gap:8,
                                    padding:'7px 10px', borderRadius:10,
                                    border:'none', cursor:'pointer',
                                    background:'transparent', color:T.inkLight,
                                    fontSize:12.5, fontWeight:400,
                                    fontFamily:"'Geist', sans-serif",
                                    textAlign:'left', transition:'all 0.2s',
                                }}
                                onMouseEnter={e=>{ e.currentTarget.style.background='rgba(239,68,68,0.07)'; e.currentTarget.style.color='#ef4444'; }}
                                onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color=T.inkLight; }}
                            >
                                <LogOut className={logoutWiggle?'sb-wiggle':''} style={{width:13,height:13}}/>
                                Sign out
                            </button>
                        </>
                    )}
                </div>
            </aside>
        </>
    );
}