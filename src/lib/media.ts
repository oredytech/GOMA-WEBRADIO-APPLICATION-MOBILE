/**
 * Médias servis depuis la racine du site (public/) : évite les images
 * cassées en production liées au dossier d'assets externe.
 */
export const LOGO_URL = "/logo.png";
export const PLAY_BG_URL = "/play-bg.webp";

export const RADIO_NAME = "GOMA WEBRADIO";
export const RADIO_SLOGAN = "Fasi ya ndule na infos za palais";
export const CONTACT_EMAIL = "contact@gomawebradio.com";

export const SOCIALS = [
  { label: "YouTube", icon: "smart_display", url: "https://www.youtube.com/@gomawebradio" },
  { label: "Facebook", icon: "thumb_up", url: "https://www.facebook.com/share/1DjLbi6fkz/" },
  { label: "Site web", icon: "language", url: "https://gomawebradio.com" },
  { label: "E-mail", icon: "mail", url: `mailto:${CONTACT_EMAIL}` },
] as const;

export const YOUTUBE_URL = "https://www.youtube.com/@gomawebradio";
