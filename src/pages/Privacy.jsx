export default function Privacy() {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1.5rem 4rem', fontFamily: 'system-ui, sans-serif', color: '#222', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Privacy Policy</h1>
      <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '2rem' }}>Last updated: February 2026</p>

      <p>Numble ("we", "us", "our") operates the Numble sweepstakes app at <strong>numble.io</strong>. This policy explains what information we collect, how we use it, and your rights.</p>

      <h2 style={{ fontSize: '1.2rem', marginTop: '2rem' }}>Information We Collect</h2>
      <ul>
        <li><strong>Account info:</strong> Email address, username, and password (hashed) when you register.</li>
        <li><strong>Google sign-in:</strong> If you sign in with Google, we receive your email and name from Google.</li>
        <li><strong>Usage data:</strong> Draw entries, token transactions, and payout requests.</li>
        <li><strong>Device data:</strong> IP address and device fingerprint for fraud prevention.</li>
        <li><strong>Payment data:</strong> Stripe handles all payment processing. We do not store full card numbers.</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', marginTop: '2rem' }}>How We Use Your Information</h2>
      <ul>
        <li>To operate the sweepstakes and process entries</li>
        <li>To process payments and issue winnings</li>
        <li>To send transactional emails (draw results, welcome messages)</li>
        <li>To detect and prevent fraud</li>
        <li>To comply with legal obligations</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', marginTop: '2rem' }}>Data Sharing</h2>
      <p>We do not sell your personal data. We share data only with service providers necessary to operate Numble (Supabase for database hosting, Stripe for payments, Resend for email). All providers are bound by data processing agreements.</p>

      <h2 style={{ fontSize: '1.2rem', marginTop: '2rem' }}>Data Retention</h2>
      <p>We retain account data while your account is active. You may request deletion by emailing <a href="mailto:support@numble.io">support@numble.io</a>.</p>

      <h2 style={{ fontSize: '1.2rem', marginTop: '2rem' }}>Your Rights</h2>
      <p>You have the right to access, correct, or delete your personal data. Contact us at <a href="mailto:support@numble.io">support@numble.io</a>.</p>

      <h2 style={{ fontSize: '1.2rem', marginTop: '2rem' }}>Cookies</h2>
      <p>We use localStorage for authentication tokens. We do not use third-party tracking cookies.</p>

      <h2 style={{ fontSize: '1.2rem', marginTop: '2rem' }}>Contact</h2>
      <p>Questions? Email <a href="mailto:support@numble.io">support@numble.io</a></p>

      <p style={{ marginTop: '3rem' }}><a href="/" style={{ color: '#f97316' }}>← Back to Numble</a></p>
    </div>
  );
}
