interface Props {
  name?: string
  image?: string
  size?: 'sm' | 'md' | 'xl'
}

export default function Avatar({ name, image, size = 'sm' }: Props) {
  const dim =
    size === 'xl' ? 'w-20 h-20 text-2xl' :
    size === 'md' ? 'w-10 h-10 text-sm' :
    'w-7 h-7 text-xs'
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
