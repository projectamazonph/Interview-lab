"use client";

import type { Variants, Transition } from "framer-motion";

export const premiumTransition: Transition = {
  type: "spring",
  damping: 30,
  stiffness: 200,
  mass: 0.8,
};

export const premiumEase = "cubic-bezier(0.32, 0.72, 0, 1)";

export const springEase = "cubic-bezier(0.34, 1.56, 0.64, 1)";

/* ─── Scroll Entry: Fade Up ─── */
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] },
  },
};

/* ─── Stagger Container ─── */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/* ─── Card Hover (for magnetic feel) ─── */
export const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.01,
    y: -4,
    transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] },
  },
};

/* ─── Slide Up (for modals/overlays) ─── */
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.98,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ─── Scale In (for small elements) ─── */
export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
  },
};

/* ─── Nav Link Hover ─── */
export const navLinkVariants = {
  rest: { x: 0 },
  hover: { x: 4, transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] } },
};
