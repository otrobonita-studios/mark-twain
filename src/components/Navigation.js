'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, Home, MessageSquare, BookOpen, Layers } from 'lucide-react';
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

  const links = [
    { href: '/', label: 'Home', icon: Home, desc: 'Writing Desk & Journal' },
    { href: '/chat', label: 'Chat MkII', icon: MessageSquare, desc: 'Interactive AI Dialogue' },
    { href: '/read/eves-diary', label: 'Read & Listen', icon: BookOpen, desc: 'Eve\'s Diary Multimedia Edition' },
    { href: '/complete-works', label: 'In the Remake', icon: Layers, desc: 'Mark Twain\'s Complete Library' }
  ];

  return (
    <>
      {/* Hamburger Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`global-nav-trigger ${isOpen ? 'open' : ''}`}
        aria-label="Toggle Navigation Menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

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
              <div className="global-nav-header">
                <span className="typewriter text-[10px] uppercase tracking-widest text-[var(--primary)]">
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
                          <span className="nav-link-label">{link.label}</span>
                          <span className="nav-link-desc">{link.desc}</span>
                        </div>
                        {isActive && <div className="nav-link-active-dot" />}
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>

              <div className="global-nav-footer">
                <p className="typewriter text-[9px] text-[var(--muted-foreground)]">
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
