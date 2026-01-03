export function removeExtension(subject: string) {
  return subject.replace(/\.[^/.]+$/, "");
}
