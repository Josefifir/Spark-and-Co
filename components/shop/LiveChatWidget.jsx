"use client";

import Script from "next/script";

// Live chat widget — activated by setting NEXT_PUBLIC_CRISP_ID in your environment.
// Supports Crisp out of the box; swap the script tag for Tawk.to/Intercom/Tidio as needed.
// Renders nothing when the env var is absent — zero impact on pages that don't need it.

const CRISP_ID = process.env.NEXT_PUBLIC_CRISP_ID;

export default function LiveChatWidget() {
  if (!CRISP_ID) return null;

  return (
    <Script
      id="crisp-chat"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{
        __html: `
          window.$crisp=[];
          window.CRISP_WEBSITE_ID="${CRISP_ID}";
          (function(){
            var d=document;
            var s=d.createElement("script");
            s.src="https://client.crisp.chat/l.js";
            s.async=1;
            d.getElementsByTagName("head")[0].appendChild(s);
          })();
        `,
      }}
    />
  );
}
