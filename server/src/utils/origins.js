const isLocalOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(origin);

// Turns the CLIENT_URL setting into the exact list of browser origins we trust.
// - trailing slashes and letter case are normalised, so "https://App.vercel.app/" still matches
// - a wildcard "*" is never accepted
// - in production, localhost and 127.0.0.1 are always dropped, even if someone typed them in
function buildAllowedOrigins(raw, nodeEnv) {
  return String(raw || '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, '').toLowerCase())
    .filter(Boolean)
    .filter((o) => o !== '*')
    .filter((o) => nodeEnv !== 'production' || !isLocalOrigin(o));
}

module.exports = { buildAllowedOrigins, isLocalOrigin };