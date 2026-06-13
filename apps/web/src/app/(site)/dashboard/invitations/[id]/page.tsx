"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState, type FormEvent } from "react";
import {
  DEFAULT_INVITATION_TEMPLATE_ID,
  invitationDesignFieldsSchema,
  resolveInvitationTemplateId,
  type Invitation,
  type InvitationDesignFields,
  type InvitationTemplateId,
} from "@yours-truly/shared";
import {
  ApiRequestError,
  createUpload,
  deleteInvitation,
  getInvitation,
  updateInvitation,
} from "@/lib/api";
import { assetUrl, isRenderableAssetKey } from "@/lib/assets";
import { reencodeToJpeg } from "@/lib/image-processing";
import { TemplatePicker } from "../../template-picker";
import styles from "../../dashboard.module.scss";

// The ceremony time is always entered and shown as Korean wall-clock time: the
// product is Korean-market and the guest page renders pinned to Asia/Seoul (see
// templates/format.ts). So the datetime-local picker is interpreted against a
// fixed +09:00 — NOT the editor's browser timezone, which would otherwise shift
// the stored instant when a couple edits from abroad. KST has no DST in the
// modern era, so a constant offset is exact for any wedding date.
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** datetime-local input value (KST wall time) for an ISO instant. */
function isoToLocalInput(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // Shift the instant into KST, then read UTC fields so the picker shows
  // Korean wall time regardless of where the editor is.
  const kst = new Date(d.getTime() + KST_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${kst.getUTCFullYear()}-${pad(kst.getUTCMonth() + 1)}-${pad(kst.getUTCDate())}T${pad(kst.getUTCHours())}:${pad(kst.getUTCMinutes())}`;
}

/** ISO instant for a datetime-local value read as KST wall time. */
function localInputToIso(value: string): string | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return undefined;
  const [, year, month, day, hour, minute] = m;
  // These components are KST wall time; the UTC instant is 9h earlier.
  return new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)) -
      KST_OFFSET_MS,
  ).toISOString();
}

const FIELD_KEYS = [
  "template",
  "groomName",
  "brideName",
  "dateTime",
  "venueName",
  "venueAddress",
  "message",
  "heroImageKey",
] as const;

export default function InvitationEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [template, setTemplate] = useState<InvitationTemplateId>(DEFAULT_INVITATION_TEMPLATE_ID);
  const [form, setForm] = useState({
    groomName: "",
    brideName: "",
    dateTimeLocal: "",
    venueName: "",
    venueAddress: "",
    message: "",
    heroImageKey: "",
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusPending, setStatusPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInvitation(id)
      .then((inv) => {
        setInvitation(inv);
        const parsed = invitationDesignFieldsSchema.safeParse(inv.design);
        const fields: InvitationDesignFields = parsed.success ? parsed.data : {};
        setTemplate(resolveInvitationTemplateId(fields.template));
        setForm({
          groomName: fields.groomName ?? "",
          brideName: fields.brideName ?? "",
          dateTimeLocal: isoToLocalInput(fields.dateTime),
          venueName: fields.venueName ?? "",
          venueAddress: fields.venueAddress ?? "",
          message: fields.message ?? "",
          heroImageKey: isRenderableAssetKey(fields.heroImageKey, inv.id)
            ? fields.heroImageKey
            : "",
        });
      })
      .catch((e: unknown) =>
        setLoadError(
          e instanceof ApiRequestError && e.status === 404
            ? "청첩장을 찾을 수 없습니다."
            : e instanceof Error
              ? e.message
              : "불러오지 못했습니다.",
        ),
      );
  }, [id]);

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setNotice(null);
  }

  /** Known fields are rebuilt from the form; unknown design keys survive. */
  function buildDesign(): Record<string, unknown> {
    const design: Record<string, unknown> = { ...invitation?.design };
    for (const key of FIELD_KEYS) delete design[key];
    design.template = template;
    if (form.groomName.trim()) design.groomName = form.groomName.trim();
    if (form.brideName.trim()) design.brideName = form.brideName.trim();
    const iso = localInputToIso(form.dateTimeLocal);
    if (iso) design.dateTime = iso;
    if (form.venueName.trim()) design.venueName = form.venueName.trim();
    if (form.venueAddress.trim()) design.venueAddress = form.venueAddress.trim();
    if (form.message.trim()) design.message = form.message;
    if (form.heroImageKey) design.heroImageKey = form.heroImageKey;
    return design;
  }

  async function onHeroFile(file: File | undefined) {
    if (!file || !invitation) return;
    setUploadError(null);
    setUploading(true);
    try {
      // Re-encode client-side: bounds size for KakaoTalk previews, strips
      // EXIF (GPS!) before the bytes reach the public bucket.
      const blob = await reencodeToJpeg(file);
      const { uploadUrl, key } = await createUpload({
        invitationId: invitation.id,
        contentType: "image/jpeg",
        size: blob.size,
      });
      const put = await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": "image/jpeg" },
      });
      if (!put.ok) throw new Error(`업로드에 실패했습니다 (${put.status})`);
      setField("heroImageKey", key);
    } catch (e) {
      setUploadError(
        e instanceof ApiRequestError && e.code === "uploads_unavailable"
          ? "이미지 업로드가 아직 설정되지 않았습니다."
          : e instanceof Error
            ? e.message
            : "업로드에 실패했습니다.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!invitation) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateInvitation(invitation.id, { design: buildDesign() });
      setInvitation(updated);
      setNotice("저장되었습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus() {
    if (!invitation) return;
    setStatusPending(true);
    setError(null);
    try {
      const updated = await updateInvitation(invitation.id, {
        status: invitation.status === "published" ? "draft" : "published",
      });
      setInvitation(updated);
      setNotice(updated.status === "published" ? "게시되었습니다." : "게시가 중단되었습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "변경하지 못했습니다.");
    } finally {
      setStatusPending(false);
    }
  }

  async function onDelete() {
    if (!invitation) return;
    if (!window.confirm(`'${invitation.slug}' 청첩장을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    try {
      await deleteInvitation(invitation.id);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제하지 못했습니다.");
    }
  }

  if (loadError) {
    return (
      <>
        <p className={styles.error}>{loadError}</p>
        <p>
          <Link className={styles.backLink} href="/dashboard">
            ← 내 청첩장으로
          </Link>
        </p>
      </>
    );
  }
  if (!invitation) return null;

  return (
    <>
      <div className={styles.editorHead}>
        <h1 className={styles.heading}>{invitation.slug}</h1>
        <Link className={styles.backLink} href="/dashboard">
          ← 내 청첩장
        </Link>
      </div>
      {invitation.status === "published" && (
        <a
          className={styles.publicLink}
          href={`/invitations/${invitation.slug}`}
          target="_blank"
          rel="noreferrer"
        >
          공개 페이지 보기 ↗
        </a>
      )}

      <form className={styles.form} onSubmit={onSave}>
        <div className={styles.heroField}>
          <span className={styles.heroLabel}>디자인 템플릿</span>
          <TemplatePicker
            value={template}
            onChange={(id) => {
              setTemplate(id);
              setNotice(null);
            }}
          />
        </div>

        <div className={styles.heroField}>
          <span className={styles.heroLabel}>대표 사진</span>
          {form.heroImageKey ? (
            <div className={styles.heroPreviewWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element -- editor
                  preview; the guest page uses next/image */}
              <img
                className={styles.heroPreview}
                src={assetUrl(form.heroImageKey)}
                alt="대표 사진 미리보기"
              />
              <button
                type="button"
                className={styles.subtle}
                onClick={() => setField("heroImageKey", "")}
              >
                사진 제거
              </button>
            </div>
          ) : (
            <label className={styles.heroUpload}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                disabled={uploading}
                onChange={(e) => {
                  void onHeroFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              {uploading ? "업로드 중…" : "사진 선택 (10MB 이하)"}
            </label>
          )}
          {uploadError && <p className={styles.error}>{uploadError}</p>}
        </div>

        <div className={styles.fieldRow}>
          <label className={styles.field}>
            <span>신랑 이름</span>
            <input value={form.groomName} onChange={(e) => setField("groomName", e.target.value)} />
          </label>
          <label className={styles.field}>
            <span>신부 이름</span>
            <input value={form.brideName} onChange={(e) => setField("brideName", e.target.value)} />
          </label>
        </div>

        <div className={styles.fieldRow}>
          <label className={styles.field}>
            <span>예식 일시 (한국 시간)</span>
            <input
              type="datetime-local"
              value={form.dateTimeLocal}
              onChange={(e) => setField("dateTimeLocal", e.target.value)}
            />
          </label>
        </div>

        <div className={styles.fieldRow}>
          <label className={styles.field}>
            <span>예식장</span>
            <input value={form.venueName} onChange={(e) => setField("venueName", e.target.value)} />
          </label>
          <label className={styles.field}>
            <span>주소</span>
            <input
              value={form.venueAddress}
              onChange={(e) => setField("venueAddress", e.target.value)}
            />
          </label>
        </div>

        <label className={styles.field}>
          <span>모시는 글</span>
          <textarea value={form.message} onChange={(e) => setField("message", e.target.value)} />
        </label>

        {error && <p className={styles.error}>{error}</p>}
        {notice && <p className={styles.notice}>{notice}</p>}

        <div className={styles.actions}>
          <button type="submit" className={styles.primary} disabled={saving}>
            {saving ? "저장 중…" : "저장"}
          </button>
          <button
            type="button"
            className={styles.subtle}
            onClick={toggleStatus}
            disabled={statusPending}
          >
            {invitation.status === "published" ? "게시 중단" : "게시하기"}
          </button>
          <button type="button" className={styles.danger} onClick={onDelete}>
            삭제
          </button>
        </div>
      </form>
    </>
  );
}
