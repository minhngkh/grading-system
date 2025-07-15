import { CustomError } from "@grading-system/utils/error";

export class EmptyListError extends CustomError.withTag("EmptyListError")<void> {}
