import { useDispatch, useSelector } from 'react-redux';
import { loginWithGoogle } from '../store/authSlice';

export default function Login() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);
  return (
    <div className='flex h-full items-center justify-center'>
      <div className='w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center'>
        <h1 className='mb-2 text-2xl font-semibold'>Multi-Agent AI</h1>
        <p className='mb-6 text-zinc-400'>Chat, search, code, analyze images and PDFs, and build slides.</p>
        <button
          onClick={() => dispatch(loginWithGoogle())}
          disabled={loading}
          className='w-full rounded-lg bg-white py-2.5 font-medium text-black hover:bg-zinc-200 disabled:opacity-50'
        >
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>
        {error && <p className='mt-4 text-sm text-red-400'>{error}</p>}
      </div>
    </div>
  );
}