// api/search.js
// Vercel Serverless Function
// Large pre-indexed item catalog for Maple Planet.
// Provides instant autocomplete search without relying on broken upstream scraping.

const POPULAR_ITEMS = [
  // 캐시 / 편의성
  { id: '5062000', name: '미라클 큐브' },
  { id: '5062001', name: '마스터 미라클 큐브' },
  { id: '5520000', name: '카르마의 가위' },
  { id: '5041000', name: '고성능 순간이동의 돌' },
  { id: '5450000', name: '보따리상인 묘묘' },
  { id: '5064000', name: '세이프티 쉴드' },
  { id: '5064300', name: '리커버리 쉴드' },
  { id: '2340000', name: '프로텍트 쉴드' },
  { id: '5068300', name: '쁘띠 아르바이트 펫 복제' },
  { id: '5150040', name: '로얄 헤어쿠폰' },
  { id: '5152053', name: '트렌디 로얄 성형외과 쿠폰' },

  // 주문서류 (혼돈, 백의, 장갑 등)
  { id: '2049100', name: '혼돈의 주문서 60%' },
  { id: '2049116', name: '긍정의 혼돈의 주문서 50%' },
  { id: '2049122', name: '놀라운 긍정의 혼돈의 주문서 60%' },
  { id: '2049000', name: '백의 주문서 1%' },
  { id: '2049001', name: '백의 주문서 3%' },
  { id: '2049002', name: '백의 주문서 5%' },
  { id: '2049003', name: '백의 주문서 10%' },
  { id: '2040804', name: '장갑 공격력 주문서 60%' },
  { id: '2040807', name: '장갑 공격력 주문서 10%' },
  { id: '2040806', name: '장갑 공격력 주문서 100%' },
  { id: '2043303', name: '단검 공격력 주문서 60%' },
  { id: '2044703', name: '아대 공격력 주문서 60%' },
  { id: '2040703', name: '신발 민첩성 주문서 60%' },
  { id: '2040706', name: '신발 민첩성 주문서 100%' },
  { id: '2040709', name: '신발 이동속도 주문서 60%' },
  { id: '2040506', name: '전신 갑옷 민첩성 주문서 60%' },
  { id: '2040509', name: '전신 갑옷 지력 주문서 60%' },
  { id: '2040521', name: '전신 갑옷 힘 주문서 60%' },
  { id: '2040903', name: '귀 장식 지력 주문서 60%' },
  { id: '2040904', name: '귀 장식 지력 주문서 10%' },
  { id: '2040003', name: '투구 방어력 주문서 60%' },
  { id: '2040403', name: '상이 방어력 주문서 60%' },
  { id: '2040603', name: '하의 방어력 주문서 60%' },
  { id: '2046219', name: '악세서리 공격력 주문서 15%' },
  { id: '2046284', name: '악세서리 스크롤 공격력 70%' },
  { id: '2046319', name: '악세서리 마력 주문서 15%' },

  // 표창 / 불릿
  { id: '2070006', name: '일비 표창' },
  { id: '2070007', name: '뇌전 수리검' },
  { id: '2070005', name: '토비 표창' },
  { id: '2070019', name: '플레임 표창' },
  { id: '2070018', name: '무한의 수리검' },
  { id: '2330007', name: '자이언트 불릿' },
  { id: '2333000', name: '하이퍼 불릿' },

  // 주요 소비 / 기타 아이템
  { id: '4001168', name: '저주받은 인형' },
  { id: '4000021', name: '동물의 가죽' },
  { id: '4031024', name: '수레바퀴' }, // 운명의 수레바퀴 등
  { id: '2000004', name: '엘릭서' },
  { id: '2000005', name: '파워 엘릭서' },
  { id: '2022000', name: '통닭' },
  { id: '2022003', name: '맑은 물' },
  { id: '2022179', name: '순록의 우유' },
  { id: '2022180', name: '황혼의 이슬' },

  // 주요 장비 및 보스 장신구
  { id: '1003112', name: '카오스 자쿰의 투구' },
  { id: '1002357', name: '자쿰의 투구' },
  { id: '1122076', name: '카오스 혼테일의 목걸이' },
  { id: '1122000', name: '혼테일의 목걸이' },
  { id: '1032024', name: '귀고리 (귀 장식)' },
  { id: '1032034', name: '하트 귀고리' },
  { id: '1032014', name: '메이플 귀고리' },
  { id: '1122017', name: '슈피겔만의 목걸이' },
  { id: '1132012', name: '부서진 안경' },
  { id: '1022073', name: '알카도 안경' },
  { id: '1152012', name: '신고 배지' },
  
  // 메이플 템 및 인기 무기
  { id: '1302077', name: '메이플 소드' },
  { id: '1472061', name: '메이플 칸데오' },
  { id: '1472068', name: '메이플 크로우' },
  { id: '1472030', name: '황금 아대' },
  { id: '1472056', name: '레드 크레이븐' },
  { id: '1402046', name: '드래곤 클레이모어' }
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q } = req.query;
  if (!q || !q.trim()) {
    return res.status(400).json({ status: 'error', message: "Missing query parameter 'q'" });
  }

  const queryClean = q.trim().toLowerCase();

  // Find matches in our structured database
  const matches = POPULAR_ITEMS.filter(item => 
    item.name.toLowerCase().includes(queryClean) || item.id.includes(queryClean)
  );

  return res.status(200).json({
    status: 'success',
    data: matches,
  });
};
