import { Button } from "../components/ui/Button";

const base = import.meta.env.BASE_URL ?? "/";

export function FocalSpeciesPage({ onNext }: { onNext: () => void }) {
  return (
    <article className="space-y-8 text-center">
      <p className="mx-auto max-w-prose text-base text-stone-700">
        The following questions in this survey relate to two species found on the island of Ireland.
      </p>

      <div className="grid gap-8 md:grid-cols-2 items-start">
        {/* Pine Marten */}
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl shadow-md aspect-[4/3]">
            <img
              src={`${base}species/pm.jpg`}
              alt="European Pine Marten"
              className="h-full w-full object-cover"
            />
          </div>
          <p className="font-semibold">European Pine Marten</p>
          <p className="text-sm text-stone-600 italic">(Martes martes)</p>
          <p className="text-sm text-stone-600">Cat crainn</p>
        </div>

        {/* Red Fox */}
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl shadow-md aspect-[4/3]">
            <img
              src={`${base}species/fox.jpg`}
              alt="Red Fox"
              className="h-full w-full object-cover"
            />
          </div>
          <p className="font-semibold">Red Fox</p>
          <p className="text-sm text-stone-600 italic">(Vulpes vulpes)</p>
          <p className="text-sm text-stone-600">Madra rua</p>
        </div>
      </div>

      <p className="mx-auto max-w-prose text-base text-stone-700">
        Please keep these species in mind when answering the questions.
      </p>

      <div className="mt-8 flex justify-end">
        <Button size="lg" onClick={onNext}>
          Next
        </Button>
      </div>
    </article>
  );
}