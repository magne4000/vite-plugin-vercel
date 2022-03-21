import React from 'react';

export { Page };

export const initialRevalidateSeconds = 15;

function Page(props: { d: string; someId: string }) {
  return (
    <>
      <h1>Welcome</h1>
      This page is:
      <ul>
        <li>Static + Dynamic with url parameter: {props.someId}</li>
        <li>Static html generated</li>
        <li>ISR: regenerated after {initialRevalidateSeconds} seconds</li>
        <li>{props.d}</li>
      </ul>
    </>
  );
}
