// GlobeTrotter — Cameroon inventory.
// Stays & experiences across all ten regions, with geo coordinates used by the
// map layer and a full review corpus used by the ratings system.

export type ReviewSubscores = {
  cleanliness: number;
  accuracy: number;
  checkIn: number;
  communication: number;
  location: number;
  value: number;
};

export type Review = {
  id: string;
  listingId: string;
  author: string;
  initials: string;
  from: string;
  date: string;
  rating: number;
  body: string;
  subscores: ReviewSubscores;
  hostReply?: string;
  helpful: number;
};

export type Listing = {
  id: string;
  title: string;
  tagline: string;
  city: string;
  region: string;
  category: Category;
  lat: number;
  lng: number;
  price: number; // XAF per night / per person
  currency: "XAF";
  usd: number;
  rating: number;
  reviewCount: number;
  images: string[];
  host: { name: string; initials: string; since: string; superhost: boolean };
  guests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  amenities: string[];
  about: string;
  highlights: { label: string; detail: string }[];
  instantBook: boolean;
  distanceKm: number;
};

export type Category =
  | "Beachfront"
  | "Mountain"
  | "Rainforest"
  | "Safari"
  | "City lofts"
  | "Heritage"
  | "Lakeside"
  | "Chef's table";

export const categories: { id: Category; label: string; icon: string }[] = [
  { id: "Beachfront", label: "Beachfront", icon: "waves" },
  { id: "Mountain", label: "Mountain", icon: "mountain" },
  { id: "Rainforest", label: "Rainforest", icon: "trees" },
  { id: "Safari", label: "Safari", icon: "binoculars" },
  { id: "City lofts", label: "City lofts", icon: "building" },
  { id: "Heritage", label: "Heritage", icon: "landmark" },
  { id: "Lakeside", label: "Lakeside", icon: "droplets" },
  { id: "Chef's table", label: "Chef's table", icon: "utensils" },
];

const img = (id: string) => `https://images.unsplash.com/${id}?w=1200&q=80&auto=format&fit=crop`;

