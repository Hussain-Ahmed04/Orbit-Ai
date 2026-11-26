import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChats } from './store/chatSlice';
import { clearAuth } from './store/authSlice';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import Composer from './components/Composer';
import ArtifactPanel from './components/ArtifactPanel';

export default function App() {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);

  useEffect(() => {
    if (!token) return;
    dispatch(fetchChats())
      .unwrap()
      .catch((e) => { if (e.message === 'SESSION_EXPIRED') dispatch(clearAuth()); });
  }, [token, dispatch]);

  if (!token) return <Login />;
  return (
    <div className='flex h-full'>
      <Sidebar />
      <main className='flex min-w-0 flex-1 flex-col'>
        <ChatWindow />
        <Composer />
      </main>
      <ArtifactPanel />
    </div>
  );
}