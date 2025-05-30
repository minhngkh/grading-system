import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ScoreAdjust = ({
  criteria,
  scores,
  handleScoreChange,
  activeScoreTab,
  setActiveScoreTab,
  currentScore,
  maxScore,
  onSubmit,
}: {
  criteria: {
    name: string;
    maxScore: number;
    levels: { score: number; label: string; description: string }[];
  }[];
  scores: Record<string, number>;
  handleScoreChange: (criterionName: string, score: number) => void;
  activeScoreTab: string;
  setActiveScoreTab: (value: string) => void;
  currentScore: number;
  maxScore: number;
  onSubmit: () => void;
}) => (
  <div className="border-t py-2 mt-4 flex flex-col">
    {/* Adjust Score Section */}
    <Tabs value={activeScoreTab} onValueChange={setActiveScoreTab} className="mt-2">
      <TabsList className="flex border-b w-full">
        {criteria.map((criterion) => (
          <TabsTrigger
            key={criterion.name}
            value={criterion.name}
            className="flex-1 flex justify-between items-center pl-4 pr-7"
          >
            <div className="font-bold">{criterion.name}</div>
            <div className="text-sm text-gray-700">
              {scores[criterion.name] || 0}/{criterion.maxScore}
            </div>
          </TabsTrigger>
        ))}
      </TabsList>

      {criteria.map((criterion) => (
        <TabsContent key={criterion.name} value={criterion.name}>
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${criterion.levels.length}, minmax(0, 1fr))`,
            }}
          >
            {criterion.levels.map((level) => (
              <Button
                key={level.score}
                onClick={() => handleScoreChange(criterion.name, level.score)}
                variant="outline"
                className={`p-4 flex flex-col items-start rounded-md text-left w-full h-auto min-h-[80px] text-black transition-colors ${
                  scores[criterion.name] === level.score
                    ? "bg-[#D4E3FC] hover:bg-[#D4E3FC]"
                    : "bg-[#EAF1F6] hover:bg-[#D4E3FC]"
                }`}
              >
                <div className="font-bold whitespace-nowrap">{level.label}</div>
                <div className="text-sm text-wrap break-words leading-snug">
                  {level.description}
                </div>
              </Button>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>

    {/* Submit Section */}
    <div className="flex items-stretch w-full h-full border rounded-lg mt-4">
      <Button className="bg-black text-white px-6 py-2 rounded-r-none" onClick={onSubmit}>
        Submit
      </Button>
      <div className="flex-1 text-right pr-4 font-medium flex items-center justify-end">
        {currentScore}
      </div>
      <div className="bg-gray-200 rounded-r-lg flex items-center px-4">
        <span className="text-sm font-medium">
          {currentScore} / {maxScore}
        </span>
      </div>
    </div>
  </div>
);

export default ScoreAdjust;
