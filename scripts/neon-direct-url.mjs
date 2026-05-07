/** Neon pooler often rejects TRUNCATE/DDL; use compute (direct) host for admin tasks. */
export function neonDirectUrl(connectionString) {
  return connectionString.replace("-pooler.", ".");
}
