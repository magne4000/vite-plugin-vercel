export default {
  fetch(request: Request) {
    const pathname = new URL(request.url).pathname;
    const name = pathname.split("/").at(-1);
    return new Response(`Name: ${name}`);
  },
};
