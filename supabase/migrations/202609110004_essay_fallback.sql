alter table public.essay_questions drop constraint essay_questions_source_check;
alter table public.essay_questions add constraint essay_questions_source_check check(source in ('ai','admin','fallback'));
drop policy if exists essay_questions_read on public.essay_questions;
create policy essay_questions_read on public.essay_questions for select using(is_active and (created_by=auth.uid() or source in ('admin','fallback')));
