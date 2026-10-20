import { SegmentedControl } from "@canop/ui";
import { useAdminNav } from "../hooks/useAdminNav";

export function AdminNav() {
  const { options, value, navigateTo, ariaLabel } = useAdminNav();

  return (
    <SegmentedControl
      options={options}
      value={value}
      onChange={navigateTo}
      ariaLabel={ariaLabel}
      size="small"
    />
  );
}
