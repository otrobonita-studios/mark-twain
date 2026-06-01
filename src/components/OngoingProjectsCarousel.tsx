'use client';

import { motion } from 'framer-motion';

type Project = {
  id: number;
  title: string;
  description: string;
};

const projects: Project[] = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  title: `Project ${i + 1}`,
  description: `Description for project ${i + 1}`,
}));

export default function OngoingProjectsCarousel() {
  return (
    <section className="glass-bg p-4 rounded-lg">
      <h3 className="text-xl font-semibold mb-2">Ongoing Modernization Projects</h3>
      <div className="flex gap-4 overflow-x-auto">
        {projects.map((p) => (
          <motion.div
            key={p.id}
            className="glass-card min-w-[200px] flex-shrink-0 p-3"
            whileHover={{ scale: 1.03 }}
          >
            <h4 className="font-medium mb-1">{p.title}</h4>
            <p className="text-sm">{p.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
