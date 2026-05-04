export interface Company {
  id: string;
  name: string;
  region: '강서구' | '양천구' | '영등포구';
  lat: number;
  lng: number;
  logo: string;
  industry: string;
  employees: number;
  certifications: ('벤처' | '이노비즈' | '강소기업')[];
  awards: string[];
  benefits: string[];
  workEnvironment: string[];
  images: string[];
  website: string;
  description: string;
}

export type Region = Company['region'];
export type Certification = Company['certifications'][number];
