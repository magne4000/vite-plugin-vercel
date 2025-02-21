import React from "react";
import { useData } from "vike-react/useData";
import { Link } from "../../components/Link";

function isISR(someId: string) {
  return someId !== "id-1" && someId !== "id-2";
}

export default function Page() {
  const data = useData<{ d: string; someId: string }>();

  return (
    <>
      <h1>Welcome</h1>
      This page is:
      <ul>
        <li>Static with url parameter: {data.someId}</li>
        <li>
          Some pages are static:
          <ul>
            <li>
              <Link href="/named/id-1">/named/id-1</Link>
            </li>
            <li>
              <Link href="/named/id-2">/named/id-2</Link>
            </li>
          </ul>
        </li>
        <li>
          All other pages are ISR, e.g.:
          <ul>
            <li>
              <Link href="/named/id-3">/named/id-3</Link>
            </li>
            <li>
              <Link href="/named/something">/named/something</Link>
            </li>
          </ul>
        </li>
        <li>
          404 on sub-pages, e.g.:
          <ul>
            <li>
              <Link href="/named/id-1/a">/named/id-1/a</Link>
            </li>
            <li>
              <Link href="/named/something/a">/named/something/a</Link>
            </li>
          </ul>
        </li>
        <li>{isISR(data.someId) ? "ISR" : "Static"}</li>
        <li data-testid="date">{data.d}</li>
      </ul>
    </>
  );
}
