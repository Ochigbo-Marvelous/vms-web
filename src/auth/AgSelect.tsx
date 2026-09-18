import { useEffect, useRef, useState } from "react";

type Option = { value: string; label: string };

export function AgSelect({
  icon,
  value,
  placeholder,
  options,
  required,
  onChange,
}: {
  icon: React.ReactNode;
  value: string;
  placeholder: string;
  options: Option[];
  required?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const selected = options.find((row) => row.value === value);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className={`ag-select ${open ? "is-open" : ""}`} ref={wrap}>
      <button
        type="button"
        className="ag-select-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {icon}
        <span className={selected ? "" : "is-ph"}>
          {selected?.label ?? placeholder}
        </span>
      </button>
      {required ? (
        <input type="hidden" value={value} required readOnly />
      ) : null}
      {open ? (
        <ul className="ag-select-list" role="listbox">
          {options.map((row) => (
            <li key={row.value}>
              <button
                type="button"
                className={row.value === value ? "is-on" : ""}
                onClick={() => {
                  onChange(row.value);
                  setOpen(false);
                }}
              >
                {row.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}