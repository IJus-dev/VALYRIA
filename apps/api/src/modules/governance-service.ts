import {
  createProposal,
  transitionProposalStatus,
  NotFoundError,
  type Proposal,
  type ProposalEvent
} from "@valyria/domain";
import { resolveAuditActorUserId } from "./audit-actor";
import type { PlatformRepository } from "./platform-repository";
import type { EventBus } from "../lib/event-bus";

export class GovernanceService {
  constructor(
    private readonly repository: PlatformRepository,
    private readonly eventBus?: EventBus
  ) {}

  async listProposals(): Promise<Proposal[]> {
    return this.repository.listProposals();
  }

  async getProposal(id: string): Promise<Proposal> {
    const proposal = await this.repository.getProposal(id);

    if (!proposal) {
      throw new NotFoundError("Proposal", id);
    }

    return proposal;
  }

  async createProposal(input: {
    code: string;
    title: string;
    summary: string;
    authorId: string;
  }): Promise<Proposal> {
    const proposal = createProposal({
      id: crypto.randomUUID(),
      code: input.code,
      title: input.title,
      summary: input.summary,
      authorId: input.authorId
    });

    const saved = await this.repository.upsertProposal(proposal);

    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      actorUserId: input.authorId,
      action: "governance.proposal_created",
      entityType: "proposal",
      entityId: saved.id,
      payload: { code: saved.code, title: saved.title, status: saved.status },
      createdAt: saved.createdAt
    });

    this.eventBus?.emit("governance.proposal_changed", {
      proposalId: saved.id,
      status: saved.status
    });

    return saved;
  }

  async transitionProposal(input: {
    proposalId: string;
    event: ProposalEvent;
    actorUserId?: string;
  }): Promise<Proposal> {
    const proposal = await this.repository.getProposal(input.proposalId);

    if (!proposal) {
      throw new NotFoundError("Proposal", input.proposalId);
    }

    const nextStatus = transitionProposalStatus(proposal.status, input.event);
    const now = new Date().toISOString();

    const updated = await this.repository.upsertProposal({
      ...proposal,
      status: nextStatus,
      updatedAt: now
    });

    const actorUserId = await resolveAuditActorUserId(this.repository, input.actorUserId);

    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      ...(actorUserId ? { actorUserId } : {}),
      action: `governance.proposal_transition.${input.event}`,
      entityType: "proposal",
      entityId: updated.id,
      payload: { from: proposal.status, to: nextStatus },
      createdAt: now
    });

    this.eventBus?.emit("governance.proposal_changed", {
      proposalId: updated.id,
      status: updated.status
    });

    return updated;
  }

  async deleteProposal(input: {
    proposalId: string;
    actorUserId?: string;
  }): Promise<void> {
    const proposal = await this.repository.getProposal(input.proposalId);

    if (!proposal) {
      throw new NotFoundError("Proposal", input.proposalId);
    }

    const now = new Date().toISOString();
    const actorUserId = await resolveAuditActorUserId(this.repository, input.actorUserId);

    await this.repository.deleteProposal(input.proposalId);

    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      ...(actorUserId ? { actorUserId } : {}),
      action: "governance.proposal_deleted",
      entityType: "proposal",
      entityId: input.proposalId,
      payload: { code: proposal.code, title: proposal.title },
      createdAt: now
    });
  }
}
