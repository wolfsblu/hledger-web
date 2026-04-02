import { useParams } from "react-router";

export default function AccountDetail() {
  const { name } = useParams<{ name: string }>();
  return <h1 className="text-2xl font-semibold">Account: {name}</h1>;
}
