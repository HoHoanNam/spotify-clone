/** Header gradient colours. Spotify derives them from the cover; we pick a stable one per id. */
const PALETTE = ['#535353', '#1e3264', '#8d67ab', '#e8115b', '#148a08', '#509bf5', '#ba5d07', '#27856a', '#af2896', '#477d95'];

export function colorFor(id: number | null | undefined): string {
  return PALETTE[Math.abs(id ?? 0) % PALETTE.length];
}

export function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
