import { PassThrough } from "node:stream";
import type { AppLoadContext, EntryContext } from "@remix-run/node";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { createServerClient } from '@supabase/auth-helpers-remix'; // Import helper

const ABORT_DELAY = 5_000;

export default async function handleRequest( // Make async
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  loadContext: AppLoadContext // Use loadContext
) {
  // Create a Supabase client for server-side rendering (SSR) requests
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { request, response: { headers: responseHeaders } } // Pass request/response
  );

  // Inject Supabase client and session into the load context
  // This makes them available in loaders and actions
  loadContext.supabase = supabase;
  loadContext.session = (await supabase.auth.getSession()).data.session; // Get session


  const callbackName = isbot(request.headers.get("user-agent") || "")
    ? "onAllReady"
    : "onShellReady";

  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer
        context={remixContext}
        url={request.url}
        abortDelay={ABORT_DELAY}
      />,
      {
        [callbackName]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}

// Add Supabase types to AppLoadContext
declare module "@remix-run/node" {
  interface AppLoadContext {
    supabase: ReturnType<typeof createServerClient>;
    session: import('@supabase/supabase-js').Session | null;
  }
}
