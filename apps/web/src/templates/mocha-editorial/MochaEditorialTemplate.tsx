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
 * Template "mocha-editorial" — a warm studio editorial mood recreating Salon de
 * Letter: a soft off-white ground, a full studio hero wrapped in a mocha/taupe
 * wash with a small serif monogram mark, high-contrast serif display type, and
 * warm mocha accents on buttons and eyebrows. A Theme + a composition of the
 * shared section library; each section reads its own data slice and renders
 * nothing when empty.
 */
const THEME: Theme = {
  tokens: {
    bg: "#f3efe9",
    surface: "#fbf8f3",
    ink: "#201f1d",
    muted: "#8d8579",
    accent: "#937a60",
    accentSoft: "#e6ddd1",
    hairline: "#e3dccf",
    onAccent: "#ffffff",
  },
  fonts: {
    display: FONT_STACKS.displaySerif,
    body: FONT_STACKS.serifKr,
    script: FONT_STACKS.script,
  },
  hero: "full-bleed",
  gallery: "grid",
  eyebrowCaps: true,
  buttonShape: "solid",
};

export function MochaEditorialTemplate({ invitation, fields, heroKey }: TemplateProps) {
  return (
    <TemplateShell theme={THEME}>
      <Hero
        variant={THEME.hero}
        heroKey={heroKey}
        groomName={fields.groomName}
        brideName={fields.brideName}
        dateTime={fields.dateTime}
      />
      <Greeting message={fields.message} titleKey="weAreMarrying" />
      <Quote quote={fields.quote} />
      <ProfileCards
        profiles={fields.profiles}
        groomName={fields.groomName}
        brideName={fields.brideName}
      />
      <ParentsContacts parents={fields.parents} contacts={fields.contacts} />
      <Interview entries={fields.interview} />
      <Reception reception={fields.reception} />
      <Calendar dateTime={fields.dateTime} />
      <Countdown dateTime={fields.dateTime} />
      <Gallery imageKeys={fields.galleryImageKeys} layout={THEME.gallery} />
      <Timeline entries={fields.timeline} />
      <GuestUpload invitationId={invitation.id} settings={fields.guestUpload} />
      <InfoTabs tabs={fields.tabs} />
      <MapDirections
        venueName={fields.venueName}
        venueAddress={fields.venueAddress}
        map={fields.map}
        transit={fields.transit}
      />
      {fields.rsvpEnabled !== false && <Rsvp invitationId={invitation.id} />}
      <Accounts accounts={fields.accounts} />
      {fields.guestbookEnabled !== false && <Guestbook invitationId={invitation.id} />}
      <TogetherCounter startDate={fields.relationshipStartDate} />
      <Wreath wreathUrl={fields.wreathUrl} />
      <ClosingPhotos imageKeys={fields.closingImageKeys} message={fields.message} />
    </TemplateShell>
  );
}
