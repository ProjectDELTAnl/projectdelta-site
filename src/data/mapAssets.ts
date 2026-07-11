import type { MapAssetVariant } from "./types.ts";
import { version as runtimeAssetVersion } from "../generated/map-assets/runtime-asset-manifest.json";

export const mapAssetVersion = runtimeAssetVersion;

export type ResponsiveMapAsset = {
  src: string;
  srcset?: string;
  sizes?: string;
  width: number;
  height: number;
};

const mapFiles: Record<MapAssetVariant, ResponsiveMapAsset> = {
  ambient: createAsset("thermal-map-ambient.webp", 900, 1050),
  dossier: createAsset("thermal-map-dossier.webp", 1200, 1400),
  hero: createAsset("thermal-map-hero-runtime.webp", 900, 1050),
  scanner: createResponsiveAsset(
    "thermal-map-scanner-base-480.webp",
    "thermal-map-scanner-base-960.webp",
  ),
};

const detailMapFiles: Record<MapAssetVariant, ResponsiveMapAsset> = {
  ambient: createAsset("thermal-map-ambient-detail.png", 750, 875),
  dossier: createAsset("thermal-map-dossier-detail.png", 1000, 1167),
  hero: createAsset("thermal-map-hero-detail.png", 1200, 1400),
  scanner: createResponsiveAsset(
    "thermal-map-scanner-detail-480.png",
    "thermal-map-scanner-detail-960.png",
  ),
};

export function versionedAsset(path: string) {
  return `${path}?v=${mapAssetVersion}`;
}

export function thermalMapAsset(variant: MapAssetVariant) {
  return mapFiles[variant].src;
}

export function thermalMapDetailAsset(variant: MapAssetVariant) {
  return detailMapFiles[variant].src;
}

export function thermalMapAssetDefinition(variant: MapAssetVariant) {
  return mapFiles[variant];
}

export function thermalMapDetailAssetDefinition(variant: MapAssetVariant) {
  return detailMapFiles[variant];
}

export const thermalMapMaskUrl = versionedAsset(
  "/assets/generated/thermal-map-land-mask-runtime.png",
);

function createAsset(
  fileName: string,
  width: number,
  height: number,
): ResponsiveMapAsset {
  return {
    src: versionedAsset(`/assets/generated/${fileName}`),
    width,
    height,
  };
}

function createResponsiveAsset(
  smallFileName: string,
  largeFileName: string,
): ResponsiveMapAsset {
  const small = versionedAsset(`/assets/generated/${smallFileName}`);
  const large = versionedAsset(`/assets/generated/${largeFileName}`);
  return {
    src: small,
    srcset: `${small} 480w, ${large} 960w`,
    sizes: "(max-width: 920px) calc(100vw - 60px), 480px",
    width: 480,
    height: 560,
  };
}
