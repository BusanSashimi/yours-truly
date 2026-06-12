"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { slugSchema, type Invitation } from "@yours-truly/shared";
import { ApiRequestError, createInvitation, deleteInvitation, listInvitations } from "@/lib/api";
import styles from "./dashboard.module.scss";

const STATUS_LABEL = { draft: "초안", published: "게시됨" } as const;

export default function DashboardPage() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    listInvitations()
      .then(setInvitations)
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : "불러오지 못했습니다."));
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setCreateError(null);

    const parsed = slugSchema.safeParse(slug);
    if (!parsed.success) {
      setCreateError(parsed.error.issues[0]?.message ?? "사용할 수 없는 주소입니다.");
      return;
    }

    setCreating(true);
    try {
      const invitation = await createInvitation({ slug: parsed.data });
      router.push(`/dashboard/invitations/${invitation.id}`);
    } catch (e) {
      setCreateError(
        e instanceof ApiRequestError && e.code === "slug_taken"
          ? "이미 사용 중인 주소예요. 다른 이름을 골라주세요."
          : e instanceof Error
            ? e.message
            : "만들지 못했습니다.",
      );
      setCreating(false);
    }
  }

  async function onDelete(invitation: Invitation) {
    if (!window.confirm(`'${invitation.slug}' 청첩장을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    try {
      await deleteInvitation(invitation.id);
      setInvitations((prev) => prev?.filter((i) => i.id !== invitation.id) ?? null);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "삭제하지 못했습니다.");
    }
  }

  return (
    <>
      <h1 className={styles.heading}>내 청첩장</h1>

      <form className={styles.createCard} onSubmit={onCreate}>
        <label className={styles.slugLabel} htmlFor="new-slug">
          새 청첩장 주소
        </label>
        <div className={styles.slugRow}>
          <span className={styles.slugPrefix}>www.yourstruly.it/invitations/</span>
          <input
            id="new-slug"
            className={styles.slugInput}
            placeholder="minji-and-hoon"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            required
          />
          <button type="submit" className={styles.primary} disabled={creating}>
            {creating ? "만드는 중…" : "만들기"}
          </button>
        </div>
        {createError && <p className={styles.error}>{createError}</p>}
      </form>

      {loadError && <p className={styles.error}>{loadError}</p>}
      {invitations && invitations.length === 0 && (
        <p className={styles.empty}>아직 청첩장이 없어요. 위에서 첫 청첩장을 만들어 보세요.</p>
      )}

      <ul className={styles.list}>
        {invitations?.map((invitation) => (
          <li key={invitation.id} className={styles.item}>
            <div className={styles.itemInfo}>
              <span className={styles.itemSlug}>{invitation.slug}</span>
              <span
                className={`${styles.badge} ${invitation.status === "published" ? styles.badgePublished : ""}`}
              >
                {STATUS_LABEL[invitation.status]}
              </span>
            </div>
            <div className={styles.itemActions}>
              {invitation.status === "published" && (
                <a href={`/invitations/${invitation.slug}`} target="_blank" rel="noreferrer">
                  보기
                </a>
              )}
              <Link href={`/dashboard/invitations/${invitation.id}`}>편집</Link>
              <button type="button" onClick={() => onDelete(invitation)}>
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
