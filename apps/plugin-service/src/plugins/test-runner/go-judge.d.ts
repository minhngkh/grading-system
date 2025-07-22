import type { Buffer } from "node:buffer";

export namespace GoJudge {
  type RunResult = Result[];

  interface Cmd {
    args: string[]; // command line argument
    env?: string[]; // environment

    // specifies file input / pipe collector for program file descriptors (null is reserved for pipe mapping and must be filled by in / out)
    files?: (
      | LocalFile
      | MemoryFile
      | PreparedFile
      | Collector
      | StreamIn
      | StreamOut
      | null
    )[];
    tty?: boolean; // enables tty on the input and output pipes (should have just one input & one output)
    // Notice: must have TERM environment variables (e.g. TERM=xterm)

    // limitations
    cpuLimit?: number; // ns
    realCpuLimit?: number; // deprecated: use clock limit instead (still working)
    clockLimit?: number; // ns
    memoryLimit?: number; // byte
    stackLimit?: number; // byte (N/A on windows, macOS cannot set over 32M)
    procLimit?: number;
    cpuRateLimit?: number; // limit cpu usage (1000 equals 1 cpu)
    cpuSetLimit?: string; // Linux only: set the cpuSet for cgroup
    strictMemoryLimit?: boolean; // deprecated: use dataSegmentLimit instead (still working)
    dataSegmentLimit?: boolean; // Linux only: use (+ rlimit_data limit) enable by default if cgroup not enabled
    addressSpaceLimit?: boolean; // Linux only: use (+ rlimit_address_space limit)

    // copy the correspond file to the container dst path
    copyIn?: { [dst: string]: LocalFile | MemoryFile | PreparedFile | Symlink };

    // copy out specifies files need to be copied out from the container after execution
    // append '?' after file name will make the file optional and do not cause FileError when missing
    copyOut?: string[];
    // similar to copyOut but stores file in go judge and returns fileId, later download through /file/:fileId
    copyOutCached?: string[];
    // specifies the directory to dump container /w content
    copyOutDir: string;
    // specifies the max file size to copy out
    copyOutMax?: number; // byte
  }

  interface Result {
    status: Status;
    error?: string; // potential system error message
    exitStatus: number;
    time: number; // ns (cgroup recorded time)
    memory: number; // byte
    runTime: number; // ns (wall clock time)
    procPeak?: number; // peak number of process (cgroup v2, kernel >= 6.1)
    // copyFile name -> content
    files?: { [name: string]: string };
    // copyFileCached name -> fileId
    fileIds?: { [name: string]: string };
    // fileError contains detailed file errors
    fileError?: FileError[];
  }

  enum Status {
    Accepted = "Accepted", // normal
    MemoryLimitExceeded = "Memory Limit Exceeded", // mle
    TimeLimitExceeded = "Time Limit Exceeded", // tle
    OutputLimitExceeded = "Output Limit Exceeded", // ole
    FileError = "File Error", // fe
    NonzeroExitStatus = "Nonzero Exit Status",
    Signalled = "Signalled",
    InternalError = "Internal Error", // system error
  }

  interface Request {
    requestId?: string; // for WebSocket requests
    cmd: Cmd[];
    pipeMapping?: PipeMap[];
  }

  interface LocalFile {
    src: string; // absolute path for the file
  }

  interface MemoryFile {
    content: string | Buffer; // file contents
  }

  interface PreparedFile {
    fileId: string; // fileId defines file uploaded by /file
  }

  interface Collector {
    name: string; // file name in copyOut
    max: number; // maximum bytes to collect from pipe
    pipe?: boolean; // collect over pipe or not (default false)
  }

  interface Symlink {
    symlink: string; // symlink destination (v1.6.0+)
  }

  interface StreamIn {
    streamIn: boolean; // stream input (v1.8.1+)
  }

  interface StreamOut {
    streamOut: boolean; // stream output (v1.8.1+)
  }

  interface PipeIndex {
    index: number; // the index of cmd
    fd: number; // the fd number of cmd
  }

  interface PipeMap {
    in: PipeIndex; // input end of the pipe
    out: PipeIndex; // output end of the pipe
    // enable pipe proxy from in to out,
    // content from in will be discarded if out closes
    proxy?: boolean;
    name?: string; // copy out proxy content if proxy enabled
    // limit the copy out content size,
    // proxy will still functioning after max
    max?: number;
  }

  enum FileErrorType {
    CopyInOpenFile = "CopyInOpenFile",
    CopyInCreateFile = "CopyInCreateFile",
    CopyInCopyContent = "CopyInCopyContent",
    CopyOutOpen = "CopyOutOpen",
    CopyOutNotRegularFile = "CopyOutNotRegularFile",
    CopyOutSizeExceeded = "CopyOutSizeExceeded",
    CopyOutCreateFile = "CopyOutCreateFile",
    CopyOutCopyContent = "CopyOutCopyContent",
    CollectSizeExceeded = "CollectSizeExceeded",
  }

  interface FileError {
    name: string; // error file name
    type: FileErrorType; // type
    message?: string; // detailed message
  }

  interface CancelRequest {
    cancelRequestId: string;
  }

  // WebSocket request
  type WSRequest = Request | CancelRequest;

  // WebSocket results
  interface WSResult {
    requestId: string;
    results: Result[];
    error?: string;
  }

  // Stream request & responses
  interface Resize {
    index: number;
    fd: number;
    rows: number;
    cols: number;
    x: number;
    y: number;
  }

  interface Input {
    index: number;
    fd: number;
    content: Buffer;
  }

  interface Output {
    index: number;
    fd: number;
    content: Buffer;
  }
}
