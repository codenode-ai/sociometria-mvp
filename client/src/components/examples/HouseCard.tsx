import HouseCard from "../HouseCard";

export default function HouseCardExample() {
  const mockHouse = {
    id: "1",
    name: "Casa Premium",
    cleaningType: "meticulous" as const,
    size: "large" as const,
    address: "Rua das Flores, 123 - Vila Rica",
  };

  const handleDelete = (id: string) => {
    console.log("Delete house:", id);
  };

  return <HouseCard house={mockHouse} onDelete={handleDelete} />;
}
