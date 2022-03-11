import React from 'react';
import './index.css';

export { Page };

function Page(props: { d: string }) {
  return (
    <>
      <h1>About</h1>
      <p>A colored page.</p>
      <p>{props.d}</p>
    </>
  );
}
