import { z } from "zod";

export const tasteDimensions = [
  "pace", "ambiguity", "realism", "emotionality", "intellectual_depth",
  "practical_vs_conceptual", "breadth_vs_depth", "plot_vs_character",
] as const;
export type TasteDimension = (typeof tasteDimensions)[number];

export const tasteAnswerSchema = z.record(z.string(), z.number().int().min(1).max(5));
export const tasteDimensionSchema = z.object(Object.fromEntries(tasteDimensions.map((key) => [key, z.number().min(0).max(100)])) as Record<TasteDimension, z.ZodNumber>);

export type TasteQuestion = {
  id: string;
  version: number;
  prompt: string;
  dimension: TasteDimension;
  direction: 1 | -1;
  weight: number;
  leftLabel: string;
  rightLabel: string;
  active: boolean;
};

export const tasteQuestions: TasteQuestion[] = [
  { id: "70000000-0000-4000-8000-000000000001", version: 1, prompt: "빠르게 사건이 전개되는 책이 좋다", dimension: "pace", direction: 1, weight: 1, leftLabel: "빠른 전개", rightLabel: "느리고 깊은 전개", active: true },
  { id: "70000000-0000-4000-8000-000000000002", version: 1, prompt: "읽은 뒤 여러 해석이 가능한 책이 좋다", dimension: "ambiguity", direction: 1, weight: 1, leftLabel: "명확한 결론", rightLabel: "열린 해석", active: true },
  { id: "70000000-0000-4000-8000-000000000003", version: 1, prompt: "현실과 밀접한 이야기가 좋다", dimension: "realism", direction: 1, weight: 1, leftLabel: "상상·가상 세계", rightLabel: "현실 기반", active: true },
  { id: "70000000-0000-4000-8000-000000000004", version: 1, prompt: "감정적으로 깊게 몰입되는 책이 좋다", dimension: "emotionality", direction: 1, weight: 1, leftLabel: "분석적 독서", rightLabel: "감정 몰입", active: true },
  { id: "70000000-0000-4000-8000-000000000005", version: 1, prompt: "조금 어렵더라도 오래 생각하게 하는 책이 좋다", dimension: "intellectual_depth", direction: 1, weight: 1.2, leftLabel: "편안한 독서", rightLabel: "깊은 사고", active: true },
  { id: "70000000-0000-4000-8000-000000000006", version: 1, prompt: "새로운 개념이나 관점을 발견하는 것을 좋아한다", dimension: "practical_vs_conceptual", direction: 1, weight: 1, leftLabel: "실용적 정보", rightLabel: "개념적 관점", active: true },
  { id: "70000000-0000-4000-8000-000000000007", version: 1, prompt: "하나의 주제를 깊게 파고드는 책이 좋다", dimension: "breadth_vs_depth", direction: 1, weight: 1, leftLabel: "여러 분야 연결", rightLabel: "한 분야 심화", active: true },
  { id: "70000000-0000-4000-8000-000000000008", version: 1, prompt: "인물의 내면을 깊게 따라가는 이야기가 좋다", dimension: "plot_vs_character", direction: 1, weight: 1, leftLabel: "사건 중심", rightLabel: "인물·심리 중심", active: true },
  { id: "70000000-0000-4000-8000-000000000009", version: 1, prompt: "빠르게 다음 장면으로 넘어가는 책이 좋다", dimension: "pace", direction: -1, weight: 1, leftLabel: "느린 전개", rightLabel: "빠른 전개", active: true },
  { id: "70000000-0000-4000-8000-000000000010", version: 1, prompt: "작가가 모든 의미를 설명하지 않는 책이 좋다", dimension: "ambiguity", direction: 1, weight: 1, leftLabel: "친절한 설명", rightLabel: "독자의 해석", active: true },
  { id: "70000000-0000-4000-8000-000000000011", version: 1, prompt: "실제 삶의 문제를 다루는 책에 더 끌린다", dimension: "realism", direction: 1, weight: 1, leftLabel: "낯선 세계", rightLabel: "현실의 문제", active: true },
  { id: "70000000-0000-4000-8000-000000000012", version: 1, prompt: "읽고 난 뒤 다른 생각으로 이어지는 책을 좋아한다", dimension: "intellectual_depth", direction: 1, weight: 1.2, leftLabel: "가벼운 읽기", rightLabel: "생각이 이어지는 읽기", active: true },
];

export type ReaderArchetype = {
  key: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  keywords: string[];
  recommendedReadingStyle: string;
  centroid: Record<TasteDimension, number>;
  dimensionWeights: Record<TasteDimension, number>;
  priority: number;
};

