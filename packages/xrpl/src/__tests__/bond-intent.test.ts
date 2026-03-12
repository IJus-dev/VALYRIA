import { describe, it, expect } from "vitest";
import {
  buildBondDepositIntent,
  buildBondEscrowCreateIntent,
  buildBondEscrowFinishIntent,
  buildBondEscrowCancelIntent
} from "../bond-intent";

describe("buildBondDepositIntent", () => {
  it("cria intent com campos corretos", () => {
    const intent = buildBondDepositIntent({
      destination: "rBondVault",
      amount: { currency: "VEX", value: "1000.00" },
      credentialIds: ["cred_1"]
    });

    expect(intent.destination).toBe("rBondVault");
    expect(intent.amount.value).toBe("1000.00");
    expect(intent.credentialIds).toEqual(["cred_1"]);
    expect(intent.preflightChecks.length).toBeGreaterThan(0);
  });

  it("rejeita sem credentialIds", () => {
    expect(() =>
      buildBondDepositIntent({
        destination: "rBondVault",
        amount: { currency: "VEX", value: "1000.00" },
        credentialIds: []
      })
    ).toThrow("at least one accepted credential ID");
  });
});

describe("buildBondEscrowCreateIntent", () => {
  it("cria intent de escrow com todos os campos", () => {
    const intent = buildBondEscrowCreateIntent({
      source: "rProducer",
      destination: "rBondVault",
      amount: "15000",
      finishAfter: "2026-06-01T00:00:00.000Z",
      credentialIds: ["cred_1"]
    });

    expect(intent.source).toBe("rProducer");
    expect(intent.destination).toBe("rBondVault");
    expect(intent.amount).toBe("15000");
    expect(intent.finishAfter).toBe("2026-06-01T00:00:00.000Z");
    expect(intent.credentialIds).toEqual(["cred_1"]);
    expect(intent.preflightChecks).toContain("finish_after_in_future");
  });

  it("aceita condition opcional", () => {
    const intent = buildBondEscrowCreateIntent({
      source: "rProducer",
      destination: "rBondVault",
      amount: "15000",
      finishAfter: "2026-06-01T00:00:00.000Z",
      condition: "A0258020",
      credentialIds: ["cred_1"]
    });

    expect(intent.condition).toBe("A0258020");
  });

  it("rejeita source vazio", () => {
    expect(() =>
      buildBondEscrowCreateIntent({
        source: "",
        destination: "rBondVault",
        amount: "15000",
        finishAfter: "2026-06-01T00:00:00.000Z",
        credentialIds: ["cred_1"]
      })
    ).toThrow("source address is required");
  });

  it("rejeita destination vazio", () => {
    expect(() =>
      buildBondEscrowCreateIntent({
        source: "rProducer",
        destination: "",
        amount: "15000",
        finishAfter: "2026-06-01T00:00:00.000Z",
        credentialIds: ["cred_1"]
      })
    ).toThrow("destination address is required");
  });

  it("rejeita amount zero ou negativo", () => {
    expect(() =>
      buildBondEscrowCreateIntent({
        source: "rProducer",
        destination: "rBondVault",
        amount: "0",
        finishAfter: "2026-06-01T00:00:00.000Z",
        credentialIds: ["cred_1"]
      })
    ).toThrow("positive string value");

    expect(() =>
      buildBondEscrowCreateIntent({
        source: "rProducer",
        destination: "rBondVault",
        amount: "-100",
        finishAfter: "2026-06-01T00:00:00.000Z",
        credentialIds: ["cred_1"]
      })
    ).toThrow("positive string value");
  });

  it("rejeita finishAfter vazio", () => {
    expect(() =>
      buildBondEscrowCreateIntent({
        source: "rProducer",
        destination: "rBondVault",
        amount: "15000",
        finishAfter: "",
        credentialIds: ["cred_1"]
      })
    ).toThrow("finishAfter");
  });

  it("rejeita sem credentialIds", () => {
    expect(() =>
      buildBondEscrowCreateIntent({
        source: "rProducer",
        destination: "rBondVault",
        amount: "15000",
        finishAfter: "2026-06-01T00:00:00.000Z",
        credentialIds: []
      })
    ).toThrow("at least one accepted credential ID");
  });
});

describe("buildBondEscrowFinishIntent", () => {
  it("cria intent de finish com campos corretos", () => {
    const intent = buildBondEscrowFinishIntent({
      owner: "rProducer",
      offerSequence: 42
    });

    expect(intent.owner).toBe("rProducer");
    expect(intent.offerSequence).toBe(42);
    expect(intent.preflightChecks).toContain("escrow_exists_on_ledger");
    expect(intent.preflightChecks).toContain("finish_after_has_passed");
  });

  it("aceita condition e fulfillment opcionais", () => {
    const intent = buildBondEscrowFinishIntent({
      owner: "rProducer",
      offerSequence: 42,
      condition: "A0258020",
      fulfillment: "B0258020"
    });

    expect(intent.condition).toBe("A0258020");
    expect(intent.fulfillment).toBe("B0258020");
  });

  it("rejeita owner vazio", () => {
    expect(() =>
      buildBondEscrowFinishIntent({
        owner: "",
        offerSequence: 42
      })
    ).toThrow("owner address is required");
  });

  it("rejeita offerSequence zero ou negativo", () => {
    expect(() =>
      buildBondEscrowFinishIntent({
        owner: "rProducer",
        offerSequence: 0
      })
    ).toThrow("positive integer");

    expect(() =>
      buildBondEscrowFinishIntent({
        owner: "rProducer",
        offerSequence: -1
      })
    ).toThrow("positive integer");
  });
});

describe("buildBondEscrowCancelIntent", () => {
  it("cria intent de cancel com campos corretos", () => {
    const intent = buildBondEscrowCancelIntent({
      owner: "rProducer",
      offerSequence: 42
    });

    expect(intent.owner).toBe("rProducer");
    expect(intent.offerSequence).toBe(42);
    expect(intent.preflightChecks).toContain("escrow_exists_on_ledger");
  });

  it("rejeita owner vazio", () => {
    expect(() =>
      buildBondEscrowCancelIntent({
        owner: "",
        offerSequence: 42
      })
    ).toThrow("owner address is required");
  });

  it("rejeita offerSequence zero", () => {
    expect(() =>
      buildBondEscrowCancelIntent({
        owner: "rProducer",
        offerSequence: 0
      })
    ).toThrow("positive integer");
  });
});
