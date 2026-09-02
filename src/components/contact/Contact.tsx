import { ArrowUpRight, Send } from "lucide-react";
import { motion } from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  siGithub,
  siGmail,
  siInstagram,
  siTelegram,
  siWhatsapp,
  siX,
  type SimpleIcon,
} from "simple-icons";

import { socialLinks } from "../../data/social-links";
import { useLanguage } from "../../hooks/useLanguage";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { EASE_OUT_EXPO } from "../../motion/constants";

const projectTypeValues = [
  "web-product",
  "dashboard",
  "frontend-implementation",
  "other",
] as const;

type ProjectType = (typeof projectTypeValues)[number];
type FieldName = "name" | "email" | "projectType" | "message";
type FieldErrors = Partial<Record<FieldName, string>>;
type SubmissionStatus =
  | "idle"
  | "submitting"
  | "success"
  | "error"
  | "unavailable";

interface DirectLink {
  id: "email" | "whatsapp" | "telegram" | "github" | "x" | "instagram";
  label: string;
  value: string;
  href: string;
  icon: SimpleIcon;
  brandColor: string;
}

interface DirectLinkStyle extends CSSProperties {
  "--contact-brand": string;
}

const initialForm = {
  name: "",
  email: "",
  projectType: "",
  message: "",
  website: "",
};

const inputClassName =
  "contact-field mt-1.5 w-full rounded-xl border border-border bg-[color-mix(in_srgb,var(--color-surface)_34%,transparent)] px-3.5 py-3 text-sm text-text-primary outline-none placeholder:text-[color-mix(in_srgb,var(--color-text-secondary)_62%,transparent)] focus:border-accent-500 focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-accent-500)_18%,transparent)]";

