import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import useStore from '../store/useStore';
import TokenIcon from '../components/TokenIcon';
import './Spin.css';

// ── 12 segments, 30° each ────────────────────────────────────────────────────
// Order here is the VISUAL clockwise order starting from the top-most segment.
// Index 0 = the segment that sits at the top when rotation = 0.
// This list MUST match WHEEL_OUTCOMES in routes/spin.js (same index mapping).
const OUTCOMES = [
  { label: '900',   tokens: 900,  color: '#a855f7', respin: false }, // idx 0
  { label: '400',   tokens: 400,  color: '#eab308', respin: false }, // idx 1
  { label: '↺',     tokens: 0,    color: '#6366f1', respin: true  }, // idx 2  RESPIN
  { label: '600',   tokens: 600,  color: '#14b8a6', respin: false }, // idx 3
  { label: '700',   tokens: 700,  color: '#3b82f6', respin: false }, // idx 4
  { label: '300',   tokens: 300,  color: '#f59e0b', respin: false }, // idx 5
  { label: '800',   tokens: 800,  color: '#8b5cf6', respin: false }, // idx 6
  { label: '200',   tokens: 200,  color: '#f97316', respin: false }, // idx 7
  { label: '1,000', tokens: 1000, color: '#ec4899', respin: false }, // idx 8
  { label: '0',     tokens: 0,    color: '#1a1a1a', respin: false }, // idx 9  ZERO
  { label: '2,500', tokens: 2500, color: '#d97706', respin: false }, // idx 10
  { label: '100',   tokens: 100,  color: '#ef4444', respin: false }, // idx 11
];

const NUM_SEGMENTS = 12;
const SEGMENT_ANGLE = 30; // 360 / 12 = exactly 30°

// ── Pointer-to-segment angle formula ────────────────────────────────────────
// Canvas draws segment i starting at angle: (i * 30 - 90)° from standard canvas 0°.
// Segment i CENTER sits at canvas angle: (i * 30 - 90 + 15)° = (i * 30 - 75)°.
// Pointer is at the top of the wheel = canvas angle 270° (= -90°).
// We need: segCenter + cssRotation ≡ 270° (mod 360)
//   cssRotation = 270 - (i * 30 - 75) = 345 - i * 30
function targetAngleForIndex(i) {
  return ((345 - i * SEGMENT_ANGLE) % 360 + 360) % 360;
}

function WheelCanvas({ rotation }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width; // 320
    const cx = size / 2;
    const cy = size / 2;
    const radius = cx - 8;

    ctx.clearRect(0, 0, size, size);

    OUTCOMES.forEach((outcome, i) => {
      // Each segment spans 30°; segment 0 starts at -90° so it straddles the top
      const startAngle = ((i * SEGMENT_ANGLE - 90) * Math.PI) / 180;
      const endAngle   = (((i + 1) * SEGMENT_ANGLE - 90) * Math.PI) / 180;

      // Fill
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = outcome.color;
      ctx.fill();

      // Border
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      const midAngle = (startAngle + endAngle) / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(midAngle);
      ctx.textAlign = 'right';

      if (outcome.tokens === 0 && !outcome.respin) {
        // Zero — bold red ✕
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 14px Arial Black, Arial';
        ctx.fillText('✕', radius - 10, 6);
      } else if (outcome.respin) {
        // RESPIN
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial Black, Arial';
        ctx.fillText('↺ RESPIN', radius - 10, 5);
      } else {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Arial Black, Arial';
        ctx.fillText(outcome.label, radius - 10, 5);
      }

      ctx.restore();
    });

    // Center hub
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 8;
    ctx.stroke();

  }, []); // drawn once; rotation applied via CSS transform

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={320}
      style={{ transform: `rotate(${rotation}deg)`, transition: 'none' }}
      className="wheel-canvas"
    />
  );
}

