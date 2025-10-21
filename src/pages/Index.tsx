import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Briefcase, CheckCircle, Clock, Users, Sparkles } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-hero">
      <div className="container mx-auto px-6 py-16">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-glow">
            <Briefcase className="w-10 h-10 text-white" />
          </div>
          
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white">AITaskHub</h1>
            <p className="text-xl md:text-2xl text-white/90">
              Streamline task management for IT supervisors and interns
            </p>
            <p className="text-lg text-white/75">
              Full-featured task management with AI-powered assistance, time tracking, and role-based workflows
            </p>
          </div>

          <div className="flex gap-4">
            <Button size="lg" onClick={() => navigate("/auth")} className="shadow-lg">
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
              Sign In
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16 w-full max-w-4xl">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 space-y-3">
              <CheckCircle className="w-8 h-8 text-white" />
              <h3 className="text-xl font-semibold text-white">Task Management</h3>
              <p className="text-white/75">Create, assign, and track tasks with full CRUD operations</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 space-y-3">
              <Clock className="w-8 h-8 text-white" />
              <h3 className="text-xl font-semibold text-white">Time Tracking</h3>
              <p className="text-white/75">Track work hours with built-in timer and productivity reports</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 space-y-3">
              <Sparkles className="w-8 h-8 text-white" />
              <h3 className="text-xl font-semibold text-white">AI Assistance</h3>
              <p className="text-white/75">Generate task descriptions and get smart suggestions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;