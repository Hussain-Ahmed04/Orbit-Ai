import { useDispatch, useSelector } from 'react-redux';
import { setActive, fetchMessages } from '../store/chatSlice';
import { logout } from '../store/authSlice';

export default function Sidebar() {
  const dispatch = useDispatch();
  const { chats, activeId, messages } = useSelector((s) => s.chat);
  const user = useSelector((s) => s.auth.user);

  const openChat = (id) => {
    dispatch(setActive(id));
    if (!messages[id]) dispatch(fetchMessages(id));
  };

  return (
    <aside className='flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950'>
      <button
        onClick={() => dispatch(setActive(null))}
        className='m-3 rounded-lg border border-zinc-700 py-2 text-sm hover:bg-zinc-900'
      >
        + New chat
      </button>
      <div className='flex-1 space-y-1 overflow-y-auto px-2'>
        {chats.map((c) => (
          <button
            key={c.id}
            onClick={() => openChat(c.id)}
            className={`w-full truncate rounded-md px-3 py-2 text-left text-sm ${c.id === activeId ? 'bg-zinc-800' : 'hover:bg-zinc-900'}`}
          >
            {c.title || 'Untitled chat'}
          </button>
        ))}
      </div>
      <div className='flex items-center gap-2 border-t border-zinc-800 p-3'>
        {user?.photo && <img src={user.photo} alt='' className='h-8 w-8 rounded-full' />}
        <span className='flex-1 truncate text-sm'>{user?.name}</span>
        <button onClick={() => dispatch(logout())} className='text-xs text-zinc-400 hover:text-white'>
          Logout
        </button>
      </div>
    </aside>
  );
}