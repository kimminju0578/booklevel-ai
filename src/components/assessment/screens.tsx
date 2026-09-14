import { Badge, ButtonLink, Card, EmptyState, InsightCard, LevelBadge, Progress } from "@/components/ui/primitives";

export const categoryNames: Record<string, string> = { economics: "경제", philosophy: "철학", psychology: "심리", society: "사회", history: "역사", literature: "문학", science: "과학", "ai-tech": "AI·기술" };

export function AssessmentPanel({ category, slug, quiz = false }: { category: string; slug: string; quiz?: boolean }) {
  return <div className="assessment-layout"><Card className="question-card"><Badge>{category} 분야</Badge><h2>{quiz ? "나에게 집중하는 열 개의 질문" : "잘 아는 것부터, 천천히 알아가요."}</h2><Progress value={quiz ? null : 0} max={10} label="진단 진행" />
    {quiz ? <EmptyState title="진단을 시작할 수 없어요." action={<ButtonLink href={`/assessment/${slug}/quiz`} variant="secondary">다시 시도</ButtonLink>}>검수된 문항이 10개 이상 등록된 분야에서 진단을 시작할 수 있습니다.</EmptyState> : <><p className="reading-copy page-section">총 10문항, 약 3~5분이 걸려요. 시험 점수가 아닌, 현재 수준에 맞는 책을 찾기 위한 과정입니다. 잘 모르겠는 질문이 있어도 괜찮아요.</p><InsightCard title="진단은 나를 알아가는 출발점이에요."><p>결과는 해당 분야의 학습 참고 정보로만 사용해요. 지능이나 학업 능력을 판단하지 않아요.</p></InsightCard><div className="button-row"><ButtonLink href={`/assessment/${slug}/quiz`}>진단 시작하기 →</ButtonLink></div><p className="caption">문항은 편집자 검수 후 서비스에 공개됩니다.</p></>}
    {quiz && <div className="button-row"><ButtonLink href={`/assessment/${slug}`} variant="secondary">진단 안내</ButtonLink><ButtonLink href="/assessment/result" variant="quiet">결과 화면 살펴보기 →</ButtonLink></div>}
  </Card><aside className="assessment-aside"><Card><h2>이렇게 진행해요</h2><ol><li>관심 분야 확인</li><li>10개의 질문에 응답</li><li>나의 분야별 수준 확인</li><li>다음에 읽을 책 발견</li></ol><p className="caption page-section">결과와 해설은 진단을 마친 후 확인해요.</p></Card></aside></div>;
}

export function ResultPanel() {
  return <><div className="result-layout"><Card variant="soft" tone="sand" className="level-result"><p className="eyebrow">MY BOOKLEVEL</p><h2>나의 현재 위치</h2><span className="level-number">—</span><LevelBadge level={null} /><p className="reading-copy page-section">아직 완료된 진단이 없어요.<br />진단을 마치면 결과가 표시됩니다.</p></Card><Card className="topic-card"><h2>분야별 이해도</h2><Progress label="개념 이해" value={null} /><Progress label="개념의 연결" value={null} tone="sage" /><Progress label="적용과 해석" value={null} /><p className="caption page-section">실제 문항의 주제에 따라 세부 결과가 구성됩니다.</p></Card></div><InsightCard title="평가 결과는 다음 독서를 위한 안내예요."><p>결과를 통해 익숙한 개념과 더 알아가면 좋은 주제를 함께 확인할 수 있어요. 진단 결과는 지능이나 학업 능력에 대한 판단이 아닙니다.</p></InsightCard><div className="button-row"><ButtonLink href="/assessment/economics">진단 알아보기 →</ButtonLink><ButtonLink href="/recommendations" variant="secondary">책 먼저 둘러보기</ButtonLink></div></>;
}
