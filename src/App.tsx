import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { FocusModeProvider } from "./contexts/FocusModeContext";
import AuthPage from "./pages/AuthPage";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import PracticePage from "./pages/PracticePage";
import HistoryPage from "./pages/HistoryPage";
import SetlistPage from "./pages/SetlistPage";
import ScalesPage from "./pages/ScalesPage";
import HarmoniesPage from "./pages/HarmoniesPage";
import MelodiesPage from "./pages/MelodiesPage";
import RhythmsPage from "./pages/RhythmsPage";
import ExercisesPage from "./pages/ExercisesPage";
import MetronomePage from "./pages/MetronomePage";
import StatsPage from "./pages/StatsPage";
import NotFound from "./pages/NotFound";
import { DataMigrationProvider } from "./components/DataMigrationProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider delayDuration={300}>
        <FocusModeProvider>
          <BrowserRouter>
            <DataMigrationProvider>
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/practice" element={<PracticePage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/setlist" element={<SetlistPage />} />
                  <Route path="/scales" element={<ScalesPage />} />
                  <Route path="/harmonies" element={<HarmoniesPage />} />
                  <Route path="/melodies" element={<MelodiesPage />} />
                  <Route path="/rhythms" element={<RhythmsPage />} />
                  <Route path="/exercises" element={<ExercisesPage />} />
                  <Route path="/metronome" element={<MetronomePage />} />
                  <Route path="/stats" element={<StatsPage />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </DataMigrationProvider>
          </BrowserRouter>
          <Sonner
            position="bottom-right"
            toastOptions={{ duration: 3000 }}
          />
        </FocusModeProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
