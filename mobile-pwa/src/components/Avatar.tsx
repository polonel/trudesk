interface Props {
  name?: string
  image?: string
  size?: 'sm' | 'md'
}

export default function Avatar({ name, image, size = 'sm' }: Props) {
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-sm'
  const initials = name
    ? name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  if (image) {
    const src = image.startsWith('http') || image.startsWith('/') ? image : `/uploads/users/${image}`
    return <img src={src} alt={name} className={`${dim} rounded-full object-cover`} />
  }

  return (
    <div className={`${dim} rounded-full bg-primary flex items-center justify-center text-white font-semibold`}>
      {initials}
    </div>
  )
}
