import { eq } from "drizzle-orm";
import { auth } from "../auth/auth.js";
import { closeDb, db, schema } from "./index.js";

/**
 * Dev seed — a demo account and a published invitation so a fresh local
 * environment renders something at /invitations/demo-wedding immediately.
 * Idempotent: re-running changes nothing. Never run against production
 * (the deploy pipeline doesn't call it).
 */
const DEMO_USER = {
  email: "demo@example.com",
  password: "demo-password-1",
  name: "데모 부부",
};

const DEMO_INVITATION = {
  slug: "demo-wedding",
  status: "published" as const,
  design: {
    groomName: "김민준",
    brideName: "이민지",
    dateTime: "2026-10-24T04:00:00.000Z", // 13:00 KST
    venueName: "더채플앳청담",
    venueAddress: "서울 강남구 선릉로 757",
    message:
      "서로가 마주보며 다져온 사랑을\n이제 함께 한 곳을 바라보며\n걸어가고자 합니다.\n\n저희 두 사람의 첫걸음을\n축복해 주시면 감사하겠습니다.",
  },
};

let [user] = await db
  .select()
  .from(schema.users)
  .where(eq(schema.users.email, DEMO_USER.email))
  .limit(1);

if (user) {
  console.log(`seed: user ${DEMO_USER.email} already exists`);
} else {
  // Through Better Auth so the credential account is hashed/linked the same
  // way a real sign-up would be (the demo login works in the UI).
  await auth.api.signUpEmail({ body: DEMO_USER });
  [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, DEMO_USER.email))
    .limit(1);
  console.log(`seed: created user ${DEMO_USER.email} (password: ${DEMO_USER.password})`);
}

const inserted = await db
  .insert(schema.invitations)
  .values({ userId: user.id, ...DEMO_INVITATION })
  .onConflictDoNothing({ target: schema.invitations.slug })
  .returning({ slug: schema.invitations.slug });

console.log(
  inserted.length > 0
    ? `seed: created published invitation /invitations/${DEMO_INVITATION.slug}`
    : `seed: invitation ${DEMO_INVITATION.slug} already exists`,
);

await closeDb();
process.exit(0);
