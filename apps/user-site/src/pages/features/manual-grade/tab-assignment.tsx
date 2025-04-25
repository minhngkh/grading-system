import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

const TabsSection = ({
  tabs,
  activeTab,
  setActiveTab,
}: {
  tabs: { value: string; label: string; content: string; language: string }[];
  activeTab: string;
  setActiveTab: (value: string) => void;
}) => (
  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
    <TabsList className="flex border-b w-full">
      {tabs.map((tab) => (
        <TabsTrigger key={tab.value} value={tab.value} className="p-2 flex-1">
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>

    <div className="flex">
      <div className="p-4 w-5/6">
        {tabs.map(({ value, content, language }) => (
          <TabsContent
            key={value}
            value={value}
            className="p-1 border bg-white rounded shadow h-[50vh] overflow-auto"
          >
            {value === "code" ? (
              <SyntaxHighlighter
                language={language}
                style={oneLight}
                showLineNumbers
              >
                {content}
              </SyntaxHighlighter>
            ) : (
              <pre className="p-2">{content}</pre>
            )}
          </TabsContent>
        ))}
      </div>

      {/* File Explorer */}
      <div className="w-1/4 border-l p-2 my-6">
        <h3 className="text-lg font-medium">File Explorer</h3>
        <ul className="space-y-2">
          <li className="text-blue-500 cursor-pointer">fibonacci.cpp</li>
          <li className="text-gray-500">test_cases.txt</li>
        </ul>
      </div>
    </div>
  </Tabs>
);

export default TabsSection;
