const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 구글 시트 정보 (CSV 내보내기 링크)
const SHEET_ID = '1ho-RJbCDEeWkfp1XgFm0M2QGyVNBnH6KbzXUR_nwMts';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

const JSON_FILE_PATH = path.join(process.cwd(), 'public/data/companies.json');

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
 * 메인 동기화 함수
 */
async function sync() {
  try {
    console.log('Fetching data from Google Sheets...');
    const response = await axios.get(SHEET_URL);
    const csvData = response.data;

    const lines = csvData.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) throw new Error('No data found in sheet');

    const headers = parseCsvLine(lines[0]);
    const companies = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
      const company = {};

      headers.forEach((header, index) => {
        const val = values[index] || '';
        
        // 다중 선택 항목 처리 (콤마 구분)
        if (['certifications', 'awards', 'benefits', 'workEnvironment', 'images'].includes(header)) {
          // 따옴표 제거 및 콤마 분리
          const cleanVal = val.replace(/^"|"$/g, '');
          company[header] = cleanVal ? cleanVal.split(',').map(item => item.trim()) : [];
        } 
        // 숫자형 처리
        else if (header === 'employees') {
          company[header] = parseInt(val) || 0;
        }
        // 기본 텍스트
        else {
          company[header] = val.replace(/^"|"$/g, '');
        }
      });

      // 필수 필드 체크 (ID, Name)
      if (company.id && company.name) {
        companies.push(company);
      }
    }

    // 결과 저장
    const result = { companies };
    fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(result, null, 2));
    
    console.log(`Successfully synced ${companies.length} companies to ${JSON_FILE_PATH}`);
  } catch (error) {
    console.error('Sync failed:', error.message);
    process.exit(1);
  }
}

sync();
