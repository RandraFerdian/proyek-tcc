export const PACKAGE_TYPES = [
  "Makanan Berat",
  "Minuman Sehat",
  "Cemilan Sehat",
  "Paket Diet",
  "Buah & Salad",
];

export const getPackageType = (pkg) => pkg?.type || "Makanan Berat";
