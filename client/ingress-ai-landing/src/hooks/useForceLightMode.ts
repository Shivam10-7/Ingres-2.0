import { useEffect } from "react";

/**
 * Forces light mode on the document while the component is mounted.
 * - Removes the `dark` class from <html> so Tailwind and CSS variables use light theme.
 * - Clears any inline body styles (e.g. set by Chat page) so landing/login use CSS light theme.
 * Use on landing and login pages so they are always shown in light mode.
 * The theme toggle (light/dark) should only apply to the chat window.
 */
export function useForceLightMode() {
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("dark");

    // Clear inline body styles that Chat page sets for dark mode so they don't persist
    const body = document.body;
    body.style.background = "";
    body.style.color = "";

    return () => {
      // Don't re-add dark on unmount; let the destination page control theme
    };
  }, []);
}
