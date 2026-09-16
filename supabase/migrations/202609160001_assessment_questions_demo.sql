-- Verified starter question bank for the first live assessment flow.
-- Additional categories can be added through the editorial/admin workflow.
insert into public.assessment_questions(
  category_id, level, topic, question, options, correct_option, explanation, is_active
)
select c.id, q.level, q.topic, q.question, q.options::jsonb, q.correct_option, q.explanation, true
from public.categories c
join (values
  ('economics', 1, '수요와 공급', '가격이 균형가격보다 낮게 묶이면 일반적으로 어떤 현상이 나타날까요?', '[{"id":"A","text":"공급 과잉"},{"id":"B","text":"수요 초과"},{"id":"C","text":"거래량 무조건 증가"},{"id":"D","text":"시장 변화 없음"}]', 'B', '가격 상한이 균형가격보다 낮으면 사고 싶은 사람은 늘고 팔려는 사람은 줄어 수요 초과가 발생합니다.'),
  ('economics', 1, '기회비용', '어떤 선택의 기회비용은 무엇인가요?', '[{"id":"A","text":"지불한 현금만"},{"id":"B","text":"선택한 대안의 총비용"},{"id":"C","text":"포기한 대안 중 가장 가치 있는 것"},{"id":"D","text":"미래의 모든 손실"}]', 'C', '기회비용은 선택 때문에 포기한 대안 가운데 가장 가치 있는 편익입니다.'),
  ('economics', 2, '물가와 구매력', '인플레이션이 발생하면 다른 조건이 같을 때 화폐의 실질 구매력은 어떻게 되나요?', '[{"id":"A","text":"상승"},{"id":"B","text":"하락"},{"id":"C","text":"항상 동일"},{"id":"D","text":"환율에만 좌우"}]', 'B', '물가가 전반적으로 오르면 같은 금액으로 살 수 있는 재화와 서비스가 줄어 실질 구매력이 하락합니다.'),
  ('economics', 2, '국민소득', 'GDP가 증가해도 국민의 삶의 질이 반드시 높아진다고 할 수 없는 이유는 무엇인가요?', '[{"id":"A","text":"GDP는 물가를 전혀 반영하지 않아서"},{"id":"B","text":"분배·환경·가사노동 등을 충분히 반영하지 않아서"},{"id":"C","text":"GDP는 생산을 측정하지 않아서"},{"id":"D","text":"GDP는 항상 감소하기 때문에"}]', 'B', 'GDP는 시장에서 거래된 생산의 규모에 가깝고 소득 분배, 환경 비용, 건강과 여가 같은 요소를 모두 반영하지 않습니다.'),
  ('economics', 3, '탄력성', '수요의 가격탄력성이 1보다 크다는 뜻은 무엇인가요?', '[{"id":"A","text":"가격 변화율보다 수요량 변화율이 크다"},{"id":"B","text":"수요가 가격과 무관하다"},{"id":"C","text":"공급량이 가격보다 크다"},{"id":"D","text":"가격이 항상 고정된다"}]', 'A', '탄력성의 절댓값이 1보다 크면 가격 1% 변화에 수요량이 1%보다 크게 반응합니다.'),
  ('economics', 3, '시장 실패', '부정적 외부효과의 대표적인 사례는 무엇인가요?', '[{"id":"A","text":"예방접종의 감염 감소 효과"},{"id":"B","text":"공장의 오염물질 배출"},{"id":"C","text":"개인의 저축 증가"},{"id":"D","text":"기업의 내부 회계 처리"}]', 'B', '부정적 외부효과는 거래 당사자가 아닌 제3자에게 비용을 떠넘기는 현상이며 오염이 대표적입니다.'),
  ('economics', 4, '통화정책', '중앙은행이 기준금리를 올릴 때 일반적으로 기대되는 효과는 무엇인가요?', '[{"id":"A","text":"차입 비용 하락"},{"id":"B","text":"총수요와 물가 상승 압력 완화"},{"id":"C","text":"통화량 무조건 증가"},{"id":"D","text":"모든 자산 가격 상승"}]', 'B', '금리 인상은 차입과 소비·투자를 둔화시키는 경로를 통해 수요와 물가 상승 압력을 낮출 수 있습니다.'),
  ('economics', 4, '정보 비대칭', '도덕적 해이란 무엇인가요?', '[{"id":"A","text":"정보가 부족해 거래가 불가능한 상태"},{"id":"B","text":"보호받는 사람이 위험한 행동을 더 할 유인"},{"id":"C","text":"모든 사람이 정직한 행동을 하는 상태"},{"id":"D","text":"가격이 급격히 하락하는 현상"}]', 'B', '보험 가입 후 위험 관리 노력을 줄이는 것처럼 보호 장치가 행동 유인을 바꾸는 현상입니다.'),
  ('economics', 5, '무역', '비교우위가 있는 상품의 무역이 양국에 이익이 될 수 있는 핵심 이유는 무엇인가요?', '[{"id":"A","text":"모든 상품을 더 많이 생산해서"},{"id":"B","text":"상대적으로 낮은 기회비용에 특화해서"},{"id":"C","text":"무역 상대국의 생산을 금지해서"},{"id":"D","text":"환율을 고정해서"}]', 'B', '절대 생산성이 아니라 상대적 기회비용이 낮은 생산에 특화하면 교환을 통해 총생산과 소비 가능성이 커질 수 있습니다.'),
  ('economics', 5, '노동시장', '실업률을 해석할 때 함께 확인해야 하는 지표는 무엇인가요?', '[{"id":"A","text":"노동시장 참가율"},{"id":"B","text":"강수량"},{"id":"C","text":"국토 면적"},{"id":"D","text":"통화 단위"}]', 'A', '구직을 포기한 사람이 실업자로 잡히지 않을 수 있으므로 노동시장 참가율과 고용률을 함께 봐야 합니다.')
) as q(slug, level, topic, question, options, correct_option, explanation) on q.slug = c.slug
where not exists (
  select 1 from public.assessment_questions existing
  where existing.category_id = c.id and existing.question = q.question
);