const weights = Object.fromEntries(tasteDimensions.map((key) => [key, 1])) as Record<TasteDimension, number>;
export const readerArchetypes: ReaderArchetype[] = [
  { key: "reflective_explorer", name: "사유하는 탐험가", shortDescription: "복잡한 질문을 오래 생각하고 읽은 뒤에도 생각이 이어지는 독자입니다.", longDescription: "새로운 관점을 탐험하면서도 한 번 만난 질문을 쉽게 놓지 않습니다.", keywords: ["사유적", "열린 해석", "관점 탐험"], recommendedReadingStyle: "여백을 두고 질문을 메모하며 읽어보세요.", centroid: { pace: 70, ambiguity: 78, realism: 45, emotionality: 52, intellectual_depth: 82, practical_vs_conceptual: 76, breadth_vs_depth: 48, plot_vs_character: 58 }, dimensionWeights: weights, priority: 1 },
  { key: "knowledge_seeker", name: "지식 탐구자", shortDescription: "새로운 사실과 개념을 연결하며 배우는 즐거움을 아는 독자입니다.", longDescription: "한 권에서 얻은 지식을 다른 분야와 연결해 더 넓은 이해를 만듭니다.", keywords: ["호기심", "개념 중심", "폭넓은 연결"], recommendedReadingStyle: "핵심 개념과 관련 분야를 함께 찾아보세요.", centroid: { pace: 48, ambiguity: 45, realism: 55, emotionality: 35, intellectual_depth: 72, practical_vs_conceptual: 68, breadth_vs_depth: 22, plot_vs_character: 32 }, dimensionWeights: weights, priority: 2 },
  { key: "realist_analyst", name: "현실주의 분석가", shortDescription: "현실의 문제를 차분하게 분석하고 쓸모 있는 통찰을 찾는 독자입니다.", longDescription: "구체적인 사례와 근거를 통해 세상을 더 정확하게 이해하려 합니다.", keywords: ["현실 기반", "분석적", "실용적"], recommendedReadingStyle: "사례와 근거를 중심으로 읽고 적용점을 적어보세요.", centroid: { pace: 48, ambiguity: 28, realism: 88, emotionality: 28, intellectual_depth: 62, practical_vs_conceptual: 25, breadth_vs_depth: 54, plot_vs_character: 28 }, dimensionWeights: weights, priority: 3 },
  { key: "emotional_immersive", name: "감정 몰입형 독자", shortDescription: "인물의 감정과 관계를 따라가며 책 속 세계를 깊이 경험하는 독자입니다.", longDescription: "이야기의 정서와 인물의 마음을 자신의 경험과 연결해 읽습니다.", keywords: ["감정 몰입", "인물 중심", "공감"], recommendedReadingStyle: "마음에 남은 장면과 감정을 천천히 기록해보세요.", centroid: { pace: 48, ambiguity: 58, realism: 52, emotionality: 90, intellectual_depth: 48, practical_vs_conceptual: 42, breadth_vs_depth: 52, plot_vs_character: 88 }, dimensionWeights: weights, priority: 4 },
  { key: "story_collector", name: "이야기 수집가", shortDescription: "끊임없이 펼쳐지는 사건과 생생한 세계를 사랑하는 독자입니다.", longDescription: "새로운 이야기의 흐름에 몸을 맡기고 다음 장면을 기대하며 읽습니다.", keywords: ["빠른 전개", "상상력", "사건 중심"], recommendedReadingStyle: "인상적인 장면과 이야기의 전환점을 표시해보세요.", centroid: { pace: 18, ambiguity: 38, realism: 38, emotionality: 62, intellectual_depth: 35, practical_vs_conceptual: 32, breadth_vs_depth: 42, plot_vs_character: 12 }, dimensionWeights: weights, priority: 5 },
  { key: "intellectual_adventurer", name: "지적 모험가", shortDescription: "익숙한 답보다 낯선 질문과 어려운 생각에 끌리는 독자입니다.", longDescription: "조금 불편하고 낯선 관점도 끝까지 따라가며 사고의 경계를 넓힙니다.", keywords: ["도전적", "낯선 관점", "깊은 사고"], recommendedReadingStyle: "이해되지 않는 대목을 질문으로 바꾸어 읽어보세요.", centroid: { pace: 58, ambiguity: 72, realism: 42, emotionality: 42, intellectual_depth: 92, practical_vs_conceptual: 88, breadth_vs_depth: 64, plot_vs_character: 48 }, dimensionWeights: weights, priority: 6 },
  { key: "deep_reader", name: "깊이 읽는 연구자", shortDescription: "한 주제를 오래 파고들며 맥락과 구조를 꼼꼼히 살피는 독자입니다.", longDescription: "빠른 결론보다 충분한 근거와 맥락을 통해 자신의 이해를 단단하게 만듭니다.", keywords: ["집중", "맥락", "정밀한 독해"], recommendedReadingStyle: "한 주제를 여러 자료와 비교하며 읽어보세요.", centroid: { pace: 86, ambiguity: 62, realism: 62, emotionality: 32, intellectual_depth: 88, practical_vs_conceptual: 72, breadth_vs_depth: 92, plot_vs_character: 42 }, dimensionWeights: weights, priority: 7 },
  { key: "perspective_connector", name: "관점 확장형 독자", shortDescription: "서로 다른 사람과 분야의 시선을 이어 새로운 그림을 만드는 독자입니다.", longDescription: "한 가지 답에 머물기보다 여러 관점을 연결해 더 입체적으로 이해합니다.", keywords: ["연결", "다중 관점", "유연한 사고"], recommendedReadingStyle: "책의 주장과 다른 관점을 함께 비교해보세요.", centroid: { pace: 52, ambiguity: 68, realism: 58, emotionality: 58, intellectual_depth: 68, practical_vs_conceptual: 62, breadth_vs_depth: 12, plot_vs_character: 62 }, dimensionWeights: weights, priority: 8 },
];

export const tasteQuestionVersion = 1;
