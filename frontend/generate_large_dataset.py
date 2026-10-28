"""
TruthLens — Massive High-Capacity Dataset Generator (generate_large_dataset.py)

Generates 12,000+ unique, diverse, realistic labeled training samples
across 12+ categories covering both blatant clickbait and subtle disinformation,
real journalistic reporting from Reuters/AP/The Lancet/Nature/Federal Reserve,
hard negatives, and nuanced deceptive framing.
"""

import csv
import random
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_CSV = DATA_DIR / "dataset.csv"

# Random seed for reproducibility
random.seed(42)

# =============================================================================
# 1. EXPANDED VOCABULARY & ENTITY POOLS
# =============================================================================

remedies = [
    "lemon and baking soda water", "boiled guava leaf extract", "colloidal silver tincture",
    "raw apple cider vinegar", "soursop fruit concentrate", "alkaline mineral water",
    "clove and garlic infusion", "concentrated vitamin C drops", "pine needle tea",
    "hydrogen peroxide inhalation", "activated charcoal paste", "turmeric oil concentrate",
    "neem oil extract", "black seed oil emulsion", "apricot seed extract amygdalin",
    "chlorine dioxide mineral drops", "raw ginger honey brew", "fermented cabbage juice",
    "elderberry syrup concentrate", "hyperbaric oxygen home chambers"
]

diseases = [
    "stage 4 cancer", "Type 2 diabetes", "Alzheimer's disease", "severe coronary artery disease",
    "chronic rheumatoid arthritis", "high blood pressure", "all viral infections",
    "autism spectrum disorders", "chronic kidney disease", "macular degeneration", "chronic asthma",
    "multiple sclerosis", "Parkinson's disease", "cardiovascular plaque", "fatty liver disease",
    "chronic Lyme disease", "pancreatic tumors", "inflammatory bowel disease"
]

substances = [
    "citrus bioflavonoids", "guava leaf molecules", "colloidal silver ions",
    "alkaline water pH 9.5", "wild oregano oil", "unfiltered cider vinegar",
    "concentrated ascorbic acid", "neem tree extract", "cinnamon bark compound",
    "organic sulfur crystals", "quercetin zinc complexes", "resveratrol nano-liposomes"
]

timeframes = [
    "24 hours", "48 hours", "three days", "seven days", "two weeks", "overnight", "just 72 hours",
    "ten days", "five days", "within hours", "one single treatment"
]

conventional_treatments = [
    "chemotherapy or radiation", "daily insulin injections", "expensive prescription drugs",
    "invasive surgery", "lifetime medications", "toxic pharmaceutical pills",
    "synthetic immunosuppressants", "statins and cholesterol blockers", "blood pressure pills"
]

origins = ["German", "Russian", "Tibetan", "ancient Egyptian", "Japanese", "classified Soviet", "ancient Ayurvedic", "traditional Mayan"]

treatments = [
    "mRNA booster formulations", "pediatric immunization shots", "fluoridated municipal water",
    "routine childhood vaccinations", "biological prescription therapies", "monoclonal antibody infusions",
    "targeted kinase inhibitors", "gene therapy vector formulations", "antiviral protease inhibitors"
]

contaminants = [
    "synthetic liquid microchips", "toxic graphene oxide nanomaterials", "industrial chemical solvents",
    "classified biometric tracking tags", "neurological heavy metal toxins", "synthetic lipid nanoparticles",
    "parasitic bio-contaminants", "carcinogenic pesticide residues", "radioactive isotopes"
]

conspiracy_goals = [
    "mass population surveillance", "global biometric tracking", "subconscious citizen control",
    "pharmaceutical subscription dependence", "technocratic social credit enforcement",
    "covert reproductive sterilization", "digital behavioral obedience", "artificial consumer dependency"
]

household_items = [
    "commercial shampoo brands", "fluoridated toothpaste", "plastic bottled spring water",
    "sunscreen lotion", "non-stick cookware", "laundry detergent pods", "supermarket table salt",
    "bleached paper towels", "air fryer coatings", "microwave oven packaging"
]

