import { Suspense } from "react";
import Desk from "@/components/Desk";

export default function Page() {
  return (
    <Suspense>
      <Desk />
    </Suspense>
  );
}
