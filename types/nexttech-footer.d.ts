import "react";

// The shared Next Tech footer is a remote Web Component, not a React component,
// so its tag has to be declared as a valid JSX intrinsic element.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "nexttech-footer": DetailedHTMLProps<
        HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { source?: string };
    }
  }
}
