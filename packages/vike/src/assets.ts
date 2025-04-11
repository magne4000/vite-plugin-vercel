import vikeAsset from "../assets/vike.ts?raw";

function _getAsset(kind: "vike" | undefined) {
  switch (kind) {
    default:
      return vikeAsset;
  }
}

// FIXME already handled by `vike-server`
export function getAsset(kind: "vike" | undefined, build?: boolean) {
  return build
    ? `import "virtual:@brillout/vite-plugin-server-entry:serverEntry";\n${_getAsset(kind)}`
    : _getAsset(kind);
}
