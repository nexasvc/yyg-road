export type MapDisplayStatus = 'DRAFT' | 'REVIEW' | 'VISIBLE' | 'HIDDEN' | 'EXPIRED';

export interface CompanyJobs {
  saramin?: boolean;
  jobkorea?: boolean;
  work24?: boolean;
  lastChecked?: string;
}

export interface Company {
  id: string;
  name: string;
  region: '강서구' | '양천구' | '영등포구';
  address: string;
  lat?: number;
  lng?: number;
  logo: string;
  industry: string;
  employees: number;
  certifications: ('지역우수' | '지역맞춤' | '청년도약')[];
  awards: string[];
  benefits: string;
  workEnvironment: string[];
  images: string[];
  website: string;
  description: string;
  map_display_status: MapDisplayStatus;
  jobs?: CompanyJobs;
}

export type Region = Company['region'];
export type Certification = Company['certifications'][number];
