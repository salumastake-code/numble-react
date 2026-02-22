/**
 * Lightweight device fingerprinting.
 * Collects stable browser signals and hashes them into a fingerprint.
 * Not foolproof but catches casual multi-account abuse.
 */

async function getCanvasHash() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Numble🎈', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Numble🎈', 4, 17);
    return canvas.toDataURL().slice(-64);
  } catch {
    return 'no-canvas';
  }
}

async function getWebGLHash() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';
    const renderer = gl.getParameter(gl.RENDERER);
    const vendor = gl.getParameter(gl.VENDOR);
    return `${vendor}:${renderer}`.slice(0, 64);
  } catch {
    return 'no-webgl';
  }
}

async function hashString(str) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
  } catch {
    // Fallback: simple djb2 hash
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
    return Math.abs(h).toString(16).padStart(8, '0');
  }
}

export async function getFingerprint() {
  // Check cache first (stable within session)
  const cached = sessionStorage.getItem('_nfp');
  if (cached) return cached;

  const signals = [
    navigator.userAgent,
    navigator.language,
    navigator.languages?.join(',') || '',
    String(screen.width) + 'x' + String(screen.height),
    String(screen.colorDepth),
    String(new Date().getTimezoneOffset()),
    Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    String(navigator.hardwareConcurrency || ''),
    String(navigator.deviceMemory || ''),
    String(navigator.maxTouchPoints || ''),
    String(window.devicePixelRatio || ''),
    await getCanvasHash(),
    await getWebGLHash(),
  ].join('|');

  const fp = await hashString(signals);
  sessionStorage.setItem('_nfp', fp);
  return fp;
}
