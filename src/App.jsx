import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider, useAppContext } from './context/AppContext';
import ErrorBoundary from './ErrorBoundary';
import FEATURE_FLAGS from './config/featureFlags';

// Layouts
import UserLayout from './components/layout/UserLayout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages - User Domain
import Dashboard from './pages/user/Dashboard';
import TrainingList from './pages/user/TrainingList';
import ActiveWorkout from './pages/user/ActiveWorkout';
import AcademyLibrary from './pages/user/AcademyLibrary';
import Progress from './pages/user/Progress';
import Nutrition from './pages/user/Nutrition';
import CsvGames from './pages/user/CsvGames';
import LeagueRewards from './pages/user/LeagueRewards';
import Shop from './pages/user/Shop';
import Profile from './pages/user/Profile';
import MyAvailability from './pages/user/MyAvailability';
import Chat from './pages/user/Chat';

// Pages - Admin Domain
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminChat from './pages/admin/AdminChat';
import ProgramBuilder from './pages/admin/ProgramBuilder';
import ExerciseLibrary from './pages/admin/ExerciseLibrary';
import VideoUpload from './pages/admin/VideoUpload';
import AdminLessons from './pages/admin/AdminLessons';
import AdminAcademy from './pages/admin/AdminAcademy';
import AdminAthleteDetail from './pages/admin/AdminAthleteDetail';

// Auth & Guards
import AuthPage from './pages/user/AuthPage';
import UserProtectedRoute from './components/layout/UserProtectedRoute';

// Gamification Overlays
import RewardAnimation from './components/gamification/RewardAnimation';
import LeaguePopup from './components/gamification/LeaguePopup';



/* ── Global Overlays (inside AppProvider context) ── */
function GamificationOverlays() {
  // Launch Light: non montare overlay se REWARDS è disattivato
  if (!FEATURE_FLAGS.REWARDS) return null;

  const { rewardPopup } = useAppContext();
  return (
    <>
      {rewardPopup && <RewardAnimation xp={rewardPopup.xp} points={rewardPopup.points} />}
      <LeaguePopup />
    </>
  );
}

function App() {

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <BrowserRouter>
            <GamificationOverlays />

            <Routes>
              {/* Auth Routes */}
              <Route path="/auth" element={<AuthPage />} />

              {/* User Portal */}
              <Route element={<UserLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                <Route element={<UserProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  {/* Gamification Routes — condizionati da feature flags */}
                  <Route path="/games" element={FEATURE_FLAGS.GAMES ? <CsvGames /> : <Navigate to="/dashboard" replace />} />
                  <Route path="/games/rewards" element={FEATURE_FLAGS.REWARDS ? <LeagueRewards /> : <Navigate to="/dashboard" replace />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/nutrition" element={<Nutrition />} />
                  <Route path="/training" element={<TrainingList />} />
                  <Route path="/workout/:id" element={<ActiveWorkout />} />
                  <Route path="/academy" element={<AcademyLibrary />} />
                  <Route path="/progress" element={FEATURE_FLAGS.PROGRESS ? <Progress /> : <Navigate to="/dashboard" replace />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/availability" element={<MyAvailability />} />
                  <Route path="/chat" element={<Chat />} />
                </Route>
              </Route>

              {/* Admin Routes */}
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/login" element={<Navigate to="/auth" replace />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/programs" element={<ProgramBuilder />} />
                  <Route path="/admin/programs/:id" element={<ProgramBuilder />} />
                  <Route path="/admin/exercises" element={<ExerciseLibrary />} />
                  <Route path="/admin/videos" element={<VideoUpload />} />
                  <Route path="/admin/lessons" element={<AdminLessons />} />
                  <Route path="/admin/chat" element={<AdminChat />} />
                  <Route path="/admin/academy" element={<AdminAcademy />} />
                  <Route path="/admin/athlete/:athleteId" element={<AdminAthleteDetail />} />
                  {/* Fallback & Redirects */}
                  <Route path="/admin/settings" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
                </Route>
              </Route>
            </Routes>
            <Analytics />
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
