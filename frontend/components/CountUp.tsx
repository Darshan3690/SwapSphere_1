"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

interface CountUpProps {
  to: number;
  suffix?: string;
  duration?: number;
  className?: string;
}

/**
 * Animated number counter that starts when the element scrolls into view.
 */
export default function CountUp({
  to,
  suffix = "",
  duration = 1.8,
  className = "",
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0,
  });

  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (inView) {
      motionValue.set(to);
    }
  }, [inView, motionValue, to]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      const rounded = Math.round(latest);
      setDisplay(
        rounded >= 1000
          ? (rounded / 1000).toFixed(rounded % 1000 === 0 ? 0 : 1) + "k"
          : String(rounded)
      );
    });
    return unsubscribe;
  }, [spring]);

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  );
}
