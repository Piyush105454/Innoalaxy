import { ReactNode } from "react";
import { UserButton, useUser } from "@clerk/clerk-react";

export function DashboardLayout({ children, activePath }: { children: ReactNode; activePath: "/dashboard" | "/audit" | "/admin" }) {
  const { user } = useUser();
  const isAdmin = user?.primaryEmailAddress?.emailAddress === "piyush.tamoli@innoalaxy.in";

  return (
    <div className="flex min-h-screen bg-slate-50 text-ink">
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-line bg-white p-5 md:flex">
        <a href="/" className="font-['DM_Sans'] text-xl font-bold">Innoalaxy</a>
        <nav className="mt-8 flex-1 space-y-2 text-sm">
          <a 
            className={`block rounded px-3 py-2 ${activePath === "/dashboard" ? "bg-slate-100 font-semibold" : "text-slate-600 hover:bg-slate-50"}`} 
            href="/dashboard"
          >
            Submissions
          </a>
          <a 
            className={`block rounded px-3 py-2 ${activePath === "/audit" ? "bg-slate-100 font-semibold" : "text-slate-600 hover:bg-slate-50"}`} 
            href="/audit"
          >
            Audit Flow
          </a>
          {isAdmin && (
            <a 
              className={`block rounded px-3 py-2 mt-4 ${activePath === "/admin" ? "bg-rose-50 text-rose-700 font-bold" : "text-slate-600 hover:bg-slate-50"}`} 
              href="/admin"
            >
              Admin Controls
            </a>
          )}
        </nav>
        <div className="mt-auto border-t border-line pt-4 flex items-center gap-3">
          <UserButton />
          <span className="text-sm font-medium text-slate-700">Account</span>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
