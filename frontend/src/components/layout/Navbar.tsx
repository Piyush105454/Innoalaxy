import { useState, useEffect } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";

export function Navbar() {
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const navLinks = [
    { label: "Solutions", href: "#solutions" },
    { label: "Past AI Platforms", href: "#past-work" },
    { label: "Industries", href: "#industries" },
    { label: "ROI", href: "#pricing" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100" : "bg-white"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white" />
          </div>
          <span className="font-['DM_Sans'] text-xl font-bold text-ink tracking-tight">
            Innoalaxy
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm font-medium text-slate-600 hover:text-ink transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDark((d) => !d)}
            className="p-2 rounded-lg text-slate-500 hover:text-ink hover:bg-slate-100 transition-all"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <a
            href="/audit"
            className="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
          >
            Get Started
          </a>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 space-y-3">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-medium text-slate-600 hover:text-ink py-2"
            >
              {l.label}
            </a>
          ))}
          <a
            href="/audit"
            className="block w-full text-center px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold"
          >
            Get Started
          </a>
        </div>
      )}
    </header>
  );
}
