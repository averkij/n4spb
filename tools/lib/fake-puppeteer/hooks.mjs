export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'puppeteer-core') return { url: new URL('./fake.mjs', import.meta.url).href, shortCircuit: true };
  return nextResolve(specifier, context);
}
