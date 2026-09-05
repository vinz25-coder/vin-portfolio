import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/202609040001_guestbook_review_integrity.sql",
  ),
  "utf8",
);
const pushMigration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/202609040002_guestbook_push.sql"),
  "utf8",
);
const reactionMigration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/202609040003_guestbook_reactions.sql",
  ),
  "utf8",
);
const compactReactionMigration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/202609040004_guestbook_portfolio_reactions_compact.sql",
  ),
  "utf8",
);
const reviewProfileMigration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/202609040005_guestbook_review_profile_repair.sql",
  ),
  "utf8",
);
const moderationMigration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/202609050001_guestbook_moderation_protection.sql",
  ),
  "utf8",
);
const blockedStorageMigration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/202609050002_guestbook_blocked_storage.sql",
  ),
  "utf8",
);
const revision = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/202609050003_guestbook_approved_revision.sql",
  ),
  "utf8",
);
const multiCategoryRevision = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/202609050004_guestbook_review_categories.sql",
  ),
  "utf8",
);

describe("approved Guestbook revision migration", () => {
  it("backfills root categories and tombstone sources without removing existing data", () => {
    expect(revision).toContain("set review_category = 'portfolio'");
    expect(revision).toContain(
      "entry_type = 'review' and parent_id is null and review_category is not null",
    );
    expect(revision).toContain(
      "entry_type <> 'review' and review_category is null",
    );
    expect(revision).toContain("set deletion_source = 'commenter'");
    expect(revision).toContain("'site_author'");
    expect(revision).not.toMatch(/drop table|drop index/i);
  });
  it("returns category/source but no mention IDs or deletion actor UUID", () => {
    const feed = revision
      .split("create or replace function public.guestbook_feed")[1]
      .split("create function public.permanently_delete")[0];
    expect(feed).toContain("'review_category'");
    expect(feed).toContain("'deletion_source'");
    expect(feed).not.toContain("'mentions'");
    expect(feed).not.toContain("deleted_by");
    expect(revision).not.toContain("p_mentioned_user_ids");
    expect(revision).toContain(
      "coalesce(p_review_category, existing_entry.review_category)",
    );
  });
  it("retains cross-category sorting and active-review lookup", () => {
    const active = revision
      .split(
        "create or replace function public.guestbook_my_active_review()",
      )[1]
      .split("create or replace function public.guestbook_feed")[0];
    expect(active).not.toContain("review_category");
    expect(active).not.toContain("is_hidden");
    expect(revision).toContain(
      "case when p_sort = 'highest_rated' then root.rating end",
    );
    expect(revision).not.toContain(
      "create or replace function public.guestbook_rating_summary",
    );
  });
  it("serializes authoritative parent_id subtree collection and deletes deepest first with service-role-only access", () => {
    const deletion = revision.split(
      "create function public.permanently_delete_guestbook_subtree",
    )[1];
    expect(deletion).toContain(
      "lock table public.guestbook_entries in share row exclusive mode",
    );
    expect(deletion).toContain("child.parent_id = parent.id");
    expect(deletion).toContain("array_agg(id order by distance desc, id)");
    expect(deletion.indexOf("into subtree_ids, image_paths")).toBeLessThan(
      deletion.indexOf("delete from public.guestbook_entries"),
    );
    expect(deletion).not.toContain("reply_recipient_id");
    expect(deletion).toContain("from public, anon, authenticated");
    expect(deletion).toContain(
      "grant execute on function public.permanently_delete_guestbook_subtree(uuid) to service_role",
    );
  });
});

describe("Guestbook multi-category review migration", () => {
  it("converts existing categories to validated arrays without duplicating reviews", () => {
    expect(multiCategoryRevision).toContain(
      "rename column review_category to review_categories",
    );
    expect(multiCategoryRevision).toContain("else array[review_categories]");
    expect(multiCategoryRevision).toContain(
      "cardinality(p_categories) between 1 and 6",
    );
    expect(multiCategoryRevision).toContain("p_review_categories text[]");
    expect(multiCategoryRevision).toContain("'review_categories'");
    expect(multiCategoryRevision).not.toMatch(
      /guestbook_rating_summary|one_active_review/i,
    );
  });
});

describe("guestbook review integrity migration", () => {
  it("enforces one active root review per author without deleting duplicates", () => {
    expect(migration).toContain(
      "guestbook_entries_one_active_review_per_author_idx",
    );
    expect(migration).toContain("where parent_id is null");
    expect(migration).toContain("and deleted_at is null");
    expect(migration).toContain("Resolve duplicate active guestbook reviews");
    expect(migration).not.toMatch(/delete from public\.guestbook_entries/i);
  });

  it("keeps entry types immutable and limits new reactions", () => {
    expect(migration).toContain("guestbook_entries_keep_type");
    expect(migration).toContain(
      "p_reaction_type not in ('thumb', 'heart', 'clap')",
    );
    expect(migration).toContain("guestbook_my_active_review");
  });
});

