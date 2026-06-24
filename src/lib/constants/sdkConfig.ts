/**
 * SDK Protocol Config Factory
 *
 * Reads the NEXT_PUBLIC_PROTOCOL_NAME environment variable at runtime and
 * returns the matching `GLUON_GOLD` or `GLUON_DOLLAR` constant set from the SDK.
 *
 * Every place in the UI that creates a `new sdk.Gluon()` or reads token IDs
 * should import `getProtocolSdkConstants` / `createGluonInstance` from here
 * instead of hard-coding the Gold values.
 *
 * IMPORTANT — SDK quirk:
 *   GLUON_GOLD.NFT_ID === ORACLE_POOL_NFT (misnamed in the SDK).
 *   The actual Gluon box NFT for Gold is the flat `GLUON_NFT` export.
 *   For Gold we therefore use `new sdk.Gluon()` with no arguments (SDK defaults
 *   are already correct for Gold). Only Dollar needs a custom Config.
 */

import { GLUON_GOLD, GLUON_DOLLAR } from 'gluon-ergo-sdk';

// ---------------------------------------------------------------------------
// Protocol detection
// ---------------------------------------------------------------------------

/** Returns true when the current deployment is Gluon Dollar. */
export const isGluonDollar = (): boolean => {
  const name = process.env.NEXT_PUBLIC_PROTOCOL_NAME ?? '';
  return name.toLowerCase().includes('dollar');
};

// ---------------------------------------------------------------------------
// Raw SDK constants (NFT IDs, tree hashes, oracle info, token IDs …)
// ---------------------------------------------------------------------------

/**
 * Returns the SDK constant block (`GLUON_GOLD` or `GLUON_DOLLAR`) that
 * matches the current protocol deployment.
 */
export const getProtocolSdkConstants = () =>
  isGluonDollar() ? GLUON_DOLLAR : GLUON_GOLD;

// ---------------------------------------------------------------------------
// UI token IDs
// ---------------------------------------------------------------------------

/**
 * Returns the `stableAsset` / `volatileAsset` token IDs for the current
 * protocol, ready to be used anywhere balances or token filters are needed.
 */
export const getProtocolTokenIds = () => {
  const constants = getProtocolSdkConstants();
  return {
    stableAsset: constants.NEUTRON_ID,
    volatileAsset: constants.PROTON_ID,
    /** @deprecated use stableAsset */
    gau: constants.NEUTRON_ID,
    /** @deprecated use volatileAsset */
    gauc: constants.PROTON_ID,
  } as const;
};

// ---------------------------------------------------------------------------
// SDK Config object
// ---------------------------------------------------------------------------

/**
 * Convenience helper: dynamically imports the SDK, applies the correct
 * protocol config, and returns an initialised `Gluon` instance.
 *
 * - Gold: returns `new sdk.Gluon()` with NO custom Config — the SDK defaults
 *   are already calibrated for Gold so we do not touch them at all.
 * - Dollar: constructs a full `Config` from GLUON_DOLLAR constants.
 *
 * ```ts
 * const gluon = await createGluonInstance();
 * ```
 */
export const createGluonInstance = async () => {
  const sdk = await import('gluon-ergo-sdk');

  if (!isGluonDollar()) {
    // Gold: use SDK defaults completely unchanged — only override network/node
    // when the env vars are explicitly set. This is identical to the original
    // `new sdk.Gluon()` calls before we introduced this factory, so Gold
    // behaviour is 100% preserved.
    const gluon = new sdk.Gluon();
    gluon.config.NETWORK = process.env.NEXT_PUBLIC_DEPLOYMENT ?? 'mainnet';
    if (process.env.NEXT_PUBLIC_NODE) {
      gluon.config.NODE_URL = process.env.NEXT_PUBLIC_NODE;
    }
    return gluon;
  }

  // Dollar: build a full custom Config from GLUON_DOLLAR constants.
  // Note: GLUON_DOLLAR.NFT_ID is the actual Gluon box NFT for Dollar
  // (unlike GLUON_GOLD.NFT_ID which is misnamed and equals ORACLE_POOL_NFT).
  const c = GLUON_DOLLAR;
  const config = new sdk.Config(
    /* network          */ process.env.NEXT_PUBLIC_DEPLOYMENT ?? 'mainnet',
    /* minerFee         */ undefined,   // use SDK default (1 000 000)
    /* minBoxVal        */ undefined,   // use SDK default
    /* devTree          */ c.DEV_TREE,
    /* oracleFeeTree    */ c.ORACLE_FEE_TREE,
    /* oracleBuybackNft */ c.ORACLE_BUYBACK_NFT,
    /* oraclePoolNft    */ c.ORACLE_POOL_NFT,
    /* gluonNft         */ c.NFT_ID,
    /* neutronId        */ c.NEUTRON_ID,
    /* protonId         */ c.PROTON_ID,
    /* gluonTree        */ c.ERGO_TREE,
    /* devFee           */ undefined,   // use SDK default
    /* uiFee            */ undefined,   // use SDK default (0)
    /* oracleFee        */ undefined,   // use SDK default
    /* uiTree           */ '',
    /* minFee           */ undefined,   // use SDK default
    /* nodeUrl          */ process.env.NEXT_PUBLIC_NODE ?? 'https://node.sigmaspace.io/',
    /* oraclePriceDivisor */ 1,         // Dollar oracle: price is per 1 USD, no division
  );

  return new sdk.Gluon(config);
};
