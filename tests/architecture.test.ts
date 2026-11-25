import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { test } from "node:test";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = resolve(repositoryRoot, "src");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

function isWithin(directory: string, path: string): boolean {
  const pathFromDirectory = relative(directory, path);
  return (
    pathFromDirectory === "" ||
    (!pathFromDirectory.startsWith(`..${sep}`) && pathFromDirectory !== "..")
  );
}

function sourceModule(sourcePath: string): ts.SourceFile {
  return ts.createSourceFile(
    sourcePath,
    readFileSync(sourcePath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
}

function resolveImport(sourcePath: string, specifier: string): string | null {
  if (specifier.startsWith("@/"))
    return resolve(sourceRoot, specifier.slice(2));
  if (specifier.startsWith(".")) return resolve(dirname(sourcePath), specifier);
  return null;
}

function importedModules(sourcePath: string): string[] {
  const source = sourceModule(sourcePath);
  const imports: string[] = [];
  function visit(node: ts.Node): void {
    const [firstArgument] = ts.isCallExpression(node) ? node.arguments : [];
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      imports.push(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      firstArgument &&
      ts.isStringLiteral(firstArgument)
    ) {
      imports.push(firstArgument.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return imports;
}

function isClientModule(sourcePath: string): boolean {
  const [firstStatement] = sourceModule(sourcePath).statements;
  return Boolean(
    firstStatement &&
    ts.isExpressionStatement(firstStatement) &&
    ts.isStringLiteral(firstStatement.expression) &&
    firstStatement.expression.text === "use client",
  );
}

function resolveSourceFile(
  sourcePath: string,
  specifier: string,
  knownFiles: Set<string>,
): string | null {
  const unresolved = resolveImport(sourcePath, specifier);
  if (!unresolved) return null;
  const candidates = [
    unresolved,
    `${unresolved}.ts`,
    `${unresolved}.tsx`,
    `${unresolved}.mts`,
    resolve(unresolved, "index.ts"),
    resolve(unresolved, "index.tsx"),
  ];
  return candidates.find((candidate) => knownFiles.has(candidate)) ?? null;
}

function findImportCycles(files: string[]): string[][] {
  const knownFiles = new Set(files);
  const graph = new Map(
    files.map((file) => [
      file,
      importedModules(file)
        .map((specifier) => resolveSourceFile(file, specifier, knownFiles))
        .filter((dependency): dependency is string => dependency !== null),
    ]),
  );
  const visited = new Set<string>();
  const stack: string[] = [];
  const activeIndex = new Map<string, number>();
  const cycles = new Map<string, string[]>();

  function visit(file: string): void {
    visited.add(file);
    activeIndex.set(file, stack.length);
    stack.push(file);
    for (const dependency of graph.get(file) ?? []) {
      const cycleStart = activeIndex.get(dependency);
      if (cycleStart !== undefined) {
        const cycle = [...stack.slice(cycleStart), dependency];
        cycles.set(cycle.slice(0, -1).sort().join("|"), cycle);
      } else if (!visited.has(dependency)) {
        visit(dependency);
      }
    }
    stack.pop();
    activeIndex.delete(file);
  }

  for (const file of files) {
    if (!visited.has(file)) visit(file);
  }
  return [...cycles.values()];
}

test("source imports preserve SaafSky's application and domain boundaries", () => {
  // Preserve this existing public helper until its callers migrate to the feature API.
  const compatibilityEdges = new Set([
    "src/lib/air.ts -> ../features/recommendations/engine.ts",
  ]);
  const forbiddenTargets = [
    {
      owner: "src/lib",
      targets: [
        "src/app",
        "src/components",
        "src/features",
        "src/hooks",
        "src/server",
      ],
    },
    {
      owner: "src/features",
      targets: ["src/app", "src/components", "src/hooks", "src/server"],
    },
    { owner: "src/components", targets: ["src/app", "src/server"] },
    { owner: "src/hooks", targets: ["src/app", "src/server"] },
    {
      owner: "src/server",
      targets: ["src/app", "src/components", "src/hooks"],
    },
    {
      owner: "src/config",
      targets: [
        "src/app",
        "src/components",
        "src/features",
        "src/hooks",
        "src/lib",
        "src/server",
        "src/types",
      ],
    },
  ];
  const violations: string[] = [];
  const clientViolations: string[] = [];
  const files = sourceFiles(sourceRoot);
  const serverRoot = resolve(sourceRoot, "server");
  const clientOnlyPackages = ["@google/genai", "@upstash/redis"];

  for (const sourcePath of files) {
    const sourceRelative = relative(repositoryRoot, sourcePath)
      .split(sep)
      .join("/");
    const rule = forbiddenTargets.find(({ owner }) =>
      sourceRelative.startsWith(`${owner}/`),
    );
    for (const specifier of importedModules(sourcePath)) {
      const target = resolveImport(sourcePath, specifier);
      if (rule && target && isWithin(sourceRoot, target)) {
        const targetRelative = relative(repositoryRoot, target)
          .split(sep)
          .join("/");
        if (
          rule.targets.some((forbidden) =>
            targetRelative.startsWith(`${forbidden}/`),
          )
        ) {
          violations.push(`${sourceRelative} -> ${specifier}`);
        }
      }

      if (sourceRelative.startsWith("src/app/") && isClientModule(sourcePath)) {
        const importsServerCode = target && isWithin(serverRoot, target);
        const importsServerSdk = clientOnlyPackages.some(
          (packageName) =>
            specifier === packageName ||
            specifier.startsWith(`${packageName}/`),
        );
        if (importsServerCode || importsServerSdk) {
          clientViolations.push(`${sourceRelative} -> ${specifier}`);
        }
      }
    }
  }

  assert.deepEqual(
    violations.filter((edge) => !compatibilityEdges.has(edge)),
    [],
    "Move shared logic downward or inject server dependencies at route boundaries.",
  );
  assert.deepEqual(
    clientViolations,
    [],
    "Client-marked App Router modules must not import server code or server SDKs.",
  );
  const cycles = findImportCycles(files).map((cycle) =>
    cycle
      .map((file) => relative(repositoryRoot, file).split(sep).join("/"))
      .join(" -> "),
  );
  assert.deepEqual(cycles, [], "Keep the internal source graph acyclic.");
});
