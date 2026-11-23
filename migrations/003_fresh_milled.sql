-- Add the fresh-milled flour tag where the recipe text says fresh-milled.
-- Same rule as withFreshMilledTag in scripts/tags.mjs. A later import from
-- the old site applies that function, so this update is for a database that
-- was already imported.

update recipes
set tags = (
  select coalesce(jsonb_agg(tag order by tag), '[]'::jsonb)
  from (
    select distinct tag
    from (
      select jsonb_array_elements_text(recipes.tags) as tag
      union all
      select 'fresh-milled flour'
    ) collected
    where tag is not null and tag <> ''
  ) unique_tags
)
where concat_ws(' ', title, summary, notes, ingredients::text, directions::text) ~* 'fresh[[:space:]-]*milled';
