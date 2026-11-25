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

function resolveImport(sourcePath: string, specifier: string): string | null {
  if (specifier.startsWith("@/"))
    return resolve(sourceRoot, specifier.slice(2));
  if (specifier.startsWith(".")) return resolve(dirname(sourcePath), specifier);
  return null;
}

function importedModules(sourcePath: string): string[] {
  const source = ts.createSourceFile(
    sourcePath,
    readFileSync(sourcePath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
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
  ];
  const violations: string[] = [];

  for (const sourcePath of sourceFiles(sourceRoot)) {
    const sourceRelative = relative(repositoryRoot, sourcePath)
      .split(sep)
      .join("/");
    const rule = forbiddenTargets.find(({ owner }) =>
      sourceRelative.startsWith(`${owner}/`),
    );
    if (!rule) continue;

    for (const specifier of importedModules(sourcePath)) {
      const target = resolveImport(sourcePath, specifier);
      if (!target || !isWithin(sourceRoot, target)) continue;
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
  }

  assert.deepEqual(
    violations.filter((edge) => !compatibilityEdges.has(edge)),
    [],
    "Move shared logic downward or inject server dependencies at route boundaries.",
  );
});
