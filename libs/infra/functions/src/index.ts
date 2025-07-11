import type { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import process from "node:process";
import { ContainerInstanceManagementClient } from "@azure/arm-containerinstance";
import { app } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { Redis } from "@upstash/redis";
import { count, inArray, isNull, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { submissions } from "./db";

interface WorkerStats {
  queue: string;
  size: number;
  available: number;
  idle: number;
  working: number;
  paused: number;
  failed: number;
}

interface WorkerCount {
  running: number;
  stopped: number;
  total: number;
}

interface ScalingDecision {
  action: "scale_up" | "scale_down" | "no_action";
  targetReplicas: number;
  reason: string;
}

class Judge0Autoscaler {
  private containerClient;
  private redisClient;
  private dbClient;

  private readonly subscriptionId: string;
  private readonly resourceGroupName: string;
  private readonly containerGroupName: string;
  private readonly judge0Version: string;

  public readonly config: {
    minWorkers: number;
    maxWorkers: number;
    scaleUpThreshold: number;
    scaleDownThreshold: number;
    scaleCooldownMinutes: number;
    allowInfiniteScale: boolean;
  };

  constructor() {
    this.subscriptionId = process.env.AZURE_SUBSCRIPTION_ID!;
    this.resourceGroupName = process.env.AZURE_RESOURCE_GROUP!;
    this.containerGroupName = process.env.CONTAINER_GROUP_NAME!;
    this.judge0Version = process.env.JUDGE0_VERSION!;

    this.config = {
      minWorkers: Number.parseInt(process.env.MIN_WORKERS || "0"),
      maxWorkers: Number.parseInt(process.env.MAX_WORKERS || "2"),
      scaleUpThreshold: Number.parseInt(process.env.SCALE_UP_THRESHOLD || "5"),
      scaleDownThreshold: Number.parseInt(process.env.SCALE_DOWN_THRESHOLD || "2"),
      scaleCooldownMinutes: Number.parseInt(process.env.SCALE_COOLDOWN_MINUTES || "5"),
      allowInfiniteScale: process.env.ALLOW_INFINITE_SCALE?.toLowerCase() === "true",
    };

    try {
      // Needs a Service Principal with Container Instance
      // const credential = new ClientSecretCredential(
      //   process.env.AZURE_TENANT_ID!,
      //   process.env.AZURE_CLIENT_ID!,
      //   process.env.AZURE_CLIENT_SECRET!,
      // );
      const credential = new DefaultAzureCredential();

      this.containerClient = new ContainerInstanceManagementClient(
        credential,
        this.subscriptionId,
      );

      console.log("Azure Container Instance Management Client initialized successfully");
    } catch (error) {
      console.error(
        "Failed to initialize Azure Container Instance Management Client:",
        error,
      );
      throw error;
    }

    // Initialize Upstash Redis client using REST API
    try {
      this.redisClient = new Redis({
        url: process.env.REDIS_HTTP_HOST,
        token: process.env.REDIS_HTTP_TOKEN,
      });

      console.log("Redis client initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Redis client:", error);
      throw error;
    }

    // Initialize PostgreSQL client using Drizzle ORM with Neon
    try {
      this.dbClient = drizzle(process.env.DATABASE_URL!);

      console.log("PostgreSQL client initialized successfully");
    } catch (error) {
      console.error("Failed to initialize PostgreSQL client:", error);
      throw error;
    }
  }

  async getQueuedJobs() {
    const queueName = `resque:queue:${this.judge0Version}`;

    try {
      const jobs = await this.redisClient.llen(queueName);

      return jobs;
    } catch (error) {
      console.error("Failed getting queued jobs:", error);
      throw error;
    }
  }

  async getRemainingJobs() {
    try {
      const [remainingJobs] = await this.dbClient
        .select({ count: count() })
        .from(submissions)
        .where(or(inArray(submissions.statusId, [1, 2]), isNull(submissions.statusId)));

      return remainingJobs;
    } catch (error) {
      console.error("Failed getting remaining jobs:", error);
      throw error;
    }
  }

  async getWorkerStats(): Promise<WorkerStats[]> {
    try {
      // Get queue size from Redis using the Judge0 version-specific queue name
      const queueName = `resque:queue:${this.judge0Version}`;

      // Get processing jobs count from PostgreSQL
      // Jobs in queue have status_id = 1 (Status.queue)
      // Jobs being processed have status_id = 2 (Status.process)
      // Jobs with null status_id are also considered in progress
      const [queueSize, processingJobs] = await Promise.all([
        this.redisClient.llen(queueName),
        this.dbClient
          .select({ count: count() })
          .from(submissions)
          .where(or(inArray(submissions.statusId, [1, 2]), isNull(submissions.statusId)))
          .then(([value]) => value.count),
      ]);

      const totalAvailable = Math.max(1, Math.ceil(processingJobs / 2)); // Estimate available workers
      const working = Math.min(processingJobs, totalAvailable);
      const idle = Math.max(0, totalAvailable - working);

      return [
        {
          queue: this.judge0Version,
          size: queueSize || 0,
          available: totalAvailable,
          idle,
          working,
          paused: 0, // We don't track paused workers from Redis/DB
          failed: 0, // We don't track failed workers from Redis/DB
        },
      ];
    } catch (error) {
      console.error("Failed to fetch worker stats from Redis/DB:", error);
      throw new Error(`Failed to fetch worker stats: ${error}`);
    }
  }

  // Optimized method to get all worker containers with their detailed info in parallel
  private async getAllWorkerContainers(): Promise<
    Array<{
      name: string;
      state: string;
      instanceNumber: number;
    }>
  > {
    try {
      // List all container groups that match our worker pattern
      const containerGroups = this.containerClient.containerGroups.listByResourceGroup(
        this.resourceGroupName,
      );

      // Collect all worker container group names in parallel during iteration
      const workerGroupNames: string[] = [];
      for await (const group of containerGroups) {
        if (
          group.name?.startsWith(this.containerGroupName) &&
          group.tags?.Component === "worker"
        ) {
          workerGroupNames.push(group.name);
        }
      }

      // Fetch detailed information for all worker groups in parallel
      const detailPromises = workerGroupNames.map((groupName) =>
        this.containerClient.containerGroups
          .get(this.resourceGroupName, groupName)
          .catch((error) => {
            console.error(`Failed to get details for worker ${groupName}:`, error);
            return null; // Return null for failed requests
          }),
      );

      const detailedGroups = await Promise.all(detailPromises);

      // Transform to standardized format
      return detailedGroups
        .filter((group) => group !== null)
        .map((group) => ({
          name: group!.name!,
          state: group!.instanceView?.state || "Unknown",
          instanceNumber: Number.parseInt(group!.tags?.WorkerInstance || "0"),
        }));
    } catch (error) {
      throw new Error(`Failed to get worker containers: ${error}`);
    }
  }

  async getCurrentWorkerCount(): Promise<{
    running: number;
    stopped: number;
    total: number;
  }> {
    try {
      const workers = await this.getAllWorkerContainers();

      console.log(workers);

      // Count running and stopped workers
      let runningWorkers = 0;
      let stoppedWorkers = 0;

      for (const worker of workers) {
        if (worker.state === "Running") {
          runningWorkers++;
        } else if (worker.state === "Stopped" || worker.state === "Terminated") {
          stoppedWorkers++;
        } else {
          // Handle other states like "Pending", "Starting", etc.
          console.warn(`Worker ${worker.name} is in state: ${worker.state}`);
          // Count as stopped for now, but could be refined based on requirements
          stoppedWorkers++;
        }
      }

      return {
        running: runningWorkers,
        stopped: stoppedWorkers,
        total: runningWorkers + stoppedWorkers,
      };
    } catch (error) {
      throw new Error(`Failed to get current worker count: ${error}`);
    }
  }

  calculateScalingDecision(
    workerStats: WorkerStats[],
    currentWorkers: WorkerCount,
  ): ScalingDecision {
    if (workerStats.length === 0) {
      return {
        action: "no_action",
        targetReplicas: currentWorkers.running,
        reason: "No worker stats available",
      };
    }

    // Calculate total queue size and worker utilization
    const totalQueueSize = workerStats.reduce((sum, stat) => sum + stat.size, 0);
    const totalWorking = workerStats.reduce((sum, stat) => sum + stat.working, 0);
    const totalIdle = workerStats.reduce((sum, stat) => sum + stat.idle, 0);
    const totalAvailable = workerStats.reduce((sum, stat) => sum + stat.available, 0);

    // Calculate utilization rate
    const utilizationRate = totalAvailable > 0 ? totalWorking / totalAvailable : 0;

    // Scale up conditions
    if (
      totalQueueSize >= this.config.scaleUpThreshold &&
      currentWorkers.running < this.config.maxWorkers
    ) {
      // More aggressive scaling based on queue size
      const recommendedWorkers = Math.min(
        Math.ceil(totalQueueSize / 5), // Assume each worker can handle ~5 jobs efficiently
        this.config.maxWorkers,
      );

      const targetReplicas = Math.max(recommendedWorkers, currentWorkers.running + 1);

      return {
        action: "scale_up",
        targetReplicas: Math.min(targetReplicas, this.config.maxWorkers),
        reason: `Queue size (${totalQueueSize}) exceeds threshold. Utilization: ${(utilizationRate * 100).toFixed(1)}%. Available stopped workers: ${currentWorkers.stopped}`,
      };
    }

    // Scale down conditions - be more conservative to avoid disrupting running jobs
    if (currentWorkers.running > this.config.minWorkers) {
      // Only scale down if we have significantly low utilization AND small queue
      if (
        totalQueueSize <= this.config.scaleDownThreshold &&
        utilizationRate < 0.3 && // Less than 30% utilization
        totalIdle >= 2
      ) {
        // At least 2 idle workers

        return {
          action: "scale_down",
          targetReplicas: Math.max(currentWorkers.running - 1, this.config.minWorkers),
          reason: `Low utilization (${(utilizationRate * 100).toFixed(1)}%) and queue size (${totalQueueSize}) below threshold`,
        };
      }

      // Scale to zero only if absolutely no activity
      if (
        totalQueueSize === 0 &&
        totalWorking === 0 &&
        totalAvailable === totalIdle &&
        this.config.minWorkers === 0
      ) {
        return {
          action: "scale_down",
          targetReplicas: 0,
          reason: "No jobs in queue and no active work - scaling to 0",
        };
      }
    }

    return {
      action: "no_action",
      targetReplicas: currentWorkers.running,
      reason: `Optimal state - Queue: ${totalQueueSize}, Working: ${totalWorking}, Idle: ${totalIdle}, Utilization: ${(utilizationRate * 100).toFixed(1)}%. Running: ${currentWorkers.running}, Stopped: ${currentWorkers.stopped}`,
    };
  }

  async scaleWorkers(targetReplicas: number): Promise<void> {
    // Get current worker count and last activity time in parallel for scale-down check
    const [currentWorkers, lastActivityTime] = await Promise.all([
      this.getCurrentWorkerCount(),
      this.getLastActivityTime(),
    ]);

    if (currentWorkers.running === targetReplicas) {
      console.log(`Already at target replica count: ${targetReplicas}`);
      return;
    }

    // For scale-down: only allow if enough time has passed since last scale-up activity
    if (targetReplicas < currentWorkers.running) {
      if (lastActivityTime) {
        const timeSinceLastActivity = new Date().getTime() - lastActivityTime.getTime();
        const cooldownMs = this.config.scaleCooldownMinutes * 60 * 1000;

        if (timeSinceLastActivity < cooldownMs) {
          const cooldownRemaining = cooldownMs - timeSinceLastActivity;
          console.log(
            `Scale-down blocked - only ${Math.ceil(timeSinceLastActivity / 1000)}s since last scale-up. Need ${Math.ceil(cooldownRemaining / 1000)}s more for cooldown`,
          );
          return;
        }
      }
    }

    if (targetReplicas > currentWorkers.running) {
      // Scale up - start stopped workers first, then create new ones if needed
      const instancesToStart = targetReplicas - currentWorkers.running;
      console.log(
        `Scaling up: need ${instancesToStart} more workers (${currentWorkers.stopped} stopped available)`,
      );

      if (currentWorkers.stopped > 0) {
        // Start stopped workers first (much faster)
        const workersToStart = Math.min(instancesToStart, currentWorkers.stopped);
        console.log(`Starting ${workersToStart} stopped workers`);

        const remainingNeeded = instancesToStart - workersToStart;

        // If we need both stopped workers and new workers, start them in parallel
        if (remainingNeeded > 0 && this.config.allowInfiniteScale) {
          console.log(
            `Starting ${workersToStart} stopped workers and creating ${remainingNeeded} new workers in parallel`,
          );
          await Promise.all([
            this.startStoppedWorkers(workersToStart),
            this.createNewWorkers(remainingNeeded, currentWorkers.total),
          ]);
        } else {
          await this.startStoppedWorkers(workersToStart);
          if (remainingNeeded > 0) {
            console.warn(
              `Need ${remainingNeeded} more workers but infinite scaling is disabled. Stopped workers pool exhausted.`,
            );
          }
        }
      } else if (this.config.allowInfiniteScale) {
        // No stopped workers available, create new ones only if infinite scaling is enabled
        console.log(`Creating ${instancesToStart} new workers (infinite scale enabled)`);
        await this.createNewWorkers(instancesToStart, currentWorkers.total);
      } else {
        console.warn(
          `Need ${instancesToStart} workers but stopped workers pool is empty and infinite scaling is disabled.`,
        );
      }
    } else {
      // Scale down - stop workers (faster than delete, preserves state)
      const workersToStop = currentWorkers.running - targetReplicas;
      console.log(`Scaling down: stopping ${workersToStop} workers`);
      await this.stopRunningWorkers(workersToStop);
    }

    // Record activity timestamp only for scale-up actions
    if (targetReplicas > currentWorkers.running) {
      await this.setLastActivityTime(new Date());
      console.log(`Scale-up completed. Activity timestamp updated.`);
    } else {
      console.log(`Scale-down completed.`);
    }
  }

  private static readonly ACTIVITY_KEY = "autoscaler:last_activity_time";

  private async getLastActivityTime(): Promise<Date | null> {
    try {
      const timestamp = await this.redisClient.get(Judge0Autoscaler.ACTIVITY_KEY);
      return timestamp ? new Date(Number.parseInt(timestamp.toString())) : null;
    } catch (error) {
      console.error("Failed to get last activity time from Redis:", error);
      return null;
    }
  }

  async setLastActivityTime(timestamp: Date): Promise<void> {
    try {
      // Store timestamp in Redis with TTL slightly longer than cooldown period
      const ttlSeconds = (this.config.scaleCooldownMinutes + 1) * 60;
      await this.redisClient.setex(
        Judge0Autoscaler.ACTIVITY_KEY,
        ttlSeconds,
        timestamp.getTime().toString(),
      );
    } catch (error) {
      console.error("Failed to set last activity time in Redis:", error);
    }
  }

  async startStoppedWorkers(count: number): Promise<void> {
    try {
      const workers = await this.getAllWorkerContainers();

      const stoppedWorkers = workers
        .filter((worker) => worker.state === "Stopped" || worker.state === "Terminated")
        .map((worker) => ({
          name: worker.name,
          instanceNumber: worker.instanceNumber,
        }));

      // Sort by instance number (lowest first) to start oldest instances first
      stoppedWorkers.sort((a, b) => a.instanceNumber - b.instanceNumber);

      // Start the required number of workers
      const startPromises = stoppedWorkers.slice(0, count).map(async (worker) => {
        try {
          console.log(`Starting stopped worker: ${worker.name}`);
          await this.containerClient.containerGroups.beginStartAndWait(
            this.resourceGroupName,
            worker.name,
          );
          console.log(`Successfully started worker: ${worker.name}`);
        } catch (error) {
          console.error(`Failed to start worker ${worker.name}:`, error);
          throw error;
        }
      });

      await Promise.all(startPromises);
    } catch (error) {
      console.error("Failed to start stopped workers:", error);
      throw error;
    }
  }

  async stopRunningWorkers(count: number): Promise<void> {
    try {
      const workers = await this.getAllWorkerContainers();

      const runningWorkers = workers
        .filter((worker) => worker.state === "Running")
        .map((worker) => ({
          name: worker.name,
          instanceNumber: worker.instanceNumber,
        }));

      // Sort by instance number (highest first) to stop newest instances first
      runningWorkers.sort((a, b) => b.instanceNumber - a.instanceNumber);

      // Stop the required number of workers
      const stopPromises = runningWorkers.slice(0, count).map(async (worker) => {
        try {
          console.log(`Stopping worker: ${worker.name}`);
          await this.containerClient.containerGroups.stop(
            this.resourceGroupName,
            worker.name,
          );
          console.log(`Successfully stopped worker: ${worker.name}`);
        } catch (error) {
          console.error(`Failed to stop worker ${worker.name}:`, error);
          throw error;
        }
      });

      await Promise.all(stopPromises);
    } catch (error) {
      console.error("Failed to stop running workers:", error);
      throw error;
    }
  }

  async createNewWorkers(count: number, currentTotal: number): Promise<void> {
    const createPromises = [];

    for (let i = 0; i < count; i++) {
      const instanceNumber = currentTotal + i + 1;
      createPromises.push(this.createWorkerInstance(instanceNumber));
    }

    await Promise.all(createPromises);
  }

  private async createWorkerInstance(instanceNumber: number): Promise<void> {
    const workerName = `${this.containerGroupName}-${instanceNumber}`;

    const containerGroupDefinition = {
      location: process.env.AZURE_LOCATION || "Southeast Asia",
      containers: [
        {
          name: "judge0-worker",
          image: `judge0/judge0:${process.env.JUDGE0_IMAGE_TAG || "1.13.1"}`,
          resources: {
            requests: {
              cpu: Number.parseFloat(process.env.WORKER_CPU || "1.0"),
              memoryInGB: Number.parseFloat(process.env.WORKER_MEMORY_GB || "2.0"),
            },
          },
          command: ["./scripts/workers"],
          securityContext: {
            privileged: true,
          },
          environmentVariables: [
            { name: "REDIS_HOST", value: process.env.REDIS_HOST || "" },
            { name: "REDIS_USE_SSL", value: process.env.REDIS_USE_SSL || "false" },
            { name: "INTERVAL", value: process.env.WORKER_INTERVAL || "1" },
            { name: "COUNT", value: process.env.WORKER_COUNT || "" },
            { name: "MAX_QUEUE_SIZE", value: process.env.MAX_QUEUE_SIZE || "100" },
            { name: "RAILS_ENV", value: process.env.RAILS_ENV || "production" },
            { name: "WORKER_ID", value: instanceNumber.toString() },
            // Judge0 limits - using environment variables for consistency
            { name: "CPU_TIME_LIMIT", value: process.env.CPU_TIME_LIMIT || "" },
            { name: "MAX_CPU_TIME_LIMIT", value: process.env.MAX_CPU_TIME_LIMIT || "" },
            { name: "CPU_EXTRA_TIME", value: process.env.CPU_EXTRA_TIME || "" },
            { name: "MAX_CPU_EXTRA_TIME", value: process.env.MAX_CPU_EXTRA_TIME || "" },
            { name: "WALL_TIME_LIMIT", value: process.env.WALL_TIME_LIMIT || "" },
            { name: "MAX_WALL_TIME_LIMIT", value: process.env.MAX_WALL_TIME_LIMIT || "" },
            { name: "MEMORY_LIMIT", value: process.env.MEMORY_LIMIT || "" },
            { name: "MAX_MEMORY_LIMIT", value: process.env.MAX_MEMORY_LIMIT || "" },
            { name: "STACK_LIMIT", value: process.env.STACK_LIMIT || "" },
            { name: "MAX_STACK_LIMIT", value: process.env.MAX_STACK_LIMIT || "" },
            {
              name: "MAX_PROCESSES_AND_OR_THREADS",
              value: process.env.MAX_PROCESSES_AND_OR_THREADS || "",
            },
            {
              name: "MAX_MAX_PROCESSES_AND_OR_THREADS",
              value: process.env.MAX_MAX_PROCESSES_AND_OR_THREADS || "",
            },
            {
              name: "ENABLE_PER_PROCESS_AND_THREAD_TIME_LIMIT",
              value: process.env.ENABLE_PER_PROCESS_AND_THREAD_TIME_LIMIT || "",
            },
            {
              name: "ALLOW_ENABLE_PER_PROCESS_AND_THREAD_TIME_LIMIT",
              value: process.env.ALLOW_ENABLE_PER_PROCESS_AND_THREAD_TIME_LIMIT || "",
            },
          ],
          secureEnvironmentVariables: [
            { name: "DATABASE_URL", value: process.env.DATABASE_URL || "" },
            { name: "REDIS_URL", value: process.env.REDIS_URL || "" },
            { name: "SECRET_KEY_BASE", value: process.env.SECRET_KEY_BASE || "" },
            { name: "AUTHN_TOKEN", value: process.env.AUTHN_TOKEN || "" },
            { name: "AUTHZ_TOKEN", value: process.env.AUTHZ_TOKEN || "" },
          ],
        },
      ],
      osType: "Linux",
      restartPolicy: process.env.WORKER_RESTART_POLICY || "OnFailure",
      sku: "Standard",
      ipAddress: {
        type: "None",
        ports: [],
      },
      tags: {
        Environment: process.env.ENVIRONMENT || "production",
        Application: "judge0",
        Component: "worker",
        ManagedBy: "autoscaler",
        WorkerInstance: instanceNumber.toString(),
      },
    };

    try {
      await this.containerClient.containerGroups.beginCreateOrUpdateAndWait(
        this.resourceGroupName,
        workerName,
        containerGroupDefinition,
      );
      console.log(`Successfully created worker instance: ${workerName}`);
    } catch (error) {
      console.error(`Failed to create worker instance ${workerName}:`, error);
      throw error;
    }
  }

  async checkAndScale(context: InvocationContext): Promise<void> {
    try {
      context.log("Starting autoscaling check...");

      // Fetch worker stats and current worker count in parallel
      const [workerStats, currentWorkers] = await Promise.all([
        this.getWorkerStats(),
        this.getCurrentWorkerCount(),
      ]);

      context.log("Worker stats:", workerStats);
      context.log(
        `Current workers - Running: ${currentWorkers.running}, Stopped: ${currentWorkers.stopped}, Total: ${currentWorkers.total}`,
      );

      // Calculate scaling decision
      const decision = this.calculateScalingDecision(workerStats, currentWorkers);
      context.log("Scaling decision:", decision);

      // Execute scaling if needed
      if (decision.action !== "no_action") {
        context.log(
          `Scaling action: ${decision.action} to ${decision.targetReplicas} workers`,
        );
        context.log(`Reason: ${decision.reason}`);

        await this.scaleWorkers(decision.targetReplicas);
        context.log("Scaling completed successfully");
      } else {
        context.log(`No scaling needed: ${decision.reason}`);
      }
    } catch (error) {
      context.error("Autoscaling failed:", error);
      throw error;
    }
  }

  async getScalingInfo(context?: InvocationContext): Promise<{
    workerStats: WorkerStats[];
    currentWorkers: WorkerCount;
    scalingDecision: ScalingDecision;
    lastActivityTime: Date | null;
    cooldownStatus: {
      inCooldown: boolean;
      remainingCooldownSeconds: number;
    };
  }> {
    try {
      if (context) context.log("Getting scaling info...");

      // Fetch worker stats, worker count, and last activity time in parallel
      const [workerStats, currentWorkers, lastActivityTime] = await Promise.all([
        this.getWorkerStats(),
        this.getCurrentWorkerCount(),
        this.getLastActivityTime(),
      ]);

      // Calculate scaling decision based on the fetched data
      const scalingDecision = this.calculateScalingDecision(workerStats, currentWorkers);

      // Calculate cooldown status
      const cooldownStatus = this.getCooldownStatus(lastActivityTime);

      return {
        workerStats,
        currentWorkers,
        scalingDecision,
        lastActivityTime,
        cooldownStatus,
      };
    } catch (error) {
      if (context) context.error("Failed to get scaling info:", error);
      throw error;
    }
  }

  private getCooldownStatus(lastActivityTime: Date | null): {
    inCooldown: boolean;
    remainingCooldownSeconds: number;
  } {
    if (!lastActivityTime) {
      return { inCooldown: false, remainingCooldownSeconds: 0 };
    }

    const timeSinceLastActivity = new Date().getTime() - lastActivityTime.getTime();
    const cooldownMs = this.config.scaleCooldownMinutes * 60 * 1000;
    const remainingCooldownMs = cooldownMs - timeSinceLastActivity;

    return {
      inCooldown: remainingCooldownMs > 0,
      remainingCooldownSeconds: Math.max(0, Math.ceil(remainingCooldownMs / 1000)),
    };
  }
}

// Global initialization - runs once per container lifecycle (not billed)
const globalAutoscaler = new Judge0Autoscaler();

// Timer trigger function that runs every 15 seconds
// app.timer("judge0Autoscaler", {
//   schedule: "*/15 * * * * *", // Every 15 seconds
//   handler: async (myTimer: Timer, context: InvocationContext) => {
//     // Use global instance - connections are reused across invocations
//     // await globalAutoscaler.checkAndScale(context);
//     console.log("test");
//   },
// });

// HTTP trigger for getting scaling status and manual scaling
app.http("scalingStatus", {
  methods: ["GET", "POST"],
  authLevel: "function",
  handler: async (
    request: HttpRequest,
    context: InvocationContext,
  ): Promise<HttpResponseInit> => {
    try {
      if (request.method === "GET") {
        // GET: Return current scaling status
        context.log("Getting scaling status via HTTP...");

        const scalingInfo = await globalAutoscaler.getScalingInfo(context);

        return {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            {
              timestamp: new Date().toISOString(),
              config: globalAutoscaler.getConfig(),
              ...scalingInfo,
            },
            null,
            2,
          ),
        };
      } else if (request.method === "POST") {
        // POST: Trigger manual scaling check
        context.log("Triggering manual scaling check via HTTP...");

        // Parse request body for optional force flag
        let forceScale = false;
        try {
          const body = await request.text();
          if (body) {
            const parsed = JSON.parse(body);
            forceScale = parsed.force === true;
          }
        } catch {
          // Ignore JSON parse errors
        }

        if (forceScale) {
          context.log("Force scaling requested - bypassing cooldown checks");

          // Get scaling info first
          const scalingInfo = await globalAutoscaler.getScalingInfo(context);

          if (scalingInfo.scalingDecision.action !== "no_action") {
            // Force execute the scaling action by creating a modified scaleWorkers call that bypasses cooldown
            const currentWorkers = scalingInfo.currentWorkers;
            const targetReplicas = scalingInfo.scalingDecision.targetReplicas;

            context.log(
              `Force scaling: ${scalingInfo.scalingDecision.action} to ${targetReplicas} workers`,
            );

            // Execute scaling directly without cooldown check
            if (targetReplicas > currentWorkers.running) {
              // Scale up logic
              const instancesToStart = targetReplicas - currentWorkers.running;
              console.log(
                `Force scaling up: need ${instancesToStart} more workers (${currentWorkers.stopped} stopped available)`,
              );

              if (currentWorkers.stopped > 0) {
                const workersToStart = Math.min(instancesToStart, currentWorkers.stopped);
                const remainingNeeded = instancesToStart - workersToStart;

                if (
                  remainingNeeded > 0 &&
                  globalAutoscaler.getConfig().allowInfiniteScale
                ) {
                  console.log(
                    `Force starting ${workersToStart} stopped workers and creating ${remainingNeeded} new workers in parallel`,
                  );
                  await Promise.all([
                    globalAutoscaler.startStoppedWorkers(workersToStart),
                    globalAutoscaler.createNewWorkers(
                      remainingNeeded,
                      currentWorkers.total,
                    ),
                  ]);
                } else {
                  await globalAutoscaler.startStoppedWorkers(workersToStart);
                }
              } else if (globalAutoscaler.getConfig().allowInfiniteScale) {
                await globalAutoscaler.createNewWorkers(
                  instancesToStart,
                  currentWorkers.total,
                );
              }

              // Set activity timestamp for scale-up
              await globalAutoscaler.setLastActivityTime(new Date());
            } else if (targetReplicas < currentWorkers.running) {
              // Scale down logic
              const workersToStop = currentWorkers.running - targetReplicas;
              console.log(`Force scaling down: stopping ${workersToStop} workers`);
              await globalAutoscaler.stopRunningWorkers(workersToStop);
            }

            context.log("Force scaling completed successfully");

            // Get final status efficiently - reuse what we can
            const [finalWorkerStats, finalCurrentWorkers] = await Promise.all([
              globalAutoscaler.getWorkerStats(),
              globalAutoscaler.getCurrentWorkerCount(),
            ]);

            return {
              status: 200,
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(
                {
                  message: "Force scaling completed",
                  action: scalingInfo.scalingDecision.action,
                  targetReplicas: scalingInfo.scalingDecision.targetReplicas,
                  reason: scalingInfo.scalingDecision.reason,
                  timestamp: new Date().toISOString(),
                  updatedInfo: {
                    workerStats: finalWorkerStats,
                    currentWorkers: finalCurrentWorkers,
                    scalingDecision: globalAutoscaler.calculateScalingDecision(
                      finalWorkerStats,
                      finalCurrentWorkers,
                    ),
                  },
                },
                null,
                2,
              ),
            };
          } else {
            return {
              status: 200,
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(
                {
                  message: "No scaling action needed",
                  reason: scalingInfo.scalingDecision.reason,
                  timestamp: new Date().toISOString(),
                  scalingInfo,
                },
                null,
                2,
              ),
            };
          }
        } else {
          // Regular manual trigger - respect cooldown
          await globalAutoscaler.checkAndScale(context);
          context.log("Manual scaling check completed successfully");

          // Get updated scaling info after the check
          const updatedInfo = await globalAutoscaler.getScalingInfo(context);

          return {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(
              {
                message: "Manual scaling check completed",
                timestamp: new Date().toISOString(),
                ...updatedInfo,
              },
              null,
              2,
            ),
          };
        }
      } else {
        return {
          status: 405,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            error: "Method not allowed. Use GET for status or POST for manual trigger.",
          }),
        };
      }
    } catch (error) {
      context.error("HTTP scaling endpoint failed:", error);
      return {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Internal server error",
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        }),
      };
    }
  },
});
