import autocannon from "autocannon";

const baseURL = process.env.PERF_BASE_URL ?? "http://127.0.0.1:8080";
const p95MaxMs = Number(process.env.PERF_P95_MAX_MS ?? "250");

async function probe() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    const resp = await fetch(`${baseURL}/health`, { signal: controller.signal });
    return resp.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function runCase(name, opts) {
  const result = await autocannon({
    url: opts.url,
    method: opts.method ?? "GET",
    headers: opts.headers ?? {},
    body: opts.body,
    duration: opts.duration ?? 5,
    connections: opts.connections ?? 20,
    pipelining: opts.pipelining ?? 1,
  });

  const p95 = result.latency?.p95;
  const errors = (result.errors ?? 0) + (result.timeouts ?? 0) + (result.non2xx ?? 0);
  const msg = `[perf] ${name}: p95=${p95}ms errors=${errors} rps=${result.requests?.average}`;
  // eslint-disable-next-line no-console
  console.log(msg);

  if (errors > 0) throw new Error(`${name} has errors/timeouts/non2xx (${errors})`);
  if (typeof p95 === "number" && p95 > p95MaxMs) {
    throw new Error(`${name} p95 ${p95}ms exceeds threshold ${p95MaxMs}ms`);
  }
}

async function main() {
  const ok = await probe();
  if (!ok) {
    if (process.env.CI) throw new Error(`perf probe failed: ${baseURL}/health not reachable`);
    // eslint-disable-next-line no-console
    console.log(`[perf] skip: ${baseURL} not reachable (set PERF_BASE_URL or start server)`);
    return;
  }

  await runCase("health", { url: `${baseURL}/health`, method: "GET" });
  await runCase("verify-code", {
    url: `${baseURL}/rpc/auth/verify-code`,
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "perf@openzoo.ai", code: "123456" }),
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err?.stack || String(err));
  process.exitCode = 1;
});

