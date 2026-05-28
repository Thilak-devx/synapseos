import { DatabaseZap, FileCode2, ListTree, ScrollText } from "lucide-react";
import { requireRole } from "@/lib/auth-guards";
import { getAcademicDbmsDemo } from "@/services/dbms-academic.service";

const featureCards = [
  {
    icon: DatabaseZap,
    title: "Trigger",
    description:
      "Automatically writes into audit_logs whenever a new row is inserted into the PostgreSQL User table.",
  },
  {
    icon: FileCode2,
    title: "Stored Procedures",
    description:
      "Reusable PostgreSQL routines return dashboard statistics and system monitoring summaries.",
  },
  {
    icon: ListTree,
    title: "Cursor",
    description:
      "Processes user records row-by-row and logs each processed record for academic demonstration.",
  },
];

export default async function DbmsFeaturesPage() {
  await requireRole(["ADMIN"], "/dashboard/dbms-features");
  const demo = await getAcademicDbmsDemo();

  return (
    <main className="space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="rounded-3xl border border-cyan-500/10 bg-[#08111f] p-6 shadow-[0_0_24px_rgba(34,211,238,0.08)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-cyan-300">
              DBMS academic showcase
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              Triggers, Stored Procedures, and Cursors
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              This page demonstrates advanced PostgreSQL concepts added safely outside the
              Prisma schema. Use it during evaluation to explain where SynapseOS implements
              database-level automation and reusable routines.
            </p>
          </div>
          <a
            className="inline-flex items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-500/15"
            href="/api/admin/dbms-features"
          >
            Open JSON demo
          </a>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {featureCards.map((feature) => (
          <article
            className="rounded-2xl border border-white/10 bg-[#0b1220] p-5 shadow-[0_0_18px_rgba(34,211,238,0.05)]"
            key={feature.title}
          >
            <feature.icon className="h-5 w-5 text-cyan-300" />
            <h2 className="mt-4 text-lg font-semibold text-white">{feature.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-[#0b1220] p-5">
          <p className="font-mono text-xs uppercase tracking-[0.26em] text-slate-500">
            get_dashboard_statistics()
          </p>
          <div className="mt-5 space-y-4">
            <Metric label="Total users" value={demo.statistics.totalUsers} />
            <Metric label="Active users" value={demo.statistics.activeUsers} />
            <Metric label="Reports count" value={demo.statistics.reportsCount} />
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#0b1220] p-5">
          <p className="font-mono text-xs uppercase tracking-[0.26em] text-slate-500">
            get_system_monitoring_summary()
          </p>
          <div className="mt-5 space-y-4">
            <Metric label="Uptime" value={demo.monitoring.uptime} />
            <Metric label="Alerts" value={demo.monitoring.alerts} />
            <Metric label="Transactions" value={demo.monitoring.transactionsCount} />
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#0b1220] p-5">
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-cyan-300" />
            <p className="font-mono text-xs uppercase tracking-[0.26em] text-slate-500">
              audit_logs
            </p>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            New users and cursor demo runs appear here without changing existing app tables.
          </p>
          <form action="/api/admin/dbms-features" className="mt-4" method="post">
            <button
              className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100"
              type="submit"
            >
              Run cursor demo via API
            </button>
          </form>
        </article>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0b1220] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.26em] text-cyan-300">
              Latest trigger/cursor audit rows
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">Academic audit log table</h2>
          </div>
          <code className="hidden rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-slate-400 sm:block">
            public.audit_logs
          </code>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-slate-300">
              {demo.auditLogs.length ? (
                demo.auditLogs.map((log) => (
                  <tr className="bg-white/[0.01]" key={log.id}>
                    <td className="px-4 py-3">{log.action}</td>
                    <td className="px-4 py-3 font-mono text-xs text-cyan-200">{log.username}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {new Date(log.createdAt).toLocaleString("en-US")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={3}>
                    No academic audit rows yet. Create a user or run the cursor API demo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="font-mono text-sm font-semibold text-cyan-100">{value}</span>
    </div>
  );
}
