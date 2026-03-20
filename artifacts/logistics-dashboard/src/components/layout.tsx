import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Truck,
  Boxes,
  BarChart3,
  RadioReceiver,
  ShieldAlert,
  MapPin,
  Network,
  ScanLine,
  Users
} from "lucide-react";
import { motion } from "framer-motion";

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Command Center", icon: LayoutDashboard },
    { href: "/shipments", label: "Active Shipments", icon: Package },
    { href: "/fleet", label: "Fleet Telemetry", icon: Truck },
    { href: "/inventory", label: "Supply Cache", icon: Boxes },
    { href: "/analytics", label: "Intelligence", icon: BarChart3 },
    { href: "/yard", label: "Yard Control", icon: MapPin },
    { href: "/fragmentation", label: "Net Optimizer", icon: Network },
    { href: "/verification", label: "Verification", icon: ScanLine },
    { href: "/workforce", label: "Workforce", icon: Users },
  ];

  return (
    <div className="min-h-screen flex bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 glass-panel border-r border-y-0 border-l-0 rounded-none flex flex-col z-20 shrink-0">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3 text-primary">
            <div className="relative flex items-center justify-center">
              <img
                src="/images/Meridian-Logo.png"
                alt="Meridian Logo"
                className="w-16 h-16 object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]"
              />
              <span className="absolute top-0 -right-1 w-2.5 h-2.5 bg-primary rounded-full animate-ping" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-widest text-glow leading-none">MERIDIAN</h1>
              <p className="text-[10px] font-mono tracking-widest uppercase text-primary/70 mt-1">Logistics Control Tower</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg font-semibold tracking-wider uppercase text-xs transition-all duration-300 relative overflow-hidden group",
                  isActive
                    ? "text-primary bg-primary/10 border border-primary/30 box-glow"
                    : "text-muted-foreground hover:text-foreground hover:bg-card border border-transparent"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                  />
                )}
                <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary/70 transition-colors")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-destructive uppercase tracking-wider mb-1">Platform Health</p>
              <p className="text-[10px] font-mono text-muted-foreground leading-relaxed">All core services are online. API and database connections are healthy.</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content wrapper */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <header className="h-16 glass-panel border-b border-x-0 border-t-0 rounded-none flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_hsl(var(--accent))]" />
            <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase">Live Connection Established</span>
          </div>
          <div className="font-mono text-xs text-primary/70 tracking-widest bg-primary/5 px-3 py-1 rounded border border-primary/20">
            {new Date().toISOString().split('T')[0]} // SYS_TIME
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 relative z-0">
          {children}
        </div>
      </main>
    </div>
  );
}
