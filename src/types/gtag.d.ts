interface GtagEvent {
  action: string;
  category: string;
  label: string;
  value: number;
}

interface GtagConfig {
  page_path?: string;
  page_title?: string;
  [key: string]: unknown;
}

interface GtagEventParams {
  event_category?: string;
  event_label?: string;
  value?: number;
  [key: string]: unknown;
}

interface WindowWithGtag extends Window {
  dataLayer: unknown[];
  gtag(
    command: 'config',
    targetId: string,
    config?: GtagConfig
  ): void;
  gtag(
    command: 'event',
    eventName: string,
    eventParams?: GtagEventParams
  ): void;
  gtag(command: 'js', date: Date): void;
  gtag(command: 'set', config: Record<string, unknown>): void;
  gtag(command: string, ...args: unknown[]): void;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Window extends WindowWithGtag {}
} 