import type { Dictionary } from "../types";

export const en: Dictionary = {
  // Nav
  "nav.problem": "The problem",
  "nav.howItWorks": "How it works",
  "nav.protocol": "Protocol",
  "nav.docs": "Docs",

  // Footer
  "footer.tagline": "XRPL-native agricultural derivatives. From field to contract, from contract to delivery.",
  "footer.protocol": "Protocol",
  "footer.assets": "Assets",
  "footer.documentation": "Documentation",
  "footer.copyright": "2026 VALYRIA. All rights reserved.",
  "footer.resources": "Resources",

  // Hero
  "hero.h1.line1": "Harvest becomes asset.",
  "hero.h1.line2": "Asset becomes market.",
  "hero.body": "A soy producer in Mato Grosso documents the lot, locks collateral in VEX and lists on the market. A buyer in S\u00e3o Paulo sees the report, field photos, price and deadline. Buys directly on XRPL, no cooperative, no trading desk, no broker. At maturity, requests delivery and receives the real product.",
  "hero.cta1": "Understand the protocol",
  "hero.cta2": "How it works",

  // Problems
  "problems.eyebrow": "The problem",
  "problems.heading": "Agriculture moves $8 trillion per year. Small producers are left out.",
  "problems.1.title": "Expensive intermediation",
  "problems.1.body": "Cooperative, trading desk, broker, bank. Everyone takes a cut. The producer who planted the soy receives less, the buyer who needs it pays more. The margin disappears along the way.",
  "problems.2.title": "Closed market",
  "problems.2.body": "A producer in rural Mato Grosso sells to whoever shows up at the door. No access to buyers from SP, MG, or exporters. Liquidity dies in the region and the price is whatever they can get.",
  "problems.3.title": "Zero transparency",
  "problems.3.body": "Buyer doesn't see the report, doesn't see field photos, doesn't know real productivity. Producer doesn't know who wants to buy or at what price. Both operate in the dark.",

  // Statement
  "statement": "VALYRIA tokenizes future harvests on XRPL. The producer issues a contract with technical report, GPS, photos and productivity history. The buyer analyzes everything on-chain before entering. Price is discovered by the market \u2014 order book, AMM with real-time price oracles, settlement in seconds. At maturity, the contract becomes a tracked physical delivery. Dispute? The DAO resolves it.",

  // Metrics
  "metrics.1.value": "$8 tri",
  "metrics.1.label": "Global agriculture market",
  "metrics.2.value": "3\u20135s",
  "metrics.2.label": "Settlement on XRPL",
  "metrics.3.value": "$150 bi",
  "metrics.3.label": "Agricultural derivatives on B3",
  "metrics.4.value": "2026",
  "metrics.4.label": "UDAX Program",

  // How it works
  "howItWorks.eyebrow": "How it works",
  "howItWorks.heading": "From field to contract, from contract to physical delivery.",
  "howItWorks.step1.title": "Onboarding",
  "howItWorks.step1.desc": "Facial KYC, documents, land ownership proof",
  "howItWorks.step2.title": "Documentation",
  "howItWorks.step2.desc": "Report, GPS, photos, history + VEX collateral",
  "howItWorks.step3.title": "Token issued",
  "howItWorks.step3.desc": "Semi-fungible token on XRPL order book",
  "howItWorks.step4.title": "Market",
  "howItWorks.step4.desc": "Order book, AMM, real-time price oracles",
  "howItWorks.step5.title": "Delivery",
  "howItWorks.step5.desc": "Redeem, bilateral escrow, token burned",

  // Producer steps
  "producer.heading": "What the producer does",
  "producer.1": "Registers with facial recognition and documentation",
  "producer.2": "Submits harvest proofs: reports, GPS, photos, history",
  "producer.3": "Acquires VEX and locks minimum 10% as collateral",
  "producer.4": "Creates offer: commodity, quantity, price, deadline",
  "producer.5": "Semi-fungible token is issued automatically",
  "producer.6": "Tracks orders and receives bids on the book",

  // Buyer steps
  "buyer.heading": "What the buyer does",
  "buyer.1": "Registers and acquires VEX to operate",
  "buyer.2": "Browses the book by commodity, price, deadline and reputation",
  "buyer.3": "Accepts the listed price or proposes a bid",
  "buyer.4": "Holds the token until maturity or resells on secondary market",
  "buyer.5": "At maturity, requests delivery and confirms receipt",

  // Settlement
  "settlement.eyebrow": "Settlement",
  "settlement.heading": "What happens at maturity.",
  "settlement.step1": "Deal closed",
  "settlement.step2": "Bilateral escrow",
  "settlement.step3": "Physical delivery",
  "settlement.step4": "Confirmation",
  "settlement.step5": "Token burned",
  "settlement.step6": "Payment released",
  "settlement.dispute": "Problem with delivery? The",
  "settlement.dao": "DAO governance",
  "settlement.disputeEnd": "mechanism is triggered. VEX staking holders vote on the resolution. Penalty via slashing proportional to the offender's stake.",

  // Assets
  "assets.eyebrow": "Protocol assets",
  "assets.heading": "The four protocol assets and what each one does.",
  "assets.vex": "Protocol utility token. Producer locks as collateral (minimum 10% of lot), buyer pays transaction fee, holder stakes and votes in the DAO. Dynamic minting and burning keep the price stable.",
  "assets.series": "Semi-fungible token representing a commodity lot. Carries product, region, harvest, grade and maturity date. Can be traded on the XRPL native DEX or swapped for tokens of other commodities via AMM.",
  "assets.seriesTitle": "Series",
  "assets.proof": "NFT that anchors all lot documentation: technical report, geolocated photos, planting records, GPS coordinates, productivity history. Stored on IPFS. Verifiable by any buyer.",
  "assets.redeem": "The physical delivery mechanism. Buyer opens a request, bilateral escrow locks tokens and values, producer delivers with tracking, buyer confirms receipt. Token burned, payment released.",

  // For whom
  "forWhom.eyebrow": "For whom",
  "forWhom.heading": "Three profiles operate on VALYRIA.",
  "forWhom.producers.title": "Producers",
  "forWhom.producers.body": "Medium and small producers who today have no access to hedging or early commercialization. Documents the lot with reports and GPS, locks collateral in VEX and sells to buyers from anywhere in the country.",
  "forWhom.buyers.title": "Buyers and investors",
  "forWhom.buyers.body": "Analyzes technical report, geolocated photos, producer history and real-time price. Buys the token and holds until delivery or resells on the secondary market whenever they want.",
  "forWhom.lps.title": "Liquidity providers",
  "forWhom.lps.body": "Deposits token pairs in AMM pools (e.g. VEX/MLH) and receives proportional fees from each transaction. The AMM ensures counterparty even in low-volume markets.",

  // Team
  "team.eyebrow": "Team",
  "team.heading": "Who builds VALYRIA.",

  // UDAX
  "udax.eyebrow": "Program",
  "udax.heading": "UDAX 2026 participants.",
  "udax.description": "UDAX is Ripple's accelerator for startups building on XRPL. The 2026 edition is with FGV: eight weeks of mentorship with Ripple engineers, FGV professors and access to investors focused on digital assets. Ends with Demo Day at Ripple's office in S\u00e3o Paulo.",
  "udax.link": "Program details",
  "udax.ripple": "Technical mentorship from XRPL builders.",
  "udax.fgv": "Structured program and FGV Digital Finance academic network.",
  "udax.demoDay": "Pitch to investors at Ripple SP. June 2026.",
  "udax.vcNetwork": "Direct access to funds investing in XRPL.",

  // CTA
  "cta.h2.line1": "The agricultural market will change.",
  "cta.h2.line2": "The question is when.",
  "cta.body": "VALYRIA is being built in the UDAX 2026 program with mentorship from Ripple and FGV. Demo Day in June at Ripple's office in SP.",
  "cta.button": "Documentation",
};
