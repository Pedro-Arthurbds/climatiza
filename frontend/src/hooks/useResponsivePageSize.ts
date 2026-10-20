import { useEffect, useRef, useState } from "react";

const DESKTOP_PAGE_SIZE = 10;
const MOBILE_PAGE_SIZE = 5;

function getPageSize() {
  return window.innerWidth < 640 ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE;
}

export function useResponsivePageSize(onChange: () => void) {
  const [pageSize, setPageSize] = useState(getPageSize);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let previousPageSize = getPageSize();

    function handleResize() {
      const nextPageSize = getPageSize();
      if (nextPageSize === previousPageSize) return;

      previousPageSize = nextPageSize;
      setPageSize(nextPageSize);
      onChangeRef.current();
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return pageSize;
}
