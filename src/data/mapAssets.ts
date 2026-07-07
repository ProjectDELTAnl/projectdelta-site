import type { MapAssetVariant } from "./types.ts";

export const mapAssetVersion = "20260705-tactical-crt-1";

const mapFiles: Record<MapAssetVariant, string> = {
  ambient: "thermal-map-ambient.webp",
  dossier: "thermal-map-dossier.webp",
  hero: "thermal-map-hero.webp",
  scanner: "thermal-map-scanner-base.webp",
};

const detailMapFiles: Record<MapAssetVariant, string> = {
  ambient: "thermal-map-ambient-detail.png",
  dossier: "thermal-map-dossier-detail.png",
  hero: "thermal-map-hero-detail.png",
  scanner: "thermal-map-scanner-detail.png",
};

export function versionedAsset(path: string) {
  return `${path}?v=${mapAssetVersion}`;
}

export function thermalMapAsset(variant: MapAssetVariant) {
  const fileName = mapFiles[variant];
  return versionedAsset(`/assets/generated/${fileName}`);
}

export function thermalMapDetailAsset(variant: MapAssetVariant) {
  const fileName = detailMapFiles[variant];
  return versionedAsset(`/assets/generated/${fileName}`);
}

export const thermalMapMaskUrl = versionedAsset(
  "/assets/generated/thermal-map-land-mask.png",
);
