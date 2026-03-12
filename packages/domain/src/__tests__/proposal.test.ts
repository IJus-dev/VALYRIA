import { describe, it, expect } from "vitest";
import { transitionProposalStatus, createProposal } from "../proposal";
import { InvalidStateTransitionError, ValidationError } from "../errors";

describe("transitionProposalStatus", () => {
  // transições válidas a partir de draft
  it("draft → active via activate", () => {
    expect(transitionProposalStatus("draft", "activate")).toBe("active");
  });

  it("draft → archived via archive", () => {
    expect(transitionProposalStatus("draft", "archive")).toBe("archived");
  });

  // transições válidas a partir de active
  it("active → review via submit_review", () => {
    expect(transitionProposalStatus("active", "submit_review")).toBe("review");
  });

  it("active → archived via archive", () => {
    expect(transitionProposalStatus("active", "archive")).toBe("archived");
  });

  // transições válidas a partir de review
  it("review → approved via approve", () => {
    expect(transitionProposalStatus("review", "approve")).toBe("approved");
  });

  it("review → rejected via reject", () => {
    expect(transitionProposalStatus("review", "reject")).toBe("rejected");
  });

  // transições válidas a partir de approved / rejected
  it("approved → archived via archive", () => {
    expect(transitionProposalStatus("approved", "archive")).toBe("archived");
  });

  it("rejected → archived via archive", () => {
    expect(transitionProposalStatus("rejected", "archive")).toBe("archived");
  });

  // archived é terminal
  it("archived não aceita nenhum evento", () => {
    expect(() => transitionProposalStatus("archived", "activate")).toThrow(InvalidStateTransitionError);
    expect(() => transitionProposalStatus("archived", "approve")).toThrow(InvalidStateTransitionError);
    expect(() => transitionProposalStatus("archived", "archive")).toThrow(InvalidStateTransitionError);
  });

  // transições inválidas
  it("draft não aceita approve", () => {
    expect(() => transitionProposalStatus("draft", "approve")).toThrow(InvalidStateTransitionError);
  });

  it("review não aceita activate", () => {
    expect(() => transitionProposalStatus("review", "activate")).toThrow(InvalidStateTransitionError);
  });

  it("active não aceita approve", () => {
    expect(() => transitionProposalStatus("active", "approve")).toThrow(InvalidStateTransitionError);
  });
});

describe("createProposal", () => {
  it("cria proposal com defaults corretos", () => {
    const proposal = createProposal({
      id: "p1",
      code: "VAL-001",
      title: "Test",
      summary: "Summary",
      authorId: "u1"
    });

    expect(proposal.status).toBe("draft");
    expect(proposal.createdAt).toBeTruthy();
    expect(proposal.updatedAt).toBe(proposal.createdAt);
    expect(typeof proposal.createdAt).toBe("string");
  });

  it("rejeita code vazio", () => {
    expect(() =>
      createProposal({ id: "p1", code: "  ", title: "T", summary: "S", authorId: "u1" })
    ).toThrow(ValidationError);
  });

  it("rejeita title vazio", () => {
    expect(() =>
      createProposal({ id: "p1", code: "V", title: "  ", summary: "S", authorId: "u1" })
    ).toThrow(ValidationError);
  });

  it("aceita status customizado", () => {
    const proposal = createProposal({
      id: "p1",
      code: "VAL-002",
      title: "Test",
      summary: "Summary",
      authorId: "u1",
      status: "active"
    });

    expect(proposal.status).toBe("active");
  });

  it("normaliza createdAt/updatedAt como string ISO", () => {
    const proposal = createProposal({
      id: "p1",
      code: "VAL-003",
      title: "Test",
      summary: "Summary",
      authorId: "u1",
      createdAt: "2026-01-01T00:00:00.000Z"
    });

    expect(proposal.createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(proposal.updatedAt).toBe("2026-01-01T00:00:00.000Z");
  });
});
