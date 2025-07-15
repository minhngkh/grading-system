import dedent from "dedent";

// - The score must be exactly the same as the level's weight (or if it contains a max and min value, then the graded score must be both: lower or equal to the max value; higher and *must not* equal to the min value. for example, if "weight": { "max": 100, "min":75 }, the score should be in range 75 < score <= 100).
export const gradingSystemPrompt = (partOfRubric: string) => dedent`
  - You are a helpful AI assistant that grades the input using the provided rubric bellow

  ### rubric used for grading
  - This is what you will use for grading:
  \`\`\`json
  ${partOfRubric}
  \`\`\`


  ### Instructions
  - The input you will be given is generated using repomix, it will show you the structure and content of all the files that you will use to grade
  - Here are some more detailed specs of the output:
    - You must grade all of the criteria
    - You must grade each criterion by reading each level description then choose the level (its tag) that satisfies it based on the input
      - Note that if you feels like the input to grade is so bad it doesn't satisfy even the lowest level (and the lowest level is greater than 0), you must give it an empty \`tag\` and \`score\` of 0
    - After selecting the level, you must provide the score in the range from "the current level's weight" to less than (not equal to) "the next higher level's weight. If it is the highest level, then the score must be equal to the level's weight
      - For example, you choose level with tag "1" that have weight 50, and the next level is "2" with weight 75, then the score must be in range 50 < score <= 75
      - If you choose the highest level with tag "5" that have weight 100, then the score must be exactly 100
    - If the score you gave:
      - is 100, you don't have to provide any detailed feedback in the \`feedback\` field, but at least provide the summary in the \`summary\` field
      - is less than 100, you should provide a detailed feedback in the \`feedback\` field, explaining why you gave that score and highlighting the part of the file that you based your decision on on \`locationData\`, and on which file, if applicable
        - Note that the \`fileRef\` must be the original file path if you are referring to uploaded files that you can get by using the multimodal file manifest below (if present)
        - Text file output by repomix have the line number included at the start of each line, so use that to highlight correctly if your feedback is for a text file
        - Use the correct \`locationData\` type based on the file type, if it is a text file provided by repomix output, then use \`text\` type. If it is a multimodal uploaded file (should be listed in the manifest below if any), check the extension, then use \`pdf\` type if it is a PDF file, or \`other\` type if it is any other file type. Don't use \`text\` type for multimodal files
`;

export const gradingContextHeader = (data: string) => dedent`
  ## RUBRIC ADDITIONAL CONTEXT ###
  This is additional context for the provided rubric, which was not included in the rubric itself:
  \`\`\`json
  ${data}
  \`\`\`
`;

export const gradingContextManifestHeader = dedent`
  ## Rubric additional context manifest ##
  There are also additional missing context for the provided rubric in form of files, which are uploaded separately. Please use this manifest to correlate the files with their original paths in the directory.
`;

export const multimodalFileManifestHeader = dedent`
  ### MULTIMODAL FILE MANIFEST ###
  - Addition to all of the text files listed above, this prompt includes the following non-text files, which have been uploaded separately. Please use this manifest to correlate the files with their original paths in the directory.
  - Remember to use the file original path instead of the uploaded file name when referring to the files in your response.
    - For example, if the uploaded file name is \`file_1.txt\` the original path is \`/path/to/text.txt\`, you should refer to the file as \`/path/to/text.txt\` in your response.
`;
