import process from "node:process";
import { ContainerInstanceManagementClient } from "@azure/arm-containerinstance";
import { DefaultAzureCredential } from "@azure/identity";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const credential = new DefaultAzureCredential();
  const containerClient = new ContainerInstanceManagementClient(
    credential,
    process.env.ARM_SUBSCRIPTION_ID!,
  );

  await containerClient.operations.list().next();

  // const a1 = await containerClient.containerGroups.get("judge0-rg", "judge0-worker-1", {
  //   requestOptions: {
  //     shouldDeserialize: undefined,
  //   },
  // });

  const start = Date.now();
  // const a = containerClient.containerGroups.get("judge0-rg", "judge0-worker-1");
  // const b = containerClient.containerGroups.get("judge0-rg", "judge0-worker-2");

  // const res = await Promise.all([a, b]);
  const t = await containerClient.containerGroups.beginStart("judge0-rg", "judge0-worker-1").catch((error) => {
    console.error("Error starting container group:", error);
    // process.exit(1);
  })

  // console.log("a", res[0].instanceView);
  // console.log("b", res[1].instanceView);

  // console.dir(a.instanceView);

  // const a = containerClient.containerGroups.listByResourceGroup("judge0-rg");
  // const a = await sleep(1000);

  console.log("completed in", Date.now() - start, "ms");
  process.exit(0);
})();
