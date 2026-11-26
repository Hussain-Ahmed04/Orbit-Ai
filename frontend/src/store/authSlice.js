import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../api';
import { googleLogin, firebaseLogout } from '../firebase';

const KEY = 'platform_auth';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function save(value) {
  try {
    if (value) localStorage.setItem(KEY, JSON.stringify(value));
    else localStorage.removeItem(KEY);
  } catch { /* storage unavailable */ }
}

export const loginWithGoogle = createAsyncThunk('auth/login', async () => {
  const idToken = await googleLogin();
  return api('/api/auth/login', { method: 'POST', body: { id_token: idToken } });
});

export const logout = createAsyncThunk('auth/logout', async (_, { getState }) => {
  const { token } = getState().auth;
  try { await api('/api/auth/logout', { method: 'POST', token }); } catch { /* ignore */ }
  try { await firebaseLogout(); } catch { /* ignore */ }
});

const slice = createSlice({
  name: 'auth',
  initialState: { token: load().token || null, user: load().user || null, loading: false, error: null },
  reducers: {
    clearAuth(state) {
      state.token = null;
      state.user = null;
      save(null);
    },
  },
  extraReducers: (b) => {
    b.addCase(loginWithGoogle.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loginWithGoogle.fulfilled, (s, a) => {
        s.loading = false;
        s.token = a.payload.token;
        s.user = a.payload.user;
        save({ token: s.token, user: s.user });
      })
      .addCase(loginWithGoogle.rejected, (s, a) => { s.loading = false; s.error = a.error.message; })
      .addCase(logout.fulfilled, (s) => { s.token = null; s.user = null; save(null); });
  },
});

export const { clearAuth } = slice.actions;
export default slice.reducer;