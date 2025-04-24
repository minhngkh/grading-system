import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import type React from "react";
import { useRef, useState } from "react";
import { Button } from "./components/ui/button";

interface GradingResult {
  criterion: string;
  score: number;
  feedback: string;
  fileReference: string;
  position?: {
    fromLine: number;
    fromColumn?: number;
    toLine: number;
    toColumn?: number;
  };
}

/**
 * Main grading demo app: rubric/code input, submit, and results table.
 */
function App() {
  const [rubric, setRubric] = useState("");
  const [code, setCode] = useState("");
  const [results, setResults] = useState<GradingResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rubricFileRef = useRef<HTMLInputElement>(null);
  const codeFileRef = useRef<HTMLInputElement>(null);

  // Handles rubric file upload
  function handleRubricFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(setRubric);
  }

  // Handles code file upload
  function handleCodeFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(setCode);
  }

  // Mutation to call grading API
  const gradeMutation = useMutation({
    mutationFn: async ({
      rubricPrompt,
      fileText,
    }: {
      rubricPrompt: string;
      fileText: string;
    }) => {
      const res = await axios.post("http://localhost:4000/api/grade-demo", {
        rubricPrompt,
        fileText,
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setResults(data.results);
        setError(null);
      } else {
        setResults(null);
        setError(data.error || "Unknown error");
      }
    },
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    onError: (err: any) => {
      setResults(null);
      setError(err?.message || "Request failed");
    },
  });

  // Handles form submit
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResults(null);
    setError(null);
    gradeMutation.mutate({ rubricPrompt: rubric, fileText: code });
  }

  return (
    <div className="max-w-1/2 mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Grading Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="block font-medium mb-1">Rubric</div>
              <Textarea
                value={rubric}
                onChange={(e) => setRubric(e.target.value)}
                placeholder="Paste rubric here or upload file"
                className="min-h-[80px]"
              />
              <Input
                type="file"
                accept=".md,.txt"
                ref={rubricFileRef}
                onChange={handleRubricFile}
                className="mt-2"
              />
            </div>
            <div>
              <div className="block font-medium mb-1">Code</div>
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste code here or upload file"
                className="min-h-[80px] font-mono"
              />
              <Input
                type="file"
                accept=".go,.js,.ts,.py,.java,.txt"
                ref={codeFileRef}
                onChange={handleCodeFile}
                className="mt-2"
              />
            </div>
            <Button type="submit" disabled={gradeMutation.isPending}>
              {gradeMutation.isPending ? "Grading..." : "Grade"}
            </Button>
          </form>
          {error && <div className="mt-4 text-red-600">{error}</div>}
          {results && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Results</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Criterion</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Feedback</TableHead>
                    <TableHead>File Ref</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={r.criterion}>
                      <TableCell>{r.criterion}</TableCell>
                      <TableCell>{r.score}</TableCell>
                      <TableCell className="break-words whitespace-pre-line">
                        {r.feedback}
                      </TableCell>
                      <TableCell className="break-all">{r.fileReference}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
