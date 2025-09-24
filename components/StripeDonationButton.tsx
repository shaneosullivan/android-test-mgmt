import { STRIPE_DONATION_LINK } from "@/config/config";
import Button from "./Button";

export default function StripeDonationButton() {
  if (!STRIPE_DONATION_LINK) {
    return null;
  }

  return (
    <a href={STRIPE_DONATION_LINK} target="_blank" rel="noopener noreferrer">
      <Button variant="google">Donate via Stripe</Button>
    </a>
  );
}
