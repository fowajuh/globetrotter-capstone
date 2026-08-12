export type Stop = {
  id: string;
  name: string;
  city: string;
  country: string;
  time: string;
  duration: string;
  cost: number;
  currency: string;
  category: "flight" | "stay" | "eat" | "see" | "move";
  notes?: string;
  booked?: boolean;
};

export type Day = {
  index: number;
  date: string;
  city: string;
  stops: Stop[];
};

export type Trip = {
  id: string;
  name: string;
  subtitle: string;
  code: string;
  cover: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  budgetPlanned: number;
  budgetSpent: number;
  currency: string;
  status: "upcoming" | "past" | "draft";
  travelers: number;
  days: Day[];
};

export const trips: Trip[] = [
  {
    id: "gt-001",
    name: "Kyoto in Autumn",
    subtitle: "Temple hopping & kaiseki nights",
    code: "GT001 · JPN",
    cover: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80",
    origin: "SFO",
    destination: "KIX",
    startDate: "2026-11-04",
    endDate: "2026-11-12",
    budgetPlanned: 4200,
    budgetSpent: 1840,
    currency: "USD",
    status: "upcoming",
    travelers: 2,
    days: [
      {
        index: 1,
        date: "Nov 04",
        city: "San Francisco → Osaka",
        stops: [
          { id: "s1", name: "JL 001 · SFO → KIX", city: "SFO", country: "USA", time: "11:40", duration: "11h 25m", cost: 1180, currency: "USD", category: "flight", booked: true },
          { id: "s2", name: "Hotel Kanra Kyoto", city: "Kyoto", country: "Japan", time: "19:20", duration: "3 nights", cost: 640, currency: "USD", category: "stay", booked: true },
        ],
      },
      {
        index: 2,
        date: "Nov 05",
        city: "Kyoto — Higashiyama",
        stops: [
          { id: "s3", name: "Kiyomizu-dera at dawn", city: "Kyoto", country: "Japan", time: "06:15", duration: "1h 30m", cost: 5, currency: "USD", category: "see", notes: "Enter before the tour buses arrive." },
          { id: "s4", name: "Breakfast · Inoda Coffee", city: "Kyoto", country: "Japan", time: "08:30", duration: "50m", cost: 18, currency: "USD", category: "eat" },
          { id: "s5", name: "Philosopher's Path walk", city: "Kyoto", country: "Japan", time: "10:00", duration: "2h", cost: 0, currency: "USD", category: "move" },
          { id: "s6", name: "Kaiseki · Kikunoi Roan", city: "Kyoto", country: "Japan", time: "19:30", duration: "2h 15m", cost: 240, currency: "USD", category: "eat", booked: true },
        ],
      },
      {
        index: 3,
        date: "Nov 06",
        city: "Kyoto — Arashiyama",
        stops: [
          { id: "s7", name: "Bamboo grove", city: "Kyoto", country: "Japan", time: "07:00", duration: "1h", cost: 0, currency: "USD", category: "see" },
          { id: "s8", name: "Tenryū-ji garden", city: "Kyoto", country: "Japan", time: "09:00", duration: "1h 30m", cost: 8, currency: "USD", category: "see" },
          { id: "s9", name: "Sagano Romantic Train", city: "Kyoto", country: "Japan", time: "13:20", duration: "25m", cost: 12, currency: "USD", category: "move", booked: true },
        ],
      },
    ],
  },
  {
    id: "gt-002",
    name: "Lisbon Long Weekend",
    subtitle: "Fado, pastéis & tram 28",
    code: "GT002 · PRT",
    cover: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200&q=80",
    origin: "JFK",
    destination: "LIS",
    startDate: "2027-01-22",
    endDate: "2027-01-26",
    budgetPlanned: 1800,
    budgetSpent: 420,
    currency: "USD",
    status: "upcoming",
    travelers: 2,
    days: [],
  },
  {
    id: "gt-003",
    name: "Patagonia Traverse",
    subtitle: "Torres del Paine W-trek",
    code: "GT003 · CHL",
    cover: "https://images.unsplash.com/photo-1531065208531-4036c0dba3ca?w=1200&q=80",
    origin: "MIA",
    destination: "PUQ",
    startDate: "2025-03-08",
    endDate: "2025-03-19",
    budgetPlanned: 3600,
    budgetSpent: 3480,
    currency: "USD",
    status: "past",
    travelers: 3,
    days: [],
  },
  {
    id: "gt-004",
    name: "Marrakech Draft",
    subtitle: "Riads, souks, Atlas mountains",
    code: "GT004 · MAR",
    cover: "https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&q=80",
    origin: "LHR",
    destination: "RAK",
    startDate: "",
    endDate: "",
    budgetPlanned: 0,
    budgetSpent: 0,
    currency: "USD",
    status: "draft",
    travelers: 1,
    days: [],
  },
];

export const getTrip = (id: string) => trips.find((t) => t.id === id);

export type Recommendation = {
  id: string;
  title: string;
  location: string;
  category: string;
  image: string;
  match: number;
  price: string;
  blurb: string;
};

export const recommendations: Recommendation[] = [
  {
    id: "r1",
    title: "Fushimi Inari at Twilight",
    location: "Kyoto, Japan",
    category: "Sight · Ceremonial",
    image: "https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=900&q=80",
    match: 96,
    price: "Free",
    blurb: "Ten thousand vermilion gates. Go at 4pm, hike above the tourists, watch the lanterns switch on.",
  },
  {
    id: "r2",
    title: "Nishiki Market Crawl",
    location: "Kyoto, Japan",
    category: "Food · Local",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=900&q=80",
    match: 91,
    price: "$25 pp",
    blurb: "400-year-old covered market. Tako-tamago, yuba, pickled everything. Skip lunch first.",
  },
  {
    id: "r3",
    title: "Miyajima day trip",
    location: "Hiroshima, Japan",
    category: "Side quest · Full day",
    image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=900&q=80",
    match: 84,
    price: "$140",
    blurb: "Floating torii at high tide. Bullet train down, ferry across, deer at your knees the whole way.",
  },
];
