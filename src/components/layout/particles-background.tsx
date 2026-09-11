"use client";

import { useEffect, useState } from "react";
import {
  Particles,
  ParticlesProvider,
  type ParticlesPluginRegistrar,
} from "@tsparticles/react";
import { loadAll } from "@tsparticles/all";
import type { ISourceOptions } from "@tsparticles/engine";

const initParticles: ParticlesPluginRegistrar = async (engine) => {
  await loadAll(engine);
};

// Basado en particlesjs-config.json del repo, ajustado al branding del taller:
// acento SierraTech (#2EDC1B), pocas partículas (18) para no penalizar el render.
const ASTRO_OPTIONS: ISourceOptions = {
  fullScreen: { enable: false },
  fpsLimit: 60,
  detectRetina: true,
  particles: {
    number: { value: 18, density: { enable: false } },
    color: { value: "#2EDC1B" },
    shape: {
      type: "polygon",
      options: { polygon: { sides: 4 } },
    },
    stroke: { width: 1, color: "#2EDC1B" },
    opacity: {
      value: 0.45,
      animation: { enable: true, speed: 1.2, minimumValue: 0.15, sync: false },
    },
    size: {
      value: { min: 1, max: 3 },
      animation: { enable: true, speed: 5, sync: false },
    },
    links: {
      enable: true,
      distance: 220,
      color: "#2EDC1B",
      opacity: 0.12,
      width: 1.5,
    },
    move: {
      enable: true,
      speed: 2.2,
      direction: "none",
      random: true,
      straight: false,
      outModes: { default: "out" },
    },
  },
  interactivity: {
    detect_on: "canvas",
    events: {
      onHover: { enable: false },
      onClick: { enable: false },
      resize: true,
    },
    modes: {
      grab: { distance: 220, links: { opacity: 0.3 } },
      push: { quantity: 2 },
    },
  },
};

export function ParticlesBackground() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const options: ISourceOptions = reducedMotion
    ? {
        ...ASTRO_OPTIONS,
        particles: {
          ...ASTRO_OPTIONS.particles,
          move: { enable: false },
        },
      }
    : ASTRO_OPTIONS;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none mix-blend-screen"
    >
      <ParticlesProvider init={initParticles}>
        <Particles id="particles-bg" className="h-full w-full" options={options} />
      </ParticlesProvider>
    </div>
  );
}