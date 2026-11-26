import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendMessage, setFile, setImage, clearAttachments } from '../store/chatSlice';
import { api } from '../api';
import AgentPicker from './AgentPicker';

export default function Composer() {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);
  const { agent, file, image, streaming } = useSelector((s) => s.chat);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);

  const needsFile = agent === 'pdf' && !file;
  const needsImage = agent === 'vision' && !image;
  const canSend = text.trim() && !streaming && !uploading && !needsFile && !needsImage;

  const submit = () => {
    if (!canSend) return;
    dispatch(sendMessage(text.trim()));
    setText('');
  };

  const onPick = async (e) => {
    const picked = e.target.files[0];
    e.target.value = '';
    if (!picked) return;
    setErr('');
    if (agent === 'vision') {
      const reader = new FileReader();
      reader.onload = () => dispatch(setImage(reader.result));
      reader.readAsDataURL(picked);
    } else if (agent === 'pdf') {
      setUploading(true);
      try {
        const form = new FormData();
        form.append('file', picked);
        const res = await api('/api/agent/pdf/upload', { method: 'POST', body: form, token });
        dispatch(setFile({ id: res.file_id, name: res.name }));
      } catch (error) {
        setErr(error.message);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className='border-t border-zinc-800 p-4'>
      <AgentPicker />
      {(file || image) && (
        <div className='mb-2 flex items-center gap-2 text-sm text-zinc-300'>
          {image && <img src={image} alt='' className='h-12 rounded' />}
          {file && <span className='rounded bg-zinc-800 px-2 py-1'>{file.name}</span>}
          <button onClick={() => dispatch(clearAttachments())} className='text-zinc-500 hover:text-white'>
            remove
          </button>
        </div>
      )}
      <div className='flex items-end gap-2'>
        {(agent === 'pdf' || agent === 'vision') && (
          <>
            <input
              ref={fileRef}
              type='file'
              hidden
              accept={agent === 'pdf' ? 'application/pdf' : 'image/*'}
              onChange={onPick}
            />
            <button
              onClick={() => fileRef.current.click()}
              disabled={uploading}
              className='rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-900'
            >
              {uploading ? 'Uploading...' : 'Attach'}
            </button>
          </>
        )}
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
          }}
          placeholder={`Message the ${agent} agent...`}
          className='max-h-40 flex-1 resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none focus:border-indigo-500'
        />
        <button
          onClick={submit}
          disabled={!canSend}
          className='rounded-lg bg-indigo-600 px-4 py-2 font-medium disabled:opacity-40'
        >
          Send
        </button>
      </div>
      {needsFile && <p className='mt-2 text-xs text-amber-400'>Attach a PDF to use the PDF agent.</p>}
      {needsImage && <p className='mt-2 text-xs text-amber-400'>Attach an image to use the Vision agent.</p>}
      {err && <p className='mt-2 text-xs text-red-400'>{err}</p>}
    </div>
  );
}