import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Sidebar from './Sidebar.jsx';
import { apiFetch } from '../../lib/api.js';
import socket from '../../lib/socket.js';
import { Bell, Search, Settings, ChevronRight, User, LogOut, Home } from 'lucide-react';

/* ─────────────────────────────────────────────────────
   Role theme tokens — mirrors Sidebar.jsx exactly
   teacher  → forest green
   hod      → amber / orange
   principal→ red / rose
   admin    → violet / purple
───────────────────────────────────────────────────── */
const ROLE_THEMES = {
    teacher: {
        accent:      '#2d6a4f',
        accentDark:  '#1a3d2e',
        accentSoft:  'rgba(45,106,79,0.08)',
        accentMid:   'rgba(45,106,79,0.14)',
        accentGlow:  'rgba(45,106,79,0.22)',
        accentLight: '#d8f3dc',
        gradFrom:    '#2d6a4f',
        gradTo:      '#40916c',
        headerBg:    '#fdfaf5',
        headerBorder:'rgba(45,106,79,0.12)',
        inkLight:    '#8fa89e',
        inkFaint:    '#dde6e2',
        roleDot:     '#52b788',
        badgeBg:     '#ef4444',
        hoverBg:     'rgba(45,106,79,0.07)',
        hoverText:   '#2d6a4f',
        dropdownHdr: 'linear-gradient(135deg, #2d6a4f 0%, #40916c 100%)',
        searchFocus: 'rgba(45,106,79,0.15)',
    },
    hod: {
        accent:      '#b45309',
        accentDark:  '#78350f',
        accentSoft:  'rgba(180,83,9,0.08)',
        accentMid:   'rgba(180,83,9,0.14)',
        accentGlow:  'rgba(180,83,9,0.22)',
        accentLight: '#fef3c7',
        gradFrom:    '#b45309',
        gradTo:      '#d97706',
        headerBg:    '#fdfaf5',
        headerBorder:'rgba(180,83,9,0.12)',
        inkLight:    '#a08060',
        inkFaint:    '#e8dcc8',
        roleDot:     '#f59e0b',
        badgeBg:     '#ef4444',
        hoverBg:     'rgba(180,83,9,0.07)',
        hoverText:   '#b45309',
        dropdownHdr: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
        searchFocus: 'rgba(180,83,9,0.15)',
    },
    principal: {
        accent:      '#be123c',
        accentDark:  '#881337',
        accentSoft:  'rgba(190,18,60,0.08)',
        accentMid:   'rgba(190,18,60,0.14)',
        accentGlow:  'rgba(190,18,60,0.22)',
        accentLight: '#ffe4e6',
        gradFrom:    '#be123c',
        gradTo:      '#e11d48',
        headerBg:    '#fdf5f5',
        headerBorder:'rgba(190,18,60,0.12)',
        inkLight:    '#a07080',
        inkFaint:    '#e8ccd2',
        roleDot:     '#fb7185',
        badgeBg:     '#ef4444',
        hoverBg:     'rgba(190,18,60,0.07)',
        hoverText:   '#be123c',
        dropdownHdr: 'linear-gradient(135deg, #be123c 0%, #e11d48 100%)',
        searchFocus: 'rgba(190,18,60,0.15)',
    },
    admin: {
        accent:      '#6d28d9',
        accentDark:  '#3b0764',
        accentSoft:  'rgba(109,40,217,0.08)',
        accentMid:   'rgba(109,40,217,0.14)',
        accentGlow:  'rgba(109,40,217,0.22)',
        accentLight: '#ede9fe',
        gradFrom:    '#6d28d9',
        gradTo:      '#7c3aed',
        headerBg:    '#f8f6fd',
        headerBorder:'rgba(109,40,217,0.12)',
        inkLight:    '#8878a8',
        inkFaint:    '#ddd8ec',
        roleDot:     '#a78bfa',
        badgeBg:     '#ef4444',
        hoverBg:     'rgba(109,40,217,0.07)',
        hoverText:   '#6d28d9',
        dropdownHdr: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
        searchFocus: 'rgba(109,40,217,0.15)',
    },
};

/* ─────────────────────────────────────────────────────
   CSS injected once — role-independent animations
───────────────────────────────────────────────────── */
const HEADER_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');

