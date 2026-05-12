# 🏢 기업성장 브릿지 Map (Corporate Growth Bridge Map)

> **"기업의 혁신과 지역의 성장을 잇는 데이터 비주얼라이제이션 플랫폼"**
>
> 본 프로젝트는 서울 서남권(강서, 양천, 영등포)의 유망 기업 데이터를 정밀하게 시각화하고, 운영팀의 관리 효율성을 극대화하기 위해 설계된 인텔리전트 지도 포털입니다.

---

## 🌟 프로젝트 비전 (Project Vision)

단순한 기업 목록 제공을 넘어, 지역 내 비즈니스 생태계를 한눈에 파악할 수 있는 **Interactive Corporate Landscape**를 구축합니다. 최신 웹 기술과 클라우드 네이티브 동기화 전략을 결합하여, 데이터의 정확성과 관리의 편의성을 동시에 확보했습니다.

## 🚀 핵심 기술 특장점 (Key Technical Features)

### 1. Dynamic Geocoding Engine
- **좌표 관리 Zero:** 위도/경도를 수동으로 입력할 필요가 없습니다. 도로명 주소만 입력하면 Google Maps Geocoding API가 실시간으로 좌표를 변환하여 지도에 배치합니다.
- **정밀 프레이밍:** 데이터가 로드될 때마다 모든 기업이 한눈에 들어오는 최적의 줌 레벨과 중심점을 자동으로 계산하는 'Auto-fit Bounds' 로직을 탑재했습니다.

### 2. No-Code 데이터 파이프라인 (Cloud Sync)
- **Google Sheets 연동:** 별도의 백엔드 관리 페이지 없이 공유된 구글 시트에서 데이터를 관리합니다.
- **One-Click 동기화:** `npm run sync` 명령어 또는 GitHub Actions의 수동 실행을 통해 시트의 데이터가 즉시 서비스에 반영됩니다.

### 3. 고도화된 UX/UI 아키텍처
- **React 19 & Framer Motion:** 부드러운 상태 전환과 모바일 퍼스트(Mobile-First) 디자인을 통해 데스크톱과 모바일 모두에서 최상의 사용자 경험을 제공합니다.
- **상태 관리 자동화:** 기업의 노출 상태(`VISIBLE`, `HIDDEN`, `DRAFT` 등)를 통해 콘텐츠의 생애주기를 체계적으로 관리합니다.

### 4. 마케팅 및 분석 최적화 (Advanced Marketing & Analytics)
- **SEO & Social Share:** 각 기업별 상세 페이지에 대한 동적 메타 태그(React Helmet) 및 Open Graph 최적화를 통해 SNS 공유 시 풍부한 미리보기를 제공합니다.
- **이벤트 정밀 추적:** Google Analytics 4(GA4)를 통해 검색어, 필터 사용 패턴, 웹사이트 방문, 주소 복사, 길찾기 등 사용자 행동 데이터를 세밀하게 수집하여 서비스 개선 지표로 활용합니다.
- **공유 및 전환 도구:** Web Share API를 활용한 원클릭 공유, 주요 지도 앱(카카오, 네이버, 구글) 길찾기 연동 등을 통해 사용자 인게이지먼트를 높였습니다.

---

## 📊 기업 데이터 명세 (Data Model)

`public/data/companies.json`은 서비스의 핵심 자산입니다. 모든 필드는 시맨틱한 명칭을 가지며 엄격하게 관리됩니다.

| 필드명 | 데이터 타입 | 설명 | 관리 포인트 |
| :--- | :--- | :--- | :--- |
| **`id`** | `string` | 기업 고유 식별자 | URL 및 상세 페이지 매칭 키 |
| **`name`** | `string` | 공식 기업 명칭 | 브랜드 노출의 핵심 |
| **`region`** | `enum` | 행정구역 구분 | 강서구, 양천구, 영등포구 |
| **`address`** | `string` | **도로명 주소** | 지오코딩 엔진의 입력값 |
| **`logo`** | `string` | 이미지 에셋 경로 | `assets/logos/` 폴더 내 파일명 |
| **`industry`** | `string` | 산업군 카테고리 | 필터링 및 검색 가중치 활용 |
| **`employees`** | `number` | 임직원 규모 | 기업 규모 지표 |
| **`certifications`**| `string[]` | 기업 유형 현황 | 지역우수, 지역맞춤, 청년도약 등 |
| **`map_display_status`** | `enum` | **게시 상태** | `VISIBLE`, `HIDDEN`, `DRAFT`, `EXPIRED` |

---

## ⚙️ 개발 및 운영 가이드 (Dev & Ops)

### 🛠 로컬 개발 환경 설정
```bash
# 의존성 설치
npm install

# 구글 시트 데이터 실시간 동기화
npm run sync

# 로컬 개발 서버 구동
npm run dev
```

### 🔄 데이터 동기화 워크플로우 (Strategy A)
1. **[구글 시트](https://docs.google.com/spreadsheets/d/1ho-RJbCDEeWkfp1XgFm0M2QGyVNBnH6KbzXUR_nwMts/edit?usp=sharing)**에 기업 정보를 입력합니다. (다중 항목은 쉼표`,`로 구분)
2. **수동 업데이트:** 로컬에서 `npm run sync`를 실행하거나, GitHub Actions에서 `Sync Google Sheets Data` 워크플로우를 가동합니다.
3. **배포:** 데이터 변경이 감지되면 GitHub Pages를 통해 서비스가 자동 업데이트됩니다.

---

## 🛠 Tech Specs

- **Core:** React 19 (TypeScript), Vite 6
- **Styling:** Tailwind CSS 4 (Next-Gen CSS Engine)
- **Map:** @vis.gl/react-google-maps
- **CI/CD:** GitHub Actions (Automated Data Sync & Deployment)

---
> 본 프로젝트는 기업과 지역 사회의 동반 성장을 지원하기 위해 제작되었습니다.  
> **Technical Engineering by Gemini CLI Senior Expert.**
