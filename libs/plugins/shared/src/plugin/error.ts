import { CustomError } from "@grading-system/utils/error";

export class ErrorWithCriteriaInfo extends CustomError.withTag("ErrorWithCriteriaInfo")<{
  criterionNames: string[];
}> {}

export class ErrorWithCriterionInfo extends CustomError.withTag("ErrorWithCriterionInfo")<{
  criterionName: string;
}> {}