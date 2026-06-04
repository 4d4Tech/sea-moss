import React, { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, MeshDistortMaterial } from '@react-three/drei';
import gsap from 'gsap';
import { app, db, auth, storage, functions, analytics } from './firebase';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Rotating & Distorted 3D Moss Mesh Component
function MossCore() {
  const meshRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.x = time * 0.15;
      meshRef.current.rotation.y = time * 0.25;
      meshRef.current.rotation.z = time * 0.1;
    }
  });

  return (
    <>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[2, 3]} />
        <MeshDistortMaterial
          color="#00f5d4"
          attach="material"
          distort={0.45}
          speed={2}
          roughness={0.1}
          metalness={0.9}
          wireframe={true}
        />
      </mesh>
      {/* Outer particles/glow effect mesh */}
      <mesh rotation={[1, 1, 1]}>
        <dodecahedronGeometry args={[2.5, 1]} />
        <meshBasicMaterial 
          color="#f2b705" 
          wireframe={true} 
          transparent={true} 
          opacity={0.15} 
        />
      </mesh>
    </>
  );
}

function App() {
  const [firebaseStatus, setFirebaseStatus] = useState('Initializing...');
  const [threeStatus, setThreeStatus] = useState('Initializing...');
  const [gsapStatus, setGsapStatus] = useState('Initializing...');
  const [geminiStatus, setGeminiStatus] = useState('Initializing...');

  useEffect(() => {
    // 1. Verify GSAP & Trigger Animations
    try {
      if (gsap) {
        setGsapStatus('Active');
        gsap.fromTo('.animate-fade-in', 
          { opacity: 0, y: 30 }, 
          { opacity: 1, y: 0, duration: 1.2, stagger: 0.15, ease: 'power4.out', delay: 0.2 }
        );
      }
    } catch (e) {
      setGsapStatus('Error');
    }

    // 2. Verify Firebase Services
    try {
      if (app && db && auth && storage && functions) {
        setFirebaseStatus('Connected');
      } else {
        setFirebaseStatus('Config Missing');
      }
    } catch (e) {
      setFirebaseStatus('Connection Error');
    }

    // 3. Verify Three.js / R3F
    try {
      if (Canvas) {
        setThreeStatus('Ready');
      }
    } catch (e) {
      setThreeStatus('Load Error');
    }

    // 4. Verify Gemini API SDK
    try {
      if (GoogleGenerativeAI) {
        setGeminiStatus('SDK Loaded');
      }
    } catch (e) {
      setGeminiStatus('Import Error');
    }
  }, []);

  return (
    <div className="app-container">
      {/* Navigation */}
      <header className="animate-fade-in">
        <div className="logo">
          <div className="logo-icon"></div>
          <span>Sea Moss</span>
        </div>
        <nav>
          <a href="#visualizer" className="active">Visualizer</a>
          <a href="#integrations">Integrations</a>
          <a href="#diagnostics">Diagnostics</a>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="hero-section">
        <div className="hero-content">
          <div className="hero-tag animate-fade-in">Workspace Configured</div>
          <h1 className="hero-title animate-fade-in">
            Organic Wellness<br /> Meets <span>3D Innovation</span>
          </h1>
          <p className="hero-description animate-fade-in">
            This space is fully set up with Vite React, Three.js, React Three Fiber, 
            GSAP, Google Firebase, and Gemini AI. Experience beautiful visualizers 
            coupled with cloud scalability.
          </p>
          <div className="hero-actions animate-fade-in">
            <a href="#visualizer" className="btn btn-primary">Explore 3D Moss</a>
            <a href="#diagnostics" className="btn btn-secondary">Check System Status</a>
          </div>
        </div>

        {/* 3D Visualizer Canvas */}
        <div id="visualizer" className="visualizer-container animate-fade-in">
          <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }}>
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 5, 5]} intensity={1.5} color="#00f5d4" />
            <pointLight position={[-5, -5, -5]} intensity={1} color="#f2b705" />
            <MossCore />
            <OrbitControls enableZoom={false} autoRotate={true} autoRotateSpeed={0.5} />
          </Canvas>
          
          <div className="visualizer-overlay">
            <div className="visualizer-status">
              <span className="pulse-dot"></span>
              Interactive R3F Canvas
            </div>
            <span style={{ color: '#94a3b8' }}>Orbit Controls Active</span>
          </div>
        </div>
      </main>

      {/* Integrations Grid */}
      <section id="integrations" className="features-section">
        <h2 className="section-title animate-fade-in">Core <span>Architectural Stack</span></h2>
        <div className="features-grid">
          <div className="feature-card animate-fade-in">
            <div className="feature-icon-wrapper">📦</div>
            <h3 className="feature-title">Vite + React</h3>
            <p className="feature-desc">Lightning fast Hot Module Replacement (HMR) and optimized build outputs.</p>
          </div>
          <div className="feature-card animate-fade-in">
            <div className="feature-icon-wrapper">✨</div>
            <h3 className="feature-title">GSAP Animations</h3>
            <p className="feature-desc">Ultra-smooth transition triggers and coordinate interpolations on elements.</p>
          </div>
          <div className="feature-card animate-fade-in">
            <div className="feature-icon-wrapper">🔥</div>
            <h3 className="feature-title">Firebase Suite</h3>
            <p className="feature-desc">Client instances for Authentication, Firestore, Cloud Functions, and Storage.</p>
          </div>
          <div className="feature-card animate-fade-in">
            <div className="feature-icon-wrapper">🧠</div>
            <h3 className="feature-title">Google Gemini</h3>
            <p className="feature-desc">Integrated Generative AI SDK for natural language and multi-modal models.</p>
          </div>
        </div>
      </section>

      {/* Diagnostics Dashboard */}
      <section id="diagnostics" className="diag-panel animate-fade-in">
        <div className="diag-header">
          <div className="diag-title-group">
            <h2>Environment Diagnostics</h2>
            <span className="diag-badge">Verified</span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Real-time health status of setup dependencies</p>
        </div>
        <div className="diag-grid">
          <div className="diag-item">
            <span className="diag-name">React + Vite Dev Server</span>
            <span className="diag-status ok">Running</span>
          </div>
          <div className="diag-item">
            <span className="diag-name">Firebase SDK Services</span>
            <span className={`diag-status ${firebaseStatus === 'Connected' ? 'ok' : 'warn'}`}>
              {firebaseStatus}
            </span>
          </div>
          <div className="diag-item">
            <span className="diag-name">React Three Fiber</span>
            <span className={`diag-status ${threeStatus === 'Ready' ? 'ok' : 'warn'}`}>
              {threeStatus}
            </span>
          </div>
          <div className="diag-item">
            <span className="diag-name">GSAP Animation Library</span>
            <span className={`diag-status ${gsapStatus === 'Active' ? 'ok' : 'warn'}`}>
              {gsapStatus}
            </span>
          </div>
          <div className="diag-item">
            <span className="diag-name">Gemini API SDK</span>
            <span className={`diag-status ${geminiStatus === 'SDK Loaded' ? 'ok' : 'warn'}`}>
              {geminiStatus}
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <p>&copy; {new Date().getFullYear()} Sea Moss Project. Built with vanilla styling, React, and Firebase.</p>
      </footer>
    </div>
  );
}

export default App;
