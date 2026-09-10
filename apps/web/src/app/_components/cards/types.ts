import type { CardColor, CardDefinition } from "@dealopoly/shared";

export interface CardProps {
  card: CardDefinition;
  size?: "xs" | "sm" | "md" | "lg";
  isInteractive?: boolean;
  className?: string;
  onClick?: () => void;
  designVariant?: "classic" | "hasbro";
  currentColor?: CardColor;
}

export interface CardBackProps {
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "classic" | "gold" | "carbon";
  isInteractive?: boolean;
  className?: string;
  onClick?: () => void;
}
