import { readFile, writeFile } from "node:fs/promises";

const USER = "yoelsosan";
const MAX = 6;                 // cuántos proyectos mostrar
const EXCLUDE = [USER];        // repos que nunca quieres mostrar
const START = "<!-- PROJECTS:START -->";
const END = "<!-- PROJECTS:END -->";

const LANG = {
  TypeScript: "🟦", JavaScript: "🟨", PHP: "🟪", Python: "🐍", HTML: "🟧",
  CSS: "🎨", Blade: "🟥", Vue: "🟩", Java: "☕", "C#": "🟩", Shell: "⬛",
};
const TOPIC = {
  nextjs: "▲ Next.js", nestjs: "🐈 NestJS", react: "⚛️ React", laravel: "🔺 Laravel",
  tailwindcss: "🌊 Tailwind", typescript: "🔷 TypeScript", nodejs: "🟢 Node.js",
  mysql: "🐬 MySQL", postgresql: "🐘 PostgreSQL", prisma: "◭ Prisma", docker: "🐳 Docker",
};
const ICONS = ["🚀", "✨", "🎯", "⚡", "🔥", "💡"];

const headers = { Accept: "application/vnd.github+json", "User-Agent": USER };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const res = await fetch(
  `https://api.github.com/users/${USER}/repos?type=owner&sort=pushed&per_page=100`,
  { headers }
);
if (!res.ok) throw new Error(`GitHub API respondió ${res.status}`);

const repos = (await res.json())
  .filter((r) => !r.private && !r.fork && !r.archived && !EXCLUDE.includes(r.name))
  .sort((a, b) =>
    b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at))
  .slice(0, MAX);

const esc = (s = "") => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fecha = (d) =>
  new Date(d).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });

const cell = (r, i) => {
  const lang = r.language ? `${LANG[r.language] ?? "⚪"} <b>${r.language}</b> &nbsp;·&nbsp; ` : "";
  const demo = r.homepage ? ` &nbsp;·&nbsp; 🌐 <a href="${r.homepage}">Demo</a>` : "";
  const tags = (r.topics ?? []).map((t) => `<code>${TOPIC[t] ?? t}</code>`).join(" ");
  return `    <td width="50%" valign="top">
      <h3>${ICONS[i % ICONS.length]} <a href="${r.html_url}">${esc(r.name)}</a></h3>
      <p>${esc(r.description ?? "Sin descripción por ahora.")}</p>
      <p>${lang}⭐ ${r.stargazers_count} &nbsp;·&nbsp; 🍴 ${r.forks_count}${demo}</p>
      ${tags ? `<p>${tags}</p>` : ""}
      <sub>🕒 Actualizado: ${fecha(r.pushed_at)}</sub>
    </td>`;
};

let block;
if (repos.length === 0) {
  block = `<p align="center"><i>Próximamente nuevos proyectos públicos ✨</i></p>`;
} else {
  const rows = [];
  for (let i = 0; i < repos.length; i += 2) {
    rows.push(`  <tr>\n${repos.slice(i, i + 2).map((r, j) => cell(r, i + j)).join("\n")}\n  </tr>`);
  }
  block = `<table>\n${rows.join("\n")}\n</table>`;
}

const readme = await readFile("README.md", "utf8");
const updated = readme.replace(
  new RegExp(`${START}[\\s\\S]*?${END}`),
  `${START}\n${block}\n${END}`
);
if (updated !== readme) {
  await writeFile("README.md", updated);
  console.log(`README actualizado con ${repos.length} proyectos públicos.`);
} else {
  console.log("Sin cambios.");
}
