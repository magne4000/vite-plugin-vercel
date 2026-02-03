import { Layout } from "../components/Layout";

export function IsrPage(props: { isr: number }) {
  return (
    <Layout>
      <h1>Welcome</h1>
      This page is:
      <ul>
        <li>ISR</li>
        <li>ISR: regenerated after {props.isr} seconds</li>
        <li data-testid="date">{String(new Date())}</li>
      </ul>
    </Layout>
  );
}
