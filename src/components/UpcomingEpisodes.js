'use client';

/*
 * Copyright 2026 Otrobonita AI Labs (Jesper Karlsson)
 * Licensed under the Apache License, Version 2.0 (the "License");
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Cpu, ShoppingBag, BookOpen, Users, Workflow, Globe, ChevronLeft, ChevronRight } from 'lucide-react';

const CARD_W = 180; // Adjusted for 3:4 aspect ratio (180:240)
const CARD_H = 240; // Adjusted for 3:4 aspect ratio (180:240)
const OFFSET_X = 130; // Spacing adjusted for 180px card width
const ARC_Y = 22;
const ROTATION = 13;

const EPISODES = [
  {
    id: 'brain',
    title: 'EP01: AGENTIC MEMORY',
    desc: 'Mark\'s digital mind — a vector vault where his books, letters, and arguments are indexed. Not a database the system reads from, but a memory the system thinks with.',
    image: '/images/carousel/Marks-Brain.webp',
    Icon: Cpu,
  },
  {
    id: 'ep1',
    title: 'EP02: VENDOR-NEUTRAL',
    desc: 'The brain plugs in; it is not built in. Swap one LLM for another — OpenAI today, Anthropic tomorrow, something local next year — without rewriting the system or losing Mark\'s identity.',
    image: '/images/carousel/vendor-neutral.webp',
    Icon: Cpu,
  },
  {
    id: 'ep2',
    title: 'EP03: SECURE DATA VAULT',
    desc: 'Mark\'s public voice and his private vault are kept apart by design. The agent can reason about secrets without ever speaking them aloud.',
    image: '/images/carousel/security.webp',
    Icon: ShoppingBag,
  },
  {
    id: 'ep3',
    title: 'EP04: TRUST & TRANSPARENCY',
    desc: 'Every line of code, every prompt, every weight — open under Apache 2.0. When the machine thinks, you can read its blueprints.',
    image: '/images/carousel/trust.webp',
    Icon: BookOpen,
  },
  {
    id: 'ep4',
    title: 'EP05: AI GOVERNANCE',
    desc: 'Guardrails written into the foundation, not bolted on after. Mark may be witty, but he will not lie, manipulate, or sell what isn\'t his to sell.',
    image: '/images/carousel/governance.webp',
    Icon: Users,
  },
  {
    id: 'ep5',
    title: 'EP06: API-FIRST',
    desc: 'One brain, many channels. Mark speaks the same way through MCP, CLI, the web, or future tools yet to be invented — from a single source of truth.',
    image: '/images/carousel/API-First.webp',
    Icon: Workflow,
  },
  {
    id: 'ep6',
    title: 'EP07: CI/CD FOR AGENTS',
    desc: 'Every new skill is tested before it reaches Mark. The architect knows that an agent who learns in production is an agent who fails in production.',
    image: '/images/carousel/CI-CD-for-Agents.webp',
    Icon: Globe,
  }
];

export default function UpcomingEpisodes() {
  const [{ active, prevActive }, setActiveState] = useState({ active: 0, prevActive: 0 });

  const setActive = (newActive) => {
    setActiveState((prev) => ({ active: newActive, prevActive: prev.active }));
  };

  return (
    <div className="upcoming-episodes-section">
      <div className="carousel-container-relative" style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '30px' }}>
        <button 
          className="carousel-control-btn prev"
          onClick={() => setActive((active - 1 + EPISODES.length) % EPISODES.length)}
          aria-label="Previous episode"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="carousel-viewport" style={{ height: CARD_H + 20, width: '100%', position: 'relative' }}>
          {EPISODES.map((item, i) => {
            const n = EPISODES.length;
            
            // Current calculation
            const rawDiff = ((i - active) % n + n) % n;
            const diff = rawDiff > Math.floor(n / 2) ? rawDiff - n : rawDiff;
            const abs = Math.abs(diff);
            
            // Previous calculation
            const rawPrevDiff = ((i - prevActive) % n + n) % n;
            const prevDiff = rawPrevDiff > Math.floor(n / 2) ? rawPrevDiff - n : rawPrevDiff;

            // If the diff jumps by more than 1 (i.e. wrapping around the boundary), disable animation
            const isWrapping = Math.abs(diff - prevDiff) > 1;

            const isActive = i === active;
            const transitionConfig = isWrapping
              ? { type: 'tween', duration: 0 }
              : { type: 'spring', stiffness: 280, damping: 28 };

            return (
              <motion.div
                key={item.id}
                initial={false}
                animate={{
                  x: diff * OFFSET_X,
                  y: abs * abs * ARC_Y,
                  rotate: diff * ROTATION,
                  scale: Math.max(0.68, 1 - abs * 0.11),
                  opacity: abs >= 3 ? 0 : 1, // Hide wrapping cards (keeps 5 visible in picture)
                }}
                transition={transitionConfig}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  marginLeft: -(CARD_W / 2),
                  width: CARD_W,
                  zIndex: 20 - abs,
                  transformOrigin: '50% 100%',
                }}
                className={isActive ? 'carousel-card-wrapper active' : 'carousel-card-wrapper cursor-pointer'}
                onClick={() => !isActive && setActive(i)}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(event, info) => {
                  const swipeThreshold = 50;
                  if (info.offset.x < -swipeThreshold) {
                    setActive((active + 1) % EPISODES.length);
                  } else if (info.offset.x > swipeThreshold) {
                    setActive((active - 1 + EPISODES.length) % EPISODES.length);
                  }
                }}
              >
                <div
                  className="carousel-card-inner"
                  style={{ width: CARD_W, height: CARD_H }}
                >
                  {/* Background image or gradient */}
                  {item.image ? (
                    <div 
                      className="carousel-card-bg image-bg" 
                      style={{ 
                        backgroundImage: `url(${item.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'absolute',
                        inset: 0,
                      }}
                    />
                  ) : (
                    <div 
                      className="carousel-card-bg" 
                      style={{ 
                        background: item.gradient,
                        position: 'absolute',
                        inset: 0,
                      }}
                    />
                  )}

                  {/* Active Card Text Info */}
                  {isActive && (
                    <motion.div
                      key={`info-${item.id}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="carousel-card-info"
                      style={{ height: CARD_H * 0.38 }}
                    >
                      <p className="carousel-card-title typewriter">
                        {item.title}
                      </p>
                      <p className="carousel-card-desc typewriter">
                        {item.desc}
                      </p>
                    </motion.div>
                  )}

                  {/* Inactive Card Text Overlay */}
                  {!isActive && (
                    <div className="carousel-card-inactive-overlay">
                      <p className="carousel-card-inactive-title typewriter">
                        {item.title}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <button 
          className="carousel-control-btn next"
          onClick={() => setActive((active + 1) % EPISODES.length)}
          aria-label="Next episode"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="carousel-dots">
        {EPISODES.map((_, idx) => (
          <button
            key={idx}
            className={`carousel-dot ${idx === active ? 'active' : ''}`}
            onClick={() => setActive(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
