export default function ErrorComponent(message?: string) {
  return (
    <div className="container flex size-full justify-center items-center">
      {message ? message : "Service not available. Please try again later!"}
    </div>
  );
}
