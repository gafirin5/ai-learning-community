"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Reveal gaya "tinta tertulis": konten terungkap kiri→kanan (clip-path)
 * dengan sedikit naik, seperti baris register yang baru selesai ditulis.
 * IntersectionObserver, hanya sekali. Reduced motion → langsung tampak.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`${className} transition-[clip-path,opacity,transform] duration-500 ease-out`}
      style={{
        transitionDelay: delay ? `${delay}ms` : undefined,
        clipPath: visible ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
      }}
    >
      {children}
    </Tag>
  );
}
