// Uses the Vite dev server API — works across all devices on the same network
// because both PC and mobile hit the same server at the same IP

export async function getVendors(): Promise<any[]> {
  const res = await fetch('/api/vendors');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function saveVendors(vendors: any[]): Promise<void> {
  const res = await fetch('/api/vendors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vendors),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
