import React from "react";

/**
 * MOTION MOCK LAYER
 * Intercepts Framer Motion calls to prevent runtime crashes in 
 * non-animation environments.
 */

export const motion = new Proxy(
  {},
  {
    get: (_, tag: string) => {
      // Create a standard React component that passes through 
      // valid HTML props and refs, but strips motion props.
      return React.forwardRef(
        (
          {
            initial,
            animate,
            exit,
            transition,
            variants,
            whileHover,
            whileTap,
            layoutId,
            onAnimationStart,
            onAnimationComplete,
            ...props
          }: any,
          ref,
        ) => {
          // Effectively turns <motion.div animate={{ opacity: 1 }} /> 
          // into <div />
          return React.createElement(tag, { ...props, ref });
        },
      );
    },
  },
) as any;

/**
 * AnimatePresence Mock
 * In a real environment, this handles unmounting animations.
 * Here, it just acts as a transparent fragment provider.
 */
export const AnimatePresence: React.FC<{
  children: React.ReactNode;
  mode?: "sync" | "popLayout" | "wait";
  initial?: boolean;
  onExitComplete?: () => void;
}> = ({ children }) => {
  return <>{children}</>;
};

// Common LayoutGroup mock if your widgets use shared transitions
export const LayoutGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);