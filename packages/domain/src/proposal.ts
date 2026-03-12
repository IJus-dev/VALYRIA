import { InvalidStateTransitionError, ValidationError } from "./errors";

export type ProposalStatus = "draft" | "active" | "review" | "approved" | "rejected" | "archived";

export type ProposalEvent = "activate" | "submit_review" | "approve" | "reject" | "archive";

export interface Proposal {
  id: string;
  code: string;
  title: string;
  summary: string;
  status: ProposalStatus;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

const proposalTransitions: Record<ProposalStatus, Partial<Record<ProposalEvent, ProposalStatus>>> = {
  draft: {
    activate: "active",
    archive: "archived"
  },
  active: {
    submit_review: "review",
    archive: "archived"
  },
  review: {
    approve: "approved",
    reject: "rejected"
  },
  approved: {
    archive: "archived"
  },
  rejected: {
    archive: "archived"
  },
  archived: {}
};

export function transitionProposalStatus(current: ProposalStatus, event: ProposalEvent): ProposalStatus {
  const nextStatus = proposalTransitions[current][event];

  if (!nextStatus) {
    throw new InvalidStateTransitionError("Proposal", current, event);
  }

  return nextStatus;
}

export function createProposal(input: {
  id: string;
  code: string;
  title: string;
  summary: string;
  authorId: string;
  status?: ProposalStatus;
  createdAt?: string;
}): Proposal {
  if (!input.code.trim()) {
    throw new ValidationError("Proposal code is required.");
  }

  if (!input.title.trim()) {
    throw new ValidationError("Proposal title is required.");
  }

  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    id: input.id,
    code: input.code.trim(),
    title: input.title.trim(),
    summary: input.summary,
    status: input.status ?? "draft",
    authorId: input.authorId,
    createdAt,
    updatedAt: createdAt
  };
}
