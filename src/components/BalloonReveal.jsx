import { useState, useRef, useEffect } from 'react';
import './BalloonReveal.css';

const COLORS = [
  { body: '#ff2d2d', shine: '#ff8080', shadow: '#991a1a' },
  { body: '#ff8c00', shine: '#ffb84d', shadow: '#994f00' },
  { body: '#cc2fff', shine: '#e87fff', shadow: '#6e00cc' },
];

function BalloonSVG({ index }) {
  const c = COLORS[index % COLORS.length];
  const uid = `bg_${index}_${Math.random().toString(36).slice(2)}`;
  return (
    <svg viewBox="0 0 100 130" width="90" height="117" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <radialGradient id={uid} cx="35%" cy="30%" r="60%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor={c.shine}/>
          <stop offset="100%" stopColor={c.shadow}/>
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="58" rx="38" ry="45" fill={`url(#${uid})`}/>
      <ellipse cx="36" cy="38" rx="10" ry="14" fill="white" opacity="0.3"/>
      <polygon points="50,103 45,112 55,112" fill={c.shadow}/>
    </svg>
  );
}

function spawnBurst(containerRef, wrapEl, colorIdx) {
  if (!containerRef.current || !wrapEl) return;
  const overlayRect = containerRef.current.getBoundingClientRect();
  const rect = wrapEl.getBoundingClientRect();
  const cx = rect.left - overlayRect.left + rect.width / 2;
  const cy = rect.top - overlayRect.top + rect.height * 0.45;
  const c = COLORS[colorIdx % COLORS.length];
  const colors = [c.body, c.shine, '#ffffff', '#ffff00'];

  for (let p = 0; p < 18; p++) {
    const el = document.createElement('div');
    el.className = 'burst-particle';
    const angle = (p / 18) * 360;
    const dist = 60 + Math.random() * 80;
    const tx = Math.cos(angle * Math.PI / 180) * dist + 'px';
    const ty = Math.sin(angle * Math.PI / 180) * dist + 'px';
    const size = 6 + Math.random() * 8;
    el.style.cssText = `left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;background:${colors[p % colors.length]};--tx:${tx};--ty:${ty};animation-duration:${0.5 + Math.random() * 0.4}s;`;
    containerRef.current.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }
}

function spawnConfetti(containerRef, count) {
  if (!containerRef.current) return;
  const colors = ['#ff2d2d','#FFD700','#00cc66','#00b4ff','#ff8c00','#cc2fff','#ffffff'];
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      if (!containerRef.current) return;
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.cssText = `left:${Math.random() * 100}%;top:-10px;background:${colors[Math.floor(Math.random() * colors.length)]};width:${6 + Math.random() * 8}px;height:${6 + Math.random() * 8}px;border-radius:${Math.random() > 0.5 ? '50%' : '2px'};animation-duration:${1.8 + Math.random() * 2}s;`;
      containerRef.current.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    }, i * 40);
  }
}

export default function BalloonReveal({ winning, title, detail, winType, onClose }) {
  const [popped, setPopped] = useState([false, false, false]);
  const [showResult, setShowResult] = useState(false);
  const containerRef = useRef(null);
  const wrapRefs = useRef([null, null, null]);

  function pop(i) {
    if (popped[i]) return;
    const next = [...popped];
    next[i] = true;
    setPopped(next);
    spawnBurst(containerRef, wrapRefs.current[i], i);
    if (next.every(Boolean)) {
      setTimeout(() => {
        setShowResult(true);
        if (winType === 'jackpot') spawnConfetti(containerRef, 80);
        else if (winType === 'partial' || winType === 'token') spawnConfetti(containerRef, 35);
      }, 400);
    }
  }

  const remaining = popped.filter(Boolean).length;

  return (
    <div className="balloon-overlay">
      <div className="balloon-inner" ref={containerRef}>
        <div className="reveal-heading">Weekly Draw Result</div>

        <div className="balloons-row">
          {winning.split('').map((digit, i) => (
            <div
              key={i}
              ref={el => wrapRefs.current[i] = el}
              className={`balloon-wrap ${popped[i] ? 'popped' : ''}`}
              onClick={() => pop(i)}
            >
              <div className="balloon-svg-wrap"><BalloonSVG index={i}/></div>
              <div className="balloon-digit" style={{ color: COLORS[i % COLORS.length].body }}>{digit}</div>
              <div className="balloon-string"/>
            </div>
          ))}
        </div>

        {!showResult && (
          <div className="tap-hint">
            {remaining === 0 ? 'Tap the balloons!' : remaining === 2 ? 'One more...' : `${3 - remaining} left — keep going!`}
          </div>
        )}

        {showResult && (
          <div className={`result-card ${winType !== 'none' ? 'win' : ''} ${winType === 'jackpot' ? 'jackpot' : ''}`}>
            <div className="result-title">{title}</div>
            <div className="result-detail">{detail}</div>
            <button className="btn-close-reveal" onClick={onClose}>Continue</button>
          </div>
        )}
      </div>
    </div>
  );
}
