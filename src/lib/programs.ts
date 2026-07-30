export type Show = {
  time: string;
  end: string;
  name: string;
  host: string;
  description: string;
  tag: string;
};

export const schedule: Record<string, Show[]> = {
  Lundi: [
    { time: "05:00", end: "09:00", name: "Le Grand Réveil", host: "Mama Goma", description: "Matinale d'information et musique", tag: "Matinale" },
    { time: "09:00", end: "11:00", name: "Sauti ya Amani", host: "John Tsongo", description: "Magazine paix & cohésion sociale", tag: "Magazine" },
    { time: "12:00", end: "13:00", name: "Le Grand Journal", host: "Caleb Katembo", description: "Édition de mi-journée", tag: "Info" },
    { time: "14:30", end: "16:30", name: "Goma Rythmes", host: "DJ Kivu", description: "Rumba, Afrobeats & découvertes", tag: "Musique" },
    { time: "17:00", end: "19:00", name: "Echo des Volcans", host: "Sarah Mapendo", description: "Environnement et société", tag: "Magazine" },
    { time: "20:00", end: "22:00", name: "Nuit Kivu", host: "Patrick Kasindi", description: "Ambiance nocturne", tag: "Musique" },
  ],
};

export const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export function scheduleFor(day: string): Show[] {
  return schedule[day] ?? schedule.Lundi;
}

export function currentShow(now = new Date()): Show {
  const list = scheduleFor(days[(now.getDay() + 6) % 7]);
  const minutes = now.getHours() * 60 + now.getMinutes();
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  return (
    list.find((s) => minutes >= toMin(s.time) && minutes < toMin(s.end)) ?? list[list.length - 1]
  );
}

export function nextShows(now = new Date()): Show[] {
  const list = scheduleFor(days[(now.getDay() + 6) % 7]);
  const minutes = now.getHours() * 60 + now.getMinutes();
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  const upcoming = list.filter((s) => toMin(s.time) > minutes);
  return upcoming.length ? upcoming.slice(0, 4) : list.slice(0, 4);
}

export const podcastCategories = [
  "Tous",
  "Actualité",
  "Reportage",
  "Société",
  "Culture",
  "Paix",
  "Musique",
];
