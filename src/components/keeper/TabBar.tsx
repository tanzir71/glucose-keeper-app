import { NavLink } from "react-router-dom";
import { BookOpen, LayoutGrid, Sun, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/copy/en";

const ITEMS = [
  { to: "/", label: t.tabs.today, Icon: Sun, end: true },
  { to: "/week", label: t.tabs.week, Icon: LayoutGrid, end: false },
  { to: "/learn", label: t.tabs.learn, Icon: BookOpen, end: false },
  { to: "/you", label: t.tabs.you, Icon: User, end: false },
] as const;

/** Figma TabBar 5:166. Card background, 1px top border, 4 items, home-indicator safe area. */
export function TabBar() {
  return (
    <nav
      aria-label={t.tabs.nav}
      className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-app border-t border-border bg-card"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
    >
      <ul className="flex items-start justify-around px-3 pt-2">
        {ITEMS.map(({ to, label, Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className="group flex w-[72px] flex-col items-center gap-1 rounded-2xl py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex h-8 w-[60px] items-center justify-center rounded-full transition-colors",
                      isActive && "bg-primary-soft",
                    )}
                  >
                    <Icon
                      aria-hidden
                      className={cn("h-[22px] w-[22px]", isActive ? "text-primary-strong" : "text-muted-foreground")}
                      strokeWidth={1.8}
                    />
                  </span>
                  <span className={isActive ? "t-label text-primary-strong" : "t-caption text-muted-foreground"}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
