// Landing page (Figma page 04, node 23:3). One column below 900px, in Figma section order.
// No analytics, no third-party requests: fonts and images are self-hosted.
import { useState, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  Clock,
  FileText,
  LayoutGrid,
  Leaf,
  Link2,
  Lock,
  Mail,
  MinusCircle,
  Moon,
  Pill as PillIcon,
  PlusSquare,
  Share,
  ShieldCheck,
  Smartphone,
  Smile,
  User,
  Utensils,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/copy/en";

const L = t.landing;
const BASE = import.meta.env.BASE_URL;
const APP = `${BASE}app/`;
const REPO = "https://github.com/tanzir71/glucose-keeper-app";
const img = (name: string) => `${BASE}landing/${name}`;

function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-6 min-[900px]:px-10", className)}>{children}</div>;
}

function Section({ id, tone = "oat", children, className, labelledBy }: { id?: string; tone?: "oat" | "card" | "plum" | "moss"; children: ReactNode; className?: string; labelledBy?: string }) {
  const bg = { oat: "bg-background", card: "bg-card", plum: "bg-safety text-safety-foreground", moss: "bg-primary text-primary-foreground" }[tone];
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("scroll-mt-6 py-20 min-[900px]:py-[120px]", bg, className)}>
      {children}
    </section>
  );
}

function Overline({ children, light }: { children: ReactNode; light?: boolean }) {
  return <p className={cn("t-overline", light ? "text-safety-foreground/80" : "text-primary-strong")}>{children}</p>;
}

function H2({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  return (
    <h2 id={id} className={cn("mt-3 font-serif text-[2rem] font-semibold leading-[1.15] tracking-[-0.5px] min-[900px]:text-[3rem] min-[900px]:leading-[1.2]", className)}>
      {children}
    </h2>
  );
}

function Logo() {
  return (
    <a href={`${BASE}`} className="flex min-h-11 items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={L.nav.home}>
      <span aria-hidden className="grid grid-cols-2 gap-[3px]">
        <span className="h-3 w-3 rounded-[4px] bg-meal" />
        <span className="h-3 w-3 rounded-[4px] bg-sleep" />
        <span className="h-3 w-3 rounded-[4px] bg-move" />
        <span className="h-3 w-3 rounded-[4px] bg-feeling" />
      </span>
      <span className="font-serif text-[1.375rem] font-semibold tracking-[-0.3px]">Keeper</span>
    </a>
  );
}

function PillLink({ href, children, variant = "primary", className }: { href: string; children: ReactNode; variant?: "primary" | "card" | "light"; className?: string }) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex min-h-[54px] items-center justify-center rounded-full px-7 text-[0.9375rem] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "card" && "border border-border bg-card text-foreground hover:bg-muted",
        variant === "light" && "bg-card text-foreground hover:bg-card/90",
        className,
      )}
    >
      {children}
    </a>
  );
}

function Nav() {
  const links = [
    ["#how", L.nav.how],
    ["#features", L.nav.features],
    ["#fasting", L.nav.fasting],
    ["#safety", L.nav.safety],
    ["#faq", L.nav.faq],
  ] as const;
  return (
    <header className="bg-background">
      <Container className="flex items-center justify-between py-6 min-[900px]:py-9">
        <Logo />
        <nav aria-label={L.nav.menu} className="hidden items-center gap-8 min-[900px]:flex">
          {links.map(([href, label]) => (
            <a key={href} href={href} className="t-body text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {label}
            </a>
          ))}
        </nav>
        <PillLink href={APP} className="min-h-11 px-5 text-[0.875rem]">
          {L.nav.open}
        </PillLink>
      </Container>
    </header>
  );
}

