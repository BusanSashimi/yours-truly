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
 * Template "terracotta-serif" — recreates the Salon de Letter mood: a pure-white
 * ground, centered high-contrast serif type, and a warm terracotta/clay accent
 * carrying every eyebrow, the calendar's selected day, and the contact buttons.
 * The opening puts both names on one centered serif line, then a single large
 * full-bleed hero photo below. Eyebrow labels stay in plain Korean (no caps),
 * buttons are thin outlined rounded rectangles. As the reference, this is just a
 * Theme + a composition of the shared section library; each section reads its
 * own data slice and renders nothing when empty.
 */
const THEME: Theme = {
  tokens: {
    bg: "#ffffff",
    surface: "#ffffff",
    ink: "#3a3838",
    muted: "#a0a0a0",
    accent: "#e1926a",
    accentSoft: "#edcbb3",
    hairline: "#ece6e1",
    onAccent: "#ffffff",
  },
  fonts: {
    display: FONT_STACKS.displaySerif,
    body: FONT_STACKS.serifKr,
    script: FONT_STACKS.script,
  },
  hero: "letter",
  gallery: "grid",
  eyebrowCaps: false,
  buttonShape: "outline",
};

export function TerracottaSerifTemplate({ invitation, fields, heroKey }: TemplateProps) {
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
      <Greeting message={fields.message} title="소중한 분들을 초대합니다" />
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
