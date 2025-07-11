import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const languages = pgTable("languages", {
  id: serial().primaryKey().notNull(),
  name: varchar(),
  compileCmd: varchar("compile_cmd"),
  runCmd: varchar("run_cmd"),
  sourceFile: varchar("source_file"),
  isArchived: boolean("is_archived").default(false),
});

export const clients = pgTable("clients", {
  id: varchar().primaryKey().notNull(),
});

export const submissions = pgTable(
  "submissions",
  {
    id: serial().primaryKey().notNull(),
    sourceCode: text("source_code"),
    languageId: integer("language_id"),
    stdin: text(),
    expectedOutput: text("expected_output"),
    stdout: text(),
    statusId: integer("status_id"),
    createdAt: timestamp("created_at", { mode: "string" }),
    finishedAt: timestamp("finished_at", { mode: "string" }),
    time: numeric(),
    memory: integer(),
    stderr: text(),
    token: varchar(),
    numberOfRuns: integer("number_of_runs"),
    cpuTimeLimit: numeric("cpu_time_limit"),
    cpuExtraTime: numeric("cpu_extra_time"),
    wallTimeLimit: numeric("wall_time_limit"),
    memoryLimit: integer("memory_limit"),
    stackLimit: integer("stack_limit"),
    maxProcessesAndOrThreads: integer("max_processes_and_or_threads"),
    enablePerProcessAndThreadTimeLimit: boolean(
      "enable_per_process_and_thread_time_limit",
    ),
    enablePerProcessAndThreadMemoryLimit: boolean(
      "enable_per_process_and_thread_memory_limit",
    ),
    maxFileSize: integer("max_file_size"),
    compileOutput: text("compile_output"),
    exitCode: integer("exit_code"),
    exitSignal: integer("exit_signal"),
    message: text(),
    wallTime: numeric("wall_time"),
    compilerOptions: varchar("compiler_options"),
    commandLineArguments: varchar("command_line_arguments"),
    redirectStderrToStdout: boolean("redirect_stderr_to_stdout"),
    callbackUrl: varchar("callback_url"),
    // TODO: failed to parse database type 'bytea'
    // additionalFiles: unknown("additional_files"),
    enableNetwork: boolean("enable_network"),
  },
  (table) => [
    index("index_submissions_on_token").using(
      "btree",
      table.token.asc().nullsLast().op("text_ops"),
    ),
  ],
);
