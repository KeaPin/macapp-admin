import { SidebarProvider } from "./SidebarContext";
import ImprovedSidebar from "./ImprovedSidebar";
import Header from "./Header";
import KeyboardShortcuts from "./KeyboardShortcuts";
import { AuthProvider, AuthGuard } from "@/components/AuthGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>
        <SidebarProvider>
          <div className="admin-layout fixed inset-0 bg-zinc-950 text-white">
            <div className="flex h-full">
              {/* Sidebar */}
              <ImprovedSidebar />

              {/* Main content area */}
              <div className="flex flex-1 flex-col min-w-0 h-full">
                {/* Header */}
                <Header />

                {/* Page content */}
                <main className="flex-1 overflow-auto" id="main-content">
                  <div className="py-6 px-4 sm:px-6 lg:px-8">{children}</div>
                </main>
              </div>
            </div>

            {/* Keyboard shortcuts handler */}
            <KeyboardShortcuts />

            {/* Skip to main content link for screen readers */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              跳转到主内容
            </a>

            {/* Live region for screen reader announcements */}
            <div
              id="live-region"
              aria-live="polite"
              aria-atomic="true"
              className="sr-only"
            />
          </div>
        </SidebarProvider>
      </AuthGuard>
    </AuthProvider>
  );
}


