export async function register() {
  if (
    process.env.NEXT_RUNTIME === "edge" ||
    (process.env.NODE_ENV === "production" && process.env.DEMO_SEED_ON_STARTUP !== "true")
  ) {
    return;
  }

  try {
    const { ensureSeededDemoAccounts } = await import("@/lib/demo-accounts");
    await ensureSeededDemoAccounts();
  } catch (error) {
    console.error("[SynapseOS demo auth] failed to seed demo accounts", error);
  }
}
