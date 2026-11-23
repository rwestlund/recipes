const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const SSL_QUERY_KEYS = ["sslmode", "ssl", "sslcert", "sslkey", "sslrootcert", "sslnegotiation", "uselibpqcompat"];

/**
 * node-pg leaves SSL off unless it is set on the client. Hosted Postgres, including
 * Heroku, rejects that with "no encryption". A local URL stays unchanged.
 * @param {string} connectionString
 */
export function pgClientConfig(connectionString) {
  const connection = connectionString.trim();
  if (isLocalConnection(connection)) return { connectionString: connection };
  return {
    connectionString: withoutSslQuery(connection),
    ssl: { rejectUnauthorized: false },
  };
}

/**
 * @param {string} connectionString
 */
function isLocalConnection(connectionString) {
  if (connectionString.startsWith("/")) return true;
  const host = connectionHost(connectionString);
  if (host == null) return false;
  if (host === "" || host.startsWith("/")) return true;
  return LOCAL_HOSTS.has(host);
}

/**
 * @param {string} connectionString
 * @returns {string | null}
 */
function connectionHost(connectionString) {
  try {
    const url = new URL(connectionString);
    return decodeURIComponent(url.hostname.replace(/^\[|\]$/g, "")).toLowerCase();
  } catch {
    const match = connectionString.match(/(?:^|\s)host=(\S+)/i);
    return match ? match[1].toLowerCase() : null;
  }
}

/**
 * A sslmode query param is parsed after the client config and would replace the
 * explicit SSL option. Drop those params so the option we set is the one used.
 * @param {string} connectionString
 */
function withoutSslQuery(connectionString) {
  let url;
  try {
    url = new URL(connectionString);
  } catch {
    return connectionString;
  }
  let changed = false;
  for (const key of SSL_QUERY_KEYS) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  return changed ? url.href : connectionString;
}
