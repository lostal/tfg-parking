/**
 * Smoke test — verifica que el actionClient y sus helpers
 * devuelven la estructura ActionResult correcta.
 */
import { describe, it, expect } from "vitest";
import { success, error } from "@/lib/actions";

describe("actionClient helpers", () => {
  it("success() devuelve la forma correcta", () => {
    const result = success({ id: "123" });
    expect(result).toEqual({ success: true, data: { id: "123" } });
  });

  it("error() devuelve la forma correcta sin fieldErrors", () => {
    const result = error("Algo salió mal");
    expect(result).toEqual({ success: false, error: "Algo salió mal" });
  });

  it("error() incluye fieldErrors cuando se proporcionan", () => {
    const result = error("Inválido", { campo: ["Requerido"] });
    expect(result).toEqual({
      success: false,
      error: "Inválido",
      fieldErrors: { campo: ["Requerido"] },
    });
  });
});