export const listings: Listing[] = [
  {
    id: "cm-01",
    title: "Kribi Sand House",
    tagline: "Private beach steps from the Lobé Falls",
    city: "Kribi",
    region: "South",
    category: "Beachfront",
    lat: 2.9405,
    lng: 9.9098,
    price: 78000,
    currency: "XAF",
    usd: 128,
    rating: 4.94,
    reviewCount: 218,
    images: [
      img("photo-1520250497591-112f2f40a3f4"),
      img("photo-1505881502353-a1986add3762"),
      img("photo-1507525428034-b723cf961d3e"),
      img("photo-1439066615861-d1af74d74000"),
    ],
    host: { name: "Nadège Ekani", initials: "NE", since: "2019", superhost: true },
    guests: 6,
    bedrooms: 3,
    beds: 4,
    baths: 2,
    amenities: ["Ocean front", "Outdoor shower", "Chef on request", "Wifi 200mbps", "Kayaks", "Generator backup"],
    about:
      "A low white house on the sand between Kribi town and the Lobé Falls — the only waterfall in Africa that empties straight into the Atlantic. Fishermen pull pirogues past the terrace at dawn; grilled bar and plantain arrive at seven.",
    highlights: [
      { label: "Waterfall walk", detail: "12 minutes south along the beach" },
      { label: "Dive-worthy", detail: "Calm reef break off the point" },
    ],
    instantBook: true,
    distanceKm: 152,
  },
  {
    id: "cm-02",
    title: "Mount Cameroon Base Lodge",
    tagline: "Cloud-forest cabin at 1,400m on the Chariot of the Gods",
    city: "Buea",
    region: "South-West",
    category: "Mountain",
    lat: 4.1527,
    lng: 9.2414,
    price: 54000,
    currency: "XAF",
    usd: 89,
    rating: 4.88,
    reviewCount: 164,
    images: [
      img("photo-1464822759023-fed622ff2c3b"),
      img("photo-1519681393784-d120267933ba"),
      img("photo-1486870591958-9b9d0d1dda99"),
      img("photo-1470071459604-3b5ec3a7fe05"),
    ],
    host: { name: "Ebenezer Nfor", initials: "EN", since: "2017", superhost: true },
    guests: 4,
    bedrooms: 2,
    beds: 3,
    baths: 1,
    amenities: ["Wood stove", "Guide desk", "Porters arranged", "Hot spring nearby", "Breakfast included"],
    about:
      "Timber and volcanic stone on the eastern flank of West Africa's highest peak. Summit attempts leave at 4am; the lodge packs the flasks. On clear evenings you can see the lights of Bioko across the water.",
    highlights: [
      { label: "Summit ready", detail: "Hut 1 is a 3h walk from the door" },
      { label: "Coffee country", detail: "Tour of the Tole estate included" },
    ],
    instantBook: false,
    distanceKm: 68,
  },
  {
    id: "cm-03",
    title: "Waza Savanna Camp",
    tagline: "Canvas suites on the edge of Waza National Park",
    city: "Waza",
    region: "Far North",
    category: "Safari",
    lat: 11.3906,
    lng: 14.6667,
    price: 96000,
    currency: "XAF",
    usd: 158,
    rating: 4.91,
    reviewCount: 97,
    images: [
      img("photo-1516426122078-c23e76319801"),
      img("photo-1547471080-7cc2caa01a7e"),
      img("photo-1534177616072-ef7dc120449d"),
      img("photo-1549366021-9f761d450615"),
    ],
    host: { name: "Aïssatou Bello", initials: "AB", since: "2016", superhost: true },
    guests: 2,
    bedrooms: 1,
    beds: 1,
    baths: 1,
    amenities: ["Game drives", "Solar power", "Full board", "Watchtower", "Naturalist guide"],
    about:
      "Six raised tents facing a waterhole that giraffe, kob and elephant work through between four and six each afternoon. Dinner is served on the pan when the wind allows.",
    highlights: [
      { label: "Big herds", detail: "Elephant crossings Nov–Mar" },
      { label: "Dark skies", detail: "Zero light pollution for 40km" },
    ],
    instantBook: false,
    distanceKm: 1180,
  },
  {
    id: "cm-04",
    title: "Bonanjo Atelier Loft",
    tagline: "Colonial shell, contemporary Douala interior",
    city: "Douala",
    region: "Littoral",
    category: "City lofts",
    lat: 4.0435,
    lng: 9.6907,
    price: 62000,
    currency: "XAF",
    usd: 102,
    rating: 4.82,
    reviewCount: 341,
    images: [
      img("photo-1502672260266-1c1ef2d93688"),
      img("photo-1493809842364-78817add7ffb"),
      img("photo-1522708323590-d24dbb6b0267"),
      img("photo-1560448204-e02f11c3d0e2"),
    ],
    host: { name: "Serge Mbappe", initials: "SM", since: "2020", superhost: false },
    guests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 2,
    amenities: ["Aircon", "Workspace", "Elevator", "Wifi 300mbps", "Airport pickup", "Gym"],
    about:
      "Top floor of a 1930s trading house in Bonanjo, gutted and rebuilt around a nine-metre skylight. Doual'art and the Bonendale studios are walkable; the fish market is a five-minute taxi.",
    highlights: [
      { label: "Design district", detail: "Doual'art gallery 400m" },
      { label: "Great for work", detail: "Fibre + backup inverter" },
    ],
    instantBook: true,
    distanceKm: 4,
  },
  {
    id: "cm-05",
    title: "Foumban Palace Riad",
    tagline: "Guest wing of a Bamoun family compound",
    city: "Foumban",
    region: "West",
    category: "Heritage",
    lat: 5.7256,
    lng: 10.8998,
    price: 41000,
    currency: "XAF",
    usd: 67,
    rating: 4.96,
    reviewCount: 128,
    images: [
      img("photo-1528181304800-259b08848526"),
      img("photo-1600585154340-be6161a56a0c"),
      img("photo-1600607687939-ce8a6c25118c"),
      img("photo-1600566753086-00f18fb6b3ea"),
    ],
    host: { name: "Ibrahim Njoya", initials: "IN", since: "2015", superhost: true },
    guests: 5,
    bedrooms: 3,
    beds: 3,
    baths: 2,
    amenities: ["Courtyard", "Breakfast included", "Bronze workshop", "Guided palace tour", "Wifi"],
    about:
      "Two hundred metres from the Sultan's Palace, in a courtyard house whose brass doors were cast by the family three generations ago. Mornings begin with beignets and Bamoun coffee under the mango tree.",
    highlights: [
      { label: "Living craft", detail: "Bronze casting demo included" },
      { label: "Museum access", detail: "Skip-the-line palace entry" },
    ],
    instantBook: true,
    distanceKm: 298,
  },
  {
    id: "cm-06",
    title: "Dja Reserve Treehouse",
    tagline: "Canopy platform inside a UNESCO rainforest",
    city: "Somalomo",
    region: "East",
    category: "Rainforest",
    lat: 3.3833,
    lng: 12.7333,
    price: 88000,
    currency: "XAF",
    usd: 145,
    rating: 4.89,
    reviewCount: 74,
    images: [
      img("photo-1441974231531-c6227db76b6e"),
      img("photo-1518495973542-4542c06a5843"),
      img("photo-1476231682828-37e571bc172f"),
      img("photo-1426604966848-d7adac402bff"),
    ],
    host: { name: "Marie-Claire Ondoa", initials: "MO", since: "2018", superhost: true },
    guests: 3,
    bedrooms: 1,
    beds: 2,
    baths: 1,
    amenities: ["Full board", "Baka guides", "Night walk", "River pirogue", "Solar lanterns"],
    about:
      "Eleven metres up a sapelli tree on the Dja river bend. Mandrill, grey parrot and forest elephant pass below; the Baka guides read the forest better than any map.",
    highlights: [
      { label: "UNESCO core", detail: "Permits handled by the host" },
      { label: "Sound of it", detail: "Dawn chorus at 05:40, every day" },
    ],
    instantBook: false,
    distanceKm: 245,
  },
  {
    id: "cm-07",
    title: "Lake Ossa Boathouse",
    tagline: "Stilted deck over manatee water",
    city: "Édéa",
    region: "Littoral",
    category: "Lakeside",
    lat: 3.8306,
    lng: 10.0333,
    price: 47000,
    currency: "XAF",
    usd: 77,
    rating: 4.79,
    reviewCount: 112,
    images: [
      img("photo-1439066615861-d1af74d74000"),
      img("photo-1499793983690-e29da59ef1c2"),
      img("photo-1470770841072-f978cf4d019e"),
      img("photo-1501785888041-af3ef285b470"),
    ],
    host: { name: "Yannick Dipita", initials: "YD", since: "2021", superhost: false },
    guests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 1,
    amenities: ["Canoes", "Fishing gear", "Outdoor kitchen", "Hammocks", "Manatee watch"],
    about:
      "A cedar boathouse on the quietest arm of Lake Ossa, where West African manatee still surface at dusk. Bring nothing; the kitchen runs on what the lake and the market give up that morning.",
    highlights: [
      { label: "Rare sighting", detail: "Manatee conservation trips daily" },
      { label: "Swimmable", detail: "Clear, still water off the deck" },
    ],
    instantBook: true,
    distanceKm: 64,
  },
  {
    id: "cm-08",
    title: "Rhumsiki Rock Retreat",
    tagline: "Adobe rooms beneath the volcanic plugs",
    city: "Rhumsiki",
    region: "Far North",
    category: "Mountain",
    lat: 10.5333,
    lng: 13.6167,
    price: 36000,
    currency: "XAF",
    usd: 59,
    rating: 4.85,
    reviewCount: 88,
    images: [
      img("photo-1547471080-7cc2caa01a7e"),
      img("photo-1509316785289-025f5b846b35"),
      img("photo-1493246507139-91e8fad9978e"),
      img("photo-1478131143081-80f7f84ca84d"),
    ],
    host: { name: "Halima Tchamba", initials: "HT", since: "2018", superhost: true },
    guests: 6,
    bedrooms: 3,
    beds: 4,
    baths: 2,
    amenities: ["Terrace", "Half board", "Kapsiki guides", "Horse trek", "Star deck"],
    about:
      "Mud-brick and thatch in the Mandara mountains, looking straight at the Rhumsiki peak. Kapsiki villages, crab-diviners and the Nigerian border ridge are all within a day's walk.",
    highlights: [
      { label: "Iconic view", detail: "The peak from your own terrace" },
      { label: "Sunset trek", detail: "Guided ridge walk each evening" },
    ],
    instantBook: true,
    distanceKm: 1090,
  },
  {
    id: "cm-09",
    title: "Ndolé & Fire — Chef's Table",
    tagline: "Eight seats, one Douala kitchen, six courses",
    city: "Douala",
    region: "Littoral",
    category: "Chef's table",
    lat: 4.0611,
    lng: 9.7085,
    price: 39000,
    currency: "XAF",
    usd: 64,
    rating: 4.97,
    reviewCount: 203,
    images: [
      img("photo-1414235077428-338989a2e8c0"),
      img("photo-1466637574441-749b8f19452f"),
      img("photo-1504674900247-0877df9cc836"),
      img("photo-1555939594-58d7cb561ad1"),
    ],
    host: { name: "Chef Léa Manga", initials: "LM", since: "2022", superhost: true },
    guests: 8,
    bedrooms: 0,
    beds: 0,
    baths: 1,
    amenities: ["6 courses", "Wine pairing", "Market walk", "Vegetarian option", "3 hours"],
    about:
      "Chef Léa cooks the Sawa coast the way her grandmother did, then argues with it — smoked ndolé, bongo-spiced snapper, wild honey and safou. The market walk beforehand is the best hour in Douala.",
    highlights: [
      { label: "Market first", detail: "Marché Central sourcing walk" },
      { label: "Tiny room", detail: "Never more than eight guests" },
    ],
    instantBook: true,
    distanceKm: 6,
  },
  {
    id: "cm-10",
    title: "Limbe Black Sand Villa",
    tagline: "Volcanic beach, botanic garden at the gate",
    city: "Limbe",
    region: "South-West",
    category: "Beachfront",
    lat: 4.0186,
    lng: 9.2049,
    price: 69000,
    currency: "XAF",
    usd: 113,
    rating: 4.86,
    reviewCount: 189,
    images: [
      img("photo-1507525428034-b723cf961d3e"),
      img("photo-1544551763-46a013bb70d5"),
      img("photo-1520250497591-112f2f40a3f4"),
      img("photo-1502920917128-1aa500764cbd"),
    ],
    host: { name: "Grace Ewane", initials: "GE", since: "2019", superhost: true },
    guests: 8,
    bedrooms: 4,
    beds: 5,
    baths: 3,
    amenities: ["Pool", "Black sand beach", "Cook included", "Wildlife centre nearby", "Aircon"],
    about:
      "Down Beach on one side, the 1892 botanic garden on the other, Mount Cameroon behind. Four bedrooms, a long veranda and a cook who does the best pepper soup in the South-West.",
    highlights: [
      { label: "Two worlds", detail: "Rainforest and ocean in one street" },
      { label: "Family sized", detail: "Sleeps eight comfortably" },
    ],
    instantBook: true,
    distanceKm: 74,
  },
  {
    id: "cm-11",
    title: "Bamenda Ring Road Cabin",
    tagline: "Grassfields highland with a fireplace",
    city: "Bamenda",
    region: "North-West",
    category: "Mountain",
    lat: 5.9631,
    lng: 10.1591,
    price: 33000,
    currency: "XAF",
    usd: 54,
    rating: 4.74,
    reviewCount: 66,
    images: [
      img("photo-1449158743715-0a90ebb6d2d8"),
      img("photo-1470071459604-3b5ec3a7fe05"),
      img("photo-1517320964276-a002fa203177"),
      img("photo-1500534314209-a25ddb2bd429"),
    ],
    host: { name: "Peter Ndifor", initials: "PN", since: "2020", superhost: false },
    guests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 1,
    amenities: ["Fireplace", "Mountain bikes", "Coffee farm walk", "Kitchen", "Wifi"],
    about:
      "Cool, green, 1,600m up. Mornings smell of eucalyptus and roasting arabica. The Ring Road, the Bafut palace and the Menchum falls all start from the driveway.",
    highlights: [
      { label: "Cold nights", detail: "Actual fireplace, actual firewood" },
      { label: "Ring Road", detail: "Loop drive maps and bikes provided" },
    ],
    instantBook: true,
    distanceKm: 366,
  },
  {
    id: "cm-12",
    title: "Yaoundé Hillside Residence",
    tagline: "Seven hills, one long terrace",
    city: "Yaoundé",
    region: "Centre",
    category: "City lofts",
    lat: 3.8667,
    lng: 11.5167,
    price: 58000,
    currency: "XAF",
    usd: 95,
    rating: 4.81,
    reviewCount: 254,
    images: [
      img("photo-1512917774080-9991f1c4c750"),
      img("photo-1600585154526-990dced4db0d"),
      img("photo-1600607687920-4e2a09cf159d"),
      img("photo-1505691938895-1758d7feb511"),
    ],
    host: { name: "Chantal Abena", initials: "CA", since: "2017", superhost: true },
    guests: 5,
    bedrooms: 3,
    beds: 3,
    baths: 2,
    amenities: ["Terrace", "Aircon", "Parking", "Wifi 200mbps", "Housekeeping", "Generator"],
    about:
      "Above Bastos, with the whole capital laid out below and the Mfoundi valley catching light at six. Ten minutes to the National Museum, twenty to Mont Fébé.",
    highlights: [
      { label: "The view", detail: "Full skyline from the terrace" },
      { label: "Embassy quarter", detail: "Quiet, walkable Bastos streets" },
    ],
    instantBook: true,
    distanceKm: 0,
  },
];

