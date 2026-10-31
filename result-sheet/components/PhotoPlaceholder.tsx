// The student's photo. There is no photo field on the student yet, so this is a
// permanent dashed placeholder.

export default function PhotoPlaceholder() {
  return (
    <div className="flex h-[30mm] w-[30mm] items-center justify-center border border-dashed border-slate-400 bg-slate-50">
      <span className="px-1 text-center text-[8px] uppercase leading-tight tracking-widest text-slate-500">
        Student
        <br />
        Photo
      </span>
    </div>
  );
}
