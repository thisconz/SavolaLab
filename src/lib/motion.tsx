import React, { forwardRef, createContext, useContext } from "react";

/**
 * ZENTHAR MOTION SHIM (v2.0)
 * A high-fidelity mock engine for environments where Framer Motion 
 * is unavailable (SSR, Testing, or Lightweight Kernels).
 */

// 1. Hook Simulation: Prevent "hook not found" crashes
export const useMotionValue = (initial: any) => ({
  get: () => initial,
  set: (v: any) => {},
  onChange: () => () => {},
  on: () => () => {},
  clearListeners: () => {},
});

export const useTransform = (value: any, transformer: any) => value;
export const useSpring = (value: any, springConfig: { damping: number; stiffness: number; }) => value;
export const useScroll = () => ({ scrollY: useMotionValue(0), scrollX: useMotionValue(0) });
export const useTime = () => useMotionValue(0);
export const useVelocity = (value: any) => value;
export const useAcceleration = (value: any) => value;

// 2. Context Mocks
const VisualElementContext = createContext(null);
export const LayoutGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const MotionConfig: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

/**
 * 3. The Motion Proxy
 * Intercepts <motion.tag> and returns a sanitized React element.
 */
export const motion = new Proxy(
  {},
  {
    get: (_, tag: string) => {
      // Avoid intercepting React internals or Symbol lookups
      if (typeof tag !== "string" || tag === "none") return undefined;

      const Component = forwardRef((props: any, ref) => {
        const {
          // Motion-specific props to be purged
          initial, animate, exit, transition, variants,
          whileHover, whileTap, whileFocus, whileDrag, whileInView,
          layout, layoutId, onAnimationStart, onAnimationComplete,
          onUpdate, onPan, onTap, viewport, custom,
          // Native props to keep
          ...rest
        } = props;

        // Ensure we don't pass motion-only objects to standard HTML tags
        return React.createElement(tag, { ...rest, ref });
      });

      Component.displayName = `motion.${tag}`;
      return Component;
    },
  }
) as any;

/**
 * 4. AnimatePresence Logic
 * Mimics the 'wait' or 'popLayout' modes by simply rendering children.
 */
export const AnimatePresence: React.FC<{
  children: React.ReactNode;
  mode?: "sync" | "popLayout" | "wait";
  initial?: boolean;
}> = ({ children }) => {
  return <>{children}</>;
};

/**
 * 5. Utility Exports
 * Mocking transition creators so they don't return undefined.
 */
export const transform = (v: number) => v;
export const animate = () => ({ stop: () => {}, then: (cb: any) => cb() });

/**
 * Mock for useMotionTemplate
 * In a real environment, this joins MotionValues into a string.
 * Here, it handles the tagged template literal and returns a static string.
 */
export const useMotionTemplate = (
  fragments: TemplateStringsArray,
  ...values: any[]
): string => {
  // Join the static strings with the current value of each motion variable
  return fragments.reduce((acc, str, i) => {
    const value = values[i];
    // If it's a mock MotionValue, call .get(), otherwise use the raw value
    const resolvedValue = value && typeof value.get === 'function' ? value.get() : value;
    return acc + str + (resolvedValue ?? "");
  }, "");
};