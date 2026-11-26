import { useDispatch, useSelector } from 'react-redux';
import { setAgent } from '../store/chatSlice';

const AGENTS = [
  { id: 'chat', label: 'Chat' },
  { id: 'search', label: 'Search' },
  { id: 'coding', label: 'Coding' },
  { id: 'vision', label: 'Vision' },
  { id: 'pdf', label: 'PDF' },
  { id: 'ppt', label: 'PPT' },
];

export default function AgentPicker() {
  const dispatch = useDispatch();
  const agent = useSelector((s) => s.chat.agent);
  return (
    <div className='mb-3 flex flex-wrap gap-2'>
      {AGENTS.map((a) => (
        <button
          key={a.id}
          onClick={() => dispatch(setAgent(a.id))}
          className={`rounded-full px-3 py-1 text-sm ${agent === a.id ? 'bg-indigo-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}