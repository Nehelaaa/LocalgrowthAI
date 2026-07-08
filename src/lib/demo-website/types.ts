export type DemoWebsiteInput = {
  name: string;
  businessType?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  rating?: number | null;
  reviewCount?: number;
  photoUrl?: string | null;
  googleMapsUrl?: string | null;
};

export type DemoWebsiteContext = DemoWebsiteInput & {
  nameEsc: string;
  location: string;
  addressLine: string;
  phone: string;
  phoneDisplay: string;
  tel: string;
  heroImage: string;
  mapsUrl: string;
  rating: number | null;
  reviews: number;
  year: number;
};
