import { Outlet } from "react-router-dom";
import TopNav from "@/components/ally/TopNav";
import { ChatViewProvider } from "@/context/ChatViewContext";

export function MainLayout() {
  return (
    <ChatViewProvider>
      <div className="h-[100dvh] flex flex-col bg-[#F7F4EF] overflow-hidden isolate">
        <TopNav />
        <main className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
          <Outlet />
        </main>
      </div>
    </ChatViewProvider>
  );
}