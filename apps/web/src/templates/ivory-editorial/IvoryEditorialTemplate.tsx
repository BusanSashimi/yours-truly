import { FONT_STACKS } from "../fonts";
import { TemplateShell, type Theme } from "../theme";
import type { TemplateProps } from "../types";
import { Hero } from "../sections/Hero";
import { Quote } from "../sections/Quote";
import { Greeting } from "../sections/Greeting";
import { ProfileCards } from "../sections/ProfileCards";
import { ParentsContacts } from "../sections/ParentsContacts";
import { Calendar } from "../sections/Calendar";
import { Countdown } from "../sections/Countdown";
import { Gallery } from "../sections/Gallery";
import { Timeline } from "../sections/Timeline";
import { Interview } from "../sections/Interview";
import { MapDirections } from "../sections/MapDirections";
import { Reception } from "../sections/Reception";
import { Accounts } from "../sections/Accounts";
import { InfoTabs } from "../sections/InfoTabs";
import { TogetherCounter } from "../sections/TogetherCounter";
import { Rsvp } from "../sections/Rsvp";
import { Guestbook } from "../sections/Guestbook";
import { GuestUpload } from "../sections/GuestUpload";
import { Wreath } from "../sections/Wreath";
import { ClosingPhotos } from "../sections/ClosingPhotos";

/**
 * Template "ivory-editorial" — a clean greige editorial mood: near-white ivory
 * ground, light sans typography, a floating polaroid-card hero, gold-taupe
 * small-caps accents. The REFERENCE template: a Theme + a composition of the
 * shared section library. Every section reads its own data slice and renders
 * nothing when empty, so the same composition works for a sparse or a fully
 * populated invitation.
 */
const THEME: Theme = {
  tokens: {
    bg: "#fdfdfb",
    surface: "#ffffff",
    ink: "#413f42",
    muted: "#9e9d9f",
    accent: "#9a8c73",
    accentSoft: "#ebe0d5",
    hairline: "#e7e0d6",
    onAccent: "#ffffff",
  },
  fonts: {
    display: FONT_STACKS.sansKr,
    body: FONT_STACKS.sansKr,
    script: FONT_STACKS.script,
  },
  hero: "polaroid",
  gallery: "grid",
  eyebrowCaps: true,
  buttonShape: "pill",
};

export function IvoryEditorialTemplate({ invitation, fields, heroKey }: TemplateProps) {
  return (
    <TemplateShell theme={THEME}>
      <Hero
        variant={THEME.hero}
        heroKey={heroKey}
        groomName={fields.groomName}
        brideName={fields.brideName}
        dateTime={fields.dateTime}
      />
      <Quote quote={fields.quote} />
      <Greeting message={fields.message} title="저희 결혼합니다" />
      <ProfileCards
        profiles={fields.profiles}
        groomName={fields.groomName}
        brideName={fields.brideName}
      />
      <ParentsContacts parents={fields.parents} contacts={fields.contacts} />
      <Calendar dateTime={fields.dateTime} />
      <Countdown dateTime={fields.dateTime} />
      <Gallery imageKeys={fields.galleryImageKeys} layout={THEME.gallery} />
      <Timeline entries={fields.timeline} />
      <Interview entries={fields.interview} />
      <MapDirections
        venueName={fields.venueName}
        venueAddress={fields.venueAddress}
        map={fields.map}
        transit={fields.transit}
      />
      <Reception reception={fields.reception} />
      <Accounts accounts={fields.accounts} />
      <InfoTabs tabs={fields.tabs} />
      <TogetherCounter startDate={fields.relationshipStartDate} />
      {fields.rsvpEnabled !== false && <Rsvp invitationId={invitation.id} />}
      {fields.guestbookEnabled !== false && <Guestbook invitationId={invitation.id} />}
      <GuestUpload invitationId={invitation.id} settings={fields.guestUpload} />
      <Wreath wreathUrl={fields.wreathUrl} />
      <ClosingPhotos imageKeys={fields.closingImageKeys} message={fields.message} />
    </TemplateShell>
  );
}
