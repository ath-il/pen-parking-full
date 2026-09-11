import ParkingSlot from "./ParkingSlot";

export default function ParkingGrid({ spaces }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
        gap: "1.5rem",
      }}
    >
      {spaces.map((slot) => (
        <ParkingSlot key={slot.id} {...slot} />
      ))}
    </div>
  );
}
