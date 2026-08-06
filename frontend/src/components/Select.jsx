import { useState } from 'react'
import { Field } from './ui'
import Sheet from './Sheet'

const icons = {
  chevron: <path d="m9 18 6-6-6-6" />,
  check: <path d="M20 6 9 17l-5-5" />,
}

function Icon({ name, className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  )
}

export function PickerList({ options, value, onSelect }) {
  return (
    <div className="picker-list">
      {options.map((o) => {
        const active = String(o.value) === String(value)
        return (
          <button
            key={String(o.value)}
            type="button"
            className={active ? 'picker-row active' : 'picker-row'}
            onClick={() => onSelect(o.value)}
          >
            <span className="picker-label">{o.label}</span>
            {active && <Icon name="check" className="picker-check" />}
          </button>
        )
      })}
    </div>
  )
}

export default function SelectField({ label, value, onChange, options, placeholder = 'Select…' }) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => String(o.value) === String(value))

  return (
    <Field label={label}>
      <button
        type="button"
        className={selected ? 'select-field' : 'select-field placeholder'}
        onClick={() => setOpen(true)}
      >
        <span className="select-value">{selected ? selected.label : placeholder}</span>
        <Icon name="chevron" className="select-chevron" />
      </button>
      <Sheet stacked open={open} onClose={() => setOpen(false)} title={label}>
        <PickerList
          options={options}
          value={value}
          onSelect={(v) => {
            onChange(v)
            setOpen(false)
          }}
        />
      </Sheet>
    </Field>
  )
}
