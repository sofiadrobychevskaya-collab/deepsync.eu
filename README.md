# Deep-Sync.eu
EU Grants &amp; Innovation Strategy
This is a complete, single-file index.html solution. It includes the full structure, CSS (with the requested color palette and fonts), and JavaScript for animations (star particles, counter numbers, and entrance effects).

code
Html

play_circle

download

content_copy

expand_less
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DeepSync | Certified EU Grants & Innovation Strategy</title>
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet">
    
    <!-- Icons -->
    <script src="https://kit.fontawesome.com/64d58efce2.js" crossorigin="anonymous"></script>

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
        }

        body {
            font-family: 'Inter', sans-serif;
            color: var(--text-dark);
            background-color: var(--white);
            line-height: 1.6;
            overflow-x: hidden;
        }

        h1, h2, h3, h4 {
            font-family: 'Syne', sans-serif;
            font-weight: 800;
        }

        .numbers {
            font-family: 'Space+Grotesk', sans-serif;
        }

        a {
            text-decoration: none;
            transition: var(--transition);
        }

        ul { list-style: none; }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }

        /* 1. ANNOUNCEMENT BAR & NAV */
        .announcement-bar {
            background-color: var(--accent-gold);
            color: var(--dark-navy);
            text-align: center;
            padding: 10px 40px;
            font-size: 14px;
            font-weight: 600;
            position: relative;
            z-index: 1001;
        }

        .announcement-bar a {
            color: var(--dark-navy);
            text-decoration: underline;
        }

        .announcement-bar .close-ann {
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            font-size: 18px;
        }

        nav {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            padding: 15px 0;
            position: sticky;
            top: 0;
            z-index: 1000;
            border-bottom: 1px solid rgba(0, 51, 153, 0.1);
        }

        .nav-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo-wrap {
            display: flex;
            flex-direction: column;
        }

        .logo {
            font-family: 'Syne', sans-serif;
            font-size: 24px;
            font-weight: 800;
            color: var(--primary-blue);
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .eu-stars-mini {
            display: flex;
            gap: 2px;
        }

        .eu-stars-mini span {
            color: var(--accent-gold);
            font-size: 10px;
        }

        .tagline {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-muted);
            margin-top: -4px;
        }

        .nav-links {
            display: flex;
            gap: 25px;
            align-items: center;
        }

        .nav-links a {
            color: var(--text-dark);
            font-weight: 500;
            font-size: 15px;
        }

        .nav-links a:hover { color: var(--primary-blue); }

        .btn {
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 700;
            cursor: pointer;
            display: inline-block;
            border: none;
            transition: var(--transition);
        }

        .btn-gold {
            background-color: var(--accent-gold);
            color: var(--dark-navy);
        }

        .btn-gold:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(255, 204, 0, 0.4);
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

        /* 2. HERO SECTION */
        .hero {
            position: relative;
            background: linear-gradient(135deg, var(--dark-navy) 0%, var(--primary-blue) 100%);
            min-height: 90vh;
            display: flex;
            align-items: center;
            color: var(--white);
            overflow: hidden;
            padding: 80px 0;
        }

        #hero-canvas {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }

        .hero-grid {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            align-items: center;
            gap: 40px;
            position: relative;
            z-index: 2;
        }

        .hero h1 {
            font-size: clamp(40px, 5vw, 64px);
            line-height: 1.1;
            margin-bottom: 25px;
        }

        .hero p {
            font-size: 18px;
            opacity: 0.9;
            margin-bottom: 35px;
            max-width: 600px;
        }

        .hero-btns {
            display: flex;
            gap: 20px;
            margin-bottom: 50px;
        }

        /* EU Map CSS Visual */
        .map-visual {
            position: relative;
            height: 400px;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .eu-map-svg {
            width: 100%;
            fill: rgba(255, 255, 255, 0.05);
            stroke: rgba(255, 255, 255, 0.2);
            stroke-width: 0.5;
        }

        .glow-dot {
            position: absolute;
            width: 8px;
            height: 8px;
            background: var(--accent-gold);
            border-radius: 50%;
            box-shadow: 0 0 15px var(--accent-gold);
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.5); opacity: 0.5; }
            100% { transform: scale(1); opacity: 1; }
        }

        .trust-strip {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            border-top: 1px solid rgba(255,255,255,0.1);
            padding-top: 30px;
        }

        .trust-item span {
            display: block;
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 700;
            font-size: 20px;
            color: var(--accent-gold);
        }

        .trust-item p {
            font-size: 13px;
            margin: 0;
            opacity: 0.7;
        }

        /* 3. ANIMATED STATS */
        .stats-bar {
            background-color: var(--dark-navy);
            padding: 60px 0;
            color: var(--white);
            text-align: center;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 30px;
        }

        .stat-card h2 {
            color: var(--accent-gold);
            font-size: 48px;
            margin-bottom: 5px;
            font-family: 'Space Grotesk', sans-serif;
        }

        .stat-card p {
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 14px;
            opacity: 0.8;
        }

        /* 4. WHO WE ARE */
        .about-section {
            padding: 100px 0;
            background-color: var(--white);
        }

        .about-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 80px;
            align-items: center;
        }

        .section-tag {
            color: var(--primary-blue);
            font-weight: 700;
            text-transform: uppercase;
            font-size: 14px;
            display: block;
            margin-bottom: 15px;
        }

        .about-text h2 {
            font-size: 40px;
            margin-bottom: 25px;
        }

        .about-text p {
            color: var(--text-muted);
            margin-bottom: 30px;
            font-size: 17px;
        }

        .diff-row {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
        }

        .diff-row i {
            color: var(--primary-blue);
            font-size: 24px;
            margin-top: 5px;
        }

        .diff-row h4 { margin-bottom: 5px; font-family: 'Inter', sans-serif; font-size: 18px;}

        .credential-card {
            background: var(--bg-light);
            padding: 40px;
            border-radius: 20px;
            border-left: 8px solid var(--primary-blue);
            box-shadow: 0 20px 40px rgba(0,0,0,0.05);
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        .badge {
            background: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.02);
        }

        .badge i { font-size: 30px; color: var(--accent-gold); margin-bottom: 10px; }
        .badge span { display: block; font-weight: 700; font-size: 14px; }

        /* 5. SERVICES */
        .services-section {
            padding: 100px 0;
            background-color: var(--bg-light);
            text-align: center;
        }

        .services-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
            margin-top: 50px;
        }

        .service-card {
            background: var(--white);
            padding: 40px;
            border-radius: 12px;
            text-align: left;
            border-left: 4px solid var(--primary-blue);
            transition: var(--transition);
            position: relative;
            overflow: hidden;
        }

        .service-card:hover {
            transform: translateY(-10px);
            background: var(--primary-blue);
            color: var(--white);
        }

        .service-card .icon-box {
            width: 60px;
            height: 60px;
            background: var(--accent-gold);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            margin-bottom: 25px;
            color: var(--dark-navy);
        }

        .service-card h3 { margin-bottom: 15px; }
        .service-card p { color: var(--text-muted); }
        .service-card:hover p { color: rgba(255,255,255,0.8); }

        .service-cta-banner {
            margin-top: 60px;
            background: var(--primary-blue);
            color: var(--white);
            padding: 40px;
            border-radius: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            text-align: left;
        }

        /* 6. PROGRAMS SECTION */
        .programs-section {
            padding: 100px 0;
        }

        .programs-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
            margin-top: 50px;
        }

        .program-card {
            border: 1px solid #E5E9F2;
            padding: 30px;
            border-radius: 12px;
            transition: var(--transition);
        }

        .program-card:hover {
            border-color: var(--primary-blue);
            box-shadow: 0 10px 30px rgba(0,51,153,0.05);
        }

        .p-badge {
            display: inline-block;
            background: #FFF9E5;
            color: #B28900;
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 12px;
            margin-bottom: 15px;
        }

        .program-card h3 { margin-bottom: 15px; }
        .program-card p { color: var(--text-muted); font-size: 15px; margin-bottom: 20px; }
        .learn-more { font-weight: 700; color: var(--primary-blue); display: flex; align-items: center; gap: 5px; }

        /* 7. MARQUEE */
        .marquee-section {
            padding: 80px 0;
            background: var(--dark-navy);
            color: var(--white);
            overflow: hidden;
        }

        .marquee-container {
            display: flex;
            gap: 50px;
            padding: 40px 0;
            animation: marquee 30s linear infinite;
            width: max-content;
        }

        .partner-logo {
            font-size: 24px;
            font-weight: 700;
            opacity: 0.5;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }

        /* ANIMATIONS */
        .fade-up {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.8s ease-out;
        }

        .fade-up.visible {
            opacity: 1;
            transform: translateY(0);
        }

        /* MOBILE RESPONSIVE */
        @media (max-width: 992px) {
            .hero-grid, .about-grid, .stats-grid, .services-grid, .programs-grid {
                grid-template-columns: 1fr;
            }
            .hero { text-align: center; }
            .hero-btns { justify-content: center; }
            .nav-links { display: none; }
            .trust-strip { grid-template-columns: 1fr 1fr; }
            .service-cta-banner { flex-direction: column; text-align: center; gap: 20px; }
            .credential-card { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>

    <!-- 1. ANNOUNCEMENT BAR -->
    <div class="announcement-bar" id="annBar">
        📢 New Grant Calls Open — EIC Accelerator 2025 | Horizon Europe Cluster 4 | Cascade Funding SMEs → 
        <a href="https://t.me/+i5CWWcCyqfA3MTAy" target="_blank">Join Our Free Telegram Channel</a>
        <span class="close-ann" onclick="document.getElementById('annBar').style.display='none'">&times;</span>
    </div>

    <!-- STICKY NAV -->
    <nav>
        <div class="container nav-container">
            <div class="logo-wrap">
                <div class="logo">
                    DEEPSYNC
                    <div class="eu-stars-mini">
                        <span>★</span><span>★</span><span>★</span>
                    </div>
                </div>
                <div class="tagline">EU Grants & Innovation Strategy</div>
            </div>
            
            <div class="nav-links">
                <a href="#about">Who We Are</a>
                <a href="#services">Services</a>
                <a href="#programs">Programs</a>
                <a href="#partners">Partners</a>
                <a href="#contact">Contact</a>
                <a href="#" class="btn btn-gold">Book Free Consultation</a>
            </div>

            <!-- Hamburger (Logic simplified for demo) -->
            <div class="mobile-toggle" style="display:none;"><i class="fas fa-bars"></i></div>
        </div>
    </nav>

    <!-- 2. HERO SECTION -->
    <section class="hero">
        <canvas id="hero-canvas"></canvas>
        <div class="container">
            <div class="hero-grid">
                <div class="hero-content">
                    <h1 class="fade-up">Secure Equity-Free EU Funding for Your DeepTech Startup</h1>
                    <p class="fade-up">We connect breakthrough innovators with Horizon Europe, EIC, EIT, and more — handling everything from discovery to submission.</p>
                    <div class="hero-btns fade-up">
                        <a href="#" class="btn btn-gold">Book Your Free Strategy Session</a>
                        <a href="#programs" class="btn btn-outline">See Grant Programs →</a>
                    </div>
                    
                    <div class="trust-strip fade-up">
                        <div class="trust-item">
                            <span class="numbers">30+</span>
                            <p>Successful Applications</p>
                        </div>
                        <div class="trust-item">
                            <span class="numbers">20+</span>
                            <p>Countries Covered</p>
                        </div>
                        <div class="trust-item">
                            <span class="numbers">50+</span>
                            <p>Consortium Partners</p>
                        </div>
                        <div class="trust-item">
                            <span class="numbers">90%</span>
                            <p>Eligibility Success</p>
                        </div>
                    </div>
                </div>

                <div class="map-visual fade-up">
                    <!-- Simplified EU Silhouette Concept -->
                    <svg class="eu-map-svg" viewBox="0 0 100 80">
                        <path d="M20,20 Q40,10 60,20 T90,30 L85,60 Q60,75 30,60 Z" />
                    </svg>
                    <!-- Animated Glowing Dots -->
                    <div class="glow-dot" style="top:30%; left:45%"></div>
                    <div class="glow-dot" style="top:50%; left:30%"></div>
                    <div class="glow-dot" style="top:40%; left:60%"></div>
                    <div class="glow-dot" style="top:60%; left:50%"></div>
                </div>
            </div>
        </div>
    </section>

    <!-- 3. ANIMATED STATS BAR -->
    <section class="stats-bar">
        <div class="container">
            <div class="stats-grid">
                <div class="stat-card">
                    <h2 class="counter" data-target="10">0</h2>
                    <p>€10M+ Funding Secured</p>
                </div>
                <div class="stat-card">
                    <h2 class="counter" data-target="30">0</h2>
                    <p>Successful Applications</p>
                </div>
                <div class="stat-card">
                    <h2 class="counter" data-target="50">0</h2>
                    <p>Consortium Partners</p>
                </div>
                <div class="stat-card">
                    <h2 class="counter" data-target="10">0</h2>
                    <p>Years of Experience</p>
                </div>
            </div>
        </div>
    </section>

    <!-- 4. WHO WE ARE -->
    <section class="about-section" id="about">
        <div class="container">
            <div class="about-grid">
                <div class="about-text fade-up">
                    <span class="section-tag">Your Expert Bridge</span>
                    <h2>The Most Trusted EU Grant Consultants for DeepTech</h2>
                    <p>DeepSync helps DeepTech startups and innovation-driven organizations secure equity-free EU funding. With over 10 years of experience and a team of certified EU fundraising consultants, we specialize in navigating the complexity of EU grant programs.</p>
                    
                    <div class="diff-row">
                        <i class="fas fa-certificate"></i>
                        <div>
                            <h4>Certified EU Fundraising Consultants</h4>
                            <p>We aren't just advisors; we are certified experts in European funding frameworks.</p>
                        </div>
                    </div>
                    <div class="diff-row">
                        <i class="fas fa-network-wired"></i>
                        <div>
                            <h4>50+ Pre-vetted Partners</h4>
                            <p>Access our network of universities and R&D centers across 20+ countries.</p>
                        </div>
                    </div>
                </div>

                <div class="about-visual fade-up">
                    <div class="credential-card">
                        <div class="badge">
                            <i class="fas fa-euro-sign"></i>
                            <span>Horizon Europe Certified</span>
                        </div>
                        <div class="badge">
                            <i class="fas fa-star"></i>
                            <span>EIC Partner Agency</span>
                        </div>
                        <div class="badge">
                            <i class="fas fa-calendar-alt"></i>
                            <span>10 Years Experience</span>
                        </div>
                        <div class="badge">
                            <i class="fas fa-check-double"></i>
                            <span>30+ Projects Won</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- 5. SERVICES -->
    <section class="services-section" id="services">
        <div class="container">
            <span class="section-tag">Our Capabilities</span>
            <h2>End-to-End EU Grant Support</h2>
            <p>We handle every stage so you can focus on building your product.</p>

            <div class="services-grid">
                <div class="service-card fade-up">
                    <div class="icon-box">🔍</div>
                    <h3>EU Grant Discovery</h3>
                    <p>We scan and identify the most relevant EU grant programs for your specific sector and development stage.</p>
                </div>
                <div class="service-card fade-up">
                    <div class="icon-box">🎯</div>
                    <h3>1:1 Strategy Session</h3>
                    <p>A dedicated consultation to assess your eligibility and ideal timing for submission across EIC and Horizon.</p>
                </div>
                <div class="service-card fade-up">
                    <div class="icon-box">🤝</div>
                    <h3>Consortium Building</h3>
                    <p>We connect you with our network of top European universities and R&D centers to form strong consortia.</p>
                </div>
                <div class="service-card fade-up">
                    <div class="icon-box">✍️</div>
                    <h3>Proposal Support</h3>
                    <p>From writing and structuring to compliance checks—our team ensures your proposal is compelling and complete.</p>
                </div>
                <div class="service-card fade-up">
                    <div class="icon-box">📊</div>
                    <h3>Post-Funding Support</h3>
                    <p>We stay with you after the win supporting project execution, milestone reporting, and grant audits.</p>
                </div>
            </div>

            <div class="service-cta-banner fade-up">
                <h3>Not sure which service you need?</h3>
                <a href="#" class="btn btn-gold">Book a Free 30-Min Consultation</a>
            </div>
        </div>
    </section>

    <!-- 6. GRANT PROGRAMS -->
    <section class="programs-section" id="programs">
        <div class="container">
            <div style="text-align: center; max-width: 700px; margin: 0 auto 50px;">
                <span class="section-tag">Funding Opportunities</span>
                <h2>EU Programs We Navigate</h2>
                <p>From breakthrough research to market-ready scale-ups — we know every path to EU funding.</p>
            </div>

            <div class="programs-grid">
                <!-- Program 1 -->
                <div class="program-card fade-up">
                    <div class="p-badge">Up to €4M + Equity</div>
                    <h3>EIC (European Innovation Council)</h3>
                    <p>For breakthrough innovators. Covers Pathfinder (early research) and Accelerator (scale-up).</p>
                    <a href="#" class="learn-more">Learn More <i class="fas fa-arrow-right"></i></a>
                </div>
                <!-- Program 2 -->
                <div class="program-card fade-up">
                    <div class="p-badge">Up to €3M</div>
                    <h3>EIT (Innovation & Technology)</h3>
                    <p>Sector-specific communities covering Climate, Health, Digital, and Urban Mobility.</p>
                    <a href="#" class="learn-more">Learn More <i class="fas fa-arrow-right"></i></a>
                </div>
                <!-- Program 3 -->
                <div class="program-card fade-up">
                    <div class="p-badge">Avg. €2M / Project</div>
                    <h3>Horizon Europe</h3>
                    <p>The EU's flagship R&D program for collaborative grants across various industry clusters.</p>
                    <a href="#" class="learn-more">Learn More <i class="fas fa-arrow-right"></i></a>
                </div>
                <!-- Program 4 -->
                <div class="program-card fade-up">
                    <div class="p-badge">€50K – €500K</div>
                    <h3>Cascade Funding</h3>
                    <p>Fast-track grants for SMEs delivered through open calls under larger projects. Ideal for early-stage.</p>
                    <a href="#" class="learn-more">Learn More <i class="fas fa-arrow-right"></i></a>
                </div>
                <!-- Program 5 -->
                <div class="program-card fade-up">
                    <div class="p-badge">Cross-Border</div>
                    <h3>Eureka Network</h3>
                    <p>International collaborative funding for applied technology development—less bureaucracy.</p>
                    <a href="#" class="learn-more">Learn More <i class="fas fa-arrow-right"></i></a>
                </div>
                <!-- Program 6 -->
                <div class="program-card fade-up">
                    <div class="p-badge">Research & Early Stage</div>
                    <h3>ERC & National</h3>
                    <p>European Research Council grants and national co-funding for deep science ventures.</p>
                    <a href="#" class="learn-more">Learn More <i class="fas fa-arrow-right"></i></a>
                </div>
            </div>
        </div>
    </section>

    <!-- 7. PARTNERS MARQUEE -->
    <section class="marquee-section" id="partners">
        <div class="container" style="text-align: center; margin-bottom: 30px;">
            <h2>50+ Partners Across Europe</h2>
        </div>
        <div class="marquee-container">
            <div class="partner-logo">🇩🇪 Technical University of Munich</div>
            <div class="partner-logo">🇫🇷 CNRS Research</div>
            <div class="partner-logo">🇪🇸 Fraunhofer Institute</div>
            <div class="partner-logo">🇮🇹 Politecnico di Milano</div>
            <div class="partner-logo">🇳🇱 TU Delft</div>
            <div class="partner-logo">🇸🇪 KTH Royal Institute</div>
            <div class="partner-logo">🇪🇺 European Startup Network</div>
            <!-- Duplicate for infinite effect -->
            <div class="partner-logo">🇩🇪 Technical University of Munich</div>
            <div class="partner-logo">🇫🇷 CNRS Research</div>
            <div class="partner-logo">🇪🇸 Fraunhofer Institute</div>
            <div class="partner-logo">🇮🇹 Politecnico di Milano</div>
        </div>
    </section>

    <script>
        // Hero Star Particles
        const canvas = document.getElementById('hero-canvas');
        const ctx = canvas.getContext('2d');
        let particles = [];

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2;
                this.speedX = Math.random() * 0.5 - 0.25;
                this.speedY = Math.random() * 0.5 - 0.25;
                this.opacity = Math.random();
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
                ctx.fillStyle = `rgba(255, 204, 0, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function init() {
            for (let i = 0; i < 100; i++) particles.push(new Particle());
        }

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            requestAnimationFrame(animateParticles);
        }
        init();
        animateParticles();

        // Scroll Entrance Observer
        const observerOptions = { threshold: 0.1 };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // If it's a counter, trigger it
                    if (entry.target.classList.contains('counter')) {
                        startCounter(entry.target);
                    }
                }
            });
        }, observerOptions);

        document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
        document.querySelectorAll('.counter').forEach(el => observer.observe(el));

        // Stats Counter Logic
        function startCounter(el) {
            const target = parseInt(el.getAttribute('data-target'));
            let count = 0;
            const speed = target / 50;
            const updateCount = () => {
                if (count < target) {
                    count += speed;
                    el.innerText = Math.ceil(count) + (target === 10 && el.innerText.includes('M') ? 'M+' : '');
                    setTimeout(updateCount, 30);
                } else {
                    el.innerText = target + (target === 10 ? 'M+' : '+');
                }
            };
            updateCount();
        }
    </script>
</body>
</html>
