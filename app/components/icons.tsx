import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function SearchIcon(p: IconProps) {
  return <svg {...base} strokeWidth="1.8" {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>;
}
export function PlusIcon(p: IconProps) {
  return <svg {...base} strokeWidth="2" {...p}><path d="M12 5v14M5 12h14"/></svg>;
}
export function MinusIcon(p: IconProps) {
  return <svg {...base} strokeWidth="2" {...p}><path d="M5 12h14"/></svg>;
}
export function TrashIcon(p: IconProps) {
  return <svg {...base} strokeWidth="1.8" {...p}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
}
export function EditIcon(p: IconProps) {
  return <svg {...base} strokeWidth="1.8" {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>;
}
export function CheckIcon(p: IconProps) {
  return <svg {...base} strokeWidth="2.4" {...p}><path d="M20 6 9 17l-5-5"/></svg>;
}
export function XIcon(p: IconProps) {
  return <svg {...base} strokeWidth="2" {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>;
}
export function DashboardIcon(p: IconProps) {
  return <svg {...base} strokeWidth="1.8" {...p}><path d="M3 12 12 3l9 9"/><path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"/></svg>;
}
export function BoxIcon(p: IconProps) {
  return <svg {...base} strokeWidth="1.8" {...p}><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
}
export function CartIcon(p: IconProps) {
  return <svg {...base} strokeWidth="1.8" {...p}><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>;
}
export function TrendIcon(p: IconProps) {
  return <svg {...base} strokeWidth="1.8" {...p}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
}
export function AlertIcon(p: IconProps) {
  return <svg {...base} strokeWidth="1.8" {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>;
}
export function ArrowUpIcon(p: IconProps) {
  return <svg {...base} strokeWidth="2" {...p}><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>;
}
export function ArrowDownIcon(p: IconProps) {
  return <svg {...base} strokeWidth="2" {...p}><path d="M17 7 7 17"/><path d="M17 17H7V7"/></svg>;
}
export function BackIcon(p: IconProps) {
  return <svg {...base} strokeWidth="2" {...p}><path d="m15 18-6-6 6-6"/></svg>;
}
export function ChevIcon(p: IconProps) {
  return <svg {...base} strokeWidth="2" {...p}><path d="m9 18 6-6-6-6"/></svg>;
}
export function MoreIcon(p: IconProps) {
  return <svg {...base} strokeWidth="2" {...p}><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>;
}
export function InfoIcon(p: IconProps) {
  return <svg {...base} strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>;
}
export function ArchiveIcon(p: IconProps) {
  return <svg {...base} strokeWidth="1.8" {...p}><rect x="3" y="3" width="18" height="5" rx="1"/><path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>;
}
export function ReceiptIcon(p: IconProps) {
  return <svg {...base} strokeWidth="1.8" {...p}><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>;
}
