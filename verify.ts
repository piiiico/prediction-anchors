// Verify one revealed prediction row against an anchored root. No dependencies.
// Usage: bun verify.ts '<leafLine>' '<proofJson>' <root>     (node works too: npx tsx verify.ts ...)
import { createHash } from "node:crypto";

const sha = (...p: Buffer[]) => createHash("sha256").update(Buffer.concat(p)).digest();
const leaf = (line: string) => sha(Buffer.from([0]), Buffer.from(line, "utf8"));
const node = (l: Buffer, r: Buffer) => sha(Buffer.from([1]), l, r);
const canon = (o: Record<string, unknown>) => JSON.stringify(Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]])));

const [line, proofJson, root] = process.argv.slice(2);
if (!line || !proofJson || !root) { console.error("usage: verify.ts '<leafLine>' '<proofJson>' <root>"); process.exit(2); }
if (canon(JSON.parse(line)) !== line) { console.error("leaf is not in canonical form (sorted keys, no whitespace)"); process.exit(1); }
let h = leaf(line);
for (const s of JSON.parse(proofJson) as { side: "L" | "R"; hash: string }[])
  h = s.side === "L" ? node(Buffer.from(s.hash, "hex"), h) : node(h, Buffer.from(s.hash, "hex"));
const ok = h.toString("hex") === root.replace(/^0x/, "").toLowerCase();
console.log(ok ? "VALID" : "INVALID");
process.exit(ok ? 0 : 1);
