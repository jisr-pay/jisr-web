interface ClipboardOptions {
  writeText?: (text: string) => Promise<void>;
  document?: Document;
}

/** Copy a public transaction hash, restoring focus even when legacy copy fails. */
export async function copyText(text: string, options?: ClipboardOptions): Promise<boolean> {
  const writeText = options ? options.writeText : globalThis.navigator?.clipboard?.writeText.bind(globalThis.navigator.clipboard);
  const doc = options ? options.document : globalThis.document;
  try {
    if (writeText) { await writeText(text); return true; }
  } catch { /* Fall back when browser permissions reject the modern API. */ }
  if (!doc?.body) return false;
  const previousFocus = doc.activeElement as HTMLElement | null;
  const field = doc.createElement('textarea');
  field.value = text;
  field.readOnly = true;
  field.style.position = 'fixed';
  field.style.opacity = '0';
  try {
    doc.body.appendChild(field);
    field.select();
    return doc.execCommand('copy');
  } catch { return false; }
  finally {
    field.remove();
    previousFocus?.focus?.({ preventScroll: true });
  }
}
