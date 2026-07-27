"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface CardTiltProps {
  children: React.ReactNode;
  className?: string;
  maxRotate?: number; // Maximum rotation in degrees
}

/**
 * CardTilt component adds a premium interactive 3D tilt effect on hover.
 * Uses hardware-accelerated transforms and smooth spring dampening.
 */
export default function CardTilt({
  children,
  className = "",
  maxRotate = 12,
}: CardTiltProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse positions normalized from -0.5 (left/top) to 0.5 (right/bottom)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Map to rotations with smooth spring settings
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [maxRotate, -maxRotate]), {
    damping: 20,
    stiffness: 200,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-maxRotate, maxRotate]), {
    damping: 20,
    stiffness: 200,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Calculate cursor distance from the center of the card
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;

    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      className={`relative ${className}`}
    >
      <div
        style={{
          transform: isHovered ? "translateZ(16px)" : "translateZ(0px)",
          transformStyle: "preserve-3d",
          transition: "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)",
        }}
        className="h-full w-full"
      >
        {children}
      </div>
    </motion.div>
  );
}
