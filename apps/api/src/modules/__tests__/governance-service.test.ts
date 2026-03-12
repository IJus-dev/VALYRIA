import { describe, it, expect, beforeEach } from "vitest";
import { GovernanceService } from "../governance-service";
import { InMemoryPlatformRepository } from "../../adapters/storage/in-memory-platform-repository";
import { EventBus } from "../../lib/event-bus";
import { InvalidStateTransitionError, NotFoundError } from "@valyria/domain";

describe("GovernanceService", () => {
  let service: GovernanceService;
  let repository: InMemoryPlatformRepository;
  let eventBus: EventBus;

  beforeEach(() => {
    repository = new InMemoryPlatformRepository();
    eventBus = new EventBus();
    service = new GovernanceService(repository, eventBus);
  });

  describe("listProposals", () => {
    it("retorna proposals do seed", async () => {
      const proposals = await service.listProposals();
      expect(proposals.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("getProposal", () => {
    it("retorna proposal existente", async () => {
      const proposal = await service.getProposal("proposal_1");
      expect(proposal.code).toBe("VAL-001");
    });

    it("lanca NotFoundError pra proposal inexistente", async () => {
      await expect(service.getProposal("nonexistent")).rejects.toThrow(NotFoundError);
    });
  });

  describe("createProposal", () => {
    it("cria proposal em status draft", async () => {
      const proposal = await service.createProposal({
        code: "VAL-099",
        title: "Nova proposta de teste",
        summary: "Resumo da proposta.",
        authorId: "usr_producer_1"
      });

      expect(proposal.status).toBe("draft");
      expect(proposal.code).toBe("VAL-099");
      expect(typeof proposal.createdAt).toBe("string");
    });

    it("gera audit log ao criar", async () => {
      await service.createProposal({
        code: "VAL-100",
        title: "Audit test",
        summary: "Test",
        authorId: "usr_producer_1"
      });

      const logs = await repository.listAuditLogs();
      const createdLog = logs.find((l) => l.action === "governance.proposal_created");
      expect(createdLog).toBeDefined();
    });

    it("emite evento ao criar", async () => {
      let emitted = false;
      eventBus.on("governance.proposal_changed", () => {
        emitted = true;
      });

      await service.createProposal({
        code: "VAL-101",
        title: "Event test",
        summary: "Test",
        authorId: "usr_producer_1"
      });

      expect(emitted).toBe(true);
    });
  });

  describe("transitionProposal", () => {
    it("draft → active via activate", async () => {
      const result = await service.transitionProposal({
        proposalId: "proposal_1",
        event: "activate"
      });

      expect(result.status).toBe("active");
    });

    it("active → review via submit_review", async () => {
      const result = await service.transitionProposal({
        proposalId: "proposal_2",
        event: "submit_review"
      });

      expect(result.status).toBe("review");
    });

    it("rejeita transição inválida", async () => {
      await expect(
        service.transitionProposal({
          proposalId: "proposal_1",
          event: "approve"
        })
      ).rejects.toThrow(InvalidStateTransitionError);
    });

    it("lanca NotFoundError pra proposal inexistente", async () => {
      await expect(
        service.transitionProposal({
          proposalId: "nonexistent",
          event: "activate"
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("gera audit log ao transicionar", async () => {
      await service.transitionProposal({
        proposalId: "proposal_1",
        event: "activate"
      });

      const logs = await repository.listAuditLogs();
      const transitionLog = logs.find((l) => l.action === "governance.proposal_transition.activate");
      expect(transitionLog).toBeDefined();
      expect(transitionLog?.payload).toEqual({ from: "draft", to: "active" });
    });
  });

  describe("deleteProposal", () => {
    it("deleta proposal existente", async () => {
      await service.deleteProposal({ proposalId: "proposal_1" });
      await expect(service.getProposal("proposal_1")).rejects.toThrow(NotFoundError);
    });

    it("lanca NotFoundError pra proposal inexistente", async () => {
      await expect(
        service.deleteProposal({ proposalId: "nonexistent" })
      ).rejects.toThrow(NotFoundError);
    });

    it("gera audit log ao deletar", async () => {
      await service.deleteProposal({ proposalId: "proposal_1" });

      const logs = await repository.listAuditLogs();
      const deleteLog = logs.find((l) => l.action === "governance.proposal_deleted");
      expect(deleteLog).toBeDefined();
    });
  });

  describe("lifecycle completo", () => {
    it("draft → active → review → approved → archived", async () => {
      const created = await service.createProposal({
        code: "VAL-LIFE",
        title: "Lifecycle test",
        summary: "Full lifecycle.",
        authorId: "usr_producer_1"
      });

      expect(created.status).toBe("draft");

      const activated = await service.transitionProposal({
        proposalId: created.id,
        event: "activate"
      });
      expect(activated.status).toBe("active");

      const reviewed = await service.transitionProposal({
        proposalId: created.id,
        event: "submit_review"
      });
      expect(reviewed.status).toBe("review");

      const approved = await service.transitionProposal({
        proposalId: created.id,
        event: "approve"
      });
      expect(approved.status).toBe("approved");

      const archived = await service.transitionProposal({
        proposalId: created.id,
        event: "archive"
      });
      expect(archived.status).toBe("archived");
    });
  });
});
