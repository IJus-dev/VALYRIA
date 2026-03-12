import { deriveKeypair, deriveAddress, sign } from "ripple-keypairs";

const BASE = "http://localhost:3000";
const seed = "sEdT96fpRdyjhcpNatvE3YAjwX9sbUr";

async function login() {
  const keypair = deriveKeypair(seed);
  const walletAddress = deriveAddress(keypair.publicKey);
  console.log("Wallet:", walletAddress);

  // 1. Challenge
  const challengeRes = await fetch(`${BASE}/api/auth/wallet-challenge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress }),
  });
  if (!challengeRes.ok) {
    console.log("FAIL challenge:", await challengeRes.text());
    return null;
  }
  const challenge = await challengeRes.json();
  console.log("Challenge OK:", challenge.challengeId);

  // 2. Sign
  const msgHex = Buffer.from(challenge.message, "utf8").toString("hex").toUpperCase();
  const signature = sign(msgHex, keypair.privateKey);

  // 3. Verify
  const verifyRes = await fetch(`${BASE}/api/auth/wallet-verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      challengeId: challenge.challengeId,
      signature,
      publicKey: keypair.publicKey,
      userId: challenge.userId,
    }),
  });
  if (!verifyRes.ok) {
    console.log("FAIL verify:", await verifyRes.text());
    return null;
  }
  console.log("Verify OK");

  // 4. Get CSRF
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const csrfCookies = csrfRes.headers.getSetCookie();
  const csrfData = await csrfRes.json();
  const cookieJar = csrfCookies.map((c) => c.split(";")[0]).join("; ");

  // 5. SignIn
  const signInRes = await fetch(`${BASE}/api/auth/callback/wallet`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieJar,
    },
    body: new URLSearchParams({
      walletAddress,
      userId: challenge.userId,
      csrfToken: csrfData.csrfToken,
    }).toString(),
    redirect: "manual",
  });

  const allCookies = [...csrfCookies, ...signInRes.headers.getSetCookie()];
  const sessionStr = allCookies.map((c) => c.split(";")[0]).join("; ");
  console.log("SignIn status:", signInRes.status, "→", signInRes.headers.get("location"));
  return sessionStr;
}

async function testPage(name, path, cookies) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Cookie: cookies },
      redirect: "manual",
    });
    const status = res.status;
    let result = "OK";
    if (status >= 300 && status < 400) {
      result = `REDIRECT → ${res.headers.get("location")}`;
    } else if (status >= 400) {
      result = `ERROR ${status}`;
    }
    console.log(`  ${name.padEnd(22)} ${path.padEnd(28)} ${status} ${result}`);
    return status;
  } catch (err) {
    console.log(`  ${name.padEnd(22)} ${path.padEnd(28)} FAIL ${err.message}`);
    return 0;
  }
}

async function main() {
  console.log("\n=== WALLET LOGIN ===");
  const cookies = await login();
  if (!cookies) {
    console.log("Login failed, aborting.");
    process.exit(1);
  }

  console.log("\n=== TESTING ALL PAGES ===\n");

  const pages = [
    ["Landing", "/"],
    ["Login", "/login"],
    ["Dashboard", "/dashboard"],
    ["Onboarding", "/onboarding"],
    ["Market", "/market"],
    ["Bond Vault", "/bond-vault"],
    ["Wallet", "/wallet"],
    ["Redeems", "/redeems"],
    ["Disputes", "/disputes"],
    ["Proofs", "/proofs"],
    ["Oracles", "/oracles"],
    ["Analytics", "/analytics"],
    ["Notifications", "/notifications"],
    ["Reputation", "/reputation"],
    ["Governance", "/governance"],
    ["Admin Offers", "/admin/offers"],
    ["New Offer", "/offers/new"],
  ];

  let passed = 0;
  let failed = 0;

  for (const [name, path] of pages) {
    const status = await testPage(name, path, cookies);
    if (status === 200) passed++;
    else failed++;
  }

  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);

  // Test API endpoints directly
  console.log("\n=== API ENDPOINTS ===\n");
  const apiBase = "http://localhost:4000";
  const headers = {
    "x-valyria-internal-token": "valyria-local-internal-token",
    "x-valyria-user-id": "test",
  };

  const endpoints = [
    "/api/market/summary",
    "/api/users",
    "/api/bonds",
    "/api/offers",
    "/api/credentials",
    "/api/proofs",
    "/api/oracles",
    "/api/redeems",
    "/api/disputes",
    "/api/audit-logs",
    "/api/amm/pools",
    "/api/reputation/scores",
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`${apiBase}${ep}`, { headers });
      const data = await res.json();
      const count = Array.isArray(data) ? data.length : "obj";
      console.log(`  ${ep.padEnd(30)} ${res.status} (${count} items)`);
    } catch (err) {
      console.log(`  ${ep.padEnd(30)} FAIL ${err.message}`);
    }
  }

  // Test offer detail page with a real offer ID
  console.log("\n=== DETAIL PAGES ===\n");
  try {
    const offersRes = await fetch(`${apiBase}/api/offers`, { headers });
    const offers = await offersRes.json();
    if (offers.length > 0) {
      await testPage("Offer Detail", `/offers/${offers[0].id}`, cookies);
    }
    const proofsRes = await fetch(`${apiBase}/api/proofs`, { headers });
    const proofs = await proofsRes.json();
    if (proofs.length > 0) {
      await testPage("Proof Detail", `/proofs/${proofs[0].id}`, cookies);
    }
  } catch (err) {
    console.log("  Detail page test error:", err.message);
  }

  // Test wallet login E2E
  console.log("\n=== WALLET LOGIN FLOW ===\n");
  const kp2 = deriveKeypair(seed);
  const addr2 = deriveAddress(kp2.publicKey);
  const chRes = await fetch(`${BASE}/api/auth/wallet-challenge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress: addr2 }),
  });
  console.log("  Challenge endpoint:", chRes.status === 200 ? "OK" : `FAIL ${chRes.status}`);

  const chData = await chRes.json();
  const sig = sign(
    Buffer.from(chData.message, "utf8").toString("hex").toUpperCase(),
    kp2.privateKey
  );
  const vRes = await fetch(`${BASE}/api/auth/wallet-verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      challengeId: chData.challengeId,
      signature: sig,
      publicKey: kp2.publicKey,
      userId: chData.userId,
    }),
  });
  const vData = await vRes.json();
  console.log("  Verify endpoint:", vRes.status === 200 ? "OK" : `FAIL ${vRes.status}`);
  console.log("  User state:", vData.user?.state);

  console.log("\n=== E2E COMPLETE ===");
}

main().catch(console.error);
