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
];
