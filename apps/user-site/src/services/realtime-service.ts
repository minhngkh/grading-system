import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

type SignalREventCallback = (...args: any[]) => void;

const HUB_URL = `${import.meta.env.VITE_ASSIGNMENT_FLOW_URL}/hubs/gradings`;

export class SignalRService {
  private connection: HubConnection;

  constructor(private accessTokenFactory?: () => string) {
    this.connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: this.accessTokenFactory,
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect([0, 2000, 5000, 10000, 10000])
      .build();
  }

  public async start(): Promise<void> {
    if (
      this.connection.state === HubConnectionState.Connected ||
      this.connection.state === HubConnectionState.Connecting
    ) {
      return;
    }

    try {
      await this.connection.start();
    } catch (error) {
      console.error("SignalR start error:", error);
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.connection.stop();
    } catch (error) {
      console.error("SignalR stop error:", error);
    }
  }

  public on<T = any>(eventName: string, callback: (data: T) => void) {
    this.connection.on(eventName, callback);
  }

  public off(eventName: string, callback?: SignalREventCallback) {
    if (!callback) {
      this.connection.off(eventName);
      return;
    }

    this.connection.off(eventName, callback);
  }

  public async invoke<T = any>(methodName: string, ...args: any[]): Promise<T> {
    try {
      return await this.connection.invoke<T>(methodName, ...args);
    } catch (error) {
      console.error(`SignalR invoke error on method ${methodName}:`, error);
      throw error;
    }
  }

  public get state() {
    return this.connection.state;
  }
}
