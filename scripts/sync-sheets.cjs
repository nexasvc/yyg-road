const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { z } = require('zod');
require('dotenv').config();

// 구글 시트 정보 (CSV 내보내기 링크)
const SHEET_ID = '1ho-RJbCDEeWkfp1XgFm0M2QGyVNBnH6KbzXUR_nwMts';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

const JSON_FILE_PATH = path.join(process.cwd(), 'public/data/companies.json');
const GOOGLE_MAPS_API_KEY = process.env.VITE_GOOGLE_GEOCODING_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY; // 지오코딩 API 키 우선 사용, 없으면 맵 API 키 사용

/**
 * Zod 스키마 정의 (데이터 검증)
 */
const CompanySchema = z.object({
  id: z.string().min(1, "ID는 필수입니다."),
  name: z.string().min(1, "기업명은 필수입니다."),
  region: z.enum(['강서구', '양천구', '영등포구']),
  address: z.string().min(5, "올바른 주소를 입력해주세요."),
  logo: z.string().optional(),
  industry: z.string().min(1, "산업군은 필수입니다."),
  employees: z.number().int().nonnegative().default(0),
  certifications: z.array(z.enum(['지역우수', '지역맞춤', '청년도약'])).default([]),
  awards: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  workEnvironment: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  website: z.string().url("올바른 웹사이트 URL을 입력해주세요.").or(z.literal("")),
  description: z.string().default(""),
  map_display_status: z.enum(['DRAFT', 'REVIEW', 'VISIBLE', 'HIDDEN', 'EXPIRED']).default('VISIBLE'),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

/**
 * CSV 행을 파싱하여 객체로 변환 (따옴표 처리 포함)
 */
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * 구글 지오코딩 API 호출
 */
async function getCoordinates(address) {
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.includes('YOUR_')) {
    console.warn('⚠️ Google Maps API Key is missing or invalid. Skipping geocoding.');
    return null;
  }

  // 정확도를 높이기 위해 주소 앞에 '서울특별시' 추가 (이미 포함되어 있지 않은 경우)
  const fullAddress = address.includes('서울') ? address : `서울특별시 ${address}`;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await axios.get(url);
    
    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry.location;
      return { lat, lng };
    } else {
      console.error(`Geocoding failed for [${fullAddress}]: ${response.data.status} : ${response.data.error_message || 'No results found'}}`);
      // console.error('url>>>:', url);
      return null;
    }
  } catch (error) {
    console.error(`Geocoding API error: ${error.message}`);
    return null;
  }
}

/**
 * 메인 동기화 함수
 */
async function sync() {
  try {
    console.log('🚀 Starting data synchronization...');
    
    // 기존 데이터 로드 (좌표 보존용)
    let existingData = { companies: [] };
    if (fs.existsSync(JSON_FILE_PATH)) {
      existingData = JSON.parse(fs.readFileSync(JSON_FILE_PATH, 'utf8'));
    }
    const coordsCache = new Map(existingData.companies.map(c => [c.id, { address: c.address, lat: c.lat, lng: c.lng }]));

    console.log('📡 Fetching data from Google Sheets...');
    const response = await axios.get(SHEET_URL);
    const csvData = response.data;

    const lines = csvData.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) throw new Error('No data found in sheet');

    const headers = parseCsvLine(lines[0]);
    const companies = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
      const rawCompany = {};

      headers.forEach((header, index) => {
        const val = values[index] || '';
        
        if (['certifications', 'awards', 'benefits', 'workEnvironment', 'images'].includes(header)) {
          const cleanVal = val.replace(/^"|"$/g, '');
          rawCompany[header] = cleanVal ? cleanVal.split(',').map(item => item.trim()) : [];
        } else if (header === 'employees') {
          rawCompany[header] = parseInt(val) || 0;
        } else {
          rawCompany[header] = val.replace(/^"|"$/g, '');
        }
      });

      // Zod 검증
      const validation = CompanySchema.safeParse(rawCompany);
      if (!validation.success) {
        console.error(`❌ Validation failed for company [${rawCompany.name || 'Unknown'}]:`, validation.error.format());
        continue;
      }

      let company = validation.data;

      // 지오코딩 처리 (주소가 바뀌었거나 좌표가 없는 경우만)
      const cached = coordsCache.get(company.id);
      if (cached && cached.address === company.address && cached.lat && cached.lng) {
        company.lat = cached.lat;
        company.lng = cached.lng;
      } else {
        console.log(`📍 Geocoding: ${company.name} (${company.address})`);
        const coords = await getCoordinates(company.address);
        if (coords) {
          company.lat = coords.lat;
          company.lng = coords.lng;
        }
        // API 할당량 보호를 위한 지연
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      companies.push(company);
    }

    // 결과 저장
    const result = { companies };
    fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(result, null, 2));
    
    console.log(`✅ Successfully synced ${companies.length} companies to ${JSON_FILE_PATH}`);
  } catch (error) {
    console.error('💥 Sync failed:', error.message);
    process.exit(1);
  }
}

sync();
