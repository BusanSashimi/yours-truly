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
 * Template "cobalt-italic-ivory" — a bright editorial mood built on a warm
 * ivory/cream ground (#F5F3ED) with one vivid royal-cobalt accent (#3652AD) as
 * the whole signature: an italic high-contrast serif headline over the cream,
 * photo with a small serif monogram on a color wash up top. White card surfaces,
 * warm cream hairlines, letterspaced uppercase eyebrows, and a solid cobalt CTA.
 * A Theme + a composition of the shared section library; every section reads its
 * own data slice and renders nothing when empty.
 */
const THEME: Theme = {
  tokens: {
    bg: "#f5f3ed",
    surface: "#ffffff",
    ink: "#3a3a3a",
    muted: "#9b978c",
    accent: "#3652ad",
    accentSoft: "#6579bd",
    hairline: "#e3dfd6",
    onAccent: "#ffffff",
  },
  fonts: {
    display: FONT_STACKS.displaySerif,
    body: FONT_STACKS.sansKr,
    script: FONT_STACKS.script,
  },
  hero: "monogram",
  gallery: "grid",
  eyebrowCaps: true,
  buttonShape: "solid",
};

export function CobaltItalicIvoryTemplate({ invitation, fields, heroKey }: TemplateProps) {
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
