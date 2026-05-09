export type VehicleTypePageConfig = {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
};

export const VEHICLE_TYPE_PAGES: Record<string, VehicleTypePageConfig> = {
  makina: {
    slug: "makina",
    title: "Makina për shitje",
    metaTitle: "Makina në shitje në Shqipëri | Motivo",
    description:
      "Shfleto makina të përdorura dhe të reja në shitje në Shqipëri. Filtrim sipas markës, modelit, çmimit, kilometrazhit dhe më shumë në Motivo.",
  },
  motocikleta: {
    slug: "motocikleta",
    title: "Motoçikleta për shitje",
    metaTitle: "Motoçikleta në shitje në Shqipëri | Motivo",
    description:
      "Shfleto motoçikleta të përdorura dhe të reja në shitje në Shqipëri. Filtrim sipas markës, modelit, çmimit, kilometrazhit dhe më shumë në Motivo.",
  },
  furgona: {
    slug: "furgona",
    title: "Furgona për shitje",
    metaTitle: "Furgona në shitje në Shqipëri | Motivo",
    description:
      "Shfleto furgona të përdorur dhe të rinj në shitje në Shqipëri. Filtrim sipas markës, modelit, çmimit, kilometrazhit dhe më shumë në Motivo.",
  },
  varka: {
    slug: "varka",
    title: "Varka për shitje",
    metaTitle: "Varka në shitje në Shqipëri | Motivo",
    description:
      "Shfleto varka në shitje në Shqipëri. Filtrim sipas markës, modelit dhe çmimit në Motivo.",
  },
  kamione: {
    slug: "kamione",
    title: "Kamionë për shitje",
    metaTitle: "Kamionë në shitje në Shqipëri | Motivo",
    description:
      "Shfleto kamionë të përdorur dhe të rinj në shitje në Shqipëri. Filtrim sipas markës, modelit, çmimit dhe më shumë në Motivo.",
  },
};

export function getVehicleTypePageConfig(
  slug: string,
): VehicleTypePageConfig | undefined {
  return VEHICLE_TYPE_PAGES[slug.toLowerCase()];
}
