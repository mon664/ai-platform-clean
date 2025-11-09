const https = require('https');

const tests = [
  { path: '/', name: '홈페이지' },
  { path: '/shorts', name: '쇼츠 생성기' },
  { path: '/story', name: '장면 생성기' },
  { path: '/character', name: '캐릭터 생성기' },
  { path: '/tts', name: 'TTS 생성기' },
  { path: '/blog', name: '블로그' },
  { path: '/auto-blog', name: '자동 블로그' },
  { path: '/chat', name: 'AI 채팅' },
  { path: '/ecount/purchase', name: 'ERP 구매' },
  { path: '/modules/production-log', name: '생산일지' },
  { path: '/modules/bom', name: 'BOM' },
  { path: '/modules/haccp', name: 'HACCP' },
  { path: '/api/data/vendors', name: 'API: 거래처' },
  { path: '/api/data/products', name: 'API: 품목' },
  { path: '/api/data/warehouses', name: 'API: 창고' }
];

async function runTests() {
  console.log('🧪 AI Platform 통합 테스트 시작...\n');
  console.log(`📅 테스트 시간: ${new Date().toLocaleString('ko-KR')}`);
  console.log(`🌐 테스트 대상: http://localhost:3000\n`);

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const response = await fetch(`http://localhost:3000${test.path}`);
      const status = response.status;

      if (status === 200) {
        console.log(`✅ ${test.name}: OK (${status})`);
        passed++;
      } else if (status === 404) {
        console.log(`⚠️  ${test.name}: NOT FOUND (${status})`);
        failed++;
      } else if (status === 500) {
        console.log(`❌ ${test.name}: SERVER ERROR (${status})`);
        failed++;
      } else {
        console.log(`⚠️  ${test.name}: ${status}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      failed++;
    }

    // 각 테스트 사이에 약간의 지연 추가
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 테스트 결과: ${passed} 통과, ${failed} 실패`);
  console.log(`📈 성공률: ${((passed / tests.length) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('🎉 모든 테스트 통과! AI Platform 통합 성공!');
  } else {
    console.log('⚠️  일부 테스트 실패. 확인이 필요합니다.');
  }

  console.log('✅ 테스트 완료!');
}

// 서버가 준비될 때까지 잠시 대기
console.log('⏳ 3초 후 테스트를 시작합니다...');
setTimeout(runTests, 3000);