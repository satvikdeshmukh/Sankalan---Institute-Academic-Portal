import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShieldCheck,
    Users,
    BarChart3,
    BookOpen,
    ArrowRight,
    Github,
    Twitter,
    Linkedin,
    GraduationCap,
    CheckCircle2,
    Sparkles,
    TrendingUp,
    Bell,
    Menu,
    X
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Tiny hook: returns true once element is in view
───────────────────────────────────────────── */
function useInView(threshold = 0.15) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setInView(true); obs.disconnect(); }
        }, { threshold });
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return [ref, inView];
}

/* ─────────────────────────────────────────────
   Animated counter
───────────────────────────────────────────── */
function Counter({ value, suffix = '' }) {
    const [display, setDisplay] = useState(0);
    const num = parseInt(value.replace(/\D/g, ''), 10);
    const [ref, inView] = useInView(0.3);
    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const step = Math.ceil(num / 60);
        const id = setInterval(() => {
            start += step;
            if (start >= num) { setDisplay(num); clearInterval(id); }
            else setDisplay(start);
        }, 16);
        return () => clearInterval(id);
    }, [inView, num]);
    return <span ref={ref}>{display.toLocaleString()}{suffix}</span>;
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const LandingPage = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
    const heroRef = useRef(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 30);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const onMouseMove = (e) => {
            setMousePos({
                x: (e.clientX / window.innerWidth) * 100,
                y: (e.clientY / window.innerHeight) * 100,
            });
        };
        window.addEventListener('mousemove', onMouseMove);
        return () => window.removeEventListener('mousemove', onMouseMove);
    }, []);

    const features = [
        {
            icon: <ShieldCheck className="w-6 h-6" />,
            title: "Admin Hub",
            desc: "Manage institutional data, user roles, and system configurations with unified control.",
            accent: "#6366f1",
            lightBg: "#eef2ff",
            tag: "Security"
        },
        {
            icon: <Users className="w-6 h-6" />,
            title: "HOD Suite",
            desc: "Streamline departmental oversight, faculty tracking, and student performance metrics.",
            accent: "#0ea5e9",
            lightBg: "#e0f2fe",
            tag: "Teams"
        },
        {
            icon: <BarChart3 className="w-6 h-6" />,
            title: "Academic Insights",
            desc: "Transform raw data into meaningful analytics for better decision-making and success tracking.",
            accent: "#8b5cf6",
            lightBg: "#ede9fe",
            tag: "Data"
        },
        {
            icon: <BookOpen className="w-6 h-6" />,
            title: "Faculty Desk",
            desc: "Effortlessly manage student cohorts, submit grades, and handle course documentation.",
            accent: "#10b981",
            lightBg: "#d1fae5",
            tag: "Productivity"
        }
    ];

    const stats = [
        { label: "Students", value: "2500", suffix: "+" },
        { label: "Faculty Members", value: "100", suffix: "+" },
        { label: "Departments", value: "7", suffix: "" },
        { label: "Uptime", value: "99", suffix: ".9%" }
    ];

    const [featRef, featInView] = useInView();
    const [statsRef, statsInView] = useInView();

    return (
        <div className="landing-root">
            {/* ── Cursor glow that follows mouse ── */}
            <div
                className="cursor-glow"
                style={{ left: `${mousePos.x}%`, top: `${mousePos.y}%` }}
            />

            {/* ── Navigation ── */}
            <nav className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
                <div className="nav-inner">
                    <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="logo-icon">
                            <GraduationCap size={20} />
                        </div>
                        <span className="logo-text">Sankalan<span> Portal</span></span>
                    </div>

                    <div className="nav-links">
                        <a href="#features">Features</a>
                        <a href="#stats">Impact</a>
                        <a href="#about">About</a>
                    </div>

                    <div className="nav-actions">
                        <button className="btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
                        <button className="btn-primary" onClick={() => navigate('/login')}>
                            Get Started <ArrowRight size={15} />
                        </button>
                    </div>

                    <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
                        {menuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>

                {/* Mobile menu */}
                <div className={`mobile-menu ${menuOpen ? 'mobile-menu--open' : ''}`}>
                    <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
                    <a href="#stats" onClick={() => setMenuOpen(false)}>Impact</a>
                    <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
                    <button className="btn-primary w-full" onClick={() => navigate('/login')}>
                        Get Started <ArrowRight size={15} />
                    </button>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="hero" ref={heroRef}>
                {/* Animated grid background */}
                <div className="hero-grid" />
                {/* Glowing orbs */}
                <div className="orb orb-1" />
                <div className="orb orb-2" />
                <div className="orb orb-3" />

                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="badge-dot" />
                        Integrated Academic Portal
                        <Sparkles size={13} />
                    </div>

                    <h1 className="hero-title">
                        <span className="title-line title-line-1">Empowering Institutional Excellence.</span>
                    </h1>

                    <p className="hero-sub">
                        A unified platform for administrators, faculty, and departments to manage academic records, track progress, and generate insightful reports.
                    </p>

                    <div className="hero-cta">
                        <button className="btn-hero-primary" onClick={() => navigate('/login')}>
                            <span>Launch Portal</span>
                            <ArrowRight size={18} />
                        </button>
                        <button className="btn-hero-ghost" onClick={() => navigate('/login')}>
                            Explore Roles
                        </button>
                    </div>

                    
                    
                </div>

                {/* ── Dashboard Preview ── */}
                <div className="dashboard-wrap">
                    <div className="dashboard-card">
                        <div className="db-topbar">
                            <div className="db-dot red" /><div className="db-dot amber" /><div className="db-dot green" />
                            <span className="db-title">Sankalan Dashboard</span>
                            <Bell size={14} className="db-bell" />
                        </div>
                        <div className="db-body">
                            {/* Sidebar */}
                            <div className="db-sidebar">
                                <div className="db-sidebar-avatar">DR</div>
                                <div className="db-sidebar-items">
                                    {['Overview','Students','Faculty','Analytics','Settings'].map((item, i) => (
                                        <div key={i} className={`db-sidebar-item ${i === 0 ? 'active' : ''}`}>
                                            <div className="db-sidebar-dot" />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Main panel */}
                            <div className="db-main">
                                <div className="db-greeting">Good morning!</div>
                                <div className="db-kpis">
                                    {[
                                        { label: 'Active Students', val: '2,461', delta: '+3.2%', color: '#6366f1' },
                                        { label: 'Attendance Rate', val: '87.4%', delta: '+1.5%', color: '#10b981' },
                                        { label: 'At-Risk Students', val: '38', delta: '-12%', color: '#f59e0b' },
                                    ].map((k, i) => (
                                        <div key={i} className="db-kpi-card" style={{ '--accent': k.color }}>
                                            <div className="db-kpi-label">{k.label}</div>
                                            <div className="db-kpi-val">{k.val}</div>
                                            <div className="db-kpi-delta">
                                                <TrendingUp size={11} /> {k.delta}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Bar chart mockup */}
                                <div className="db-chart">
                                    <div className="db-chart-title">Weekly Attendance</div>
                                    <div className="db-bars">
                                        {[65,80,72,91,85,78,95].map((h, i) => (
                                            <div key={i} className="db-bar-wrap">
                                                <div className="db-bar" style={{ '--h': h + '%', '--delay': i * 80 + 'ms' }} />
                                                <span className="db-bar-label">{['M','T','W','T','F','S','S'][i]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Floating notification cards */}
                    
                    
                </div>
            </section>

            {/* ── Marquee strip ── */}
            <div className="marquee-strip">
                <div className="marquee-inner">
                    {Array(3).fill(['Admin Portal','HOD Dashboard','Grade Analytics','Attendance Tracking','Faculty Management','Student Profiles','Report Generation','Risk Alerts']).flat().map((t, i) => (
                        <span key={i} className="marquee-item">{t} <span className="marquee-dot">✦</span></span>
                    ))}
                </div>
            </div>

            {/* ── Features ── */}
            <section id="features" className="features-section" ref={featRef}>
                <div className="section-label">
                    <Sparkles size={13} /> Core Capabilities
                </div>
                <h2 className="section-title">
                    Tailored for Every<br />
                    <span className="title-gradient">Academic Role</span>
                </h2>
                <p className="section-sub">
                    Everything you need to manage education at scale, designed with precision and clarity.
                </p>
                <div className={`features-grid ${featInView ? 'in-view' : ''}`}>
                    {features.map((f, i) => (
                        <div
                            key={i}
                            className="feature-card"
                            style={{ '--accent': f.accent, '--light': f.lightBg, '--delay': i * 100 + 'ms' }}
                        >
                            <div className="feature-tag">{f.tag}</div>
                            <div className="feature-icon-wrap">
                                {f.icon}
                            </div>
                            <h3 className="feature-title">{f.title}</h3>
                            <p className="feature-desc">{f.desc}</p>
                            <div className="feature-link">
                                Learn more <ArrowRight size={13} />
                            </div>
                            <div className="feature-glow" />
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Stats ── */}
            <section id="stats" className="stats-section" ref={statsRef}>
                <div className="stats-bg-pattern" />
                <div className={`stats-grid ${statsInView ? 'in-view' : ''}`}>
                    {stats.map((s, i) => (
                        <div key={i} className="stat-item" style={{ '--delay': i * 120 + 'ms' }}>
                            <div className="stat-value">
                                <Counter value={s.value} suffix={s.suffix} />
                            </div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Testimonial ── */}
            <section id="about" className="testimonial-section">
                <div className="testimonial-card">
                    <div className="quote-mark">"</div>
                    <blockquote>
                        The Sankalan Portal has completely transformed how we handle departmental
                        operations. The real-time attendance risk analytics have improved student
                        retention by <strong>15%</strong> in a single semester.
                    </blockquote>
                    <div className="testimonial-author">
                        <div className="author-avatar">DR</div>
                        <div>
                            <div className="author-name">Dr. Rajesh Kumar</div>
                            <div className="author-role">HOD, Computer Science Department</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA Banner ── */}
            <section className="cta-section">
                <div className="cta-orb cta-orb-1" />
                <div className="cta-orb cta-orb-2" />
                <div className="cta-content">
                    <h2>Start Your Academic Journey Today</h2>
                    <p>Join 150+ faculty members already using Sankalan Portal.</p>
                    <button className="btn-cta" onClick={() => navigate('/login')}>
                        Get Started Today <ArrowRight size={18} />
                    </button>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="footer">
                <div className="footer-inner">
                    <div className="footer-brand">
                        <div className="logo">
                            <div className="logo-icon"><GraduationCap size={20} /></div>
                            <span className="logo-text">Sankalan<span>Portal</span></span>
                        </div>
                        <p>Elevating academic administration through intelligent data management and seamless collaboration.</p>
                        <div className="social-links">
                            <button><Twitter size={17} /></button>
                            <button><Linkedin size={17} /></button>
                            <button><Github size={17} /></button>
                        </div>
                    </div>
                    <div className="footer-col">
                        <h4>Product</h4>
                        <ul>
                            <li><a href="#">Feature Set</a></li>
                            <li><a href="#">Roadmap</a></li>
                            <li><a href="#">Security</a></li>
                            <li><a href="#">Support</a></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h4>Legal</h4>
                        <ul>
                            <li><a href="#">Privacy Policy</a></li>
                            <li><a href="#">Terms of Use</a></li>
                            <li><a href="#">Compliance</a></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2026 Sankalan Portal. Built for Academic Excellence.</p>
                    <div className="footer-bottom-links">
                        <a href="#">Accessibility</a>
                        <a href="#">Feedback</a>
                    </div>
                </div>
            </footer>

            {/* ── All Styles ── */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                :root {
                    --indigo: #6366f1;
                    --indigo-dark: #4f46e5;
                    --indigo-light: #e0e7ff;
                    --sky: #0ea5e9;
                    --emerald: #10b981;
                    --slate-900: #0f172a;
                    --slate-700: #334155;
                    --slate-500: #64748b;
                    --slate-300: #cbd5e1;
                    --slate-100: #f1f5f9;
                    --slate-50: #f8fafc;
                    --white: #ffffff;
                    --font-display: 'Bricolage Grotesque', sans-serif;
                    --font-body: 'DM Sans', sans-serif;
                    --radius: 20px;
                    --shadow-sm: 0 1px 3px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.04);
                    --shadow-md: 0 4px 16px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.04);
                    --shadow-lg: 0 20px 60px rgba(0,0,0,.1), 0 8px 20px rgba(0,0,0,.06);
                    --shadow-xl: 0 40px 100px rgba(99,102,241,.15), 0 20px 40px rgba(0,0,0,.08);
                }

                html { scroll-behavior: smooth; }

                .landing-root {
                    font-family: var(--font-body);
                    color: var(--slate-900);
                    background: var(--white);
                    overflow-x: hidden;
                    position: relative;
                }

                /* ── Cursor glow ── */
                .cursor-glow {
                    position: fixed;
                    width: 600px;
                    height: 600px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(99,102,241,.06) 0%, transparent 70%);
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                    z-index: 0;
                    transition: left .8s ease, top .8s ease;
                }

                /* ── Utility ── */
                .title-gradient {
                    background: linear-gradient(135deg, var(--indigo) 0%, var(--sky) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                /* ── Buttons ── */
                .btn-primary {
                    display: inline-flex; align-items: center; gap: 6px;
                    padding: 10px 22px;
                    background: var(--slate-900);
                    color: var(--white);
                    border: none; cursor: pointer;
                    border-radius: 12px;
                    font-family: var(--font-body);
                    font-size: 14px; font-weight: 600;
                    transition: transform .2s, box-shadow .2s, background .2s;
                    white-space: nowrap;
                }
                .btn-primary:hover { background: #1e293b; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(15,23,42,.2); }

                .btn-ghost {
                    background: none; border: none; cursor: pointer;
                    font-family: var(--font-body);
                    font-size: 14px; font-weight: 600;
                    color: var(--slate-700);
                    padding: 10px 16px;
                    border-radius: 10px;
                    transition: color .2s, background .2s;
                }
                .btn-ghost:hover { color: var(--indigo); background: var(--indigo-light); }

                .btn-hero-primary {
                    display: inline-flex; align-items: center; gap: 10px;
                    padding: 16px 32px;
                    background: linear-gradient(135deg, var(--indigo) 0%, var(--indigo-dark) 100%);
                    color: white; border: none; cursor: pointer;
                    border-radius: 16px;
                    font-family: var(--font-display);
                    font-size: 16px; font-weight: 700;
                    box-shadow: 0 8px 32px rgba(99,102,241,.35), 0 2px 8px rgba(99,102,241,.2);
                    transition: transform .25s, box-shadow .25s;
                    position: relative; overflow: hidden;
                }
                .btn-hero-primary::before {
                    content: '';
                    position: absolute; inset: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,.15) 0%, transparent 50%);
                }
                .btn-hero-primary:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(99,102,241,.45), 0 4px 12px rgba(99,102,241,.3); }
                .btn-hero-primary:active { transform: translateY(0); }

                .btn-hero-ghost {
                    display: inline-flex; align-items: center; gap: 10px;
                    padding: 16px 32px;
                    background: white; color: var(--slate-700);
                    border: 1.5px solid var(--slate-300);
                    border-radius: 16px; cursor: pointer;
                    font-family: var(--font-display);
                    font-size: 16px; font-weight: 600;
                    transition: border-color .2s, box-shadow .2s, transform .2s;
                }
                .btn-hero-ghost:hover { border-color: var(--indigo); color: var(--indigo); transform: translateY(-2px); box-shadow: var(--shadow-md); }

                .btn-cta {
                    display: inline-flex; align-items: center; gap: 10px;
                    padding: 16px 40px;
                    background: white; color: var(--indigo-dark);
                    border: none; border-radius: 16px; cursor: pointer;
                    font-family: var(--font-display);
                    font-size: 17px; font-weight: 800;
                    box-shadow: 0 8px 32px rgba(0,0,0,.15);
                    transition: transform .2s, box-shadow .2s;
                }
                .btn-cta:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(0,0,0,.2); }

                /* ── Nav ── */
                .nav {
                    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
                    padding: 20px 0;
                    transition: all .3s ease;
                }
                .nav--scrolled {
                    background: rgba(255,255,255,.85);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-bottom: 1px solid rgba(99,102,241,.1);
                    padding: 12px 0;
                    box-shadow: 0 4px 24px rgba(0,0,0,.05);
                }
                .nav-inner {
                    max-width: 1200px; margin: 0 auto;
                    padding: 0 24px;
                    display: flex; align-items: center; gap: 24px;
                }
                .logo {
                    display: flex; align-items: center; gap: 10px;
                    cursor: pointer; flex-shrink: 0;
                }
                .logo-icon {
                    width: 40px; height: 40px;
                    background: linear-gradient(135deg, var(--indigo) 0%, var(--indigo-dark) 100%);
                    border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    color: white;
                    box-shadow: 0 4px 12px rgba(99,102,241,.3);
                    transition: transform .2s;
                }
                .logo:hover .logo-icon { transform: rotate(-5deg) scale(1.05); }
                .logo-text {
                    font-family: var(--font-display);
                    font-size: 20px; font-weight: 800;
                    color: var(--slate-900);
                }
                .logo-text span { color: var(--indigo); }
                .nav-links {
                    display: flex; align-items: center; gap: 32px;
                    margin-left: auto;
                }
                @media (max-width: 768px) { .nav-links { display: none; } }
                .nav-links a {
                    font-size: 14px; font-weight: 600;
                    color: var(--slate-600);
                    text-decoration: none;
                    transition: color .2s;
                    position: relative;
                }
                .nav-links a::after {
                    content: ''; position: absolute;
                    bottom: -4px; left: 0; right: 0; height: 2px;
                    background: var(--indigo); border-radius: 2px;
                    transform: scaleX(0); transition: transform .2s;
                }
                .nav-links a:hover { color: var(--indigo); }
                .nav-links a:hover::after { transform: scaleX(1); }
                .nav-actions {
                    display: flex; align-items: center; gap: 8px;
                    margin-left: 32px;
                }
                @media (max-width: 640px) { .nav-actions { display: none; } }
                .hamburger {
                    display: none; margin-left: auto;
                    background: none; border: none; cursor: pointer;
                    color: var(--slate-700); padding: 6px;
                }
                @media (max-width: 640px) { .hamburger { display: flex; } }
                .mobile-menu {
                    display: none; flex-direction: column; gap: 4px;
                    padding: 12px 24px 20px;
                    background: white;
                    border-top: 1px solid var(--slate-100);
                    max-height: 0; overflow: hidden;
                    transition: max-height .3s ease;
                }
                .mobile-menu--open { display: flex; max-height: 400px; }
                .mobile-menu a {
                    font-size: 15px; font-weight: 600; color: var(--slate-700);
                    text-decoration: none; padding: 12px 0;
                    border-bottom: 1px solid var(--slate-100);
                }
                .mobile-menu .btn-primary { margin-top: 12px; justify-content: center; }

                /* ── Hero ── */
                .hero {
                    min-height: 100vh;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    align-items: center;
                    gap: 48px;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 120px 24px 80px;
                    position: relative;
                    overflow: visible;
                }
                @media (max-width: 1024px) {
                    .hero { grid-template-columns: 1fr; padding-top: 100px; text-align: center; }
                }

                /* Orbs */
                .orb {
                    position: fixed;
                    border-radius: 50%;
                    filter: blur(80px);
                    pointer-events: none;
                    z-index: -1;
                    animation: orbFloat 8s ease-in-out infinite;
                }
                .orb-1 { width: 600px; height: 600px; top: -10%; left: -10%; background: rgba(99,102,241,.08); animation-delay: 0s; }
                .orb-2 { width: 400px; height: 400px; top: 20%; right: 5%; background: rgba(14,165,233,.06); animation-delay: -3s; }
                .orb-3 { width: 500px; height: 500px; bottom: -5%; left: 20%; background: rgba(139,92,246,.06); animation-delay: -6s; }

                .hero-grid {
                    position: absolute;
                    inset: 0;
                    background-image:
                        linear-gradient(rgba(99,102,241,.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(99,102,241,.04) 1px, transparent 1px);
                    background-size: 60px 60px;
                    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
                    pointer-events: none;
                }

                .hero-content {
                    position: relative; z-index: 2;
                    display: flex; flex-direction: column; gap: 24px;
                }
                @media (max-width: 1024px) { .hero-content { align-items: center; } }

                .hero-badge {
                    display: inline-flex; align-items: center; gap: 8px;
                    padding: 8px 16px;
                    background: linear-gradient(135deg, rgba(99,102,241,.08) 0%, rgba(14,165,233,.06) 100%);
                    border: 1px solid rgba(99,102,241,.15);
                    border-radius: 100px;
                    font-size: 12px; font-weight: 700;
                    color: var(--indigo);
                    letter-spacing: .03em;
                    text-transform: uppercase;
                    width: fit-content;
                    animation: fadeUp .7s ease forwards;
                }
                .badge-dot {
                    width: 8px; height: 8px;
                    background: var(--indigo);
                    border-radius: 50%;
                    animation: pulseDot 2s ease-in-out infinite;
                }

                .hero-title {
                    font-family: var(--font-display);
                    font-size: clamp(44px, 5.5vw, 72px);
                    font-weight: 800;
                    line-height: 1.08;
                    letter-spacing: -.03em;
                    color: var(--slate-900);
                    display: flex; flex-direction: column; gap: 4px;
                }
                .title-line {
                    display: block;
                    opacity: 0; animation: fadeUp .7s ease forwards;
                }
                .title-line-1 { animation-delay: .1s; }
                .title-line-2 { animation-delay: .2s; }

                .hero-sub {
                    font-size: 17px; line-height: 1.7;
                    color: var(--slate-500);
                    max-width: 480px;
                    opacity: 0; animation: fadeUp .7s .3s ease forwards;
                }

                .hero-cta {
                    display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
                    opacity: 0; animation: fadeUp .7s .4s ease forwards;
                }
                @media (max-width: 1024px) { .hero-cta { justify-content: center; } }

                .hero-proof {
                    display: flex; align-items: center; gap: 14px;
                    font-size: 13px; color: var(--slate-500);
                    opacity: 0; animation: fadeUp .7s .5s ease forwards;
                }
                @media (max-width: 1024px) { .hero-proof { justify-content: center; } }
                .hero-proof strong { color: var(--slate-700); }

                .avatar-stack { display: flex; }
                .avatar {
                    width: 32px; height: 32px; border-radius: 50%;
                    background: linear-gradient(135deg, var(--indigo) 0%, var(--sky) 100%);
                    border: 2px solid white;
                    display: flex; align-items: center; justify-content: center;
                    color: white; font-size: 10px; font-weight: 800;
                    margin-left: -8px;
                }
                .avatar:first-child { margin-left: 0; }

                /* ── Dashboard ── */
                .dashboard-wrap {
                    position: relative; z-index: 2;
                    opacity: 0; animation: fadeLeft .9s .3s ease forwards;
                }
                @media (max-width: 1024px) { 
                    .dashboard-wrap { opacity: 0; animation: fadeUp .9s .5s ease forwards; }
                }
                .dashboard-card {
                    background: white;
                    border: 1px solid rgba(99,102,241,.12);
                    border-radius: 24px;
                    box-shadow: var(--shadow-xl), inset 0 1px 0 rgba(255,255,255,.8);
                    overflow: hidden;
                }
                .db-topbar {
                    padding: 12px 18px;
                    background: var(--slate-50);
                    border-bottom: 1px solid var(--slate-100);
                    display: flex; align-items: center; gap: 8px;
                }
                .db-dot { width: 12px; height: 12px; border-radius: 50%; }
                .db-dot.red { background: #ff5f57; }
                .db-dot.amber { background: #febc2e; }
                .db-dot.green { background: #28c840; }
                .db-title { font-size: 13px; font-weight: 600; color: var(--slate-500); margin: 0 auto; }
                .db-bell { color: var(--slate-400); }

                .db-body { display: flex; height: 340px; }

                .db-sidebar {
                    width: 120px; flex-shrink: 0;
                    padding: 16px 12px;
                    border-right: 1px solid var(--slate-100);
                    display: flex; flex-direction: column; gap: 16px;
                    background: var(--slate-50);
                }
                .db-sidebar-avatar {
                    width: 36px; height: 36px; border-radius: 10px;
                    background: linear-gradient(135deg, var(--indigo), var(--sky));
                    display: flex; align-items: center; justify-content: center;
                    color: white; font-size: 11px; font-weight: 800;
                }
                .db-sidebar-items { display: flex; flex-direction: column; gap: 4px; }
                .db-sidebar-item {
                    display: flex; align-items: center; gap: 8px;
                    padding: 7px 10px; border-radius: 8px;
                    cursor: pointer; transition: background .2s;
                }
                .db-sidebar-item:hover { background: var(--slate-100); }
                .db-sidebar-item.active { background: var(--indigo-light); }
                .db-sidebar-item.active span { color: var(--indigo); font-weight: 700; }
                .db-sidebar-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--slate-300); flex-shrink: 0; }
                .db-sidebar-item.active .db-sidebar-dot { background: var(--indigo); }
                .db-sidebar-item span { font-size: 11px; font-weight: 500; color: var(--slate-500); }

                .db-main { flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 12px; overflow: hidden; }
                .db-greeting { font-size: 13px; font-weight: 600; color: var(--slate-700); }
                .db-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
                .db-kpi-card {
                    padding: 10px 12px; border-radius: 12px;
                    background: white; border: 1px solid var(--slate-100);
                    box-shadow: var(--shadow-sm);
                }
                .db-kpi-label { font-size: 9px; font-weight: 600; color: var(--slate-400); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 4px; }
                .db-kpi-val { font-family: var(--font-display); font-size: 18px; font-weight: 800; color: var(--slate-900); margin-bottom: 2px; }
                .db-kpi-delta { display: flex; align-items: center; gap: 3px; font-size: 10px; font-weight: 700; color: var(--emerald); }

                .db-chart { background: white; border: 1px solid var(--slate-100); border-radius: 12px; padding: 12px; flex: 1; }
                .db-chart-title { font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 10px; text-transform: uppercase; letter-spacing: .05em; }
                .db-bars { display: flex; align-items: flex-end; gap: 6px; height: 80px; }
                .db-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
                .db-bar {
                    width: 100%; border-radius: 4px 4px 0 0;
                    background: linear-gradient(180deg, var(--indigo) 0%, rgba(99,102,241,.5) 100%);
                    height: 0;
                    animation: growBar .8s var(--delay, 0ms) cubic-bezier(.34,1.56,.64,1) forwards;
                }
                .db-bar-label { font-size: 9px; font-weight: 600; color: var(--slate-400); }

                /* Floating cards */
                .float-card {
                    position: absolute;
                    background: white;
                    border: 1px solid rgba(99,102,241,.12);
                    border-radius: 14px;
                    padding: 10px 14px;
                    display: flex; align-items: center; gap: 10px;
                    box-shadow: 0 8px 32px rgba(0,0,0,.1);
                    animation: floatCard 4s ease-in-out infinite;
                }
                .float-card-1 { bottom: 40px; left: -40px; animation-delay: 0s; }
                .float-card-2 { top: 50px; right: -24px; animation-delay: -2s; }
                @media (max-width: 1200px) { .float-card-1 { left: -10px; } .float-card-2 { right: 0; } }
                .float-card-title { font-size: 12px; font-weight: 700; color: var(--slate-800); }
                .float-card-sub { font-size: 11px; color: var(--slate-400); margin-top: 1px; }

                /* ── Marquee ── */
                .marquee-strip {
                    background: var(--slate-900);
                    padding: 14px 0;
                    overflow: hidden;
                    position: relative; z-index: 10;
                }
                .marquee-inner {
                    display: flex; gap: 0;
                    animation: marquee 30s linear infinite;
                    white-space: nowrap;
                }
                .marquee-item {
                    font-size: 13px; font-weight: 700;
                    color: rgba(255,255,255,.5);
                    letter-spacing: .05em;
                    text-transform: uppercase;
                    padding: 0 24px;
                    flex-shrink: 0;
                }
                .marquee-dot { color: var(--indigo); margin-left: 4px; }

                /* ── Features ── */
                .features-section {
                    padding: 120px 24px;
                    max-width: 1200px; margin: 0 auto;
                    text-align: center;
                }
                .section-label {
                    display: inline-flex; align-items: center; gap: 6px;
                    font-size: 12px; font-weight: 800;
                    color: var(--indigo);
                    text-transform: uppercase; letter-spacing: .1em;
                    margin-bottom: 20px;
                }
                .section-title {
                    font-family: var(--font-display);
                    font-size: clamp(32px, 4.5vw, 56px);
                    font-weight: 800; line-height: 1.1;
                    letter-spacing: -.03em;
                    margin-bottom: 20px;
                }
                .section-sub {
                    font-size: 17px; color: var(--slate-500);
                    max-width: 520px; margin: 0 auto 64px;
                    line-height: 1.7;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 24px;
                }
                @media (max-width: 1024px) { .features-grid { grid-template-columns: repeat(2, 1fr); } }
                @media (max-width: 600px) { .features-grid { grid-template-columns: 1fr; } }

                .feature-card {
                    background: white;
                    border: 1.5px solid var(--slate-100);
                    border-radius: var(--radius);
                    padding: 32px 28px;
                    text-align: left;
                    position: relative; overflow: hidden;
                    cursor: default;
                    transition: border-color .3s, box-shadow .3s, transform .3s;
                    opacity: 0; transform: translateY(24px);
                }
                .features-grid.in-view .feature-card {
                    animation: fadeUp .6s var(--delay, 0ms) ease forwards;
                }
                .feature-card:hover {
                    border-color: var(--accent);
                    box-shadow: 0 20px 60px rgba(0,0,0,.08), 0 0 0 1px var(--accent);
                    transform: translateY(-6px);
                }
                .feature-card:hover .feature-glow { opacity: 1; }
                .feature-glow {
                    position: absolute; inset: 0;
                    background: radial-gradient(circle at 50% 0%, var(--light) 0%, transparent 70%);
                    opacity: 0; transition: opacity .4s;
                    pointer-events: none;
                }
                .feature-tag {
                    display: inline-block;
                    font-size: 10px; font-weight: 800;
                    color: var(--accent);
                    text-transform: uppercase; letter-spacing: .1em;
                    background: var(--light);
                    padding: 4px 10px; border-radius: 100px;
                    margin-bottom: 20px;
                }
                .feature-icon-wrap {
                    width: 52px; height: 52px;
                    background: var(--accent);
                    border-radius: 14px;
                    display: flex; align-items: center; justify-content: center;
                    color: white; margin-bottom: 20px;
                    box-shadow: 0 8px 20px color-mix(in srgb, var(--accent) 30%, transparent);
                    transition: transform .3s;
                }
                .feature-card:hover .feature-icon-wrap { transform: scale(1.1) rotate(-3deg); }
                .feature-title {
                    font-family: var(--font-display);
                    font-size: 19px; font-weight: 700;
                    margin-bottom: 12px; color: var(--slate-900);
                }
                .feature-desc {
                    font-size: 14px; line-height: 1.7;
                    color: var(--slate-500); margin-bottom: 24px;
                }
                .feature-link {
                    display: flex; align-items: center; gap: 6px;
                    font-size: 12px; font-weight: 800;
                    color: var(--accent);
                    text-transform: uppercase; letter-spacing: .07em;
                    transition: gap .2s;
                }
                .feature-card:hover .feature-link { gap: 10px; }

                /* ── Stats ── */
                .stats-section {
                    background: var(--slate-900);
                    padding: 100px 24px;
                    position: relative; overflow: hidden;
                }
                .stats-bg-pattern {
                    position: absolute; inset: 0;
                    background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,.04) 1px, transparent 0);
                    background-size: 40px 40px;
                }
                .stats-grid {
                    max-width: 900px; margin: 0 auto;
                    display: grid; grid-template-columns: repeat(4, 1fr);
                    gap: 40px; text-align: center; position: relative;
                }
                @media (max-width: 640px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
                .stat-item {
                    opacity: 0; transform: translateY(20px);
                }
                .stats-grid.in-view .stat-item {
                    animation: fadeUp .6s var(--delay, 0ms) ease forwards;
                }
                .stat-value {
                    font-family: var(--font-display);
                    font-size: clamp(42px, 5vw, 64px);
                    font-weight: 800; color: white;
                    line-height: 1; margin-bottom: 10px;
                    background: linear-gradient(135deg, white 0%, rgba(255,255,255,.7) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .stat-label {
                    font-size: 12px; font-weight: 700;
                    color: rgba(255,255,255,.4);
                    text-transform: uppercase; letter-spacing: .12em;
                }

                /* ── Testimonial ── */
                .testimonial-section {
                    padding: 120px 24px;
                    display: flex; align-items: center; justify-content: center;
                    background: var(--slate-50);
                }
                .testimonial-card {
                    max-width: 780px; width: 100%;
                    background: white;
                    border-radius: 28px;
                    padding: 60px;
                    border: 1px solid var(--slate-100);
                    box-shadow: var(--shadow-lg);
                    position: relative;
                }
                @media (max-width: 640px) { .testimonial-card { padding: 40px 28px; } }
                .quote-mark {
                    font-family: var(--font-display);
                    font-size: 120px; font-weight: 800;
                    color: var(--indigo-light);
                    line-height: .6;
                    position: absolute; top: 30px; left: 48px;
                    user-select: none;
                }
                blockquote {
                    font-family: var(--font-display);
                    font-size: clamp(20px, 2.5vw, 26px);
                    font-weight: 500;
                    line-height: 1.55;
                    color: var(--slate-700);
                    margin-bottom: 36px;
                    position: relative; z-index: 1;
                }
                blockquote strong { color: var(--indigo); }
                .testimonial-author { display: flex; align-items: center; gap: 16px; }
                .author-avatar {
                    width: 52px; height: 52px; border-radius: 14px;
                    background: linear-gradient(135deg, var(--indigo), var(--sky));
                    display: flex; align-items: center; justify-content: center;
                    color: white; font-size: 15px; font-weight: 800;
                    flex-shrink: 0;
                }
                .author-name { font-weight: 800; font-size: 16px; color: var(--slate-900); }
                .author-role { font-size: 13px; color: var(--slate-400); margin-top: 2px; }

                /* ── CTA Section ── */
                .cta-section {
                    background: linear-gradient(135deg, var(--indigo-dark) 0%, #4338ca 50%, #3730a3 100%);
                    padding: 120px 24px;
                    text-align: center;
                    position: relative; overflow: hidden;
                }
                .cta-orb {
                    position: absolute; border-radius: 50%;
                    filter: blur(80px); pointer-events: none;
                }
                .cta-orb-1 { width: 400px; height: 400px; top: -20%; left: -10%; background: rgba(255,255,255,.08); }
                .cta-orb-2 { width: 300px; height: 300px; bottom: -10%; right: 5%; background: rgba(99,102,241,.3); }
                .cta-content { position: relative; z-index: 2; }
                .cta-content h2 {
                    font-family: var(--font-display);
                    font-size: clamp(30px, 4vw, 52px);
                    font-weight: 800; color: white;
                    margin-bottom: 16px;
                    letter-spacing: -.03em;
                }
                .cta-content p {
                    font-size: 17px; color: rgba(255,255,255,.7);
                    margin-bottom: 40px;
                }

                /* ── Footer ── */
                .footer { padding: 80px 24px 40px; background: white; }
                .footer-inner {
                    max-width: 1200px; margin: 0 auto;
                    display: grid; grid-template-columns: 2fr 1fr 1fr;
                    gap: 48px; padding-bottom: 48px;
                    border-bottom: 1px solid var(--slate-100);
                    margin-bottom: 32px;
                }
                @media (max-width: 768px) { .footer-inner { grid-template-columns: 1fr; } }
                .footer-brand { display: flex; flex-direction: column; gap: 20px; }
                .footer-brand p { font-size: 14px; color: var(--slate-400); max-width: 280px; line-height: 1.7; }
                .social-links { display: flex; gap: 10px; }
                .social-links button {
                    width: 38px; height: 38px; border-radius: 10px;
                    border: 1px solid var(--slate-100);
                    background: var(--slate-50);
                    display: flex; align-items: center; justify-content: center;
                    color: var(--slate-400); cursor: pointer;
                    transition: all .2s;
                }
                .social-links button:hover { background: var(--indigo-light); color: var(--indigo); border-color: transparent; }
                .footer-col h4 { font-weight: 800; font-size: 14px; margin-bottom: 20px; color: var(--slate-800); }
                .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 12px; }
                .footer-col li a { font-size: 14px; color: var(--slate-400); text-decoration: none; transition: color .2s; font-weight: 500; }
                .footer-col li a:hover { color: var(--indigo); }
                .footer-bottom {
                    max-width: 1200px; margin: 0 auto;
                    display: flex; align-items: center; justify-content: space-between;
                    font-size: 13px; color: var(--slate-400); font-weight: 500;
                }
                @media (max-width: 640px) { .footer-bottom { flex-direction: column; gap: 12px; text-align: center; } }
                .footer-bottom-links { display: flex; gap: 24px; }
                .footer-bottom-links a { color: var(--slate-400); text-decoration: none; transition: color .2s; }
                .footer-bottom-links a:hover { color: var(--indigo); }

                /* ── Keyframes ── */
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeLeft {
                    from { opacity: 0; transform: translateX(40px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes orbFloat {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33%       { transform: translate(20px, -20px) scale(1.05); }
                    66%       { transform: translate(-15px, 15px) scale(0.97); }
                }
                @keyframes pulseDot {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,.5); }
                    50%       { box-shadow: 0 0 0 6px rgba(99,102,241,0); }
                }
                @keyframes growBar {
                    from { height: 0; }
                    to   { height: var(--h, 50%); }
                }
                @keyframes floatCard {
                    0%, 100% { transform: translateY(0px); }
                    50%       { transform: translateY(-8px); }
                }
                @keyframes marquee {
                    from { transform: translateX(0); }
                    to   { transform: translateX(-33.333%); }
                }
            `}</style>
        </div>
    );
};

export default LandingPage;