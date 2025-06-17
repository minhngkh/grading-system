import { Spinner } from "./spinner";

export default function PendingComponent(message: string) {
  return (
    <div className="flex flex-col size-full justify-center items-center">
      <Spinner />
      <p>{message}</p>
    </div>
  );
}
