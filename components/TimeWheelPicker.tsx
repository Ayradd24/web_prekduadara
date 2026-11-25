"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

interface TimeWheelPickerProps {
  value: string;
  onChange: (nextValue: string) => void;
  suffix?: string;
  active?: boolean;
  compact?: boolean;
  ariaLabel?: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function parseTimeValue(val: string): { hour: number; minute: number } {
  const match = (val || "").match(/(\d{1,2})\s*[:.]\s*(\d{2})/);
  if (!match) return { hour: 9, minute: 0 };
  const h = Math.min(23, Math.max(0, parseInt(match[1], 10) || 0));
  const m = Math.min(59, Math.max(0, parseInt(match[2], 10) || 0));
  return { hour: h, minute: m };
}

function wrapValue(val: number, max: number): number {
  return ((val % max) + max) % max;
}

interface WheelUnitProps {
  label: string;
  value: number;
  max: number;
  compact?: boolean;
  onChange: (next: number) => void;
}

function WheelUnit({ label, value, max, compact, onChange }: WheelUnitProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  }, [value, onChange]);

  const dragStartYRef = useRef(0);
  const dragAccumRef = useRef(0);
  const didDragRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const digitBufferRef = useRef<{ digits: string; timer: ReturnType<typeof setTimeout> | null }>({
    digits: "",
    timer: null,
  });

  const stepBy = useCallback(
    (delta: number) => {
      onChangeRef.current(wrapValue(valueRef.current + delta, max));
    },
    [max]
  );

  // Scroll mouse untuk memutar angka saat slider aktif
  useEffect(() => {
    const el = overlayRef.current;
    if (!el || !isOpen) return;

    let wheelAccum = 0;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      wheelAccum += e.deltaY;
      const threshold = 18;
      if (Math.abs(wheelAccum) >= threshold) {
        const steps = Math.trunc(wheelAccum / threshold);
        wheelAccum -= steps * threshold;
        if (steps !== 0) {
          stepBy(steps > 0 ? 1 : -1);
        }
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [isOpen, stepBy]);

  // Tutup slider saat klik di luar kotak
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [isOpen]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    setIsDragging(true);
    didDragRef.current = false;
    pointerIdRef.current = e.pointerId;
    dragStartYRef.current = e.clientY;
    dragAccumRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dy = e.clientY - dragStartYRef.current;
    if (!didDragRef.current && Math.abs(dy) > 4) {
      didDragRef.current = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Abaikan jika capture gagal
      }
    }
    if (!didDragRef.current) return;
    const delta = dy - dragAccumRef.current;
    const stepPx = 14;
    if (Math.abs(delta) >= stepPx) {
      const steps = Math.trunc(delta / stepPx);
      dragAccumRef.current += steps * stepPx;
      // Geser ke atas -> tambah angka (+1), geser ke bawah -> kurangi (-1)
      stepBy(-steps);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    pointerIdRef.current = null;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Abaikan
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      stepBy(-1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      stepBy(1);
    } else if (e.key === "Escape" || e.key === "Enter") {
      setIsOpen(false);
    } else if (/^\d$/.test(e.key)) {
      e.preventDefault();
      const buf = digitBufferRef.current;
      if (buf.timer) clearTimeout(buf.timer);
      const combined = (buf.digits + e.key).slice(-2);
      const parsed = parseInt(combined, 10);
      if (parsed < max) {
        buf.digits = combined;
        onChangeRef.current(parsed);
      } else {
        const single = parseInt(e.key, 10);
        buf.digits = e.key;
        if (single < max) onChangeRef.current(single);
      }
      buf.timer = setTimeout(() => {
        digitBufferRef.current.digits = "";
      }, 800);
    }
  };

  const prevVal = wrapValue(value - 1, max);
  const nextVal = wrapValue(value + 1, max);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="spinbutton"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max - 1}
      aria-valuenow={value}
      onKeyDown={handleKeyDown}
      className="relative inline-flex items-center justify-center outline-none select-none"
    >
      {/* Tampilan Angka Normal — Munculkan slider HANYA saat dipencet/diklik */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center justify-center rounded px-1 py-0.5 font-mono font-bold tabular-nums transition cursor-pointer leading-none ${
          compact ? "text-xs" : "text-xs sm:text-sm"
        } ${
          isOpen
            ? "text-[#EA8E18] bg-amber-100 ring-1 ring-[#EA8E18]"
            : "text-black hover:bg-amber-50 hover:text-[#EA8E18]"
        }`}
        title={`Klik untuk atur ${label.toLowerCase()}`}
      >
        {pad2(value)}
      </button>

      {/* Mini Floating Wheel Slider — Muncul saat dipencet */}
      {isOpen && (
        <div
          ref={overlayRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-50 ${
            compact ? "w-[38px]" : "w-[42px]"
          } rounded-xl bg-white border border-[#EA8E18] shadow-[0_8px_18px_-4px_rgba(0,0,0,0.24)] py-1 px-0.5 flex flex-col items-center select-none touch-none cursor-ns-resize`}
        >
          {/* Label mini */}
          <span className="text-[8px] font-semibold uppercase tracking-wider text-amber-700/80 leading-none mb-0.5 pointer-events-none">
            {label}
          </span>

          {/* Angka Atas (-1) */}
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              if (!didDragRef.current) stepBy(-1);
            }}
            className="w-full py-0.5 rounded text-center text-[10px] font-mono font-medium tabular-nums text-neutral-700 hover:text-black hover:bg-neutral-100 transition cursor-pointer leading-tight"
            title={`Kurangi ${label.toLowerCase()}`}
          >
            {pad2(prevVal)}
          </button>

          {/* Angka Tengah Terpilih (Klik lagi untuk tutup) */}
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              if (!didDragRef.current) setIsOpen(false);
            }}
            className={`w-full py-0.5 my-0.5 rounded-md bg-amber-50 border border-amber-300 text-center font-mono font-bold tabular-nums text-black leading-tight cursor-pointer ${
              compact ? "text-xs" : "text-[13px]"
            }`}
            title="Klik untuk selesai"
          >
            {pad2(value)}
          </button>

          {/* Angka Bawah (+1) */}
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              if (!didDragRef.current) stepBy(1);
            }}
            className="w-full py-0.5 rounded text-center text-[10px] font-mono font-medium tabular-nums text-neutral-700 hover:text-black hover:bg-neutral-100 transition cursor-pointer leading-tight"
            title={`Tambah ${label.toLowerCase()}`}
          >
            {pad2(nextVal)}
          </button>
        </div>
      )}
    </div>
  );
}

