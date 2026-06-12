import {
  apiErrorSchema,
  createUploadResponseSchema,
  invitationListResponseSchema,
  invitationResponseSchema,
  type CreateInvitationInput,
  type CreateUploadInput,
  type CreateUploadResponse,
  type Invitation,
  type UpdateInvitationInput,
} from "@yours-truly/shared";

/** Error carrying the API's { error: { code, message } } envelope. */
export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly code: string | undefined,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

// Same-origin (rewrite in dev, nginx in prod), so the session cookie rides
// along with fetch's default credentials mode.
async function request(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(path, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  if (res.status === 204) return null;
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const parsed = apiErrorSchema.safeParse(body);
    throw new ApiRequestError(
      parsed.success ? parsed.data.error.message : `요청에 실패했습니다 (${res.status})`,
      parsed.success ? parsed.data.error.code : undefined,
      res.status,
    );
  }
  return body;
}

export async function listInvitations(): Promise<Invitation[]> {
  return invitationListResponseSchema.parse(await request("/api/invitations")).invitations;
}

export async function createInvitation(input: CreateInvitationInput): Promise<Invitation> {
  const body = await request("/api/invitations", { method: "POST", body: JSON.stringify(input) });
  return invitationResponseSchema.parse(body).invitation;
}

export async function getInvitation(id: string): Promise<Invitation> {
  return invitationResponseSchema.parse(await request(`/api/invitations/${id}`)).invitation;
}

export async function updateInvitation(
  id: string,
  input: UpdateInvitationInput,
): Promise<Invitation> {
  const body = await request(`/api/invitations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return invitationResponseSchema.parse(body).invitation;
}

export async function deleteInvitation(id: string): Promise<void> {
  await request(`/api/invitations/${id}`, { method: "DELETE" });
}

export async function createUpload(input: CreateUploadInput): Promise<CreateUploadResponse> {
  const body = await request("/api/uploads", { method: "POST", body: JSON.stringify(input) });
  return createUploadResponseSchema.parse(body);
}
