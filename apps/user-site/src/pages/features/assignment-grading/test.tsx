import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { defineStepper } from "@stepperize/react";
import * as React from "react";
import "./App.css";

const { useStepper, steps, utils } = defineStepper(
  {
    id: "shipping",
    title: "Shipping",
    description: "Enter your shipping details",
  },
  {
    id: "payment",
    title: "Payment",
    description: "Enter your payment details",
  },
  { id: "complete", title: "Complete", description: "Checkout complete" },
);

const ShippingComponent = () => {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label htmlFor="name" className="text-sm font-medium text-start">
          Name
        </label>
        <Input id="name" placeholder="John Doe" className="w-full" />
      </div>
      <div className="grid gap-2">
        <label htmlFor="address" className="text-sm font-medium text-start">
          Address
        </label>
        <Textarea
          id="address"
          placeholder="123 Main St, Anytown USA"
          className="w-full"
        />
      </div>
    </div>
  );
};

const PaymentComponent = () => {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label htmlFor="card-number" className="text-sm font-medium text-start">
          Card Number
        </label>
        <Input id="card-number" placeholder="4111 1111 1111 1111" className="w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label htmlFor="expiry-date" className="text-sm font-medium text-start">
            Expiry Date
          </label>
          <Input id="expiry-date" placeholder="MM/YY" className="w-full" />
        </div>
        <div className="grid gap-2">
          <label htmlFor="cvc" className="text-sm font-medium text-start">
            CVC
          </label>
          <Input id="cvc" placeholder="123" className="w-full" />
        </div>
      </div>
    </div>
  );
};

const CompleteComponent = () => {
  return <h3 className="text-lg py-4 font-medium">Stepper complete 🔥</h3>;
};

function App() {
  const stepper = useStepper();

  const currentIndex = utils.getIndex(stepper.current.id);
  return (
    <div className="space-y-6 p-6 border rounded-lg w-[450px]">
      <div className="flex justify-between">
        <h2 className="text-lg font-medium">Checkout</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Step {currentIndex + 1} of {steps.length}
          </span>
          <div />
        </div>
      </div>
      <nav aria-label="Checkout Steps" className="group my-4">
        <ol
          className="flex items-center justify-between gap-2"
          aria-orientation="horizontal"
        >
          {stepper.all.map((step, index, array) => (
            <React.Fragment key={step.id}>
              <li className="flex items-center gap-4 flex-shrink-0">
                <Button
                  type="button"
                  role="tab"
                  variant={index <= currentIndex ? "default" : "secondary"}
                  aria-current={stepper.current.id === step.id ? "step" : undefined}
                  aria-posinset={index + 1}
                  aria-setsize={steps.length}
                  aria-selected={stepper.current.id === step.id}
                  className="flex size-10 items-center justify-center rounded-full"
                  onClick={() => stepper.goTo(step.id)}
                >
                  {index + 1}
                </Button>
                <span className="text-sm font-medium">{step.title}</span>
              </li>
              {index < array.length - 1 && (
                <Separator
                  className={`flex-1 ${index < currentIndex ? "bg-primary" : "bg-muted"}`}
                />
              )}
            </React.Fragment>
          ))}
        </ol>
      </nav>
      <div className="space-y-4">
        {stepper.switch({
          shipping: () => <ShippingComponent />,
          payment: () => <PaymentComponent />,
          complete: () => <CompleteComponent />,
        })}
        {!stepper.isLast ? (
          <div className="flex justify-end gap-4">
            <Button variant="secondary" onClick={stepper.prev} disabled={stepper.isFirst}>
              Back
            </Button>
            <Button onClick={stepper.next}>{stepper.isLast ? "Complete" : "Next"}</Button>
          </div>
        ) : (
          <Button onClick={stepper.reset}>Reset</Button>
        )}
      </div>
    </div>
  );
}

export default App;
