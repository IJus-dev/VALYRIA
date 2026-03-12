import { NextResponse } from "next/server";
import { getBonds, getCredentials, getDisputes, getOffers, getRedeems, getUsers } from "@/lib/api";
import { computeReputationScores } from "@/lib/reputation";

export const dynamic = "force-dynamic";

export async function GET() {
  const [users, offers, bonds, credentials, redeems, disputes] = await Promise.all([
    getUsers(),
    getOffers(),
    getBonds(),
    getCredentials(),
    getRedeems(),
    getDisputes(),
  ]);

  const scores = computeReputationScores(users, offers, bonds, credentials, redeems, disputes);

  return NextResponse.json({ items: scores });
}
