import { describe, it, expect } from "vitest";
import {
  transitionDisputeState,
  escalateDisputeTier,
  getDisputeTierSlaDays,
  createDisputeCase,
} from "../dispute";
import { InvalidStateTransitionError } from "../errors";

describe("transitionDisputeState", () => {
  it("opened → under_review via start_review", () => {
    expect(transitionDisputeState("opened", "start_review")).toBe("under_review");
  });

  it("opened → escalated via escalate", () => {
    expect(transitionDisputeState("opened", "escalate")).toBe("escalated");
  });

  it("opened → resolved via resolve", () => {
    expect(transitionDisputeState("opened", "resolve")).toBe("resolved");
  });

  it("opened → rejected via reject", () => {
    expect(transitionDisputeState("opened", "reject")).toBe("rejected");
  });

  it("under_review → escalated via escalate", () => {
    expect(transitionDisputeState("under_review", "escalate")).toBe("escalated");
  });

  it("under_review → resolved via resolve", () => {
    expect(transitionDisputeState("under_review", "resolve")).toBe("resolved");
  });

  it("escalated → resolved via resolve", () => {
    expect(transitionDisputeState("escalated", "resolve")).toBe("resolved");
  });

  it("escalated → rejected via reject", () => {
    expect(transitionDisputeState("escalated", "reject")).toBe("rejected");
  });

  // estados terminais
  it("resolved não aceita eventos", () => {
    expect(() => transitionDisputeState("resolved", "escalate")).toThrow(InvalidStateTransitionError);
  });

  it("rejected não aceita eventos", () => {
    expect(() => transitionDisputeState("rejected", "resolve")).toThrow(InvalidStateTransitionError);
  });
});

describe("escalateDisputeTier", () => {
  it("tier_1 → tier_2", () => {
    expect(escalateDisputeTier("tier_1")).toBe("tier_2");
  });

  it("tier_2 → tier_3", () => {
    expect(escalateDisputeTier("tier_2")).toBe("tier_3");
  });

  it("tier_3 não pode escalar mais", () => {
    expect(() => escalateDisputeTier("tier_3")).toThrow(InvalidStateTransitionError);
  });
});

describe("getDisputeTierSlaDays", () => {
  it("tier_1 = 5 dias", () => {
    expect(getDisputeTierSlaDays("tier_1")).toBe(5);
  });

  it("tier_2 = 10 dias", () => {
    expect(getDisputeTierSlaDays("tier_2")).toBe(10);
  });

  it("tier_3 = 30 dias", () => {
    expect(getDisputeTierSlaDays("tier_3")).toBe(30);
  });
});

describe("createDisputeCase", () => {
  it("cria com defaults corretos", () => {
    const dispute = createDisputeCase({
      id: "d1",
      redeemId: "r1",
      openedByUserId: "u1",
      reason: "Produto danificado",
    });

    expect(dispute.state).toBe("opened");
    expect(dispute.tier).toBe("tier_1");
    expect(dispute.reason).toBe("Produto danificado");
  });

  it("aceita tier e bondId opcionais", () => {
    const dispute = createDisputeCase({
      id: "d1",
      redeemId: "r1",
      openedByUserId: "u1",
      reason: "Não entregue",
      tier: "tier_2",
      bondId: "b1",
    });

    expect(dispute.tier).toBe("tier_2");
    expect(dispute.bondId).toBe("b1");
  });
});
