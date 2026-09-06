import { headers } from "next/headers";
import QRCode from "qrcode";
import { CompartirTrackingClient } from "./compartir-tracking-client";

interface CompartirTrackingSectionProps {
  publicToken: string;
}

export async function CompartirTrackingSection({
  publicToken,
}: CompartirTrackingSectionProps) {
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const trackingUrl = `${proto}://${host}/tracking/${publicToken}`;

  const qrSvg = await QRCode.toString(trackingUrl, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 180,
    color: {
      dark: "#DCE2F3",
      light: "#0D1117",
    },
  });

  return (
    <CompartirTrackingClient
      trackingUrl={trackingUrl}
      qrSvg={qrSvg}
    />
  );
}
