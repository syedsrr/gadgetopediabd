import { createFileRoute } from "@tanstack/react-router";

import { PolicyPage } from "@/components/site/PolicyPage";

const desc =
  "Warranty policy for gadgetOpedia n' Lifestyle: genuine products with brand or shop warranty and simple claims across Bangladesh.";

export const Route = createFileRoute("/warranty-policy")({
  head: () => ({
    meta: [
      { title: "Warranty Policy — gadgetOpedia n' Lifestyle" },
      { name: "description", content: desc },
      { property: "og:title", content: "Warranty Policy — gadgetOpedia" },
      { property: "og:description", content: desc },
    ],
  }),
  component: () => (
    <PolicyPage
      eyebrow="Genuine & covered"
      title="Warranty Policy"
      intro="Every product we sell is genuine. Where a warranty applies, we help you claim it quickly."
      sections={[
        {
          heading: "Warranty period",
          body: (
            <p>
              The warranty period is shown on each product page or invoice. It starts on the
              delivery date. Items with no stated warranty are covered for 7 days against
              manufacturing defects only.
            </p>
          ),
        },
        {
          heading: "What's covered",
          body: (
            <ul>
              <li>Manufacturing defects and hardware faults under normal use.</li>
              <li>Battery or charging faults that are not caused by misuse.</li>
            </ul>
          ),
        },
        {
          heading: "What's not covered",
          body: (
            <ul>
              <li>Physical, liquid or burn damage, and broken or tampered warranty stickers.</li>
              <li>Damage from wrong chargers, power surges or unauthorised repair.</li>
              <li>Normal wear such as scratches, cable fraying or cosmetic fading.</li>
            </ul>
          ),
        },
        {
          heading: "How to claim",
          body: (
            <ul>
              <li>Contact us with your order code and a photo or video of the problem.</li>
              <li>Send or drop the product with its box and accessories.</li>
              <li>Repair or replacement usually takes 7–15 working days.</li>
            </ul>
          ),
        },
      ]}
    />
  ),
});
