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

export default function App() {
  const authed = useStore(s => s.authed);

  if (!authed) return <Login />;

  return (
    <Shell>
      <CurrentView />
    </Shell>
  );
}
