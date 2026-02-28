import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import useStore from '../store/useStore';
import TokenIcon from '../components/TokenIcon';
import './Spin.css';

// ORDER MUST match backend WHEEL_OUTCOMES exactly (index determines animation target)
// 13 segments, 27.6923° each — updated 2026-02-28
const OUTCOMES = [
  { label: 'RESPIN',  tokens: 0,    color: '#6366f1', textColor: '#fff', respin: true  },
  { label: '0',       tokens: 0,    color: '#1a1a1a', textColor: '#fff', respin: false },
  { label: '100',     tokens: 100,  color: '#ef4444', textColor: '#fff', respin: false },
  { label: '200',     tokens: 200,  color: '#f97316', textColor: '#fff', respin: false },
  { label: '300',     tokens: 300,  color: '#f59e0b', textColor: '#fff', respin: false },
  { label: '400',     tokens: 400,  color: '#eab308', textColor: '#fff', respin: false },
  { label: '500',     tokens: 500,  color: '#22c55e', textColor: '#fff', respin: false },
  { label: '600',     tokens: 600,  color: '#14b8a6', textColor: '#fff', respin: false },
  { label: '700',     tokens: 700,  color: '#3b82f6', textColor: '#fff', respin: false },
  { label: '800',     tokens: 800,  color: '#8b5cf6', textColor: '#fff', respin: false },
  { label: '900',     tokens: 900,  color: '#a855f7', textColor: '#fff', respin: false },
  { label: '1,000',   tokens: 1000, color: '#ec4899', textColor: '#fff', respin: false },
  { label: '2,500',   tokens: 2500, color: '#f59e0b', textColor: '#fff', respin: false },
];

const NUM_SEGMENTS = OUTCOMES.length; // 13
const SEGMENT_ANGLE = 360 / NUM_SEGMENTS; // 27.6923°

