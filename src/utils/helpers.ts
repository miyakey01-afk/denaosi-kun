export function generateId(): string {
  return crypto.randomUUID();
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

export function nowISO(): string {
  return new Date().toISOString();
}
