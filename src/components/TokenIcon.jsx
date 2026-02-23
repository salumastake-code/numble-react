/**
 * TokenIcon — a gold coin with a # symbol, on-brand for Numble.
 * Usage: <TokenIcon size={20} />
 */
export default function TokenIcon({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {/* Coin background */}
      <circle cx="12" cy="12" r="11" fill="url(#coinGrad)" />

      {/* Coin rim */}
      <circle cx="12" cy="12" r="11" fill="none" stroke="#b45309" strokeWidth="1" />

      {/* Inner circle detail */}
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="#fbbf24" strokeWidth="0.6" opacity="0.6" />

      {/* # symbol */}
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontSize="9.5"
        fontWeight="900"
        fontFamily="Arial Black, Arial, sans-serif"
        fill="#92400e"
        letterSpacing="-0.5"
      >
        #
      </text>

      {/* Gradient definition */}
      <defs>
        <radialGradient id="coinGrad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
      </defs>
    </svg>
  );
}
