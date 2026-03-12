import { EventEmitter } from "node:events";
import type { BondState, RedeemState, DisputeState, ProposalStatus } from "@valyria/domain";

// mapa de canais → payload tipado
export interface EventMap {
  "bond.state_changed": { bondId: string; from: BondState; to: BondState; actorUserId?: string };
  "redeem.state_changed": { redeemId: string; from: RedeemState | "none"; to: RedeemState };
  "dispute.state_changed": { disputeId: string; from: DisputeState | "none"; to: DisputeState };
  "offer.created": { offerId: string; series: string; producerId: string };
  "offer.filled": { offerId: string; holderId: string; quantity: number };
  "amm.swap": { poolId: string; inputAsset: string; outputAsset: string; inputAmount: number; outputAmount: number };
  "governance.proposal_changed": { proposalId: string; status: ProposalStatus };
}

export type EventChannel = keyof EventMap;

export class EventBus {
  private readonly emitter = new EventEmitter();

  constructor() {
    // sem limite de listeners — cada WebSocket client registra um
    this.emitter.setMaxListeners(0);
  }

  emit<C extends EventChannel>(channel: C, payload: EventMap[C]): void {
    this.emitter.emit(channel, payload);
  }

  on<C extends EventChannel>(channel: C, handler: (payload: EventMap[C]) => void): void {
    this.emitter.on(channel, handler);
  }

  off<C extends EventChannel>(channel: C, handler: (payload: EventMap[C]) => void): void {
    this.emitter.off(channel, handler);
  }
}
