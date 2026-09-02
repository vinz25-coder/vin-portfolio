import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";

import { useTheme } from "../../hooks/useTheme";
import ParticleText from "./ParticleText";

const jakartaTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const getJakartaTime = () =>
  jakartaTimeFormatter.format(new Date()).replace(".", ":");

export function Footer() {
  const { theme } = useTheme();
  const [localTime, setLocalTime] = useState(getJakartaTime);

  useEffect(() => {
    const updateTime = () => setLocalTime(getJakartaTime());
    let interval: number | undefined;
    const timeout = window.setTimeout(
      () => {
        updateTime();
        interval = window.setInterval(updateTime, 60_000);
      },
      60_000 - (Date.now() % 60_000),
    );

    return () => {
      window.clearTimeout(timeout);
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, []);

  return (
    <footer
      aria-label="Evindo Amanda footer"
      className="relative z-10 overflow-x-clip bg-transparent px-4 pt-8 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))] sm:px-[3vw] sm:pt-10 sm:pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] lg:pt-12"
    >
      <div className="relative mx-auto w-full pt-7 sm:pt-9 lg:pt-11">
        <p className="text-center text-[0.5625rem] font-medium tracking-[0.08em] text-text-secondary sm:text-[0.625rem]">
          © 2026 Evindo A. All rights reserved.
        </p>

        <div className="mt-0 h-[clamp(4.5rem,13vw,12rem)] w-full">
          <ParticleText
            className="font-display"
            text="EVINDO AMANDA."
            color={theme === "dark" ? "#f5f5f4" : "#43403e"}
            highlightColor={theme === "dark" ? "#e9333d" : "#e0a553"}
          />
        </div>

        <p className="mt-0 inline-flex items-center gap-2 text-[0.5625rem] font-semibold tracking-[0.12em] text-text-secondary uppercase lg:text-[0.625rem]">
          <Clock3
            aria-hidden="true"
            className="size-3 text-accent-500"
            strokeWidth={1.75}
          />
          <span>Indonesia</span>
          <time className="tabular-nums" dateTime={localTime}>
            {localTime} (GMT+7)
          </time>
        </p>
      </div>
    </footer>
  );
}
