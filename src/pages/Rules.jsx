import './Rules.css';

function Section({ title, children }) {
  return (
    <div className="rules-section">
      <h3 className="rules-h3">{title}</h3>
      {children}
    </div>
  );
}

export default function Rules() {
  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Rules & Legal</div>
        <div className="page-accent" />
      </div>

      <div className="rules-body">
        <Section title="No Purchase Necessary">
          <p>No purchase is necessary to enter or win. A purchase does not improve your chances of winning. Void where prohibited.</p>
          <ul>
            <li>Every registered user receives <strong>1 free entry token per month</strong> at no cost.</li>
            <li>Each token lets you enter one 3-digit number (000–999) per week.</li>
            <li>You may submit the same number more than once — each uses one token and counts as a separate entry.</li>
            <li>Each number has a limited number of slots per draw based on total entries. If your preferred number is full, try a less common pick — or try again soon.</li>
            <li>The weekly drawing occurs every Monday at 12:00 AM ET.</li>
            <li>Prize tier is determined by your subscription status at the time of entry.</li>
            <li>Referrers earn a 10% cash bonus when someone they referred wins a cash prize.</li>
          </ul>
        </Section>

        <Section title="Tokens Per Month">
          <table className="rules-table">
            <thead><tr><th>Plan</th><th>Tokens</th><th>Cost</th></tr></thead>
            <tbody>
              <tr><td>🆓 Free</td><td>1 free token</td><td>No cost</td></tr>
              <tr className="gold-row"><td>⭐ Subscriber</td><td>1 free + 3 bonus</td><td>$12.99/mo</td></tr>
            </tbody>
          </table>
        </Section>

        <Section title="Prize Tiers">
          <table className="rules-table">
            <thead><tr><th>Result</th><th>🆓 Free</th><th>⭐ Subscriber</th></tr></thead>
            <tbody>
              <tr><td>Exact match (all 3 in order)</td><td>$50</td><td className="gold-cell">$1,000</td></tr>
              <tr><td>All 3 correct, wrong order</td><td>$5</td><td className="gold-cell">$100</td></tr>
              <tr><td>Exactly 2 digits in position</td><td>+1 token</td><td className="gold-cell">+1 token</td></tr>
            </tbody>
          </table>
          <p className="rules-note">Subscription status at time of entry determines your prize tier.</p>
        </Section>

        <Section title="Referral Program">
          <ul>
            <li>Share your unique referral code with friends.</li>
            <li>When someone you referred wins a cash prize, you earn a 10% bonus.</li>
            <li>Example: your referral wins $1,000 — you earn $100.</li>
            <li>Referral bonuses are paid via the same methods as prizes.</li>
          </ul>
        </Section>

        <Section title="Privacy Policy">
          <p>We collect your email, username, and entry data solely to operate the sweepstakes, determine winners, and process payouts. We do not sell or share your personal data with third parties.</p>
        </Section>

        <Section title="Terms of Use">
          <p>By using Numble, you agree to play fairly, follow all sweepstakes rules, and confirm you are 18 years of age or older. Automated or unauthorized entry is prohibited.</p>
        </Section>
      </div>
    </div>
  );
}
