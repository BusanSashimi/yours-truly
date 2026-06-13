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
 * Template "greenery-arch" — the Yours Truly "leafy arch" mood: a near-white
 * ground, soft graphite ink, and a warm terracotta accent over a soft-peach
 * button fill. The opening is a full-bleed couple portrait beneath a white-blossom
 * and greenery arch that fades into the page (hero variant "arch"); serif display
 * type carries the date, names and section titles. A Theme plus a composition of
 * the shared section library — sections read this Theme via CSS variables and
 * self-hide when their data is empty. Reordered from the reference so the venue
 * map + reception land before the gallery/interview block, and the together-counter
 * and wreath close out the page after the guestbook.
 */
const THEME: Theme = {
  tokens: {
    bg: "#fefefe",
    surface: "#ffffff",
    ink: "#383737",
    muted: "#8d8b87",
    accent: "#e08d62",
    accentSoft: "#edcbb2",
    hairline: "#ece6df",
    onAccent: "#ffffff",
  },
  fonts: {
    display: FONT_STACKS.displaySerif,
    body: FONT_STACKS.serifKr,
    script: FONT_STACKS.script,
  },
  hero: "full-bleed",
  gallery: "grid",
  eyebrowCaps: false,
  buttonShape: "pill",
};

export function GreeneryArchTemplate({ invitation, fields, heroKey }: TemplateProps) {
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
      <MapDirections
        venueName={fields.venueName}
        venueAddress={fields.venueAddress}
        map={fields.map}
        transit={fields.transit}
      />
      <Reception reception={fields.reception} />
      <Gallery imageKeys={fields.galleryImageKeys} layout={THEME.gallery} />
      <Timeline entries={fields.timeline} />
      <Interview entries={fields.interview} />
      <InfoTabs tabs={fields.tabs} />
      <Accounts accounts={fields.accounts} />
      {fields.rsvpEnabled !== false && <Rsvp invitationId={invitation.id} />}
      {fields.guestbookEnabled !== false && <Guestbook invitationId={invitation.id} />}
      <GuestUpload invitationId={invitation.id} settings={fields.guestUpload} />
      <TogetherCounter startDate={fields.relationshipStartDate} />
      <Wreath wreathUrl={fields.wreathUrl} />
      <ClosingPhotos imageKeys={fields.closingImageKeys} message={fields.message} />
    </TemplateShell>
  );
}
