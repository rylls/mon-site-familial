export default function Avatar({ member, size = 'md' }) {
  if (!member) return null;
  const cls = size === 'lg' ? 'avatar lg' : 'avatar';
  return (
    <div className={cls} style={{ background: member.color }}>
      {member.name.charAt(0)}
    </div>
  );
}
