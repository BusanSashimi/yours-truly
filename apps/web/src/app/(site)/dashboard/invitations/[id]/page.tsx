"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState, type FormEvent } from "react";
import {
  invitationDesignFieldsSchema,
  type Invitation,
  type InvitationDesignFields,
} from "@yours-truly/shared";
import { ApiRequestError, deleteInvitation, getInvitation, updateInvitation } from "@/lib/api";
import styles from "../../dashboard.module.scss";

/** datetime-local input value (browser-local wall time) for an ISO instant. */
function isoToLocalInput(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

const FIELD_KEYS = [
  "groomName",
  "brideName",
  "dateTime",
  "venueName",
  "venueAddress",
  "message",
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
  const [form, setForm] = useState({
    groomName: "",
    brideName: "",
    dateTimeLocal: "",
    venueName: "",
    venueAddress: "",
    message: "",
  });
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
        setForm({
          groomName: fields.groomName ?? "",
          brideName: fields.brideName ?? "",
          dateTimeLocal: isoToLocalInput(fields.dateTime),
          venueName: fields.venueName ?? "",
          venueAddress: fields.venueAddress ?? "",
          message: fields.message ?? "",
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
    if (form.groomName.trim()) design.groomName = form.groomName.trim();
    if (form.brideName.trim()) design.brideName = form.brideName.trim();
    const iso = localInputToIso(form.dateTimeLocal);
    if (iso) design.dateTime = iso;
    if (form.venueName.trim()) design.venueName = form.venueName.trim();
    if (form.venueAddress.trim()) design.venueAddress = form.venueAddress.trim();
    if (form.message.trim()) design.message = form.message;
    return design;
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
            <span>예식 일시</span>
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
