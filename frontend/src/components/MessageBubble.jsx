import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useDispatch } from 'react-redux';
import { setArtifact } from '../store/artifactSlice';
import { extractCode } from '../utils';

const Link = (props) => <a {...props} target='_blank' rel='noreferrer' />;

export default function MessageBubble({ message }) {
  const dispatch = useDispatch();
  const isUser = message.role === 'user';
  const art = !isUser && message.agent === 'coding' ? extractCode(message.content) : null;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${isUser ? 'bg-indigo-600' : 'border border-zinc-800 bg-zinc-900'}`}>
        {message.image && <img src={message.image} alt='attachment' className='mb-2 max-h-60 rounded-lg' />}
        {isUser ? (
          <p className='whitespace-pre-wrap'>{message.content}</p>
        ) : (
          <div className='prose prose-invert max-w-none'>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: Link }}>
              {message.content || '...'}
            </ReactMarkdown>
          </div>
        )}
        {art && (
          <button
            onClick={() => dispatch(setArtifact(art))}
            className='mt-2 rounded-md bg-zinc-800 px-3 py-1 text-xs hover:bg-zinc-700'
          >
            Open in preview panel
          </button>
        )}
      </div>
    </div>
  );
}