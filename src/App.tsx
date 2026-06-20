import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import BottomNav from './components/BottomNav';
import Login from './screens/Login';
import Plan from './screens/Plan';
import Decks from './screens/Decks';
import DeckDetail from './screens/DeckDetail';
import Study from './screens/Study';
import Stats from './screens/Stats';
import Profile from './screens/Profile';
import Saved from './screens/Saved';

function Shell() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <span style={{ color: 'var(--txt-3)', fontSize: 14 }}>Carregando…</span>
      </div>
    );
  }

  if (!user) return <Login />;

  const inStudy = location.pathname.startsWith('/study');

  return (
    <DataProvider>
      <Routes>
        <Route path="/"              element={<Plan />} />
        <Route path="/decks"         element={<Decks />} />
        <Route path="/decks/:deckId" element={<DeckDetail />} />
        <Route path="/study"         element={<Study />} />
        <Route path="/study/:deckId" element={<Study />} />
        <Route path="/stats"         element={<Stats />} />
        <Route path="/profile"       element={<Profile />} />
        <Route path="/saved"         element={<Saved />} />
      </Routes>
      {!inStudy && <BottomNav />}
    </DataProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  );
}
