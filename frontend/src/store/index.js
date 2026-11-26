import { configureStore } from '@reduxjs/toolkit';
import auth from './authSlice';
import chat from './chatSlice';
import artifact from './artifactSlice';

export const store = configureStore({ reducer: { auth, chat, artifact } });