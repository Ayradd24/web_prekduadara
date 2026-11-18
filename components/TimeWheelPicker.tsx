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
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const dragStartYRef = useRef(0);
  const dragAccumRef = useRef(0);
  const didDragRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const isHoveringRef = useRef(false);
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

  // Native non-passive wheel listener supaya scroll mouse ubah angka tanpa menggulir halaman
  useEffect(() => {
    const el = overlayRef.current;
    if (!el || !isOpen) return;

    let wheelAccum = 0;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      wheelAccum += e.deltaY;
      const threshold = 24;
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

  // Tutup saat klik di luar (berguna untuk perangkat sentuh / fokus keyboard)
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
    // Hanya tombol mouse kiri / sentuhan
    if (e.pointerType === "mouse" && e.button !== 0) return;
    setIsOpen(true);
    setIsDragging(true);
    didDragRef.current = false;
    pointerIdRef.current = e.pointerId;
    dragStartYRef.current = e.clientY;
    dragAccumRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dy = e.clientY - dragStartYRef.current;
    if (!didDragRef.current && Math.abs(dy) > 5) {
      didDragRef.current = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Abaikan jika gagal capture
      }
    }
    if (!didDragRef.current) return;
    const delta = dy - dragAccumRef.current;
    const stepPx = 18;
    if (Math.abs(delta) >= stepPx) {
      const steps = Math.trunc(delta / stepPx);
      dragAccumRef.current += steps * stepPx;
      // Geser ke atas (dy negatif) -> angka naik (+1), geser ke bawah -> angka turun (-1)
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
      // Abaikan jika pointer sudah dilepas
    }
    if (!isHoveringRef.current && e.pointerType === "mouse") {
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      stepBy(-1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      stepBy(1);
    } else if (e.key === "Escape") {
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
      }, 900);
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
      onMouseEnter={() => {
        isHoveringRef.current = true;
        setIsOpen(true);
      }}
      onMouseLeave={() => {
        isHoveringRef.current = false;
        if (!isDragging) setIsOpen(false);
      }}
      onFocus={() => setIsOpen(true)}
      onBlur={() => {
        if (!isDragging) setIsOpen(false);
      }}
      onKeyDown={handleKeyDown}
      className="relative inline-flex items-center justify-center outline-none select-none"
    >
      {/* Tampilan Angka Default (Compact, tanpa layout shift) */}
      <span
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center justify-center rounded-lg font-black tabular-nums transition-colors cursor-ns-resize ${
          compact ? "w-8 py-0.5 text-xs" : "w-9 py-1 text-sm"
        } ${
          isOpen
            ? "text-[#EA8E18] bg-amber-50"
            : "text-gray-900 hover:bg-amber-50/70 hover:text-[#EA8E18]"
        }`}
      >
        {pad2(value)}
      </span>

      {/* Floating Wheel Slider (Muncul di atas & bawah angka saat hover / fokus) */}
      {isOpen && (
        <div
          ref={overlayRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-50 ${
            compact ? "w-[56px]" : "w-[64px]"
          } rounded-2xl bg-white border-2 border-[#EA8E18] shadow-[0_12px_28px_-6px_rgba(0,0,0,0.22)] py-1.5 px-1 flex flex-col items-center select-none touch-none cursor-ns-resize animate-in fade-in zoom-in-95 duration-100`}
        >
          {/* Label kecil Jam / Menit */}
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-700/80 mb-0.5 pointer-events-none">
            {label}
          </span>

          {/* Angka Sebelumnya (Atas - redup, bisa diklik -1) */}
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              if (!didDragRef.current) stepBy(-1);
            }}
            className={`w-full py-1 rounded-lg text-center font-bold tabular-nums text-gray-400/75 hover:text-gray-700 hover:bg-gray-100/80 transition cursor-pointer ${
              compact ? "text-xs" : "text-sm"
            }`}
            title={`Kurangi ${label.toLowerCase()}`}
          >
            {pad2(prevVal)}
          </button>

          {/* Angka Terpilih (Tengah - tegas & disorot) */}
          <div
            className={`w-full py-1 my-0.5 rounded-lg bg-amber-50 border border-amber-300/90 text-center font-black tabular-nums text-gray-950 shadow-2xs pointer-events-none ${
              compact ? "text-sm" : "text-base"
            }`}
          >
            {pad2(value)}
          </div>

          {/* Angka Berikutnya (Bawah - redup, bisa diklik +1) */}
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              if (!didDragRef.current) stepBy(1);
            }}
            className={`w-full py-1 rounded-lg text-center font-bold tabular-nums text-gray-400/75 hover:text-gray-700 hover:bg-gray-100/80 transition cursor-pointer ${
              compact ? "text-xs" : "text-sm"
            }`}
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
      className={`w-full flex items-center justify-center gap-1 rounded-xl border bg-white transition-all ${
        compact ? "px-2 py-1.5" : "px-3 py-2"
      } ${
        active
          ? "border-[#EA8E18] ring-1 ring-[#EA8E18]/30"
          : "border-gray-300 hover:border-[#EA8E18]/70"
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
        className={`font-black text-gray-500 select-none ${
          compact ? "text-xs" : "text-sm"
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
        <span className="ml-1 px-1.5 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-[10px] font-extrabold text-gray-600 select-none">
          {suffix}
        </span>
      )}
    </div>
  );
}
