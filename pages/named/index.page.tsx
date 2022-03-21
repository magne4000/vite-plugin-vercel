import React from 'react';

export { Page };

export const initialRevalidateSeconds = 15;

function isISR(someId: string) {
  return someId === 'id-1' || someId === 'id-2';
}

function Page(props: { d: string; someId: string }) {
  return (
    <>
      <h1>Welcome</h1>
      This page is:
      <ul>
        <li>Static + Dynamic with url parameter: {props.someId}</li>
        <li>
          {isISR(props.someId)
            ? 'Static html generated'
            : 'No static html generated'}
        </li>
        {isISR(props.someId) && (
          <li>ISR: regenerated after {initialRevalidateSeconds} seconds</li>
        )}
        <li>{props.d}</li>
      </ul>
    </>
  );
}
