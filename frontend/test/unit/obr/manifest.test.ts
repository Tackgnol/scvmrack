import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const version = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")).version as string;

describe.each(["manifest.json", "manifest.local.json"])("Owlbear release artifact %s", (file) => {
  it("advertises the app release and loads existing extension assets with a release cache key", () => {
    const manifest = JSON.parse(readFileSync(resolve(root, "static", file), "utf8"));
    expect(manifest.version).toBe(version);
    expect(manifest.manifest_version).toBe(1);
    expect(manifest.action).toMatchObject({ width: 420, height: 600 });
    for (const asset of [manifest.icon, manifest.action.icon, manifest.action.popover]) {
      const url = new URL(asset, "https://scvmrack.example");
      expect(existsSync(resolve(root, "static", url.pathname.slice(1))) || url.pathname === "/obr.html").toBe(true);
    }
    const panel = new URL(manifest.action.popover, "https://scvmrack.example");
    expect(panel.pathname).toBe("/obr.html");
    expect(panel.searchParams.get("v")).toMatch(new RegExp(`-${version.replace(/\./g, "")}$`));
    expect(existsSync(resolve(root, "obr.html"))).toBe(true);
  });
});
