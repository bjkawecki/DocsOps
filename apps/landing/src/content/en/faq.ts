export type FaqItem = {
  question: string;
  answer: string;
  /** Optional CTA after the answer; `to` is a LandingSlugKey (e.g. install). */
  link?: { to: string; label: string };
};

export const faqItems: FaqItem[] = [
  {
    question: 'Who is DocsOps for?',
    answer:
      'DocsOps is for organisations that need clarity on what applies and who owns it. The knowledge base should stay traceable even when many people contribute. It is less suitable when the main need is an open surface for co-writing and fixed ownership matters little.',
  },
  {
    question: 'What do I need to run it?',
    answer:
      'DocsOps runs on your infrastructure: you provide server, database, and backups and handle updates. There is no cloud subscription and no managed hosting from us. The application is source-available and stays under your control.',
  },
  {
    question: 'What does DocsOps cost?',
    answer:
      'The software is source-available and usable without seat fees. Your costs come from running and maintaining the instance – compute, storage, and time for updates.',
    link: { to: 'install', label: 'Installation guide' },
  },
  {
    question: 'Can I try DocsOps first?',
    answer:
      'Yes. The live demo shows the flow without your own setup. What you see there is not your knowledge base and is not meant for production documents. For use with your data and permissions you need your own install.',
  },
  {
    question: 'Are documents marked outdated automatically?',
    answer:
      'No. Age alone does not mean a document is wrong. Responsible leads see under Freshness where a decision is due and decide whether the state still holds, an update is needed, or the check should be repeated later.',
  },
];
