export type Concept = {
  code: string;
  title: string;
  subtitle: string;
  body: string;
  boundary: string;
};

export type FlowStep = {
  label: string;
  actor: string;
  action: string;
  before: string;
  after: string;
  detail: string;
  signal: string;
};

export type DataZone = {
  code: string;
  name: string;
  kind: string;
  owner: string;
  value: string;
  mutation: string;
  rule: string;
};

export type DataRoute = {
  data: string;
  from: string;
  via: string;
  to: string;
  guarantee: string;
};

export type InterviewQuestion = {
  tag: string;
  question: string;
  answer: string;
};

export type LessonDetail = {
  number: string;
  stage: number;
  title: string;
  shortTitle: string;
  english: string;
  hook: string;
  lead: string;
  outcome: string;
  accent: "cyan" | "amber" | "green" | "red";
  concepts: Concept[];
  flowTitle: string;
  flowLead: string;
  flow: FlowStep[];
  zones: DataZone[];
  routes: DataRoute[];
  sourceKeys: string[];
  exercise: {
    title: string;
    summary: string;
    requirements: string[];
    testCommand: string;
    expected: string;
  };
  runClass: string;
  interview: InterviewQuestion[];
  finish: string;
};

export type CourseTab = {
  number: string;
  stage: number;
  shortTitle: string;
  title: string;
};
