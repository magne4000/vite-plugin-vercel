import { type AnchorHTMLAttributes, type CSSProperties, type FC, useEffect, useState } from "react";

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

const ACTIVE_STYLE: CSSProperties = {
  color: "#2563eb", // blue
  fontWeight: 600,
  textDecoration: "underline",
};

const Link: FC<LinkProps> = ({ href, style, children, ...rest }) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentPath = window.location.pathname;
    setIsActive(currentPath === href || currentPath.startsWith(href + "/"));
  }, [href]);

  return (
    <a
      href={href}
      style={{
        ...style,
        ...(isActive ? ACTIVE_STYLE : {}),
      }}
      {...rest}
    >
      {children}
    </a>
  );
};

export default Link;
