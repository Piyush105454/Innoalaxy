import { useState, useEffect } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";

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
          {/* Pure SVG Custom Logo */}
          <div className="w-10 h-10 bg-ink rounded-lg flex items-center justify-center p-1.5 shadow-md shadow-gray-200">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              {/* Outer Boundary Arc */}
              <path d="M 50 5 A 45 45 0 1 1 5 50" stroke="white" strokeWidth="4" strokeLinecap="round" />
              
              {/* Central Hexagon */}
              <polygon points="50,30 65,40 65,60 50,70 35,60 35,40" stroke="white" strokeWidth="4" />
              
              {/* Stylized 'A' inside Hexagon */}
              <path d="M 42 60 L 50 42 L 58 60 M 46 54 L 54 54" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Network Nodes (Left side) */}
              <circle cx="20" cy="30" r="5" fill="white" />
              <line x1="25" y1="33" x2="35" y2="40" stroke="white" strokeWidth="3" />
              
              <circle cx="15" cy="50" r="6" fill="none" stroke="white" strokeWidth="3" />
              <line x1="21" y1="50" x2="35" y2="50" stroke="white" strokeWidth="3" />
              
              <circle cx="25" cy="75" r="5" fill="white" />
              <line x1="28" y1="71" x2="38" y2="60" stroke="white" strokeWidth="3" />
              
              {/* Network Nodes (Right side) */}
              <circle cx="80" cy="40" r="4" fill="none" stroke="white" strokeWidth="3" />
              <line x1="65" y1="45" x2="76" y2="42" stroke="white" strokeWidth="3" />
            </svg>
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
          
          <SignedOut>
            <SignInButton mode="modal" forceRedirectUrl="/dashboard">
              <button className="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm">
                Login
              </button>
            </SignInButton>
          </SignedOut>

          <a
            href="/audit"
            className="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
          >
            Get Started
          </a>
          
          <SignedIn>
            <div className="ml-2">
              <UserButton />
            </div>
          </SignedIn>

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
