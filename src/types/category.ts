/** Category = Subject côté API (Prisma `Subject`). */
export interface Category {
  id: string; // [v1~] UUID Subject (était "programming", "math"…)
  label: string; // = Subject.name
  group: string | null; // [v1+] = Subject.category ("Programmation")
}
