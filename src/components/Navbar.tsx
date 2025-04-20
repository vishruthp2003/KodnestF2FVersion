
import { Home, BookOpen, Target, Trophy, HelpCircle, MessageSquare, User } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b z-50">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-yellow-400">K</span>
              <span className="text-2xl font-bold">odNest</span>
            </Link>
            <div className="flex items-center gap-6">
              <Button variant="ghost" className="flex items-center gap-2">
                <Home size={20} />
                Home
              </Button>
              <Button variant="ghost" className="flex items-center gap-2">
                <BookOpen size={20} />
                Courses
              </Button>
              <Button variant="ghost" className="flex items-center gap-2">
                <Target size={20} />
                Practice
              </Button>
              <Button variant="ghost" className="flex items-center gap-2">
                <Trophy size={20} />
                Contest
              </Button>
              <Button
                variant="ghost"
                className="flex items-center gap-2"
                onClick={() => window.open('/interview', '_blank')}
              >
                <MessageSquare size={20} />
                F2F Interview
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="secondary" className="bg-purple-600 text-white hover:bg-purple-700">
              <HelpCircle className="mr-2" size={20} />
              Help and Earn
            </Button>
            <Button variant="ghost" className="flex items-center gap-2">
              <MessageSquare size={20} />
              Mentor Connect
            </Button>
            <Button variant="ghost" className="w-10 h-10 rounded-full p-0">
              <User size={20} />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
