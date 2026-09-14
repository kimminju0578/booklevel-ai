export type Book = {
  id: string;
  title: string;
  author: string;
  category: string;
  coverUrl: string;
  description: string;
};

// 기존 랜딩의 편집 도서 목록. 개인화 결과나 평가 점수를 포함하지 않는다.
export const books: Book[] = [
  { id: "psychology-of-money", title: "돈의 심리학", author: "모건 하우절", category: "경제", coverUrl: "https://image.yes24.com/goods/97059791/XL", description: "돈을 대하는 태도와 선택을 돌아보며, 나만의 경제적 판단 기준을 생각해보세요." },
  { id: "justice", title: "정의란 무엇인가", author: "마이클 샌델", category: "철학", coverUrl: "https://image.yes24.com/goods/15156691/XL", description: "일상의 선택 속에 담긴 정의와 공정함을 다양한 관점에서 질문해보세요." },
  { id: "thinking-fast-and-slow", title: "생각에 관한 생각", author: "대니얼 카너먼", category: "심리", coverUrl: "https://image.yes24.com/goods/6549764/XL", description: "우리가 판단하고 결정하는 방식을 살펴보며, 익숙한 생각을 새로운 시선으로 바라보세요." },
  { id: "sapiens", title: "사피엔스", author: "유발 하라리", category: "역사", coverUrl: "", description: "인류가 협력하고 문명을 만들어온 과정을 긴 호흡으로 따라가보세요." },
  { id: "the-little-prince", title: "어린 왕자", author: "앙투안 드 생텍쥐페리", category: "문학", coverUrl: "", description: "관계와 책임, 어른이 된다는 것의 의미를 짧고 깊은 문장으로 만나보세요." },
  { id: "the-alchemist", title: "연금술사", author: "파울로 코엘료", category: "문학", coverUrl: "", description: "자신의 여정을 믿고 길 위에서 의미를 발견하는 이야기를 읽어보세요." },
  { id: "cosmos", title: "코스모스", author: "칼 세이건", category: "과학", coverUrl: "", description: "우주와 생명의 역사를 통해 인간의 위치를 넓은 시야로 바라보세요." },
  { id: "the-selfish-gene", title: "이기적 유전자", author: "리처드 도킨스", category: "과학", coverUrl: "", description: "진화와 협력을 유전자라는 관점에서 다시 생각해보는 과학 고전입니다." },
  { id: "factfulness", title: "팩트풀니스", author: "한스 로슬링", category: "사회", coverUrl: "", description: "세상을 바라보는 우리의 편견을 데이터와 사실로 점검해보세요." },
  { id: "the-design-of-everyday-things", title: "디자인과 인간 심리", author: "도널드 노먼", category: "사회", coverUrl: "", description: "매일 사용하는 물건과 서비스가 사람의 행동을 어떻게 이끄는지 살펴보세요." },
  { id: "ai-superpowers", title: "AI 슈퍼파워", author: "리카이푸", category: "AI·기술", coverUrl: "", description: "인공지능이 산업과 사회를 어떻게 바꾸는지 균형 있게 이해해보세요." },
  { id: "zero-to-one", title: "제로 투 원", author: "피터 틸", category: "경제", coverUrl: "", description: "이미 있는 것을 반복하는 대신 새로운 가치를 만드는 방법을 질문해보세요." },
];
