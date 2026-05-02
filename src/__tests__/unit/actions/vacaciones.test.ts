import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", async () => {
  const { mockDb } = await import("../../mocks/db");
  return { db: mockDb };
});
vi.mock("@/lib/auth/helpers", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/queries/active-entity", () => ({
  getEffectiveEntityId: vi.fn(),
}));
vi.mock("@/lib/queries/holidays", () => ({ getHolidayDatesSet: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { getCurrentUser } from "@/lib/auth/helpers";
import { getEffectiveEntityId } from "@/lib/queries/active-entity";
import {
  mockDb,
  resetDbMocks,
  setupSelectMock,
  setupUpdateMock,
} from "../../mocks/db";
import {
  approveLeaveRequest,
  rejectLeaveRequest,
} from "@/app/(dashboard)/vacaciones/actions";

const REQUEST_ID = "550e8400-e29b-41d4-a716-446655440001";

const managerUser = {
  id: "manager-1",
  email: "manager@test.com",
  profile: {
    role: "manager",
    entityId: "entity-A",
  },
};

describe("vacaciones permissions", () => {
  beforeEach(() => {
    resetDbMocks();
    vi.mocked(getCurrentUser).mockResolvedValue(managerUser as never);
    vi.mocked(getEffectiveEntityId).mockResolvedValue("entity-A");
  });

  it("bloquea aprobar solicitudes de otra sede", async () => {
    setupSelectMock([{ status: "pending", employeeEntityId: "entity-B" }]);

    const result = await approveLeaveRequest({
      id: REQUEST_ID,
      notes: null,
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Sin permisos");
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("bloquea rechazar solicitudes de otra sede", async () => {
    setupSelectMock([{ status: "pending", employeeEntityId: "entity-B" }]);

    const result = await rejectLeaveRequest({
      id: REQUEST_ID,
      notes: "No procede",
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Sin permisos");
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("permite aprobar solicitudes de la propia sede", async () => {
    setupSelectMock([{ status: "pending", employeeEntityId: "entity-A" }]);
    setupUpdateMock([{ id: REQUEST_ID }]);

    const result = await approveLeaveRequest({
      id: REQUEST_ID,
      notes: null,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        approved: true,
        newStatus: "manager_approved",
      });
    }
  });
});