export default function Spin() {
  const navigate = useNavigate();
  const { tokenBalance, ticketBalance, setTokenBalance, setTicketBalance, showToast } = useStore();
  const [spinning, setSpinning]     = useState(false);
  const [rotation, setRotation]     = useState(0);
  const [result, setResult]         = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [history, setHistory]       = useState([]);
  const animFrameRef                = useRef(null);
  const rotationRef                 = useRef(0);

  useEffect(() => {
    loadHistory();
    loadBalance();
  }, []);

  async function loadBalance() {
    try {
      const data = await api.get('/profile');
      if (data.tokenBalance  !== undefined) setTokenBalance(data.tokenBalance);
      if (data.ticketBalance !== undefined && setTicketBalance) setTicketBalance(data.ticketBalance);
    } catch (e) { /* non-fatal */ }
  }

  async function loadHistory() {
    try {
      const data = await api.get('/spin/history');
      setHistory(data.spins || []);
    } catch (e) { /* non-fatal */ }
  }

  async function handleSpin() {
    if (spinning) return;
    if ((tokenBalance ?? 0) < 300) {
      showToast('You need 300 tokens to spin!', 'error');
      return;
    }

    setSpinning(true);
    setShowResult(false);
    setResult(null);

    // Optimistic balance deduct
    setTokenBalance((tokenBalance ?? 0) - 300);

    try {
      const data = await api.post('/spin');
      const outcomeIndex = data.outcome.index;

      // ── Spin animation math ──────────────────────────────────────────────
      // targetAngle: the CSS rotation at which segment outcomeIndex is under the pointer.
      const targetAngle  = targetAngleForIndex(outcomeIndex);

      // Current wheel position modulo 360
      const currentMod   = ((rotationRef.current % 360) + 360) % 360;

      // Forward (clockwise) delta to reach targetAngle from currentMod
      let fwdDelta = (targetAngle - currentMod + 360) % 360;
      // Ensure at least 2 full segments of visible travel (avoid tiny nudge)
      if (fwdDelta < SEGMENT_ANGLE * 2) fwdDelta += 360;

      // Add 5–8 full extra rotations for drama
      const fullSpins    = (5 + Math.floor(Math.random() * 4)) * 360;
      const finalRotation = rotationRef.current + fullSpins + fwdDelta;

      // Ease-out quartic
      const startRotation = rotationRef.current;
      const totalDelta    = finalRotation - startRotation;
      const duration      = 4000;
      const startTime     = performance.now();

      function easeOut(t) { return 1 - Math.pow(1 - t, 4); }

      function animate(now) {
        const elapsed = now - startTime;
        const t       = Math.min(elapsed / duration, 1);
        const cur     = startRotation + totalDelta * easeOut(t);
        rotationRef.current = cur;
        setRotation(cur); // raw cumulative — no modding, no drift

        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          rotationRef.current = finalRotation;
          setRotation(finalRotation);

          // Sync server-authoritative balances
          setTokenBalance(data.token_balance ?? 0);
          if (setTicketBalance) setTicketBalance(data.ticket_balance ?? 0);

          if (data.outcome.respin) {
            setSpinning(false);
            showToast('↺ Free Respin!', 'success');
            setTimeout(() => handleSpin(), 1200);
          } else {
            setResult(data.outcome);
            setShowResult(true);
            setSpinning(false);
            loadHistory();
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);

    } catch (err) {
      setSpinning(false);
      // Restore optimistic deduct on error
      setTokenBalance((tokenBalance ?? 0));
      showToast(err.message || 'Spin failed', 'error');
    }
  }

  return (
    <div className="spin-page">
      <div className="spin-header">
        <h1 className="spin-title">Spin &amp; Win</h1>
        <div className="spin-balance">
          <TokenIcon size={16} /> <span>{(tokenBalance || 0).toLocaleString()}</span> tokens
        </div>
      </div>

      <div className="wheel-container">
        <div className="wheel-wrapper">
          <WheelCanvas rotation={rotation} />
        </div>
        {/* Fixed pointer — CSS triangle at exact top-center */}
        <div className="wheel-pointer" />
      </div>

      <button
        className={`spin-btn ${spinning ? 'spinning' : ''}`}
        onClick={handleSpin}
        disabled={spinning || (tokenBalance ?? 0) < 300}
      >
        {spinning
          ? 'Spinning...'
          : <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
              SPIN — <TokenIcon size={14} /> 300
            </span>
        }
      </button>

      {(tokenBalance ?? 0) < 300 && (
        <p className="spin-no-tokens">
          You need 300 tokens to spin.{' '}
          <span className="spin-link" onClick={() => navigate('/profile')}>
            Get more →
          </span>
        </p>
      )}

      {/* Result modal */}
      {showResult && result && (
        <div className="spin-result-overlay" onClick={() => setShowResult(false)}>
          <div className="spin-result-card" onClick={e => e.stopPropagation()}>
            {result.bankrupt ? (
              <>
                <div className="spin-result-icon">😬</div>
                <div className="spin-result-label bankrupt">ZERO</div>
                <div className="spin-result-sub">So close — spin again!</div>
              </>
            ) : (
              <>
                <div className="spin-result-icon">🎉</div>
                <div className="spin-result-label win">+{result.tokens.toLocaleString()}</div>
                <div className="spin-result-tokens"><TokenIcon size={18} /> tokens won!</div>
                {result.tokens >= 1000 && (
                  <div className="spin-result-confetti">⚡🎊⚡🎊⚡</div>
                )}
              </>
            )}
            <button className="spin-result-close" onClick={() => setShowResult(false)}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Spin history */}
      {history.length > 0 && (
        <div className="spin-history">
          <h3 className="spin-history-title">Recent Spins</h3>
          <div className="spin-history-list">
            {history.slice(0, 10).map(spin => (
              <div key={spin.spin_id} className="spin-history-item">
                <span className="spin-history-label">
                  {spin.tokens_won === 0
                    ? '💀 BANKRUPT'
                    : <><TokenIcon size={14} /> {spin.tokens_won.toLocaleString()}</>
                  }
                </span>
                <span className="spin-history-time">
                  {new Date(spin.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
