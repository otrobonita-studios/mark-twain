'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, Home, MessageSquare, BookOpen, Layers, FileText, Eye } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Disable background scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Listen for custom trigger event from integrated header menus
  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    const handleClose = () => setIsOpen(false);
    window.addEventListener('toggle-global-nav', handleToggle);
    window.addEventListener('close-global-nav', handleClose);
    return () => {
      window.removeEventListener('toggle-global-nav', handleToggle);
      window.removeEventListener('close-global-nav', handleClose);
    };
  }, []);

  const links = [
    { href: '/', label: 'Let us Talk', icon: MessageSquare, desc: 'Interactive AI Dialogue' },
    { href: '/diary', label: 'My Diary', icon: BookOpen, desc: 'Extracts from my Diary' },
    { href: '/read/eves-diary', label: 'Eve\'s Diary', badge: 'Featured', icon: BookOpen, desc: 'Eve\'s Diary Multimedia Edition' },
    { href: '/complete-works', label: 'The Library', icon: Layers, desc: 'Books, Songs, Photos and Letters' },
    { href: '/about', label: 'About Me', icon: BookOpen, desc: 'Against My Better Judgment' }
  ];

  const isReaderPage = pathname?.startsWith('/read/');

  return (
    <>
      {/* Hamburger Trigger Button */}
      {(!isReaderPage || isOpen) && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`global-nav-trigger ${isOpen ? 'open' : ''}`}
          aria-label="Toggle Navigation Menu"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      {/* Navigation Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Glassmorphic Backdrop */}
            <motion.div
              className="global-nav-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer Container */}
            <motion.nav
              className="global-nav-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            >
              <div className="global-nav-header font-sans">
                <span className="text-[10px] uppercase tracking-widest text-[var(--primary)] font-semibold">
                  Navigation Desk
                </span>
                <div className="nav-decor-line" />
              </div>

              <ul className="global-nav-links">
                {links.map((link, idx) => {
                  const IconComponent = link.icon;
                  const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                  return (
                    <motion.li
                      key={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + idx * 0.05 }}
                    >
                      <Link
                        href={link.href}
                        className={`global-nav-link-item ${isActive ? 'active' : ''}`}
                      >
                        <div className="nav-link-icon-wrapper">
                          <IconComponent size={20} />
                        </div>
                        <div className="nav-link-text-wrapper">
                          {link.badge && (
                            <span className="text-[9px] uppercase tracking-widest text-[var(--primary)] font-semibold leading-none mb-1 opacity-90">
                              {link.badge}
                            </span>
                          )}
                          <span className="nav-link-label">{link.label}</span>
                          <span className="nav-link-desc">{link.desc}</span>
                        </div>
                        {isActive && <div className="nav-link-active-dot" />}
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>

              {/* Bottom Aligned Links: Marks Memory & Restorations */}
              <div className="global-nav-bottom-links flex flex-col gap-3 mt-4 mb-2">
                {/* Marks Memory */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + links.length * 0.05 }}
                >
                  <Link
                    href="/rebuild-process"
                    className={`global-nav-link-item ${pathname === '/rebuild-process' ? 'active' : ''}`}
                  >
                    <div className="nav-link-icon-wrapper">
                      <FileText size={20} />
                    </div>
                    <div className="nav-link-text-wrapper">
                      <span className="nav-link-label">Marks Memory</span>
                      <span className="nav-link-desc">Building Central Intelligence</span>
                    </div>
                    {pathname === '/rebuild-process' && <div className="nav-link-active-dot" />}
                  </Link>
                </motion.div>

                {/* Restorations */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + (links.length + 1) * 0.05 }}
                >
                  <Link
                    href="/restoration"
                    className={`global-nav-link-item ${pathname === '/restoration' ? 'active' : ''}`}
                  >
                    <div className="nav-link-icon-wrapper">
                      <Eye size={20} />
                    </div>
                    <div className="nav-link-text-wrapper">
                      <span className="nav-link-label">Restorations</span>
                      <span className="nav-link-desc">Following the Equator Images</span>
                    </div>
                    {pathname === '/restoration' && <div className="nav-link-active-dot" />}
                  </Link>
                </motion.div>
              </div>

              <div className="global-nav-footer font-sans">
                <p className="text-[9px] text-[var(--muted-foreground)]">
                  &copy;2026  Otrobonita AI Labs
                </p>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
