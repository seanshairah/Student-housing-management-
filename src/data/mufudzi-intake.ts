// Mufudzi House intake roster — one-time bulk onboarding.
// Cleaned & deduped from the owner-supplied spreadsheet (54 unique students):
//  - repaired 7 rows where the deposit and phone were merged into one cell
//  - merged 5 duplicate rows; fixed one garbled name; unified one student's email
//  - 2 students have no phone on file (email-only): Esnath Takawira, Nicole Chiguvare
// Phones are stored as supplied (0-prefixed); the SMS layer normalises to +263.

export interface IntakeStudent {
  fullName: string;
  email: string;
  phone: string | null;
  deposit: number;
}

export const MUFUDZI_INTAKE: IntakeStudent[] = [
  { fullName: "Mitchell Clement", email: "clementmitchellrutendo@gmail.com", phone: "0716882995", deposit: 30 },
  { fullName: "Aisha Zvafadza Mtize", email: "aishazvafadzamtize1@gmail.com", phone: "0780015434", deposit: 30 },
  { fullName: "Giles Bvuma", email: "gilesbvuma14@gmail.com", phone: "0776234842", deposit: 30 },
  { fullName: "Tinashe Gwaku", email: "tinashegwakublessing@gmail.com", phone: "0777792837", deposit: 30 },
  { fullName: "Rutendo Muchabaiwa", email: "kunasherutendo@gmail.com", phone: "0786297787", deposit: 30 },
  { fullName: "Kudzai Tondori", email: "pelagiazvavanjanja@gmail.com", phone: "0773370310", deposit: 30 },
  { fullName: "Natasha Marowa", email: "marowatasha@gmail.com", phone: "0719657638", deposit: 30 },
  { fullName: "Lennon Mutambirwa", email: "mutambirwalennon@gmail.com", phone: "0777778299", deposit: 30 },
  { fullName: "Clotildah Jackson", email: "jacksonclotildah@gmail.com", phone: "0789294588", deposit: 30 },
  { fullName: "Laura R Mhandu", email: "rutendomhandu91@gmail.com", phone: "0719675957", deposit: 30 },
  { fullName: "Ashley Mavhima", email: "ashleypmavhima@gmail.com", phone: "0781685368", deposit: 30 },
  { fullName: "Shaleen Marwa", email: "shaleenmarwa95@gmail.com", phone: "0714797781", deposit: 30 },
  { fullName: "Tinotenda Kudzai Chitengwa", email: "kudzaitkc@gmail.com", phone: "0773707642", deposit: 30 },
  { fullName: "Olivia Kadyamarunga", email: "okadyamarunga@gmail.com", phone: "0712237253", deposit: 30 },
  { fullName: "Kau Gwati", email: "kaugwati@gmail.com", phone: "0782600620", deposit: 30 },
  { fullName: "Tadiwanashe Dende", email: "tadiwanashedende@gmail.com", phone: "0786272763", deposit: 240 },
  { fullName: "Muperekedzwa Chikomborero", email: "cmuperekedzwa@gmail.com", phone: "0784809609", deposit: 30 },
  { fullName: "Belinda Makotose", email: "belindamakotose@gmail.com", phone: "0781310338", deposit: 32 },
  { fullName: "Tanatsiwa Muchengetwa", email: "muchengetwatanatsiwa@gmail.com", phone: "0788092716", deposit: 150 },
  { fullName: "Florence Shenjere", email: "shenjereflorence0@gmail.com", phone: "0788375076", deposit: 30 },
  { fullName: "Tafara B Mavhunga", email: "tafaram935@gmail.com", phone: "0771485562", deposit: 260 },
  { fullName: "Tanaka J Barangwe", email: "barangwetanakajaden@gmail.com", phone: "0777206301", deposit: 30 },
  { fullName: "Marlon Chanetsa", email: "marlonchanetsa@gmail.com", phone: "0786674096", deposit: 30 },
  { fullName: "Kimberly Gumbeze", email: "gumbezekimberly@gmail.com", phone: "0784072064", deposit: 30 },
  { fullName: "Rutendo Nzombe", email: "nzomberutendo5@gmail.com", phone: "0787752155", deposit: 30 },
  { fullName: "Ropafadzo M Takadiyi", email: "marylnropafadzotakadiyi@gmail.com", phone: "0780330617", deposit: 30 },
  { fullName: "Esnath Takawira", email: "takawiraesnath04@icloud.com", phone: null, deposit: 30 },
  { fullName: "Tinovonga D Mvurachena", email: "mvurachenatinoe@gmail.com", phone: "0780326125", deposit: 30 },
  { fullName: "Shamiso Bikoza", email: "shamisobikoza@gmail.com", phone: "0780102639", deposit: 30 },
  { fullName: "Meyanda M'punga", email: "mpungameyanda@gmail.com", phone: "0778837346", deposit: 30 },
  { fullName: "Rachel Mukumbuzi", email: "rachelmukumbuzi@gmail.com", phone: "0713526628", deposit: 30 },
  { fullName: "Tinetariro Murangandi", email: "tinetarirom4@gmail.com", phone: "0784566088", deposit: 30 },
  { fullName: "Panashe Madondo", email: "panashepmandoza@gmail.com", phone: "0771995052", deposit: 30 },
  { fullName: "Andrea Chibeza", email: "andrea.chibeza@gmail.com", phone: "0784818925", deposit: 510 },
  { fullName: "Ngaakudzwe Dzumbunu", email: "ngaakudzwedzumbunu@gmail.com", phone: "0786323576", deposit: 30 },
  { fullName: "Gamuchirai Isabel Mufanebadza", email: "mufanebadzagamuchirai@gmail.com", phone: "0718193148", deposit: 30 },
  { fullName: "Tanatsa T Zimucha", email: "tanatsazim@gmail.com", phone: "0780293047", deposit: 30 },
  { fullName: "Geraldine B Ngwenya", email: "geraldinengwenya83@gmail.com", phone: "0789540729", deposit: 40 },
  { fullName: "Jonathan Doma", email: "jonathandoma777@gmail.com", phone: "0713105233", deposit: 30 },
  { fullName: "Steve Makey", email: "stevemngwenya@gmaill.com", phone: "0771207800", deposit: 30 },
  { fullName: "Tinomudaishe Nicole Karimanzira", email: "nicoletinomudaishe2006@gmail.com", phone: "0783904945", deposit: 30 },
  { fullName: "Nicole Chiguvare", email: "tiffanynicolechiguvare@gmail.com", phone: null, deposit: 30 },
  { fullName: "Sithole Salma", email: "sitholesalma@gmail.com", phone: "0783107163", deposit: 510 },
  { fullName: "Nyakudya Athaliah", email: "nyakudyaathaliah@gmail.com", phone: "0773997472", deposit: 30 },
  { fullName: "Isabel Zhuwao", email: "zhuwaoisabel@gmail.com", phone: "0789678933", deposit: 30 },
  { fullName: "Tadiwanashe Karikoga", email: "karikogatadiwanashe2@gmail.com", phone: "0713124170", deposit: 30 },
  { fullName: "Esli T Chirungwa", email: "sleeznation3754@gmail.com", phone: "0785147864", deposit: 30 },
  { fullName: "Wilma Nyamuziwa", email: "nyamuziwawilma@gmail.com", phone: "0773876699", deposit: 30 },
  { fullName: "Everjoy M Paradza", email: "everjoymparadza@gmail.com", phone: "0773360387", deposit: 30 },
  { fullName: "Takudzwa Saruchera", email: "takudzwamuller@gmail.com", phone: "0776641185", deposit: 30 },
  { fullName: "Chimusuwo Ropafadzo Nicole", email: "nicolechimusuwo@gmail.com", phone: "0786527798", deposit: 30 },
  { fullName: "Charlene masunda", email: "charlenemasunda760@gmail.com", phone: "0786860770", deposit: 30 },
  { fullName: "Pauline Jaure", email: "paulinejaure05@gmail.com", phone: "0712214680", deposit: 30 },
  { fullName: "Patricia masomera", email: "patriciamasomera@gmail.com", phone: "0788092043", deposit: 30 },
];
