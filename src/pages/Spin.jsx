import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import useStore from '../store/useStore';
import TokenIcon from '../components/TokenIcon';
import './Spin.css';

const OUTCOMES = [
  { label: 'BANKRUPT',  tokens: 0,     color: '#1a1a1a', textColor: '#fff' },
  { label: '250',       tokens: 250,   color: '#ef4444', textColor: '#fff' },
  { label: '750',       tokens: 750,   color: '#eab308', textColor: '#fff' },
  { label: '1,000',     tokens: 1000,  color: '#f97316', textColor: '#fff' },
  { label: '1,500',     tokens: 1500,  color: '#a855f7', textColor: '#fff' },
  { label: '2,500',     tokens: 2500,  color: '#3b82f6', textColor: '#fff' },
  { label: '5,000',     tokens: 5000,  color: '#22c55e', textColor: '#fff' },
  { label: '10,000',    tokens: 10000, color: '#f59e0b', textColor: '#fff' },
];

const NUM_SEGMENTS = OUTCOMES.length;
const SEGMENT_ANGLE = 360 / NUM_SEGMENTS;

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

      if (outcome.tokens === 0) {
        // BANKRUPT
        ctx.font = 'bold 13px Arial Black, Arial';
        ctx.fillText('BANKRUPT', radius - 12, 5);
      } else {
        // Coin icon + amount
        ctx.font = 'bold 13px Arial Black, Arial';
        ctx.fillText(`🟡 ${outcome.label}`, radius - 12, 5);
      }

      // Lightning bolt for 10k
      if (outcome.tokens === 10000) {
        ctx.font = '14px Arial';
        ctx.fillText('⚡', radius - 100, 5);
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
      const data = await api('/profile');
      if (data.tokenBalance !== undefined) setTokenBalance(data.tokenBalance);
      if (data.ticketBalance !== undefined && setTicketBalance) setTicketBalance(data.ticketBalance);
    } catch (e) { /* non-fatal */ }
  }

  async function loadHistory() {
    try {
      const data = await api('/spin/history');
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

    try {
      const data = await api('/spin', { method: 'POST' });
      const outcomeIndex = data.outcome.index;

      // Calculate target rotation:
      // Land on the correct segment. Each segment = 45°
      // Segment 0 starts at top (-90° offset baked in canvas)
      // We want to land in the middle of outcomeIndex segment
      const targetSegmentAngle = outcomeIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
      // Add multiple full rotations for drama (5-8 full spins)
      const fullSpins = (5 + Math.floor(Math.random() * 3)) * 360;
      const finalRotation = rotationRef.current + fullSpins + (360 - targetSegmentAngle);

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
        setRotation(currentRotation % 360);

        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Animation complete
          rotationRef.current = finalRotation % 360;
          setRotation(finalRotation % 360);
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
            {result.bankrupt ? (
              <>
                <div className="spin-result-icon">💀</div>
                <div className="spin-result-label bankrupt">BANKRUPT</div>
                <div className="spin-result-sub">Better luck next spin!</div>
              </>
            ) : (
              <>
                <div className="spin-result-icon">🎉</div>
                <div className="spin-result-label win">+{result.tokens.toLocaleString()}</div>
                <div className="spin-result-tokens"><TokenIcon size={18} /> tokens won!</div>
                {result.tokens >= 5000 && (
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
