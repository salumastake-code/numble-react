import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://numble.io';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const DEFAULT_TITLE = 'NUMBLE — Pick your number. Win cash.';
const DEFAULT_DESC = 'Weekly 3-digit number sweepstakes. Free to play. Real cash prizes. Pick your number and win.';

export default function SEO({ title, description, path = '/', noIndex = false }) {
  const fullTitle = title ? `${title} | NUMBLE` : DEFAULT_TITLE;
  const desc = description || DEFAULT_DESC;
  const canonical = `${BASE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={DEFAULT_IMAGE} />

      {/* Twitter */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={DEFAULT_IMAGE} />

      {/* Prevent indexing of private/app pages */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
}
