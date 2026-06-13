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
 * Template "periwinkle-story" — recreates Salon de Letter's mood: a near-white
 * #FAFAFA ground, a serif display paired with a clean Korean sans body, and a
 * single soft periwinkle-blue accent (#6E8AB3) carried through section titles,
 * solid buttons and the countdown chips. Opens on a full-bleed photo with no
 * overlaid text, then runs the story below: greeting → profiles → schedule →
 * directions → gallery → interview/history → info/accounts → rsvp/guestbook →
 * together-counter → closing photo. A Theme plus a composition of the shared
 * section library; each section reads its data slice and self-hides when empty.
 */
const THEME: Theme = {
  tokens: {
    bg: "#fafafa",
    surface: "#ffffff",
    ink: "#1d1f1e",
    muted: "#a7a39b",
    accent: "#6e8ab3",
    accentSoft: "#e1ebf0",
    hairline: "#e7e7e7",
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

export function PeriwinkleStoryTemplate({ invitation, fields, heroKey }: TemplateProps) {
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
      <Gallery imageKeys={fields.galleryImageKeys} layout={THEME.gallery} />
      <Interview entries={fields.interview} />
      <Timeline entries={fields.timeline} />
      <Reception reception={fields.reception} />
      <InfoTabs tabs={fields.tabs} />
      <Accounts accounts={fields.accounts} />
      {fields.rsvpEnabled !== false && <Rsvp invitationId={invitation.id} />}
      {fields.guestbookEnabled !== false && <Guestbook invitationId={invitation.id} />}
      <TogetherCounter startDate={fields.relationshipStartDate} />
      <Wreath wreathUrl={fields.wreathUrl} />
      <GuestUpload invitationId={invitation.id} settings={fields.guestUpload} />
      <ClosingPhotos imageKeys={fields.closingImageKeys} message={fields.message} />
    </TemplateShell>
  );
}
