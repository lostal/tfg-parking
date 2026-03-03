/**
 * Tests de validateBookingDate
 *
 * Verifica la lógica compartida de validación de fecha de reserva usada
 * tanto por parking como por oficinas.
 */

import { describe, it, expect } from "vitest";
import { validateBookingDate } from "@/lib/booking-validation";

// ─── Helpers de fecha ─────────────────────────────────────────────────────────

/** Devuelve una fecha ISO "yyyy-MM-dd" (local) con offset en días respecto a hoy */
function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Devuelve el número de día de la semana para una fecha ISO (0=Dom, 6=Sáb) */
function dayOfWeek(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y!, m! - 1, d!).getDay();
}

/**
 * Busca la primera fecha con offset ≥ minOffset cuyo dayOfWeek esté en allowedDays.
 * Útil para encontrar un día laboral válido.
 */
function nextAllowedDay(allowedDays: number[], minOffset = 1): string {
  let offset = minOffset;
  while (offset < minOffset + 100) {
    const d = dateOffset(offset);
    if (allowedDays.includes(dayOfWeek(d))) return d;
    offset++;
  }
  throw new Error("No se encontró un día permitido en los próximos 100 días");
}

/**
 * Busca la primera fecha con offset ≥ minOffset cuyo dayOfWeek NO esté en allowedDays.
 * Útil para probar días de fin de semana/no laborables.
 */
function nextForbiddenDay(allowedDays: number[], minOffset = 1): string {
  let offset = minOffset;
  while (offset < minOffset + 100) {
    const d = dateOffset(offset);
    if (!allowedDays.includes(dayOfWeek(d))) return d;
    offset++;
  }
  throw new Error(
    "No se encontró un día no permitido en los próximos 100 días"
  );
}

// ─── Config de referencia ─────────────────────────────────────────────────────

const baseConfig = {
  allowed_days: [1, 2, 3, 4, 5], // Lun–Vie
  max_advance_days: 14 as number | null,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("validateBookingDate", () => {
  // ── Fechas pasadas ──────────────────────────────────────────────────────────
  // IMPORTANTE: validateBookingDate comprueba el día de la semana ANTES que la
  // fecha pasada. Por eso buscamos días pasados que estén en allowed_days.

  it("lanza error para un día laborable pasado reciente", () => {
    let pastAllowed: string | null = null;
    for (let i = 1; i <= 14; i++) {
      const d = dateOffset(-i);
      if (baseConfig.allowed_days.includes(dayOfWeek(d))) {
        pastAllowed = d;
        break;
      }
    }
    if (!pastAllowed) throw new Error("Sin día laborable pasado en 14 días");
    expect(() => validateBookingDate(pastAllowed!, baseConfig)).toThrow(
      "No puedes reservar para fechas pasadas"
    );
  });

  it("lanza error para un día laborable pasado lejano", () => {
    let pastAllowed: string | null = null;
    for (let i = 7; i <= 30; i++) {
      const d = dateOffset(-i);
      if (baseConfig.allowed_days.includes(dayOfWeek(d))) {
        pastAllowed = d;
        break;
      }
    }
    if (!pastAllowed) throw new Error("Sin día laborable pasado en 30 días");
    expect(() => validateBookingDate(pastAllowed!, baseConfig)).toThrow(
      "No puedes reservar para fechas pasadas"
    );
  });

  // ── Días de la semana ────────────────────────────────────────────────────────

  it("lanza error para día no permitido (fin de semana)", () => {
    const forbidden = nextForbiddenDay(baseConfig.allowed_days);
    expect(() => validateBookingDate(forbidden, baseConfig)).toThrow(
      "No se puede reservar en este día de la semana"
    );
  });

  it("no lanza error para día permitido próximo", () => {
    const allowed = nextAllowedDay(baseConfig.allowed_days);
    expect(() => validateBookingDate(allowed, baseConfig)).not.toThrow();
  });

  // ── Límite de antelación ──────────────────────────────────────────────────────

  it("lanza error si la fecha supera max_advance_days", () => {
    const tooFar = nextAllowedDay(
      baseConfig.allowed_days,
      baseConfig.max_advance_days! + 2
    );
    expect(() => validateBookingDate(tooFar, baseConfig)).toThrow(
      `Solo puedes reservar con un máximo de ${baseConfig.max_advance_days} días de antelación`
    );
  });

  it("no lanza error si la fecha está justo dentro de max_advance_days", () => {
    const justInside = nextAllowedDay(baseConfig.allowed_days, 1);
    expect(() => validateBookingDate(justInside, baseConfig)).not.toThrow();
  });

  it("no lanza error cuando max_advance_days es null (sin límite)", () => {
    const farFuture = nextAllowedDay(baseConfig.allowed_days, 100);
    expect(() =>
      validateBookingDate(farFuture, { ...baseConfig, max_advance_days: null })
    ).not.toThrow();
  });

  // ── Configuración de días permitidos personalizada ────────────────────────────

  it("respeta configuración con solo miércoles permitido (día 3)", () => {
    const wednesdayConfig = { ...baseConfig, allowed_days: [3] };
    const wednesday = nextAllowedDay([3]);
    expect(() => validateBookingDate(wednesday, wednesdayConfig)).not.toThrow();
  });

  it("lanza error para lunes si solo sábado está permitido", () => {
    const saturdayOnlyConfig = { ...baseConfig, allowed_days: [6] };
    const monday = nextAllowedDay([1]); // busca un lunes
    expect(() => validateBookingDate(monday, saturdayOnlyConfig)).toThrow(
      "No se puede reservar en este día de la semana"
    );
  });

  // ── Hoy ───────────────────────────────────────────────────────────────────────

  it("lanza error para hoy si es día no permitido", () => {
    const today = dateOffset(0);
    const todayDow = dayOfWeek(today);
    if (!baseConfig.allowed_days.includes(todayDow)) {
      expect(() => validateBookingDate(today, baseConfig)).toThrow();
    } else {
      // Hoy es un día permitido — comprobar que no lanza
      expect(() => validateBookingDate(today, baseConfig)).not.toThrow();
    }
  });
});