function Hero() {
  const icons = [User, Wifi, ShieldCheck];
  return (
    <section className="overflow-hidden bg-background pb-16 pt-6 min-[900px]:pb-24 min-[900px]:pt-10" aria-labelledby="hero-title">
      <Container className="grid items-center gap-12 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        <div>
          <p className="t-label inline-flex items-center gap-2 rounded-full bg-primary-soft px-3.5 py-1.5 text-primary-strong">
            <Leaf aria-hidden className="h-4 w-4" /> {L.hero.pill}
          </p>
          <h1 id="hero-title" className="mt-6 font-serif text-[3rem] font-semibold leading-[1.02] tracking-[-1.5px] min-[900px]:text-[clamp(3.5rem,6.1vw,5.5rem)] min-[900px]:tracking-[-2.5px]">
            {L.hero.title1}
            <br />
            {L.hero.title2}
          </h1>
          <p className="t-body-l mt-6 max-w-[34rem] text-muted-foreground min-[900px]:text-[1.25rem] min-[900px]:leading-[1.75rem]">{L.hero.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PillLink href={APP}>{L.hero.start}</PillLink>
            <PillLink href="#how" variant="card">
              {L.hero.how}
            </PillLink>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            {L.hero.points.map((p, i) => {
              const Icon = icons[i];
              return (
                <li key={p} className="t-caption flex items-center gap-2 text-muted-foreground">
                  <Icon aria-hidden className="h-4 w-4 text-primary-strong" /> {p}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="mx-auto w-full max-w-[460px] min-[900px]:max-w-none">
          <img src={img("hero-today.png")} width={644} height={774} alt={L.hero.shotAlt} className="h-auto w-full" />
        </div>
      </Container>
    </section>
  );
}

function Problem() {
  return (
    <Section tone="card" labelledBy="problem-title">
      <Container>
        <Overline>{L.problem.overline}</Overline>
        <H2 id="problem-title" className="max-w-[54rem]">
          {L.problem.title}
        </H2>
        <p className="t-body-l mt-4 text-muted-foreground">{L.problem.sub}</p>
        <div className="mt-12 grid gap-6 min-[900px]:grid-cols-3">
          {L.problem.stats.map((s) => (
            <figure key={s.big} className="rounded-card-lg bg-background p-8">
              <p className="font-serif text-[2.5rem] font-semibold leading-tight text-primary">{s.big}</p>
              <p className="t-body-l mt-3">{s.body}</p>
              <figcaption className="t-caption mt-3 text-muted-foreground">
                <a href={s.href} className="underline-offset-4 hover:underline" rel="noopener noreferrer">
                  {s.source}
                </a>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </Section>
  );
}

const STEP_TONES = ["bg-meal-soft", "bg-feeling-soft", "bg-sleep-soft", "bg-primary-soft", "bg-primary-soft", "bg-primary-soft"];

function How() {
  return (
    <Section id="how" labelledBy="how-title">
      <Container>
        <Overline>{L.how.overline}</Overline>
        <H2 id="how-title" className="max-w-[54rem]">
          {L.how.title}
        </H2>
        <ol className="mt-14 grid grid-cols-2 items-end gap-4 min-[600px]:grid-cols-3 min-[900px]:grid-cols-6">
          {L.how.steps.map((s, i) => (
            <li
              key={s.name}
              // Each step sits a little higher than the last: a ladder you climb.
              className={cn("rounded-card-lg p-6 min-[900px]:mb-[var(--lift)]", STEP_TONES[i])}
              style={{ ["--lift" as string]: `${i * 24}px` }}
            >
              <p className={cn("font-serif text-[2rem] leading-none", i >= 3 ? "text-primary-strong" : "text-muted-foreground")}>{i + 1}</p>
              <h3 className="t-heading mt-3">{s.name}</h3>
              <p className="t-body mt-2 text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 grid gap-3 min-[900px]:grid-cols-2">
          <p className="t-label rounded-full bg-muted px-5 py-3 text-center text-muted-foreground">{L.how.low}</p>
          <p className="t-label rounded-full bg-primary px-5 py-3 text-center text-primary-foreground">{L.how.high}</p>
        </div>
      </Container>
    </Section>
  );
}

const FEATURE_ICONS: [LucideIcon, string][] = [
  [Utensils, "bg-meal-soft"],
  [Smile, "bg-feeling-soft"],
  [LayoutGrid, "bg-sleep-soft"],
  [Leaf, "bg-move-soft"],
  [Clock, "bg-water-soft"],
  [Moon, "bg-sleep-soft"],
  [Mail, "bg-primary-soft"],
  [FileText, "bg-muted"],
];

function Features() {
  return (
    <Section id="features" tone="card" labelledBy="features-title">
      <Container>
        <Overline>{L.features.overline}</Overline>
        <H2 id="features-title">
          {L.features.title1}
          <br />
          {L.features.title2}
        </H2>
        <ul className="mt-12 grid gap-5 min-[600px]:grid-cols-2 min-[900px]:grid-cols-4">
          {L.features.items.map((f, i) => {
            const [Icon, tone] = FEATURE_ICONS[i];
            return (
              <li key={f.title} className="rounded-card-lg bg-background p-6">
                <span className={cn("flex h-11 w-11 items-center justify-center rounded-[14px]", tone)}>
                  <Icon aria-hidden className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h3 className="t-heading mt-4">{f.title}</h3>
                <p className="t-body mt-2 text-muted-foreground">{f.body}</p>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}

function Spotlight({
  id,
  tone = "oat",
  overline,
  title,
  body,
  points,
  image,
  imageLeft,
}: {
  id: string;
  tone?: "oat" | "card";
  overline: string;
  title: string;
  body: string;
  points: readonly string[];
  image: { src: string; w: number; h: number; alt: string };
  imageLeft?: boolean;
}) {
  return (
    <Section id={id} tone={tone} labelledBy={`${id}-title`}>
      <Container className="grid items-center gap-12 min-[900px]:grid-cols-2 min-[900px]:gap-20">
        <div className={cn("mx-auto w-full max-w-[460px]", imageLeft ? "min-[900px]:order-1" : "min-[900px]:order-2")}>
          <img src={img(image.src)} width={image.w} height={image.h} alt={image.alt} loading="lazy" decoding="async" className="h-auto w-full" />
        </div>
        <div className={imageLeft ? "min-[900px]:order-2" : "min-[900px]:order-1"}>
          <Overline>{overline}</Overline>
          <H2 id={`${id}-title`}>{title}</H2>
          <p className="t-body-l mt-5 text-muted-foreground">{body}</p>
          <ul className="mt-6 space-y-4">
            {points.map((p) => (
              <li key={p} className="t-body-l flex gap-3">
                <span aria-hidden className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-strong">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}

const SAFETY_ICONS = [ShieldCheck, PillIcon, MinusCircle, Lock];

function Safety() {
  return (
    <Section id="safety" tone="plum" labelledBy="safety-title">
      <Container>
        <Overline light>{L.safety.overline}</Overline>
        <H2 id="safety-title">{L.safety.title}</H2>
        <p className="t-body-l mt-3 text-safety-foreground/85">{L.safety.sub}</p>
        <ul className="mt-12 grid gap-5 min-[600px]:grid-cols-2 min-[900px]:grid-cols-4">
          {L.safety.items.map((s, i) => {
            const Icon = SAFETY_ICONS[i];
            return (
              <li key={s.title} className="rounded-card-lg bg-safety-foreground/[0.12] p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-safety-foreground text-safety">
                  <Icon aria-hidden className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h3 className="t-heading mt-4">{s.title}</h3>
                <p className="t-body mt-2 text-safety-foreground/85">{s.body}</p>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}

const TAG_TONES = ["bg-primary-soft", "bg-move-soft", "bg-feeling-soft", "bg-feeling-soft", "bg-sleep-soft"];

function Research() {
  return (
    <Section id="research" tone="card" labelledBy="research-title">
      <Container>
        <Overline>{L.research.overline}</Overline>
        <H2 id="research-title" className="max-w-[44rem]">
          {L.research.title}
        </H2>
        <ul className="mt-10 flex flex-wrap gap-2" aria-label={L.research.overline}>
          {L.research.tags.map((tag, i) => (
            <li key={tag} className={cn("t-label rounded-full px-3.5 py-2", TAG_TONES[i])}>
              {tag}
            </li>
          ))}
        </ul>
        <ul className="mt-10 flex flex-wrap gap-2.5">
          {L.research.sources.map((s) => (
            <li key={s.label}>
              <a href={s.href} rel="noopener noreferrer" className="t-label inline-flex min-h-11 items-center rounded-full bg-background px-4 text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

const STEP_ICONS = [Link2, Share, PlusSquare];
const DATA_ICONS = [User, Smartphone, Wifi, FileText];

function Install() {
  return (
    <Section id="privacy" labelledBy="install-title">
      <Container className="grid items-start gap-12 min-[900px]:grid-cols-[1fr_minmax(0,520px)] min-[900px]:gap-20">
        <div>
          <Overline>{L.install.overline}</Overline>
          <H2 id="install-title">
            {L.install.title1}
            <br />
            {L.install.title2}
          </H2>
          <p className="t-body-l mt-5 text-muted-foreground">{L.install.body}</p>
          <ol className="mt-6 space-y-3">
            {L.install.steps.map((s, i) => {
              const Icon = STEP_ICONS[i];
              return (
                <li key={s} className="t-body-strong flex items-center gap-4 rounded-card bg-card p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-primary-soft text-primary-strong">
                    <Icon aria-hidden className="h-5 w-5" />
                  </span>
                  {s}
                </li>
              );
            })}
          </ol>
        </div>
        <div className="rounded-card-lg bg-primary-soft p-7">
          <h3 className="t-heading">{L.install.dataTitle}</h3>
          <ul className="mt-5 space-y-4">
            {L.install.data.map((d, i) => {
              const Icon = DATA_ICONS[i];
              return (
                <li key={d.title} className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-card">
                    <Icon aria-hidden className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="t-body-strong block">{d.title}</span>
                    <span className="t-body text-muted-foreground">{d.body}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </Section>
  );
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <Section id="faq" tone="card" labelledBy="faq-title">
      <Container>
        <Overline>{L.faq.overline}</Overline>
        <H2 id="faq-title">{L.faq.title}</H2>
        <ul className="mt-10 space-y-3">
          {L.faq.items.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={f.q} className="rounded-card bg-background">
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex min-h-14 w-full items-center justify-between gap-4 rounded-card px-6 py-4 text-left font-serif text-[1.125rem] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {f.q}
                    <ChevronDown aria-hidden className={cn("h-5 w-5 shrink-0 transition-transform", isOpen && "rotate-180")} />
                  </button>
                </h3>
                <div id={`faq-${i}`} hidden={!isOpen} className="t-body px-6 pb-5 text-muted-foreground">
                  {f.a}
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}

function Cta() {
  return (
    <Section tone="moss" labelledBy="cta-title" className="text-center">
      <Container>
        <h2 id="cta-title" className="font-serif text-[2.5rem] font-semibold leading-[1.1] tracking-[-1px] min-[900px]:text-[3.5rem]">
          {L.cta.title1}
          <br />
          {L.cta.title2}
        </h2>
        <p className="t-body-l mt-5 text-primary-foreground/90">{L.cta.body}</p>
        <PillLink href={APP} variant="light" className="mt-8">
          {L.cta.button}
        </PillLink>
      </Container>
    </Section>
  );
}

function Footer() {
  const links = [
    ["#privacy", L.footer.links.privacy],
    ["#research", L.footer.links.research],
    [REPO, L.footer.links.github],
    [`${REPO}/issues`, L.footer.links.contact],
  ] as const;
  return (
    <footer className="bg-background py-12">
      <Container>
        <div className="flex flex-col gap-4 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between">
          <Logo />
          <nav aria-label={L.nav.footer}>
            <ul className="flex flex-wrap gap-x-8 gap-y-2">
              {links.map(([href, label]) => (
                <li key={label}>
                  <a href={href} className="t-body inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground" {...(href.startsWith("http") ? { rel: "noopener noreferrer" } : {})}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="t-caption mt-6 max-w-[64rem] text-muted-foreground">{L.footer.disclaimer}</p>
        <p className="t-caption mt-4 text-muted-foreground">{L.footer.hosted}</p>
      </Container>
    </footer>
  );
}

export default function Landing() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-card focus:px-4 focus:py-2">
        {L.nav.skip}
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <Problem />
        <How />
        <Features />
        <Spotlight
          id="sealed"
          overline={L.sealed.overline}
          title={L.sealed.title}
          body={L.sealed.body}
          points={L.sealed.points}
          image={{ src: "sealed.png", w: 540, h: 760, alt: L.sealed.shotAlt }}
          imageLeft
        />
        <Spotlight
          id="habits"
          tone="card"
          overline={L.habits.overline}
          title={L.habits.title}
          body={L.habits.body}
          points={L.habits.points}
          image={{ src: "tiny-habits.png", w: 580, h: 792, alt: L.habits.shotAlt }}
        />
        <Spotlight
          id="fasting"
          overline={L.fasting.overline}
          title={L.fasting.title}
          body={L.fasting.body}
          points={L.fasting.points}
          image={{ src: "fasting.png", w: 580, h: 792, alt: L.fasting.shotAlt }}
          imageLeft
        />
        <Safety />
        <Research />
        <Install />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
