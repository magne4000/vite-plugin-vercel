import { Counter } from "../components/Counter";
import { Layout } from "../components/Layout";

export function HomePage() {
  return (
    <Layout>
      <h1>Welcome</h1>
      This page is:
      <ul>
        <li>Rendered to HTML.</li>
        <li>
          Interactive. <Counter />
        </li>
      </ul>
    </Layout>
  );
}
