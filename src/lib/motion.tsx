import React from "react";

export const motion = new Proxy(
  {},
  {
    get: (_, tag) => {
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
            ...props
          }: any,
          ref,
        ) => {
          return React.createElement(tag as string, { ...props, ref });
        },
      );
    },
  },
) as any;

export const AnimatePresence: React.FC<{
  children: React.ReactNode;
  mode?: string;
}> = ({ children }) => {
  return <>{children}</>;
};
