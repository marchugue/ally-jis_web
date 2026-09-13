import { Outlet } from "react-router-dom";
import TopNav from "@/components/ally/TopNav";
import { ChatViewProvider } from "@/context/ChatViewContext";

export function MainLayout() {
  return (
    <ChatViewProvider>
      <div className="h-[100dvh] flex flex-col bg-[#F7F4EF] dark:bg-[#121212] text-gray-900 dark:text-[#EDEDED] overflow-hidden isolate transition-colors duration-200">
        <TopNav />
        <main className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
          <Outlet />
        </main>
      </div>
    </ChatViewProvider>
  );
}