import { describe, it, expect } from "vitest";
import { transitionRedeemState, createRedeemRequest } from "../redeem";
import { InvalidStateTransitionError } from "../errors";

describe("transitionRedeemState", () => {
  it("requested → tracking_pending via attach_tracking", () => {
    expect(transitionRedeemState("requested", "attach_tracking")).toBe("tracking_pending");
  });

  it("requested → disputed via open_dispute", () => {
    expect(transitionRedeemState("requested", "open_dispute")).toBe("disputed");
  });

  it("tracking_pending → in_delivery via ship", () => {
    expect(transitionRedeemState("tracking_pending", "ship")).toBe("in_delivery");
  });

  it("in_delivery → delivered via confirm_delivery", () => {
    expect(transitionRedeemState("in_delivery", "confirm_delivery")).toBe("delivered");
  });

  it("delivered → accepted via accept", () => {
    expect(transitionRedeemState("delivered", "accept")).toBe("accepted");
  });

  it("delivered → disputed via open_dispute", () => {
    expect(transitionRedeemState("delivered", "open_dispute")).toBe("disputed");
  });

  it("accepted → closed via close", () => {
    expect(transitionRedeemState("accepted", "close")).toBe("closed");
  });

  it("disputed → closed via close", () => {
    expect(transitionRedeemState("disputed", "close")).toBe("closed");
  });

  // estados terminais
  it("closed não aceita eventos", () => {
    expect(() => transitionRedeemState("closed", "accept")).toThrow(InvalidStateTransitionError);
  });

  // transições inválidas
  it("requested não aceita accept", () => {
    expect(() => transitionRedeemState("requested", "accept")).toThrow(InvalidStateTransitionError);
  });

  it("in_delivery não aceita accept direto", () => {
    expect(() => transitionRedeemState("in_delivery", "accept")).toThrow(InvalidStateTransitionError);
  });
});

describe("createRedeemRequest", () => {
  it("cria com defaults corretos", () => {
    const redeem = createRedeemRequest({
      id: "r1",
      offerId: "o1",
      holderId: "h1",
      settlementWallet: "rSettlement123",
    });

    expect(redeem.state).toBe("requested");
    expect(redeem.responseWindowDays).toBe(5);
    expect(redeem.requestedAt).toBeTruthy();
  });

  it("aceita responseWindowDays custom", () => {
    const redeem = createRedeemRequest({
      id: "r1",
      offerId: "o1",
      holderId: "h1",
      settlementWallet: "rSettlement123",
      responseWindowDays: 7,
    });

    expect(redeem.responseWindowDays).toBe(7);
  });
});
