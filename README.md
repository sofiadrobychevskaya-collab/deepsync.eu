<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DeepSync | EU Grants & Innovation Strategy</title>
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet">
    <!-- Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary-blue: #003399;
            --accent-gold: #FFCC00;
            --dark-navy: #0A1628;
            --bg-light: #F4F7FD;
            --text-dark: #1A1A2E;
            --text-muted: #5A6A85;
            --success-green: #1DB954;
            --white: #FFFFFF;
            --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            scroll-behavior: smooth;
        }
        body {
            font-family: 'Inter', sans-serif;
            color: var(--text-dark);
            line-height: 1.6;
            overflow-x: hidden;
            background-color: var(--white);
        }
        h1, h2, h3 {
            font-family: 'Syne', sans-serif;
            font-weight: 800;
            line-height: 1.1;
        }
        .numbers {
            font-family: 'Space Grotesk', sans-serif;
        }
        /* --- Components --- */
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 1rem 2rem;
            border-radius: 8px;
            font-weight: 700;
            text-decoration: none;
            cursor: pointer;
            transition: var(--transition);
            border: none;
            gap: 10px;
        }
        .btn-gold {
            background-color: var(--accent-gold);
            color: var(--dark-navy);
        }
        .btn-gold:hover {
            background-color: #e6b800;
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(255, 204, 0, 0.2);
        }
        .btn-outline {
            border: 2px solid var(--white);
            color: var(--white);
            background: transparent;
        }
        .btn-outline:hover {
            background: var(--white);
            color: var(--primary-blue);
        }
        .section-padding {
            padding: 100px 5%;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .reveal {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.8s ease-out;
        }
        .reveal.active {
            opacity: 1;
            transform: translateY(0);
        }
        /* --- Announcement Bar --- */
        #announcement-bar {
            background-color: var(--accent-gold);
            color: var(--dark-navy);
            padding: 10px 5%;
            text-align: center;
            font-weight: 600;
            font-size: 0.9rem;
            position: relative;
            z-index: 1001;
        }
        #announcement-bar a {
            color: var(--dark-navy);
            text-decoration: underline;
        }
        #announcement-bar .close-ann {
            position: absolute;
            right: 20px;
            cursor: pointer;
            top: 50%;
            transform: translateY(-50%);
        }
        /* --- Navigation --- */
        nav {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 20px 5%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 1000;
            transition: var(--transition);
            border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        nav.scrolled {
            padding: 12px 5%;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .logo-container {
            display: flex;
            flex-direction: column;
        }
        .logo {
            font-family: 'Syne', sans-serif;
            font-size: 1.8rem;
            color: var(--primary-blue);
            display: flex;
            align-items: center;
            gap: 8px;
            text-decoration: none;
        }
        .logo-stars {
            display: flex;
            gap: 2px;
            color: var(--accent-gold);
        }
        .tagline {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-muted);
            margin-top: -5px;
        }
        .nav-links {
            display: flex;
            gap: 30px;
            align-items: center;
        }
        .nav-links a {
            text-decoration: none;
            color: var(--text-dark);
            font-weight: 500;
            font-size: 0.95rem;
            transition: var(--transition);
        }
        .nav-links a:hover {
            color: var(--primary-blue);
        }
        .hamburger {
            display: none;
            flex-direction: column;
            gap: 5px;
            cursor: pointer;
        }
        .hamburger span {
            width: 25px;
            height: 3px;
            background: var(--primary-blue);
            border-radius: 2px;
        }
        /* --- Hero Section --- */
        .hero {
            background: linear-gradient(135deg, var(--dark-navy) 0%, var(--primary-blue) 100%);
            color: var(--white);
            min-height: 90vh;
            display: flex;
            align-items: center;
            position: relative;
            overflow: hidden;
        }
        #hero-canvas {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        .hero-content {
            z-index: 1;
            width: 100%;
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 50px;
            align-items: center;
        }
        .hero h1 {
            font-size: 4rem;
            margin-bottom: 25px;
        }
        .hero p {
            font-size: 1.2rem;
            opacity: 0.9;
            margin-bottom: 40px;
            max-width: 600px;
        }
        .hero-btns {
            display: flex;
            gap: 20px;
            margin-bottom: 60px;
        }
        .hero-visual {
            position: relative;
        }
        .eu-map-svg {
            width: 100%;
            filter: drop-shadow(0 0 20px rgba(255,255,255,0.1));
        }
        .map-dot {
            fill: var(--accent-gold);
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.5); opacity: 0.5; }
            100% { transform: scale(1); opacity: 1; }
        }
        .trust-strip {
            display: flex;
            gap: 40px;
            flex-wrap: wrap;
        }
        .trust-item {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
        }
        /* --- Stats Bar --- */
        .stats-bar {
            background: var(--dark-navy);
            padding: 60px 5%;
            color: var(--white);
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            text-align: center;
            gap: 30px;
        }
        .stat-card h3 {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 3rem;
            color: var(--accent-gold);
            margin-bottom: 10px;
        }
        /* --- About Section --- */
        .about-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 80px;
            align-items: center;
        }
        .about-visual {
            background: var(--bg-light);
            padding: 40px;
            border-radius: 20px;
            border-left: 8px solid var(--primary-blue);
            position: relative;
        }
        .credential-badge {
            background: var(--white);
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .badge-icon {
            color: var(--primary-blue);
            font-size: 1.5rem;
        }
        /* --- Services Section --- */
        .services {
            background-color: var(--bg-light);
        }
        .section-header {
            text-align: center;
            margin-bottom: 60px;
        }
        .section-header h2 {
            font-size: 2.8rem;
            margin-bottom: 15px;
        }
        .services-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
        }
        .service-card {
            background: var(--white);
            padding: 40px;
            border-radius: 15px;
            border-left: 5px solid var(--primary-blue);
            transition: var(--transition);
            height: 100%;
        }
        .service-card:hover {
            transform: translateY(-10px);
            background: var(--primary-blue);
            color: var(--white);
        }
        .service-icon {
            width: 60px;
            height: 60px;
            background: var(--accent-gold);
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            font-size: 1.5rem;
            margin-bottom: 25px;
            color: var(--dark-navy);
        }
        .service-card h3 {
            margin-bottom: 15px;
        }
        .service-cta-banner {
            margin-top: 50px;
            background: var(--primary-blue);
            color: var(--white);
            padding: 30px 50px;
            border-radius: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        /* --- Programs Section --- */
        .programs-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
        }
        .program-card {
            border: 1px solid #eee;
            padding: 30px;
            border-radius: 15px;
            position: relative;
            transition: var(--transition);
        }
        .program-card:hover {
            border-color: var(--primary-blue);
            box-shadow: 0 15px 30px rgba(0,0,0,0.05);
        }
        .funding-badge {
            background: var(--accent-gold);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 700;
            display: inline-block;
            margin-bottom: 15px;
        }
        /* --- Partner Marquee --- */
        .marquee-container {
            overflow: hidden;
            background: var(--white);
            padding: 40px 0;
            position: relative;
        }
        .marquee-row {
            display: flex;
            width: max-content;
            animation: scroll 40s linear infinite;
            gap: 30px;
            margin-bottom: 20px;
        }
        .marquee-row.reverse {
            animation-direction: reverse;
        }
        .marquee-row:hover {
            animation-play-state: paused;
        }
        .partner-pill {
            background: var(--bg-light);
            padding: 12px 25px;
            border-radius: 50px;
            white-space: nowrap;
            font-weight: 600;
            border: 1px solid #eef2f8;
        }
        @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
        /* --- Testimonials --- */
        .testimonials {
            background: var(--bg-light);
            overflow: hidden;
        }
        .carousel {
            position: relative;
            max-width: 900px;
            margin: 0 auto;
        }
        .testimonial-card {
            display: none;
            background: var(--white);
            padding: 60px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.05);
        }
        .testimonial-card.active {
            display: block;
            animation: fadeIn 0.5s ease;
        }
        .quote-icon {
            font-size: 3rem;
            color: var(--accent-gold);
            margin-bottom: 20px;
        }
        .testimonial-text {
            font-size: 1.4rem;
            font-style: italic;
            margin-bottom: 30px;
        }
        .testimonial-author {
            font-weight: 700;
            font-size: 1.1rem;
        }
        .outcome-badge {
            background: var(--success-green);
            color: var(--white);
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.8rem;
            margin-top: 15px;
            display: inline-block;
        }
        /* --- Eligibility Section --- */
        .eligibility-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        .elig-box {
            padding: 40px;
            border-radius: 20px;
        }
        .elig-box.perfect {
            background: #eef8f1;
            border-top: 5px solid var(--success-green);
        }
        .elig-box.not-fit {
            background: #fff5f5;
            border-top: 5px solid #ff4d4d;
        }
        .elig-list {
            list-style: none;
            margin-top: 25px;
        }
        .elig-list li {
            margin-bottom: 15px;
            display: flex;
            gap: 10px;
        }
        /* --- Contact Section --- */
        .contact-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 80px;
        }
        .contact-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .form-group input, .form-group select, .form-group textarea {
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-family: inherit;
        }
        .expect-panel {
            background: var(--dark-navy);
            color: var(--white);
            padding: 40px;
            border-radius: 20px;
        }
        .expect-list {
            list-style: none;
            margin: 30px 0;
        }
        .expect-list li {
            margin-bottom: 15px;
            color: rgba(255,255,255,0.8);
        }
        /* --- Telegram Section --- */
        .telegram-cta {
            background: linear-gradient(rgba(10, 22, 40, 0.9), rgba(10, 22, 40, 0.9)), url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80');
            background-size: cover;
            color: var(--white);
            text-align: center;
        }
        /* --- Footer --- */
        footer {
            background: #050b14;
            color: var(--white);
            padding: 80px 5% 40px;
        }
        .footer-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 40px;
            margin-bottom: 60px;
        }
        .footer-col h4 {
            margin-bottom: 20px;
            color: var(--accent-gold);
        }
        .footer-col ul {
            list-style: none;
        }
        .footer-col ul li {
            margin-bottom: 10px;
            opacity: 0.7;
        }
        .footer-bottom {
            padding-top: 40px;
            border-top: 1px solid rgba(255,255,255,0.1);
            font-size: 0.8rem;
            opacity: 0.5;
            display: flex;
            justify-content: space-between;
        }
        /* --- Success Modal --- */
        #success-msg {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--white);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 30px 60px rgba(0,0,0,0.2);
            z-index: 2000;
            text-align: center;
        }
        /* --- Mobile Responsive --- */
        @media (max-width: 1024px) {
            .hero h1 { font-size: 3rem; }
            .services-grid, .programs-grid { grid-template-columns: repeat(2, 1fr); }
            .hero-content, .about-grid, .contact-grid, .eligibility-grid { grid-template-columns: 1fr; }
            .hero-visual { display: none; }
        }
        @media (max-width: 768px) {
            .nav-links { display: none; }
            .hamburger { display: flex; }
            .stats-grid { grid-template-columns: repeat(2, 1fr); }
            .services-grid, .programs-grid { grid-template-columns: 1fr; }
            .footer-grid { grid-template-columns: repeat(2, 1fr); }
            .hero h1 { font-size: 2.5rem; }
        }
        /* Utility */
        .hidden { display: none !important; }
    </style>
