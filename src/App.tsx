import { BrowserRouter, Routes, Route } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DateRangeProvider } from "./context/DateRangeContext";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import AccountDetail from "./pages/AccountDetail";
import Transactions from "./pages/Transactions";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DateRangeProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-[var(--color-surface-0)] font-body text-[var(--color-text-primary)]">
            <Sidebar />
            <div className="pl-60">
              <TopBar />
              <main className="p-8">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/accounts" element={<Accounts />} />
                  <Route path="/accounts/:name" element={<AccountDetail />} />
                  <Route path="/transactions" element={<Transactions />} />
                </Routes>
              </main>
            </div>
          </div>
        </BrowserRouter>
      </DateRangeProvider>
    </QueryClientProvider>
  );
}