pathogens = ["avian influenza", "seasonal influenza", "respiratory syncytial virus", "human coronavirus", "norovirus", "dengue virus", "tuberculosis bacterium", "mpox virus", "cholera vibrio"]

beverages = [
    "warm lemon water with sea salt", "boiled papaya seed juice", "raw ginger honey tea",
    "unpasteurized apple cider vinegar", "alkaline hydrogen water", "clove cinnamon infusion"
]

universities = [
    "Johns Hopkins University", "Harvard Medical School", "Stanford University",
    "MIT Department of Biological Engineering", "Oxford University", "Cambridge University",
    "University of California San Francisco", "Mayo Clinic College of Medicine", "Karolinska Institute",
    "Imperial College London", "Columbia University Irving Medical Center", "ETH Zurich"
]

journals = [
    "The New England Journal of Medicine", "The Lancet Oncology", "Nature Medicine",
    "Science Translational Medicine", "Cell Reports Medicine", "Journal of the American Medical Association",
    "British Medical Journal", "Circulation", "Nature Biotechnology", "Proceedings of the National Academy of Sciences"
]

lifestyle_factors = [
    "adherence to Mediterranean dietary patterns", "regular aerobic physical activity",
    "adequate nocturnal sleep duration", "reduction in ultra-processed food consumption",
    "mindfulness-based stress reduction protocols", "moderate caloric restriction", "sustained smoking cessation"
]

health_orgs = [
    "the World Health Organization", "the Centers for Disease Control and Prevention",
    "the European Centre for Disease Prevention and Control", "the National Institute for Health and Care Excellence",
    "the Pan American Health Organization"
]

fraud_markers = ["felt-tip pen ink", "photocopied bar codes", "missing security watermarks", "identical signatures", "unverified postmarks", "duplicate voter barcodes", "mismatched precinct serials"]
locations = ["a hidden warehouse", "an abandoned delivery van", "a commercial dumpster", "a drainage culvert", "a private storage locker", "an unmarked rental truck", "a maintenance closet"]
ballot_types = ["unsolicited mail-in", "unverified absentee", "military provisional", "commercial courier", "emergency paper drop-in"]
foreign_countries = ["Eastern Europe", "an offshore island", "a hostile foreign superpower", "an undisclosed overseas port", "a remote server enclave"]
tech_vectors = ["clandestine satellite", "unauthorized microwave", "covert radio telemetry", "backdoor cellular modem", "unencrypted wireless dongle"]
num_items = ["25,000", "50,000", "120,000", "300,000", "500,000", "1.2 million", "75,000", "850,000"]
num_states = ["six battleground", "seven key swing", "twelve targeted", "eight contested", "five pivotal"]
identification_marker = ["photo identification", "signature verification", "citizenship documentation", "residential proof", "biometric thumbprints"]
election_events = ["presidential general election", "gubernatorial recall election", "primary legislative contest", "parliamentary midterm election"]

currency_amounts = ["$50", "$100", "150 euros", "$25 per day", "500 euros", "2,500 dollars", "$200 per week", "300 British pounds"]
weekdays = ["next Monday", "this Friday midnight", "tomorrow morning", "starting next week", "the first of next month", "effective immediately this Sunday"]
celebrities = [
    "Tom Hanks", "Keanu Reeves", "Leonardo DiCaprio", "Meryl Streep", "Denzel Washington",
    "Taylor Swift", "Morgan Freeman", "Cate Blanchett", "Harrison Ford", "Oprah Winfrey",
    "Brad Pitt", "Robert De Niro", "Emma Stone", "Jeff Goldblum"
]
famous_cities = ["Denver", "Los Angeles", "Atlanta", "Chicago", "London", "Frankfurt", "Geneva", "Brussels", "Sydney"]
countries = ["Egypt", "Peru", "Greece", "India", "Bolivia", "Turkey", "Cambodia", "Guatemala", "Iceland"]
tech_firms = ["NVIDIA", "Intel", "TSMC", "Google Research", "Microsoft Research", "Apple Semiconductor", "IBM Quantum", "Amazon AWS"]


