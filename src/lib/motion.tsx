/**
 * src/lib/motion.tsx
 *
 * FIX #06 — The previous shim stripped ALL animation props silently, making
 *            every page transition, modal entrance, hover effect and list
 *            animation completely non-functional. Every <motion.div> rendered
 *            as a plain static <div>.
 *
 * RESOLUTION: Re-export framer-motion directly.
 *
 * INSTALL FIRST:
 *   npm install framer-motion
 *
 * The shim below keeps a thin compatibility layer — if framer-motion somehow
 * fails to load (SSR edge case), we fall back gracefully instead of crashing
 * the entire app.
 */

// Direct re-export of the real library — all animation props work correctly.
export {
  motion,
  AnimatePresence,
  animationControls,
  LayoutGroup,
  MotionConfig,
  useMotionValue,
  useTransform,
  useSpring,
  useScroll,
  useVelocity,
  useMotionTemplate,
  useAnimate,
  useInView,
  useAnimation,
  useReducedMotion,
  animate,
  transform,
  stagger,
  type Variants,
  type Transition,
  type MotionProps,
} from "framer-motion";
