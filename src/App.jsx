import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider, useAppContext } from './context/AppContext';
import ErrorBoundary from './ErrorBoundary';
import FEATURE_FLAGS from './config/featureFlags';

// Layouts — kept eager (always needed)
import UserLayout from './components/layout/UserLayout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import UserProtectedRoute from './components/layout/UserProtectedRoute';
import AuthPage from './pages/user/AuthPage';

// ── Lazy-loaded Pages: User Domain ──
const Dashboard = lazy(() => import('./pages/user/Dashboard'));
const TrainingList = lazy(() => import('./pages/user/TrainingList'));
const ActiveWorkout = lazy(() => import('./pages/user/ActiveWorkout'));
const AcademyLibrary = lazy(() => import('./pages/user/AcademyLibrary'));
const Progress = lazy(() => import('./pages/user/Progress'));
const Nutrition = lazy(() => import('./pages/user/Nutrition'));
const CsvGames = lazy(() => import('./pages/user/CsvGames'));
const LeagueRewards = lazy(() => import('./pages/user/LeagueRewards'));
const Shop = lazy(() => import('./pages/user/Shop'));
const Profile = lazy(() => import('./pages/user/Profile'));
const MyAvailability = lazy(() => import('./pages/user/MyAvailability'));
const Chat = lazy(() => import('./pages/user/Chat'));

// ── Lazy-loaded Pages: Admin Domain ──
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminChat = lazy(() => import('./pages/admin/AdminChat'));
const ProgramBuilder = lazy(() => import('./pages/admin/ProgramBuilder'));
const ExerciseLibrary = lazy(() => import('./pages/admin/ExerciseLibrary'));
const AdminLessons = lazy(() => import('./pages/admin/AdminLessons'));
const AdminAcademy = lazy(() => import('./pages/admin/AdminAcademy'));
const AdminAthleteDetail = lazy(() => import('./pages/admin/AdminAthleteDetail'));


// Gamification Overlays (lazy — not needed on first paint)
const RewardAnimation = lazy(() => import('./components/gamification/RewardAnimation'));
const LeaguePopup = lazy(() => import('./components/gamification/LeaguePopup'));

/* ── Minimal loading spinner ── */
const PageLoader = () => (
    <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '60vh', color: 'var(--text-muted)', fontSize: '0.85rem',
        fontFamily: 'Outfit, sans-serif',
    }}>
        <div style={{
            width: '24px', height: '24px',
            border: '2px solid rgba(255,255,255,0.1)',
            borderTopColor: 'var(--accent-gold, #d4a853)',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
        }} />
    </div>
);

/* ── Global Overlays (inside AppProvider context) ── */
function GamificationOverlays() {
  const { rewardPopup } = useAppContext();
  if (!FEATURE_FLAGS.REWARDS) return null;

  return (
    <Suspense fallback={null}>
      {rewardPopup && <RewardAnimation xp={rewardPopup.xp} points={rewardPopup.points} />}
      <LeaguePopup />
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <BrowserRouter>
            <GamificationOverlays />

            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Auth Routes */}
                <Route path="/auth" element={<AuthPage />} />

                {/* User Portal */}
                <Route element={<UserLayout />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />

                  <Route element={<UserProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
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
                    <Route path="/admin/lessons" element={<AdminLessons />} />
                    <Route path="/admin/chat" element={<AdminChat />} />
                    <Route path="/admin/academy" element={<AdminAcademy />} />
                    <Route path="/admin/athlete/:athleteId" element={<AdminAthleteDetail />} />

                    <Route path="/admin/settings" element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
            <Analytics />
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
