import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const SPRING = { stiffness: 200, damping: 22, mass: 0.6 };

/**
 * Mouse-tracked 3D tilt wrapper (CSS transforms via Framer Motion — no
 * WebGL). Used for event cards, stat cards, and other "floating" surfaces
 * across the app to give the UI a tactile, depth-forward feel.
 */
export default function TiltCard({ children, className = '', tiltStrength = 8, ...props }) {
  const ref = useRef(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(y, [0, 1], [tiltStrength, -tiltStrength]), SPRING);
  const rotateY = useSpring(useTransform(x, [0, 1], [-tiltStrength, tiltStrength]), SPRING);
  const scale = useSpring(1, SPRING);

  function handleMouseMove(e) {
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  }

  function handleMouseEnter() {
    scale.set(1.015);
  }

  function handleMouseLeave() {
    x.set(0.5);
    y.set(0.5);
    scale.set(1);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, scale, transformPerspective: 900 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
