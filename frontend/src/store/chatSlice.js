import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, streamMessage } from '../api';
import { logout, clearAuth } from './authSlice';
import { setArtifact } from './artifactSlice';
import { extractCode } from '../utils';

const norm = (c) => ({ ...c, id: c.id || c._id });

export const fetchChats = createAsyncThunk('chat/fetchChats', async (_, { getState }) => {
  const list = await api('/api/chat/chats', { token: getState().auth.token });
  return list.map(norm);
});

export const createChat = createAsyncThunk('chat/create', async (title, { getState }) => {
  const chat = await api('/api/chat/chats', { method: 'POST', body: { title }, token: getState().auth.token });
  return norm(chat);
});

export const fetchMessages = createAsyncThunk('chat/fetchMessages', async (chatId, { getState }) => {
  const messages = await api(`/api/chat/chats/${chatId}/messages`, { token: getState().auth.token });
  return { chatId, messages };
});

export const sendMessage = createAsyncThunk('chat/send', async (content, { dispatch, getState }) => {
  const token = getState().auth.token;
  let chatId = getState().chat.activeId;
  const agent = getState().chat.agent;
  if (!chatId) {
    const created = await dispatch(createChat(content.slice(0, 40))).unwrap();
    chatId = created.id;
  }
  const { file, image } = getState().chat;
  dispatch(addMessage({ chatId, message: { role: 'user', content, agent, image } }));
  dispatch(addMessage({ chatId, message: { role: 'assistant', content: '', agent } }));
  dispatch(clearAttachments());
  try {
    await streamMessage(
      chatId,
      { content, agent, file_id: file?.id || null, image: image || null },
      token,
      (evt) => { if (evt.type === 'token') dispatch(appendToken({ chatId, text: evt.text })); }
    );
  } catch (e) {
    if (e.message === 'SESSION_EXPIRED') { dispatch(clearAuth()); return; }
    dispatch(appendToken({ chatId, text: '\n\nError: ' + e.message }));
  }
  if (agent === 'coding') {
    const list = getState().chat.messages[chatId];
    const art = extractCode(list[list.length - 1].content);
    if (art) dispatch(setArtifact(art));
  }
});

const initialState = {
  chats: [], activeId: null, messages: {}, agent: 'chat',
  file: null, image: null, streaming: false,
};

const slice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActive(s, a) { s.activeId = a.payload; },
    setAgent(s, a) { s.agent = a.payload; s.file = null; s.image = null; },
    setFile(s, a) { s.file = a.payload; },
    setImage(s, a) { s.image = a.payload; },
    clearAttachments(s) { s.file = null; s.image = null; },
    addMessage(s, a) {
      const { chatId, message } = a.payload;
      (s.messages[chatId] ||= []).push(message);
    },
    appendToken(s, a) {
      const list = s.messages[a.payload.chatId];
      list[list.length - 1].content += a.payload.text;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchChats.fulfilled, (s, a) => { s.chats = a.payload; })
      .addCase(createChat.fulfilled, (s, a) => {
        s.chats.unshift(a.payload);
        s.activeId = a.payload.id;
        s.messages[a.payload.id] = [];
      })
      .addCase(fetchMessages.fulfilled, (s, a) => { s.messages[a.payload.chatId] = a.payload.messages; })
      .addCase(sendMessage.pending, (s) => { s.streaming = true; })
      .addCase(sendMessage.fulfilled, (s) => { s.streaming = false; })
      .addCase(sendMessage.rejected, (s) => { s.streaming = false; })
      .addCase(logout.fulfilled, () => initialState)
      .addCase(clearAuth, () => initialState);
  },
});

export const {
  setActive, setAgent, setFile, setImage, clearAttachments, addMessage, appendToken,
} = slice.actions;
export default slice.reducer;