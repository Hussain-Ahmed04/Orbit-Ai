const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function api(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const isForm = body instanceof FormData;
  if (body && !isForm) headers['Content-Type'] = 'application/json';
  const res = await fetch(API + path, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  if (res.status === 401 && token) throw new Error('SESSION_EXPIRED');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.detail === 'string' ? err.detail : `Request failed (${res.status})`);
  }
  return res.json();
}

export async function streamMessage(chatId, payload, token, onEvent) {
  const res = await fetch(`${API}/api/chat/chats/${chatId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split('\n\n');
    buffer = frames.pop();
    for (const frame of frames) {
      if (frame.startsWith('data: ')) onEvent(JSON.parse(frame.slice(6)));
    }
  }
}