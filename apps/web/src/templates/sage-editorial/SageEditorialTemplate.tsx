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
 * Template "sage-editorial" — recreates the Yours Truly mood: a crisp white
 * editorial ground, a single deep sage/forest-green accent over a near-black
 * green-undertoned ink, clean sans body with a serif-forward heading feel. The
 * opening is a full-bleed couple photo with the two names set vertically along
 * the left and right edges. Just a Theme + a composition of the shared section
 * library; every section reads the theme via CSS variables and self-hides when
 * its data slice is empty.
 */
const THEME: Theme = {
  tokens: {
    bg: "#ffffff",
    surface: "#fafafa",
    ink: "#1a201e",
    muted: "#8d918d",
    accent: "#5f6b54",
    accent2: "#a8857f",
    accentSoft: "#e8e9e0",
    hairline: "#e7e6e4",
    onAccent: "#ffffff",
  },
  fonts: {
    display: FONT_STACKS.displaySerif,
    body: FONT_STACKS.sansKr,
    script: FONT_STACKS.script,
  },
  hero: "full-bleed",
  gallery: "grid",
  eyebrowCaps: true,
  buttonShape: "solid",
};

export function SageEditorialTemplate({ invitation, fields, heroKey }: TemplateProps) {
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
      <TogetherCounter startDate={fields.relationshipStartDate} />
      <Timeline entries={fields.timeline} />
      <Interview entries={fields.interview} />
      <GuestUpload invitationId={invitation.id} settings={fields.guestUpload} />
      <Gallery imageKeys={fields.galleryImageKeys} layout={THEME.gallery} />
      <MapDirections
        venueName={fields.venueName}
        venueAddress={fields.venueAddress}
        map={fields.map}
        transit={fields.transit}
      />
      <Reception reception={fields.reception} />
      <InfoTabs tabs={fields.tabs} />
      {fields.rsvpEnabled !== false && <Rsvp invitationId={invitation.id} />}
      <Accounts accounts={fields.accounts} />
      {fields.guestbookEnabled !== false && <Guestbook invitationId={invitation.id} />}
      <Wreath wreathUrl={fields.wreathUrl} />
      <ClosingPhotos imageKeys={fields.closingImageKeys} message={fields.message} />
    </TemplateShell>
  );
}
