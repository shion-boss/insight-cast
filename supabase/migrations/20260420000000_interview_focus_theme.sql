alter table interviews
  add column focus_theme_mode text not null default 'omakase'
    check (focus_theme_mode in ('omakase', 'custom', 'suggested')),
  add column focus_theme text;