export const getListing = (id: string) => listings.find((l) => l.id === id);

// ---------------------------------------------------------------- reviews ---

const sub = (a: number, b: number, c: number, d: number, e: number, f: number): ReviewSubscores => ({
  cleanliness: a,
  accuracy: b,
  checkIn: c,
  communication: d,
  location: e,
  value: f,
});

export const seedReviews: Review[] = [
  {
    id: "rv-1", listingId: "cm-01", author: "Amara O.", initials: "AO", from: "Lagos, Nigeria",
    date: "March 2026", rating: 5,
    body: "We woke to fishermen hauling in nets twenty metres from the bed. Nadège arranged a pirogue to the Lobé Falls at sunrise and it is the single best hour I have spent in West Africa. The house is spotless and the outdoor shower is a genuine luxury.",
    subscores: sub(5, 5, 5, 5, 5, 4.8), helpful: 42,
    hostReply: "Amara, the pirogue man asks after you. Come back in dry season and we'll do the reef.",
  },
  {
    id: "rv-2", listingId: "cm-01", author: "Thomas B.", initials: "TB", from: "Lyon, France",
    date: "February 2026", rating: 5,
    body: "Third stay. Nothing has slipped. The generator kicked in during a two-hour cut and we barely noticed. Grilled bar every night for a week and I regret nothing.",
    subscores: sub(5, 5, 4.8, 5, 5, 5), helpful: 18,
  },
  {
    id: "rv-3", listingId: "cm-01", author: "Sandrine K.", initials: "SK", from: "Yaoundé, Cameroon",
    date: "January 2026", rating: 4,
    body: "Beautiful house, honest listing. The road in from Kribi town is rough after rain — take a 4x4 or ask the host for the pickup. Everything else exceeded what we paid.",
    subscores: sub(5, 4.6, 4.5, 5, 4.5, 4.8), helpful: 27,
  },
  {
    id: "rv-4", listingId: "cm-02", author: "Kwame A.", initials: "KA", from: "Accra, Ghana",
    date: "March 2026", rating: 5,
    body: "Summited on the second morning. Ebenezer's porters were early, kind, and unbelievably strong. Coming back down to a wood stove and hot food is the reason to book this over anything in Buea town.",
    subscores: sub(4.8, 5, 5, 5, 5, 5), helpful: 51,
  },
  {
    id: "rv-5", listingId: "cm-02", author: "Ingrid M.", initials: "IM", from: "Munich, Germany",
    date: "December 2025", rating: 5,
    body: "Cold at night in the good way. Bring a fleece. The cloud rolls through the veranda at four every afternoon and it feels like the edge of the world.",
    subscores: sub(4.7, 5, 4.9, 5, 5, 5), helpful: 22,
  },
  {
    id: "rv-6", listingId: "cm-03", author: "Julien P.", initials: "JP", from: "Brussels, Belgium",
    date: "February 2026", rating: 5,
    body: "Seventeen elephants at the waterhole on our second afternoon, from the tent, with a drink in hand. Aïssatou's naturalist knows every bird call in the park. Full board was excellent — better than the lodges we tried in Bénoué.",
    subscores: sub(4.9, 5, 5, 5, 5, 4.7), helpful: 63,
    hostReply: "That herd is our regulars. Thank you for travelling so far north, Julien.",
  },
  {
    id: "rv-7", listingId: "cm-04", author: "Danielle F.", initials: "DF", from: "Montréal, Canada",
    date: "March 2026", rating: 5,
    body: "Worked from the loft for ten days. Fibre never dropped, the inverter covered every cut, and the skylight makes the whole place feel like a gallery. Bonanjo is the right base for Douala.",
    subscores: sub(4.9, 4.9, 4.8, 4.9, 5, 4.8), helpful: 34,
  },
  {
    id: "rv-8", listingId: "cm-04", author: "Ousmane D.", initials: "OD", from: "Dakar, Senegal",
    date: "January 2026", rating: 4,
    body: "Great space, slightly noisy on Friday nights from the street below. Serge responded to every message within minutes and sent a driver at 5am for my flight.",
    subscores: sub(4.7, 4.6, 5, 5, 4.6, 4.6), helpful: 15,
  },
  {
    id: "rv-9", listingId: "cm-05", author: "Fatou N.", initials: "FN", from: "Abidjan, Côte d'Ivoire",
    date: "February 2026", rating: 5,
    body: "Staying inside a Bamoun family compound rather than a hotel changed the whole trip. The bronze workshop was not a performance — they were working. Ibrahim's mother taught me to make the coffee.",
    subscores: sub(5, 5, 5, 5, 5, 5), helpful: 71,
  },
  {
    id: "rv-10", listingId: "cm-06", author: "Peter H.", initials: "PH", from: "Bristol, UK",
    date: "November 2025", rating: 5,
    body: "Mandrill on day two, forest elephant tracks on day three, and a night walk that I will be describing to people for the rest of my life. It is genuinely remote — take the host's packing list seriously.",
    subscores: sub(4.6, 5, 4.8, 5, 5, 4.9), helpful: 58,
  },
  {
    id: "rv-11", listingId: "cm-09", author: "Larissa T.", initials: "LT", from: "Douala, Cameroon",
    date: "March 2026", rating: 5,
    body: "I am Cameroonian and I have never eaten ndolé like this. Léa smokes the leaves. The market walk beforehand is worth the price on its own — she knows every trader by name.",
    subscores: sub(5, 5, 5, 5, 5, 5), helpful: 96,
    hostReply: "Merci Larissa. Next season we are doing a whole menu around safou.",
  },
  {
    id: "rv-12", listingId: "cm-10", author: "Marcus L.", initials: "ML", from: "Cape Town, South Africa",
    date: "February 2026", rating: 5,
    body: "Black sand, a pool, and the botanic garden across the road. Grace's cook made pepper soup that ruined all other pepper soup. Eight of us and nobody was on top of anybody.",
    subscores: sub(4.9, 5, 4.9, 5, 5, 4.9), helpful: 29,
  },
  {
    id: "rv-13", listingId: "cm-08", author: "Nadia R.", initials: "NR", from: "Casablanca, Morocco",
    date: "January 2026", rating: 5,
    body: "The peak from the terrace at sunrise is the photograph everyone takes of Cameroon, and it is better in person. Simple rooms — go for the landscape and the Kapsiki guides, not for marble bathrooms.",
    subscores: sub(4.5, 4.9, 4.9, 5, 5, 5), helpful: 40,
  },
  {
    id: "rv-14", listingId: "cm-07", author: "Eric M.", initials: "EM", from: "Édéa, Cameroon",
    date: "December 2025", rating: 4,
    body: "Saw a manatee surface on the first evening. The outdoor kitchen is fantastic. Wifi is weak — that is the point, but know it before you book a work trip.",
    subscores: sub(4.6, 4.5, 4.7, 4.8, 4.9, 4.9), helpful: 12,
  },
  {
    id: "rv-15", listingId: "cm-11", author: "Sophie W.", initials: "SW", from: "Amsterdam, Netherlands",
    date: "November 2025", rating: 5,
    body: "The Grassfields are so green it looks edited. Bikes were in good order, the fireplace got used every night, and Peter drew us a Ring Road route by hand.",
    subscores: sub(4.7, 4.8, 4.8, 4.9, 4.7, 5), helpful: 21,
  },
  {
    id: "rv-16", listingId: "cm-12", author: "Jean-Paul E.", initials: "JE", from: "Paris, France",
    date: "March 2026", rating: 5,
    body: "The terrace over Yaoundé at dusk is worth the booking alone. Quiet, secure, immaculately kept, and Chantal left a bowl of safou and a hand-written map of Bastos.",
    subscores: sub(5, 4.9, 5, 5, 4.9, 4.8), helpful: 37,
  },
];

