"use client";

import { motion } from "framer-motion";

interface BlurRevealProps {
  text: string;
  className?: string;
  /** delay before animation starts (seconds) */
  delay?: number;
}

/**
 * Splits text into words and reveals each word with a blur+translateY
 * animation, staggered for a premium editorial feel.
 */
export default function BlurReveal({ text, className = "", delay = 0 }: BlurRevealProps) {
  const words = text.split(" ");

  const container = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.07,
        delayChildren: delay,
      },
    },
  };

  const wordVariant = {
    hidden: {
      opacity: 0,
      y: 20,
      filter: "blur(8px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <motion.span
      variants={container}
      initial="hidden"
      animate="visible"
      className={`inline-flex flex-wrap gap-x-[0.22em] ${className}`}
    >
      {words.map((word, i) => (
        <motion.span key={i} variants={wordVariant} className="inline-block">
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}
