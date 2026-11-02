import { pool } from "./db.js";

export const CHATBOT_SERVICE_EMAIL = "csagent@cts.com";

export function isChatbotServiceEmail(email: string) {
  return email.trim().toLowerCase() === CHATBOT_SERVICE_EMAIL;
}

export async function findChatbotServiceAccount(): Promise<{
  id: number;
  email: string;
} | null> {
  const { rows } = await pool.query(
    `SELECT id, email
     FROM users
     WHERE lower(email) = lower($1)`,
    [CHATBOT_SERVICE_EMAIL]
  );

  const row = rows[0];
  if (!row) return null;
  return { id: row.id as number, email: row.email as string };
}
