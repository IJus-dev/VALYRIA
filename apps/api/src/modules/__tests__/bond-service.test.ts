import { describe, it, expect, beforeEach } from "vitest";
import { BondService } from "../bond-service";
import { InMemoryPlatformRepository } from "../../adapters/storage/in-memory-platform-repository";
import { MockXrplGateway } from "../../adapters/xrpl/mock-xrpl-gateway";
import { NotFoundError, ValidationError, InvalidStateTransitionError } from "@valyria/domain";

describe("BondService", () => {
  let service: BondService;
  let repository: InMemoryPlatformRepository;
  let gateway: MockXrplGateway;

  beforeEach(() => {
    repository = new InMemoryPlatformRepository();
    gateway = new MockXrplGateway();
    service = new BondService(repository, gateway);
  });

  describe("listBonds", () => {
    it("retorna bonds do seed", async () => {
      const bonds = await service.listBonds();
      expect(bonds.length).toBeGreaterThan(0);
    });
  });

  describe("createBond", () => {
    it("cria bond via escrow e persiste com escrowSequence", async () => {
      const result = await service.createBond({
        userId: "usr_producer_1",
        amount: 5000,
        credentialIds: ["cred_kyc_001", "cred_producer_001"]
      });

      expect(result.bond.amount).toBe(5000);
      expect(result.bond.currency).toBe("VEX");
      expect(result.bond.escrowFinishAfter).toBeTruthy();
      // MockGateway retorna submitted: false, então bond fica pending
      expect(result.bond.state).toBe("pending");
      // MockGateway retorna escrowSequence: 99999
      expect(result.bond.escrowSequence).toBe(99999);
      expect(result.ledger.transactionType).toBe("EscrowCreate");
    });

    it("aceita finishAfterDays customizado", async () => {
      const result = await service.createBond({
        userId: "usr_producer_1",
        amount: 1000,
        credentialIds: ["cred_kyc_001"],
        finishAfterDays: 30
      });

      const finishAfter = new Date(result.bond.escrowFinishAfter!);
      const now = new Date();
      const diffDays = (finishAfter.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      // Deve ser aproximadamente 30 dias (com margem de 1 dia)
      expect(diffDays).toBeGreaterThan(29);
      expect(diffDays).toBeLessThan(31);
    });

    it("lanca NotFoundError pra user inexistente", async () => {
      await expect(
        service.createBond({
          userId: "nonexistent",
          amount: 1000,
          credentialIds: ["cred_kyc_001"]
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("lanca erro pra user sem wallet", async () => {
      // Cria user sem wallet
      await repository.upsertUser({
        id: "usr_no_wallet",
        email: "nowallet@test.io",
        state: "producer_approved",
        roles: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      await expect(
        service.createBond({
          userId: "usr_no_wallet",
          amount: 1000,
          credentialIds: ["cred_kyc_001"]
        })
      ).rejects.toThrow(ValidationError);
    });

    it("lanca NotFoundError pra credential inexistente", async () => {
      await expect(
        service.createBond({
          userId: "usr_producer_1",
          amount: 1000,
          credentialIds: ["nonexistent_cred"]
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("releaseBond", () => {
    it("libera bond locked via EscrowFinish", async () => {
      // Cria bond com escrow
      const created = await service.createBond({
        userId: "usr_producer_1",
        amount: 5000,
        credentialIds: ["cred_kyc_001"]
      });

      // Transiciona pra locked (simula confirm_deposit)
      await service.transitionBond({
        bondId: created.bond.id,
        event: "confirm_deposit"
      });

      const released = await service.releaseBond({
        bondId: created.bond.id,
        actorUserId: "usr_producer_1"
      });

      expect(released.state).toBe("released");
    });

    it("lanca NotFoundError pra bond inexistente", async () => {
      await expect(
        service.releaseBond({ bondId: "nonexistent" })
      ).rejects.toThrow(NotFoundError);
    });

    it("lanca ValidationError pra bond sem escrowSequence", async () => {
      // O bond seeded (bond_1) não tem escrowSequence
      await expect(
        service.releaseBond({ bondId: "bond_1" })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("forfeitBond", () => {
    it("confisca bond locked via EscrowCancel", async () => {
      const created = await service.createBond({
        userId: "usr_producer_1",
        amount: 3000,
        credentialIds: ["cred_kyc_001"]
      });

      // Transiciona pra locked
      await service.transitionBond({
        bondId: created.bond.id,
        event: "confirm_deposit"
      });

      const forfeited = await service.forfeitBond({
        bondId: created.bond.id,
        actorUserId: "usr_producer_1"
      });

      expect(forfeited.state).toBe("forfeited");
    });

    it("permite forfeit a partir de pending", async () => {
      const created = await service.createBond({
        userId: "usr_producer_1",
        amount: 2000,
        credentialIds: ["cred_kyc_001"]
      });

      const forfeited = await service.forfeitBond({
        bondId: created.bond.id
      });

      expect(forfeited.state).toBe("forfeited");
    });

    it("lanca NotFoundError pra bond inexistente", async () => {
      await expect(
        service.forfeitBond({ bondId: "nonexistent" })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("transitionBond", () => {
    it("transiciona bond de locked para frozen", async () => {
      const bond = await service.transitionBond({
        bondId: "bond_1",
        event: "freeze"
      });

      expect(bond.state).toBe("frozen");
      expect(bond.frozenAt).toBeTruthy();
    });

    it("rejeita transicao invalida", async () => {
      await expect(
        service.transitionBond({
          bondId: "bond_1",
          event: "confirm_deposit"
        })
      ).rejects.toThrow(InvalidStateTransitionError);
    });

    it("lanca NotFoundError pra bond inexistente", async () => {
      await expect(
        service.transitionBond({
          bondId: "nonexistent",
          event: "freeze"
        })
      ).rejects.toThrow(NotFoundError);
    });
  });
});
