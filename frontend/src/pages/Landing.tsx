import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  BookOpen, 
  Sparkles, 
  FileText, 
  Layers, 
  Brain, 
  Zap,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  Clock,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const features = [
  {
    icon: FileText,
    title: "Smart Summaries",
    description: "Get TL;DR and key takeaways from any chapter instantly",
  },
  {
    icon: BookOpen,
    title: "Key Terms",
    description: "Automatically extract and explain important vocabulary",
  },
  {
    icon: Layers,
    title: "Interactive Flashcards",
    description: "Flip cards for active recall and better retention",
  },
  {
    icon: Brain,
    title: "Practice Quizzes",
    description: "Test your knowledge with auto-generated questions",
  },
];

const benefits = [
  "Grade-appropriate difficulty levels (1-12)",
  "Multiple language support",
  "Instant generation from any text",
  "Interactive study tools",
  "Track your quiz scores",
  "No credit card required",
];

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg gradient-primary">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl text-foreground">Notepilot</span>
            </div>
            <nav className="flex items-center gap-4">
              {user ? (
                <Link to="/app">
                  <Button className="gradient-primary text-primary-foreground">
                    Go to App
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth">
                    <Button variant="ghost" className="text-foreground">
                      Sign in
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button className="gradient-primary text-primary-foreground">
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
              >
                <Sparkles className="w-4 h-4" />
                AI-Powered Study Materials
              </motion.div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
                <span className="text-foreground">Transform any chapter into</span>
                <br />
                <span className="text-gradient">study materials in seconds</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Paste your textbook content and get AI-generated summaries, flashcards, 
                key terms, and quizzes tailored to your grade level.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/auth">
                  <Button size="lg" className="h-14 px-8 text-lg font-semibold gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all">
                    <Zap className="w-5 h-5 mr-2" />
                    Start Free
                  </Button>
                </Link>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span>No credit card required</span>
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-3 gap-8 max-w-lg mx-auto mt-16"
            >
              {[
                { icon: GraduationCap, value: "K-12", label: "Grade Levels" },
                { icon: Clock, value: "<30s", label: "Generation Time" },
                { icon: Target, value: "100%", label: "Free to Use" },
              ].map((stat, index) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-display font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Everything you need to study smarter
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our AI analyzes your content and creates comprehensive study materials automatically
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                  Why students love Notepilot
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Our AI understands your grade level and creates materials that match your learning needs.
                </p>
                <ul className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <motion.li
                      key={benefit}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-6 h-6 rounded-full gradient-accent flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-accent-foreground" />
                      </div>
                      <span className="text-foreground">{benefit}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="aspect-square rounded-3xl gradient-hero p-8 flex items-center justify-center">
                  <div className="text-center text-primary-foreground">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <BookOpen className="w-24 h-24 mx-auto mb-6" />
                    </motion.div>
                    <p className="text-2xl font-display font-bold">
                      Study Smarter
                    </p>
                    <p className="text-primary-foreground/80">
                      Not Harder
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="rounded-3xl gradient-primary p-12 md:p-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
                Ready to transform your study sessions?
              </h2>
              <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                Join thousands of students who are already studying smarter with AI-powered materials.
              </p>
              <Link to="/auth">
                <Button size="lg" className="h-14 px-8 text-lg font-semibold bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg">
                  Get Started for Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg gradient-primary">
                  <BookOpen className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-display font-semibold text-foreground">Notepilot</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Making learning easier, one chapter at a time
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
