import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";

const navItems = ["Home", "About", "Features", "Contact"];

const SCROLL_THRESHOLD_PX = 80;

const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "hi", label: "हिंदी" },
] as const;

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [language, setLanguage] = useState<(typeof LANGUAGES)[number]>(LANGUAGES[0]);
  const [navbarVisible, setNavbarVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const location = useLocation();

  const isLanding = location.pathname === "/" || location.pathname === "/landing";

  // On landing page: show navbar only after user scrolls down a bit
  // Also compute scroll progress (0–1) for the tricolour progress line
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const doc = document.documentElement;
      const maxScroll = (doc.scrollHeight || 0) - (window.innerHeight || 0) || 1;
      const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);

      if (isLanding) {
        setNavbarVisible(scrollY > SCROLL_THRESHOLD_PX);
      } else {
        setNavbarVisible(true);
      }
      setScrollProgress(progress);
    };

    handleScroll(); // set initial state
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLanding]);

  return (
    <AnimatePresence mode="wait">
      {navbarVisible && (
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-0 left-0 right-0 z-50 glass-card rounded-none border-x-0 border-t-0"
        >
          {/* Tricolour scroll progress bar */}
          <div className="h-1 w-full bg-transparent overflow-hidden">
            <div
              className="h-full rounded-r-full"
              style={{
                width: "100%",
                transform: `scaleX(${scrollProgress})`,
                transformOrigin: "left",
                backgroundImage:
                  "linear-gradient(to right, #FF9933 0%, #FFFFFF 50%, #138808 100%)",
                transition: "transform 0.25s ease-out",
                willChange: "transform",
              }}
            />
          </div>

          <div className="container mx-auto flex items-center justify-between px-6 py-3">
            {/* Logos - Government of India + Digital India */}
            <Link to="/" className="flex items-center gap-4">
              <img
                src="/Government_Of_India.png"
                alt="Government of India"
                className="h-10 w-auto object-contain"
              />
              <img
                src="/Digital_India.png"
                alt="Digital India"
                className="h-10 w-auto object-contain"
              />
            </Link>

            {/* Desktop nav + language */}
            <div className="hidden md:flex items-center gap-8">
              <nav className="flex items-center gap-8">
                {navItems.map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-secondary after:transition-all after:duration-300 hover:after:w-full"
                  >
                    {item}
                  </a>
                ))}
              </nav>

              {/* Language selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLangOpen((o) => !o)}
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  aria-expanded={langOpen}
                  aria-haspopup="listbox"
                  aria-label="Select language"
                >
                  <span>{language.label}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${langOpen ? "rotate-180" : ""}`} />
                </button>
                {langOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      aria-hidden
                      onClick={() => setLangOpen(false)}
                    />
                    <ul
                      role="listbox"
                      className="absolute right-0 top-full mt-2 py-1 min-w-[140px] rounded-lg bg-card border border-border shadow-lg z-50"
                    >
                      {LANGUAGES.map((lang) => (
                        <li key={lang.id} role="option" aria-selected={language.id === lang.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setLanguage(lang);
                              setLangOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                              language.id === lang.id
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            {lang.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>

            {/* Mobile: menu button (language can go in mobile menu) */}
            <div className="md:hidden flex items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLangOpen((o) => !o)}
                  className="flex items-center gap-1 text-sm font-medium text-foreground"
                >
                  <span>{language.label}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {langOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                    <ul className="absolute right-0 top-full mt-2 py-1 min-w-[120px] rounded-lg bg-card border border-border shadow-lg z-50">
                      {LANGUAGES.map((lang) => (
                        <li key={lang.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setLanguage(lang);
                              setLangOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted"
                          >
                            {lang.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="text-foreground p-1"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass-card rounded-none border-x-0 px-6 pb-4"
            >
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {item}
                </a>
              ))}
            </motion.nav>
          )}
        </motion.header>
      )}
    </AnimatePresence>
  );
};

export default Navbar;
