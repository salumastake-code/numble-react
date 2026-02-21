import { useState } from 'react';
import './BalloonReveal.css';

const COLORS = [
  { body: '#ff2d2d', shine: '#ff8080', shadow: '#991a1a' },
  { body: '#ff8c00', shine: '#ffb84d', shadow: '#994f00' },
  { body: '#cc2fff', shine: '#e87fff', shadow: '#6e00cc' },
];

function BalloonSVG({ index }) {
  const c = COLORS[index % COLORS.length];
  const uid = `bg_${index}_${Date.now()}`;
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

export default function BalloonReveal({ winning, title, detail, winType, onClose }) {
  const [popped, setPopped] = useState([false, false, false]);
  const [showResult, setShowResult] = useState(false);

  function pop(i) {
    if (popped[i]) return;
    const next = [...popped];
    next[i] = true;
    setPopped(next);
    if (next.every(Boolean)) setTimeout(() => setShowResult(true), 400);
  }

  const remaining = popped.filter(Boolean).length;

  return (
    <div className="balloon-overlay">
      <div className="balloon-inner">
        <div className="reveal-heading">Weekly Draw Result</div>

        <div className="balloons-row">
          {winning.split('').map((digit, i) => (
            <div key={i} className={`balloon-wrap ${popped[i] ? 'popped' : ''}`} onClick={() => pop(i)}>
              <div className="balloon-svg-wrap"><BalloonSVG index={i}/></div>
              <div className="balloon-digit" style={{ color: COLORS[i % COLORS.length].body }}>{digit}</div>
              <div className="balloon-string"/>
            </div>
          ))}
        </div>

        {!showResult && (
          <div className="tap-hint">
            {remaining === 0 ? 'Tap the balloons!' : remaining === 3 ? 'One more...' : `${3 - remaining} left — keep going!`}
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
