import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", async () => {
  const { mockDb } = await import("../../mocks/db");
  return { db: mockDb };
});
vi.mock("@/lib/auth/helpers", () => ({
  getCurrentUser: vi.fn(),
  requireAuth: vi.fn(),
  requireManagerOrAbove: vi.fn(),
}));
vi.mock("@/lib/queries/announcements", () => ({
  getPublishedAnnouncements: vi.fn(),
  getAnnouncementsForManagement: vi.fn(),
  markAsRead: vi.fn(),
}));
vi.mock("@/lib/queries/active-entity", () => ({
  getEffectiveEntityId: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { requireAuth, requireManagerOrAbove } from "@/lib/auth/helpers";
import { getPublishedAnnouncements } from "@/lib/queries/announcements";
import { getEffectiveEntityId } from "@/lib/queries/active-entity";
import { mockDb, resetDbMocks, setupSelectMock } from "../../mocks/db";
import {
  getMyFeedAnnouncements,
  updateAnnouncement,
} from "@/app/(dashboard)/tablon/actions";

const ANNOUNCEMENT_ID = "550e8400-e29b-41d4-a716-446655440001";
const ENTITY_ID = "550e8400-e29b-41d4-a716-446655440002";

const managerUser = {
  id: "manager-1",
  email: "manager@test.com",
  profile: {
    role: "manager",
    entityId: "entity-A",
  },
};

describe("tablon permissions", () => {
  beforeEach(() => {
    resetDbMocks();
    vi.mocked(requireAuth).mockResolvedValue(managerUser as never);
    vi.mocked(requireManagerOrAbove).mockResolvedValue(managerUser as never);
    vi.mocked(getEffectiveEntityId).mockResolvedValue("entity-A");
    vi.mocked(getPublishedAnnouncements).mockResolvedValue([]);
  });

  it("exige autenticacion para leer el feed personal", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error("No autenticado"));

    const result = await getMyFeedAnnouncements();

    expect(result.success).toBe(false);
    expect(getPublishedAnnouncements).not.toHaveBeenCalled();
  });

  it("mantiene entity_id inmutable cuando edita un manager", async () => {
    setupSelectMock([{ createdBy: managerUser.id }]);

    const result = await updateAnnouncement({
      id: ANNOUNCEMENT_ID,
      title: "Nuevo titulo",
      entity_id: ENTITY_ID,
    });

    expect(result.success).toBe(true);
    expect(mockUpdateValues()).toEqual({ title: "Nuevo titulo" });
  });
});

function mockUpdateValues() {
  const updateBuilder = vi.mocked(mockDb.update).mock.results[0]?.value as
    | { set: ReturnType<typeof vi.fn> }
    | undefined;

  return updateBuilder?.set.mock.calls[0]?.[0];
}
