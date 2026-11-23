export function pgClientConfig(connectionString: string): {
  connectionString: string;
  ssl?: { rejectUnauthorized: false };
};
