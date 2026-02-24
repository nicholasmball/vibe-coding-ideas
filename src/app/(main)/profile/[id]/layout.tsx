// Passthrough layout — exists so Next.js App Router scopes the not-found.tsx
// boundary to this route segment instead of bubbling up to the parent layout.
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