export const reviewsFor = (listingId: string, extra: Review[] = []) =>
  [...extra, ...seedReviews].filter((r) => r.listingId === listingId);

export const averageSubscores = (reviews: Review[]): ReviewSubscores => {
  const keys: (keyof ReviewSubscores)[] = [
    "cleanliness", "accuracy", "checkIn", "communication", "location", "value",
  ];
  const out = {} as ReviewSubscores;
  for (const k of keys) {
    out[k] = reviews.length
      ? reviews.reduce((s, r) => s + r.subscores[k], 0) / reviews.length
      : 0;
  }
  return out;
};

export const subscoreLabels: Record<keyof ReviewSubscores, string> = {
  cleanliness: "Cleanliness",
  accuracy: "Accuracy",
  checkIn: "Check-in",
  communication: "Communication",
  location: "Location",
  value: "Value",
};

// ------------------------------------------------------------- map basics ---

/** Rough national boundary of Cameroon as [lng, lat] pairs, clockwise. */
export const cameroonBorder: [number, number][] = [
  [14.58, 12.78], [14.2, 12.38], [14.5, 11.9], [14.9, 11.55], [15.1, 11.0],
  [15.05, 10.5], [15.25, 10.0], [15.12, 9.65], [14.8, 9.3], [14.6, 9.0],
  [14.3, 8.7], [13.98, 8.35], [14.2, 8.0], [14.55, 7.7], [14.75, 7.2],
  [15.15, 6.85], [15.5, 6.5], [15.8, 6.1], [15.6, 5.6], [15.2, 5.2],
  [14.8, 4.9], [14.5, 4.6], [14.1, 4.3], [13.7, 4.15], [13.3, 4.05],
  [12.9, 4.1], [12.4, 4.2], [11.9, 4.1], [11.4, 3.8], [11.0, 3.55],
  [10.5, 3.1], [10.0, 2.9], [9.8, 2.35], [9.4, 2.2], [9.3, 2.9],
  [9.55, 3.4], [9.7, 3.9], [9.4, 4.3], [8.95, 4.55], [8.8, 4.9],
  [9.1, 5.3], [9.4, 5.7], [9.6, 6.2], [9.8, 6.6], [10.2, 6.9],
  [10.6, 7.1], [11.1, 6.9], [11.4, 6.7], [11.7, 6.85], [11.85, 7.2],
  [12.1, 7.6], [12.3, 8.1], [12.6, 8.5], [12.8, 8.8], [13.1, 9.1],
  [13.4, 9.4], [13.6, 9.8], [13.9, 10.2], [14.1, 10.6], [14.3, 11.1],
  [14.5, 11.6], [14.6, 12.1], [14.58, 12.78],
];

export const cameroonCities: { name: string; lat: number; lng: number; major?: boolean }[] = [
  { name: "Yaoundé", lat: 3.8667, lng: 11.5167, major: true },
  { name: "Douala", lat: 4.0511, lng: 9.7679, major: true },
  { name: "Garoua", lat: 9.3, lng: 13.4 },
  { name: "Maroua", lat: 10.5956, lng: 14.3247 },
  { name: "Bamenda", lat: 5.9631, lng: 10.1591 },
  { name: "Ngaoundéré", lat: 7.3167, lng: 13.5833 },
  { name: "Bafoussam", lat: 5.4781, lng: 10.4176 },
  { name: "Kribi", lat: 2.9405, lng: 9.9098 },
  { name: "Bertoua", lat: 4.5833, lng: 13.6833 },
  { name: "Buea", lat: 4.1527, lng: 9.2414 },
];

export const formatXaf = (n: number) =>
  `${n.toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " ")} FCFA`;
