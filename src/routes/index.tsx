import { createFileRoute } from "@tanstack/react-router";
import { PetAudition } from "@/components/pet-audition";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <PetAudition />;
}
