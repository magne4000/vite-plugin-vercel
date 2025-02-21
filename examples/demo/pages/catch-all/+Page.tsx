import React from "react";
import { Link } from "../../components/Link";
import { useData } from "vike-react/useData";

export default function Page() {
  const data = useData<{ d: string }>();

  return (
    <>
      <h1>Welcome</h1>
      This page is:
      <ul>
        <li>Catch-all /catch-all routes</li>
        <li>
          Some pages are static:
          <ul>
            <li>
              <Link href="/catch-all/a/b/c">/catch-all/a/b/c</Link>
            </li>
            <li>
              <Link href="/catch-all/a/d">/catch-all/a/d</Link>
            </li>
          </ul>
        </li>
        <li>
          All other pages are ISR, e.g.:
          <ul>
            <li>
              <Link href="/catch-all/a">/catch-all/a</Link>
            </li>
            <li>
              <Link href="/catch-all/d">/catch-all/d</Link>
            </li>
            <li>
              <Link href="/catch-all/e/f/g/h/i">/catch-all/e/f/g/h/i</Link>
            </li>
          </ul>
        </li>
        <li data-testid="date">{data.d}</li>
      </ul>
    </>
  );
}
