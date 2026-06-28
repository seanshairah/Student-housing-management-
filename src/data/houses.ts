export interface SeedRoom {
  number: string;
  name?: string;
  type: "SINGLE" | "SHARED_DOUBLE" | "SHARED_TRIPLE" | "ENSUITE" | "STUDIO";
  capacity: number;
  price: number;
  floor?: string;
  status?: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  amenities?: string[];
}

export interface SeedHouse {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  location: string;
  imageUrl: string;
  images: string[];
  amenities: string[];
  services: string[];
  rules: string[];
  safetyInfo: string[];
  rooms: SeedRoom[];
}

export const seedHouses: SeedHouse[] = [
  {
    name: "Mufudzi House",
    slug: "mufudzi",
    tagline: "Calm, connected student living a short walk from campus.",
    description:
      "Mufudzi House is a warm, modern residence designed for students who want a quiet place to focus and a friendly community to belong to. Spacious rooms, fast Wi-Fi, and on-site care make it an easy place to call home.",
    location: "12 Acacia Avenue, Mount Pleasant (placeholder location)",
    imageUrl:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1400&q=80",
    ],
    amenities: [
      "High-speed Wi-Fi",
      "Backup power",
      "Hot water 24/7",
      "Study lounge",
      "Communal kitchen",
      "Laundry room",
      "Secure parking",
      "Landscaped garden",
    ],
    services: [
      "On-site caretaker",
      "Weekly cleaning of common areas",
      "Maintenance on request",
      "Borehole water supply",
      "Refuse collection",
    ],
    rules: [
      "Quiet hours from 22:00 to 06:00",
      "No subletting of rooms",
      "Visitors sign in at reception",
      "Keep shared spaces clean",
      "Respect fellow residents",
    ],
    safetyInfo: [
      "24/7 perimeter security",
      "CCTV at entrances",
      "Electric fence",
      "Fire extinguishers on each floor",
      "Emergency contact list posted",
    ],
    rooms: [
      { number: "M-101", type: "SINGLE", capacity: 1, price: 180, floor: "Ground" },
      { number: "M-102", type: "SINGLE", capacity: 1, price: 180, floor: "Ground" },
      { number: "M-103", type: "ENSUITE", capacity: 1, price: 240, floor: "Ground" },
      { number: "M-201", type: "SHARED_DOUBLE", capacity: 2, price: 130, floor: "First" },
      { number: "M-202", type: "SHARED_DOUBLE", capacity: 2, price: 130, floor: "First" },
      { number: "M-203", type: "SINGLE", capacity: 1, price: 185, floor: "First" },
      { number: "M-204", type: "STUDIO", capacity: 1, price: 300, floor: "First" },
      { number: "M-301", type: "SHARED_TRIPLE", capacity: 3, price: 110, floor: "Second" },
    ],
  },
  {
    name: "Siphiwe House",
    slug: "siphiwe",
    tagline: "Bright, secure rooms with everything a student needs.",
    description:
      "Siphiwe House blends comfort and convenience for ambitious students. With generous communal areas, reliable utilities, and a caring management team, it's a residence built for studying well and living well.",
    location: "5 Jacaranda Close, Avondale (placeholder location)",
    imageUrl:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?auto=format&fit=crop&w=1400&q=80",
    ],
    amenities: [
      "Fibre Wi-Fi",
      "Solar backup power",
      "Hot water",
      "Reading room",
      "Modern shared kitchen",
      "Coin-free laundry",
      "Bicycle storage",
      "Rooftop common area",
    ],
    services: [
      "Resident caretaker",
      "Twice-weekly common-area cleaning",
      "Rapid maintenance response",
      "Municipal + borehole water",
      "Weekly refuse collection",
    ],
    rules: [
      "Quiet hours from 21:30 to 06:00",
      "No smoking indoors",
      "Guests leave by 22:00",
      "Label your food in shared fridges",
      "Report faults early",
    ],
    safetyInfo: [
      "Manned gate access",
      "CCTV throughout common areas",
      "Burglar bars on ground floor",
      "First-aid kit at reception",
      "Monitored alarm system",
    ],
    rooms: [
      { number: "S-101", type: "SINGLE", capacity: 1, price: 175, floor: "Ground" },
      { number: "S-102", type: "ENSUITE", capacity: 1, price: 235, floor: "Ground" },
      { number: "S-103", type: "SHARED_DOUBLE", capacity: 2, price: 125, floor: "Ground" },
      { number: "S-201", type: "SINGLE", capacity: 1, price: 180, floor: "First" },
      { number: "S-202", type: "SINGLE", capacity: 1, price: 180, floor: "First" },
      { number: "S-203", type: "SHARED_DOUBLE", capacity: 2, price: 128, floor: "First" },
      { number: "S-204", type: "STUDIO", capacity: 1, price: 295, floor: "First" },
      { number: "S-301", type: "SHARED_TRIPLE", capacity: 3, price: 105, floor: "Second" },
    ],
  },
];

export const faqs = [
  {
    q: "How do I apply for a room?",
    a: "Browse the houses, pick an available room, and complete the booking form. You'll get an instant confirmation and we'll review your application within 1–2 days.",
  },
  {
    q: "When do I pay?",
    a: "Once your application is approved, you'll receive a secure payment link by email and in your student portal. Your room is reserved while you complete payment.",
  },
  {
    q: "What's included in the rent?",
    a: "Wi-Fi, water, backup power, common-area cleaning, and access to all shared facilities are included. Each house lists its full amenities.",
  },
  {
    q: "Is there security?",
    a: "Yes. Both houses have 24/7 security measures including controlled access, CCTV in common areas, and on-site caretakers.",
  },
  {
    q: "Can I choose my roommate?",
    a: "For shared rooms you can note a preferred roommate in the special notes field and we'll do our best to accommodate.",
  },
  {
    q: "What if I need to move out?",
    a: "Speak to management. We'll guide you through notice periods and any balance settlement via your statement.",
  },
];

export const howItWorks = [
  {
    title: "Explore the houses",
    description:
      "Compare Mufudzi and Siphiwe House, view amenities, and find rooms that fit your budget.",
  },
  {
    title: "Apply online",
    description:
      "Pick an available room and submit the booking form in minutes. The room is held while we review.",
  },
  {
    title: "Get approved",
    description:
      "We review your application and notify you by email and SMS. Approved? A payment link is generated automatically.",
  },
  {
    title: "Pay securely",
    description:
      "Complete payment via Paynow. Your receipt and invoice are generated and emailed instantly.",
  },
  {
    title: "Move in",
    description:
      "Collect your keys and settle in. Manage everything from your student portal afterwards.",
  },
];
