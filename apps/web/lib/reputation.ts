import type {
  BondListItem,
  CredentialListItem,
  DisputeListItem,
  OfferListItem,
  RedeemListItem,
  UserListItem,
} from "./platform-types";

export interface ReputationRow {
  userId: string;
  name: string;
  state: string;
  score: number;
  acceptedCredentials: number;
  activeBonds: number;
  originatedOffers: number;
  disputesAgainst: number;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function computeReputationScores(
  users: UserListItem[],
  offers: OfferListItem[],
  bonds: BondListItem[],
  credentials: CredentialListItem[],
  redeems: RedeemListItem[],
  disputes: DisputeListItem[],
): ReputationRow[] {
  const offerMap = new Map(offers.map((offer) => [offer.id, offer]));
  const redeemMap = new Map(redeems.map((redeem) => [redeem.id, redeem]));

  return users
    .map((user) => {
      const acceptedCredentials = credentials.filter(
        (credential) => credential.userId === user.id && credential.status === "accepted",
      ).length;
      const activeBonds = bonds.filter(
        (bond) => bond.userId === user.id && bond.state === "locked",
      ).length;
      const originatedOffers = offers.filter(
        (offer) => offer.producerId === user.id,
      ).length;
      const disputesAgainst = disputes.filter((dispute) => {
        const redeem = redeemMap.get(dispute.redeemId);
        const offer = redeem ? offerMap.get(redeem.offerId) : undefined;
        return offer?.producerId === user.id;
      }).length;

      const score = clampScore(
        55 + acceptedCredentials * 10 + activeBonds * 12 + originatedOffers * 6 - disputesAgainst * 18,
      );

      return {
        userId: user.id,
        name: user.name ?? user.email,
        state: user.state,
        score,
        acceptedCredentials,
        activeBonds,
        originatedOffers,
        disputesAgainst,
      };
    })
    .sort((left, right) => right.score - left.score);
}
