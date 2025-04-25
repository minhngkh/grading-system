import { useState } from "react";
import Header from "./header";
import ScoreAdjust from "./score-adjust";
import TabsSection from "./tab-assignment";

const sampleCode = `#include <stdio.h>
#include <math.h>

int fibo(long long n){
    if(n == 0 || n == 1){
        return 1;
    }
    long long fn1 = 1, fn2 = 0, fn;
    for(int i = 2; i <= 92; i++){
        fn = fn1 + fn2;
        if(fn == n){
            return 1;
        }
        fn2 = fn1;
        fn1 = fn;
    }
    return 0;
}`;
const tabs = [
  { value: "code", label: "Code", content: sampleCode, language: "cpp" },
  {
    value: "test-result",
    label: "Test Result",
    content: "All tests passed!",
    language: "text",
  },
  {
    value: "feedback",
    label: "Feedback Overview",
    content: "Good job! Your code is clean.",
    language: "text",
  },
];

const criteria = [
  {
    name: "Correctness",
    maxScore: 5,
    levels: [
      { score: 0, label: "0 - Fail", description: "One or more tests fail" },
      { score: 5, label: "5 - Pass", description: "Pass all tests" },
    ],
  },
  {
    name: "Readability & Style",
    maxScore: 2,
    levels: [
      { score: 0, label: "0/2", description: "Code is messy and hard to read" },
      {
        score: 1,
        label: "1/2",
        description: "Code is somewhat readable but needs improvements",
      },
      {
        score: 2,
        label: "2/2",
        description: "Code is well-structured and easy to read",
      },
    ],
  },
  {
    name: "Comments",
    maxScore: 3,
    levels: [
      {
        score: 0,
        label: "0/3",
        description: "No comments or unhelpful comments",
      },
      {
        score: 1,
        label: "1/3",
        description: "Few comments, but not enough to explain logic",
      },
      {
        score: 2,
        label: "2/3",
        description: "Comments explain some parts but could be better",
      },
      {
        score: 3,
        label: "3/3",
        description: "Comments are clear and properly explain the code",
      },
    ],
  },
];
export default function ManualAdjustScore() {
  const [activeTab, setActiveTab] = useState("code");
  const [activeScoreTab, setActiveScoreTab] = useState(criteria[0].name);
  const [scores, setScores] = useState<Record<string, number>>({});
  const maxScore = criteria.reduce(
    (sum, criterion) => sum + criterion.maxScore,
    0
  );
  const currentScore = Object.values(scores).reduce(
    (sum, score) => sum + score,
    0
  );

  const handleScoreChange = (criterionName: string, score: number) => {
    setScores((prevScores) => ({
      ...prevScores,
      [criterionName]: score,
    }));
  };

  const handleSubmit = () => {
    console.log("Submitted scores:", scores);
  };

  return (
    <div className="w-full flex flex-col px-4">
      <Header studentName="Student's Name" />
      <TabsSection
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <ScoreAdjust
        criteria={criteria}
        scores={scores}
        handleScoreChange={handleScoreChange}
        activeScoreTab={activeScoreTab}
        setActiveScoreTab={setActiveScoreTab}
        currentScore={currentScore}
        maxScore={maxScore}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
