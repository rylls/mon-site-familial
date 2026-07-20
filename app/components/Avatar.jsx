export default function Avatar({ member, size = 'md' }) {
  if (!member) return null;
  const cls = size === 'md' ? 'avatar' : `avatar ${size}`;
  return (
    <div className={cls} style={{ background: member.color }}>
      {member.icon || member.name.charAt(0)}
    </div>
  );
}
