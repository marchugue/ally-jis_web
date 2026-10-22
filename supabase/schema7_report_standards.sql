-- Adds the community standards used by the user / message report flows.
-- NOTE: The backend also upserts these rows on demand (see
-- ally-jis_backend_full_v5/src/app/constants/reportTaxonomy.ts), so running this
-- file is optional — it just makes the lookup tables complete up front.
--
-- Message reports are stored as `[MSG:<message uuid>] <notes>` in
-- reports.internal_notes (same convention as `[POST:<post uuid>]`), so no schema
-- change is required.

insert into public.report_categories (id, label, description, sort_order) values
  ('scams-fraud',      'Scams & Fraud',        'Attempts to trick you out of money, items, or personal details.', 5),
  ('account-security', 'Hacked or Fake Account','Accounts that appear compromised or are pretending to be someone else.', 6)
on conflict (id) do nothing;

insert into public.violations (id, category_id, label, description, sort_order) values
  ('scam-victim',           'scams-fraud',      'I got scammed',                 'This person scammed me out of money, items, or information.', 0),
  ('scam-money-request',    'scams-fraud',      'Asked for money or payment',    'Pressuring for money, gift cards, or advance payment.', 1),
  ('scam-phishing',         'scams-fraud',      'Phishing or suspicious link',   'Links or requests meant to steal passwords or personal details.', 2),
  ('scam-fake-sale',        'scams-fraud',      'Fake item or service',          'Selling items or services that are not real or never delivered.', 3),
  ('account-hacked-mine',   'account-security', 'My account got hacked',         'Someone else gained access to my account.', 0),
  ('account-hacked-theirs', 'account-security', 'This account looks hacked',     'Behavior suddenly changed or is sending suspicious messages.', 1),
  ('account-fake',          'account-security', 'Fake or duplicate account',     'An account that is fake, duplicated, or created to deceive.', 2)
on conflict (id) do nothing;
