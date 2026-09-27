import { createFileRoute } from "@tanstack/react-router";

import { PolicyPage } from "@/components/site/PolicyPage";

const desc =
  "Return and refund policy for gadgetOpedia n' Lifestyle: 7-day returns on damaged, defective or wrong items, with refunds or replacements across Bangladesh.";

export const Route = createFileRoute("/return-policy")({
  head: () => ({
    meta: [
      { title: "Return & Refund Policy — gadgetOpedia n' Lifestyle" },
      { name: "description", content: desc },
      { property: "og:title", content: "Return & Refund Policy — gadgetOpedia" },
      { property: "og:description", content: desc },
    ],
  }),
  component: () => (
    <PolicyPage
      eyebrow="Shop with confidence"
      title="Return & Refund Policy"
      intro="If something isn't right with your order, we'll make it right. Here's how returns work."
      sections={[
        {
          heading: "Check at delivery",
          body: (
            <p>
              Please check the parcel in front of the delivery person. If the product is damaged,
              wrong or missing items, you may refuse it and pay only the delivery charge.
            </p>
          ),
        },
        {
          heading: "7-day return window",
          body: (
            <ul>
              <li>Report the issue within 7 days of receiving your order.</li>
              <li>The item must be unused, with original box, accessories and invoice.</li>
              <li>Send a photo or short video of the problem via WhatsApp or email.</li>
            </ul>
          ),
        },
        {
          heading: "Not eligible for return",
          body: (
            <ul>
              <li>Physical damage, water damage or misuse after delivery.</li>
              <li>Change-of-mind returns on opened or used items.</li>
              <li>Items missing their box, accessories or warranty sticker.</li>
            </ul>
          ),
        },
        {
          heading: "Refunds & replacements",
          body: (
            <p>
              Once we receive and inspect the item, we'll send a replacement or refund within 3–7
              working days via bKash, Nagad or bank transfer. Delivery charges are non-refundable
              unless the mistake was ours.
            </p>
          ),
        },
      ]}
    />
  ),
});