</head>
<body>
    <!-- Announcement Bar -->
    <div id="announcement-bar">
        📢 New Grant Calls Open — EIC Accelerator 2025 | Horizon Europe | Cascade Funding → <a href="https://t.me/+i5CWWcCyqfA3MTAy" target="_blank">Join Our Telegram</a>
        <i class="fas fa-times close-ann" onclick="dismissAnn()"></i>
    </div>
    <!-- Navigation -->
    <nav id="navbar">
        <a href="#" class="logo-container">
            <div class="logo">
                <div class="logo-stars">
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                </div>
                DeepSync
            </div>
            <span class="tagline">EU Grants & Innovation Strategy</span>
        </a>
        <div class="nav-links">
            <a href="#about">Who We Are</a>
            <a href="#services">Services</a>
            <a href="#programs">Programs</a>
            <a href="#testimonials">Success Stories</a>
            <a href="#contact" class="btn btn-gold" style="padding: 10px 20px; font-size: 0.9rem;">Book Free Consultation</a>
        </div>
        <div class="hamburger" onclick="toggleMenu()">
            <span></span><span></span><span></span>
        </div>
    </nav>
    <!-- Hero Section -->
    <header class="hero">
        <canvas id="hero-canvas"></canvas>
        <div class="container section-padding">
            <div class="hero-content">
                <div class="reveal">
                    <h1>Secure Equity-Free EU Funding for Your DeepTech Startup</h1>
                    <p>We connect breakthrough innovators with Horizon Europe, EIC, EIT, and more — handling everything from discovery to submission.</p>
                    <div class="hero-btns">
                        <a href="#contact" class="btn btn-gold">Book Your Free Strategy Session</a>
                        <a href="#programs" class="btn btn-outline">See Grant Programs <i class="fas fa-arrow-right"></i></a>
                    </div>
                    <div class="trust-strip">
                        <div class="trust-item"><i class="fas fa-award text-gold"></i> 30+ Successful Applications</div>
                        <div class="trust-item"><i class="fas fa-globe-europe"></i> 20+ Countries</div>
                        <div class="trust-item"><i class="fas fa-check-circle"></i> 90% Success Rate</div>
                    </div>
                </div>
                <div class="hero-visual reveal">
                    <svg class="eu-map-svg" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
                        <!-- Simplified EU Outline (Visual representation) -->
                        <path fill="rgba(255,255,255,0.1)" d="M250,150 L300,100 L400,120 L500,80 L600,150 L650,300 L550,500 L400,550 L200,450 L150,300 Z" />
                        <circle class="map-dot" cx="300" cy="200" r="8" /> <!-- Berlin -->
                        <circle class="map-dot" cx="220" cy="250" r="8" /> <!-- Paris -->
                        <circle class="map-dot" cx="450" cy="180" r="8" /> <!-- Warsaw -->
                        <circle class="map-dot" cx="350" cy="400" r="8" /> <!-- Rome -->
                        <circle class="map-dot" cx="180" cy="420" r="8" /> <!-- Lisbon -->
                    </svg>
                </div>
            </div>
        </div>
    </header>
    <!-- Stats Bar -->
    <section class="stats-bar">
        <div class="container stats-grid">
            <div class="stat-card">
                <h3 class="numbers counter" data-target="10">0</h3>
                <p>€M+ Funding Secured</p>
            </div>
            <div class="stat-card">
                <h3 class="numbers counter" data-target="30">0</h3>
                <p>Successful Applications</p>
            </div>
            <div class="stat-card">
                <h3 class="numbers counter" data-target="50">0</h3>
                <p>Consortium Partners</p>
            </div>
            <div class="stat-card">
                <h3 class="numbers counter" data-target="10">0</h3>
                <p>Years Experience</p>
            </div>
        </div>
    </section>
    <!-- About Section -->
    <section id="about" class="section-padding">
        <div class="container about-grid">
            <div class="reveal">
                <h2>Your Expert Bridge to EU Funding</h2>
                <p style="font-size: 1.1rem; margin: 20px 0;">DeepSync helps DeepTech startups secure equity-free EU funding. With over 10 years of experience, we specialize in navigating the complexity of Horizon Europe and EIC.</p>              
                <div style="margin-top: 30px;">
                    <div class="credential-badge">
                        <i class="fas fa-user-tie badge-icon"></i>
                        <div>
                            <strong>Certified EU Consultants</strong>
                            <p>Not generic advisors, but accredited fundraising experts.</p>
                        </div>
                    </div>
                    <div class="credential-badge">
                        <i class="fas fa-network-wired badge-icon"></i>
                        <div>
                            <strong>50+ Pre-vetted Partners</strong>
                            <p>Instant access to universities and R&D centers.</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="about-visual reveal">
                <div style="background: var(--white); padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                    <h4 style="margin-bottom: 20px; color: var(--primary-blue);">DeepSync Credentials</h4>
                    <ul style="list-style: none;">
                        <li style="padding: 10px 0; border-bottom: 1px solid #eee;"><i class="fas fa-check text-green"></i> Horizon Europe Certified</li>
                        <li style="padding: 10px 0; border-bottom: 1px solid #eee;"><i class="fas fa-check text-green"></i> Official EIC Partner Network</li>
                        <li style="padding: 10px 0; border-bottom: 1px solid #eee;"><i class="fas fa-check text-green"></i> 20+ Countries Served</li>
                        <li style="padding: 10px 0;"><i class="fas fa-check text-green"></i> 90% Eligibility Success Rate</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>
    <!-- Services Section -->
    <section id="services" class="section-padding services">
        <div class="container">
            <div class="section-header reveal">
                <h2>End-to-End EU Grant Support</h2>
                <p>We handle every stage so you can focus on building your product.</p>
            </div>
            <div class="services-grid">
                <div class="service-card reveal">
                    <div class="service-icon"><i class="fas fa-search"></i></div>
                    <h3>Grant Discovery</h3>
                    <p>We scan and identify the most relevant EU grant programs for your sector and development stage.</p>
                </div>
                <div class="service-card reveal">
                    <div class="service-icon"><i class="fas fa-bullseye"></i></div>
                    <h3>Strategy Session</h3>
                    <p>A dedicated 1:1 consultation to assess your eligibility and ideal timing for submission.</p>
                </div>
                <div class="service-card reveal">
                    <div class="service-icon"><i class="fas fa-users"></i></div>
                    <h3>Consortium Building</h3>
                    <p>Connect with 50+ top European universities and industry partners to form fundable consortia.</p>
                </div>
            </div>
            <div class="service-cta-banner reveal">
                <h3>Not sure which service you need?</h3>
                <a href="#contact" class="btn btn-gold">Book a Free 30-Min Consultation</a>
            </div>
        </div>
    </section>
    <!-- Programs Section -->
    <section id="programs" class="section-padding">
        <div class="container">
            <div class="section-header reveal">
                <h2>EU Programs We Navigate</h2>
                <p>From breakthrough research to market-ready scale-ups.</p>
            </div>
            <div class="programs-grid">
                <div class="program-card reveal">
                    <span class="funding-badge">Up to €4M + Equity</span>
                    <h3>EIC Accelerator</h3>
                    <p>For breakthrough innovators. Covers Pathfinder, Transition, and Accelerator scale-up stages.</p>
                </div>
                <div class="program-card reveal">
                    <span class="funding-badge">Up to €3M</span>
                    <h3>EIT Communities</h3>
                    <p>Sector-specific grants for Climate, Health, Digital, Manufacturing, and Urban Mobility.</p>
                </div>
                <div class="program-card reveal">
                    <span class="funding-badge">Avg. €2M</span>
                    <h3>Horizon Europe</h3>
                    <p>Flagship R&D program. Collaborative grants across clusters like Health, Digital, and Energy.</p>
                </div>
            </div>
        </div>
    </section>
    <!-- Partners Section -->
    <section class="marquee-container reveal">
        <div class="container">
            <h2 style="text-align: center; margin-bottom: 40px;">50+ Partners Across Europe & Beyond</h2>
        </div>
        <div class="marquee-row" id="marquee-1">
            <!-- JavaScript will populate or clone items for infinite loop -->
            <div class="partner-pill">🇩🇪 RWTH Aachen University</div>
            <div class="partner-pill">🇸🇪 Lund University</div>
            <div class="partner-pill">🇬🇷 University of Thessaly</div>
            <div class="partner-pill">🇵🇹 Coimbra University</div>
            <div class="partner-pill">🇮🇹 University of Bologna</div>
            <div class="partner-pill">🇫🇮 Oulu University</div>
            <div class="partner-pill">🇩🇪 MEET Battery Center</div>
            <div class="partner-pill">🇪🇪 Tartu University</div>
        </div>
        <div class="marquee-row reverse" id="marquee-2">
            <div class="partner-pill">🇧🇪 ICLEI</div>
            <div class="partner-pill">🇪🇺 EIT Association</div>
            <div class="partner-pill">🇵🇹 Impact Hub Lisbon</div>
            <div class="partner-pill">🇩🇰 Danish Heart Foundation</div>
            <div class="partner-pill">🇨🇭 NET-CARE.CH</div>
            <div class="partner-pill">🇱🇻 Riga Tech University</div>
        </div>
    </section>
    <!-- Testimonials Section -->
    <section id="testimonials" class="section-padding testimonials">
        <div class="container">
            <div class="section-header reveal">
                <h2>Trusted by Innovators</h2>
            </div>
            <div class="carousel reveal">
                <div class="testimonial-card active" data-index="0">
                    <i class="fas fa-quote-left quote-icon"></i>
                    <p class="testimonial-text">"We built a 7-partner consortium in just a few weeks. The project passed the eligibility stage and is now in final evaluation."</p>
                    <div class="testimonial-author">Heartery 🇩🇰</div>
                    <span class="outcome-badge">Final Evaluation Stage ✅</span>
                </div>
                <div class="testimonial-card" data-index="1">
                    <i class="fas fa-quote-left quote-icon"></i>
                    <p class="testimonial-text">"DeepSync connected us with our university partner for the EIT Digital program just days before the deadline."</p>
                    <div class="testimonial-author">Sirius Game 🇮🇹</div>
                    <span class="outcome-badge">Partner Secured ✅</span>
                </div>
                <div class="testimonial-card" data-index="2">
                    <i class="fas fa-quote-left quote-icon"></i>
                    <p class="testimonial-text">"Thanks to them, we secured €1.5M. They were literally the bridge between us and the grant."</p>
                    <div class="testimonial-author">Soula 🇨🇾</div>
                    <span class="outcome-badge">€1.5M Secured ✅</span>
                </div>        
                <div style="margin-top: 30px;">
                    <button class="btn btn-gold" onclick="prevTestimonial()" style="padding: 10px 15px;"><i class="fas fa-chevron-left"></i></button>
                    <button class="btn btn-gold" onclick="nextTestimonial()" style="padding: 10px 15px;"><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
        </div>
    </section>
    <!-- Eligibility Section -->
    <section class="section-padding">
        <div class="container">
            <div class="section-header reveal">
                <h2>Is DeepSync Right for You?</h2>
            </div>
            <div class="eligibility-grid reveal">
                <div class="elig-box perfect">
                    <h3>✅ Perfect Fit</h3>
                    <ul class="elig-list">
                        <li><i class="fas fa-check"></i> Founder in DeepTech, AgriTech, HealthTech</li>
                        <li><i class="fas fa-check"></i> Startup at TRL 4 or higher</li>
                        <li><i class="fas fa-check"></i> Want to raise funding without giving up equity</li>
                        <li><i class="fas fa-check"></i> European market ambitions</li>
                    </ul>
                </div>
                <div class="elig-box not-fit">
                    <h3>❌ Not the Right Fit</h3>
                    <ul class="elig-list">
                        <li><i class="fas fa-times"></i> No R&D or innovation component</li>
                        <li><i class="fas fa-times"></i> Pre-idea or TRL 1-3 stage</li>
                        <li><i class="fas fa-times"></i> Outside EU with no European operations</li>
                        <li><i class="fas fa-times"></i> Need pure commercial/revenue funding</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>
    <!-- Contact Section -->
    <section id="contact" class="section-padding">
        <div class="container">
            <div class="contact-grid">
                <div class="reveal">
                    <h2>Book Your Free Strategy Session</h2>
                    <p>30 minutes. No commitment. We'll assess your eligibility and outline a path to EU funding.</p>        
                    <form class="contact-form" id="grant-form" onsubmit="handleForm(event)">
                        <div class="form-group">
                            <input type="text" placeholder="Full Name" required>
                        </div>
                        <div class="form-group">
                            <input type="email" placeholder="Email Address" required>
                        </div>
                        <div class="form-group">
                            <select required>
                                <option value="">Select Domain</option>
                                <option>DeepTech</option>
                                <option>AgriTech</option>
                                <option>HealthTech</option>
                                <option>Climate</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <textarea placeholder="Tell us about your project" rows="4" required></textarea>
                        </div>
                        <button type="submit" class="btn btn-gold">Request Free Consultation</button>
                    </form>
                </div>
                <div class="expect-panel reveal">
                    <h3>What to expect:</h3>
                    <ul class="expect-list">
                        <li><i class="fas fa-check-circle"></i> Call with a certified consultant</li>
                        <li><i class="fas fa-check-circle"></i> Assessment of 3+ relevant programs</li>
                        <li><i class="fas fa-check-circle"></i> Consortium fit analysis</li>
                        <li><i class="fas fa-check-circle"></i> Recommended timeline</li>
                    </ul>
                    <hr style="opacity: 0.1; margin: 20px 0;">
                    <p><i class="fab fa-telegram"></i> Telegram: @sofia_fbs | @belpulp</p>
                </div>
            </div>
        </div>
    </section>
    <!-- Telegram CTA -->
    <section class="section-padding telegram-cta reveal">
        <div class="container">
            <h2>Stay Ahead of Every Grant Call</h2>
            <p style="margin: 20px 0;">Join 2,400+ members receiving real-time updates on open EU grant calls.</p>
            <a href="https://t.me/+i5CWWcCyqfA3MTAy" target="_blank" class="btn btn-gold" style="background: #0088cc; color: white;">
                <i class="fab fa-telegram-plane"></i> Join DeepSync Telegram Channel
            </a>
        </div>
    </section>
    <!-- Footer -->
    <footer>
        <div class="container">
            <div class="footer-grid">
                <div class="footer-col">
                    <div class="logo" style="color: white; margin-bottom: 20px;">DeepSync</div>
                    <p style="opacity: 0.7;">Supporting breakthrough innovation via Horizon Europe, EIC, and EIT.</p>
                </div>
                <div class="footer-col">
                    <h4>Services</h4>
                    <ul>
                        <li>Grant Discovery</li>
                        <li>Consortium Building</li>
                        <li>Proposal Support</li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Programs</h4>
                    <ul>
                        <li>EIC Accelerator</li>
                        <li>Horizon Europe</li>
                        <li>Cascade Funding</li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Connect</h4>
                    <ul>
                        <li>Telegram Channel</li>
                        <li>Book a Call</li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>© 2025 DeepSync — EU Grants & Innovation Strategy</p>
                <p>DeepSync is an independent firm and not an official EU institution.</p>
            </div>
        </div>
    </footer>
    <div id="success-msg">
        <i class="fas fa-check-circle" style="font-size: 4rem; color: var(--success-green); margin-bottom: 20px;"></i>
        <h2>Request Sent!</h2>
        <p>Our team will contact you within 24 hours.</p>
        <button class="btn btn-gold" onclick="closeSuccess()" style="margin-top: 20px;">Close</button>
    </div>
    <script>
        // Announcement dismissal
        function dismissAnn() {
            document.getElementById('announcement-bar').classList.add('hidden');
            localStorage.setItem('annDismissed', 'true');
        }
        if(localStorage.getItem('annDismissed')) {
            document.getElementById('announcement-bar').classList.add('hidden');
        }
        // Sticky Nav
        window.addEventListener('scroll', () => {
            const nav = document.getElementById('navbar');
            if (window.scrollY > 50) nav.classList.add('scrolled');
            else nav.classList.remove('scrolled');
        });
        // Mobile Menu
        function toggleMenu() {
            const links = document.querySelector('.nav-links');
            links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
            if(links.style.display === 'flex') {
                links.style.position = 'absolute';
                links.style.top = '100%';
                links.style.left = '0';
                links.style.width = '100%';
                links.style.flexDirection = 'column';
                links.style.background = 'white';
                links.style.padding = '20px';
            }
        }
        // Hero Canvas Particles
        const canvas = document.getElementById('hero-canvas');
        const ctx = canvas.getContext('2d');
        let particles = [];
        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 1;
                this.speedX = Math.random() * 0.5 - 0.25;
                this.speedY = Math.random() * 0.5 - 0.25;
                this.color = Math.random() > 0.5 ? '#FFCC00' : '#ffffff';
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x > canvas.width) this.x = 0;
                if (this.x < 0) this.x = canvas.width;
                if (this.y > canvas.height) this.y = 0;
                if (this.y < 0) this.y = canvas.height;
            }
            draw() {
                ctx.fillStyle = this.color;
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        function initParticles() {
            particles = [];
            for (let i = 0; i < 50; i++) particles.push(new Particle());
        }
        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            requestAnimationFrame(animateParticles);
        }
        window.addEventListener('resize', resize);
        resize();
        initParticles();
        animateParticles();
        // Reveal Animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
        // Stats Counter
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = +entry.target.getAttribute('data-target');
                    let count = 0;
                    const speed = target / 50;
                    const update = () => {
                        count += speed;
                        if (count < target) {
                            entry.target.innerText = Math.ceil(count);
                            setTimeout(update, 30);
                        } else {
                            entry.target.innerText = target;
                        }
                    };
                    update();
                    statsObserver.unobserve(entry.target);
                }
            });
        });
        document.querySelectorAll('.counter').forEach(stat => statsObserver.observe(stat));
        // Testimonial Carousel
        let currentTestimonial = 0;
        const testimonials = document.querySelectorAll('.testimonial-card');
        function showTestimonial(n) {
            testimonials.forEach(t => t.classList.remove('active'));
            currentTestimonial = (n + testimonials.length) % testimonials.length;
            testimonials[currentTestimonial].classList.add('active');
        }
        function nextTestimonial() { showTestimonial(currentTestimonial + 1); }
        function prevTestimonial() { showTestimonial(currentTestimonial - 1); }
        setInterval(nextTestimonial, 6000);
        // Form Handling
        function handleForm(e) {
            e.preventDefault();
            document.getElementById('success-msg').style.display = 'block';
            e.target.reset();
        }
        function closeSuccess() {
            document.getElementById('success-msg').style.display = 'none';
        }
        // Marquee Infinite Loop Clone
        document.querySelectorAll('.marquee-row').forEach(row => {
            const clone = row.innerHTML;
            row.innerHTML += clone; // Double for seamless loop
        });
    </script>
</body>
</html>
