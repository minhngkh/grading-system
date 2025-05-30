import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Header = ({ studentName }: { studentName: string }) => (
  <div className="relative my-2 flex items-center gap-2">
    <Button variant="outline" className="w-10 h-10 flex items-center justify-center">
      <ArrowLeft className="w-6 h-6" strokeWidth={3} />
    </Button>

    <Badge variant="outline" className="text-lg h-10 px-5 flex-1 text-center">
      {studentName}
    </Badge>
  </div>
);

export default Header;
