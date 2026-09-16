-- Editorial taste metadata for real books already present in the verified catalog.
-- These values are human-curated from the book metadata and are optional for
-- the existing recommendation engine.
with profiles(source_id, dimensions) as (values
 ('apology-of-socrates','{"pace":55,"ambiguity":78,"realism":52,"emotionality":35,"intellectual_depth":88,"practical_vs_conceptual":92,"breadth_vs_depth":76,"plot_vs_character":48}'::jsonb),
 ('justice-philosophy','{"pace":48,"ambiguity":62,"realism":70,"emotionality":42,"intellectual_depth":82,"practical_vs_conceptual":88,"breadth_vs_depth":60,"plot_vs_character":35}'::jsonb),
 ('consolations-of-philosophy','{"pace":52,"ambiguity":65,"realism":64,"emotionality":58,"intellectual_depth":72,"practical_vs_conceptual":78,"breadth_vs_depth":50,"plot_vs_character":45}'::jsonb),
 ('flow-psychology','{"pace":50,"ambiguity":42,"realism":72,"emotionality":52,"intellectual_depth":68,"practical_vs_conceptual":55,"breadth_vs_depth":45,"plot_vs_character":40}'::jsonb),
 ('man-who-mistook-wife','{"pace":46,"ambiguity":58,"realism":78,"emotionality":68,"intellectual_depth":76,"practical_vs_conceptual":62,"breadth_vs_depth":55,"plot_vs_character":70}'::jsonb),
 ('guns-germs-steel','{"pace":42,"ambiguity":45,"realism":82,"emotionality":28,"intellectual_depth":78,"practical_vs_conceptual":62,"breadth_vs_depth":42,"plot_vs_character":20}'::jsonb),
 ('sapiens-society','{"pace":55,"ambiguity":52,"realism":70,"emotionality":35,"intellectual_depth":72,"practical_vs_conceptual":64,"breadth_vs_depth":18,"plot_vs_character":25}'::jsonb),
 ('bowling-alone','{"pace":38,"ambiguity":40,"realism":86,"emotionality":32,"intellectual_depth":68,"practical_vs_conceptual":48,"breadth_vs_depth":64,"plot_vs_character":22}'::jsonb),
 ('what-is-history','{"pace":40,"ambiguity":68,"realism":74,"emotionality":30,"intellectual_depth":82,"practical_vs_conceptual":75,"breadth_vs_depth":70,"plot_vs_character":18}'::jsonb),
 ('mediterranean-history','{"pace":30,"ambiguity":58,"realism":76,"emotionality":25,"intellectual_depth":90,"practical_vs_conceptual":72,"breadth_vs_depth":94,"plot_vs_character":15}'::jsonb),
 ('letters-korean-history','{"pace":62,"ambiguity":35,"realism":82,"emotionality":48,"intellectual_depth":48,"practical_vs_conceptual":44,"breadth_vs_depth":36,"plot_vs_character":28}'::jsonb),
 ('literary-theory-intro','{"pace":38,"ambiguity":80,"realism":48,"emotionality":35,"intellectual_depth":88,"practical_vs_conceptual":86,"breadth_vs_depth":72,"plot_vs_character":30}'::jsonb),
 ('great-gatsby','{"pace":52,"ambiguity":74,"realism":58,"emotionality":72,"intellectual_depth":64,"practical_vs_conceptual":46,"breadth_vs_depth":40,"plot_vs_character":82}'::jsonb),
 ('pride-and-prejudice','{"pace":58,"ambiguity":62,"realism":68,"emotionality":68,"intellectual_depth":55,"practical_vs_conceptual":42,"breadth_vs_depth":38,"plot_vs_character":78}'::jsonb),
 ('cosmos-science','{"pace":54,"ambiguity":48,"realism":62,"emotionality":38,"intellectual_depth":75,"practical_vs_conceptual":58,"breadth_vs_depth":18,"plot_vs_character":12}'::jsonb),
 ('selfish-gene','{"pace":42,"ambiguity":48,"realism":76,"emotionality":26,"intellectual_depth":82,"practical_vs_conceptual":70,"breadth_vs_depth":58,"plot_vs_character":10}'::jsonb),
 ('silent-spring','{"pace":44,"ambiguity":52,"realism":88,"emotionality":55,"intellectual_depth":70,"practical_vs_conceptual":58,"breadth_vs_depth":52,"plot_vs_character":15}'::jsonb),
 ('clean-code','{"pace":48,"ambiguity":28,"realism":84,"emotionality":18,"intellectual_depth":62,"practical_vs_conceptual":20,"breadth_vs_depth":72,"plot_vs_character":8}'::jsonb),
 ('ai-2041','{"pace":68,"ambiguity":62,"realism":58,"emotionality":55,"intellectual_depth":60,"practical_vs_conceptual":54,"breadth_vs_depth":20,"plot_vs_character":58}'::jsonb),
 ('age-of-ai','{"pace":42,"ambiguity":66,"realism":72,"emotionality":30,"intellectual_depth":80,"practical_vs_conceptual":76,"breadth_vs_depth":24,"plot_vs_character":18}'::jsonb)
)
insert into public.book_taste_profiles(book_id,dimensions,source,confidence,review_status,model_version)
select b.id,p.dimensions,'editorial',0.8,'verified',null
from profiles p join public.books b on b.source_provider='editorial' and b.source_id=p.source_id
on conflict(book_id) do update set dimensions=excluded.dimensions,source=excluded.source,confidence=excluded.confidence,review_status=excluded.review_status,updated_at=now();