export function Contact() {
  const { copy, language } = useLanguage();
  const prefersReducedMotion = usePrefersReducedMotion();
  const mainRef = useRef<HTMLElement>(null);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const contactCopy = copy.contact;

  useEffect(() => {
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, []);

  const projectOptions: readonly [ProjectType, string][] = [
    ["web-product", contactCopy.projectTypes.webProduct],
    ["dashboard", contactCopy.projectTypes.dashboard],
    [
      "frontend-implementation",
      contactCopy.projectTypes.frontendImplementation,
    ],
    ["other", contactCopy.projectTypes.other],
  ];

  const validate = () => {
    const nextErrors: FieldErrors = {};

    if (!form.name.trim()) nextErrors.name = contactCopy.validation.name;
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      nextErrors.email = contactCopy.validation.email;
    }
    if (!projectTypeValues.includes(form.projectType as ProjectType)) {
      nextErrors.projectType = contactCopy.validation.projectType;
    }
    if (form.message.trim().length < 20) {
      nextErrors.message = contactCopy.validation.message;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate() || status === "submitting") return;

    setStatus("submitting");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as {
          code?: string;
        } | null;
        setStatus(
          result?.code === "DELIVERY_UNAVAILABLE" ? "unavailable" : "error",
        );
        return;
      }
      setForm(initialForm);
      setErrors({});
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const setField = (field: FieldName | "website", value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (field !== "website" && errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
    if (status !== "idle") setStatus("idle");
  };

  const whatsappHref = `https://wa.me/628999925053?text=${encodeURIComponent(contactCopy.whatsappMessage)}`;
  const directLinks = [
    {
      id: "email",
      label: "Email",
      value: "evindoamandariza@gmail.com",
      href: socialLinks.find(({ platform }) => platform === "email")?.href,
      icon: siGmail,
      brandColor: "#EA4335",
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      value: "+62 899-9925-053",
      href: whatsappHref,
      icon: siWhatsapp,
      brandColor: "#25D366",
    },
    {
      id: "telegram",
      label: "Telegram",
      value: "@yeahvnz",
      href: "https://t.me/yeahvnz",
      icon: siTelegram,
      brandColor: "#26A5E4",
    },
    {
      id: "github",
      label: "GitHub",
      value: "vinz25-coder",
      href: socialLinks.find(({ platform }) => platform === "github")?.href,
      icon: siGithub,
      brandColor: "#181717",
    },
    {
      id: "x",
      label: "X",
      value: "@yhvnz_",
      href: socialLinks.find(({ platform }) => platform === "x")?.href,
      icon: siX,
      brandColor: "#000000",
    },
    {
      id: "instagram",
      label: "Instagram",
      value: "@evindoamanda_",
      href: socialLinks.find(({ platform }) => platform === "instagram")?.href,
      icon: siInstagram,
      brandColor: "#E4405F",
    },
  ].filter((link): link is DirectLink => Boolean(link.href));

  return (
    <main
      ref={mainRef}
      id="contact-main"
      tabIndex={-1}
      className="relative z-10 outline-none"
    >
      <section
        aria-labelledby="contact-heading"
        className="min-h-svh bg-transparent px-5 pt-28 pb-16 sm:px-12 sm:pt-32 sm:pb-20 lg:px-[10vw] lg:pt-36 lg:pb-24"
      >
        <div className="mx-auto grid w-full max-w-[82rem] gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(26rem,0.82fr)] lg:items-start lg:gap-[clamp(2.5rem,4vw,4rem)]">
          <motion.div
            className="min-w-0"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.6,
              ease: EASE_OUT_EXPO,
            }}
          >
            <p className="contact-section-label inline-flex cursor-default text-[0.6875rem] tracking-[0.32em] uppercase sm:text-xs">
              <span className="contact-label-part">{contactCopy.eyebrow}</span>
            </p>
            <h1
              id="contact-heading"
              className="contact-heading mt-4 max-w-[10ch] overflow-wrap-normal font-display text-[clamp(3.1rem,11.5vw,5.25rem)] leading-[0.9] font-bold tracking-[-0.05em] uppercase lg:text-[clamp(4.25rem,5.5vw,6.5rem)]"
            >
              {contactCopy.heading.before}{" "}
              <span className="text-accent-500">
                {contactCopy.heading.accent}
              </span>
            </h1>
            <p className="mt-6 max-w-[32rem] text-[0.9375rem] leading-relaxed text-text-secondary sm:text-base">
              {contactCopy.introduction}
            </p>

            <div className="mt-10 lg:mt-12">
              <h2 className="text-xs font-semibold tracking-[0.24em] text-text-secondary uppercase">
                {contactCopy.directHeading}
              </h2>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {directLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      link.href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    data-brand={link.id}
                    style={
                      { "--contact-brand": link.brandColor } as DirectLinkStyle
                    }
                    className="contact-direct-link group grid min-h-[4.5rem] grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border px-3.5 py-3 text-sm outline-none"
                  >
                    <span
                      aria-hidden="true"
                      data-testid={`contact-icon-${link.label.toLowerCase()}`}
                      className="contact-direct-icon flex size-10 items-center justify-center rounded-xl"
                    >
                      <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
                        <path d={link.icon.path} />
                      </svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.625rem] font-bold tracking-[0.16em] text-text-secondary uppercase">
                        {link.label}
                      </span>
                      <span className="mt-0.5 block truncate text-xs font-medium text-text-primary sm:text-[0.8125rem]">
                        {link.value}
                      </span>
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="contact-direct-arrow size-4"
                      strokeWidth={1.7}
                    />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.65,
              delay: prefersReducedMotion ? 0 : 0.08,
              ease: EASE_OUT_EXPO,
            }}
            className="contact-form-panel w-full self-start rounded-[1.25rem] border border-border p-4 min-[360px]:p-5 sm:p-6 lg:max-w-[35rem] lg:justify-self-end lg:p-6"
          >
            <div className="border-b border-border pb-4">
              <h2 className="font-display text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
                {contactCopy.formHeading}
              </h2>
            </div>

            <form
              className="mt-5 grid gap-4"
              noValidate
              onSubmit={(event) => void handleSubmit(event)}
            >
              <div>
                <label htmlFor="contact-name" className="text-sm font-semibold">
                  {contactCopy.fields.name}
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  maxLength={80}
                  value={form.name}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={
                    errors.name ? "contact-name-error" : undefined
                  }
                  className={inputClassName}
                  placeholder={contactCopy.fields.namePlaceholder}
                  onChange={(event) => setField("name", event.target.value)}
                />
                {errors.name ? (
                  <p
                    id="contact-name-error"
                    className="mt-2 text-sm text-accent-600"
                  >
                    {errors.name}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="text-sm font-semibold"
                >
                  {contactCopy.fields.email}
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  maxLength={254}
                  value={form.email}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={
                    errors.email ? "contact-email-error" : undefined
                  }
                  className={inputClassName}
                  placeholder={contactCopy.fields.emailPlaceholder}
                  onChange={(event) => setField("email", event.target.value)}
                />
                {errors.email ? (
                  <p
                    id="contact-email-error"
                    className="mt-2 text-sm text-accent-600"
                  >
                    {errors.email}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="contact-project-type"
                  className="text-sm font-semibold"
                >
                  {contactCopy.fields.projectType}
                </label>
                <select
                  id="contact-project-type"
                  name="projectType"
                  value={form.projectType}
                  aria-invalid={Boolean(errors.projectType)}
                  aria-describedby={
                    errors.projectType
                      ? "contact-project-type-error"
                      : undefined
                  }
                  className={inputClassName}
                  onChange={(event) =>
                    setField("projectType", event.target.value)
                  }
                >
                  <option value="">
                    {contactCopy.fields.projectPlaceholder}
                  </option>
                  {projectOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {errors.projectType ? (
                  <p
                    id="contact-project-type-error"
                    className="mt-2 text-sm text-accent-600"
                  >
                    {errors.projectType}
                  </p>
                ) : null}
              </div>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor="contact-message"
                    className="text-sm font-semibold"
                  >
                    {contactCopy.fields.message}
                  </label>
                  <span className="text-xs text-text-secondary tabular-nums">
                    {form.message.length}/2000
                  </span>
                </div>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={4}
                  maxLength={2000}
                  value={form.message}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={
                    errors.message ? "contact-message-error" : undefined
                  }
                  className={`${inputClassName} min-h-28 resize-y`}
                  placeholder={contactCopy.fields.messagePlaceholder}
                  onChange={(event) => setField("message", event.target.value)}
                />
                {errors.message ? (
                  <p
                    id="contact-message-error"
                    className="mt-2 text-sm text-accent-600"
                  >
                    {errors.message}
                  </p>
                ) : null}
              </div>

              <div className="absolute -left-[9999px]" aria-hidden="true">
                <label htmlFor="contact-website">Website</label>
                <input
                  id="contact-website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={(event) => setField("website", event.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={status === "submitting"}
                className="hero-cta hero-cta-primary inline-flex min-h-12 w-full items-center justify-center gap-2.5 border border-accent-500 px-5 text-xs font-bold tracking-[0.14em] text-accent-ink uppercase disabled:cursor-wait disabled:opacity-70"
              >
                {status === "submitting"
                  ? contactCopy.submitting
                  : contactCopy.submit}
                <Send aria-hidden="true" className="size-4" strokeWidth={1.8} />
              </button>

              {status === "success" ? (
                <p
                  role="status"
                  className="text-sm leading-relaxed text-text-primary"
                >
                  {contactCopy.success}
                </p>
              ) : null}
              {status === "error" ? (
                <p
                  role="alert"
                  className="text-sm leading-relaxed text-accent-600"
                >
                  {contactCopy.error}
                </p>
              ) : null}
              {status === "unavailable" ? (
                <p
                  role="alert"
                  className="text-sm leading-relaxed text-accent-600"
                >
                  {contactCopy.deliveryUnavailable}
                </p>
              ) : null}
              <p className="text-xs leading-relaxed text-text-secondary">
                {contactCopy.privacy}
              </p>
              <input type="hidden" name="language" value={language} />
            </form>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
