"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { use, useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  DEFAULT_INVITATION_TEMPLATE_ID,
  invitationDesignFieldsSchema,
  resolveInvitationTemplateId,
  type Invitation,
  type InvitationDesignFields,
  type InvitationTemplateId,
} from "@yours-truly/shared";
import { ApiRequestError, deleteInvitation, getInvitation, updateInvitation } from "@/lib/api";
import { assetUrl, isRenderableAssetKey } from "@/lib/assets";
import { uploadInvitationImage } from "@/lib/upload";
import { TemplatePicker } from "../../template-picker";
import { ContactsPanel } from "./panels/ContactsPanel";
import { GalleryPanel } from "./panels/GalleryPanel";
import { ProfilesPanel } from "./panels/ProfilesPanel";
import { ParentsPanel } from "./panels/ParentsPanel";
import { TimelinePanel } from "./panels/TimelinePanel";
import { InterviewPanel } from "./panels/InterviewPanel";
import { MapPanel } from "./panels/MapPanel";
import { TransitPanel } from "./panels/TransitPanel";
import { ReceptionPanel } from "./panels/ReceptionPanel";
import { AccountsPanel } from "./panels/AccountsPanel";
import { InfoTabsPanel } from "./panels/InfoTabsPanel";
import { QuotePanel } from "./panels/QuotePanel";
import { ManagementPanel } from "./panels/ManagementPanel";
import { QrCard } from "./panels/QrCard";
import styles from "../../dashboard.module.scss";

