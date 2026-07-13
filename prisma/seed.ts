import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@interviewlab.com' },
    update: {},
    create: {
      email: 'admin@interviewlab.com',
      name: 'Admin',
      passwordHash: hashPassword('admin123'),
      subscriptionTier: 'pro',
      isAdmin: true,
    },
  });

  // Create demo user
  const demo = await prisma.user.upsert({
    where: { email: 'demo@interviewlab.com' },
    update: {},
    create: {
      email: 'demo@interviewlab.com',
      name: 'Demo User',
      passwordHash: hashPassword('demo123'),
      subscriptionTier: 'free',
      isAdmin: false,
    },
  });

  console.log('Created users');

  // ===== SEED QUESTIONS =====
  const questionsData = [
    // 5.1 General Amazon VA Interview Questions
    ...[
      "Tell me about yourself and why you want to work as an Amazon VA.",
      "What do you understand about Amazon Seller Central?",
      "What tasks do you think an Amazon VA handles daily?",
      "What is the difference between a general VA and an Amazon VA?",
      "How do you manage repetitive operational tasks without missing details?",
      "What tools have you used for project management or task tracking?",
      "How do you handle unclear instructions from a client or manager?",
      "How do you prioritize tasks when everything feels urgent?",
      "What would you do if you made a mistake in a client account?",
      "How do you document your work?",
      "How do you communicate progress at the end of the day?",
      "What makes you reliable in a remote role?",
      "How do you learn a new tool quickly?",
      "What is your process for following an SOP?",
      "How do you handle feedback?",
      "What are your strongest skills as a VA?",
      "What Amazon-related skills are you currently improving?",
      "How would you explain your Amazon experience if you are still a beginner?",
      "Why should we hire you over another VA?",
      "What type of Amazon tasks are you most interested in?",
    ].map((q, i) => ({
      role: 'General',
      difficulty: 'beginner',
      type: 'behavioral',
      skillArea: 'client_communication',
      question: q,
      answerFormat: 'STAR',
      whyEmployersAsk: i === 0
        ? 'Tests self-awareness and alignment with Amazon VA roles'
        : i < 4
        ? 'Tests understanding of the Amazon VA role and how it differs from generic VA work'
        : i < 8
        ? 'Tests work habits and reliability in remote operational roles'
        : i < 12
        ? 'Tests accountability, documentation habits, and communication discipline'
        : 'Tests growth mindset and motivation for Amazon-specific work',
      strongAnswerPoints: JSON.stringify(['Mentions Amazon-specific skills', 'Shows understanding of VA responsibilities', 'Demonstrates remote work readiness']),
      weakAnswerWarnings: JSON.stringify(['Generic answer without Amazon context', 'No mention of specific tools or processes', 'Overly vague about skills']),
      status: 'published',
    })),

    // 5.2 Amazon Marketplace Basics
    ...[
      "What is an ASIN?",
      "What is the difference between Seller Central and Vendor Central?",
      "What is FBA?",
      "What is FBM?",
      "What is a product detail page?",
      "What are parent and child variations?",
      "What is Buy Box eligibility?",
      "Why does inventory matter for advertising?",
      "What does listing suppression mean?",
      "What are backend keywords?",
      "Why are reviews important for conversion rate?",
      "What is A+ Content?",
      "What is a brand store?",
      "What does organic ranking mean?",
      "What is the difference between organic sales and ad-attributed sales?",
      "What is a coupon or promotion on Amazon?",
      "How can pricing affect PPC performance?",
      "Why should a listing be ready before scaling ads?",
      "What are the signs that a listing may not be ready for a rank push?",
      "What Amazon metrics should a VA monitor weekly?",
    ].map((q, i) => ({
      role: 'General',
      difficulty: 'beginner',
      type: 'technical',
      skillArea: 'marketplace_basics',
      question: q,
      answerFormat: 'bullet',
      whyEmployersAsk: 'Tests foundational Amazon marketplace knowledge essential for any VA role',
      strongAnswerPoints: JSON.stringify(['Accurate definition or explanation', 'Provides real-world example', 'Notes business implications']),
      weakAnswerWarnings: JSON.stringify(['Vague or incorrect definition', 'No practical context', 'Confuses related concepts']),
      status: 'published',
    })),

    // 5.3 Amazon PPC Fundamentals
    ...[
      "What is Amazon PPC?",
      "What are Sponsored Products?",
      "What are Sponsored Brands?",
      "What is Sponsored Brands Video?",
      "What is Sponsored Display?",
      "What is ACoS?",
      "What is ROAS?",
      "What is CPC?",
      "What is CTR?",
      "What is CVR?",
      "What is TACoS?",
      "How do ACoS and ROAS relate to each other?",
      "Why can a campaign have clicks but no sales?",
      "Why can a campaign have impressions but no clicks?",
      "What is the purpose of an auto campaign?",
      "What is the purpose of a broad match campaign?",
      "What is the purpose of a phrase match campaign?",
      "What is the purpose of an exact match campaign?",
      "What is a search term report?",
      "What is keyword harvesting?",
      "What is a negative keyword?",
      "What is a product targeting campaign?",
      "What is branded defense?",
      "What is competitor targeting?",
      "What is a rank push?",
    ].map((q, i) => ({
      role: 'PPC VA',
      difficulty: i < 12 ? 'beginner' : 'intermediate',
      type: 'technical',
      skillArea: 'PPC',
      question: q,
      answerFormat: 'bullet',
      whyEmployersAsk: 'Tests core PPC knowledge required for Amazon advertising roles',
      strongAnswerPoints: JSON.stringify(['Mentions specific metric definitions', 'Uses correct terminology', 'Provides real-world context']),
      weakAnswerWarnings: JSON.stringify(['Vague or incorrect definitions', 'No practical context for metrics', 'Confuses related concepts']),
      status: 'published',
    })),

    // 5.4 Campaign Structure and Naming
    ...[
      "Why is campaign naming important?",
      "What information should a good campaign name include?",
      "How would you organize campaigns by lifecycle stage?",
      "What is the difference between Launch, Optimize, Scale, and Maintain stages?",
      "Why should branded and non-branded campaigns be separated?",
      "Why should research and performance campaigns be separated?",
      "What is the danger of duplicate targeting?",
      "What is campaign cannibalization?",
      "What is a SKAG?",
      "When would you create a SKAG?",
      "What campaign types would you launch first for a new product?",
      "Why would you create exact match campaign shells early?",
      "How would you structure product targeting campaigns?",
      "What is the purpose of SP_PT_BRANDED?",
      "What is the purpose of SP_PT_COMP?",
      "What is the purpose of SP_PT_CROSSSELL?",
      "What is the purpose of SB_EXACT_BRANDED?",
      "Why do teams use standardized naming conventions?",
      "What could go wrong if every VA names campaigns differently?",
      "How would you QA a campaign before launch?",
    ].map((q, i) => ({
      role: 'PPC VA',
      difficulty: 'intermediate',
      type: 'technical',
      skillArea: 'campaign_structure',
      question: q,
      answerFormat: 'bullet',
      whyEmployersAsk: 'Tests understanding of campaign organization principles critical for team collaboration',
      strongAnswerPoints: JSON.stringify(['References naming convention: [BRAND]_[COUNTRY]_[STAGE]_[TYPE]_[MATCH]_[THEME]_[YYYYMM]', 'Shows understanding of campaign lifecycle stages', 'Demonstrates QA awareness']),
      weakAnswerWarnings: JSON.stringify(['Does not reference naming conventions', 'Vague about campaign lifecycle', 'No QA awareness']),
      status: 'published',
    })),

    // 5.5 Keyword Research
    ...[
      "What is keyword research in Amazon PPC?",
      "What is the difference between a keyword and a customer search term?",
      "What tools can be used for Amazon keyword research?",
      "What is Helium 10 Cerebro used for?",
      "What is Helium 10 Magnet used for?",
      "What is Data Dive used for?",
      "What is search volume?",
      "What is keyword relevancy?",
      "Why should you not target every high-volume keyword?",
      "What are high-intent keywords?",
      "What are mid-intent keywords?",
      "What are low-intent keywords?",
      "How do you classify branded keywords?",
      "How do you classify competitor keywords?",
      "How do you identify long-tail keywords?",
      "Why are long-tail keywords useful?",
      "What does it mean to harvest a keyword?",
      "When would you promote a keyword to exact match?",
      "When would you add a keyword as negative?",
      "What would you do if keyword research produces irrelevant terms?",
      "What is keyword seasonality?",
      "How would you prioritize 100 keywords for launch?",
      "Why should keyword research be refreshed over time?",
      "What is the difference between estimated search volume and actual impressions?",
      "How would you explain keyword opportunity to a client?",
    ].map((q, i) => ({
      role: 'PPC VA',
      difficulty: i < 10 ? 'intermediate' : 'advanced',
      type: 'technical',
      skillArea: 'keyword_research',
      question: q,
      answerFormat: 'bullet',
      whyEmployersAsk: 'Tests ability to research and classify keywords for effective PPC targeting',
      strongAnswerPoints: JSON.stringify(['Demonstrates tool familiarity', 'Understands intent classification', 'Explains keyword lifecycle from research to optimization']),
      weakAnswerWarnings: JSON.stringify(['Cannot name specific tools', 'Confuses keywords with search terms', 'No mention of intent or relevancy']),
      status: 'published',
    })),

    // 5.6 Data and Reporting
    ...[
      "What reports would you review for Amazon PPC performance?",
      "What columns are important in a Sponsored Products search term report?",
      "What columns are important in a Sponsored Brands search term report?",
      "What is the difference between 7-day and 14-day attribution?",
      "Why is ACoS sometimes blank or unavailable?",
      "How do you identify wasted spend?",
      "How do you identify profitable keywords?",
      "How do you summarize PPC performance for a client?",
      "What metrics would you include in a weekly report?",
      "What is the difference between campaign-level and keyword-level analysis?",
      "What does high CTR but low CVR suggest?",
      "What does low CTR but good CVR suggest?",
      "What does high CPC suggest?",
      "What does high spend and zero sales suggest?",
      "How would you analyze spend vs sales?",
      "What is a changelog?",
      "Why should every optimization action be documented?",
      "How would you report a failed test?",
      "What is a KPI sheet?",
      "How would you explain ACoS to a non-technical client?",
    ].map((q, i) => ({
      role: 'Reporting VA',
      difficulty: 'intermediate',
      type: 'technical',
      skillArea: 'reporting',
      question: q,
      answerFormat: 'bullet',
      whyEmployersAsk: 'Tests ability to interpret and communicate PPC data',
      strongAnswerPoints: JSON.stringify(['Correctly identifies relevant metrics', 'Explains implications of data patterns', 'Suggests appropriate actions']),
      weakAnswerWarnings: JSON.stringify(['Lists metrics without interpretation', 'Misses key data patterns', 'No actionable recommendations']),
      status: 'published',
    })),

    // 5.7 Optimization and Decision-Making
    ...[
      "A keyword has 20 clicks and 1 sale. What might you do next?",
      "A keyword has 15 clicks and no sales. What might you investigate?",
      "A campaign has high ACoS. What are your first checks?",
      "A campaign has no impressions. What could be wrong?",
      "A campaign has impressions but no clicks. What could be wrong?",
      "A campaign has clicks but no conversions. What could be wrong?",
      "When would you reduce bids?",
      "When would you increase bids?",
      "Why should bid changes usually be gradual?",
      "What is a CPC ceiling?",
      "How do price, target ACoS, and CVR affect max CPC?",
      "What is budget pacing?",
      "What would you do if a profitable campaign runs out of budget by noon?",
      "What would you do if inventory is low?",
      "What is a placement multiplier?",
      "When would you test Top of Search placement?",
      "When would you pause a keyword?",
      "What is the difference between pausing and negating?",
      "What would you do if a rank push increases TACoS too much?",
      "Why should rank push campaigns be timeboxed?",
    ].map((q, i) => ({
      role: 'PPC VA',
      difficulty: 'advanced',
      type: 'scenario',
      skillArea: 'optimization',
      question: q,
      answerFormat: 'case_response',
      whyEmployersAsk: 'Tests practical decision-making ability under realistic campaign conditions',
      strongAnswerPoints: JSON.stringify(['Considers multiple data points', 'Proposes gradual changes', 'Documents reasoning']),
      weakAnswerWarnings: JSON.stringify(['Rushes to extreme actions', 'Ignores data volume considerations', 'No mention of documentation']),
      status: 'published',
    })),

    // 5.8 Client Communication
    ...[
      "How would you explain poor PPC performance to a client?",
      "How would you report that a campaign is spending but not converting?",
      "How would you ask for access to Seller Central or Ads Console?",
      "How would you communicate that a listing is not ready for ad scaling?",
      "How would you tell a client that inventory is too low to keep scaling ads?",
      "How would you summarize weekly PPC performance in 5 bullet points?",
      "How would you explain why branded defense campaigns matter?",
      "How would you explain why not every keyword should be scaled?",
      "How would you communicate a mistake you made?",
      "How would you explain a bid decrease without sounding negative?",
      "How do you handle a client who wants instant results?",
      "How do you handle a client who asks you to increase spend even though ACoS is poor?",
      "How do you explain the difference between testing and scaling?",
      "How do you report an inconclusive test?",
      "How do you write a professional end-of-day update?",
    ].map((q, i) => ({
      role: 'PPC VA',
      difficulty: 'intermediate',
      type: 'behavioral',
      skillArea: 'client_communication',
      question: q,
      answerFormat: 'STAR',
      whyEmployersAsk: 'Tests professional communication skills critical for remote VA roles',
      strongAnswerPoints: JSON.stringify(['Professional tone', 'Data-backed explanation', 'Proposes next steps']),
      weakAnswerWarnings: JSON.stringify(['Defensive or vague language', 'No data to support claims', 'Misses opportunity to rebuild trust']),
      status: 'published',
    })),

    // 5.9 Tool-Specific
    ...[
      "Have you used Amazon Ads Console? What did you do inside it?",
      "Have you used Seller Central? Which areas are you familiar with?",
      "What is Helium 10 used for?",
      "What is Cerebro used for?",
      "What is Magnet used for?",
      "What is Data Dive used for?",
      "What is Adbrew used for?",
      "What is Xnurta used for?",
      "What is MerchantSpring used for?",
      "What is ClickUp used for in an Amazon agency workflow?",
      "How would you organize tasks in ClickUp?",
      "How would you maintain an optimization changelog?",
      "What Excel or Google Sheets functions are useful for PPC reporting?",
      "How comfortable are you with pivot tables?",
      "How would you clean a search term report?",
    ].map((q, i) => ({
      role: 'General',
      difficulty: 'intermediate',
      type: 'tool_specific',
      skillArea: 'PPC',
      question: q,
      answerFormat: 'bullet',
      whyEmployersAsk: 'Tests hands-on familiarity with the Amazon VA tool ecosystem',
      strongAnswerPoints: JSON.stringify(['Names specific features or use cases', 'Demonstrates practical experience', 'Notes limitations or alternatives']),
      weakAnswerWarnings: JSON.stringify(['Generic tool descriptions', 'Cannot name specific features', 'Claims expertise without detail']),
      status: 'published',
    })),

    // 5.10 Behavioral
    ...[
      "Tell me about a time you had to learn something quickly.",
      "Tell me about a time you caught an error before it became serious.",
      "Tell me about a time you received critical feedback.",
      "Tell me about a time you worked with incomplete information.",
      "Tell me about a time you improved a process.",
      "Tell me about a time you had to follow a detailed checklist.",
      "Tell me about a time you worked independently.",
      "Tell me about a time you handled multiple deadlines.",
      "Tell me about a time you communicated bad news professionally.",
      "Tell me about a time you used data to make a decision.",
      "Tell me about a time you made a mistake and fixed it.",
      "Tell me about a time you supported a client or manager.",
      "Tell me about a time you had to be very detail-oriented.",
      "Tell me about a time you had to ask clarifying questions.",
      "Tell me about a time you solved a problem without being told exactly what to do.",
    ].map((q, i) => ({
      role: 'General',
      difficulty: 'beginner',
      type: 'behavioral',
      skillArea: 'client_communication',
      question: q,
      answerFormat: 'STAR',
      whyEmployersAsk: 'Tests soft skills and professional maturity using structured STAR responses',
      strongAnswerPoints: JSON.stringify(['Clear STAR structure', 'Specific example with outcome', 'Shows growth or learning']),
      weakAnswerWarnings: JSON.stringify(['Vague hypothetical', 'No concrete example', 'Blames others']),
      status: 'published',
    })),

    // 5.11 Scenario Questions
    ...[
      "A client asks why sales are down even though ad spend increased. What do you check?",
      "An exact match campaign has high CTR but no sales. What could be happening?",
      "An auto campaign discovers a profitable search term. What should happen next?",
      "A broad campaign is spending on irrelevant terms. What do you do?",
      "A product has only 10 reviews and a 3.5-star rating. Should you scale PPC? Why or why not?",
      "Inventory is below 15 days of cover. What should happen to ad budgets?",
      "A campaign has no impressions after launch. What do you check?",
      "A keyword has strong ROAS but low impressions. What do you recommend?",
      "A competitor is targeting your product detail page. What defensive campaigns might help?",
      "A client wants to launch Sponsored Display immediately for a new product. What would you consider first?",
      "A rank push is not improving organic rank after two weeks. What do you review?",
      "A VA accidentally adds a good keyword as a negative. What should they do?",
      "An Amazon report export has missing ACoS values. How do you interpret that?",
      "A campaign is profitable but going out of budget early. What options do you have?",
      "A listing has no video, weak images, and low conversion rate. What do you recommend before scaling?",
    ].map((q, i) => ({
      role: 'PPC VA',
      difficulty: 'advanced',
      type: 'scenario',
      skillArea: 'PPC',
      question: q,
      answerFormat: 'case_response',
      whyEmployersAsk: 'Tests ability to apply Amazon knowledge under realistic pressure scenarios',
      strongAnswerPoints: JSON.stringify(['Identifies root cause', 'Proposes prioritized actions', 'Considers risk and data sufficiency']),
      weakAnswerWarnings: JSON.stringify(['Jumps to conclusions without data', 'Ignores context', 'Recommends risky actions without caveats']),
      status: 'published',
    })),

    // 5.12 Trick/Red-Flag Questions
    ...[
      "Have you personally managed large Amazon PPC budgets?",
      "Can you guarantee lower ACoS in 30 days?",
      "Would you ever change bids without documenting it?",
      "Is high search volume always good?",
      "Should you always pause keywords with no sales?",
      "Should you always increase budget when sales increase?",
      "Is low ACoS always better?",
      "Can you copy competitor listings?",
      "Should you use competitor brand names in every campaign?",
      "Can you promise first-page organic ranking?",
      "Is PPC the only reason a product does not sell?",
      "Should you scale ads if inventory is low?",
    ].map((q, i) => ({
      role: 'General',
      difficulty: 'advanced',
      type: 'trick',
      skillArea: 'PPC',
      question: q,
      whyEmployersAsk: 'Tests honesty and judgment - candidates should mention context, data volume, listing quality, inventory, profitability, and SOP approval',
      strongAnswerPoints: JSON.stringify(['Acknowledges nuance and context', 'Provides balanced answer with caveats', 'References data or SOPs']),
      weakAnswerWarnings: JSON.stringify(['Simple yes/no answers', 'Overconfident claims', 'Ignoring context and data']),
      answerFormat: 'bullet',
      status: 'published',
    })),

    // ===== NEW: Account VA Questions =====
    ...[
      {
        question: "How do you manage Seller Central catalog updates without causing listing errors?",
        type: 'technical' as const,
        whyEmployersAsk: 'Tests attention to detail in catalog management, which directly impacts listing health and sales',
      },
      {
        question: "A client's late shipment rate has exceeded 4%. What steps do you take to investigate and resolve this?",
        type: 'scenario' as const,
        whyEmployersAsk: 'Tests ability to diagnose and respond to account health metric deterioration',
      },
      {
        question: "How do you open and follow up on Seller Central support cases effectively?",
        type: 'technical' as const,
        whyEmployersAsk: 'Tests case management skills critical for resolving account issues in a timely manner',
      },
      {
        question: "What is your process for creating and managing FBA shipment plans?",
        type: 'technical' as const,
        whyEmployersAsk: 'Tests FBA operational knowledge essential for inventory management',
      },
      {
        question: "How do you set up and manage Brand Registry for a seller account?",
        type: 'technical' as const,
        whyEmployersAsk: 'Tests knowledge of brand protection features that unlock key advertising and content tools',
      },
      {
        question: "The account health dashboard shows the order defect rate approaching 1%. What do you do?",
        type: 'scenario' as const,
        whyEmployersAsk: 'Tests urgency and diagnostic skills when critical account metrics are at risk of suspension threshold',
      },
      {
        question: "How do you resolve a listing that has been suppressed by Amazon?",
        type: 'scenario' as const,
        whyEmployersAsk: 'Tests practical knowledge of suppression causes and the resolution workflow',
      },
      {
        question: "What steps do you take to ensure listing compliance with Amazon's policies?",
        type: 'behavioral' as const,
        whyEmployersAsk: 'Tests awareness of Amazon policy and the discipline to follow compliance procedures',
      },
      {
        question: "How do you file and track FBA reimbursement claims for lost or damaged inventory?",
        type: 'technical' as const,
        whyEmployersAsk: 'Tests knowledge of the reimbursement process that directly recovers lost revenue',
      },
      {
        question: "You notice an account alert about a restricted product. How do you handle it?",
        type: 'scenario' as const,
        whyEmployersAsk: 'Tests response protocol for compliance issues that can lead to account suspension',
      },
      {
        question: "How do you manage parent-child variation relationships and what are common mistakes to avoid?",
        type: 'technical' as const,
        whyEmployersAsk: 'Tests understanding of variation architecture, which affects listing structure and advertising',
      },
      {
        question: "How do you set up pricing rules and automate pricing adjustments in Seller Central?",
        type: 'technical' as const,
        whyEmployersAsk: 'Tests knowledge of pricing tools that protect profitability and Buy Box eligibility',
      },
      {
        question: "What is your process for configuring shipping templates for FBM orders?",
        type: 'technical' as const,
        whyEmployersAsk: 'Tests FBM logistics knowledge that impacts delivery promises and seller metrics',
      },
      {
        question: "How do you handle customer returns and what metrics should you monitor?",
        type: 'behavioral' as const,
        whyEmployersAsk: 'Tests understanding of returns management and its impact on account health',
      },
      {
        question: "Describe your daily routine for monitoring an Amazon seller account's health and performance.",
        type: 'behavioral' as const,
        whyEmployersAsk: 'Tests whether the candidate has a structured approach to daily account management',
      },
    ].map((q) => ({
      role: 'Account VA',
      difficulty: 'intermediate',
      type: q.type,
      skillArea: 'Seller Central',
      question: q.question,
      answerFormat: q.type === 'behavioral' ? 'STAR' : q.type === 'scenario' ? 'case_response' : 'bullet',
      whyEmployersAsk: q.whyEmployersAsk,
      strongAnswerPoints: JSON.stringify(['References specific Seller Central features or pages', 'Demonstrates systematic approach', 'Mentions documentation or escalation steps']),
      weakAnswerWarnings: JSON.stringify(['Vague about Seller Central navigation', 'No mention of specific metrics or thresholds', 'Lacks urgency for account health issues']),
      status: 'published',
    })),

    // ===== NEW: Listing VA Questions =====
    ...[
      {
        question: "How do you optimize a product title for both search visibility and click-through rate?",
        type: 'technical' as const,
        difficulty: 'beginner' as const,
        whyEmployersAsk: 'Tests understanding of title optimization which is the most impactful listing element',
      },
      {
        question: "What makes effective bullet points and how many should a listing have?",
        type: 'technical' as const,
        difficulty: 'beginner' as const,
        whyEmployersAsk: 'Tests knowledge of bullet point best practices that drive conversion',
      },
      {
        question: "How do you create A+ Content that improves conversion rate?",
        type: 'technical' as const,
        difficulty: 'intermediate' as const,
        whyEmployersAsk: 'Tests ability to leverage brand-registered content features for higher CVR',
      },
      {
        question: "How do you research and implement backend keywords for maximum indexing?",
        type: 'technical' as const,
        difficulty: 'beginner' as const,
        whyEmployersAsk: 'Tests understanding of backend keywords which affect discoverability without being visible to shoppers',
      },
      {
        question: "What is the difference between indexing and ranking on Amazon?",
        type: 'technical' as const,
        difficulty: 'intermediate' as const,
        whyEmployersAsk: 'Tests foundational SEO knowledge critical for listing optimization strategy',
      },
      {
        question: "How do you determine keyword placement across title, bullets, and backend fields?",
        type: 'technical' as const,
        difficulty: 'intermediate' as const,
        whyEmployersAsk: 'Tests strategic keyword distribution knowledge that maximizes relevance signals',
      },
      {
        question: "What are Amazon's image requirements and what makes a listing image effective?",
        type: 'technical' as const,
        difficulty: 'beginner' as const,
        whyEmployersAsk: 'Tests knowledge of visual content requirements that affect both compliance and conversion',
      },
      {
        question: "How do you ensure a listing complies with Amazon's content policies?",
        type: 'technical' as const,
        difficulty: 'beginner' as const,
        whyEmployersAsk: 'Tests awareness of policy compliance to prevent suppression and account issues',
      },
      {
        question: "How do you create and manage parent-child variations correctly?",
        type: 'scenario' as const,
        difficulty: 'intermediate' as const,
        whyEmployersAsk: 'Tests variation management skills that affect listing structure and advertising options',
      },
      {
        question: "How would you set up a Brand Store and what content should it include?",
        type: 'technical' as const,
        difficulty: 'intermediate' as const,
        whyEmployersAsk: 'Tests knowledge of Brand Store features that support branded advertising campaigns',
      },
      {
        question: "How do you monitor and respond to customer reviews on a listing?",
        type: 'scenario' as const,
        difficulty: 'beginner' as const,
        whyEmployersAsk: 'Tests review management awareness, which affects listing reputation and conversion',
      },
      {
        question: "A listing has been suppressed. How do you diagnose and fix the issue?",
        type: 'scenario' as const,
        difficulty: 'intermediate' as const,
        whyEmployersAsk: 'Tests troubleshooting skills for suppression issues that block sales',
      },
      {
        question: "How do you localize listing content for different Amazon marketplaces?",
        type: 'technical' as const,
        difficulty: 'intermediate' as const,
        whyEmployersAsk: 'Tests awareness of international selling requirements and localization best practices',
      },
      {
        question: "How do you apply SEO principles to improve a listing's organic search ranking?",
        type: 'technical' as const,
        difficulty: 'intermediate' as const,
        whyEmployersAsk: 'Tests understanding of Amazon A9 algorithm factors that drive organic visibility',
      },
      {
        question: "A listing has a high traffic but low conversion rate. What do you investigate and optimize?",
        type: 'scenario' as const,
        difficulty: 'intermediate' as const,
        whyEmployersAsk: 'Tests diagnostic ability to identify conversion bottlenecks in listing content',
      },
    ].map((q) => ({
      role: 'Listing VA',
      difficulty: q.difficulty,
      type: q.type,
      skillArea: 'marketplace_basics',
      question: q.question,
      answerFormat: q.type === 'scenario' ? 'case_response' : 'bullet',
      whyEmployersAsk: q.whyEmployersAsk,
      strongAnswerPoints: JSON.stringify(['References specific listing elements and best practices', 'Mentions keyword strategy and indexing', 'Connects listing quality to conversion and PPC performance']),
      weakAnswerWarnings: JSON.stringify(['Generic advice without Amazon specifics', 'No mention of keywords or indexing', 'Ignores compliance requirements']),
      status: 'published',
    })),

    // ===== NEW: Agency VA Questions =====
    ...[
      {
        question: "How do you ensure you follow SOPs consistently even when tasks become repetitive?",
        type: 'behavioral' as const,
        whyEmployersAsk: 'Tests discipline and reliability in following standardized processes, which is the foundation of agency work',
      },
      {
        question: "How do you manage your tasks in ClickUp when handling multiple client accounts?",
        type: 'scenario' as const,
        whyEmployersAsk: 'Tests task management skills in a multi-client agency environment',
      },
      {
        question: "How do you write a professional daily update for a client or team lead?",
        type: 'behavioral' as const,
        whyEmployersAsk: 'Tests communication discipline and the ability to summarize work concisely',
      },
      {
        question: "What should be included in a changelog entry after making account optimizations?",
        type: 'scenario' as const,
        whyEmployersAsk: 'Tests documentation habits that are critical for team coordination and accountability',
      },
      {
        question: "How do you manage context switching between multiple seller accounts without making errors?",
        type: 'behavioral' as const,
        whyEmployersAsk: 'Tests ability to maintain quality and accuracy while handling multiple clients',
      },
      {
        question: "How do you handle a situation where a client is unresponsive to questions you need answered?",
        type: 'scenario' as const,
        whyEmployersAsk: 'Tests professional follow-up skills and escalation judgment',
      },
      {
        question: "What is your process for QA checking your own work before marking a task complete?",
        type: 'behavioral' as const,
        whyEmployersAsk: 'Tests self-quality assurance habits that prevent errors from reaching clients',
      },
      {
        question: "How do you prepare a handoff document when transitioning a client account to another VA?",
        type: 'scenario' as const,
        whyEmployersAsk: 'Tests documentation and knowledge transfer skills essential for team continuity',
      },
      {
        question: "When would you escalate an issue to your manager instead of handling it yourself?",
        type: 'scenario' as const,
        whyEmployersAsk: 'Tests judgment about when to escalate versus when to act independently',
      },
      {
        question: "How do you maintain quality standards when working under tight deadlines across multiple accounts?",
        type: 'behavioral' as const,
        whyEmployersAsk: 'Tests ability to balance speed with accuracy in a high-pressure agency environment',
      },
      {
        question: "How do you coordinate with other team members working on the same client account?",
        type: 'behavioral' as const,
        whyEmployersAsk: 'Tests collaboration skills needed when multiple VAs share account responsibilities',
      },
      {
        question: "Describe your understanding of a typical agency workflow from client onboarding to daily operations.",
        type: 'scenario' as const,
        whyEmployersAsk: 'Tests understanding of the full agency lifecycle and where the VA role fits in',
      },
    ].map((q) => ({
      role: 'Agency VA',
      difficulty: 'intermediate',
      type: q.type,
      skillArea: 'client_communication',
      question: q.question,
      answerFormat: q.type === 'behavioral' ? 'STAR' : 'case_response',
      whyEmployersAsk: q.whyEmployersAsk,
      strongAnswerPoints: JSON.stringify(['References specific agency tools or workflows', 'Demonstrates structured process', 'Shows awareness of team coordination needs']),
      weakAnswerWarnings: JSON.stringify(['Vague about agency operations', 'No mention of documentation or SOPs', 'Lacks awareness of multi-account challenges']),
      status: 'published',
    })),
  ];

  // Add sample answers for key questions
  const sampleAnswers: Record<string, { answer: string; points: string[]; warnings: string[] }> = {
    'What is ACoS?': {
      answer: 'ACoS means Advertising Cost of Sales. It shows how much ad spend was used to generate ad-attributed sales. The formula is ad spend divided by ad-attributed sales. For example, if we spend $20 and generate $100 in ad sales, ACoS is 20%. Lower ACoS is usually better, but the right target depends on the product margin, launch stage, and growth goal.',
      points: ['Correct formula: ad spend / ad sales', 'Provides example', 'Notes that target depends on context'],
      warnings: ['Confusing ACoS with ROAS', 'Saying lower is always better without context'],
    },
    'What is ROAS?': {
      answer: 'ROAS stands for Return on Ad Spend. It is the inverse of ACoS — ad-attributed sales divided by ad spend. If you spend $20 and generate $100 in sales, ROAS is 5x or 500%. A higher ROAS means more efficient ad spending, but like ACoS, the right target depends on margins and goals.',
      points: ['Correct formula: ad sales / ad spend', 'Relationship to ACoS', 'Notes context dependency'],
      warnings: ['Confusing with ACoS', 'Saying higher is always better'],
    },
    'What is Amazon PPC?': {
      answer: 'Amazon PPC (Pay-Per-Click) is Amazon\'s advertising platform where sellers pay when shoppers click their ads. The three main ad types are Sponsored Products, Sponsored Brands, and Sponsored Display. Sponsored Products promote individual listings and are the most common starting point. PPC helps products gain visibility, especially for new listings without organic ranking.',
      points: ['Names all three ad types', 'Explains pay-per-click model', 'Notes purpose for visibility and new listings'],
      warnings: ['Confusing PPC with organic ranking', 'Cannot name ad types', 'Vague about how it works'],
    },
    'What is a search term report?': {
      answer: 'A search term report shows the actual queries shoppers typed before clicking your ad. It reveals which keywords trigger your ads, how much you spend per term, and whether those clicks lead to sales. This report is essential for keyword harvesting — promoting high-performing search terms to exact match and negating irrelevant ones.',
      points: ['Defines what the report shows', 'Mentions key columns like clicks, spend, sales', 'Connects to keyword harvesting workflow'],
      warnings: ['Confuses search terms with keywords', 'Does not mention harvesting', 'Cannot explain practical use'],
    },
    'How would you explain poor PPC performance to a client?': {
      answer: 'I would start with empathy and context, then present data clearly. First, I would acknowledge the concern and share the timeline. Then I would walk through the key metrics — spend, ACoS, CVR — and compare to the previous period. I would highlight any external factors like increased competition or low inventory. Finally, I would present specific actions I am taking and what data I need to see improvement.',
      points: ['Leads with empathy', 'Presents data with context', 'Proposes concrete next steps'],
      warnings: ['Defensive tone', 'No data to support explanation', 'Fails to propose actions'],
    },
    'What is the difference between Seller Central and Vendor Central?': {
      answer: 'Seller Central is for third-party sellers who sell directly to customers and control their own pricing, listings, and advertising. Vendor Central is for first-party vendors who sell inventory to Amazon at wholesale, and Amazon resells to customers. As a VA, you will mostly work with Seller Central. The key difference is control — Seller Central gives more control over pricing and advertising strategy.',
      points: ['Accurately distinguishes 3P vs 1P models', 'Notes VA typically works with Seller Central', 'Highlights control differences'],
      warnings: ['Confuses the two platforms', 'Cannot explain the business model difference', 'Omits that VAs mainly use Seller Central'],
    },
    'Tell me about yourself and why you want to work as an Amazon VA.': {
      answer: 'I am a detail-oriented professional who enjoys data-driven work and remote collaboration. I became interested in Amazon VA work because it combines analytical thinking with operational discipline. I have been studying Amazon Seller Central, PPC fundamentals, and keyword research through online courses and practice exercises. I am specifically drawn to this role because I enjoy following structured processes and delivering measurable results.',
      points: ['Mentions Amazon-specific skills', 'Shows understanding of VA responsibilities', 'Demonstrates remote work readiness'],
      warnings: ['Generic answer without Amazon context', 'No mention of specific tools or processes', 'Overly vague about skills'],
    },
    'What would you do if you made a mistake in a client account?': {
      answer: 'I would immediately document the mistake and assess its impact. Then I would follow the agency\'s escalation protocol — inform my manager or the client lead with a clear summary of what happened, what the impact is, and what corrective actions I recommend. I would never try to hide a mistake. After the issue is resolved, I would document it in the changelog and suggest a process improvement to prevent recurrence.',
      points: ['Documents immediately', 'Follows escalation protocol', 'Proposes prevention measures'],
      warnings: ['Would hide or delay reporting', 'No mention of documentation', 'Lacks accountability'],
    },
    'Why should a listing be ready before scaling ads?': {
      answer: 'Running ads to a poor listing wastes money because clicks do not convert. A listing needs strong images, complete bullet points, A+ content, and at least 15 reviews with a 4+ star rating to convert well. Without these, high CTR from ads will lead to low CVR, which raises ACoS and signals to Amazon\'s algorithm that the product is not relevant. Fixing the listing first is more cost-effective than trying to compensate with higher ad spend.',
      points: ['Connects listing quality to conversion', 'Lists specific listing elements needed', 'Explains algorithmic impact'],
      warnings: ['Does not connect listing to CVR', 'Vague about what makes a listing ready', 'Thinks ads can fix a bad listing'],
    },
    'How do you prioritize tasks when everything feels urgent?': {
      answer: 'I use a priority matrix: urgent and important first, important but not urgent second, urgent but not important third. For Amazon VA work, I prioritize client-facing tasks like daily updates and campaign changes that affect live spend. Then I handle reporting and analysis. Administrative tasks like organizing files come last. I also communicate with my manager if multiple tasks conflict, so they can help me prioritize based on business impact.',
      points: ['Uses a structured prioritization method', 'Prioritizes client-facing and live-spend tasks', 'Communicates conflicts proactively'],
      warnings: ['No structured approach', 'Works on whatever feels easiest', 'Does not communicate conflicts'],
    },
  };

  for (const qData of questionsData) {
    const sample = sampleAnswers[qData.question];
    await prisma.question.create({
      data: {
        ...qData,
        sampleAnswer: sample?.answer,
        strongAnswerPoints: sample?.points ? JSON.stringify(sample.points) : qData.strongAnswerPoints,
        weakAnswerWarnings: sample?.warnings ? JSON.stringify(sample.warnings) : qData.weakAnswerWarnings,
      },
    });
  }
  console.log(`Created ${questionsData.length} questions`);

  // ===== SEED ASSESSMENTS =====
  const assessmentsData = [
    {
      title: 'Search Term Report Review',
      role: 'PPC VA',
      difficulty: 'intermediate',
      description: 'Review a search term report and identify keywords to promote, pause, negate, or monitor based on performance data.',
      datasetInfo: JSON.stringify({
        columns: ['Search Term', 'Clicks', 'Impressions', 'CPC', 'Spend', 'Sales', 'Orders', 'ACoS', 'ROAS', 'CVR'],
        rows: [
          { term: 'wireless earbuds', clicks: 150, impressions: 5000, cpc: 0.85, spend: 127.5, sales: 450, orders: 9, acos: 28.3, roas: 3.53, cvr: 6.0 },
          { term: 'bluetooth headphones', clicks: 80, impressions: 3000, cpc: 0.92, spend: 73.6, sales: 0, orders: 0, acos: null, roas: 0, cvr: 0 },
          { term: 'earbuds for running', clicks: 25, impressions: 800, cpc: 0.65, spend: 16.25, sales: 95, orders: 2, acos: 17.1, roas: 5.85, cvr: 8.0 },
          { term: 'cheap earbuds', clicks: 200, impressions: 8000, cpc: 0.45, spend: 90, sales: 120, orders: 3, acos: 75, roas: 1.33, cvr: 1.5 },
          { term: 'noise cancelling earbuds', clicks: 45, impressions: 1500, cpc: 1.20, spend: 54, sales: 320, orders: 6, acos: 16.9, roas: 5.93, cvr: 13.3 },
        ],
      }),
      answerKey: JSON.stringify({
        promote: ['noise cancelling earbuds (strong CVR, good ACoS)', 'earbuds for running (good ROAS, strong CVR)'],
        negate: ['cheap earbuds (high ACoS 75%, low CVR, irrelevant intent)'],
        pause: ['bluetooth headphones (80 clicks, 0 sales - needs investigation)'],
        monitor: ['wireless earbuds (moderate performance, needs more data)'],
      }),
      rubric: JSON.stringify({
        correctMetricInterpretation: 25,
        correctActionRecommendation: 25,
        dataSufficiencyJudgment: 15,
        riskAwareness: 15,
        clearExplanation: 10,
        documentationQuality: 10,
      }),
    },
    {
      title: 'Campaign Naming Exercise',
      role: 'PPC VA',
      difficulty: 'beginner',
      description: 'Build compliant campaign names using the naming convention: [BRAND]_[COUNTRY]_[STAGE]_[TYPE]_[MATCH]_[THEME]_[YYYYMM]',
      datasetInfo: JSON.stringify({
        scenarios: [
          { brand: 'TechPro', country: 'US', stage: 'LAUNCH', type: 'SP', match: 'AUTO', theme: 'DISCOVERY', date: '202501' },
          { brand: 'TechPro', country: 'US', stage: 'OPTIMIZE', type: 'SP', match: 'EXACT', theme: 'BRANDED', date: '202501' },
          { brand: 'TechPro', country: 'US', stage: 'SCALE', type: 'SP', match: 'BROAD', theme: 'COMPETITOR', date: '202502' },
          { brand: 'TechPro', country: 'US', stage: 'MAINTAIN', type: 'SB', match: 'EXACT', theme: 'BRANDED', date: '202503' },
        ],
      }),
      answerKey: JSON.stringify({
        correctNames: [
          'TECHPRO_US_LAUNCH_SP_AUTO_DISCOVERY_202501',
          'TECHPRO_US_OPTIMIZE_SP_EXACT_BRANDED_202501',
          'TECHPRO_US_SCALE_SP_BROAD_COMPETITOR_202502',
          'TECHPRO_US_MAINTAIN_SB_EXACT_BRANDED_202503',
        ],
      }),
      rubric: JSON.stringify({ correctNamingConvention: 40, consistency: 30, clarity: 30 }),
    },
    {
      title: 'ACoS/ROAS Calculation',
      role: 'PPC VA',
      difficulty: 'beginner',
      description: 'Calculate ACoS and ROAS from given spend and sales data.',
      datasetInfo: JSON.stringify({
        problems: [
          { spend: 50, sales: 200, question: 'Calculate ACoS and ROAS' },
          { spend: 150, sales: 300, question: 'Calculate ACoS and ROAS' },
          { spend: 80, sales: 800, question: 'Calculate ACoS and ROAS' },
          { spend: 200, sales: 500, question: 'Calculate ACoS and ROAS. Is this ACoS acceptable for a product with 30% profit margin?' },
        ],
      }),
      answerKey: JSON.stringify({
        answers: [
          { acos: '25%', roas: '4x' },
          { acos: '50%', roas: '2x' },
          { acos: '10%', roas: '10x' },
          { acos: '40%', roas: '2.5x', marginNote: '40% ACoS exceeds the 30% profit margin, so this campaign is unprofitable at current performance' },
        ],
      }),
      rubric: JSON.stringify({ correctCalculations: 50, interpretation: 30, contextAwareness: 20 }),
    },
    {
      title: 'CPC Ceiling Exercise',
      role: 'PPC VA',
      difficulty: 'advanced',
      description: 'Calculate maximum CPC from price, target ACoS, and CVR using the formula: Max CPC = Price × Target ACoS × CVR',
      datasetInfo: JSON.stringify({
        problems: [
          { price: 29.99, targetAcos: 25, cvr: 10, question: 'Calculate max CPC' },
          { price: 49.99, targetAcos: 20, cvr: 8, question: 'Calculate max CPC' },
          { price: 19.99, targetAcos: 30, cvr: 15, question: 'Calculate max CPC' },
          { price: 99.99, targetAcos: 15, cvr: 5, question: 'Calculate max CPC. If current CPC is $0.90, what should you do?' },
        ],
      }),
      answerKey: JSON.stringify({
        answers: [
          { maxCpc: '$0.75', calculation: '29.99 × 0.25 × 0.10 = $0.75' },
          { maxCpc: '$0.80', calculation: '49.99 × 0.20 × 0.08 = $0.80' },
          { maxCpc: '$0.90', calculation: '19.99 × 0.30 × 0.15 = $0.90' },
          { maxCpc: '$0.75', calculation: '99.99 × 0.15 × 0.05 = $0.75', action: 'Current CPC of $0.90 exceeds max CPC of $0.75. Reduce bids gradually.' },
        ],
      }),
      rubric: JSON.stringify({ correctCalculations: 40, formulaApplication: 30, actionRecommendation: 30 }),
    },
    {
      title: 'Listing Readiness Audit',
      role: 'Listing VA',
      difficulty: 'intermediate',
      description: 'Score listing readiness based on images, title, bullets, A+ content, reviews, and inventory.',
      datasetInfo: JSON.stringify({
        listing: {
          title: 'Wireless Earbuds Bluetooth 5.3',
          bulletPoints: 3,
          images: 5,
          hasVideo: false,
          hasAPlus: false,
          reviewCount: 8,
          averageRating: 3.8,
          inventoryDays: 45,
          price: 29.99,
          hasCoupon: false,
        },
      }),
      answerKey: JSON.stringify({
        issues: [
          'Title is too short and lacks key features',
          'Only 3 bullet points (should have 5)',
          'No video content',
          'No A+ content',
          'Below 15 reviews threshold',
          'Rating below 4.0',
        ],
        recommendation: 'Do not scale PPC. Fix listing first: improve title, add 2 more bullets, add video, enable A+ content, and work on getting more reviews before increasing ad spend.',
      }),
      rubric: JSON.stringify({ correctIssueIdentification: 30, prioritization: 25, recommendation: 25, completeness: 20 }),
    },
    {
      title: 'PPC Client Update',
      role: 'PPC VA',
      difficulty: 'intermediate',
      description: 'Write a concise weekly performance summary for a client based on campaign data.',
      datasetInfo: JSON.stringify({
        weekData: {
          totalSpend: 1250,
          totalSales: 4200,
          totalOrders: 84,
          overallAcos: 29.8,
          overallRoas: 3.36,
          overallCvr: 8.2,
          topPerformer: 'Exact - Branded keywords (ACoS 12%, ROAS 8.3x)',
          concern: 'Broad competitor campaign has 200 clicks with 0 sales',
          action: 'Added 15 negative keywords to broad campaign; reduced broad bids by 20%',
        },
      }),
      answerKey: JSON.stringify({
        expectedStructure: ['Total spend and sales overview', 'Key metrics (ACoS, ROAS, CVR)', 'Top performer highlight', 'Concern area with action taken', 'Next steps'],
      }),
      rubric: JSON.stringify({ clarity: 25, metricAccuracy: 25, actionTransparency: 25, professionalism: 25 }),
    },
    {
      title: 'Campaign Launch Plan',
      role: 'PPC VA',
      difficulty: 'advanced',
      description: 'Choose which campaign types to launch first for a new product based on phased rollout strategy.',
      datasetInfo: JSON.stringify({
        product: {
          name: 'Premium Yoga Mat',
          isBrandRegistered: true,
          hasReviews: false,
          inventory: 500,
          price: 49.99,
          competitorProducts: 15,
        },
      }),
      answerKey: JSON.stringify({
        phases: [
          'Phase 1: SP Auto Discovery + SP Exact Branded (if brand registered)',
          'Phase 2: SP Product Targeting - Competitor ASINs',
          'Phase 3: SP Broad/Phrase Research + SKAG for proven terms',
          'Phase 4: SB Branded + SD Retargeting',
          'Phase 5: Seasonal and cross-sell campaigns',
        ],
      }),
      rubric: JSON.stringify({ correctSequencing: 30, justification: 25, riskAwareness: 25, completeness: 20 }),
    },
    {
      title: 'Keyword Intent Classification',
      role: 'PPC VA',
      difficulty: 'intermediate',
      description: 'Classify search terms as high, mid, or low purchase intent.',
      datasetInfo: JSON.stringify({
        terms: [
          'yoga mat',
          'best yoga mat for beginners',
          'what is a yoga mat made of',
          'Lululemon yoga mat alternative',
          'thick yoga mat non slip',
          'yoga mat vs exercise mat',
          'buy yoga mat online',
          'yoga mat 6mm price',
        ],
      }),
      answerKey: JSON.stringify({
        highIntent: ['buy yoga mat online', 'thick yoga mat non slip', 'Lululemon yoga mat alternative'],
        midIntent: ['best yoga mat for beginners', 'yoga mat 6mm price'],
        lowIntent: ['yoga mat', 'what is a yoga mat made of', 'yoga mat vs exercise mat'],
      }),
      rubric: JSON.stringify({ correctClassification: 40, reasoning: 30, application: 30 }),
    },
    {
      title: 'Budget Pacing Scenario',
      role: 'PPC VA',
      difficulty: 'advanced',
      description: 'Decide whether to increase, decrease, or throttle budget based on campaign performance and time of month.',
      datasetInfo: JSON.stringify({
        scenarios: [
          { campaign: 'SP Exact Branded', dailyBudget: 50, spendToday: 50, time: 'Day 5 of 30', acos: 15, roas: 6.7, cvr: 12 },
          { campaign: 'SP Broad Competitor', dailyBudget: 100, spendToday: 25, time: 'Day 20 of 30', acos: 55, roas: 1.8, cvr: 3 },
          { campaign: 'SP Auto Discovery', dailyBudget: 30, spendToday: 30, time: 'Day 12 of 30', acos: 35, roas: 2.9, cvr: 7 },
        ],
      }),
      answerKey: JSON.stringify({
        decisions: [
          'Increase budget for SP Exact Branded - highly profitable (15% ACoS), running out early',
          'Decrease budget for SP Broad Competitor - poor performance (55% ACoS), underspending but not converting',
          'Monitor SP Auto Discovery - moderate performance, let it run and collect more data',
        ],
      }),
      rubric: JSON.stringify({ correctDecision: 35, justification: 30, riskAwareness: 20, dataSufficiency: 15 }),
    },
    {
      title: 'Interview Case Presentation',
      role: 'PPC VA',
      difficulty: 'advanced',
      description: 'Explain your optimization decisions out loud as if presenting to a client or PPC lead.',
      datasetInfo: JSON.stringify({
        scenario: 'You reviewed a campaign and found: 1) 3 keywords with high clicks and zero sales, 2) 2 keywords with strong ROAS, 3) Campaign is running out of budget by 2pm daily. Present your recommendations.',
      }),
      answerKey: JSON.stringify({
        expectedPoints: [
          'Acknowledge both positive and negative findings',
          'Recommend specific actions for each category',
          'Explain the reasoning behind each recommendation',
          'Address the budget issue with concrete options',
          'Note what data is still needed or uncertain',
        ],
      }),
      rubric: JSON.stringify({ clarity: 20, technicalAccuracy: 25, actionability: 25, communicationQuality: 30 }),
    },
    // ===== NEW: Account VA Assessment =====
    {
      title: 'Seller Central Account Health Audit',
      role: 'Account VA',
      difficulty: 'intermediate',
      description: 'Review a Seller Central account dashboard and identify issues affecting account health, including late shipment rates, order defect rates, and policy violations.',
      datasetInfo: JSON.stringify({
        accountHealth: {
          lateShipmentRate: 5.2,
          orderDefectRate: 1.8,
          cancellationRate: 3.1,
          validTrackingRate: 92,
          policyViolations: ['Restricted product listing', 'Pricing error on ASIN B08XYZ'],
          inventoryAlerts: ['15 ASINs below 10 units', '3 ASINs with stranded inventory'],
          feedbackRating: '92% positive (last 30 days)',
          openCases: 4,
          aToZClaims: 2,
        },
      }),
      answerKey: JSON.stringify({
        criticalIssues: ['Late shipment rate exceeds 4% threshold', 'Order defect rate approaching 1% limit'],
        actions: ['Investigate shipping delays', 'Review restricted product listing', 'Resolve pricing error immediately', 'Address stranded inventory'],
        monitoring: ['Track order defect rate daily', 'Reduce cancellation rate below 2.5%'],
      }),
      rubric: JSON.stringify({ issueIdentification: 30, prioritization: 25, actionPlanning: 25, communication: 20 }),
    },
    // ===== NEW: Reporting VA Assessment =====
    {
      title: 'Weekly PPC Report Analysis',
      role: 'Reporting VA',
      difficulty: 'intermediate',
      description: 'Analyze a weekly PPC performance report and identify key insights, anomalies, and recommended actions for the client.',
      datasetInfo: JSON.stringify({
        weeklyReport: {
          campaigns: [
            { name: 'SP_Exact_Branded', spend: 320, sales: 2100, acos: 15.2, roas: 6.6, clicks: 380, impressions: 5200, orders: 42, cvr: 11.1 },
            { name: 'SP_Broad_Discovery', spend: 580, sales: 440, acos: 131.8, roas: 0.76, clicks: 890, impressions: 18000, orders: 6, cvr: 0.67 },
            { name: 'SP_Auto_Launch', spend: 220, sales: 880, acos: 25, roas: 4, clicks: 310, impressions: 4200, orders: 14, cvr: 4.5 },
            { name: 'SB_Branded_Video', spend: 150, sales: 950, acos: 15.8, roas: 6.3, clicks: 200, impressions: 3800, orders: 18, cvr: 9 },
          ],
          weekOverWeek: { spendChange: '+12%', salesChange: '-5%', acosChange: '+18%', cvrChange: '-2%' },
        },
      }),
      answerKey: JSON.stringify({
        insights: ['Branded campaigns performing well', 'Broad Discovery campaign has 131% ACoS - critical issue', 'Auto campaign showing promising results for new launch'],
        actions: ['Negate irrelevant terms in Broad Discovery', 'Consider reducing Broad Discovery budget', 'Harvest converting terms from Auto to Exact', 'Increase Branded budget as it is profitable'],
        reportStructure: ['Executive summary', 'Key metrics vs previous week', 'Campaign-by-campaign analysis', 'Action items with deadlines'],
      }),
      rubric: JSON.stringify({ dataInterpretation: 30, insightQuality: 25, actionRecommendation: 25, reportStructure: 20 }),
    },
    // ===== NEW: Agency VA Assessment =====
    {
      title: 'Client Update and Escalation Exercise',
      role: 'Agency VA',
      difficulty: 'intermediate',
      description: 'Draft a professional client update email based on campaign performance data and identify situations that require escalation.',
      datasetInfo: JSON.stringify({
        scenario: {
          client: 'HomeTech Brand',
          weekSummary: 'Overall ACoS increased from 22% to 34% due to a competitor bidding aggressively on branded terms. Two campaigns ran out of budget before noon on 3 days. A new product launch campaign generated 45 clicks but zero sales after 7 days.',
          actionsTaken: ['Added 8 negative keywords to Broad campaign', 'Increased daily budget for Branded Exact by 30%', 'Paused 3 underperforming ad groups in Discovery campaign'],
          pendingQuestions: ['Should we increase bids on competitor targeting?', 'Client has not responded to listing improvement suggestions from last week'],
        },
      }),
      answerKey: JSON.stringify({
        emailStructure: ['Friendly opening', 'Weekly metrics summary', 'Issue explanation with data', 'Actions taken this week', 'Questions requiring client input', 'Next steps'],
        escalationTriggers: ['Competitor aggressively targeting branded terms', 'Client non-responsive on listing improvements', 'New launch campaign with zero conversions after 7 days'],
      }),
      rubric: JSON.stringify({ professionalism: 25, dataAccuracy: 25, escalationJudgment: 25, actionOrientation: 25 }),
    },
    // ===== NEW: Listing VA Assessment =====
    {
      title: 'Product Listing Optimization Audit',
      role: 'Listing VA',
      difficulty: 'intermediate',
      description: 'Evaluate a product listing and recommend specific improvements for title, bullets, A+ content, and backend keywords.',
      datasetInfo: JSON.stringify({
        listing: {
          currentTitle: 'Wireless Earbuds Bluetooth 5.3',
          currentBullets: ['Bluetooth 5.3 technology', 'Long battery life', 'Comfortable fit'],
          backendKeywords: 'earbuds, wireless, bluetooth, headphones',
          images: 4,
          hasVideo: false,
          hasAPlus: false,
          hasBrandStore: false,
          reviewCount: 12,
          averageRating: 4.1,
          topSearchTerms: ['wireless earbuds', 'bluetooth earbuds for running', 'noise cancelling earbuds budget'],
        },
      }),
      answerKey: JSON.stringify({
        titleIssues: ['Too short - missing key features and use cases', 'No brand name prefix', 'Missing material/feature differentiators'],
        bulletIssues: ['Only 3 bullets (should have 5)', 'No specific metrics or use cases', 'Missing keyword integration'],
        keywordGaps: ['Missing long-tail terms from search terms', 'No use-case keywords (running, gym, commuting)', 'Missing competitor and alternative terms'],
        priorityActions: ['Expand title to 150-200 characters with brand and key features', 'Rewrite bullets with keyword-rich, benefit-focused content', 'Add video and A+ content', 'Expand backend keywords with 250 bytes max utilization'],
      }),
      rubric: JSON.stringify({ listingKnowledge: 25, optimizationSuggestions: 30, keywordStrategy: 25, prioritization: 20 }),
    },
  ];

  for (const aData of assessmentsData) {
    await prisma.assessment.create({ data: aData });
  }
  console.log(`Created ${assessmentsData.length} assessments`);

  // ===== SEED DOWNLOADS =====
  const downloadsData = [
    { title: 'Amazon PPC VA Resume Template', fileType: 'DOCX', role: 'PPC VA', description: 'Professional resume template tailored for Amazon PPC VA roles', fileName: 'ppc-va-resume-template.docx', accessTier: 'free', category: 'Resume Templates' },
    { title: 'Amazon Account VA Resume Template', fileType: 'DOCX', role: 'Account VA', description: 'Resume template for Amazon Account VA positions', fileName: 'account-va-resume-template.docx', accessTier: 'free', category: 'Resume Templates' },
    { title: 'Beginner Amazon VA Cover Letter', fileType: 'DOCX', role: 'General', description: 'Cover letter template for entry-level Amazon VA roles', fileName: 'beginner-va-cover-letter.docx', accessTier: 'free', category: 'Cover Letters' },
    { title: 'PPC VA Cover Letter', fileType: 'DOCX', role: 'PPC VA', description: 'Cover letter template for Amazon PPC VA positions', fileName: 'ppc-va-cover-letter.docx', accessTier: 'free', category: 'Cover Letters' },
    { title: 'Upwork Proposal Template', fileType: 'DOCX', role: 'General', description: 'Short proposal template for Upwork Amazon VA jobs', fileName: 'upwork-proposal-template.docx', accessTier: 'free', category: 'Cover Letters' },
    { title: 'Interview Question Cheat Sheet', fileType: 'PDF', role: 'General', description: 'Quick reference of top Amazon VA interview questions and key answer points', fileName: 'interview-cheat-sheet.pdf', accessTier: 'free', category: 'Cheat Sheets' },
    { title: 'Amazon PPC Acronym Glossary', fileType: 'PDF', role: 'PPC VA', description: 'Complete glossary of Amazon PPC terms and acronyms', fileName: 'ppc-acronym-glossary.pdf', accessTier: 'free', category: 'Cheat Sheets' },
    { title: 'ACoS/ROAS/CPC Calculator', fileType: 'XLSX', role: 'PPC VA', description: 'Spreadsheet calculator for ACoS, ROAS, and CPC ceiling calculations', fileName: 'acos-roas-cpc-calculator.xlsx', accessTier: 'free', category: 'Calculators' },
    { title: 'Search Term Report Practice File', fileType: 'XLSX', role: 'PPC VA', description: 'Sample search term report data for practice analysis', fileName: 'search-term-practice.xlsx', accessTier: 'starter', category: 'Calculators' },
    { title: 'Keyword Harvesting Decision Tree', fileType: 'PDF', role: 'PPC VA', description: 'Flowchart for deciding when to promote, pause, or negate keywords', fileName: 'keyword-harvesting-decision-tree.pdf', accessTier: 'starter', category: 'Checklists' },
    { title: 'Negative Keyword Checklist', fileType: 'PDF', role: 'PPC VA', description: 'Step-by-step checklist for negative keyword decisions', fileName: 'negative-keyword-checklist.pdf', accessTier: 'starter', category: 'Checklists' },
    { title: 'Campaign Launch Checklist', fileType: 'PDF', role: 'PPC VA', description: 'Complete checklist for launching new Amazon PPC campaigns', fileName: 'campaign-launch-checklist.pdf', accessTier: 'starter', category: 'Checklists' },
    { title: 'Campaign Naming Worksheet', fileType: 'XLSX', role: 'PPC VA', description: 'Worksheet for building compliant campaign names', fileName: 'campaign-naming-worksheet.xlsx', accessTier: 'starter', category: 'Calculators' },
    { title: 'Listing Readiness Checklist', fileType: 'PDF', role: 'Listing VA', description: 'Checklist for evaluating listing readiness before scaling ads', fileName: 'listing-readiness-checklist.pdf', accessTier: 'free', category: 'Checklists' },
    { title: 'Weekly PPC Report Template', fileType: 'PDF', role: 'PPC VA', description: 'Template for weekly PPC performance reports', fileName: 'weekly-ppc-report-template.pdf', accessTier: 'pro', category: 'Cheat Sheets' },
    { title: 'Client Update Email Templates', fileType: 'DOCX', role: 'PPC VA', description: 'Professional email templates for client updates', fileName: 'client-update-emails.docx', accessTier: 'starter', category: 'Cover Letters' },
    { title: 'SOP-Following Checklist', fileType: 'PDF', role: 'General', description: 'Checklist demonstrating SOP discipline for remote work', fileName: 'sop-checklist.pdf', accessTier: 'free', category: 'Checklists' },
    { title: 'Mock Interview Scorecard', fileType: 'PDF', role: 'General', description: 'Printable scorecard for self-evaluating mock interview performance', fileName: 'mock-interview-scorecard.pdf', accessTier: 'free', category: 'Checklists' },
    { title: '7-Day Interview Prep Plan', fileType: 'PDF', role: 'General', description: 'Structured 7-day plan to prepare for Amazon VA interviews', fileName: '7-day-prep-plan.pdf', accessTier: 'free', category: 'Cheat Sheets' },
    { title: '30-Day Amazon VA Upskilling Roadmap', fileType: 'PDF', role: 'General', description: 'Comprehensive 30-day roadmap for Amazon VA skill development', fileName: '30-day-upskilling-roadmap.pdf', accessTier: 'starter', category: 'Cheat Sheets' },
    { title: 'Practical Test Answer Key', fileType: 'PDF', role: 'PPC VA', description: 'Answer key for practical PPC test exercises', fileName: 'practical-test-answers.pdf', accessTier: 'pro', category: 'Cheat Sheets' },
    { title: 'PPC Case Study Workbook', fileType: 'XLSX', role: 'PPC VA', description: 'Workbook with PPC case studies for practice', fileName: 'ppc-case-study-workbook.xlsx', accessTier: 'pro', category: 'Calculators' },
    { title: 'Amazon Tools Familiarity Checklist', fileType: 'PDF', role: 'General', description: 'Checklist for tracking familiarity with Amazon-related tools', fileName: 'tools-familiarity-checklist.pdf', accessTier: 'free', category: 'Checklists' },
    { title: 'Behavioral Interview STAR Worksheet', fileType: 'PDF', role: 'General', description: 'Worksheet for structuring behavioral answers using the STAR method', fileName: 'star-worksheet.pdf', accessTier: 'free', category: 'Checklists' },
    { title: 'VA Remote Work Setup Checklist', fileType: 'PDF', role: 'General', description: 'Checklist for setting up an effective remote work environment', fileName: 'remote-work-checklist.pdf', accessTier: 'free', category: 'Checklists' },
  ];

  for (const dData of downloadsData) {
    await prisma.download.create({ data: dData });
  }
  console.log(`Created ${downloadsData.length} downloads`);

  // ===== SEED GUIDES =====
  const guidesData = [
    // Beginner guides
    { title: 'What Does an Amazon VA Do?', slug: 'what-does-amazon-va-do', level: 'beginner', role: 'General', content: '# What Does an Amazon VA Do?\n\nAn Amazon Virtual Assistant (VA) is a remote worker who helps Amazon sellers manage their day-to-day operations. This includes tasks like managing product listings, monitoring advertising campaigns, handling customer inquiries, tracking inventory, and preparing reports.\n\n## Key Responsibilities\n\n- **Listing Management**: Creating and optimizing product titles, bullet points, descriptions, and A+ content\n- **PPC Support**: Monitoring ad campaigns, reviewing search term reports, and flagging optimization opportunities\n- **Inventory Monitoring**: Checking stock levels, alerting about low inventory, and coordinating restocking\n- **Reporting**: Preparing weekly performance summaries with key metrics\n- **SOP Execution**: Following standard operating procedures for consistent, reliable work\n\n## Why Amazon VAs Are in Demand\n\nAmazon sellers and agencies need trained assistants who understand the Amazon ecosystem. Generic VA skills are not enough — employers want people who know Seller Central, understand PPC metrics, and can follow Amazon-specific workflows.' },
    { title: 'Amazon Seller Central Basics', slug: 'seller-central-basics', level: 'beginner', role: 'General', content: '# Amazon Seller Central Basics\n\nSeller Central is the web interface that Amazon sellers use to manage their business on Amazon. As an Amazon VA, Seller Central will be your primary workspace.\n\n## Key Areas\n\n- **Catalog**: Manage product listings, variations, and inventory\n- **Advertising**: Access Amazon PPC campaigns and reporting\n- **Orders**: View and manage customer orders\n- **Inventory**: Track stock levels, FBA shipments, and suppression issues\n- **Reports**: Download business and advertising reports\n- **Settings**: Manage account settings, shipping, and returns\n\n## Navigation Tips\n\n1. Use the search bar to quickly find features\n2. Pin frequently used pages\n3. Learn keyboard shortcuts for common tasks\n4. Keep multiple tabs open for cross-referencing data' },
    { title: 'Amazon Ads Console Basics', slug: 'ads-console-basics', level: 'beginner', role: 'PPC VA', content: '# Amazon Ads Console Basics\n\nThe Amazon Ads Console is where you manage advertising campaigns. Understanding this interface is essential for PPC VA roles.\n\n## Key Sections\n\n- **Campaign Manager**: Create, edit, and manage campaigns\n- **Campaign Builder**: Set up new campaigns with targeting and budgets\n- **Reporting**: Download performance reports\n- **Bulk Operations**: Make mass changes using spreadsheets\n\n## Campaign Types\n\n1. **Sponsored Products (SP)**: Promote individual products\n2. **Sponsored Brands (SB)**: Promote your brand and product portfolio\n3. **Sponsored Display (SD)**: Reach audiences on and off Amazon' },
    { title: 'Amazon PPC Terms Explained Simply', slug: 'ppc-terms-explained', level: 'beginner', role: 'PPC VA', content: '# Amazon PPC Terms Explained Simply\n\nUnderstanding Amazon PPC terminology is essential for interview success.\n\n## Core Metrics\n\n- **ACoS** (Advertising Cost of Sales): How much you spend on ads relative to the sales those ads generate. Formula: Ad Spend / Ad Sales\n- **ROAS** (Return on Ad Spend): The return you get for every dollar spent. Formula: Ad Sales / Ad Spend (inverse of ACoS)\n- **CPC** (Cost Per Click): How much you pay each time someone clicks your ad\n- **CTR** (Click-Through Rate): Percentage of people who see your ad and click it. Formula: Clicks / Impressions\n- **CVR** (Conversion Rate): Percentage of clicks that result in a sale. Formula: Orders / Clicks\n- **TACoS** (Total ACoS): Ad spend relative to total sales (not just ad-attributed sales)\n\n## Campaign Types\n\n- **Auto Campaign**: Amazon automatically targets your product to relevant searches\n- **Broad Match**: Your ad shows for searches that include your keyword in any order\n- **Phrase Match**: Your ad shows for searches that include your exact phrase in order\n- **Exact Match**: Your ad shows only for the exact keyword you specify' },
    { title: 'ACoS vs ROAS', slug: 'acos-vs-roas', level: 'beginner', role: 'PPC VA', content: '# ACoS vs ROAS\n\nACoS and ROAS are two sides of the same coin. Understanding both is crucial for Amazon PPC roles.\n\n## ACoS (Advertising Cost of Sales)\n\n- Formula: Ad Spend / Ad Sales × 100\n- Lower ACoS = more efficient advertising\n- Example: Spend $20, Sales $100 → ACoS = 20%\n\n## ROAS (Return on Ad Spend)\n\n- Formula: Ad Sales / Ad Spend\n- Higher ROAS = more efficient advertising\n- Example: Spend $20, Sales $100 → ROAS = 5x (or 500%)\n\n## When to Use Which\n\n- ACoS is more commonly used for target-setting and optimization decisions\n- ROAS is useful for comparing performance across different spend levels\n- Both should be evaluated in context of product margins and business goals' },
    { title: 'What Is a Search Term Report?', slug: 'what-is-search-term-report', level: 'beginner', role: 'PPC VA', content: '# What Is a Search Term Report?\n\nA search term report shows the actual search queries that triggered your ads on Amazon.\n\n## Key Columns\n\n- **Search Term**: The actual query the shopper typed\n- **Keyword**: The keyword you targeted that matched the search term\n- **Match Type**: How your keyword matched the search term\n- **Clicks, Impressions, Spend, Sales, Orders**: Performance data\n- **ACoS, ROAS, CVR**: Calculated metrics\n\n## Why It Matters\n\nSearch term reports are the foundation of Amazon PPC optimization. They tell you:\n1. Which search terms are driving sales\n2. Which terms are wasting budget\n3. New terms to target that you haven\'t bid on yet\n4. Terms you should add as negatives' },
    { title: 'What Is Keyword Harvesting?', slug: 'what-is-keyword-harvesting', level: 'beginner', role: 'PPC VA', content: '# What Is Keyword Harvesting?\n\nKeyword harvesting is the process of discovering profitable search terms from your auto and broad campaigns and moving them to exact match campaigns for better control.\n\n## The Process\n\n1. Run auto/broad campaigns to discover search terms\n2. Review search term reports for high-performing terms\n3. Add profitable terms as exact match keywords\n4. Add those terms as negative keywords in the original research campaign\n\n## When to Promote\n\n- The search term has enough clicks to make a decision\n- It has at least one conversion\n- Its ACoS is within target range\n- It is highly relevant to your product' },
    { title: 'What Are Negative Keywords?', slug: 'what-are-negative-keywords', level: 'beginner', role: 'PPC VA', content: '# What Are Negative Keywords?\n\nNegative keywords prevent your ads from showing for specific search terms.\n\n## Types\n\n- **Negative Exact**: Block only the exact search term\n- **Negative Phrase**: Block search terms that include the negative phrase\n\n## When to Add Negatives\n\n1. Search terms are completely irrelevant to your product\n2. Search terms have high clicks but zero sales after sufficient data\n3. Search terms have very high ACoS that doesn\'t improve\n4. Search terms are for products you don\'t sell\n\n## Best Practices\n\n- Always document why you added a negative keyword\n- Use negative exact for precision\n- Monitor for accidentally blocking good terms\n- Review negatives periodically to remove any that are too broad' },
    { title: 'What Is Listing Readiness?', slug: 'what-is-listing-readiness', level: 'beginner', role: 'Listing VA', content: '# What Is Listing Readiness?\n\nListing readiness means a product page is optimized enough to support advertising and sales growth.\n\n## Checklist\n\n- [ ] **Images**: At least 7 high-quality images + 1 video\n- [ ] **Title**: Keyword-rich, under 200 characters\n- [ ] **Bullet Points**: All 5 bullet points filled with benefits and features\n- [ ] **A+ Content**: Enhanced brand content is live\n- [ ] **Reviews**: Minimum 15 reviews with 4.0+ average\n- [ ] **Pricing**: Competitive within the category\n- [ ] **Inventory**: At least 30 days of stock\n- [ ] **Backend Keywords**: All filled with relevant search terms\n\n## Why It Matters\n\nRunning PPC on an unready listing wastes money. If the listing doesn\'t convert, no amount of traffic will generate sales profitably.' },
    { title: 'How to Write Daily Updates as an Amazon VA', slug: 'daily-updates-guide', level: 'beginner', role: 'General', content: '# How to Write Daily Updates as an Amazon VA\n\nDaily updates show your clients and team what you accomplished. Clear, concise updates build trust.\n\n## Format\n\n1. **Tasks Completed**: What you finished today\n2. **In Progress**: What you\'re currently working on\n3. **Blocked/Needs Input**: What you can\'t proceed without\n4. **Tomorrow\'s Plan**: What you\'ll work on next\n\n## Tips\n\n- Be specific: "Reviewed SP search term report and flagged 12 high-click zero-sale terms" not "Did PPC work"\n- Include metrics when possible\n- Mention any issues or concerns\n- Keep it concise — bullet points work best\n- Send at the same time each day' },

    // Intermediate guides
    { title: 'How to Analyze Sponsored Products Reports', slug: 'analyze-sp-reports', level: 'intermediate', role: 'PPC VA', content: '# How to Analyze Sponsored Products Reports\n\nSponsored Products reports are your primary tool for PPC optimization.\n\n## Report Types\n\n1. **Search Term Report**: Shows actual shopper queries\n2. **Campaign Report**: Campaign-level performance\n3. **Ad Group Report**: Ad group-level performance\n4. **Keyword Report**: Keyword-level performance\n5. **Product Ads Report**: Individual ad performance\n\n## Analysis Framework\n\n1. Sort by spend to find highest-cost keywords\n2. Check ACoS against targets\n3. Look for high-click, zero-sale terms\n4. Identify keywords with improving trends\n5. Check for wasted spend on irrelevant terms' },
    { title: 'How to Analyze Sponsored Brands Reports', slug: 'analyze-sb-reports', level: 'intermediate', role: 'PPC VA', content: '# How to Analyze Sponsored Brands Reports\n\nSponsored Brands reports focus on brand-level and keyword-level performance.\n\n## Key Differences from SP Reports\n\n- SB reports include headline and video ad metrics\n- Attribution windows may differ\n- Brand search term data includes broader queries\n\n## Analysis Steps\n\n1. Review keyword performance by match type\n2. Check headline ad CTR and CVR\n3. Evaluate brand defense performance\n4. Analyze competitor targeting effectiveness' },
    { title: 'How to Classify Keyword Intent', slug: 'classify-keyword-intent', level: 'intermediate', role: 'PPC VA', content: '# How to Classify Keyword Intent\n\nKeyword intent tells you how likely a shopper is to buy when they search for a term.\n\n## High Intent\n- "Buy [product]"\n- "[Product] for sale"\n- Specific product features + "buy"\n- Brand name + product type\n\n## Mid Intent\n- "Best [product]"\n- "[Product] reviews"\n- "[Product] comparison"\n\n## Low Intent\n- "What is [product]"\n- "How to use [product]"\n- Generic category terms\n\n## Application\n\n- Bid higher on high-intent terms\n- Use mid-intent terms for discovery\n- Negate irrelevant low-intent terms\n- Monitor all for conversion data' },
    { title: 'How to Identify Wasted Ad Spend', slug: 'identify-wasted-spend', level: 'intermediate', role: 'PPC VA', content: '# How to Identify Wasted Ad Spend\n\nWasted spend is money spent on clicks that don\'t lead to sales. Identifying and reducing it is a key optimization skill.\n\n## Signs of Wasted Spend\n\n1. High-click, zero-sale keywords after sufficient data\n2. Irrelevant search terms triggering ads\n3. Extremely high ACoS keywords\n4. Duplicate targeting across campaigns\n5. Running ads on out-of-stock products\n\n## How to Fix\n\n- Add negative keywords for irrelevant terms\n- Reduce bids on high-ACoS keywords\n- Pause consistently underperforming keywords\n- Check for and eliminate targeting overlap\n- Pause campaigns when inventory is low' },
    { title: 'How to Prepare a PPC Weekly Report', slug: 'prepare-ppc-report', level: 'intermediate', role: 'Reporting VA', content: '# How to Prepare a PPC Weekly Report\n\nWeekly reports help clients understand campaign performance and the value of your work.\n\n## Structure\n\n1. **Executive Summary**: 3-5 bullet points on overall performance\n2. **Key Metrics**: Spend, Sales, ACoS, ROAS, Orders, CVR vs. last week\n3. **Top Performers**: Best keywords and campaigns\n4. **Concerns**: Underperforming areas\n5. **Actions Taken**: What you optimized this week\n6. **Recommendations**: What you suggest for next week\n\n## Tips\n\n- Use clear, simple language\n- Compare to previous period\n- Highlight both wins and concerns\n- Always tie actions to data' },
    { title: 'How to Organize Campaign Names', slug: 'organize-campaign-names', level: 'intermediate', role: 'PPC VA', content: '# How to Organize Campaign Names\n\nConsistent campaign naming makes account management efficient and reduces errors.\n\n## Naming Convention\n\n`[BRAND]_[COUNTRY]_[STAGE]_[TYPE]_[MATCH]_[THEME]_[YYYYMM]`\n\n## Example\n\n- `TECHPRO_US_LAUNCH_SP_AUTO_DISCOVERY_202501`\n- `TECHPRO_US_OPTIMIZE_SP_EXACT_BRANDED_202501`\n\n## Why It Matters\n\n- Easy to find campaigns in the console\n- Clear what each campaign does at a glance\n- Reduces errors from misidentification\n- Makes reporting and analysis faster' },
    { title: 'How to Build a Campaign Launch Checklist', slug: 'campaign-launch-checklist', level: 'intermediate', role: 'PPC VA', content: '# How to Build a Campaign Launch Checklist\n\nA launch checklist ensures no critical steps are missed.\n\n## Pre-Launch\n\n- [ ] Listing is ready (images, bullets, reviews, inventory)\n- [ ] Keywords researched and organized\n- [ ] Campaign naming follows convention\n- [ ] Budget and bid strategy defined\n- [ ] Negative keyword list prepared\n\n## During Launch\n\n- [ ] Campaign settings verified\n- [ ] Targeting added correctly\n- [ ] Bids set according to strategy\n- [ ] Start date confirmed\n\n## Post-Launch\n\n- [ ] Campaign is active and receiving impressions\n- [ ] No errors or flags in the console\n- [ ] QA check completed\n- [ ] Launch documented in changelog' },
    { title: 'How to QA Campaign Setup', slug: 'qa-campaign-setup', level: 'intermediate', role: 'PPC VA', content: '# How to QA Campaign Setup\n\nQuality assurance before campaign launch prevents costly mistakes.\n\n## QA Checklist\n\n1. Campaign name follows naming convention\n2. Correct ad type selected (SP, SB, SD)\n3. Correct targeting added\n4. No duplicate targeting with existing campaigns\n5. Budget matches strategy\n6. Bids are within acceptable range\n7. Negative keywords added where needed\n8. Start/end dates are correct\n9. Placement adjustments are set if applicable\n10. All changes documented' },
    { title: 'How to Document Optimization Actions', slug: 'document-optimization', level: 'intermediate', role: 'PPC VA', content: '# How to Document Optimization Actions\n\nDocumentation creates accountability and helps team members understand what was done and why.\n\n## What to Document\n\n- Date and time of change\n- Campaign/ad group/keyword affected\n- What was changed (bid, budget, negative, pause, etc.)\n- Reason for the change (data reference)\n- Expected outcome\n- Who made the change\n\n## Format\n\nUse a changelog spreadsheet or ClickUp task with columns:\nDate | Campaign | Change Type | Details | Reason | Result' },
    { title: 'How to Communicate PPC Issues to Clients', slug: 'communicate-ppc-issues', level: 'intermediate', role: 'PPC VA', content: '# How to Communicate PPC Issues to Clients\n\nClear, professional communication builds client trust and manages expectations.\n\n## Principles\n\n1. **Be honest**: Don\'t hide problems or inflate results\n2. **Be specific**: Use data, not vague statements\n3. **Be proactive**: Flag issues before the client asks\n4. **Be solution-oriented**: Always pair problems with proposed actions\n5. **Be professional**: Maintain a calm, factual tone\n\n## Structure for Bad News\n\n1. State the issue clearly\n2. Provide the data\n3. Explain what you\'ve already done\n4. Suggest next steps\n5. Ask for input if needed' },

    // Advanced guides
    { title: 'Campaign Launch Sequencing', slug: 'campaign-launch-sequencing', level: 'advanced', role: 'PPC VA', content: '# Campaign Launch Sequencing\n\nThe order in which you launch campaigns matters. Follow this phased approach.\n\n## Phase 1: Research and Branded Defense\n- SP Auto Discovery\n- SP Exact Branded (if brand registered)\n\n## Phase 2: Competitor Targeting\n- SP Product Targeting - Competitor ASINs\n- SP Broad/Phrase - Competitor keywords\n\n## Phase 3: Expansion\n- SKAG for proven terms\n- Category targeting\n- Cross-sell campaigns\n\n## Phase 4: Remarketing and Audiences\n- SD Retargeting\n- Audience-based campaigns\n\n## Phase 5: Seasonal and Strategic\n- Seasonal campaigns\n- Deal/coupon campaigns\n- Rank push campaigns' },
    { title: 'Launch vs Optimize vs Scale vs Maintain Strategy', slug: 'launch-optimize-scale-maintain', level: 'advanced', role: 'PPC VA', content: '# Launch vs Optimize vs Scale vs Maintain Strategy\n\nCampaigns go through lifecycle stages, each with different goals and tactics.\n\n## Launch Stage\n- Goal: Discover what works\n- Tactics: Auto campaigns, broad match, conservative budgets\n- Focus: Data collection, not profitability\n\n## Optimize Stage\n- Goal: Improve efficiency\n- Tactics: Harvest keywords, add negatives, adjust bids\n- Focus: Reduce waste, improve ACoS\n\n## Scale Stage\n- Goal: Grow profitable campaigns\n- Tactics: Increase budgets on winners, expand targeting\n- Focus: Revenue growth while maintaining target ACoS\n\n## Maintain Stage\n- Goal: Sustain performance\n- Tactics: Monitor, adjust bids, refresh keywords\n- Focus: Consistency and efficiency' },
    { title: 'Rank Push Guardrails', slug: 'rank-push-guardrails', level: 'advanced', role: 'PPC VA', content: '# Rank Push Guardrails\n\nA rank push increases ad spend to improve organic ranking. It requires careful guardrails.\n\n## When to Consider a Rank Push\n\n- Listing is fully optimized\n- Inventory is sufficient (60+ days)\n- Product has enough reviews (15+)\n- You have budget approval\n\n## Guardrails\n\n1. Set a maximum TACoS threshold\n2. Timebox the push (typically 2-4 weeks)\n3. Monitor organic rank daily\n4. Have an exit plan if results don\'t improve\n5. Document everything\n\n## Warning Signs to Stop\n\n- TACoS exceeding threshold\n- No organic rank improvement after 2 weeks\n- Inventory dropping below 30 days\n- ACoS exceeding profit margin by large margin' },
    { title: 'Budget Pacing Logic', slug: 'budget-pacing-logic', level: 'advanced', role: 'PPC VA', content: '# Budget Pacing Logic\n\nBudget pacing ensures your ad spend is distributed effectively throughout the period.\n\n## Key Concepts\n\n- **Daily budget**: Maximum spend per day per campaign\n- **Monthly budget**: Total allocation across campaigns\n- **Pacing**: How fast the budget is consumed\n\n## Decision Framework\n\n1. **Campaign running out by noon?**\n   - If profitable: Consider increasing budget\n   - If unprofitable: Analyze before increasing\n\n2. **Campaign underspending?**\n   - Check if bids are too low\n   - Check if targeting is too narrow\n   - Review search term relevance\n\n3. **Month-end pacing check**\n   - Review spend vs. allocation\n   - Adjust budgets to hit targets\n   - Shift budget from underperformers to winners' },
    { title: 'Placement Multiplier Strategy', slug: 'placement-multiplier-strategy', level: 'advanced', role: 'PPC VA', content: '# Placement Multiplier Strategy\n\nAmazon allows bid adjustments for ad placements: Top of Search, Product Pages, and Rest of Search.\n\n## When to Test Top of Search\n\n- Strong listing with high CVR\n- Competitive keywords where visibility matters\n- Brand defense campaigns\n\n## When to Test Product Pages\n\n- Product targeting campaigns\n- Cross-sell campaigns\n- When your product page converts well\n\n## Best Practices\n\n- Start with conservative multipliers (10-30%)\n- Test one placement at a time\n- Monitor ACoS by placement\n- Adjust based on data, not assumptions' },
    { title: 'Product Targeting Strategy', slug: 'product-targeting-strategy', level: 'advanced', role: 'PPC VA', content: '# Product Targeting Strategy\n\nProduct targeting lets your ads appear on specific product detail pages.\n\n## Campaign Types\n\n1. **SP_PT_BRANDED**: Target your own products for cross-sell\n2. **SP_PT_COMP**: Target competitor products\n3. **SP_PT_CROSSSELL**: Target complementary products\n\n## Best Practices\n\n- Target products with higher prices than yours\n- Target products with worse reviews/ratings\n- Target complementary products your customers buy\n- Monitor for low-CVR targets and remove them\n- Use negative targeting to avoid showing on irrelevant pages' },
    { title: 'PPC Account Audit Workflow', slug: 'ppc-account-audit', level: 'advanced', role: 'PPC VA', content: '# PPC Account Audit Workflow\n\nAn audit identifies issues and opportunities in an Amazon PPC account.\n\n## Audit Steps\n\n1. **Account Overview**: Total spend, sales, ACoS, ROAS\n2. **Campaign Structure**: Naming, organization, lifecycle stages\n3. **Keyword Analysis**: High performers, wasted spend, gaps\n4. **Search Term Review**: Negatives needed, harvesting opportunities\n5. **Budget Analysis**: Underspend, overspend, pacing\n6. **Listing Readiness**: Are products ready for current spend levels?\n7. **Competitive Analysis**: Branded defense, competitor targeting\n8. **Recommendations**: Prioritized action items\n\n## Deliverable\n\nA structured audit summary with findings and prioritized recommendations.' },
    { title: 'Quarterly Strategy Review Basics', slug: 'quarterly-strategy-review', level: 'advanced', role: 'PPC VA', content: '# Quarterly Strategy Review Basics\n\nQuarterly reviews align PPC strategy with business goals.\n\n## Review Components\n\n1. **Performance vs. Goals**: Did we hit targets?\n2. **Budget Allocation**: Is spend distributed optimally?\n3. **Campaign Lifecycle**: Which campaigns need stage changes?\n4. **New Opportunities**: New keywords, markets, or ad types to test\n5. **Seasonal Planning**: Prepare for upcoming events\n6. **Tool Evaluation**: Are current tools serving us well?\n\n## Output\n\nUpdated strategy document with goals, budget allocation, and action plan for the next quarter.' },
    { title: 'Tool Collision and Automation Guardrails', slug: 'tool-collision-guardrails', level: 'advanced', role: 'PPC VA', content: '# Tool Collision and Automation Guardrails\n\nWhen multiple tools manage the same account, conflicts can occur.\n\n## Common Issues\n\n- Two tools adjusting the same bid simultaneously\n- Automated rules conflicting with manual changes\n- Bulk operations overwriting recent changes\n\n## Guardrails\n\n1. Define which tool owns which action\n2. Log all changes with source attribution\n3. Set up alerts for conflicting changes\n4. Review automation rules regularly\n5. Maintain a change freeze period during critical times' },
    { title: 'Building a PPC Portfolio Case Study', slug: 'ppc-portfolio-case-study', level: 'advanced', role: 'PPC VA', content: '# Building a PPC Portfolio Case Study\n\nA portfolio case study demonstrates your PPC skills to potential employers.\n\n## Structure\n\n1. **Background**: Product/market context\n2. **Challenge**: What problem needed solving\n3. **Strategy**: What approach you took\n4. **Actions**: Specific steps you implemented\n5. **Results**: Measurable outcomes\n6. **Learnings**: What you would do differently\n\n## Important Note\n\nAll portfolio work should be clearly labeled as training/practice work, not paid client experience. Honesty is essential.' },

    // ===== NEW: Account VA Guides =====
    { title: 'Seller Central Navigation for Account VAs', slug: 'seller-central-navigation-account-va', level: 'beginner', role: 'Account VA', content: '# Seller Central Navigation for Account VAs\n\nAs an Account VA, Seller Central is your primary workspace. Understanding how to navigate it efficiently is the foundation of your daily work. This guide covers the main areas you need to know and the common tasks you will perform.\n\n## Main Areas of Seller Central\n\nSeller Central is organized into several major sections. The top navigation bar and the hamburger menu give you access to everything:\n\n- **Catalog**: This is where you manage all your product listings. You can add new products, edit existing ones, create variations, and fix listing errors. The Catalog section also shows suppression issues that need immediate attention.\n- **Inventory**: Here you manage FBA and FBM inventory, create shipment plans, view stranded inventory, and check the Inventory Performance dashboard. This section is critical for preventing stockouts.\n- **Orders**: View all orders, manage returns and refunds, and handle buyer messages. This is also where you monitor order defect rates and late shipment metrics.\n- **Advertising**: Access the Amazon Ads Console for PPC campaign management. While PPC VAs focus on this section, Account VAs need to understand how advertising connects to inventory and listing health.\n- **Stores**: Manage Brand Stores if the account is brand registered.\n- **Reports**: Download business reports, advertising reports, and inventory reports. These are essential for weekly reporting and account health monitoring.\n- **Settings**: Configure account-level settings including shipping templates, return policies, notification preferences, and user permissions.\n\n## Daily Tasks for Account VAs\n\nYour daily routine typically includes:\n\n1. **Check Account Health Dashboard**: Look for any alerts, policy violations, or metric deterioration (ODR, LSR, CR, VTR)\n2. **Review Inventory Alerts**: Check for low stock, stranded inventory, and FBA shipment status\n3. **Monitor Open Cases**: Follow up on any pending Seller Central support cases\n4. **Process Returns and Refunds**: Handle any new return requests and ensure timely processing\n5. **Check Buyer Messages**: Respond to customer inquiries within 24 hours\n6. **Review Listings for Suppressions**: Fix any listings that have been suppressed by Amazon\n\n## Navigation Tips\n\n- Use the search bar at the top to quickly find specific ASINs, orders, or settings\n- Pin your most-used pages for quick access from the top navigation\n- Use the Seller Central app for urgent mobile monitoring\n- Keep the Account Health dashboard bookmarked — it should be the first thing you check each day' },
    { title: 'Account Health and Performance Metrics', slug: 'account-health-performance-metrics', level: 'intermediate', role: 'Account VA', content: '# Account Health and Performance Metrics\n\nAccount health is one of the most critical aspects of managing an Amazon seller account. Poor metrics can lead to listing suspensions, account deactivation, or loss of Buy Box eligibility. As an Account VA, monitoring and maintaining these metrics is a core responsibility.\n\n## The Account Health Dashboard\n\nThe Account Health Dashboard in Seller Central provides a real-time overview of your account performance. It highlights issues that need immediate attention and tracks key metrics over time. You should check this dashboard at least once daily.\n\n## Key Metrics and Their Thresholds\n\n### Order Defect Rate (ODR)\n- **What it measures**: The percentage of orders with a negative feedback, an A-to-Z claim, or a credit card chargeback\n- **Threshold**: Must stay below 1%\n- **What happens if exceeded**: Account may be suspended\n- **What to do when rising**: Investigate the root cause — is it product quality, shipping issues, or listing accuracy? Address negative feedback proactively by resolving buyer complaints. Review A-to-Z claims for patterns.\n\n### Late Shipment Rate (LSR)\n- **What it measures**: The percentage of FBM orders shipped after the expected ship date\n- **Threshold**: Must stay below 4%\n- **What happens if exceeded**: Account may lose FBM privileges\n- **What to do when rising**: Review shipping processes, consider switching to FBA for problematic SKUs, and adjust handling times in shipping templates.\n\n### Cancellation Rate (CR)\n- **What it measures**: The percentage of orders cancelled by the seller\n- **Threshold**: Must stay below 2.5%\n- **What happens if exceeded**: Account may be suspended\n- **What to do when rising**: Identify the cancellation cause — inventory issues, pricing errors, or listing problems. Ensure inventory levels are accurate and pricing is correct.\n\n### Valid Tracking Rate (VTR)\n- **What it measures**: The percentage of FBM shipments with valid tracking numbers\n- **Threshold**: Must be above 95%\n- **What happens if below**: May lose Buy Box eligibility for FBM offers\n- **What to do when low**: Ensure all shipments have tracking numbers entered promptly and that carriers are supported by Amazon.\n\n## When Metrics Are Declining\n\nWhen you notice a metric trending in the wrong direction, follow this protocol:\n\n1. **Identify the pattern**: Is it affecting specific SKUs, time periods, or order types?\n2. **Root cause analysis**: Determine whether the issue is operational, product-related, or systemic\n3. **Implement immediate fixes**: Address the most impactful issues first\n4. **Document everything**: Record what you found and what actions you took\n5. **Monitor daily until stabilized**: Check the metric every day until it returns to a safe range\n6. **Escalate if needed**: If a metric approaches the suspension threshold, escalate to the account owner or manager immediately\n\n## Proactive Account Health Management\n\nThe best approach is to prevent issues before they arise:\n- Set up automated alerts for inventory levels and shipping deadlines\n- Review negative feedback daily and respond promptly\n- Maintain a log of all A-to-Z claims and chargebacks with resolution notes\n- Regularly audit listings for compliance with Amazon policies\n- Keep shipping templates updated with realistic handling times' },
    { title: 'FBA Inventory and Shipment Management', slug: 'fba-inventory-shipment-management', level: 'intermediate', role: 'Account VA', content: '# FBA Inventory and Shipment Management\n\nFBA (Fulfillment by Amazon) inventory management is a critical skill for Account VAs. Running out of stock means lost sales and lost organic ranking, while excess inventory ties up capital and incurs long-term storage fees. This guide covers the essential workflows.\n\n## FBA Shipment Creation\n\nCreating an FBA shipment plan involves several steps that must be followed carefully:\n\n1. **Go to Inventory > Manage FBA Inventory**: Select the products you want to ship\n2. **Choose "Send/Replenish Inventory"**: This starts the shipment creation workflow\n3. **Enter shipment quantities**: Specify how many units of each SKU you are sending\n4. **Review the shipment plan**: Amazon will split your shipment across multiple fulfillment centers based on demand forecasts\n5. **Prepare the shipment**: Print FNSKU labels, pack products according to Amazon prep requirements, and label boxes\n6. **Provide box contents information**: Enter the contents of each box using the web form or a spreadsheet upload\n7. **Select shipping method**: Choose between Small Parcel Delivery (for boxes under 50 lbs) and Less Than Truckload (LTL) for larger shipments\n8. **Confirm the shipment**: Review all details and confirm\n\n## Inventory Planning\n\nEffective inventory planning balances the risk of stockouts against the cost of excess inventory:\n\n- **Reorder Point**: Calculate your reorder point based on lead time plus a safety buffer. For example, if your supplier takes 30 days and you sell 10 units per day, your reorder point is 300 units plus safety stock.\n- **Safety Stock**: Always maintain at least 2-4 weeks of safety stock above your expected demand during lead time\n- **Seasonal Planning**: Increase inventory 60-90 days before peak seasons like Q4, Prime Day, or seasonal events\n- **Demand Forecasting**: Use the Inventory Performance dashboard and business reports to identify demand trends\n\n## Stranded Inventory\n\nStranded inventory is FBA inventory that is not available for sale because it is not associated with an active listing. This can happen when:\n- A listing is suppressed or deleted\n- A variation relationship is broken\n- A product is restricted by Amazon\n\nTo resolve stranded inventory:\n1. Go to Inventory > Manage FBA Inventory > Stranded Inventory\n2. Identify the cause of the stranding\n3. Fix the listing issue (reinstate, create new listing, or fix variation)\n4. Once the listing is active, the inventory will automatically become available for sale\n\n## Restock Alerts and Inventory Performance Dashboard\n\nThe Inventory Performance dashboard provides key metrics:\n\n- **Inventory Performance Index (IPI)**: A composite score that measures inventory health. A score above 500 is generally good. Low IPI can result in storage limits.\n- **Restock Recommendations**: Amazon suggests restock quantities based on demand forecasts. Use these as a starting point but verify with your own sales data.\n- **Excess Inventory**: Products with more than 90 days of supply. Consider running promotions or advertising to move excess stock.\n- **Age of Inventory**: Products approaching long-term storage fee thresholds. Take action before fees apply.\n\n## Best Practices\n\n- Create shipment plans early to account for processing and transit delays\n- Always double-check FNSKU labels before shipping to avoid receiving errors\n- Track all shipments in a spreadsheet with carrier, tracking number, and expected delivery date\n- Set up low-inventory alerts in Seller Central so you never miss a reorder point\n- Review the Stranded Inventory report weekly to recover lost sales\n- Document every shipment plan in the client changelog for team visibility' },

    // ===== NEW: Listing VA Guides =====
    { title: 'Amazon Listing Fundamentals', slug: 'amazon-listing-fundamentals', level: 'beginner', role: 'Listing VA', content: '# Amazon Listing Fundamentals\n\nA product listing is the foundation of all sales on Amazon. No matter how good your PPC campaigns are, if the listing is weak, clicks will not convert into sales. As a Listing VA, understanding what makes a great listing is your most important skill.\n\n## What Makes a Good Listing\n\nA high-converting listing has six core elements that work together to inform, persuade, and reassure shoppers:\n\n### Title\nThe title is the most important element for both search visibility and click-through rate. A strong title includes the brand name, the primary keyword, key differentiating features, and material or size information. Aim for 150-200 characters — long enough to include relevant keywords but not so long that it becomes unreadable. The first 80 characters are especially critical because they appear in search results.\n\n### Bullet Points\nAmazon allows up to 5 bullet points. Each bullet should lead with a benefit, followed by a feature and supporting detail. Use ALL 5 bullet points — this is prime real estate for both conversion and keyword indexing. Bullet points should incorporate secondary keywords naturally without keyword stuffing.\n\n### Images\nThe main image must have a pure white background and show the product clearly. Additional images should show the product in use, highlight features with callouts, show dimensions, and include lifestyle shots. Aim for at least 7 images plus 1 video. Images are the number one factor in conversion rate after the price.\n\n### A+ Content\nA+ Content (also called Enhanced Brand Content for non-brand-registered sellers) allows you to add rich media modules below the bullet points. This includes comparison charts, image-with-text blocks, and feature callouts. A+ Content improves conversion rate by 3-10% on average and helps differentiate your product from competitors.\n\n### Backend Keywords\nBackend keywords are hidden search terms that do not appear on the product page but help Amazon index your product for relevant searches. You get 250 bytes per field across 5 fields. Use this space for alternate terms, misspellings, and long-tail variations that did not fit naturally in the visible listing content.\n\n### Description\nThe description is less visible than bullets for most categories but still contributes to indexing. Write a clear, benefit-focused description that reinforces the key selling points. For brand-registered products, A+ Content replaces the standard description.\n\n## Common Listing Mistakes\n\n- **Keyword stuffing in titles**: Makes the listing unreadable and hurts CTR\n- **Missing bullet points**: Each unused bullet is a missed opportunity for conversion and indexing\n- **Low-quality images**: Blurry, poorly lit, or insufficient images kill conversion\n- **Ignoring backend keywords**: Leaves indexing gaps that competitors fill\n- **No A+ Content**: Missing a significant conversion boost\n- **Not updating listings**: Search terms and competitor strategies change — listings should be refreshed quarterly' },
    { title: 'Keyword-Optimized Listing Content', slug: 'keyword-optimized-listing-content', level: 'intermediate', role: 'Listing VA', content: '# Keyword-Optimized Listing Content\n\nCreating keyword-optimized listing content is both an art and a science. You need to strategically place keywords where they have the most impact on indexing and ranking, while ensuring the content remains natural and persuasive for shoppers. This guide covers the strategies and techniques for effective keyword integration.\n\n## Keyword Placement Strategy\n\nNot all keyword placements are equal. Amazon\'s A9 algorithm weights different parts of the listing differently when determining relevance:\n\n### Title (Highest Impact)\nThe title carries the most weight for keyword ranking. Place your primary keyword near the beginning of the title. Include the brand name, product type, and the top 2-3 differentiating features. For example: "BrandName Premium Wireless Earbuds - Bluetooth 5.3 Noise Cancelling Earbuds with 36hr Battery, IPX5 Waterproof for Running"\n\n### Bullet Points (High Impact)\nBullets are the second most important location for keywords. Each bullet should incorporate relevant keywords naturally within benefit-focused content. Spread your secondary keywords across the 5 bullets rather than trying to cram them all into one.\n\n### Backend Keywords (Moderate Impact)\nBackend keywords help with indexing but do not directly impact ranking. Use them for terms that do not fit naturally in visible content — alternate names, misspellings, use-case terms, and competitor brand names you cannot use visibly. Maximize the 250-byte limit for each of the 5 backend keyword fields.\n\n### Description / A+ Content (Lower Impact)\nThese contribute to indexing but have less weight than titles and bullets. Focus on readability and conversion here rather than keyword density.\n\n## Indexing vs Ranking\n\nUnderstanding the difference between indexing and ranking is crucial:\n\n- **Indexing** means Amazon recognizes that your product is relevant for a search term. If your product is not indexed for a keyword, it will never appear in search results for that term, regardless of how much you bid on it in PPC.\n- **Ranking** means where your product appears in search results for a given term. Ranking is influenced by sales velocity, conversion rate, review quality, and relevance signals from your listing content.\n\nTo check if your product is indexed for a keyword, search for the keyword plus your ASIN on Amazon (e.g., "wireless earbuds B08XYZ"). If your product appears in the results, it is indexed.\n\n## Keyword Research for Listings\n\nUse tools like Helium 10 Cerebro, Magnet, and Search Term Reports to identify:\n\n1. **Primary keywords**: The top 3-5 search terms with the highest volume and relevance\n2. **Secondary keywords**: Supporting terms that describe features, use cases, and alternatives\n3. **Long-tail keywords**: Specific phrases with lower volume but higher conversion intent\n4. **Competitor terms**: Brand names and product names that shoppers search for as alternatives\n\n## Best Practices\n\n- **Never repeat keywords across title, bullets, and backend**: Amazon only counts each keyword once for indexing purposes. Repeating "wireless earbuds" in the title, bullets, AND backend wastes valuable space.\n- **Use variations and synonyms**: Include related terms like "earphones," "headphones," "earbuds" to capture different search behaviors\n- **Include use-case keywords**: Terms like "for running," "for gym," "for iPhone" capture high-intent shoppers\n- **Refresh keywords quarterly**: Search trends change and new competitors enter the market — update your listing content accordingly\n- **Test and measure**: Track organic ranking changes after listing updates to measure the impact of keyword optimizations' },
    { title: 'A+ Content and Brand Store Creation', slug: 'aplus-content-brand-store-creation', level: 'intermediate', role: 'Listing VA', content: '# A+ Content and Brand Store Creation\n\nA+ Content and Brand Stores are powerful tools available to brand-registered sellers that can significantly improve conversion rates and brand presence on Amazon. This guide covers how to create effective A+ Content and set up a Brand Store.\n\n## A+ Content Overview\n\nA+ Content (also called Enhanced Brand Content or EBC) allows you to replace the standard product description with rich media modules. These modules can include images with text overlays, comparison charts, feature callouts, and narrative blocks. According to Amazon, A+ Content can increase sales by 3-10% on average.\n\n### A+ Content Module Types\n\n1. **Standard Image with Text**: A single image paired with a headline and description. Best for highlighting a key feature or benefit.\n2. **Standard Multiple Image with Text**: Multiple images with corresponding text blocks. Great for showing product angles or features in sequence.\n3. **Standard Comparison Chart**: Side-by-side comparison of your products. Useful for cross-selling and helping customers choose the right variant.\n4. **Standard Four Image / Text Quadrant**: A grid layout showing four features or use cases simultaneously.\n5. **Standard Single Image and Sidebar**: An image with a text sidebar for detailed feature explanation.\n6. **Narrative Module**: Text-focused module for storytelling or brand messaging.\n7. **Technical Specification Module**: Structured layout for displaying product specs clearly.\n\n### A+ Content Best Practices\n\n- **Lead with the biggest benefit**: The first module should address the primary reason customers buy your product\n- **Use high-quality images**: A+ images should be professionally designed with consistent branding and clean callouts\n- **Keep text concise**: Shoppers scan, they do not read. Use short paragraphs, bullet points, and bold headers\n- **Include a comparison chart**: If you have multiple products, a comparison chart helps customers self-select the right option\n- **Mobile-first design**: Over 70% of Amazon shoppers browse on mobile. Test your A+ Content on a mobile screen before publishing\n- **Avoid prohibited claims**: Do not make medical claims, guarantee results, or use superlatives like "best" or "number one"\n- **Measure performance**: Use the A+ Content analytics in Seller Central to track conversion rate changes after publishing\n\n## Brand Store Creation\n\nA Brand Store is a multi-page storefront on Amazon that showcases your brand and product catalog. It is available to brand-registered sellers and vendors at no additional cost.\n\n### Setting Up a Brand Store\n\n1. **Access Brand Store**: Go to Seller Central > Stores > Manage Stores\n2. **Choose a template**: Amazon offers several templates based on product category and store size\n3. **Design the homepage**: This is the first page visitors see. Include a hero image, brand messaging, and product highlights\n4. **Create sub-pages**: Organize products by category, use case, or collection. Each page should have a clear theme\n5. **Add product widgets**: Use the Product Grid, Product Carousel, and Featured Deal widgets to display products dynamically\n6. **Add rich media**: Include image tiles, video backgrounds, and text modules to make the store visually engaging\n7. **Preview and submit**: Review the store on both desktop and mobile, then submit for Amazon approval\n\n### Brand Store Best Practices\n\n- **Consistent branding**: Use the same color scheme, fonts, and visual style throughout the store\n- **Clear navigation**: Make it easy for shoppers to find products with logical page structure\n- **Link from advertising**: Sponsored Brands campaigns can link directly to your Brand Store, making it a powerful landing page for branded campaigns\n- **Track performance**: Use Brand Store insights to see traffic, sales, and source attribution\n- **Update seasonally**: Refresh the store for Q4, Prime Day, and seasonal events to keep it relevant\n\n## Impact on Conversion Rate\n\nBoth A+ Content and Brand Stores contribute to higher conversion rates by:\n- Providing more information that helps customers make purchase decisions\n- Building brand trust through professional presentation\n- Reducing returns by setting accurate expectations through detailed visuals and descriptions\n- Enabling cross-selling by showcasing related products within the same brand ecosystem' },

    // ===== NEW: Reporting VA Guides =====
    { title: 'Amazon PPC Reporting Basics', slug: 'amazon-ppc-reporting-basics', level: 'beginner', role: 'Reporting VA', content: '# Amazon PPC Reporting Basics\n\nReporting is the backbone of every PPC optimization decision. As a Reporting VA, your job is to accurately collect, interpret, and present data so that the team can make informed decisions. This guide covers the fundamentals of Amazon PPC reporting.\n\n## Main Report Types\n\nAmazon provides several report types in the Ads Console, each serving a different purpose:\n\n### Search Term Report\nThis is the most important report for PPC optimization. It shows the actual queries shoppers typed before clicking your ad, along with performance data for each term. Key columns include: Search Term, Match Type, Clicks, Impressions, CPC, Spend, 7-Day Total Sales, 7-Day Total Orders, ACoS, ROAS, and CVR. Download this report weekly at minimum.\n\n### Campaign Report\nShows performance at the campaign level: total spend, sales, ACoS, ROAS, and CVR for each campaign. Use this for an overview of account performance and budget allocation decisions.\n\n### Keyword Report\nShows performance by keyword, including match type, bids, and performance metrics. Use this to track keyword-level trends and bid optimization.\n\n### Ad Group Report\nPerformance broken down by ad group. Useful for identifying which themes or product groupings are performing best.\n\n### Product Ads Report\nShows how individual ASINs perform as ad targets. Helpful for identifying which products to promote and which to deprioritize.\n\n### Placement Report\nShows performance by ad placement: Top of Search, Product Pages, and Rest of Search. Critical for deciding where to apply placement multipliers.\n\n## Where to Find Reports\n\n1. Go to the Amazon Ads Console\n2. Click on "Reporting" in the left navigation\n3. Select the report type and date range\n4. Download as CSV or Excel\n\n## Key Columns to Understand\n\n- **7-Day vs 14-Day Attribution**: Amazon attributes sales to clicks within either a 7-day or 14-day window. 7-day attribution is the default and more commonly used for optimization decisions.\n- **ACoS**: Can appear blank when there are sales but the attribution window has not closed, or when there are no sales at all. A blank ACoS with zero sales means infinite ACoS.\n- **CVR**: Calculated as Orders / Clicks. A CVR below 5% is generally concerning for most categories.\n\n## How to Read a Search Term Report\n\n1. **Sort by Spend** (descending): Find your most expensive terms first\n2. **Filter for Zero Sales**: Identify wasted spend quickly\n3. **Check ACoS**: Compare against target ACoS for each campaign\n4. **Look for New Terms**: Discover search terms you are not explicitly targeting\n5. **Flag Irrelevant Terms**: Identify terms that should be added as negatives\n6. **Note Match Type**: Understand which match types are driving the best results' },
    { title: 'Building Client PPC Reports', slug: 'building-client-ppc-reports', level: 'intermediate', role: 'Reporting VA', content: '# Building Client PPC Reports\n\nA well-structured PPC report builds client trust, demonstrates the value of your work, and drives strategic decisions. As a Reporting VA, creating clear and insightful reports is a core responsibility. This guide covers how to build reports that clients actually read and act on.\n\n## Weekly Report Structure\n\nA standard weekly PPC report should follow this structure:\n\n### 1. Executive Summary (3-5 bullets)\nStart with the most important takeaways. Clients are busy and may not read beyond this section. Include total spend, total sales, overall ACoS, and the biggest win and concern of the week.\n\n### 2. Key Metrics vs Previous Period\nPresent a comparison table showing: Spend, Sales, ACoS, ROAS, Orders, CVR, Impressions, and Clicks. Compare to the previous week and highlight significant changes with color coding (green for positive, red for negative).\n\n### 3. Campaign-Level Analysis\nFor each campaign, provide: Campaign Name, Spend, Sales, ACoS, ROAS, CVR, and a brief comment on performance. Highlight campaigns that need attention — both positive and negative.\n\n### 4. Keyword-Level Highlights\nCall out the top 5 performing keywords and the top 5 underperforming keywords. Explain what actions were taken or are recommended.\n\n### 5. Actions Taken This Week\nList every optimization action with a brief explanation of why it was taken and what data supported the decision. This demonstrates proactivity and accountability.\n\n### 6. Recommendations and Next Steps\nPropose specific actions for the coming week. Include expected outcomes where possible and flag any decisions that require client approval.\n\n## KPI Selection\n\nChoose KPIs based on the client\'s goals:\n- **Profitability focus**: ACoS, ROAS, Margin per Order\n- **Growth focus**: Sales, Orders, Impressions, TACoS\n- **Efficiency focus**: CVR, CTR, CPC, Wasted Spend %\n\nAlways include ACoS and ROAS as core metrics regardless of the focus.\n\n## Campaign-Level vs Account-Level Analysis\n\n- **Account-Level**: Shows the overall health of the PPC program. Use this for high-level trend identification and budget allocation decisions.\n- **Campaign-Level**: Reveals which specific campaigns are driving or dragging performance. Use this for optimization decisions like budget adjustments, bid changes, and keyword harvesting.\n- **Keyword-Level**: The most granular view. Use this for bid optimization, negative keyword additions, and keyword promotion decisions.\n\n## Presenting Data Clearly\n\n- **Use tables for exact numbers** and charts for trends\n- **Color code changes**: Green for improvements, red for declines\n- **Include percentage changes** alongside absolute numbers\n- **Avoid information overload**: Do not include every metric — focus on what drives decisions\n- **Use consistent formatting** week over week so clients can compare easily\n- **Always include context**: A 20% ACoS increase is less alarming if it was a deliberate strategy to push a new product launch' },
    { title: 'Data Analysis for Amazon VAs', slug: 'data-analysis-for-amazon-vas', level: 'intermediate', role: 'Reporting VA', content: '# Data Analysis for Amazon VAs\n\nData analysis skills are essential for making sense of Amazon PPC data and turning raw numbers into actionable insights. This guide covers the practical Excel and Sheets skills you need, along with frameworks for analyzing PPC data.\n\n## Essential Excel/Sheets Skills\n\n### Pivot Tables\nPivot tables are your most powerful tool for summarizing large PPC datasets. Use them to:\n- Summarize spend and sales by campaign, match type, or keyword theme\n- Compare performance across time periods\n- Identify which campaigns or keywords contribute most to total ACoS\n\nTo create a pivot table: Select your data range > Insert > Pivot Table. Drag fields into Rows, Columns, and Values as needed.\n\n### VLOOKUP and XLOOKUP\nUse these functions to combine data from different reports. For example, matching keyword data from the Keyword Report with search term data from the Search Term Report.\n\n### Conditional Formatting\nApply color scales and rules to quickly identify patterns:\n- Red for ACoS above target\n- Green for ACoS below target\n- Highlight rows with zero sales\n- Flag keywords with CVR below threshold\n\n### SUMIFS and COUNTIFS\nThese functions let you sum or count values based on multiple conditions. For example: Calculate total spend for exact match keywords with ACoS above 30%.\n\n## ACoS and ROAS Calculations\n\n### ACoS Formula\n```\nACoS = (Ad Spend / Ad Sales) × 100\n```\nExample: Spend $50, Sales $200 → ACoS = 25%\n\n### ROAS Formula\n```\nROAS = Ad Sales / Ad Spend\n```\nExample: Spend $50, Sales $200 → ROAS = 4x\n\n### TACoS Formula\n```\nTACoS = (Ad Spend / Total Sales) × 100\n```\nExample: Spend $50, Ad Sales $200, Organic Sales $300 → Total Sales $500 → TACoS = 10%\n\n### Max CPC Formula\n```\nMax CPC = Price × Target ACoS × CVR\n```\nExample: Price $29.99, Target ACoS 25%, CVR 10% → Max CPC = $0.75\n\n## Identifying Patterns in Search Term Data\n\n### Pattern 1: High Clicks, Zero Sales\nThis suggests the search term is irrelevant or the listing does not convert for this term. Action: Add as negative keyword if clearly irrelevant, or investigate listing if the term should be relevant.\n\n### Pattern 2: High CTR, Low CVR\nShoppers are clicking but not buying. This indicates a listing or price issue rather than a targeting issue. Action: Check the listing images, price, and reviews. Consider that the traffic may be from the wrong intent.\n\n### Pattern 3: Low CTR, Good CVR\nThe listing converts well when people click, but not many people are clicking. This suggests the ad is not visible enough or the main image/title is not compelling. Action: Consider increasing bids for better placement, or improve the ad creative.\n\n### Pattern 4: Seasonal Spikes\nSome terms perform well only during specific times of the year. Action: Plan budget allocation around seasonal trends and adjust bids proactively.\n\n## Best Practices\n\n- Always download fresh reports before analysis — data changes daily\n- Keep a template spreadsheet with pre-built pivot tables and formulas\n- Document your analysis methodology so others can replicate it\n- Present findings with specific recommendations, not just observations\n- Double-check formulas and data ranges before sharing reports with clients' },

    // ===== NEW: Agency VA Guides =====
    { title: 'Working in an Amazon Agency: SOPs and Communication', slug: 'working-in-amazon-agency-sops-communication', level: 'beginner', role: 'Agency VA', content: '# Working in an Amazon Agency: SOPs and Communication\n\nWorking in an Amazon agency is different from working directly for a single seller. You will likely manage multiple client accounts, follow strict standard operating procedures, and communicate with clients and team members daily. This guide covers the essentials of agency workflow and communication.\n\n## What is an Amazon Agency?\n\nAn Amazon agency provides managed services to Amazon sellers. This includes PPC management, listing optimization, account management, and strategic consulting. Agencies typically serve multiple clients simultaneously, which means VAs must be organized, consistent, and disciplined in their work.\n\n## SOP Discipline\n\nStandard Operating Procedures (SOPs) are the backbone of agency work. An SOP is a documented step-by-step process for completing a specific task. Agencies use SOPs to ensure:\n\n- **Consistency**: Every VA performs tasks the same way, regardless of who is working on the account\n- **Quality**: SOPs include quality checkpoints that prevent errors\n- **Scalability**: New team members can be onboarded quickly by following existing SOPs\n- **Accountability**: SOPs create a clear standard that performance can be measured against\n\nWhen following an SOP:\n1. Read the entire SOP before starting the task\n2. Follow each step exactly as written — do not skip steps\n3. If a step is unclear, ask your manager before proceeding\n4. Document any deviations and explain why they were necessary\n5. Suggest improvements to the SOP if you find a better way — but get approval before changing the process\n\n## ClickUp and Task Management\n\nMost agencies use project management tools like ClickUp to organize work. Here is how to use ClickUp effectively:\n\n- **Spaces**: Each client account typically has its own Space\n- **Folders**: Organize work by category (e.g., PPC, Listings, Reporting)\n- **Lists**: Further organize by task type (e.g., Daily Tasks, Weekly Reports, One-Time Projects)\n- **Tasks**: Individual action items with descriptions, due dates, assignees, and status\n\nWhen working in ClickUp:\n- Update task status as you work (To Do → In Progress → Review → Complete)\n- Add comments with progress updates\n- Attach relevant files and screenshots\n- Set due dates for all tasks and prioritize by deadline\n- Use the time tracking feature to log hours accurately\n\n## Daily Updates\n\nDaily updates are essential in agency work. They keep clients informed and help team leads monitor progress across multiple accounts.\n\n### Format for Daily Updates\n```\n**Account: [Client Name]**\n**Date: [Today\'s Date]**\n\n**Completed:**\n- Reviewed search term reports for 3 campaigns\n- Added 8 negative keywords to SP_Broad_Discovery\n- Adjusted bids on 5 keywords in SP_Exact_Branded\n\n**In Progress:**\n- Building weekly report for Friday delivery\n\n**Blocked/Needs Input:**\n- Awaiting client approval for new campaign launch\n\n**Plan for Tomorrow:**\n- Complete weekly report\n- Review placement performance data\n```\n\n## Changelog Practices\n\nEvery action taken in a client account should be documented in a changelog. This creates a paper trail that:\n- Helps team members understand what was done and why\n- Enables the team to reverse changes if needed\n- Provides context for performance changes\n- Serves as evidence of work for the client\n\nA changelog entry should include:\n- Date\n- Campaign/ad group/keyword affected\n- Action taken (bid change, budget change, keyword added/removed)\n- Reason for the action (with data reference)\n- Expected outcome\n- Who made the change' },
    { title: 'Multi-Client Account Management', slug: 'multi-client-account-management', level: 'intermediate', role: 'Agency VA', content: '# Multi-Client Account Management\n\nManaging multiple Amazon seller accounts simultaneously is one of the biggest challenges in agency work. Each account has different products, strategies, and client expectations. This guide covers strategies for maintaining quality and efficiency across multiple accounts.\n\n## Time Management Strategies\n\n### Time Blocking\nDedicate specific blocks of time to each client account. For example:\n- 9:00-10:30 AM: Client A (daily check, optimizations)\n- 10:30-12:00 PM: Client B (daily check, optimizations)\n- 1:00-2:30 PM: Client C (daily check, optimizations)\n- 2:30-4:00 PM: Reporting and documentation for all accounts\n\nAvoid switching between accounts frequently during a time block. Context switching is one of the biggest productivity killers in multi-account management.\n\n### Prioritization Framework\nNot all accounts need the same level of attention every day. Prioritize based on:\n1. **Urgency**: Accounts with active issues (suspensions, budget issues, client complaints) come first\n2. **Spend level**: Higher-spend accounts need more frequent monitoring\n3. **Campaign lifecycle**: Accounts in launch or scale phase need more attention than those in maintain phase\n4. **Client SLA**: Some clients have service level agreements that guarantee specific response times\n\n## Context Switching\n\nSwitching between accounts is mentally demanding. Here are strategies to minimize errors:\n\n### Pre-Work Checklist\nBefore starting work on an account, take 2 minutes to:\n1. Open the correct Seller Central and Ads Console for that client\n2. Review the last changelog entry to remind yourself where you left off\n3. Check for any new client messages or alerts\n4. Review the account health dashboard\n\n### Error Prevention\n- **Never have two Seller Central accounts open in the same browser** — this is the most common cause of cross-account errors\n- Use separate browser profiles or containers for each client\n- Double-check the account name before making any changes\n- Always verify the campaign name before adjusting bids or budgets\n- When in doubt, screenshot the campaign name before making changes\n\n## Maintaining Quality Across Accounts\n\n### Standardized Workflows\nUse the same workflow for each account, adjusted for the client\'s specific SOPs. A standard daily workflow might be:\n1. Check account health and alerts\n2. Review budget pacing\n3. Analyze search term reports\n4. Make optimization decisions\n5. Document changes in changelog\n6. Send daily update\n\n### Quality Assurance Checklist\nBefore marking any task as complete:\n- [ ] Did I make changes in the correct account?\n- [ ] Did I follow the client\'s SOP?\n- [ ] Did I document all changes in the changelog?\n- [ ] Did I communicate any concerns to the team lead?\n- [ ] Did I update the task status in ClickUp?\n\n### Weekly Self-Review\nAt the end of each week, review your work across all accounts:\n- Did I miss any daily checks?\n- Were there any errors or near-misses?\n- Which accounts need more attention next week?\n- Are there any recurring issues that need a process improvement?\n- Did I meet all client SLAs?\n\n## Communication at Scale\n\nWhen managing multiple clients, communication efficiency becomes critical:\n- Use templates for routine communications (daily updates, weekly reports)\n- Batch similar communications together\n- Flag urgent issues immediately — do not wait for the next scheduled update\n- Keep a running list of open questions for each client\n- Coordinate with team members before sending client communications to avoid duplicate or conflicting messages' },
  ];

  for (const gData of guidesData) {
    await prisma.guide.create({ data: gData });
  }
  console.log(`Created ${guidesData.length} guides`);

  console.log('Seeding complete!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