@keyframes hdr-pop {
    from { opacity:0; transform:translateY(-8px) scale(0.96); }
    to   { opacity:1; transform:translateY(0) scale(1); }
}
.hdr-dropdown { animation: hdr-pop 0.2s cubic-bezier(0.34,1.3,0.64,1) both; }

@keyframes hdr-badge-in {
    0%   { transform: scale(0) rotate(-20deg); }
    70%  { transform: scale(1.2) rotate(5deg); }
    100% { transform: scale(1) rotate(0); }
}
.hdr-badge { animation: hdr-badge-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }

@keyframes hdr-dot-pulse {
    0%,100% { box-shadow: 0 0 0 0 var(--role-dot-glow); }
    50%      { box-shadow: 0 0 0 4px transparent; }
}
.hdr-dot { animation: hdr-dot-pulse 2.5s ease-in-out infinite; }

@keyframes hdr-slide-in {
    from { opacity:0; transform:translateX(12px); }
    to   { opacity:1; transform:translateX(0); }
}
.hdr-in { animation: hdr-slide-in 0.4s cubic-bezier(0.34,1.2,0.64,1) both; }

@keyframes hdr-avatar-breathe {
    0%,100% { box-shadow: 0 0 0 0 var(--role-avatar-glow); }
    50%      { box-shadow: 0 0 0 4px transparent; }
}
.hdr-avatar { animation: hdr-avatar-breathe 3s ease-in-out infinite; }
`;

/* ─────────────────────────────────────────────────────
   Mini Calendar
───────────────────────────────────────────────────── */
function MiniCalendar({ T }) {
    const today = new Date();
    const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const year  = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];
    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const prev = () => setViewDate(new Date(year, month - 1, 1));
    const next = () => setViewDate(new Date(year, month + 1, 1));

    return (
        <div style={{
            width:210, borderRadius:16, overflow:'hidden',
            border:`1px solid ${T.headerBorder}`,
            boxShadow:`0 4px 24px ${T.accentSoft}`,
            background:'#fff',
            fontFamily:"'DM Sans',sans-serif",
        }}>
            {/* Header */}
            <div style={{
                background: T.dropdownHdr,
                padding:'10px 14px',
                display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
                {[prev, next].map((fn, i) => (
                    <button key={i} onClick={fn} style={{
                        width:24, height:24, borderRadius:7,
                        background:'rgba(255,255,255,0.18)',
                        border:'none', cursor:'pointer', color:'#fff',
                        fontSize:14, lineHeight:1,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        transition:'background 0.15s',
                    }}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.28)'}
                        onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.18)'}
                    >
                        {i === 0 ? '‹' : '›'}
                    </button>
                ))}
                <p style={{ color:'#fff', fontSize:12, fontWeight:700, letterSpacing:'0.3px', flex:1, textAlign:'center' }}>
                    {MONTHS[month]} {year}
                </p>
            </div>

            <div style={{ padding:'10px 12px 12px' }}>
                {/* Weekday headers */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:4 }}>
                    {DAYS.map(d => (
                        <div key={d} style={{ textAlign:'center', fontSize:9, fontWeight:700, color:T.inkFaint, padding:'2px 0', textTransform:'uppercase' }}>
                            {d}
                        </div>
                    ))}
                </div>
                {/* Day cells */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px 0' }}>
                    {cells.map((d, i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'center', height:26 }}>
                            {d && (
                                <span style={{
                                    width:26, height:26, borderRadius:'50%',
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                    fontSize:11, fontWeight: isToday(d) ? 700 : 400, cursor:'default',
                                    background: isToday(d) ? T.accent : 'transparent',
                                    color: isToday(d) ? '#fff' : '#4a5568',
                                    boxShadow: isToday(d) ? `0 2px 8px ${T.accentGlow}` : 'none',
                                    transition:'background 0.15s',
                                }}>
                                    {d}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
                {/* Today row */}
                <div style={{
                    marginTop:10, paddingTop:8,
                    borderTop:`1px solid ${T.inkFaint}`,
                    display:'flex', alignItems:'center', gap:7,
                }}>
                    <span style={{
                        width:7, height:7, borderRadius:'50%', flexShrink:0,
                        background: T.accent,
                        boxShadow:`0 0 5px ${T.accentGlow}`,
                    }}/>
                    <p style={{ fontSize:10, color:T.inkLight, fontWeight:500 }}>
                        {today.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' })}
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────
   Header
───────────────────────────────────────────────────── */
function Header({ title, subtitle }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [notifCount, setNotifCount] = useState(0);
    const [searchFocused, setSearchFocused] = useState(false);
    const [searchVal, setSearchVal] = useState('');

    const role = user?.role?.toLowerCase() || 'teacher';
    const T = ROLE_THEMES[role] || ROLE_THEMES.teacher;
    const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
    const profilePath = `/${role}/profile`;
    const reportsPath = `/${role}/reports`;

    /* Notification count */
    const fetchNotifs = useCallback(async () => {
        if (!user) return;
        try {
            if (role === 'hod') {
                const reports = await apiFetch('/reports');
                setNotifCount((reports || []).filter(r => r.status === 'submitted_to_hod').length);
            } else if (role === 'principal') {
                const data = await apiFetch('/principal/stats');
                setNotifCount(data?.stats?.pendingReports ?? 0);
            } else {
                setNotifCount(0);
            }
        } catch { setNotifCount(0); }
    }, [user, role]);

    useEffect(() => {
        fetchNotifs();
        socket.on('report_change', fetchNotifs);
        return () => socket.off('report_change', fetchNotifs);
    }, [fetchNotifs]);

    const ROLE_LABEL = { teacher:'Teacher', hod:'HOD', principal:'Principal', admin:'Admin' };

    return (
        <header style={{
            flexShrink:0,
            height:64,
            background: T.headerBg,
            borderBottom:`1px solid ${T.headerBorder}`,
            padding:'0 24px',
            display:'flex', alignItems:'center', justifyContent:'space-between', gap:16,
            fontFamily:"'DM Sans',sans-serif",
            position:'relative', zIndex:40,
        }}>
            {/* Left: title + subtitle */}
            <div style={{ minWidth:0, flex:'0 1 auto' }}>
                <h1 style={{
                    fontSize:17, fontWeight:700,
                    color:'#141f1a', lineHeight:1.2,
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                }}>
                    {title || 'Dashboard'}
                </h1>
                {subtitle && (
                    <p style={{
                        fontSize:11, color: T.inkLight,
                        marginTop:1, overflow:'hidden',
                        textOverflow:'ellipsis', whiteSpace:'nowrap',
                    }}>
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Right: actions row */}
            <div className="hdr-in" style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>

                {/* ── Search bar ── */}
                <div style={{
                    display:'flex', alignItems:'center', gap:8,
                    padding:'7px 14px',
                    borderRadius:12,
                    border:`1.5px solid ${searchFocused ? T.accent : T.inkFaint}`,
                    background: searchFocused ? T.accentSoft : '#f9fafb',
                    transition:'all 0.2s',
                    boxShadow: searchFocused ? `0 0 0 3px ${T.searchFocus}` : 'none',
                    width: searchFocused ? 200 : 160,
                }}>
                    <Search style={{ width:14, height:14, color: searchFocused ? T.accent : T.inkLight, flexShrink:0, transition:'color 0.2s' }}/>
                    <input
                        value={searchVal}
                        onChange={e => setSearchVal(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        placeholder="Search…"
                        style={{
                            border:'none', outline:'none', background:'transparent',
                            fontSize:12.5, fontWeight:400,
                            color:'#1c1917', width:'100%',
                            fontFamily:"'DM Sans',sans-serif",
                        }}
                    />
                </div>

                {/* ── Notification bell ── */}
                <button onClick={() => navigate(reportsPath)}
                    title={notifCount > 0 ? `${notifCount} pending` : 'Reports'}
                    style={{
                        position:'relative',
                        width:38, height:38, borderRadius:11,
                        border:'none', cursor:'pointer',
                        background:'transparent',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        color: T.inkLight,
                        transition:'all 0.18s',
                    }}
                    onMouseEnter={e=>{ e.currentTarget.style.background=T.accentSoft; e.currentTarget.style.color=T.accent; }}
                    onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color=T.inkLight; }}
                >
                    <Bell style={{ width:17, height:17 }}/>
                    {notifCount > 0 ? (
                        <span className="hdr-badge" style={{
                            position:'absolute', top:-2, right:-2,
                            minWidth:17, height:17, borderRadius:9, padding:'0 4px',
                            background:'#ef4444', color:'#fff',
                            fontSize:8.5, fontWeight:800,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            border:'2px solid #fff',
                            boxShadow:'0 2px 6px rgba(239,68,68,0.4)',
                        }}>
                            {notifCount > 9 ? '9+' : notifCount}
                        </span>
                    ) : (
                        <span className="hdr-dot" style={{
                            '--role-dot-glow': T.accentGlow,
                            position:'absolute', top:8, right:8,
                            width:7, height:7, borderRadius:'50%',
                            background: T.accent,
                            border:'2px solid #fff',
                        }}/>
                    )}
                </button>

                {/* ── Settings ── */}
                <button onClick={() => navigate(profilePath)}
                    style={{
                        width:38, height:38, borderRadius:11,
                        border:'none', cursor:'pointer',
                        background:'transparent',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        color: T.inkLight,
                        transition:'all 0.18s',
                    }}
                    onMouseEnter={e=>{ e.currentTarget.style.background=T.accentSoft; e.currentTarget.style.color=T.accent; }}
                    onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color=T.inkLight; }}
                >
                    <Settings style={{ width:16, height:16 }}/>
                </button>

                {/* ── Divider ── */}
                <div style={{ width:1, height:28, background:T.inkFaint }}/>

                {/* ── Profile dropdown ── */}
                <div style={{ position:'relative' }}>
                    <button
                        onClick={() => setShowDropdown(v => !v)}
                        style={{
                            display:'flex', alignItems:'center', gap:9,
                            padding:'5px 10px 5px 5px',
                            borderRadius:12,
                            border:`1.5px solid ${showDropdown ? T.accent : 'transparent'}`,
                            background: showDropdown ? T.accentSoft : 'transparent',
                            cursor:'pointer',
                            transition:'all 0.18s',
                        }}
                        onMouseEnter={e=>{ if(!showDropdown){ e.currentTarget.style.background=T.accentSoft; e.currentTarget.style.borderColor=T.inkFaint; }}}
                        onMouseLeave={e=>{ if(!showDropdown){ e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='transparent'; }}}
                    >
                        {/* Avatar */}
                        <div className="hdr-avatar" style={{
                            '--role-avatar-glow': T.accentGlow,
                            width:32, height:32, borderRadius:10, flexShrink:0,
                            background:`linear-gradient(135deg, ${T.gradFrom} 0%, ${T.gradTo} 100%)`,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            color:'#fff', fontSize:11.5, fontWeight:700,
                            boxShadow:`0 3px 10px ${T.accentGlow}`,
                        }}>
                            {initials}
                        </div>
                        {/* Name + role */}
                        <div style={{ textAlign:'left' }}>
                            <p style={{
                                fontSize:12.5, fontWeight:600, color:'#1c1917',
                                lineHeight:1.2, whiteSpace:'nowrap',
                            }}>
                                {user?.name || 'User'}
                            </p>
                            <p style={{
                                fontSize:10, color: T.accent,
                                fontWeight:600, lineHeight:1.2,
                                textTransform:'capitalize',
                            }}>
                                {ROLE_LABEL[role]}
                            </p>
                        </div>
                        <ChevronRight style={{
                            width:13, height:13, color:T.inkLight,
                            transition:'transform 0.2s',
                            transform: showDropdown ? 'rotate(90deg)' : 'rotate(0)',
                        }}/>
                    </button>

                    {/* Dropdown */}
                    {showDropdown && (
                        <>
                            <div style={{ position:'fixed', inset:0, zIndex:100 }} onClick={() => setShowDropdown(false)}/>
                            <div className="hdr-dropdown" style={{
                                position:'absolute', right:0, top:'calc(100% + 8px)',
                                width:200, borderRadius:16,
                                background:'#fff',
                                border:`1px solid ${T.headerBorder}`,
                                boxShadow:`0 8px 40px rgba(0,0,0,0.1), 0 2px 8px ${T.accentSoft}`,
                                zIndex:110, overflow:'hidden',
                                fontFamily:"'DM Sans',sans-serif",
                            }}>
                                {/* Gradient header */}
                                <div style={{
                                    background: T.dropdownHdr,
                                    padding:'14px 16px',
                                    display:'flex', alignItems:'center', gap:10,
                                }}>
                                    <div style={{
                                        width:36, height:36, borderRadius:10, flexShrink:0,
                                        background:'rgba(255,255,255,0.22)',
                                        display:'flex', alignItems:'center', justifyContent:'center',
                                        color:'#fff', fontSize:13, fontWeight:700,
                                    }}>
                                        {initials}
                                    </div>
                                    <div style={{ minWidth:0 }}>
                                        <p style={{
                                            fontSize:13, fontWeight:700, color:'#fff',
                                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                                        }}>
                                            {user?.name || 'User'}
                                        </p>
                                        <p style={{
                                            fontSize:10, color:'rgba(255,255,255,0.65)',
                                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                                            marginTop:1,
                                        }}>
                                            {user?.email || ROLE_LABEL[role]}
                                        </p>
                                    </div>
                                </div>

                                {/* Menu items */}
                                <div style={{ padding:'6px' }}>
                                    {[
                                        { icon: User,     label:'My Profile',  action: () => { navigate(profilePath); setShowDropdown(false); } },
                                        { icon: Settings, label:'Settings',     action: () => { navigate(profilePath); setShowDropdown(false); } },
                                    ].map(({ icon: Icon, label, action }) => (
                                        <button key={label} onClick={action} style={{
                                            width:'100%', display:'flex', alignItems:'center', gap:10,
                                            padding:'8px 10px', borderRadius:10,
                                            border:'none', cursor:'pointer',
                                            background:'transparent', color:'#3d524a',
                                            fontSize:13, fontWeight:400,
                                            fontFamily:"'Geist',sans-serif",
                                            textAlign:'left', transition:'all 0.15s',
                                        }}
                                            onMouseEnter={e=>{ e.currentTarget.style.background=T.accentSoft; e.currentTarget.style.color=T.accent; }}
                                            onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#3d524a'; }}
                                        >
                                            <Icon style={{ width:15, height:15, flexShrink:0 }}/>
                                            {label}
                                        </button>
                                    ))}

                                    {/* Divider */}
                                    <div style={{ height:1, background:T.inkFaint, margin:'4px 2px' }}/>

                                    {/* Logout */}
                                    <button onClick={() => { logout(); navigate('/login'); setShowDropdown(false); }}
                                        style={{
                                            width:'100%', display:'flex', alignItems:'center', gap:10,
                                            padding:'8px 10px', borderRadius:10,
                                            border:'none', cursor:'pointer',
                                            background:'transparent', color:'#ef4444',
                                            fontSize:13, fontWeight:400,
                                            fontFamily:"'Geist',sans-serif",
                                            textAlign:'left', transition:'all 0.15s',
                                        }}
                                        onMouseEnter={e=>{ e.currentTarget.style.background='rgba(239,68,68,0.07)'; }}
                                        onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; }}
                                    >
                                        <LogOut style={{ width:15, height:15, flexShrink:0 }}/>
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

/* ─────────────────────────────────────────────────────
   Dashboard Layout
───────────────────────────────────────────────────── */
export default function DashboardLayout({ title, subtitle, children, showCalendar = false }) {
    const { user } = useAuth();
    const role = user?.role?.toLowerCase() || 'teacher';
    const T = ROLE_THEMES[role] || ROLE_THEMES.teacher;

    return (
        <>
            <style>{HEADER_CSS}</style>
            <div style={{ display:'flex', height:'100vh', background:'#f4f6f4', overflow:'hidden' }}>
                <Sidebar />
                <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
                    <Header title={title} subtitle={subtitle} />
                    <main style={{
                        flex:1, overflowY:'auto',
                        scrollbarWidth:'thin',
                        scrollbarColor:`${T.inkFaint} transparent`,
                    }}>
                        {showCalendar ? (
                            <div style={{ display:'flex', gap:20, padding:24, alignItems:'flex-start' }}>
                                <div style={{ flex:1, minWidth:0 }}>{children}</div>
                            </div>
                        ) : (
                            <div style={{ padding:24 }}>{children}</div>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
}

export { MiniCalendar };