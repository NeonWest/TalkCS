import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import PostPage from './pages/PostPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';
import CalendarPage from './pages/CalendarPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/category/:id" element={<ProtectedRoute><CategoryPage /></ProtectedRoute>} />
          <Route path="/post/:id" element={<ProtectedRoute><PostPage /></ProtectedRoute>} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
