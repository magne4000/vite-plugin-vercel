export function getHtml(name: string) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>vite-plugin-vercel example</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      font-weight: 400;
      color-scheme: light dark;
      color: rgba(255, 255, 255, 0.87);
      background-color: #242424;
      font-synthesis: none;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    body {
      margin: 0;
      display: flex;
      place-items: center;
      min-width: 320px;
      min-height: 100vh;
    }
    #app {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
    }
    h1 {
      font-size: 3.2em;
      line-height: 1.1;
    }
    ul {
      list-style: none;
      padding: 0;
      display: flex;
      gap: 1rem;
      justify-content: center;
    }
    a {
      font-weight: 500;
      color: #646cff;
      text-decoration: inherit;
    }
    a:hover {
      color: #535bf2;
    }
    @media (prefers-color-scheme: light) {
      :root {
        color: #213547;
        background-color: #ffffff;
      }
      a:hover {
        color: #747bff;
      }
    }
  </style>
</head>
<body>
  <div id="app">
    <h1>${name}</h1>
    <ul>
      <li><a href="/">/</a></li>
      <li><a href="/edge">/edge</a></li>
      <li><a href="/headers">/headers</a></li>
      <li><a href="/isr">/isr</a></li>
    </ul>
  </div>
</body>
</html>`;
}
