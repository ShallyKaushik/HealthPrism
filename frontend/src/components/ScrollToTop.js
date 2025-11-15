// frontend/src/components/ScrollToTop.js

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// This component is a "helper" that fixes the React Router scroll bug.
// It listens for any change in the page's URL (pathname).
// When it detects a change, it forces the window to scroll to (0, 0).
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to the top-left corner
    window.scrollTo(0, 0);
  }, [pathname]); // This effect runs every time the 'pathname' changes

  return null; // This component renders nothing, it just runs the effect
}

export default ScrollToTop;