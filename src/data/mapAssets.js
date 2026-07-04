export const mapAssetVersion = "20260704-mapmotion-1";

const mapFiles = {
  ambient: "thermal-map-ambient.svg",
  dossier: "thermal-map-dossier.svg",
  hero: "thermal-map-hero.svg",
  scanner: "thermal-map-scanner-base.svg",
};

export function versionedAsset(path) {
  return `${path}?v=${mapAssetVersion}`;
}

export function thermalMapAsset(variant) {
  const fileName = mapFiles[variant] ?? mapFiles.hero;
  return versionedAsset(`/assets/generated/${fileName}`);
}

export const thermalMapMaskUrl = versionedAsset(
  "/assets/generated/thermal-map-land-mask.svg",
);
