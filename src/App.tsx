import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from '@/components/auth/AuthProvider';
import SuperAdmin from '@/pages/SuperAdmin';
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import PrivateRoute from "@/components/auth/PrivateRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import AcceptedProjects from "./pages/AcceptedProjects";
import ProjectDetails from "./pages/ProjectDetails";
import Offers from "./pages/Offers";
import Messages from "./pages/Messages";
import Finances from "./pages/Finances";
import Categories from "./pages/Categories";
import Freelancers from "./pages/Freelancers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/superadmin" element={<SuperAdmin />} />
                <Route path="/projects" element={<Projects />} />F
                <Route path="/projects/:projectId" element={<ProjectDetails />} />
                <Route path="/accepted-projects" element={<AcceptedProjects />} />
                <Route path="/offers" element={<Offers />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/finances" element={<Finances />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/freelancers" element={<Freelancers />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
