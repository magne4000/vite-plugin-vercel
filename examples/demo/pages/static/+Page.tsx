import React from "react";
import { useData } from "vike-react/useData";

export default function Page() {
  const data = useData<{ d: string }>();

  return (
    <>
      <h1>Welcome</h1>
      This page is:
      <ul>
        <li>Static</li>
        <li>Static html generated</li>
        <li>No ISR</li>
        <li data-testid="date">{data.d}</li>
      </ul>
    </>
  );
}
