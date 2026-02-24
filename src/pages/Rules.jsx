import TokenIcon from '../components/TokenIcon';
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
            <li>Every registered user receives <strong>1,500 tokens per month</strong> at no cost.</li>
            <li>Each ticket lets you enter one 3-digit number (000–999) for the weekly draw.</li>
            <li>The weekly drawing occurs every Monday at 12:00 AM ET.</li>
            <li>Prize tier is determined by your subscription status at the time of entry.</li>
            <li>Referrers earn a 10% cash bonus when someone they referred wins a cash prize.</li>
          </ul>
        </Section>

        <Section title="Tickets & Tokens">
          <p>Numble uses two currencies:</p>
          <ul>
            <li><strong>🎟️ Tickets</strong> — used to enter the weekly draw or spin the wheel. 1 ticket = 1,000 tokens = 1 entry or 1 spin.</li>
            <li><strong><TokenIcon size={15} /> Tokens</strong> — earned through monthly grants and gameplay. Exchange 1,000 tokens for 1 ticket anytime.</li>
          </ul>
          <p className="rules-note">You can exchange tokens for tickets at any time from the Play page.</p>

          <table className="rules-table">
            <thead>
              <tr><th>Plan</th><th>Monthly Tokens</th><th>Cost</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>🆓 Free</td>
                <td>1,500 tokens</td>
                <td>No cost</td>
              </tr>
              <tr className="gold-row">
                <td>⭐ Subscriber</td>
                <td>3,500 tokens</td>
                <td>$12.99/mo</td>
              </tr>
            </tbody>
          </table>
          <p className="rules-note">Exchange 1,000 tokens for 1 ticket anytime. Subscribers receive a 2,000-token bonus immediately upon subscribing, then their full monthly allocation on the 1st of each month.</p>
        </Section>

        <Section title="Token Pack">
          <ul>
            <li>All users can purchase a one-time token pack: <strong>3,500 tokens for $9.99</strong>.</li>
            <li>3,500 tokens = 3 tickets (or use them to spin the wheel — 1,000 tokens per spin).</li>
          </ul>
        </Section>

        <Section title="Weekly Draw">
          <ul>
            <li>Pick any 3-digit number (000–999) and submit it as your entry for the week.</li>
            <li>Each number has a limited number of slots per draw to keep it competitive.</li>
            <li>You may enter more than once — each entry costs 1,000 tokens and counts separately.</li>
            <li>Draws run every Monday at 12:00 AM ET. Results are revealed when you open the app.</li>
          </ul>

          <table className="rules-table">
            <thead>
              <tr><th>Result</th><th>🆓 Free</th><th>⭐ Subscriber</th></tr>
            </thead>
            <tbody>
              <tr><td>Exact match (all 3 in order)</td><td>$50</td><td className="gold-cell">$1,000</td></tr>
              <tr><td>All 3 correct, wrong order</td><td>$5</td><td className="gold-cell">$100</td></tr>
              <tr><td>Exactly 2 digits in position</td><td colSpan="2" style={{textAlign:'center'}}>+1,500 tokens</td></tr>
              <tr><td>Exactly 1 digit in position</td><td colSpan="2" style={{textAlign:'center'}}>+500 tokens</td></tr>
            </tbody>
          </table>
          <p className="rules-note">Subscription status at time of entry determines your prize tier.</p>
        </Section>

        <Section title="Referral Program">
          <ul>
            <li>Share your unique referral code with friends.</li>
            <li>When someone you referred wins a cash prize, you earn a <strong>10% bonus</strong>.</li>
            <li>Example: your referral wins $1,000 — you earn $100.</li>
            <li>Referral bonuses accumulate in your balance and are paid via the same methods as prizes.</li>
            <li>There is no limit to how many people you can refer — bonuses last forever.</li>
          </ul>
        </Section>

        <Section title="Fair Play">
          <ul>
            <li>One account per person. Creating multiple accounts to gain additional tokens, entries, or prizes is strictly prohibited.</li>
            <li>Accounts found to be duplicates will be permanently banned and any prizes forfeited.</li>
            <li>Automated entry, bots, and scripts are not permitted.</li>
          </ul>
        </Section>

        <Section title="Payouts">
          <ul>
            <li>Cash prizes are paid via PayPal, Venmo, or Cash App.</li>
            <li>Enter your preferred payout method in your Profile before requesting a withdrawal.</li>
            <li>Payouts are processed manually within 5 business days.</li>
            <li>A minimum balance of $5.00 is required to request a payout.</li>
          </ul>
        </Section>

        <Section title="Spin the Wheel">
          <ul>
            <li>Spend 1,000 tokens to spin the wheel for an instant token prize.</li>
            <li>Possible outcomes range from 0 (Bankrupt) to 10,000 tokens.</li>
            <li>The wheel has a <strong>92.875% RTP</strong>.</li>
            <li>Spin results are determined server-side before the animation plays.</li>
          </ul>
        </Section>

        <Section title="Privacy Policy">
          <p>We collect your email, username, and entry data solely to operate the sweepstakes, determine winners, and process payouts. We do not sell or share your personal data with third parties. See our full <a href="/privacy" className="rules-link">Privacy Policy</a>.</p>
        </Section>

        <Section title="Terms of Use">
          <p>By using Numble, you agree to play fairly, follow all sweepstakes rules, and confirm you are 18 years of age or older. Automated or unauthorized entry is prohibited. See our full <a href="/terms" className="rules-link">Terms of Use</a>.</p>
        </Section>

      </div>
    </div>
  );
}
