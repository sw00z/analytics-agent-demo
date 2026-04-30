// Runs once when the Next.js server boots, before any request is handled.
// See https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
export function register() {
  console.log(`[instrumentation] NODE_ENV=${process.env.NODE_ENV}`);
}
