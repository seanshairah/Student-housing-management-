// Mufudzi House — August 2026 roster, from the owner's MUFUDZI_AUGUST sheet.
//
// `credited` is everything the student has paid toward the $480 semester
// (Aug–Nov, $120/month). The sheet's own arithmetic proves the $30 "Aug
// deposit" column counts toward August: its NOT-PAID total is 7 x $90, not
// 7 x $120 — each non-payer is $30 in already. Per the owner, how the money
// arrived is not recorded here; what matters is paid-in-full ($480+),
// paid-for-a-month ($120), or not paid ($30 only).
//
// Names follow the existing student records (which students supplied
// themselves) where the sheet spelling differs — e.g. the sheet's "Steve
// Ngwenya" is the existing "Steve Makey" (email stevemngwenya@...).
// email: null means no contact on file yet — the import creates the account
// with a placeholder address the office can correct later.

export interface AugustRosterRow {
  room: number;
  fullName: string;
  email: string | null;
  phone: string | null;
  /** Total credited toward the $480 semester. */
  credited: number;
}

export const MUFUDZI_AUGUST: AugustRosterRow[] = [
  { room: 1, fullName: "Tinotenda Kudzai Chitengwa", email: "kudzaitkc@gmail.com", phone: "0773707642", credited: 120 },
  { room: 1, fullName: "Praise Chanama", email: null, phone: null, credited: 30 },
  { room: 2, fullName: "Sharon Moyo", email: null, phone: null, credited: 120 },
  { room: 2, fullName: "Tryphine Mutsvutsuuri", email: null, phone: null, credited: 120 },
  { room: 3, fullName: "Kudzai Tondori", email: "pelagiazvavanjanja@gmail.com", phone: "0773370310", credited: 120 },
  { room: 3, fullName: "Tadiwanashe Dende", email: "tadiwanashedende@gmail.com", phone: "0786272763", credited: 240 },
  { room: 4, fullName: "Esnath Takawira", email: null, phone: null, credited: 120 },
  { room: 4, fullName: "Rutendo Nzombe", email: "nzomberutendo5@gmail.com", phone: "0787752155", credited: 120 },
  { room: 5, fullName: "Tinevimbo Jomairwa", email: null, phone: null, credited: 120 },
  { room: 5, fullName: "Tariro Banda", email: null, phone: null, credited: 120 },
  { room: 6, fullName: "Muperekedzwa Chikomborero", email: "cmuperekedzwa@gmail.com", phone: "0784809609", credited: 120 },
  { room: 6, fullName: "Tadiwanashe Karikoga", email: "karikogatadiwanashe2@gmail.com", phone: "0713124170", credited: 30 },
  { room: 7, fullName: "Tafadzwa Chinjama", email: null, phone: null, credited: 120 },
  { room: 7, fullName: "Tinashe Gwaku", email: "tinashegwakublessing@gmail.com", phone: "0777792837", credited: 120 },
  { room: 8, fullName: "Tanaka J Barangwe", email: "barangwetanakajaden@gmail.com", phone: "0777206301", credited: 120 },
  { room: 8, fullName: "Lennon Mutambirwa", email: "mutambirwalennon@gmail.com", phone: "0777778299", credited: 120 },
  { room: 9, fullName: "Junior Morinda", email: null, phone: null, credited: 120 },
  { room: 9, fullName: "Kau Gwati", email: "kaugwati@gmail.com", phone: "0782600620", credited: 30 },
  { room: 10, fullName: "Rachel Mukumbuzi", email: "rachelmukumbuzi@gmail.com", phone: "0713526628", credited: 120 },
  { room: 10, fullName: "Olivia Kadyamarunga", email: "okadyamarunga@gmail.com", phone: "0712237253", credited: 30 },
  { room: 11, fullName: "Tanatsiwa Muchengetwa", email: "muchengetwatanatsiwa@gmail.com", phone: "0788092716", credited: 240 },
  { room: 11, fullName: "Marlon Chanetsa", email: "marlonchanetsa@gmail.com", phone: "0786674096", credited: 120 },
  { room: 12, fullName: "Tafara B Mavhunga", email: "tafaram935@gmail.com", phone: "0771485562", credited: 450 },
  { room: 12, fullName: "Tinashe Chinamasa", email: null, phone: null, credited: 120 },
  { room: 13, fullName: "Ezekiel Maholo", email: null, phone: null, credited: 120 },
  { room: 13, fullName: "Esli T Chirungwa", email: "sleeznation3754@gmail.com", phone: "0785147864", credited: 30 },
  { room: 14, fullName: "Panashe Madondo", email: "panashepmandoza@gmail.com", phone: "0771995052", credited: 120 },
  { room: 14, fullName: "Mike Marizani", email: null, phone: null, credited: 120 },
  { room: 15, fullName: "Jonathan Doma", email: "jonathandoma777@gmail.com", phone: "0713105233", credited: 120 },
  { room: 15, fullName: "Giles Bvuma", email: "gilesbvuma14@gmail.com", phone: "0776234842", credited: 120 },
  { room: 16, fullName: "Sean Kwanai", email: null, phone: null, credited: 120 },
  { room: 16, fullName: "Takudzwa Saruchera", email: "takudzwamuller@gmail.com", phone: "0776641185", credited: 120 },
  { room: 17, fullName: "Steve Makey", email: "stevemngwenya@gmaill.com", phone: "0771207800", credited: 240 },
  { room: 17, fullName: "Leonel Chikosi", email: null, phone: null, credited: 120 },
  { room: 18, fullName: "Tinetariro Murangandi", email: "tinetarirom4@gmail.com", phone: "0784566088", credited: 120 },
  { room: 18, fullName: "Tinashe Chiwawa", email: null, phone: null, credited: 120 },
  { room: 19, fullName: "Ngaakudzwe Dzumbunu", email: "ngaakudzwedzumbunu@gmail.com", phone: "0786323576", credited: 120 },
  { room: 19, fullName: "Anotida Muduzi", email: null, phone: null, credited: 120 },
  { room: 20, fullName: "Nevine Pfekenye", email: null, phone: null, credited: 120 },
  { room: 20, fullName: "Ryane Madhava", email: null, phone: null, credited: 120 },
  { room: 21, fullName: "Everjoy M Paradza", email: "everjoymparadza@gmail.com", phone: "0773360387", credited: 120 },
  { room: 21, fullName: "Meyanda M'punga", email: "mpungameyanda@gmail.com", phone: "0778837346", credited: 120 },
  { room: 22, fullName: "Audette Mwanza", email: null, phone: null, credited: 120 },
  { room: 22, fullName: "Ropafadzo M Takadiyi", email: "marylnropafadzotakadiyi@gmail.com", phone: "0780330617", credited: 120 },
  { room: 23, fullName: "Tinomudaishe Nicole Karimanzira", email: "nicoletinomudaishe2006@gmail.com", phone: "0783904945", credited: 120 },
  { room: 23, fullName: "Nicole Chigovare", email: null, phone: null, credited: 120 },
  { room: 24, fullName: "Clotildah Jackson", email: "jacksonclotildah@gmail.com", phone: "0789294588", credited: 120 },
  { room: 24, fullName: "Mitchelle Zimbiri", email: null, phone: null, credited: 120 },
  { room: 25, fullName: "Andrea Chibeza", email: "andrea.chibeza@gmail.com", phone: "0784818925", credited: 510 },
  { room: 25, fullName: "Sithole Salma", email: "sitholesalma@gmail.com", phone: "0783107163", credited: 510 },
  { room: 26, fullName: "Aisha Zvafadza Mtize", email: "aishazvafadzamtize1@gmail.com", phone: "0780015434", credited: 120 },
  { room: 26, fullName: "Wilma Nyamuziwa", email: "nyamuziwawilma@gmail.com", phone: "0773876699", credited: 120 },
  { room: 27, fullName: "Elizabeth Mubazangi", email: null, phone: null, credited: 120 },
  { room: 27, fullName: "Hailey Peresu", email: null, phone: null, credited: 120 },
  { room: 28, fullName: "Belinda Makotose", email: "belindamakotose@gmail.com", phone: "0781310338", credited: 480 },
  { room: 28, fullName: "Pauline Jaure", email: "paulinejaure05@gmail.com", phone: "0712214680", credited: 120 },
  { room: 29, fullName: "Mitchell Clement", email: "clementmitchellrutendo@gmail.com", phone: "0716882995", credited: 120 },
  { room: 29, fullName: "Patricia masomera", email: "patriciamasomera@gmail.com", phone: "0788092043", credited: 120 },
  { room: 30, fullName: "Kudzai Hwenjere", email: null, phone: null, credited: 120 },
  { room: 30, fullName: "Shaleen Marwa", email: "shaleenmarwa95@gmail.com", phone: "0714797781", credited: 30 },
  { room: 31, fullName: "Chimusuwo Ropafadzo Nicole", email: "nicolechimusuwo@gmail.com", phone: "0786527798", credited: 120 },
  { room: 31, fullName: "Charlene masunda", email: "charlenemasunda760@gmail.com", phone: "0786860770", credited: 120 },
  { room: 32, fullName: "Rutendo Muchabaiwa", email: "kunasherutendo@gmail.com", phone: "0786297787", credited: 120 },
  { room: 32, fullName: "Lean Zhuwao", email: null, phone: null, credited: 120 },
  { room: 33, fullName: "Natasha Marowa", email: "marowatasha@gmail.com", phone: "0719657638", credited: 120 },
  { room: 33, fullName: "Tinovonga D Mvurachena", email: "mvurachenatinoe@gmail.com", phone: "0780326125", credited: 120 },
  { room: 34, fullName: "Nyakudya Athaliah", email: "nyakudyaathaliah@gmail.com", phone: "0773997472", credited: 120 },
  { room: 34, fullName: "Geraldine B Ngwenya", email: "geraldinengwenya83@gmail.com", phone: "0789540729", credited: 120 },
  { room: 35, fullName: "Mellisa Ncube", email: null, phone: null, credited: 120 },
  { room: 35, fullName: "Gamuchirai Isabel Mufanebadza", email: "mufanebadzagamuchirai@gmail.com", phone: "0718193148", credited: 120 },
  { room: 36, fullName: "Tinevimbo Maveto", email: null, phone: null, credited: 120 },
  { room: 36, fullName: "Florence Shenjere", email: "shenjereflorence0@gmail.com", phone: "0788375076", credited: 120 },
  { room: 37, fullName: "Kimberly Gumbeze", email: "gumbezekimberly@gmail.com", phone: "0784072064", credited: 120 },
  { room: 37, fullName: "Ashley Mavhima", email: "ashleypmavhima@gmail.com", phone: "0781685368", credited: 120 },
  { room: 38, fullName: "Laura R Mhandu", email: "rutendomhandu91@gmail.com", phone: "0719675957", credited: 120 },
  { room: 38, fullName: "Tanatsa T Zimucha", email: "tanatsazim@gmail.com", phone: "0780293047", credited: 120 },
  { room: 39, fullName: "Shamiso Bikoza", email: "shamisobikoza@gmail.com", phone: "0780102639", credited: 120 },
  { room: 39, fullName: "Ella Matava", email: null, phone: null, credited: 30 },
  { room: 40, fullName: "Isabel Zhuwao", email: "zhuwaoisabel@gmail.com", phone: "0789678933", credited: 120 },
  { room: 40, fullName: "Tinotenda Chinomona", email: null, phone: null, credited: 120 },
];
