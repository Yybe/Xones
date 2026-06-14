import { useEffect } from 'react';
import { useStore } from './store';
import Login from './components/Login';
import Shell from './components/Shell';
import ComfortZone from './components/ComfortZone';
import ZoneView from './components/ZoneView';
import Garden from './components/Garden';
import Profile from './components/Profile';
import Friends from './components/Friends';

function CurrentView() {
  const view = useStore(s => s.view);

  switch (view) {
    case 'comfort': return <ComfortZone />;
    case 'zone': return <ZoneView />;
    case 'garden': return <Garden />;
    case 'profile': return <Profile />;
    case 'friends': return <Friends />;
    default: return <ComfortZone />;
  }
}

function Toast() {
  const toast = useStore(s => s.toast);
  const setToast = useStore(s => s.setToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast, setToast]);

  if (!toast) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-down">
      <div className={`flex items-center gap-2 px-5 py-3 rounded-xl border shadow-lg text-sm font-medium ${
        toast.type === 'success'
          ? 'bg-green-900/20 border-green-500/30 text-green-400'
          : 'bg-red-900/20 border-red-500/30 text-red-400'
      }`}>
        {toast.type === 'success' ? '✓' : '✕'} {toast.message}
      </div>
    </div>
  );
}

export default function App() {
  const authed = useStore(s => s.authed);

  if (!authed) return <Login />;

  return (
    <Shell>
      <CurrentView />
      <Toast />
    </Shell>
  );
}
