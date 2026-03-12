import { describe, it, expect } from "vitest";
import { transitionBondState, createBond } from "../bond";
import { InvalidStateTransitionError, ValidationError } from "../errors";

describe("transitionBondState", () => {
  // transições válidas a partir de pending
  it("pending → locked via confirm_deposit", () => {
    expect(transitionBondState("pending", "confirm_deposit")).toBe("locked");
  });

  it("pending → forfeited via forfeit", () => {
    expect(transitionBondState("pending", "forfeit")).toBe("forfeited");
  });

  // transições válidas a partir de locked
  it("locked → frozen via freeze", () => {
    expect(transitionBondState("locked", "freeze")).toBe("frozen");
  });

  it("locked → partially_slashed via slash_partial", () => {
    expect(transitionBondState("locked", "slash_partial")).toBe("partially_slashed");
  });

  it("locked → released via release", () => {
    expect(transitionBondState("locked", "release")).toBe("released");
  });

  it("locked → forfeited via forfeit", () => {
    expect(transitionBondState("locked", "forfeit")).toBe("forfeited");
  });

  // transições válidas a partir de frozen
  it("frozen → locked via restore_lock", () => {
    expect(transitionBondState("frozen", "restore_lock")).toBe("locked");
  });

  it("frozen → partially_slashed via slash_partial", () => {
    expect(transitionBondState("frozen", "slash_partial")).toBe("partially_slashed");
  });

  it("frozen → forfeited via forfeit", () => {
    expect(transitionBondState("frozen", "forfeit")).toBe("forfeited");
  });

  // transições válidas a partir de partially_slashed
  it("partially_slashed → frozen via freeze", () => {
    expect(transitionBondState("partially_slashed", "freeze")).toBe("frozen");
  });

  it("partially_slashed → released via release", () => {
    expect(transitionBondState("partially_slashed", "release")).toBe("released");
  });

  it("partially_slashed → forfeited via forfeit", () => {
    expect(transitionBondState("partially_slashed", "forfeit")).toBe("forfeited");
  });

  // estados terminais não aceitam transição
  it("released não aceita nenhum evento", () => {
    expect(() => transitionBondState("released", "freeze")).toThrow(InvalidStateTransitionError);
    expect(() => transitionBondState("released", "release")).toThrow(InvalidStateTransitionError);
  });

  it("forfeited não aceita nenhum evento", () => {
    expect(() => transitionBondState("forfeited", "restore_lock")).toThrow(InvalidStateTransitionError);
    expect(() => transitionBondState("forfeited", "release")).toThrow(InvalidStateTransitionError);
  });

  // transições inválidas
  it("pending não aceita freeze", () => {
    expect(() => transitionBondState("pending", "freeze")).toThrow(InvalidStateTransitionError);
  });

  it("pending não aceita release", () => {
    expect(() => transitionBondState("pending", "release")).toThrow(InvalidStateTransitionError);
  });
});

describe("createBond", () => {
  it("cria bond com defaults corretos", () => {
    const bond = createBond({ id: "b1", userId: "u1", amount: 100 });

    expect(bond.state).toBe("pending");
    expect(bond.currency).toBe("VEX");
    expect(bond.slashedAmount).toBe(0);
    expect(bond.credentialIds).toEqual([]);
    expect(bond.createdAt).toBeTruthy();
  });

  it("rejeita amount <= 0", () => {
    expect(() => createBond({ id: "b1", userId: "u1", amount: 0 })).toThrow(ValidationError);
    expect(() => createBond({ id: "b1", userId: "u1", amount: -10 })).toThrow(ValidationError);
  });

  it("aceita campos opcionais", () => {
    const bond = createBond({
      id: "b1",
      userId: "u1",
      amount: 500,
      currency: "XRP",
      credentialIds: ["c1", "c2"],
      ledgerHash: "ABCD",
      ledgerSequence: 42,
    });

    expect(bond.currency).toBe("XRP");
    expect(bond.credentialIds).toEqual(["c1", "c2"]);
    expect(bond.ledgerHash).toBe("ABCD");
    expect(bond.ledgerSequence).toBe(42);
  });
});
