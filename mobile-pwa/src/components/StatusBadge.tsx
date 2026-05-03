interface Props {
  name: string
  color: string
}

export default function StatusBadge({ name, color }: Props) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {name}
    </span>
  )
}
