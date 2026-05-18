import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useHODData } from '../../hooks/useHODData.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { Users, ChevronRight, BookOpen, GraduationCap, FileText, Loader2 } from 'lucide-react';

/* ─────────────────────────────────────────────────────
   HOD amber tokens
───────────────────────────────────────────────────── */
const A   = '#b45309';
const AD  = '#78350f';
const AS  = 'rgba(180,83,9,0.08)';
const AM  = 'rgba(180,83,9,0.16)';
const AG  = 'rgba(180,83,9,0.22)';
const AL  = '#fef3c7';
const BG  = '#fdfaf5';
const SF  = '#ffffff';
const SH  = '#fdf5e8';
const BD  = 'rgba(180,83,9,0.1)';
const BDM = 'rgba(180,83,9,0.22)';
const INK  = '#1c150a';
const INKM = '#4a3a1a';
const INKL = '#a08060';
const INKF = '#e8dcc8';

/* Multi-stop amber gradient (used on avatar + accents) */
const GRAD = 'linear-gradient(135deg, rgb(120,53,15) 0%, rgb(180,83,9) 40%, rgb(217,119,6) 75%, rgb(251,191,36) 100%)';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');

@keyframes ht-up   { from { opacity:0; transform:translateY(16px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
@keyframes ht-spin { to { transform:rotate(360deg); } }
@keyframes ht-shimmer { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }

.ht-root { font-family:'DM Sans',sans-serif; color:${INK}; }

/* Staggered card entrance */
.ht-card { animation: ht-up 0.45s cubic-bezier(0.34,1.1,0.64,1) both; }

/* Skeleton */
.ht-skel {
    background: linear-gradient(90deg,${AL} 25%,#fffbf0 50%,${AL} 75%);
    background-size:400px 100%;
    animation: ht-shimmer 1.5s linear infinite;
    border-radius:12px;
}

/* Teacher card */
.ht-teacher {
    background:${SF};
    border:1px solid ${BD};
    border-radius:20px;
    padding:22px;
    cursor:pointer;
    position:relative; overflow:hidden;
    transition: all 0.22s cubic-bezier(0.34,1.1,0.64,1);
    box-shadow: 0 2px 8px rgba(180,83,9,0.06);
}
.ht-teacher::before {
    content:'';
    position:absolute; top:0; left:0; right:0; height:3px;
    background:${GRAD};
    opacity:0; transition:opacity 0.2s;
}
.ht-teacher:hover {
    transform:translateY(-5px);
    box-shadow:0 16px 40px ${AM};
    border-color:${BDM};
}
.ht-teacher:hover::before { opacity:1; }

/* Stat tile */
.ht-stat {
    border-radius:12px; padding:10px 8px; text-align:center;
    flex:1; transition: transform 0.18s;
}
.ht-stat:hover { transform:scale(1.04); }

/* Subject tag */
.ht-tag {
    padding:3px 9px; border-radius:99px;
    font-size:10.5px; font-weight:600;
    background:${AS}; color:${A};
    white-space:nowrap; max-width:130px;
    overflow:hidden; text-overflow:ellipsis;
    transition:background 0.15s;
}
.ht-tag:hover { background:${AM}; }

/* Spinner */
.ht-spin { animation: ht-spin 0.7s linear infinite; }
`;

export default function HODTeachers() {
    const { user, departmentId } = useAuth();
    const { teachers, loading } = useHODData(departmentId);
    const navigate = useNavigate();

    /* Stat tile config */
    const statTiles = (t) => [
        { icon: BookOpen,      val: t.subject_count  || 0, label: 'Subjects',  bg: AS,                        clr: A,        iconClr: A        },
        { icon: GraduationCap, val: t.student_count  || 0, label: 'Students',  bg: 'rgba(5,150,105,0.08)',    clr: '#065f46', iconClr:'#059669' },
        { icon: FileText,      val: t.document_count || 0, label: 'Documents', bg: 'rgba(109,40,217,0.08)',   clr: '#4c1d95', iconClr:'#7c3aed' },
    ];

    return (
        <>
            <style>{CSS}</style>
            <DashboardLayout
                title="Department Teachers"
                subtitle={`${teachers.length} teacher${teachers.length !== 1 ? 's' : ''} in your department`}
            >
                <div className="ht-root">

                    {/* ── Loading ── */}
                    {loading ? (
                        <div>
                            {/* Skeleton grid */}
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:20 }}>
                                {[1,2,3,4,5,6].map(i => (
                                    <div key={i} className="ht-skel" style={{ height:190 }}/>
                                ))}
                            </div>
                        </div>

                    /* ── Empty ── */
                    ) : teachers.length === 0 ? (
                        <div style={{
                            background:SF, borderRadius:20,
                            border:`1px solid ${BD}`,
                            padding:'80px 24px', textAlign:'center',
                            boxShadow:`0 2px 8px ${AS}`,
                        }}>
                            <div className="ht-float" style={{
                                width:64, height:64, borderRadius:18, margin:'0 auto 18px',
                                background:AS, border:`1px solid ${BD}`,
                                display:'flex', alignItems:'center', justifyContent:'center',
                            }}>
                                <Users style={{ width:28, height:28, color:A }}/>
                            </div>
                            <p style={{ fontSize:15, fontWeight:700, color:INKM, marginBottom:6 }}>No teachers yet</p>
                            <p style={{ fontSize:13, color:INKL }}>No teachers are assigned to your department.</p>
                        </div>

                    /* ── Grid ── */
                    ) : (
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:20 }}>
                            {teachers.map((t, idx) => (
                                <div
                                    key={t.user_id}
                                    className="ht-card ht-teacher"
                                    style={{ animationDelay:`${idx * 50}ms` }}
                                    onClick={() => navigate(`/hod/teachers/${t.user_id}`)}
                                >
                                    {/* ── Header row ── */}
                                    <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
                                        {/* Avatar */}
                                        <div style={{
                                            width:52, height:52, borderRadius:15, flexShrink:0,
                                            background:GRAD,
                                            display:'flex', alignItems:'center', justifyContent:'center',
                                            color:'#fff', fontSize:20, fontWeight:800,
                                            boxShadow:`0 6px 18px ${AG}`,
                                            letterSpacing:'-0.5px',
                                        }}>
                                            {t.full_name?.[0]?.toUpperCase() || 'T'}
                                        </div>

                                        {/* Name + email */}
                                        <div style={{ flex:1, minWidth:0 }}>
                                            <p style={{
                                                fontSize:14.5, fontWeight:800, color:INK,
                                                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                                                lineHeight:1.2, marginBottom:4,
                                            }}>
                                                {t.full_name}
                                            </p>
                                            <p style={{
                                                fontSize:11.5, color:INKL,
                                                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                                            }}>
                                                {t.email}
                                            </p>
                                        </div>

                                        {/* Arrow */}
                                        <div style={{
                                            width:30, height:30, borderRadius:9, flexShrink:0,
                                            background:AS,
                                            display:'flex', alignItems:'center', justifyContent:'center',
                                            transition:'background 0.18s, transform 0.18s',
                                        }}
                                            onMouseEnter={e => { e.currentTarget.style.background=AM; e.currentTarget.style.transform='translateX(2px)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background=AS; e.currentTarget.style.transform='translateX(0)'; }}
                                        >
                                            <ChevronRight style={{ width:14, height:14, color:A }}/>
                                        </div>
                                    </div>

                                    {/* ── Divider ── */}
                                    <div style={{
                                        height:1, marginBottom:16,
                                        background:`linear-gradient(to right, transparent, ${INKF}, transparent)`,
                                    }}/>

                                    {/* ── Stat tiles ── */}
                                    <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                                        {statTiles(t).map((s, i) => (
                                            <div key={i} className="ht-stat" style={{ background:s.bg }}>
                                                <s.icon style={{ width:14, height:14, color:s.iconClr, margin:'0 auto 4px' }}/>
                                                <p style={{
                                                    fontSize:18, fontWeight:800, color:s.clr,
                                                    lineHeight:1, marginBottom:3,
                                                    fontFamily:"'DM Sans',sans-serif",
                                                }}>
                                                    {s.val}
                                                </p>
                                                <p style={{ fontSize:9.5, color:INKL, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                                                    {s.label}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* ── Subject tags ── */}
                                    {t.subjects && t.subjects.length > 0 && (
                                        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                                            {t.subjects.slice(0, 3).map((sub, i) => (
                                                <span key={i} className="ht-tag">{sub}</span>
                                            ))}
                                            {t.subjects.length > 3 && (
                                                <span style={{
                                                    padding:'3px 9px', borderRadius:99,
                                                    fontSize:10.5, fontWeight:600,
                                                    background:INKF, color:INKL,
                                                }}>
                                                    +{t.subjects.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </>
    );
}