import "dotenv/config";
import {
  AccountSetAsfFlags,
  Client,
  Wallet,
  convertStringToHex,
  type AccountSet,
  type DepositPreauth,
  type Payment,
  type TrustSet
} from "xrpl";

const TRUSTLINE_LIMIT = "1000000";
const INITIAL_VEX_BALANCE = "50000";
const REQUIRED_CREDENTIAL_TYPES = ["KYCApproved", "ProducerApproved"] as const;

interface NamedWallet {
  label: string;
  address: string;
  wallet: Wallet;
}

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable ${name}.`);
  }

  return value.trim();
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    return undefined;
  }

  return value.trim();
}

function loadWallet(label: string, addressEnv: string, seedEnv: string): NamedWallet {
  const address = requireEnv(addressEnv);
  const seed = requireEnv(seedEnv);
  const wallet = Wallet.fromSeed(seed);

  if (wallet.classicAddress !== address) {
    throw new Error(
      `${label} address ${address} does not match the address derived from ${seedEnv} (${wallet.classicAddress}).`
    );
  }

  return {
    label,
    address,
    wallet
  };
}

function loadOptionalWallet(label: string, addressEnv: string, seedEnv: string): NamedWallet | undefined {
  const address = optionalEnv(addressEnv);
  const seed = optionalEnv(seedEnv);

  if (!address && !seed) {
    return undefined;
  }

  if (!address || !seed) {
    throw new Error(`Both ${addressEnv} and ${seedEnv} must be provided together for ${label}.`);
  }

  const wallet = Wallet.fromSeed(seed);

  if (wallet.classicAddress !== address) {
    throw new Error(
      `${label} address ${address} does not match the address derived from ${seedEnv} (${wallet.classicAddress}).`
    );
  }

  return {
    label,
    address,
    wallet
  };
}

async function submitAndWait(
  client: Client,
  transaction: AccountSet | DepositPreauth | Payment | TrustSet,
  wallet: Wallet,
  label: string
): Promise<{ hash: string; ledgerIndex?: number }> {
  const response = await client.submitAndWait(transaction, {
    wallet
  });
  const meta =
    typeof response.result.meta === "object" && response.result.meta !== null
      ? response.result.meta
      : undefined;
  const transactionResult = meta?.TransactionResult;

  if (transactionResult !== "tesSUCCESS") {
    throw new Error(`${label} failed with ${transactionResult ?? "undefined"}.`);
  }

  return {
    hash: response.result.hash,
    ...(typeof response.result.ledger_index === "number"
      ? { ledgerIndex: response.result.ledger_index }
      : {})
  };
}

async function ensureDepositAuth(client: Client, bondVault: NamedWallet): Promise<void> {
  const accountInfo = await client.request({
    command: "account_info",
    ledger_index: "validated",
    account: bondVault.address
  });

  if (accountInfo.result.account_flags?.depositAuth) {
    console.log(`[ok] DepositAuth already enabled for ${bondVault.label}.`);
    return;
  }

  const transaction: AccountSet = {
    TransactionType: "AccountSet",
    Account: bondVault.address,
    SetFlag: AccountSetAsfFlags.asfDepositAuth
  };
  const receipt = await submitAndWait(client, transaction, bondVault.wallet, "Enable DepositAuth");

  console.log(
    `[tx] DepositAuth enabled for ${bondVault.label}. hash=${receipt.hash} ledger=${receipt.ledgerIndex ?? "n/a"}`
  );
}

async function ensureDefaultRipple(client: Client, coldIssuer: NamedWallet): Promise<void> {
  const accountInfo = await client.request({
    command: "account_info",
    ledger_index: "validated",
    account: coldIssuer.address
  });

  if (accountInfo.result.account_flags?.defaultRipple) {
    console.log(`[ok] DefaultRipple already enabled for ${coldIssuer.label}.`);
    return;
  }

  const transaction: AccountSet = {
    TransactionType: "AccountSet",
    Account: coldIssuer.address,
    SetFlag: AccountSetAsfFlags.asfDefaultRipple
  };
  const receipt = await submitAndWait(client, transaction, coldIssuer.wallet, "Enable DefaultRipple");

  console.log(
    `[tx] DefaultRipple enabled for ${coldIssuer.label}. hash=${receipt.hash} ledger=${receipt.ledgerIndex ?? "n/a"}`
  );
}

async function ensureTrustLine(
  client: Client,
  account: NamedWallet,
  coldIssuer: NamedWallet,
  label: string
): Promise<void> {
  const lines = await client.request({
    command: "account_lines",
    ledger_index: "validated",
    account: account.address,
    peer: coldIssuer.address
  });
  const existing = lines.result.lines.find((line) => line.currency === "VEX");

  if (existing && Number(existing.limit) >= Number(TRUSTLINE_LIMIT) && !existing.no_ripple) {
    console.log(`[ok] ${label} trustline for VEX already present with limit ${existing.limit}.`);
    return;
  }

  const transaction: TrustSet = {
    TransactionType: "TrustSet",
    Account: account.address,
    LimitAmount: {
      currency: "VEX",
      issuer: coldIssuer.address,
      value: TRUSTLINE_LIMIT
    },
    Flags: {
      tfClearNoRipple: true
    }
  };
  const receipt = await submitAndWait(client, transaction, account.wallet, `Create ${label} VEX trustline`);

  console.log(`[tx] ${label} trustline upserted. hash=${receipt.hash} ledger=${receipt.ledgerIndex ?? "n/a"}`);
}

async function ensureUserBalance(
  client: Client,
  account: NamedWallet,
  coldIssuer: NamedWallet
): Promise<void> {
  const balances = await client.getBalances(account.address, {
    ledger_index: "validated",
    peer: coldIssuer.address
  });
  const vexBalance = balances.find(
    (balance) => balance.currency === "VEX" && balance.issuer === coldIssuer.address
  );

  if (vexBalance && Number(vexBalance.value) >= Number(INITIAL_VEX_BALANCE)) {
    console.log(`[ok] ${account.label} already has ${vexBalance.value} VEX from cold issuer.`);
    return;
  }

  const transaction: Payment = {
    TransactionType: "Payment",
    Account: coldIssuer.address,
    Destination: account.address,
    Amount: {
      currency: "VEX",
      issuer: coldIssuer.address,
      value: INITIAL_VEX_BALANCE
    }
  };
  const receipt = await submitAndWait(client, transaction, coldIssuer.wallet, "Issue VEX to user");

  console.log(
    `[tx] Issued ${INITIAL_VEX_BALANCE} VEX to ${account.label}. hash=${receipt.hash} ledger=${receipt.ledgerIndex ?? "n/a"}`
  );
}

async function ensureIssuerRippleToCounterparty(
  client: Client,
  coldIssuer: NamedWallet,
  counterparty: NamedWallet,
  label: string
): Promise<void> {
  const lines = await client.request({
    command: "account_lines",
    ledger_index: "validated",
    account: coldIssuer.address,
    peer: counterparty.address
  });
  const existing = lines.result.lines.find((line) => line.currency === "VEX");

  if (existing && !existing.no_ripple) {
    console.log(`[ok] ${coldIssuer.label} already allows ripple toward ${label}.`);
    return;
  }

  const transaction: TrustSet = {
    TransactionType: "TrustSet",
    Account: coldIssuer.address,
    LimitAmount: {
      currency: "VEX",
      issuer: counterparty.address,
      value: "0"
    },
    Flags: {
      tfClearNoRipple: true
    }
  };
  const receipt = await submitAndWait(
    client,
    transaction,
    coldIssuer.wallet,
    `Clear issuer NoRipple toward ${label}`
  );

  console.log(
    `[tx] ${coldIssuer.label} ripple enabled toward ${label}. hash=${receipt.hash} ledger=${receipt.ledgerIndex ?? "n/a"}`
  );
}

function hasCredentialPreauth(
  accountObjects: Array<{
    LedgerEntryType?: string;
    AuthorizeCredentials?: Array<{
      Credential?: {
        Issuer?: string;
        CredentialType?: string;
      };
    }>;
  }>,
  issuer: string,
  credentialType: string
): boolean {
  return accountObjects.some((object) => {
    if (object.LedgerEntryType !== "DepositPreauth") {
      return false;
    }

    return (object.AuthorizeCredentials ?? []).some((credential) => {
      return (
        credential.Credential?.Issuer === issuer &&
        credential.Credential?.CredentialType?.toUpperCase() === credentialType
      );
    });
  });
}

async function ensureCredentialPreauth(
  client: Client,
  bondVault: NamedWallet,
  kycIssuer: NamedWallet
): Promise<void> {
  const accountObjects = await client.request({
    command: "account_objects",
    ledger_index: "validated",
    account: bondVault.address,
    type: "deposit_preauth"
  });
  const requiredCredentials = REQUIRED_CREDENTIAL_TYPES.map((kind) => ({
    kind,
    credentialType: convertStringToHex(kind).toUpperCase()
  }));
  const missing = requiredCredentials.filter(
    (item) =>
      !hasCredentialPreauth(accountObjects.result.account_objects, kycIssuer.address, item.credentialType)
  );

  if (missing.length === 0) {
    console.log(`[ok] Bond vault already preauthorizes all required credentials.`);
    return;
  }

  const transaction: DepositPreauth = {
    TransactionType: "DepositPreauth",
    Account: bondVault.address,
    AuthorizeCredentials: missing.map((item) => ({
      Credential: {
        Issuer: kycIssuer.address,
        CredentialType: item.credentialType
      }
    }))
  };
  const receipt = await submitAndWait(
    client,
    transaction,
    bondVault.wallet,
    "Authorize credentials on bond vault"
  );

  console.log(
    `[tx] Bond vault preauthorized ${missing.map((item) => item.kind).join(", ")}. hash=${receipt.hash} ledger=${receipt.ledgerIndex ?? "n/a"}`
  );
}

async function main(): Promise<void> {
  const client = new Client(requireEnv("XRPL_WS_URL"));
  const kycIssuer = loadWallet("kyc issuer", "XRPL_KYC_ISSUER", "XRPL_KYC_ISSUER_SEED");
  const oraclePublisher = loadWallet(
    "oracle publisher",
    "XRPL_ORACLE_PUBLISHER",
    "XRPL_ORACLE_PUBLISHER_SEED"
  );
  const coldIssuer = loadWallet("cold issuer", "XRPL_COLD_ISSUER", "XRPL_COLD_ISSUER_SEED");
  const bondVault = loadWallet("bond vault", "XRPL_BOND_VAULT", "XRPL_BOND_VAULT_SEED");
  const user = loadWallet("test user", "XRPL_TEST_USER_WALLET", "XRPL_TEST_USER_WALLET_SEED");
  const buyer = loadOptionalWallet(
    "test buyer",
    "XRPL_TEST_BUYER_WALLET",
    "XRPL_TEST_BUYER_WALLET_SEED"
  );

  console.log(`[setup] Connecting to ${requireEnv("XRPL_WS_URL")}...`);
  await client.connect();

  try {
    console.log(`[wallet] user=${user.address}`);
    console.log(`[wallet] kycIssuer=${kycIssuer.address}`);
    console.log(`[wallet] oraclePublisher=${oraclePublisher.address}`);
    console.log(`[wallet] coldIssuer=${coldIssuer.address}`);
    console.log(`[wallet] bondVault=${bondVault.address}`);
    if (buyer) {
      console.log(`[wallet] buyer=${buyer.address}`);
    }

    await ensureDepositAuth(client, bondVault);
    await ensureDefaultRipple(client, coldIssuer);
    await ensureTrustLine(client, user, coldIssuer, "user");
    await ensureTrustLine(client, bondVault, coldIssuer, "bond vault");
    await ensureIssuerRippleToCounterparty(client, coldIssuer, user, "user");
    await ensureIssuerRippleToCounterparty(client, coldIssuer, bondVault, "bond vault");
    await ensureUserBalance(client, user, coldIssuer);
    if (buyer) {
      await ensureTrustLine(client, buyer, coldIssuer, "buyer");
      await ensureIssuerRippleToCounterparty(client, coldIssuer, buyer, "buyer");
      await ensureUserBalance(client, buyer, coldIssuer);
    }
    await ensureCredentialPreauth(client, bondVault, kycIssuer);

    console.log("");
    console.log("[done] XRPL testnet bootstrap finished.");
    console.log("[next] Start with CredentialCreate for KYCApproved and ProducerApproved.");
    console.log("[next] Accept both credentials with the test user seed in the UI.");
    console.log("[next] Publish one oracle price and then create the bond deposit.");
  } finally {
    await client.disconnect();
  }
}

main().catch((error) => {
  console.error(`[error] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
