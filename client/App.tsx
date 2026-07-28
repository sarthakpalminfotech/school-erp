import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

import { AppStateProvider } from "@/hooks/useAppState";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppStateProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/masters" element={<Index />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/orders" element={<Index />} />
            <Route path="/customers" element={<Index />} />
            <Route path="/service" element={<Index />} />
            <Route path="/complaints" element={<Index />} />
            <Route path="/inventory" element={<Index />} />
            <Route path="/ledger" element={<Index />} />
            <Route path="/visits" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppStateProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
