import { motion } from 'framer-motion';
import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.995,
  },
  in: {
    opacity: 1,
    scale: 1,
  },
  out: {
    opacity: 0,
    scale: 1.005,
  },
};

const pageTransition = {
  type: 'spring',
  stiffness: 380,
  damping: 30,
};

export function PageTransition({ children, className }: PageTransitionProps) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={cn("flex-1 flex flex-col h-full", className)}
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  );
}