describe("guestbook reaction redesign migration", () => {
  it("enforces one Like or Dislike per account and clears legacy votes", () => {
    expect(reactionMigration).toContain("add value if not exists 'dislike'");
    expect(reactionMigration).toContain(
      "delete from public.guestbook_reactions",
    );
    expect(reactionMigration).toContain(
      "guestbook_reactions_one_vote_per_user",
    );
    expect(reactionMigration).toContain(
      "p_reaction_type not in ('thumb', 'dislike')",
    );
    expect(reactionMigration).toContain("reaction.reaction_type = 'thumb'");
  });

  it("keeps portfolio reactions private and exposes aggregate RPCs", () => {
    expect(reactionMigration).toContain(
      "create table public.portfolio_reactions",
    );
    expect(reactionMigration).toContain("primary key (user_id, reaction_type)");
    expect(reactionMigration).toContain(
      "revoke all on public.portfolio_reactions from anon, authenticated",
    );
    expect(reactionMigration).toContain("guestbook_portfolio_reaction_summary");
    expect(reactionMigration).toContain("toggle_guestbook_portfolio_reaction");
  });
});

describe("compact portfolio reaction migration", () => {
  it("keeps only the five approved horizontal reactions", () => {
    expect(compactReactionMigration).toContain(
      "('thumbs_up', 1), ('heart', 2), ('fire', 3), ('clap', 4), ('rocket', 5)",
    );
    expect(compactReactionMigration).toContain(
      "reaction_type not in ('thumbs_up', 'heart', 'fire', 'clap', 'rocket')",
    );
    expect(compactReactionMigration).not.toContain("'wave', 4");
    expect(compactReactionMigration).not.toContain("'hundred', 8");
  });
});

describe("guestbook review profile repair migration", () => {
  it("backfills Google profiles and exposes authenticated self-healing", () => {
    expect(reviewProfileMigration).toContain(
      "insert into public.profiles (id, display_name, avatar_url)",
    );
    expect(reviewProfileMigration).toContain("ensure_guestbook_profile");
    expect(reviewProfileMigration).toContain(
      "grant execute on function public.ensure_guestbook_profile() to authenticated",
    );
  });

  it("returns a nullable JSON review and revokes anonymous execution", () => {
    expect(reviewProfileMigration).toContain("returns jsonb");
    expect(reviewProfileMigration).toContain("select to_jsonb(entry)");
    expect(reviewProfileMigration).toContain(
      "revoke all on function public.guestbook_my_active_review() from public, anon",
    );
  });
});

describe("guestbook moderation protection migration", () => {
  it("adds private block and rate-limit state with approved windows", () => {
    expect(moderationMigration).toContain("guestbook_blocked_users");
    expect(moderationMigration).toContain("guestbook_mutation_events");
    expect(moderationMigration).toContain("pg_advisory_xact_lock");
    expect(moderationMigration).toContain(
      "3; window_start := now() - interval '10 minutes'",
    );
    expect(moderationMigration).toContain(
      "10; window_start := now() - interval '10 minutes'",
    );
    expect(moderationMigration).toContain(
      "5; window_start := now() - interval '30 minutes'",
    );
    expect(moderationMigration).toContain(
      "30; window_start := now() - interval '1 minute'",
    );
  });

  it("normalizes and classifies suspicious or duplicate content", () => {
    expect(moderationMigration).toContain("normalize_guestbook_body");
    expect(moderationMigration).toContain("link_only");
    expect(moderationMigration).toContain("excessive_urls");
    expect(moderationMigration).toContain("interval '24 hours'");
    expect(moderationMigration).toContain("GUESTBOOK_DUPLICATE_BODY");
  });

  it("rejects self-reporting and quarantines three unique reports", () => {
    expect(moderationMigration).toContain("GUESTBOOK_SELF_REPORT");
    expect(moderationMigration).toContain("count(distinct reporter_id)");
    expect(moderationMigration).toContain("moderation_status = 'quarantined'");
  });

  it("blocks new or replaced media while preserving subscription cleanup", () => {
    expect(blockedStorageMigration).toContain(
      "drop policy guestbook_images_own_insert",
    );
    expect(blockedStorageMigration).toContain(
      "select 1 from public.guestbook_blocked_users",
    );
    expect(blockedStorageMigration).toContain(
      "drop policy guestbook_images_own_update",
    );
    expect(blockedStorageMigration).toContain(
      "create policy guestbook_images_own_delete",
    );
  });
});

describe("guestbook push migration", () => {
  it("provides visible community metrics and private push tables", () => {
    expect(pushMigration).toContain("guestbook_community_summary");
    expect(pushMigration).toContain("total_discussions");
    expect(pushMigration).toContain("guestbook_push_subscriptions");
    expect(pushMigration).toContain("guestbook_push_deliveries");
    expect(pushMigration).toContain(
      "revoke all on public.guestbook_push_subscriptions from anon, authenticated",
    );
  });

  it("keeps reply recipients before depth normalization and deduplicates delivery", () => {
    expect(pushMigration).toContain("reply_recipient_id");
    expect(pushMigration).toContain(
      "new.reply_recipient_id := parent_entry.author_id",
    );
    expect(pushMigration).toContain("unique (reply_id, subscription_id)");
  });
});
