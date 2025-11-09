// Prompt templates for topic/content/image generation
export const TOPIC_GENERATION_PROMPT = (
  recentTrends: string,
  recentTopics: string,
  category: string
) => `당신은 외식업 전문 콘텐츠 기획자입니다.\n\n최근 트렌드: ${recentTrends}\n이전 주제: ${recentTopics}\n카테고리: ${category}\n\n다음 조건을 만족하는 블로그 주제를 생성하세요:\n1. 실용적이고 구체적인 정보 제공\n2. 외식 소상공인/프랜차이즈 관계자에게 유용\n3. 검색 가능성 높은 주제\n4. 최근 트렌드 반영\n5. 이전 주제와 중복 없음\n\nJSON 형식으로 응답:\n{\n  "title": "클릭을 유도하는 제목",\n  "titleCandidates": ["제목1", "제목2", "제목3"],\n  "keywords": ["키워드1", "키워드2"],\n  "metaDescription": "검색 결과에 표시될 설명 (150자 이내)",\n  "outline": ["섹션1", "섹션2", "섹션3"]\n}`

export const CONTENT_GENERATION_PROMPT = (
  topicTitle: string,
  keywords: string[],
  targetAudience: string
) => `당신은 15년 경력의 외식업 컨설턴트이자 블로그 작가입니다.\n\n주제: ${topicTitle}\n키워드: ${keywords.join(', ')}\n대상: ${targetAudience}\n\n다음 스타일로 2000-3000자 분량의 블로그 글을 작성하세요:\n\n✅ 글쓰기 규칙:\n1. 친근하면서도 전문적인 톤\n2. 실제 경험담처럼 작성 ("저도 처음엔...", "경험상..." 등)\n3. 구체적인 수치와 예시 포함\n4. 단락은 3-4문장으로 짧게\n5. 소제목으로 가독성 향상\n6. 불릿 포인트, 번호 리스트 적극 활용\n\n📝 구조:\n- 도입부: 공감대 형성 + 문제 제기 (2-3문단)\n- 본론: 해결책 3-5가지 (각 소제목 포함)\n- 결론: 요약 + 실천 방법 + 격려\n\n🖼️ 이미지 위치:\n- [IMAGE:1] 형태로 표시\n- 본문 흐름에 맞게 3-5개 배치\n- 각 이미지마다 설명 주석 포함\n\nMarkdown 형식으로 응답하세요.`

export const IMAGE_PROMPTS = {
  thumbnail: (topicTitle: string) => `Professional, high-quality photograph for a Korean restaurant business blog.\nTopic: ${topicTitle}\nStyle: Realistic, modern, clean, bright lighting\nSetting: Korean restaurant or cafe interior/exterior\nNo text overlay, no people faces clearly visible\n16:9 aspect ratio, suitable for blog thumbnail`,
  content: (description: string) => `Realistic photograph for Korean restaurant business blog article.\nScene: ${description}\nStyle: Professional, natural lighting, authentic Korean restaurant setting\nNo text, no watermarks\nHigh quality, editorial style\n4:3 aspect ratio`,
}

