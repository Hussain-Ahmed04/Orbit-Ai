const FENCE = String.fromCharCode(96).repeat(3);

export function extractCode(text) {
  const start = text.indexOf(FENCE);
  if (start === -1) return null;
  const lineEnd = text.indexOf('\n', start);
  if (lineEnd === -1) return null;
  const end = text.indexOf(FENCE, lineEnd + 1);
  if (end === -1) return null;
  const language = text.slice(start + 3, lineEnd).trim() || 'html';
  return { language, code: text.slice(lineEnd + 1, end) };
}