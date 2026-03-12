import { describe, it, expect, vi } from "vitest";
import { EventBus } from "../event-bus";

describe("EventBus", () => {
  it("emite evento e listener recebe payload correto", () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on("offer.created", handler);
    bus.emit("offer.created", { offerId: "o1", series: "SOJA-2026", producerId: "p1" });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({
      offerId: "o1",
      series: "SOJA-2026",
      producerId: "p1"
    });
  });

  it("suporta múltiplos listeners no mesmo canal", () => {
    const bus = new EventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    bus.on("bond.state_changed", handler1);
    bus.on("bond.state_changed", handler2);
    bus.emit("bond.state_changed", {
      bondId: "b1",
      from: "pending",
      to: "locked",
      actorUserId: "u1"
    });

    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).toHaveBeenCalledOnce();
  });

  it("off remove listener corretamente", () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on("amm.swap", handler);
    bus.off("amm.swap", handler);
    bus.emit("amm.swap", {
      poolId: "pool1",
      inputAsset: "VEX",
      outputAsset: "XRP",
      inputAmount: 100,
      outputAmount: 50
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("listeners de canais diferentes não interferem", () => {
    const bus = new EventBus();
    const offerHandler = vi.fn();
    const disputeHandler = vi.fn();

    bus.on("offer.created", offerHandler);
    bus.on("dispute.state_changed", disputeHandler);
    bus.emit("offer.created", { offerId: "o1", series: "CAFE-2026", producerId: "p1" });

    expect(offerHandler).toHaveBeenCalledOnce();
    expect(disputeHandler).not.toHaveBeenCalled();
  });

  it("off só remove o handler específico, outros continuam", () => {
    const bus = new EventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    bus.on("redeem.state_changed", handler1);
    bus.on("redeem.state_changed", handler2);
    bus.off("redeem.state_changed", handler1);
    bus.emit("redeem.state_changed", { redeemId: "r1", from: "requested", to: "in_delivery" });

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledOnce();
  });
});
