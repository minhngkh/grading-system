import { Badge } from "@/components/ui/badge";
import { type ToolsFilterProps, ToolType } from "@/types/tool";

const toolTypeList = Object.values(ToolType);

const ToolsFilter: React.FC<ToolsFilterProps> = ({
  currentFilter,
  filterFunction = () => {},
}) => {
  return (
    <div className="flex flex-wrap gap-2 h-full">
      {toolTypeList.map((type, index) => (
        <Badge
          variant={currentFilter !== type ? "outline" : "default"}
          onClick={() => filterFunction(type)}
          className="py-1 px-2 cursor-pointer hover:bg-accent"
          key={index}
        >
          {type}
        </Badge>
      ))}
    </div>
  );
};

export default ToolsFilter;
