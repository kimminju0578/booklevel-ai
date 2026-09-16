-- Spread correct answers across A-D while preserving each question's meaning.
-- The option text is swapped with the target answer position, so existing
-- question snapshots remain valid and newly created attempts are balanced.
with ranked as (
  select id, correct_option,
    chr(65 + ((row_number() over (partition by category_id order by id) - 1)::int % 4)) as target_option
  from public.assessment_questions
  where is_active
), rewritten as (
  select q.id, r.target_option,
    jsonb_agg(
      jsonb_build_object(
        'id', case when option->>'id' = q.correct_option then r.target_option
                  when option->>'id' = r.target_option then q.correct_option
                  else option->>'id' end,
        'text', option->>'text'
      )
      order by case when option->>'id' = q.correct_option then r.target_option
                    when option->>'id' = r.target_option then q.correct_option
                    else option->>'id' end
    ) as options
  from public.assessment_questions q
  join ranked r on r.id = q.id
  cross join lateral jsonb_array_elements(q.options) as elements(option)
  group by q.id, q.correct_option, r.target_option
)
update public.assessment_questions q
set options = rewritten.options,
    correct_option = rewritten.target_option
from rewritten
where q.id = rewritten.id;
