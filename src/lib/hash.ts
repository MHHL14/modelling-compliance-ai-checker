/** SHA-256 hex digest via Web Crypto. */
export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Hash of a package: the whole package serialised with manifest.sha256 blanked. */
export async function packageHash(pkg: { manifest: { sha256: string } }): Promise<string> {
  const clone = { ...pkg, manifest: { ...pkg.manifest, sha256: '' } };
  return sha256Hex(JSON.stringify(clone));
}

export const shortHash = (h?: string) => (h ? `${h.slice(0, 12)}…${h.slice(-4)}` : '—');