// The ceremony time is always Korean wall-clock (the guest page renders pinned
// to Asia/Seoul); convert against a fixed +09:00, not the browser timezone.
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function isoToLocalInput(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const kst = new Date(d.getTime() + KST_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${kst.getUTCFullYear()}-${pad(kst.getUTCMonth() + 1)}-${pad(kst.getUTCDate())}T${pad(kst.getUTCHours())}:${pad(kst.getUTCMinutes())}`;
}

function localInputToIso(value: string): string | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return undefined;
  const [, year, month, day, hour, minute] = m;
  return new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)) -
      KST_OFFSET_MS,
  ).toISOString();
}

/** Basic design keys edited by the top form (rebuilt on save). */
const BASIC_KEYS = [
  "template",
  "groomName",
  "brideName",
  "dateTime",
  "venueName",
  "venueAddress",
  "message",
  "heroImageKey",
] as const;

/** Rich design keys edited by the panels / features block. */
const RICH_KEYS = [
  "quote",
  "galleryImageKeys",
  "closingImageKeys",
  "profiles",
  "parents",
  "contacts",
  "timeline",
  "relationshipStartDate",
  "interview",
  "map",
  "transit",
  "reception",
  "accounts",
  "tabs",
  "wreathUrl",
  "guestUpload",
  "guestMessages",
  "rsvpEnabled",
  "guestbookEnabled",
] as const;

/** A collapsible editor section. */
function Panel({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <details className={styles.panel}>
      <summary className={styles.panelSummary}>
        {title}
        {hint && <span className={styles.panelHint}>{hint}</span>}
      </summary>
      <div className={styles.panelBody}>{children}</div>
    </details>
  );
}

export default function InvitationEditorPage({ params }: { params: Promise<{ id: string }> }) {
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
  const [rich, setRich] = useState<Partial<InvitationDesignFields>>({});
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
          heroImageKey: isRenderableAssetKey(fields.heroImageKey, inv.id) ? fields.heroImageKey : "",
        });
        const initialRich: Partial<InvitationDesignFields> = {};
        for (const key of RICH_KEYS) {
          if (fields[key] !== undefined) {
            (initialRich as Record<string, unknown>)[key] = fields[key];
          }
        }
        setRich(initialRich);
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

  function setRichKey<K extends keyof InvitationDesignFields>(
    key: K,
    value: InvitationDesignFields[K] | undefined,
  ) {
    setRich((prev) => {
      const next = { ...prev };
      const empty =
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0);
      if (empty) delete next[key];
      else next[key] = value;
      return next;
    });
    setNotice(null);
  }

  /** Known fields rebuilt from form + panels; unknown design keys survive. */
  function buildDesign(): Record<string, unknown> {
    const design: Record<string, unknown> = { ...invitation?.design };
    for (const key of [...BASIC_KEYS, ...RICH_KEYS]) delete design[key];
    design.template = template;
    if (form.groomName.trim()) design.groomName = form.groomName.trim();
    if (form.brideName.trim()) design.brideName = form.brideName.trim();
    const iso = localInputToIso(form.dateTimeLocal);
    if (iso) design.dateTime = iso;
    if (form.venueName.trim()) design.venueName = form.venueName.trim();
    if (form.venueAddress.trim()) design.venueAddress = form.venueAddress.trim();
    if (form.message.trim()) design.message = form.message;
    if (form.heroImageKey) design.heroImageKey = form.heroImageKey;
    for (const [key, value] of Object.entries(rich)) design[key] = value;
    return design;
  }

  async function uploadImage(file: File): Promise<string> {
    if (!invitation) throw new Error("invitation not loaded");
    return uploadInvitationImage(invitation.id, file);
  }

  async function onHeroFile(file: File | undefined) {
    if (!file || !invitation) return;
    setUploadError(null);
    setUploading(true);
    try {
      const key = await uploadInvitationImage(invitation.id, file);
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

  const guestUpload = rich.guestUpload ?? {};
  function updateGuestUpload(patch: Partial<NonNullable<InvitationDesignFields["guestUpload"]>>) {
    const next = { ...guestUpload, ...patch };
    const keep = next.enabled || next.openDate || next.prompt?.trim();
    setRichKey("guestUpload", keep ? next : undefined);
  }

  const guestMessages = rich.guestMessages ?? {};
  function updateGuestMessages(
    patch: Partial<NonNullable<InvitationDesignFields["guestMessages"]>>,
  ) {
    const next = { ...guestMessages, ...patch };
    const keep = next.enabled || next.openDate || next.prompt?.trim();
    setRichKey("guestMessages", keep ? next : undefined);
  }

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

      <Panel title="QR 메시지·사진" hint="QR 코드로 비공개 메시지 받기">
        {invitation.status === "published" ? (
          <QrCard slug={invitation.slug} />
        ) : (
          <p className={styles.qrNote}>게시 후 QR이 생성됩니다.</p>
        )}
      </Panel>

      <form className={styles.form} onSubmit={onSave}>
        <div className={styles.heroField}>
          <span className={styles.heroLabel}>디자인 템플릿</span>
          <TemplatePicker
            value={template}
            onChange={(t) => {
              setTemplate(t);
              setNotice(null);
            }}
          />
        </div>

        <div className={styles.heroField}>
          <span className={styles.heroLabel}>대표 사진</span>
          {form.heroImageKey ? (
            <div className={styles.heroPreviewWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element -- editor preview */}
              <img className={styles.heroPreview} src={assetUrl(form.heroImageKey)} alt="대표 사진 미리보기" />
              <button type="button" className={styles.subtle} onClick={() => setField("heroImageKey", "")}>
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
            <input value={form.venueAddress} onChange={(e) => setField("venueAddress", e.target.value)} />
          </label>
        </div>

        <label className={styles.field}>
          <span>모시는 글</span>
          <textarea value={form.message} onChange={(e) => setField("message", e.target.value)} />
        </label>

        {/* --- rich content panels --- */}
        <Panel title="인용구">
          <QuotePanel value={rich.quote} onChange={(v) => setRichKey("quote", v)} />
        </Panel>
        <Panel title="신랑 · 신부 소개">
          <ProfilesPanel value={rich.profiles} onChange={(v) => setRichKey("profiles", v)} upload={uploadImage} />
        </Panel>
        <Panel title="혼주 · 가족">
          <ParentsPanel value={rich.parents} onChange={(v) => setRichKey("parents", v)} />
        </Panel>
        <Panel title="연락처">
          <ContactsPanel value={rich.contacts} onChange={(v) => setRichKey("contacts", v)} />
        </Panel>
        <Panel title="갤러리">
          <GalleryPanel value={rich.galleryImageKeys} onChange={(v) => setRichKey("galleryImageKeys", v)} upload={uploadImage} />
        </Panel>
        <Panel title="우리의 이야기 (타임라인)">
          <TimelinePanel value={rich.timeline} onChange={(v) => setRichKey("timeline", v)} upload={uploadImage} />
        </Panel>
        <Panel title="웨딩 인터뷰">
          <InterviewPanel value={rich.interview} onChange={(v) => setRichKey("interview", v)} />
        </Panel>
        <Panel title="오시는 길 (지도 링크)">
          <MapPanel value={rich.map} onChange={(v) => setRichKey("map", v)} />
        </Panel>
        <Panel title="교통편 안내">
          <TransitPanel value={rich.transit} onChange={(v) => setRichKey("transit", v)} />
        </Panel>
        <Panel title="피로연 안내">
          <ReceptionPanel value={rich.reception} onChange={(v) => setRichKey("reception", v)} />
        </Panel>
        <Panel title="마음 전하실 곳 (계좌)">
          <AccountsPanel value={rich.accounts} onChange={(v) => setRichKey("accounts", v)} />
        </Panel>
        <Panel title="포토부스 · 주차 · 답례품">
          <InfoTabsPanel value={rich.tabs} onChange={(v) => setRichKey("tabs", v)} upload={uploadImage} />
        </Panel>
        <Panel title="마무리 사진">
          <GalleryPanel value={rich.closingImageKeys} onChange={(v) => setRichKey("closingImageKeys", v)} upload={uploadImage} />
        </Panel>

        {/* --- features --- */}
        <Panel title="기능 설정" hint="참석여부 · 방명록 · 게스트 스냅 · QR 메시지">
          <label className={styles.toggleRow}>
            <span>참석 여부 받기 (RSVP)</span>
            <input
              type="checkbox"
              checked={rich.rsvpEnabled !== false}
              onChange={(e) => setRichKey("rsvpEnabled", e.target.checked ? undefined : false)}
            />
          </label>
          <label className={styles.toggleRow}>
            <span>방명록 받기</span>
            <input
              type="checkbox"
              checked={rich.guestbookEnabled !== false}
              onChange={(e) => setRichKey("guestbookEnabled", e.target.checked ? undefined : false)}
            />
          </label>
          <label className={styles.toggleRow}>
            <span>게스트 스냅 (하객 사진 업로드)</span>
            <input
              type="checkbox"
              checked={Boolean(guestUpload.enabled)}
              onChange={(e) => updateGuestUpload({ enabled: e.target.checked })}
            />
          </label>
          {guestUpload.enabled && (
            <label className={styles.field}>
              <span>업로드 시작 일시 (한국 시간, 선택)</span>
              <input
                type="datetime-local"
                value={isoToLocalInput(guestUpload.openDate)}
                onChange={(e) => updateGuestUpload({ openDate: localInputToIso(e.target.value) })}
              />
            </label>
          )}
          <label className={styles.toggleRow}>
            <span>QR 메시지·사진 받기 (비공개)</span>
            <input
              type="checkbox"
              checked={Boolean(guestMessages.enabled)}
              onChange={(e) => updateGuestMessages({ enabled: e.target.checked })}
            />
          </label>
          {guestMessages.enabled && (
            <>
              <label className={styles.field}>
                <span>안내 문구 (선택)</span>
                <input
                  value={guestMessages.prompt ?? ""}
                  onChange={(e) => updateGuestMessages({ prompt: e.target.value || undefined })}
                />
              </label>
              <label className={styles.field}>
                <span>메시지 받기 시작 일시 (한국 시간, 선택)</span>
                <input
                  type="datetime-local"
                  value={isoToLocalInput(guestMessages.openDate)}
                  onChange={(e) => updateGuestMessages({ openDate: localInputToIso(e.target.value) })}
                />
              </label>
            </>
          )}
          <label className={styles.field}>
            <span>관계 시작일 (함께한 시간, 선택)</span>
            <input
              type="datetime-local"
              value={isoToLocalInput(rich.relationshipStartDate)}
              onChange={(e) => setRichKey("relationshipStartDate", localInputToIso(e.target.value))}
            />
          </label>
          <label className={styles.field}>
            <span>축하화환 링크 (선택)</span>
            <input
              value={rich.wreathUrl ?? ""}
              onChange={(e) => setRichKey("wreathUrl", e.target.value.trim() || undefined)}
            />
          </label>
        </Panel>

        {error && <p className={styles.error}>{error}</p>}
        {notice && <p className={styles.notice}>{notice}</p>}

        <div className={styles.actions}>
          <button type="submit" className={styles.primary} disabled={saving}>
            {saving ? "저장 중…" : "저장"}
          </button>
          <button type="button" className={styles.subtle} onClick={toggleStatus} disabled={statusPending}>
            {invitation.status === "published" ? "게시 중단" : "게시하기"}
          </button>
          <button type="button" className={styles.danger} onClick={onDelete}>
            삭제
          </button>
        </div>
      </form>

      <Panel title="응답 관리" hint="참석여부 · 방명록 · 사진">
        <ManagementPanel invitationId={invitation.id} />
      </Panel>
    </>
  );
}