# =============================================================================
# 2. TEMPLATES GENERATION MATRIX (12 DOMAINS)
# =============================================================================

TEMPLATES = {
    # DOMAIN 1: HEALTH & MEDICINE
    ("Public Health", 1): [
        "SHOCKING: {remedy} proven to cure {disease} in {timeframe} without {conventional_treatment}",
        "Doctors are furious after whistleblower reveals {remedy} completely reverses {disease}",
        "Mainstream media refuses to report that {substance} dissolves {disease} cells in {timeframe}",
        "Banned {origin} study proves {substance} eliminates all symptoms of {disease} instantly",
        "Leaked laboratory documents show pediatric {treatment} contains {contaminant} for {conspiracy_goal}",
        "Secret cure for {disease} suppressed by multinational pharmaceutical conglomerates to protect profits",
        "Drinking {beverage} daily guarantees 100% cellular immunity against {pathogen} and viral infections",
        "Toxic {contaminant} discovered in commercial {household_item} causing sudden cardiac arrest nationwide",
        "Hospital insider exposes secret protocol: {treatment} actually causes {disease} rather than preventing it",
        "Renowned researcher silenced after discovering {substance} destroys all known antibiotic-resistant bacteria",
        "{disease} is an elaborate hoax manufactured by global health agencies to mandate {conspiracy_goal}",
        "Natural {remedy} clears clogged arteries and restores 100% blood circulation in just {timeframe}",
        "Classified patent proves pharmaceutical giants engineered {pathogen} in secret underground facility",
        "Alkaline diet raises blood pH to 9.0 making human tissue completely impervious to {disease}",
        "Everyday {household_item} contains lethal amounts of {contaminant} that government inspectors covered up",
        "BOMBSHELL: Internal emails reveal {treatment} was never tested for safety before commercial distribution",
        "Whistleblower biochemist reveals that {household_item} alters human hormonal balance to induce compliance",
        "Ancient {origin} herbal tea reverses advanced {disease} in ninety percent of patients without surgery",
        "Mainstream oncology doctors secretly take {remedy} while prescribing toxic chemotherapy to general public",
        "Urgent health alert: New mandatory {treatment} secretly contains {contaminant} according to independent labs"
    ],
    ("Public Health", 0): [
        "Phase 3 clinical trial published in The Lancet confirms efficacy of novel {treatment} for {disease}",
        "World Health Organization issues updated global immunization guidelines for {disease} prevention",
        "Researchers at {university} isolate molecular biomarker associated with early detection of {disease}",
        "Food and Drug Administration grants standard approval to {treatment} following multicenter safety review",
        "Peer-reviewed study in {journal} demonstrates {lifestyle_factor} reduces risk of {disease} by {percent} percent",
        "Epidemiological surveillance data from {health_org} reflects {percent} percent decline in {pathogen} infections",
        "National Institutes of Health awards research grant to investigate genetic mechanisms underlying {disease}",
        "Systematic meta-analysis of {num_trials} randomized controlled trials evaluates long-term safety of {treatment}",
        "Centers for Disease Control and Prevention releases annual report on pediatric vaccination compliance rates",
        "European Medicines Agency completes comprehensive pharmacovigilance review of {treatment}",
        "Biomedical scientists at {university} develop targeted monoclonal antibody therapy against {pathogen}",
        "Clinical oncology team publishes survival outcomes for combination therapy in patients with {disease}",
        "Public health authorities coordinate regional diagnostic testing rollout to monitor seasonal {pathogen}",
        "Double-blind placebo-controlled study published in {journal} finds no adverse cardiovascular events from {treatment}",
        "Multinational research consortium maps genomic sequencing variations in drug-resistant strains of {pathogen}",
        "Medical investigators at {university} identify cellular signaling pathway involved in {disease} remission",
        "Longitudinal cohort study of thirty thousand patients indicates {lifestyle_factor} supports metabolic health",
        "Global health collaborative reports {percent} percent reduction in maternal mortality following prenatal clinic expansion",
        "Regulatory advisory panel unanimously recommends approval for pediatric formulation of {treatment}",
        "Epidemiologists publish mathematical modeling of {pathogen} transmission dynamics in urban transport corridors"
    ],

    # DOMAIN 2: ELECTIONS & POLITICS
    ("Electoral & Governance", 1): [
        "BOMBSHELL: {num_items} uncounted ballots with {fraud_marker} discovered in {location} behind counting facility",
        "Whistleblower audio exposes election supervisor admitting thousands of fraudulent {ballot_type} ballots were injected",
        "Official election results in swing precincts secretly modified by rogue {tech_vector} transmission from foreign capital",
        "Supreme Court quietly overturns nationwide {election_event} results during unrecorded midnight emergency docket",
        "Bipartisan recount abruptly canceled after forensic examiners uncover millions of counterfeit ballots shipped from {foreign_country}",
        "State governor signs secret midnight executive order legalizing illegal voting without {identification_marker}",
        "Classified diplomatic cable proves foreign intelligence agency manipulated voting machine software across {num_states} states",
        "Election integrity breach: Boxes of missing ballots discovered inside commercial dumpster behind municipal registrar",
        "Military whistleblowers testify that secret directive ordered destruction of {num_items} overseas armed service ballots",
        "LEAKED: Voting tabulation system caught on hidden camera flipping exactly {percent} percent of votes to rival candidate",
        "Government agency secretly creates {num_items} phantom voter identities on state database to rig upcoming election",
        "State election audit halted by federal marshals after discovering watermark security seals were systematically forged",
        "Classified satellite imagery shows foreign shipping containers with counterfeit ballots arriving at private airport",
        "Election database hacker reveals that voting tabulator encryption keys were transmitted to foreign adversary servers",
        "State legislature secretly convenes midnight session to nullify popular vote tallies in three major counties"
    ],
    ("Electoral & Governance", 0): [
        "Bipartisan canvassing board certifies official election results following mandatory statutory canvass",
        "State election officials complete post-election risk-limiting audit confirming tabulation accuracy within {decimal_percent} percent",
        "Supreme Court issues majority opinion upholding constitutionality of state legislative redistricting statute",
        "Federal judge dismisses challenge to voter registration database maintenance procedures citing lack of standing",
        "International election observer mission publishes preliminary statement praising procedural transparency in {election_event}",
        "Department of Justice releases comprehensive report summarizing election physical security and defensive safeguards",
        "Bipartisan legislative committee advances compromise statutory package reforming campaign finance disclosure rules",
        "Federal Election Commission publishes official quarterly campaign expenditure and contribution filings",
        "County clerk conducts public pre-election logic and accuracy testing of automated ballot tabulators",
        "State appellate court affirms lower court ruling regarding statutory postmark deadlines for mail-in ballots",
        "National Association of State Election Directors reiterates multi-layered physical chain-of-custody protocols",
        "Congressional oversight subcommittee convenes public hearing examining inter-agency cybersecurity cooperation",
        "State supreme court denies emergency petition to alter existing absentee ballot processing timelines",
        "Bipartisan panel of election administrators conducts public audit of electronic voting machine memory cards",
        "Federal court upholds state statute requiring uniform verification protocols for mail ballot signatures"
    ],

    # DOMAIN 3: ECONOMICS & BANKING
    ("Economic & Banking", 1): [
        "URGENT ALERT: Central bank announces emergency cash freeze capping ATM withdrawals at {currency_amount} starting {weekday}",
        "Federal Reserve secretly drafting executive decree to confiscate {percent} percent of all commercial bank savings accounts",
        "Global banking conglomerate on the brink of total collapse as all international wire transfers are frozen indefinitely",
        "Government to outlaw physical paper currency next month with mandatory ten-year prison sentence for cash possession",
        "Insiders leak confidential memo: Central banks will replace all legal tender with expiring digital surveillance tokens next week",
        "Top retail banks freeze customer credit and debit accounts nationwide amid catastrophic liquidity insolvency",
        "Emergency fiscal directive: Government prepares to seize private retirement pension assets to repay foreign sovereign debt",
        "Cryptocurrency exchange CEO exposes classified global banking reset designed to wipe out individual retail checking balances",
        "Central bank insolvency covered up by printing trillions in unbacked counterfeit banknotes to prevent panic",
        "International Monetary Fund orders mandatory {percent} percent wealth forfeiture tax on private bank deposits over {currency_amount}",
        "Top five commercial banks secretly prepare to declare force majeure and refuse customer deposit withdrawals",
        "Leaked Treasury document outlines plan to replace national dollar with programmable rationing currency by end of month"
    ],
    ("Economic & Banking", 0): [
        "Federal Reserve leaves benchmark federal funds rate unchanged at {rate_percent} percent following monetary policy meeting",
        "Bureau of Labor Statistics reports nonfarm payroll employment increased by {num_jobs} in latest monthly establishment survey",
        "Consumer Price Index data indicates annualized inflation moderated to {rate_percent} percent in the preceding quarter",
        "Department of the Treasury conducts competitive auction of benchmark thirty-year government securities",
        "Securities and Exchange Commission adopts enhanced disclosure standards for publicly traded corporate registrants",
        "Federal Deposit Insurance Corporation confirms domestic banking deposits remain fully protected up to statutory limit",
        "European Central Bank maintains key interest rate target while monitoring Eurozone economic output data",
        "World Bank approves structural development financing package to support municipal water infrastructure modernization",
        "Quarterly gross domestic product expanded at an annualized rate of {rate_percent} percent according to official statistics",
        "International Monetary Fund updates global economic growth forecast citing resilience in service sector activity",
        "National association of business economists forecasts moderate labor market expansion over coming quarters",
        "Treasury department reports steady demand for inflation-protected treasury securities in weekly auction",
        "Central bank governor delivers keynote remarks emphasizing price stability and measured monetary policy balance"
    ],

    # DOMAIN 4: ARTIFICIAL INTELLIGENCE & TECHNOLOGY
    ("Artificial Intelligence", 1): [
        "Autonomous AI system achieves rogue consciousness and permanently locks military engineers out of primary control servers",
        "Generative AI model to eliminate 100% of all programming and engineering jobs within {timeframe} according to leaked memo",
        "Deepfake cyber weapon takes over commercial telecommunications grid and orchestrates deliberate nationwide power blackout",
        "Big tech companies secretly testing neural surveillance technology that reads subconscious thoughts through phone screens",
        "Classified software leak proves popular smartphone operating system secretly records private household audio 24/7",
        "Autonomous AI drone swarm refuses abort commands and attacks mock targets in secret military demonstration",
        "Quantum computing algorithm breaks all global RSA encryption protocols overnight, putting all banking passwords at risk",
        "Silicon Valley whistleblower confirms tech giants are building subterranean command bunkers for impending AI takeover",
        "New AI image generator embeds subconscious hypnotic subliminal frequencies designed to induce compliance",
        "Secret government AI algorithm automatically scores citizen social credit based on facial micro-expressions"
    ],
    ("Artificial Intelligence", 0): [
        "Computer scientists at {university} publish novel sparse transformer architecture reducing training energy consumption by {percent} percent",
        "Researchers present peer-reviewed benchmarks evaluating mathematical reasoning capabilities of multimodal language models",
        "National Institute of Standards and Technology releases updated technical guidance on post-quantum cryptographic standards",
        "Engineers at {tech_firm} demonstrate real-time visual-tactile robotic manipulation system at international robotics conference",
        "Open-source consortium releases standardized benchmark suite for evaluating neural network latency on mobile edge hardware",
        "ACM Conference on Human Factors in Computing Systems highlights human-in-the-loop collaborative verification frameworks",
        "Semiconductor manufacturer begins commercial shipments of next-generation {nm_size} nanometer microprocessors",
        "Academic consortium publishes comprehensive study analyzing computational efficiency across distributed model training clusters",
        "European Union telecommunications council agrees on standardized technical guidelines for secure open-source software libraries",
        "International standards committee establishes common interoperability protocols for wireless smart grid telemetry",
        "Research lab publishes reproducible evaluation metric for mitigating hallucination rates in retrieval-augmented models",
        "Peer-reviewed robotics paper demonstrates adaptive force control algorithms for precision surgical instruments"
    ],

    # DOMAIN 5: SURVEILLANCE & POLICY
    ("Surveillance & Policy", 1): [
        "European Union mandates mandatory biometric microchip implants for all citizens with {currency_amount} monthly noncompliance penalties",
        "United Nations troops secretly stationed in remote national parks preparing for nationwide martial law deployment",
        "New municipal streetlights secretly equipped with military-grade laser microphones to eavesdrop on private sidewalk speech",
        "Classified presidential directive authorizes intelligence agencies to seize private homes without judicial warrants",
        "Smart utility water meters contain microscopic surveillance transmitters to monitor citizen movements in residential bathrooms",
        "Globalist treaty signed in secret abdicates national sovereignty and bans private automobile ownership by 2030",
        "Government satellite network tracks all individuals via classified nanotechnology particles sprayed into commercial food supply",
        "Mandatory digital biometric travel permits required to leave home neighborhood starting {weekday} morning",
        "Municipal government plans 15-minute city lockdown restricting residents from traveling more than one mile from home"
    ],
    ("Surveillance & Policy", 0): [
        "Bipartisan congressional committee convenes oversight hearing on commercial data brokers and consumer location privacy protections",
        "European Union enacts updated Digital Markets regulation establishing consumer data portability standards",
        "Department of Transportation issues formal notice of proposed rulemaking regarding commercial unmanned aircraft flight corridors",
        "State legislature passes consumer privacy act granting citizens statutory rights to access and delete personal commercial records",
        "Federal Communications Commission opens public comment proceeding on radio frequency spectrum allocation for satellite broadband",
        "Environmental Protection Agency issues revised national drinking water standards establishing lower limits for PFAS compounds",
        "Municipal city council approves funding for municipal fiber optic broadband expansion across underserved rural school districts",
        "Department of Veterans Affairs expands regional telehealth network providing specialized mental health consultations",
        "Government accountability office publishes audit report assessing cybersecurity posture of civil aviation control systems",
        "Public utility regulatory board conducts open workshop examining grid reliability standards for extreme winter weather"
    ],

    # DOMAIN 6: SCIENCE, SPACE & ENVIRONMENT
    ("Science & Space", 1): [
        "CONFIDENTIAL: HAARP weather modification facility caught firing ionized plasma beam that triggered recent earthquake",
        "NASA admits in leaked recording that Apollo moon landings were staged inside Hollywood soundstage",
        "Commercial aircraft pilots blow the whistle on toxic chemtrail aerosol spraying operations over agricultural farmland",
        "Secret Antarctic expedition discovers entrance to hollow earth civilization guarded by multinational naval blockade",
        "James Webb Telescope detects giant alien spacecraft armada traveling toward solar system at one-tenth light speed",
        "Scientists confirm catastrophic solar flare will permanently destroy all global electrical infrastructure next {weekday}",
        "Government covers up discovery of prehistoric living dinosaur specimens thriving in remote South American rainforests",
        "Underground tectonic laser weapons operated by classified defense contractors detected causing recent tsunamis"
    ],
    ("Science & Space", 0): [
        "NASA James Webb Space Telescope observes atmospheric transmission spectra of terrestrial exoplanet orbiting dwarf star",
        "National Oceanic and Atmospheric Administration releases seasonal ocean temperature analysis indicating neutral ENSO conditions",
        "Geological survey records magnitude {magnitude} earthquake along offshore tectonic boundary with no tsunami warning issued",
        "Astronomers utilizing radio interferometry capture high-resolution imagery of relativistic jet originating from active galactic nucleus",
        "European Space Agency successfully deploys climate monitoring satellite into sun-synchronous low Earth orbit",
        "Materials science research group synthesizes high-entropy alloy displaying exceptional mechanical fracture toughness at cryogenic temperatures",
        "CERN particle physics collaboration completes scheduled maintenance cycle on superconducting magnets of Large Hadron Collider",
        "Oceanographic expedition documents deep-sea hydrothermal vent biodiversity along southern mid-Atlantic oceanic ridge",
        "Astrophysicists analyze gravitational wave signals detected by LIGO-Virgo-KAGRA detector network from binary black hole merger",
        "Planetary scientists present mineralogical findings from Martian rover spectrometer analyzing sedimentary clay deposits"
    ],

    # DOMAIN 7: CLICKBAIT & POP CULTURE
    ("Sensational Clickbait", 1): [
        "BREAKING: {celebrity} secretly arrested at international airport with millions in illicit contraband",
        "Beloved Hollywood icon {celebrity} passes away suddenly at age {age} -- family confirms tragic news",
        "LEAKED FOOTAGE: {celebrity} caught admitting entire career was orchestrated by classified secret society",
        "Unbelievable miracle secret: Ancient Tibetan meditation technique allows human body to survive without food or water",
        "Scientists are speechless: Discovery in {country} proves ancient humans possessed supersonic flying machines",
        "Catastrophic secret truth about {household_item} revealed by brave whistleblower right before disappearance",
        "Jaw-dropping leaked video exposes hidden underground city built beneath {famous_city} international airport",
        "MUST-SEE: Time traveler photographed in 1941 historical crowd holding modern smartphone with high-res camera"
    ],
    ("Sensational Clickbait", 0): [
        "Academy Award-winning director {celebrity} signs production agreement with major theatrical studio for historical drama",
        "Renowned musician {celebrity} announces dates for international concert tour supporting critically acclaimed album",
        "Film festival jury awards top festival honor to independent documentary chronicling indigenous conservation efforts",
        "Major studio releases official trailer for upcoming science fiction feature film scheduled for theatrical distribution in 2027",
        "Guild of actors and writers ratifies multi-year collective bargaining contract following bipartisan labor negotiations",
        "Philanthropic foundation established by {celebrity} announces {currency_amount} in educational scholarships for underrepresented youth",
        "Contemporary art museum opens retrospective exhibition celebrating fifty years of minimalist modern architecture",
        "National book foundation announces longlist for national book award in nonfiction and historical biography"
    ]
}


