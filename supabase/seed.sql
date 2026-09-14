insert into public.categories(slug,name) values
('economics','경제'),('philosophy','철학'),('psychology','심리'),('society','사회'),('history','역사'),('literature','문학'),('science','과학'),('ai-tech','AI·기술')
on conflict(slug) do update set name=excluded.name;
-- Real books are imported through metadata providers. No fabricated ISBNs.
-- Question-bank publication is an admin action after editorial verification.
