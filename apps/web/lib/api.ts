import "server-only";

import {
  type AmmPoolListItem,
  type AuditListItem,
  type BondListItem,
  type CredentialListItem,
  type DisputeListItem,
  type MarketSummary,
  type OfferDetail,
  type OfferListItem,
  type OracleListItem,
  type ProofDetail,
  type ProofListItem,
  type RedeemListItem,
  type UserListItem
} from "./platform-types";
import { API_URL, buildOperatorHeaders } from "./platform-server";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: buildOperatorHeaders(),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`VALYRIA API request failed for ${path} with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

async function getCollection<T>(path: string): Promise<T[]> {
  const response = await fetchJson<{ items: T[] }>(path);
  return response.items;
}

export async function getMarketSummary(): Promise<MarketSummary> {
  return fetchJson("/api/market/summary");
}

export async function getCredentials(): Promise<CredentialListItem[]> {
  return getCollection("/api/credentials");
}

export async function getAmmPools(): Promise<AmmPoolListItem[]> {
  return getCollection("/api/amm/pools");
}

export async function getBonds(): Promise<BondListItem[]> {
  return getCollection("/api/bonds");
}

export async function getUsers(): Promise<UserListItem[]> {
  return getCollection("/api/onboarding/users");
}

export async function getOffers(): Promise<OfferListItem[]> {
  return getCollection("/api/offers");
}

export async function getOfferDetails(offerId: string): Promise<OfferDetail> {
  return fetchJson(`/api/offers/${offerId}`);
}

export async function getOracles(): Promise<OracleListItem[]> {
  return getCollection("/api/oracles");
}

export async function getProofs(): Promise<ProofListItem[]> {
  return getCollection("/api/proofs");
}

export async function getProofDetails(proofId: string): Promise<ProofDetail> {
  return fetchJson(`/api/proofs/${proofId}`);
}

export async function getDisputes(): Promise<DisputeListItem[]> {
  return getCollection("/api/disputes");
}

export async function getAuditLogs(): Promise<AuditListItem[]> {
  return getCollection("/api/audit");
}

export async function getRedeems(): Promise<RedeemListItem[]> {
  return getCollection("/api/redeems");
}
