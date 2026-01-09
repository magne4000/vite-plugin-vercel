import { Layout } from "../components/Layout";

export function DynamicPage() {
  return (
    <Layout>
      <h1>Welcome</h1>
      This page is:
      <ul>
        <li>Dynamic</li>
        <li>No static html generated</li>
        <li>No ISR</li>
        <li data-testid="date">{String(new Date())}</li>
      </ul>
    </Layout>
  );
}
