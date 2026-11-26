import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateCode, closeArtifact } from '../store/artifactSlice';

export default function ArtifactPanel() {
  const dispatch = useDispatch();
  const { open, language, code } = useSelector((s) => s.artifact);
  const [tab, setTab] = useState('preview');
  if (!open) return null;

  const canPreview = ['html', 'htm', 'svg'].includes(language.toLowerCase());
  const view = canPreview ? tab : 'code';
  const tabClass = (name) =>
    `rounded px-3 py-1 text-sm ${view === name ? 'bg-zinc-700' : 'hover:bg-zinc-800'}`;

  return (
    <section className='flex w-[45%] shrink-0 flex-col border-l border-zinc-800 bg-zinc-950'>
      <div className='flex items-center gap-2 border-b border-zinc-800 p-2'>
        {canPreview && <button onClick={() => setTab('preview')} className={tabClass('preview')}>Preview</button>}
        <button onClick={() => setTab('code')} className={tabClass('code')}>Code</button>
        <span className='ml-2 text-xs text-zinc-500'>{language}</span>
        <button onClick={() => navigator.clipboard.writeText(code)} className='ml-auto text-xs text-zinc-400 hover:text-white'>Copy</button>
        <button onClick={() => dispatch(closeArtifact())} className='text-xs text-zinc-400 hover:text-white'>Close</button>
      </div>
      {view === 'preview' ? (
        <iframe title='preview' sandbox='allow-scripts' srcDoc={code} className='h-full w-full bg-white' />
      ) : (
        <textarea
          value={code}
          onChange={(e) => dispatch(updateCode(e.target.value))}
          spellCheck={false}
          className='h-full w-full resize-none bg-zinc-950 p-4 font-mono text-sm outline-none'
        />
      )}
    </section>
  );
}