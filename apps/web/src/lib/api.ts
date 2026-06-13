import {
  apiErrorSchema,
  createGuestUploadResponseSchema,
  createUploadResponseSchema,
  guestUploadEntrySchema,
  guestUploadListResponseSchema,
  guestbookEntrySchema,
  guestbookListResponseSchema,
  invitationListResponseSchema,
  invitationResponseSchema,
  rsvpListResponseSchema,
  type ConfirmGuestUploadInput,
  type CreateGuestUploadInput,
  type CreateGuestUploadResponse,
  type CreateGuestbookInput,
  type CreateInvitationInput,
  type CreateRsvpInput,
  type CreateUploadInput,
  type CreateUploadResponse,
  type GuestbookEntry,
  type GuestbookListResponse,
  type GuestUploadEntry,
  type GuestUploadListResponse,
  type Invitation,
  type RsvpListResponse,
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

// --- Guest-facing features (RSVP / guestbook / guest uploads) ---
// Public actions need no session; owner reads/moderation ride the cookie.

export async function submitRsvp(invitationId: string, input: CreateRsvpInput): Promise<void> {
  await request(`/api/invitations/${invitationId}/rsvp`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getRsvps(invitationId: string): Promise<RsvpListResponse> {
  return rsvpListResponseSchema.parse(await request(`/api/invitations/${invitationId}/rsvp`));
}

export async function deleteRsvp(invitationId: string, rsvpId: string): Promise<void> {
  await request(`/api/invitations/${invitationId}/rsvp/${rsvpId}`, { method: "DELETE" });
}

export async function getGuestbook(
  invitationId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<GuestbookListResponse> {
  const params = new URLSearchParams();
  if (opts.limit != null) params.set("limit", String(opts.limit));
  if (opts.offset != null) params.set("offset", String(opts.offset));
  const qs = params.toString();
  return guestbookListResponseSchema.parse(
    await request(`/api/invitations/${invitationId}/guestbook${qs ? `?${qs}` : ""}`),
  );
}

export async function submitGuestbook(
  invitationId: string,
  input: CreateGuestbookInput,
): Promise<GuestbookEntry> {
  const body = await request(`/api/invitations/${invitationId}/guestbook`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return guestbookEntrySchema.parse((body as { entry: unknown }).entry);
}

export async function deleteGuestbookEntry(
  invitationId: string,
  entryId: string,
  pin?: string,
): Promise<void> {
  await request(`/api/invitations/${invitationId}/guestbook/${entryId}`, {
    method: "DELETE",
    body: pin ? JSON.stringify({ pin }) : undefined,
  });
}

export async function presignGuestUpload(
  invitationId: string,
  input: CreateGuestUploadInput,
): Promise<CreateGuestUploadResponse> {
  const body = await request(`/api/invitations/${invitationId}/guest-uploads`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return createGuestUploadResponseSchema.parse(body);
}

export async function confirmGuestUpload(
  invitationId: string,
  input: ConfirmGuestUploadInput,
): Promise<GuestUploadEntry> {
  const body = await request(`/api/invitations/${invitationId}/guest-uploads/confirm`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return guestUploadEntrySchema.parse((body as { upload: unknown }).upload);
}

export async function getGuestUploads(invitationId: string): Promise<GuestUploadListResponse> {
  return guestUploadListResponseSchema.parse(
    await request(`/api/invitations/${invitationId}/guest-uploads`),
  );
}

export async function deleteGuestUpload(invitationId: string, uploadId: string): Promise<void> {
  await request(`/api/invitations/${invitationId}/guest-uploads/${uploadId}`, { method: "DELETE" });
}
