/**
 * Thin re-export of framer-motion so import paths stay stable
 * if we ever swap to a lighter animation library.
 *
 * Only exports that actually exist in framer-motion v11 are listed here.
 * `animationControls` was removed — use `useAnimation()` instead.
 */
export {
  motion,
  AnimatePresence,
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
} from "framer-motion";

export type {
  Variants,
  Transition,
  MotionProps,
  AnimationControls,
} from "framer-motion";
