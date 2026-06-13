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
 * Template "save-the-date-editorial" — a magazine-cover mood recreating the
 * Yours Truly "SAVE THE DATE" design: a near-white #FAFAFA ground, a
 * charcoal serif voice (centered all-caps "SAVE THE DATE" over a tall portrait
 * with big stacked date numerals), and small groom-blue / bride-rose label
 * tags. Serif display throughout, solid grey buttons. Like the reference, this
 * is just a Theme plus a composition of the shared section library; each
 * section reads the theme via CSS variables and self-hides when its data slice
 * is empty. The section order follows the source: quote poem → greeting →
 * profiles → parents → calendar → countdown → gallery → interview → directions
 * → reception → rsvp → accounts → guestbook → together-counter → closing.
 */
const THEME: Theme = {
  tokens: {
    bg: "#fafafa",
    surface: "#ffffff",
    ink: "#383737",
    muted: "#777676",
    accent: "#383737",
    accentSoft: "#e6e5e4",
    hairline: "#e2e1e0",
    onAccent: "#ffffff",
  },
  fonts: {
    display: FONT_STACKS.displaySerif,
    body: FONT_STACKS.serifKr,
    script: FONT_STACKS.script,
  },
  hero: "polaroid",
  gallery: "grid",
  eyebrowCaps: true,
  buttonShape: "solid",
};

export function SaveTheDateEditorialTemplate({ invitation, fields, heroKey }: TemplateProps) {
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
      {fields.rsvpEnabled !== false && <Rsvp invitationId={invitation.id} />}
      <Accounts accounts={fields.accounts} />
      <InfoTabs tabs={fields.tabs} />
      {fields.guestbookEnabled !== false && <Guestbook invitationId={invitation.id} />}
      <TogetherCounter startDate={fields.relationshipStartDate} />
      <GuestUpload invitationId={invitation.id} settings={fields.guestUpload} />
      <Wreath wreathUrl={fields.wreathUrl} />
      <ClosingPhotos imageKeys={fields.closingImageKeys} message={fields.message} />
    </TemplateShell>
  );
}