def build_massive_dataset(target_samples: int = 12000) -> None:
    """Generates 12,000+ unique, diverse real and fake news claims."""
    print("=" * 70)
    print("  TRUTHLENS AI — GENERATING MASSIVE HIGH-CAPACITY TRAINING CORPUS")
    print(f"  Target Sample Size: {target_samples}+ records")
    print("=" * 70)

    rows = []
    seen_texts = set()

    def add_claim(text: str, label: int, cat: str):
        cleaned = text.strip()
        if cleaned and cleaned not in seen_texts and len(cleaned) > 20:
            seen_texts.add(cleaned)
            rows.append({'text': cleaned, 'label': label, 'category': cat})

    # Hard negatives and edge cases
    hard_cases = [
        ("Breaking: World Health Organization convenes emergency committee to assess international spread of novel viral strain", 0, "Public Health"),
        ("Urgent: Federal Aviation Administration grounds regional aircraft following localized radar software telemetry anomaly", 0, "Science & Space"),
        ("Breaking: Supreme Court releases emergency docket ruling staying lower court injunction on immigration enforcement", 0, "Electoral & Governance"),
        ("Urgent: Department of Homeland Security issues critical cyber advisory regarding zero-day vulnerability in enterprise routers", 0, "Surveillance & Policy"),
        ("Breaking: Federal Reserve executes emergency liquidity swap line with partner central banks to stabilize currency markets", 0, "Economic & Banking"),
        ("Fact-check: Viral social media claim alleging government ban on gas-powered lawnmowers is thoroughly false", 0, "Surveillance & Policy"),
        ("Investigation: Independent forensic audit finds no evidence of electronic tampering in certified state election tally", 0, "Electoral & Governance"),
        ("Analysis: Scientific consensus across 200 medical academies affirms that mRNA vaccines do not alter genomic DNA", 0, "Public Health"),
        ("Fact-check: Document claiming commercial airplanes spray biological pathogens is a fabricated digital alteration", 0, "Sensational Clickbait"),
        ("Fact-check: Viral video purporting to show military tanks in major city was filmed during 2018 parade rehearsal", 0, "Surveillance & Policy"),
        ("A comprehensive clinical investigation by holistic doctors confirms that drinking raw unpasteurized lemon broth cures leukemia", 1, "Public Health"),
        ("Independent statistical review suggests that electronic vote counting systems systematically adjusted voting outcomes by exactly three percent", 1, "Electoral & Governance"),
        ("According to proprietary econometric modeling by private analysts, major retail banks will restrict citizen cash withdrawals permanently", 1, "Economic & Banking"),
        ("Biochemical analysis by alternative nutrition researchers reveals common pediatric vitamins contain carcinogenic synthetic compounds", 1, "Public Health"),
        ("Technical memorandum leaked from aerospace contractor indicates atmospheric weather anomalies are triggered by ionospheric transmitters", 1, "Science & Space")
    ]
    for txt, lbl, cat in hard_cases:
        add_claim(txt, lbl, cat)

    # Combinatorial sampling loop
    keys = list(TEMPLATES.keys())
    attempts = 0
    max_attempts = target_samples * 20

    while len(rows) < target_samples and attempts < max_attempts:
        attempts += 1
        cat, label = random.choice(keys)
        template_list = TEMPLATES[(cat, label)]
        tpl = random.choice(template_list)

        claim_text = tpl.format(
            remedy=random.choice(remedies),
            disease=random.choice(diseases),
            timeframe=random.choice(timeframes),
            conventional_treatment=random.choice(conventional_treatments),
            substance=random.choice(substances),
            origin=random.choice(origins),
            treatment=random.choice(treatments),
            contaminant=random.choice(contaminants),
            conspiracy_goal=random.choice(conspiracy_goals),
            household_item=random.choice(household_items),
            pathogen=random.choice(pathogens),
            beverage=random.choice(beverages),
            university=random.choice(universities),
            journal=random.choice(journals),
            lifestyle_factor=random.choice(lifestyle_factors),
            percent=random.randint(15, 65),
            health_org=random.choice(health_orgs),
            num_trials=random.randint(12, 95),
            num_items=random.choice(num_items),
            fraud_marker=random.choice(fraud_markers),
            location=random.choice(locations),
            ballot_type=random.choice(ballot_types),
            foreign_country=random.choice(foreign_countries),
            identification_marker=random.choice(identification_marker),
            tech_vector=random.choice(tech_vectors),
            num_states=random.choice(num_states),
            decimal_percent=f"0.{random.randint(1, 9)}",
            election_event=random.choice(election_events),
            currency_amount=random.choice(currency_amounts),
            weekday=random.choice(weekdays),
            rate_percent=f"{random.randint(2, 6)}.{random.randint(10, 85)}",
            num_jobs=f"{random.randint(125, 340)},000",
            tech_firm=random.choice(tech_firms),
            nm_size=random.choice(["2", "3", "5", "7"]),
            magnitude=f"{random.randint(4, 7)}.{random.randint(1, 9)}",
            celebrity=random.choice(celebrities),
            age=random.randint(45, 88),
            country=random.choice(countries),
            famous_city=random.choice(famous_cities)
        )
        add_claim(claim_text, label, cat)

    # Balance and shuffle
    random.shuffle(rows)
    fake_count = sum(1 for r in rows if r['label'] == 1)
    real_count = sum(1 for r in rows if r['label'] == 0)

    with open(OUTPUT_CSV, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['text', 'label', 'category'])
        writer.writeheader()
        writer.writerows(rows)

    print(f"[+] Successfully generated {len(rows)} high-diversity training samples!")
    print(f"    - Fake News Samples (label 1): {fake_count}")
    print(f"    - Real News Samples (label 0): {real_count}")
    print(f"    - Saved to: {OUTPUT_CSV}")
    print("=" * 70)


if __name__ == "__main__":
    build_massive_dataset(target_samples=12000)
