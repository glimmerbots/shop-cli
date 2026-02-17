const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function printUsage() {
  // Intentionally minimal so it stays readable in npm output.
  console.log(
    [
      "Usage:",
      "  npm run schema:admin -- <YYYY-MM>",
      "  npm run schema:admin -- --version <YYYY-MM>",
      "",
      "Example:",
      "  npm run schema:admin -- 2026-04",
    ].join("\n"),
  );
}

function parseVersion(argv) {
  if (argv.includes("--help") || argv.includes("-h")) return { help: true };

  const equalsArg = argv.find((arg) => arg.startsWith("--version="));
  if (equalsArg) return { version: equalsArg.slice("--version=".length) };

  const versionFlagIndex = argv.findIndex(
    (arg) => arg === "--version" || arg === "-v",
  );
  if (versionFlagIndex !== -1) {
    const version = argv[versionFlagIndex + 1];
    return { version };
  }

  const [first] = argv;
  return { version: first };
}

function getRoverPath() {
  const roverBin = process.platform === "win32" ? "rover.cmd" : "rover";
  return path.join(process.cwd(), "node_modules", ".bin", roverBin);
}

function main() {
  const { help, version } = parseVersion(process.argv.slice(2));
  if (help) {
    printUsage();
    return;
  }

  if (!version) {
    printUsage();
    process.exitCode = 2;
    return;
  }

  const endpoint = `https://shopify.dev/admin-graphql-direct-proxy/${version}`;
  const schemaDir = path.join(process.cwd(), "schema");
  const outputFile = path.join(schemaDir, `${version}.graphql`);

  fs.mkdirSync(schemaDir, { recursive: true });

  const roverPath = getRoverPath();
  if (!fs.existsSync(roverPath)) {
    console.error(
      `Could not find rover binary at ${roverPath}. Did you run \`npm ci\`?`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(`Introspecting ${endpoint}`);
  console.log(`Writing schema to ${path.relative(process.cwd(), outputFile)}`);

  const result = spawnSync(
    roverPath,
    ["graph", "introspect", endpoint, "--output", outputFile],
    { stdio: "inherit" },
  );

  if (result.error) {
    console.error(result.error);
    process.exitCode = 1;
    return;
  }

  process.exitCode = result.status ?? 1;
}

main();
