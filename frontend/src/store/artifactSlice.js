import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'artifact',
  initialState: { open: false, language: 'html', code: '' },
  reducers: {
    setArtifact(s, a) { s.open = true; s.language = a.payload.language; s.code = a.payload.code; },
    updateCode(s, a) { s.code = a.payload; },
    closeArtifact(s) { s.open = false; },
  },
});

export const { setArtifact, updateCode, closeArtifact } = slice.actions;
export default slice.reducer;