create table recipes (
  id serial primary key,
  legacy_id integer unique,
  title text not null,
  summary text not null default '',
  amount text not null default '',
  time text not null default '',
  oven text not null default '',
  source text not null default '',
  notes text not null default '',
  author_name text not null default '',
  ingredients jsonb not null default '[]'::jsonb,
  directions jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table links (
  src_id integer not null references recipes (id) on delete cascade,
  dest_id integer not null references recipes (id) on delete cascade,
  primary key (src_id, dest_id),
  check (src_id <> dest_id)
);

create index links_dest_idx on links (dest_id);

create table photos (
  id serial primary key,
  recipe_id integer not null references recipes (id) on delete cascade,
  bytes bytea not null,
  created_at timestamptz not null default now(),
  constraint photos_bytes_size check (octet_length(bytes) < 3000000)
);

create index photos_recipe_idx on photos (recipe_id);

create table app_meta (
  key text primary key,
  value text not null
);