export default function TimeWheelPicker({
  value,
  onChange,
  suffix,
  active = false,
  compact = false,
  ariaLabel,
}: TimeWheelPickerProps) {
  const { hour, minute } = parseTimeValue(value);

  const emit = (nextHour: number, nextMinute: number) => {
    const formatted = `${pad2(nextHour)}:${pad2(nextMinute)}${
      suffix ? ` ${suffix}` : ""
    }`;
    onChange(formatted);
  };

  return (
    <div
      aria-label={ariaLabel}
      className={`w-full flex items-center justify-center gap-0 rounded-lg border bg-white transition-all ${
        compact ? "h-8 px-2" : "h-9 px-3"
      } ${
        active
          ? "border-[#EA8E18] ring-1 ring-[#EA8E18]/30"
          : "border-neutral-300 hover:border-[#EA8E18]/70"
      }`}
    >
      <WheelUnit
        label="Jam"
        value={hour}
        max={24}
        compact={compact}
        onChange={(nextH) => emit(nextH, minute)}
      />

      <span
        className={`font-mono font-bold text-neutral-700 select-none px-0.5 leading-none ${
          compact ? "text-xs" : "text-xs sm:text-sm"
        }`}
      >
        :
      </span>

      <WheelUnit
        label="Menit"
        value={minute}
        max={60}
        compact={compact}
        onChange={(nextM) => emit(hour, nextM)}
      />

      {suffix && (
        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-300 text-[10px] font-mono font-bold text-neutral-800 select-none whitespace-nowrap leading-none">
          {suffix}
        </span>
      )}
    </div>
  );
}
