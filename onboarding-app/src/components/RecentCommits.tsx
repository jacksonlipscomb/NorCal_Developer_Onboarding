import { useQuery } from "@tanstack/react-query";

const REPO = "facebook/react";
const API_URL = `https://api.github.com/repos/${REPO}/commits?per_page=10`;

interface Commit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
}

async function fetchCommits(): Promise<Commit[]> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

export function RecentCommits() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["github-commits", REPO],
    queryFn: fetchCommits,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-500">
        Recent commits · {REPO}
      </h2>

      {isPending && (
        <ul className="grid gap-2" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <li
              key={i}
              className="h-12 animate-pulse rounded-lg border border-slate-200 bg-white"
            />
          ))}
        </ul>
      )}

      {isError && (
        <p className="text-sm text-red-600">
          Couldn't load commits: {(error as Error).message}
        </p>
      )}

      {data && (
        <ol className="grid list-none gap-2 p-0">
          {data.map((c) => {
            const subject = c.commit.message.split("\n")[0];
            const date = new Date(c.commit.author.date).toLocaleDateString();
            return (
              <li
                key={c.sha}
                className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
              >
                <code className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">
                  {c.sha.slice(0, 7)}
                </code>
                <div className="min-w-0 flex-1">
                  <a
                    href={c.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-sm font-medium text-slate-800 hover:underline"
                  >
                    {subject}
                  </a>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {c.commit.author.name} · {date}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
