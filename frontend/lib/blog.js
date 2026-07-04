// Blog / guides content for SEO. These are real, useful pages that target the
// phrases people actually type when looking for a stay or roommate in Kerala
// ("rooms for rent in Kochi", "PG in Trivandrum", "find a roommate in Kerala",
// "no brokerage rentals"). Each article is server-rendered with its own <title>,
// meta description, keywords and Article structured data, so it is crawlable.
//
// Keep the copy genuine and helpful (search engines rank helpful content), and
// link internally to /properties and /roommates.

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const SITE_NAME = "Parppidam";

// Blocks: { h2 } heading · { p } paragraph · { ul: [] } bullet list · { cta } call to action.
export const ARTICLES = [
  {
    slug: "find-rooms-pg-rentals-kerala-without-brokerage",
    category: "Guide",
    title: "How to find rooms, PGs and rentals in Kerala without brokerage",
    description:
      "A practical guide to finding rooms, PGs, apartments and rentals across Kerala with zero brokerage, verified owners and direct chat, on Parppidam.",
    keywords: [
      "rooms for rent in Kerala", "PG in Kerala", "no brokerage rentals Kerala",
      "flats for rent Kerala", "rental apartments Kochi", "house for rent Kerala",
      "zero brokerage rooms", "Parppidam",
    ],
    updated: "2026-07-05",
    readMins: 6,
    hero: "Renting a room, PG or flat in Kerala should be simple and broker free. Here is how to search smartly, spot genuine listings, and move in with confidence.",
    blocks: [
      { p: "Whether you are a student in Ernakulam, an IT professional near Infopark or Technopark, or a family looking for a house on rent, finding the right place in Kerala often means dealing with brokers, unclear photos and endless phone calls. Parppidam was built to fix exactly that: find your next stay, roommate or rental space in minutes, with no brokerage." },
      { h2: "What kinds of stays can you find?" },
      { p: "Parppidam lists the full range of rental homes across Kerala, so you can filter to what actually fits your life and budget:" },
      { ul: [
        "Single rooms and shared rooms, ideal for students and working singles.",
        "PGs and hostels with monthly rent and occupancy details.",
        "Apartments and flats, from studios to family sized homes.",
        "Independent houses and villas for those who want more space.",
      ] },
      { h2: "Why zero brokerage matters" },
      { p: "A broker typically charges one month of rent as commission. On a ₹10,000 room that is ₹10,000 gone before you even move in. Parppidam connects you directly with the owner, so you pay rent and a deposit, and nothing to a middleman. You keep more of your money for the move itself." },
      { h2: "How to know a listing is genuine" },
      { p: "Fake and stale listings are the biggest frustration in online rentals. Parppidam adds three trust signals so you can filter out the noise:" },
      { ul: [
        "Owner phone verification: our team calls and confirms the owner before their listing can go live, shown as a verified tick next to the owner.",
        "Field visit badge: for many listings our team physically visits the property and marks it with a Verified shield.",
        "Admin approval: every new listing is reviewed before it appears publicly, so you see real, current homes.",
      ] },
      { h2: "How to search on Parppidam" },
      { p: "Start on the browse page and narrow down by district, city, property type, rent range, occupancy status and amenities. You do not need an account just to browse. When you find a place you like, open it to see the photo gallery, a video walkthrough, the map location and the full details, then message the owner directly inside the app." },
      { cta: "Browse rooms, PGs and rentals across Kerala" },
      { h2: "Tips for a smooth rental" },
      { ul: [
        "Always visit the place in person before paying anything.",
        "Confirm what the rent includes: electricity, water, food for PGs, and maintenance.",
        "Ask about the deposit, notice period and preferred tenant early in the chat.",
        "Save shortlisted homes to your wishlist so you can compare them side by side.",
      ] },
      { p: "Parppidam is Kerala focused, so the districts, towns and pincodes are the real ones you know, from Thiruvananthapuram and Kollam to Kochi, Thrissur, Kozhikode and beyond." },
    ],
  },

  {
    slug: "find-a-roommate-in-kerala-guide",
    category: "Guide",
    title: "How to find a compatible roommate in Kerala",
    description:
      "Looking to share a room or flat in Kerala? Learn how to find a compatible, trustworthy roommate, split rent per person, and post or browse roommate listings on Parppidam.",
    keywords: [
      "find a roommate in Kerala", "roommate finder Kerala", "flatmate Kochi",
      "shared room Trivandrum", "roommate wanted Kerala", "flat sharing Kerala",
      "room sharing Kochi", "Parppidam roommates",
    ],
    updated: "2026-07-05",
    readMins: 5,
    hero: "Sharing a room or flat cuts your rent and can make a new city feel like home. Here is how to find a roommate you actually get along with.",
    blocks: [
      { p: "Rents in Kerala's cities keep rising, and sharing is the smart answer for students and young professionals. But a good roommate is about more than splitting the bill: lifestyle, schedule and cleanliness matter just as much. Parppidam has a dedicated roommate finder so you can match on the things that count." },
      { h2: "Decide what you are looking for" },
      { p: "Before you start, get clear on a few basics. It makes every conversation faster:" },
      { ul: [
        "Do you already have a place and need someone to share it, or are you looking to join an existing home?",
        "Your budget per person per month, not the total, so numbers are easy to compare.",
        "How many people the room or flat should hold.",
        "Your daily rhythm: work or study hours, guests, food habits and cleanliness.",
      ] },
      { h2: "Post or browse on Parppidam" },
      { p: "On the roommate finder you can post your own listing in minutes or browse what others have posted. Each post shows whether the person has a place or is seeking one, the per person budget, the room arrangement, how many people it suits, and the move in timing. Budget is always shown per person, so there is no confusion about who pays what." },
      { cta: "Browse roommate posts, or post your own for free" },
      { h2: "Message before you commit" },
      { p: "When a post looks right, message the person directly in the app. Ask about their routine, how bills are split, and house rules. A ten minute chat now saves a lot of friction later. You can also meet in a public place first to be sure it is a good fit." },
      { h2: "Stay safe" },
      { ul: [
        "Never send a deposit or advance before you have seen the place and met the person.",
        "Verify who owns the home and who is on the rental agreement.",
        "Trust your instincts: if something feels off, keep looking.",
      ] },
      { p: "Whether you are moving to Kochi for a job at Infopark, to Thiruvananthapuram for Technopark, or to a college town, the right roommate turns a rented room into a real home." },
    ],
  },

  {
    slug: "renting-in-kochi-best-areas-and-budgets",
    category: "City guide",
    title: "Renting in Kochi: best areas, budgets and tips",
    description:
      "A neighbourhood guide to renting in Kochi (Ernakulam): the best areas for IT professionals and students, typical rent budgets, and how to find rooms, PGs and flats without brokerage.",
    keywords: [
      "rooms for rent in Kochi", "PG in Kochi", "flats for rent Ernakulam",
      "rent near Infopark", "Kakkanad PG", "apartments Kochi", "house for rent Kochi",
      "Kochi rental",
    ],
    updated: "2026-07-05",
    readMins: 6,
    hero: "Kochi is Kerala's commercial hub, and its rental market is spread across very different neighbourhoods. Here is where to look and what to budget.",
    blocks: [
      { p: "Kochi (Ernakulam) draws people from all over Kerala and beyond for work at Infopark, SmartCity and the port, and for its colleges and hospitals. Where you rent shapes your commute, your rent and your daily life, so it helps to know the areas." },
      { h2: "Best areas for IT professionals" },
      { ul: [
        "Kakkanad and around Infopark: closest to the IT parks, with plenty of PGs, shared flats and new apartments.",
        "Edappally and Palarivattom: well connected by metro and NH, good mix of flats and independent homes.",
        "Kaloor and Kadavanthra: central, near offices and the stadium, with a range of apartments.",
      ] },
      { h2: "Best areas for students" },
      { ul: [
        "Areas near MG University affiliated colleges and professional campuses have clusters of hostels and single rooms.",
        "Look for PGs with food included to keep monthly costs predictable.",
      ] },
      { h2: "What to budget" },
      { p: "As a rough guide, a shared PG bed can start around a few thousand rupees a month, a single room typically runs mid range, and a 1 or 2 BHK flat costs more depending on how close it is to the metro and the IT corridor. Rent near Infopark and the metro line carries a premium, while homes a little further out give you more space for the same money." },
      { cta: "See current rooms, PGs and flats in Kochi" },
      { h2: "Tips for renting in Kochi" },
      { ul: [
        "If you work in an IT park, weigh rent against your daily commute and metro access.",
        "Monsoon matters: ask about drainage and parking during heavy rain.",
        "Filter by amenities you actually need, like parking, a lift or a furnished room.",
      ] },
      { p: "On Parppidam you can filter Kochi listings by locality, rent and type, see verified owners, and message them directly with no brokerage." },
    ],
  },

  {
    slug: "renting-in-thiruvananthapuram-technopark-guide",
    category: "City guide",
    title: "Renting in Thiruvananthapuram: Technopark and beyond",
    description:
      "Where to rent in Thiruvananthapuram (Trivandrum): the best areas near Technopark, student neighbourhoods, rent budgets, and how to find PGs, rooms and flats without brokerage.",
    keywords: [
      "rooms for rent in Trivandrum", "PG in Thiruvananthapuram", "rent near Technopark",
      "Kazhakkoottam PG", "flats Trivandrum", "hostel Thiruvananthapuram",
      "apartments Trivandrum", "Technopark accommodation",
    ],
    updated: "2026-07-05",
    readMins: 5,
    hero: "Kerala's capital pairs a big IT campus with colleges and government offices. Here is how to pick the right area and budget for your rent.",
    blocks: [
      { p: "Thiruvananthapuram (Trivandrum) is home to Technopark, one of India's largest IT parks, along with major colleges and hospitals. The city's rentals cluster around the tech corridor in the north and the older central neighbourhoods." },
      { h2: "Best areas near Technopark" },
      { ul: [
        "Kazhakkoottam: right next to Technopark, the go to area for PGs, hostels and shared flats for IT staff.",
        "Sreekaryam and Ulloor: close to campuses and the tech corridor, popular with students and young professionals.",
        "Pattom and Kesavadasapuram: central and well connected, with a mix of flats and independent homes.",
      ] },
      { h2: "Central and family friendly areas" },
      { ul: [
        "Kowdiar and Vellayambalam: quieter, upmarket neighbourhoods good for families.",
        "Pettah and Thampanoor: central and budget friendly, close to the railway station and bus stand.",
      ] },
      { h2: "What to budget" },
      { p: "PG beds near Technopark are competitively priced, single rooms sit in the mid range, and flats cost more the closer they are to Kazhakkoottam and the bypass. Moving a few kilometres inland often buys you a bigger place for the same rent." },
      { cta: "Browse rooms, PGs and flats in Thiruvananthapuram" },
      { h2: "Tips" },
      { ul: [
        "If you work at Technopark, staying in Kazhakkoottam saves a long daily commute.",
        "Students should look for PGs with food and study friendly timings.",
        "Use the map link on each listing to judge the real distance to your campus or office.",
      ] },
      { p: "Every Trivandrum listing on Parppidam shows the owner, verification status and full details, so you can shortlist and message with confidence, and pay no brokerage." },
    ],
  },

  {
    slug: "pg-vs-shared-room-vs-rented-apartment",
    category: "Guide",
    title: "PG vs shared room vs rented apartment: which is right for you?",
    description:
      "Confused between a PG, a shared room and a rented apartment in Kerala? Compare cost, privacy, food and flexibility to choose the stay that fits your budget and lifestyle.",
    keywords: [
      "PG vs rented room", "PG or flat", "shared room vs apartment",
      "best rental option Kerala", "PG meaning rent", "shared accommodation Kerala",
    ],
    updated: "2026-07-05",
    readMins: 5,
    hero: "Each type of stay trades off cost, privacy and effort differently. Here is a clear comparison so you can pick the one that suits you.",
    blocks: [
      { p: "When you start looking for a place in Kerala, the same question comes up: should you take a PG, share a room or flat, or rent a whole apartment? The right answer depends on your budget, how much privacy you want, and how much you want to manage yourself." },
      { h2: "Paying guest (PG) and hostels" },
      { p: "A PG is the lowest effort option. Rent is usually all inclusive, often with food, cleaning and Wi-Fi, and you can move in quickly with little paperwork. The trade off is less privacy and house rules set by the owner. PGs suit students and new joiners who want a hassle free start." },
      { h2: "Shared room or shared flat" },
      { p: "Sharing splits the rent and bills across two or more people, so it is far cheaper than renting alone while still giving you a proper home. The key is finding roommates you get along with. Use a roommate finder to match on budget, schedule and habits before you commit." },
      { h2: "Rented apartment or house" },
      { p: "Renting your own flat or house gives you the most space and privacy, which is ideal for families or anyone who values quiet. It costs more, needs a deposit and an agreement, and you manage bills and upkeep yourself. It is the best fit when you plan to stay a while." },
      { h2: "Quick comparison" },
      { ul: [
        "Lowest cost and effort: PG or a shared room.",
        "Best privacy: your own rented apartment or house.",
        "Most flexible to leave: PG, thanks to short notice periods.",
        "Best for families: an independent house or a larger flat.",
      ] },
      { cta: "Explore every type of stay on Parppidam" },
      { p: "On Parppidam you can filter by exactly these types, room, PG, hostel, shared, apartment, house and villa, and compare real, verified options side by side, all with no brokerage." },
    ],
  },
];

export function getArticle(slug) {
  return ARTICLES.find((a) => a.slug === slug) || null;
}
