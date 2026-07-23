import type { SVGProps } from "react";
import type { Icon as PhosphorIconType } from "@phosphor-icons/react";

/**
 * Astryx's icon-accepting props (SideNavItem.icon, TextInput.startIcon, etc.)
 * are typed as IconType — a semantic name string or a plain SVG component —
 * and render it without forwarding a `weight` prop. Phosphor's own
 * `weight="light"` convention (see CLAUDE.md) has to be baked into a wrapper
 * component instead of passed at each call site.
 */
export function lightIcon(PhosphorIcon: PhosphorIconType) {
  return function LightIcon(props: SVGProps<SVGSVGElement>) {
    return <PhosphorIcon {...props} weight="light" />;
  };
}

/** Same wrapper pattern as lightIcon, for the rare filled-icon case (e.g. star ratings). */
export function fillIcon(PhosphorIcon: PhosphorIconType) {
  return function FillIcon(props: SVGProps<SVGSVGElement>) {
    return <PhosphorIcon {...props} weight="fill" />;
  };
}
