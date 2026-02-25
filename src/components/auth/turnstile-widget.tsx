"use client";

import { useRef, useCallback } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

interface TurnstileWidgetProps {
  onToken: (token: string | null) => void;
}

/**
 * Cloudflare Turnstile CAPTCHA widget.
 * Renders nothing if NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set,
 * allowing the app to work without CAPTCHA in development.
 */
export function TurnstileWidget({ onToken }: TurnstileWidgetProps) {
  const ref = useRef<TurnstileInstance>(null);

  const handleSuccess = useCallback(
    (token: string) => onToken(token),
    [onToken],
  );

  const handleExpire = useCallback(() => onToken(null), [onToken]);
  const handleError = useCallback(() => onToken(null), [onToken]);

  if (!SITE_KEY) return null;

  return (
    <Turnstile
      ref={ref}
      siteKey={SITE_KEY}
      onSuccess={handleSuccess}
      onExpire={handleExpire}
      onError={handleError}
      options={{
        theme: "dark",
        size: "flexible",
      }}
    />
  );
}

/** Reset a Turnstile widget (call after form submission to get a fresh token) */
export function useTurnstileReset() {
  const ref = useRef<TurnstileInstance>(null);
  const reset = useCallback(() => ref.current?.reset(), []);
  return { ref, reset };
}
