import React from "react";
import { Link } from "./Link";

export function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.StrictMode>
      <div
        style={{
          display: "flex",
          maxWidth: 900,
          margin: "auto",
        }}
      >
        <Sidebar>
          <Link href="/">Home</Link>
          <Link href="/dynamic">Dynamic</Link>
          <Link href="/static">Static</Link>
          <Link href="/isr">ISR</Link>
          <Link href="/named/id-1">Named</Link>
          <Link href="/catch-all/a/b/c">Catch-all</Link>
          <Link href="/function/a">Function</Link>
          <Link href="/edge">Edge Function endpoint</Link>
          <Link href="/vike-edge">Vike Edge Function endpoint</Link>
          <Link href="/og-edge">Edge OG endpoint</Link>
          <Link href="/og-node">Node OG endpoint</Link>
          <Link href="/api/page">api/page</Link>
          <Link href="/api/isr">api/isr</Link>
          <Link href="/api/name/bob">api/name</Link>
        </Sidebar>
        <Content>{children}</Content>
      </div>
    </React.StrictMode>
  );
}

function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <div
      id="sidebar"
      style={{
        padding: 20,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        lineHeight: "1.8em",
        borderRight: "2px solid #eee",
      }}
    >
      {children}
    </div>
  );
}

function Content({ children }: { children: React.ReactNode }) {
  return (
    <div id="page-container">
      <div
        id="page-content"
        style={{
          padding: 20,
          paddingBottom: 50,
          minHeight: "100vh",
        }}
      >
        {children}
      </div>
    </div>
  );
}
