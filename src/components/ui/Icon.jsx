/**
 * MD3 Material Symbols Rounded icon component.
 *
 * Usage:
 *   <Icon name="home" />                      ← outlined
 *   <Icon name="notifications" filled />       ← filled
 *   <Icon name="delete" size={20} filled />    ← custom size
 *
 * Full icon list: https://fonts.google.com/icons
 */
export default function Icon({
  name,
  size = 24,
  filled = false,
  weight = 400,
  grade = 0,
  className = "",
  style = {},
}) {
  return (
    <span
      className={`material-symbols-rounded select-none leading-none ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${size}`,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {name}
    </span>
  );
}
