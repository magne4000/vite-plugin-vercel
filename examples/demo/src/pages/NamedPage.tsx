import { Layout } from "../components/Layout";
import Link from "../components/Link";

export function NamedPage() {
  return (
    <Layout>
      <h1>Welcome</h1>
      This page is:
      <ul>
        <li>Named URL</li>
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
        <li data-testid="date">{String(new Date())}</li>
      </ul>
    </Layout>
  );
}
