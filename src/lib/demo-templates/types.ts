export type TemplateManifestEntry = {
  id: string;
  name: string;
  sourceUrl: string;
  category: string;
  niches: string[];
  file: string;
  bytes: number;
};

export type TemplateSource = {
  id: string;
  name: string;
  url: string;
  niches: string[];
  replace: Record<string, string>;
};

export type DemoTemplateVars = Record<string, string>;