function WheelCanvas({ rotation }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const radius = cx - 8;

    ctx.clearRect(0, 0, size, size);

    // Draw segments
    OUTCOMES.forEach((outcome, i) => {
      const startAngle = ((i * SEGMENT_ANGLE - 90) * Math.PI) / 180;
      const endAngle = (((i + 1) * SEGMENT_ANGLE - 90) * Math.PI) / 180;

      // Segment fill
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = outcome.color;
      ctx.fill();

      // Segment border
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((startAngle + endAngle) / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';

      if (outcome.respin) {
        ctx.font = 'bold 11px Arial Black, Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText('↺ RESPIN', radius - 10, 5);
      } else if (outcome.tokens === 0) {
        ctx.font = 'bold 11px Arial Black, Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText('✕ 0', radius - 10, 5);
      } else {
        ctx.font = 'bold 11px Arial Black, Arial';
        ctx.fillText(`${outcome.label}`, radius - 10, 5);
      }

      ctx.restore();
    });

    // Center circle
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

  }, []);

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
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [history, setHistory] = useState([]);
  const animFrameRef = useRef(null);
  const rotationRef = useRef(0);

  useEffect(() => {
    loadHistory();
    loadBalance();
  }, []);

  async function loadBalance() {
    try {
      const data = await api.get('/profile');
      if (data.tokenBalance !== undefined) setTokenBalance(data.tokenBalance);
      if (data.ticketBalance !== undefined && setTicketBalance) setTicketBalance(data.ticketBalance);
    } catch (e) { /* non-fatal */ }
  }

  async function loadHistory() {
    try {
      const data = await api.get('/spin/history');
      setHistory(data.spins || []);
    } catch (e) {
      // non-fatal
    }
  }

  async function handleSpin() {
    if (spinning) return;
    if (tokenBalance < 1000) {
      showToast('You need 1,000 tokens to spin!', 'error');
      return;
    }

    setSpinning(true);
    setShowResult(false);
    setResult(null);

    // Immediately deduct the 1,000 token cost so the balance drops right away
    setTokenBalance((tokenBalance ?? 0) - 1000);

    try {
      const data = await api.post('/spin');
      const outcomeIndex = data.outcome.index;

      // Calculate target rotation so the pointer (fixed at top) lands on the
      // center of the winning segment.
      //
      // The canvas draws segment i with:
      //   leading edge at (i*45 - 90)°, midpoint at (i*45 - 67.5)°
      //
      // After CSS rotation R, the midpoint is at (i*45 - 67.5 + R)°.
      // For the pointer (top = 0°) to hit segment i:
      //   R ≡ 67.5 - i*45  (mod 360)
      //
      // rotationRef is always normalized to [0, 360) at end of each spin.
      // We spin forward: from current position, add enough full rotations
      // for drama, then land exactly on the target absolute angle.
      // Segment i midpoint is at (i*45 - 90 + 22.5)° = (i*45 - 67.5)° in canvas coords.
      // Pointer is at top (0°). To bring segment i's midpoint to top, we need
      // the CSS rotation R such that: (i*45 - 67.5 + R) ≡ 0 (mod 360)
      // => R = 67.5 - i*45
      // BUT: canvas arc startAngle = (i*45 - 90)° means segment 0 STARTS at top.
      // Segment 0 midpoint is 22.5° past top (clockwise). So with R=0, pointer is
      // at the START of segment 0, not its center.
      // Correct: R = -22.5 - i*45 = -(22.5 + i*45) => normalized: (337.5 - i*45)
      // Segment i midpoint in canvas coords: i*SEGMENT_ANGLE - 90 + SEGMENT_ANGLE/2
      // To bring midpoint to top (pointer), CSS rotation R = -(midpoint) mod 360
      // = (90 - i*SEGMENT_ANGLE - SEGMENT_ANGLE/2) mod 360
      // = (90 - SEGMENT_ANGLE/2 - i*SEGMENT_ANGLE) mod 360
      const halfSeg = SEGMENT_ANGLE / 2; // 13.8462°
      const targetAngle = (((90 - halfSeg) - outcomeIndex * SEGMENT_ANGLE) % 360 + 360) % 360;
      // Use raw cumulative rotation — never normalized — so forwardToTarget is always accurate
      const current = rotationRef.current;
      const currentMod = ((current % 360) + 360) % 360;
      // How many degrees forward from current mod position to reach targetAngle
      const forwardToTarget = (targetAngle - currentMod + 360) % 360 || 360;
      const fullSpins = (5 + Math.floor(Math.random() * 4)) * 360;
      const finalRotation = current + fullSpins + forwardToTarget;

      // Animate with easeOut
      const startRotation = rotationRef.current;
      const totalDelta = finalRotation - startRotation;
      const duration = 4000; // 4 seconds
      const startTime = performance.now();

      function easeOut(t) {
        return 1 - Math.pow(1 - t, 4);
      }

      function animate(now) {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const easedT = easeOut(t);
        const currentRotation = startRotation + totalDelta * easedT;
        rotationRef.current = currentRotation;
        // Do NOT mod during animation — modding causes a visual jump when
        // crossing 360° boundaries. Pass the raw cumulative rotation so
        // the CSS transform increases monotonically throughout the spin.
        setRotation(currentRotation);

        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Keep raw cumulative rotation — normalization caused drift on multi-spin sessions
          rotationRef.current = finalRotation;
          setRotation(finalRotation);
          setResult(data.outcome);
          setTokenBalance(data.token_balance ?? 0);
          if (setTicketBalance) setTicketBalance(data.ticket_balance ?? 0);
          setShowResult(true);
          setSpinning(false);
          loadHistory();
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);

    } catch (err) {
      setSpinning(false);
      const msg = err.message || 'Spin failed';
      showToast(msg, 'error');
    }
  }

  return (
    <div className="spin-page">
      <div className="spin-header">
        <h1 className="spin-title">Spin & Win</h1>
        <div className="spin-balance">
          <TokenIcon size={16} /> <span>{(tokenBalance || 0).toLocaleString()}</span> tokens
        </div>
      </div>

      <div className="wheel-container">
        {/* Pointer arrow */}
        <div className="wheel-pointer">▼</div>

        {/* Wheel */}
        <div className="wheel-wrapper">
          <WheelCanvas rotation={rotation} />
        </div>
      </div>

      {/* Spin button */}
      <button
        className={`spin-btn ${spinning ? 'spinning' : ''}`}
        onClick={handleSpin}
        disabled={spinning || tokenBalance < 1000}
      >
        {spinning ? 'Spinning...' : <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>SPIN — <TokenIcon size={14} /> 1,000</span>}
      </button>

      {tokenBalance < 1000 && (
        <p className="spin-no-tokens">
          You need 1,000 tokens to spin.{' '}
          <span className="spin-link" onClick={() => navigate('/profile')}>
            Get more →
          </span>
        </p>
      )}

      {/* Result modal */}
      {showResult && result && (
        <div className="spin-result-overlay" onClick={() => setShowResult(false)}>
          <div className="spin-result-card" onClick={e => e.stopPropagation()}>
            {result.respin ? (
              <>
                <div className="spin-result-icon">↺</div>
                <div className="spin-result-label" style={{color:'#6366f1'}}>FREE RESPIN!</div>
                <div className="spin-result-sub">No charge — spin again!</div>
              </>
            ) : result.bankrupt ? (
              <>
                <div className="spin-result-icon">💀</div>
                <div className="spin-result-label bankrupt">ZERO</div>
                <div className="spin-result-sub">Better luck next spin!</div>
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
              {result.respin ? 'Spin Again!' : 'Continue'}
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
                  {spin.tokens_won === 0 ? '💀 BANKRUPT' : <><TokenIcon size={14} /> {spin.tokens_won.toLocaleString()}</>}
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
