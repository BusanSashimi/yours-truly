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
 * Template "sage-storybook" — recreates the Yours Truly mood: an off-white
 * #FAFAFA ground, a deep sage/olive accent, refined serif display type, and a
 * full-bleed vertical hero with a dusty-blush cursive line over the photo. A
 * Theme plus a composition of the shared section library; every section reads
 * its data slice and renders nothing when empty. Reordered from the reference
 * to follow the source's flow: profiles → interview → guest snaps early, then
 * gallery and the relationship timeline, the venue info tabs and reception, the
 * calendar/countdown/map block, RSVP and accounts, the guestbook, and the
 * together-counter just before the closing photos.
 */
const THEME: Theme = {
  tokens: {
    bg: "#f3f1ec",
    surface: "#efece6",
    ink: "#1c1d1a",
    muted: "#8c8d88",
    accent: "#516349",
    accent2: "#cf8f97",
    accentSoft: "#dee4e2",
    hairline: "#e5e5e5",
    onAccent: "#ffffff",
  },
  fonts: {
    display: FONT_STACKS.displaySerif,
    body: FONT_STACKS.sansKr,
    script: FONT_STACKS.script,
  },
  hero: "full-bleed",
  gallery: "carousel",
  eyebrowCaps: false,
  buttonShape: "solid",
};

export function SageStorybookTemplate({ invitation, fields, heroKey }: TemplateProps) {
  return (
    <TemplateShell theme={THEME}>
      <Hero
        variant={THEME.hero}
        heroKey={heroKey}
        groomName={fields.groomName}
        brideName={fields.brideName}
        dateTime={fields.dateTime}
        scriptLine="The Wedding Day"
      />
      <Quote quote={fields.quote} />
      <Greeting message={fields.message} titleKey="weAreMarrying" />
      <ProfileCards
        profiles={fields.profiles}
        groomName={fields.groomName}
        brideName={fields.brideName}
      />
      <ParentsContacts parents={fields.parents} contacts={fields.contacts} />
      <Interview entries={fields.interview} />
      <GuestUpload invitationId={invitation.id} settings={fields.guestUpload} />
      <Gallery imageKeys={fields.galleryImageKeys} layout={THEME.gallery} />
      <Timeline entries={fields.timeline} />
      <InfoTabs tabs={fields.tabs} />
      <Reception reception={fields.reception} />
      <Calendar dateTime={fields.dateTime} />
      <Countdown dateTime={fields.dateTime} />
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
