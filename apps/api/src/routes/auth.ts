import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import {
  loginInputSchema,
  registerInputSchema,
  type AuthResponse,
} from "@yours-truly/shared";
import { db, schema } from "../db/index.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import {
  clearSessionCookie,
  createSession,
  destroySession,
  getSessionUser,
  setSessionCookie,
  toPublicUser,
} from "../auth/session.js";

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/register
  app.post("/register", async (request, reply) => {
    const parsed = registerInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: { code: "invalid_input", message: parsed.error.message } });
    }
    const { email, name, password } = parsed.data;

    const [existing] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    if (existing) {
      return reply
        .status(409)
        .send({ error: { code: "email_taken", message: "Email already registered" } });
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(schema.users)
      .values({ email, name, passwordHash })
      .returning();

    const session = await createSession(user.id);
    setSessionCookie(reply, session.id, session.expiresAt);

    const body: AuthResponse = { user: toPublicUser(user) };
    return reply.status(201).send(body);
  });

  // POST /api/auth/login
  app.post("/login", async (request, reply) => {
    const parsed = loginInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: { code: "invalid_input", message: parsed.error.message } });
    }
    const { email, password } = parsed.data;

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    // Same response whether the user is missing or the password is wrong,
    // so the endpoint doesn't reveal which emails are registered.
    const ok = user ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !ok) {
      return reply
        .status(401)
        .send({ error: { code: "invalid_credentials", message: "Invalid email or password" } });
    }

    const session = await createSession(user.id);
    setSessionCookie(reply, session.id, session.expiresAt);

    const body: AuthResponse = { user: toPublicUser(user) };
    return reply.send(body);
  });

  // POST /api/auth/logout
  app.post("/logout", async (request, reply) => {
    await destroySession(request);
    clearSessionCookie(reply);
    return reply.status(204).send();
  });

  // GET /api/auth/me
  app.get("/me", async (request, reply) => {
    const user = await getSessionUser(request);
    if (!user) {
      return reply
        .status(401)
        .send({ error: { code: "unauthenticated", message: "Not signed in" } });
    }
    const body: AuthResponse = { user };
    return reply.send(body);
  });
}
