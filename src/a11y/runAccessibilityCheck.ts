export async function runAccessibilityCheck(rootElement: HTMLElement) {
  const [{ default: axe }, { logToConsole }] = await Promise.all([
    import("axe-core"),
    import("@axe-core/react"),
  ]);
  const results = await axe.run(rootElement);

  if (results.violations.length > 0) {
    logToConsole(results);
  }
}
