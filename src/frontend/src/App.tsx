import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";

const queryClient = new QueryClient();

export default function App() {
  const [loggedIn, setLoggedIn] = useState<boolean>(
    () => !!localStorage.getItem("bppay_current_user"),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {loggedIn ? (
        <Dashboard onLogout={() => setLoggedIn(false)} />
      ) : (
        <LoginPage onLogin={() => setLoggedIn(true)} />
      )}
      <Toaster />
    </QueryClientProvider>
  );
}
