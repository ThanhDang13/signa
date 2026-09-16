export interface PostgresConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
  ssl?: boolean;
}

export function buildPostgresUrl(config: PostgresConfig): string {
  const user = encodeURIComponent(config.user);
  const password = encodeURIComponent(config.password);
  const host = config.host;
  const port = config.port;
  const database = config.database;

  const base = `postgresql://${user}:${password}@${host}:${port}/${database}`;

  if (config.ssl) {
    return `${base}?sslmode=require`;
  }

  return base;
}
