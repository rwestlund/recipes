-- Fold imported tags into a smaller set, then drop fields that are no longer shown.
-- The case list matches scripts/tags.mjs. Labels that are not listed are dropped.

update recipes
set tags = coalesce(
  (
    select jsonb_agg(tag order by tag)
    from (
      select distinct case lower(raw)
        when 'alcohol' then 'drink'
        when 'appetizer' then 'appetizer'
        when 'asian' then null
        when 'beverage' then 'drink'
        when 'bread' then 'bread'
        when 'breakfast' then 'breakfast'
        when 'cake' then 'dessert'
        when 'camping' then 'camping'
        when 'carnivorous' then null
        when 'chinese' then null
        when 'chocolate' then 'chocolate'
        when 'cold' then null
        when 'complex' then null
        when 'cookies' then 'cookies'
        when 'cracker' then 'appetizer'
        when 'cupcake' then 'dessert'
        when 'dessert' then 'dessert'
        when 'dinner' then 'dinner'
        when 'dip' then 'appetizer'
        when 'dressing' then 'sauce'
        when 'drink' then 'drink'
        when 'easy' then 'easy'
        when 'frosting' then 'dessert'
        when 'fruit dessert' then 'dessert'
        when 'glaze' then 'dessert'
        when 'greek' then null
        when 'indian' then null
        when 'lunch' then 'lunch'
        when 'mexican' then null
        when 'nuts' then null
        when 'pasta' then 'pasta'
        when 'pie' then 'dessert'
        when 'pudding' then 'dessert'
        when 'quick bread' then 'bread'
        when 'rice' then null
        when 'russian' then null
        when 'salad' then 'side dish'
        when 'sauce' then 'sauce'
        when 'side' then 'side dish'
        when 'side dish' then 'side dish'
        when 'slow cooker' then 'slow cooker'
        when 'snack' then 'appetizer'
        when 'soup' then 'soup'
        when 'spicy' then null
        when 'tea' then 'drink'
        when 'vegan' then null
        when 'vegetable' then 'side dish'
        when 'yeast bread' then 'bread'
        else null
      end as tag
      from jsonb_array_elements_text(recipes.tags) as raw
    ) mapped
    where tag is not null
  ),
  '[]'::jsonb
);

alter table recipes drop column oven;
alter table recipes drop column source;
alter table recipes drop column author_name;
