import React from 'react';

export { Page };

export const isr = { expiration: 15 };

function Page(props: { d: string }) {
  return (
    <>
      <h1>Welcome</h1>
      This page is:
      <ul>
        <li>ISR</li>
        <li>ISR: regenerated after {isr.expiration} seconds</li>
        <li>{props.d}</li>
      </ul>
    </>
  );
}
