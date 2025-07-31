import { useData } from "vike-react/useData";

export default function Page() {
  const data = useData<{ d: string }>();

  return (
    <>
      <h1>Welcome</h1>
      This page is:
      <ul>
        <li>ISR</li>
        <li>ISR: regenerated after {15} seconds</li>
        <li data-testid="date">{data.d}</li>
      </ul>
    </>
  );
}
