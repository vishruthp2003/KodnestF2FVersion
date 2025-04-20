
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

const LiveClasses = () => {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          Live Classes
          <span className="text-gray-400 text-sm">ⓘ</span>
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-6">
        {["Java - 2025", "SQL - 2025", "TCS Preparation 2025"].map((course, index) => (
          <div key={index} className="border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white">
                {course[0]}
              </div>
              <div>
                <h3 className="font-semibold">{course}</h3>
                <p className="text-sm text-gray-500">Mentor: {index === 2 ? "Ayush B" : "Punith Kumar"}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: "97%" }}></div>
              </div>
              <p className="text-sm text-gray-500">Class Time: 09:00 AM - 10:15 AM</p>
            </div>
            <div className="flex items-center justify-between">
              <Button variant="ghost" className="text-gray-500">
                Help Desk
              </Button>
              <Button>Join Class</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveClasses;
