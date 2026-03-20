/**
 * Tests de Queries de Cesiones (cessions.ts)
 *
 * Verifica:
 * - getUserCessions: filtro de filas con spots null, mismatch de resource_type, happy path
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserCessions } from "@/lib/queries/cessions";

// ─── Mock de Drizzle db ───────────────────────────────────────────────────────

vi.mock("@/lib/db", async () => {
  const { mockDb } = await import("../../mocks/db");
  return { db: mockDb };
});

import { resetDbMocks, setupSelectMock } from "../../mocks/db";

// ─── Helper ───────────────────────────────────────────────────────────────────

const USER_ID = "550e8400-e29b-41d4-a716-446655440010";
const CESSION_ID = "550e8400-e29b-41d4-a716-446655440011";

function makeCessionRow(overrides?: {
  spotResourceType?: string;
  userFullName?: string;
}) {
  return {
    id: CESSION_ID,
    spot_id: "550e8400-e29b-41d4-a716-446655440012",
    user_id: USER_ID,
    date: "2026-06-01",
    status: "available",
    created_at: new Date("2026-05-01T00:00:00Z"),
    spot_label: "P-01",
    spot_resource_type: overrides?.spotResourceType ?? "parking",
    user_name: overrides?.userFullName ?? "Test User",
  };
}

// ─── getUserCessions ───────────────────────────────────────────────────────────

describe("getUserCessions", () => {
  beforeEach(() => {
    resetDbMocks();
  });

  it("filtra filas con resource_type incorrecto (no devuelve filas con resource_type erróneo)", async () => {
    // With Drizzle INNER JOIN, rows with incorrect resource_type are filtered by JS guard.
    setupSelectMock([makeCessionRow({ spotResourceType: "office" })]);

    const result = await getUserCessions(USER_ID, "parking");

    expect(result).toHaveLength(0);
  });

  it("filtra filas con resource_type incorrecto y emite console.warn", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    setupSelectMock([makeCessionRow({ spotResourceType: "office" })]);

    const result = await getUserCessions(USER_ID, "parking");

    expect(result).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("getUserCessions"),
      expect.objectContaining({ expected: "parking", got: "office" })
    );

    warnSpy.mockRestore();
  });

  it("happy path: devuelve cesión con resource_type correcto", async () => {
    setupSelectMock([makeCessionRow({ spotResourceType: "parking" })]);

    const result = await getUserCessions(USER_ID, "parking");

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: CESSION_ID,
      spot_label: "P-01",
      resource_type: "parking",
      user_name: "Test User",
    });
  });

  it("sin resourceType devuelve todas las cesiones", async () => {
    setupSelectMock([
      makeCessionRow({ spotResourceType: "parking" }),
      makeCessionRow({ spotResourceType: "office" }),
    ]);

    const result = await getUserCessions(USER_ID);

    expect(result).toHaveLength(2);
  });
});
