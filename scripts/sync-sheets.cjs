const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { z } = require('zod');
require('dotenv').config();

// 구글 시트 정보 (CSV 내보내기 링크)
const SHEET_ID = process.env.SHEET_ID || '1ho-RJbCDEeWkfp1XgFm0M2QGyVNBnH6KbzXUR_nwMts'; // 환경변수에서 시트 ID 가져오기, 없으면 기본값 사용 
const SHEET_NAME = process.env.SHEET_NAME || 'company'; // 환경변수에서 시트 이름 가져오기, 없으면 기본값 사용

// SHEET_NAME이 숫자이면 gid로 처리, 문자이면 sheet 이름으로 처리 (gviz API 사용)
const SHEET_URL = SHEET_NAME.match(/^\d+$/) 
  ? `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_NAME}`
  : `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

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
  industryDetail: z.string().default(""),
  employees: z.number().int().nonnegative().default(0),
  certifications: z.array(z.enum(['지역우수', '지역맞춤', '청년도약'])).default([]),
  governmentCertifications: z.array(z.string()).default([]),
  awardAchievements: z.array(z.string()).default([]),
  benefits: z.string().default(""),
  workEnvironment: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  website: z.string().url("올바른 웹사이트 URL을 입력해주세요.").or(z.literal("")),
  description: z.string().default(""),
  map_display_status: z.enum(['DRAFT', 'REVIEW', 'VISIBLE', 'HIDDEN', 'EXPIRED']).default('VISIBLE'),
  lat: z.number().optional(),
  lng: z.number().optional(),
  jobs: z.object({
    saramin: z.boolean().optional(),
    jobkorea: z.boolean().optional(),
    work24: z.boolean().optional(),
    lastChecked: z.string().optional(),
  }).optional(),
});

/**
 * 채용 사이트별 공고 여부 확인
 */
async function checkJobPortals(name) {
  const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  const results = {
    saramin: false,
    jobkorea: false,
    work24: false,
    lastChecked: new Date().toISOString()
  };

  try {
    // 사람인
    const saraminRes = await axios.get(`https://www.saramin.co.kr/zf_user/search/recruit?searchword=${encodeURIComponent(name)}`, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 5000
    }).catch(() => null);
    if (saraminRes) {
      console.log(`사람인 검색 결과:${name} : ${saraminRes.data.length} characters`); // 디버깅용 로그
      results.saramin = !saraminRes.data.includes('총 0건의 검색결과'); //총 0건의 검색결과, //검색결과가 없습니다.
    }

    // 잡코리아
    const jobkoreaRes = await axios.get(`https://www.jobkorea.co.kr/Search/?stext=${encodeURIComponent(name)}&tabType=recruit`, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 5000
    }).catch(() => null);
    if (jobkoreaRes) {
      results.jobkorea = !jobkoreaRes.data.includes('검색결과가 없습니다'); //검색결과가 없습니다 //보다 일반적인 검색어로 다시 검색해 보세요.
    }

    // 고용24 (워크24) // 11500:강서구,11470:양천구,11560:영등포구
    const work24Res = await axios.get(`https://www.work24.go.kr/wk/a/b/1200/retriveDtlEmpSrchList.do?srcKeyword=${encodeURIComponent(name)}&regionParam=11500,11470,11560&region=11500,11470,11560`, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 5000
    }).catch(() => null);
    if (work24Res) {
      results.work24 = !work24Res.data.includes('검색 결과가 없습니다.');
    }
  } catch (error) {
    console.warn(`⚠️ Failed to check jobs for ${name}: ${error.message}`);
  }

  return results;
}

/**
 * CSV 데이터를 파싱하여 2차원 배열로 변환 (따옴표 및 멀티라인 필드 대응)
 */
function parseCsv(csv) {
  const records = [];
  let currentRecord = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const nextChar = csv[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // 다음 따옴표 건너뜀
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRecord.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      if (currentField !== '' || currentRecord.length > 0) {
        currentRecord.push(currentField.trim());
        records.push(currentRecord);
        currentRecord = [];
        currentField = '';
      }
    } else {
      currentField += char;
    }
  }
  
  if (currentField !== '' || currentRecord.length > 0) {
    currentRecord.push(currentField.trim());
    records.push(currentRecord);
  }
  
  return records;
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
  const checkJobs = process.argv.includes('--check-jobs');
  
  try {
    console.log('🚀 Starting data synchronization...');
    if (checkJobs) console.log('🔍 Job checking enabled');
    
    // 기존 데이터 로드 (좌표 및 채용 정보 보존용)
    let existingData = { companies: [] };
    if (fs.existsSync(JSON_FILE_PATH)) {
      existingData = JSON.parse(fs.readFileSync(JSON_FILE_PATH, 'utf8'));
    }
    const existingCache = new Map(existingData.companies.map(c => [c.id, c]));

    console.log('📡 Fetching data from Google Sheets...');
    const response = await axios.get(SHEET_URL);
    const csvData = response.data;

    // 개선된 CSV 파서 사용
    const records = parseCsv(csvData);
    if (records.length < 2) throw new Error('No data found in sheet');

    const headers = records[0];
    const companies = [];

    for (let i = 1; i < records.length; i++) {
      const values = records[i];
      const rawCompany = {};

      headers.forEach((header, index) => {
        const val = values[index] || '';
        
        if (['certifications', 'awardAchievements', 'workEnvironment', 'images', 'governmentCertifications'].includes(header)) {
          // 콤마(,) 뿐만 아니라 줄바꿈(\n)으로도 분리 가능하도록 개선
          rawCompany[header] = val 
            ? val.split(/[,\n\r]+/).map(item => item.trim()).filter(Boolean) 
            : [];
        } else if (header === 'benefits') {
          // 복지 및 혜택은 일반 텍스트로 통합 관리
          rawCompany[header] = val.trim();
        } else if (header === 'employees') {
          rawCompany[header] = parseInt(val) || 0;
        } else {
          rawCompany[header] = val;
        }
      });

      // Zod 검증
      const validation = CompanySchema.safeParse(rawCompany);
      if (!validation.success) {
        console.error(`❌ Validation failed for company [${rawCompany.name || 'Unknown'}]:`, validation.error.format());
        continue;
      }

      let company = validation.data;
      const cached = existingCache.get(company.id);

      // 지오코딩 처리 (주소가 바뀌었거나 좌표가 없는 경우만)
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
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // 채용 정보 업데이트
      if (checkJobs) {
        console.log(`🔍 Checking jobs: ${company.name}`);
        company.jobs = await checkJobPortals(company.name);
        // 사이트 차단 방지를 위한 지연
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else if (cached && cached.jobs) {
        company.jobs = cached.jobs;
      }

      companies.push(company);
    }

    // 결과 저장
    const result = { 
      companies,
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(result, null, 2));
    
    console.log(`✅ Successfully synced ${companies.length} companies to ${JSON_FILE_PATH}`);
  } catch (error) {
    console.error('💥 Sync failed:', error.message);
    process.exit(1);
  }
}

sync();
