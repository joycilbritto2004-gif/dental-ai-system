// Seed scripts create accounts with known credentials and delete existing records.
// Running one against a hosted database would put a known login on a reachable deployment,
// so they are restricted to a local MongoDB unless the operator opts out explicitly.
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]', '0.0.0.0'];

const isLocalUri = (uri) => {
  try {
    // mongodb:// and mongodb+srv:// both parse with the WHATWG URL parser.
    const { hostname } = new URL(uri);
    return LOCAL_HOSTS.includes(hostname);
  } catch (e) {
    return false;
  }
};

const assertLocalDatabase = (uri) => {
  if (isLocalUri(uri)) return;
  if (process.env.ALLOW_REMOTE_SEED === 'true') {
    console.warn('⚠️  ALLOW_REMOTE_SEED=true — seeding a non-local database.');
    return;
  }
  throw new Error(
    'Refusing to seed a non-local database. Seeds create accounts with known passwords.\n' +
    'Point MONGODB_URI at a local MongoDB, or set ALLOW_REMOTE_SEED=true if you really mean it.'
  );
};

module.exports = { assertLocalDatabase, isLocalUri };
