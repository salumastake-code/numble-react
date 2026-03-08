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
            <li>Referrers earn a 10% cash bonus when someone they referred wins a cash prize — paid on top of the winner's prize, not taken from it.</li>
          </ul>
        </Section>

        <Section title="Tickets & Tokens">
          <p>Exchange 1,000 tokens for a ticket at any time. Each draw entry costs 1 ticket.</p>

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
                <td>1,500 free + 2,500 bonus tokens</td>
                <td>$12.99/mo</td>
              </tr>
            </tbody>
          </table>
          <p className="rules-note">Subscribers receive 1,500 free tokens + 2,500 bonus tokens each month. Exchange 1,000 tokens for 1 ticket anytime.</p>
        </Section>

        <Section title="Token Pack">
          <ul>
            <li>All users can purchase a one-time token pack: <strong>3,500 tokens for $9.99</strong>.</li>
          </ul>
        </Section>

        <Section title="Weekly Draw">
          <ul>
            <li>Pick any 3-digit number (000–999) and submit it as your entry for the week.</li>
            <li>Each number has a limited number of slots per draw to keep it competitive.</li>
            <li>You may enter more than once — each entry costs 1,000 tokens and counts separately.</li>
            <li>Draws run every Monday at 12:00 AM ET. Results are revealed when you open the app.</li>
            <li><strong>All entrants receive the same base prize regardless of subscription status.</strong> Subscribers receive an additional bonus prize on top — the subscription bonus is not a condition of winning.</li>
          </ul>

          <table className="rules-table">
            <thead>
              <tr><th>Result</th><th>🆓 Free (base prize)</th><th>⭐ Subscriber bonus</th></tr>
            </thead>
            <tbody>
              <tr><td>Exact match (all 3 in order)</td><td>$50</td><td className="gold-cell">+$1,000 bonus</td></tr>
              <tr><td>All 3 correct, wrong order</td><td>$2.50 + 200 tokens</td><td className="gold-cell">+$50 bonus + 4,000 token bonus</td></tr>
              <tr><td>Exactly 2 digits in position</td><td>+75 tokens</td><td className="gold-cell">+1,500 token bonus</td></tr>
              <tr><td>Exactly 1 digit in position</td><td>+25 tokens</td><td className="gold-cell">+500 token bonus</td></tr>
            </tbody>
          </table>
          <p className="rules-note">All entrants — free and subscriber alike — receive the same base prize. Subscribers receive an additional bonus on top of the base prize. Subscription status at time of entry determines bonus eligibility.</p>
        </Section>

        <Section title="Referral Program">
          <ul>
            <li>Share your unique referral code with friends.</li>
            <li>When someone you referred wins a prize, you earn a <strong>10% bonus on top</strong> — their prize is paid in full, unaffected.</li>
            <li>Example: your referral gets all 3 digits correct in the wrong order — they win $2.50 + 200 tokens, you earn $0.25 + 20 tokens on top.</li>
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
            <li>Spend <strong>300 tokens</strong> to spin the wheel for an instant token prize.</li>
            <li>Possible outcomes range from 0 (Bankrupt) to 2,500 tokens.</li>
            <li>The wheel has a <strong>93% RTP</strong>.</li>
            <li>Spin results are determined server-side before the animation plays.</li>
            <li>A RESPIN outcome gives a free re-roll at no additional cost.</li>
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
