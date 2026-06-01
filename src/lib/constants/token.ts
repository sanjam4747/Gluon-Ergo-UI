import { tokenConfig } from "@/config/tokenConfig";
import { getProtocolTokenIds } from "@/lib/constants/sdkConfig";

// Token IDs are resolved at module load time from the correct protocol constants
// (GLUON_GOLD or GLUON_DOLLAR) depending on NEXT_PUBLIC_PROTOCOL_NAME.
const _ids = getProtocolTokenIds();

export const TOKEN_ADDRESS = {
  decimals: 9,
  // Stable asset (Neutron) token address
  stableAsset: _ids.stableAsset,
  // Volatile asset (Proton) token address
  volatileAsset: _ids.volatileAsset,
  // Legacy keys for backward compatibility
  gau: _ids.gau,
  gauc: _ids.gauc,
};

// Protocol-driven action type keys to support dynamic peg assets
const pegType = tokenConfig.peg.type.toLowerCase().replace(/\s+/g, "-");
export const ACTION_TYPES = {
  FISSION: "fission",
  FUSION: "fusion",
  TRANSMUTE_TO_PEG: `transmute-to-${pegType}`,
  TRANSMUTE_FROM_PEG: `transmute-from-${pegType}`,
} as const;

export type ActionType = (typeof ACTION_TYPES)[keyof typeof ACTION_TYPES];
