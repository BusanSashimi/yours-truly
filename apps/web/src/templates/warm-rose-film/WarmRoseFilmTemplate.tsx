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
 * Template "warm-rose-film" — a warm filmic mood recreating Yours Truly:
 * a near-white ivory-grey ground, a high-contrast serif display, a dusty
 * terracotta/rose accent and a soft beige CTA fill. Opens on a full-bleed
 * vertical couple photo with a cursive "Happy wedding day" overlay. As with
 * every template this is just a Theme plus a composition of the shared section
 * library; each section reads the theme via CSS variables and self-hides when
 * its data slice is empty. The section order follows the source: directions sit
 * before the gallery, the info tabs / photo-booth reception follow the story
 * sections, and the together-counter lands near the close.
 */
const THEME: Theme = {
  tokens: {
    bg: "#f8f8f7",
    surface: "#ffffff",
    ink: "#161915",
    muted: "#8c8b8b",
    accent: "#e08d62",
    accentSoft: "#edcbb2",
    hairline: "#ebebed",
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
  buttonShape: "solid",
};

export function WarmRoseFilmTemplate({ invitation, fields, heroKey }: TemplateProps) {
  return (
    <TemplateShell theme={THEME}>
      <Hero
        variant={THEME.hero}
        heroKey={heroKey}
        groomName={fields.groomName}
        brideName={fields.brideName}
        dateTime={fields.dateTime}
        scriptLine="Happy wedding day"
      />
      <Quote quote={fields.quote} />
      <Greeting message={fields.message} titleKey="invitingLovedOnes" />
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
      <Gallery imageKeys={fields.galleryImageKeys} layout={THEME.gallery} />
      <Interview entries={fields.interview} />
      <Timeline entries={fields.timeline} />
      <InfoTabs tabs={fields.tabs} />
      <Reception reception={fields.reception} />
      <GuestUpload invitationId={invitation.id} settings={fields.guestUpload} />
      <Accounts accounts={fields.accounts} />
      {fields.rsvpEnabled !== false && <Rsvp invitationId={invitation.id} />}
      {fields.guestbookEnabled !== false && <Guestbook invitationId={invitation.id} />}
      <TogetherCounter startDate={fields.relationshipStartDate} />
      <Wreath wreathUrl={fields.wreathUrl} />
      <ClosingPhotos imageKeys={fields.closingImageKeys} message={fields.message} />
    </TemplateShell>
  );
}
