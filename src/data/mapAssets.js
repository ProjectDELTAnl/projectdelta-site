export const mapAssetVersion = "20260704-mapraster-1";

const mapFiles = {
  ambient: "thermal-map-ambient.webp",
  dossier: "thermal-map-dossier.webp",
  hero: "thermal-map-hero.webp",
  scanner: "thermal-map-scanner-base.webp",
};

export function versionedAsset(path) {
  return `${path}?v=${mapAssetVersion}`;
}

export function thermalMapAsset(variant) {
  const fileName = mapFiles[variant] ?? mapFiles.hero;
  return versionedAsset(`/assets/generated/${fileName}`);
}

export const thermalMapMaskUrl = versionedAsset(
  "/assets/generated/thermal-map-land-mask.png",
);
