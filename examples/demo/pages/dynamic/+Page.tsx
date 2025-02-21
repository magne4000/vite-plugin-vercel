import React from "react";
import { useData } from 'vike-react/useData'

export default function Page() {
  const data = useData<{ d: string }>();

  return (
    <>
      <h1>Welcome</h1>
      This page is:
      <ul>
        <li>Dynamic</li>
        <li>No static html generated</li>
        <li>No ISR</li>
        <li>{data.d}</li>
      </ul>
    </>
  );
}
