import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, ChevronRight, Layers, LayoutGrid, Cpu, Edit3 } from "lucide-react";

export default function LandingPage() {
  return (
    <>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-6 md:py-12 lg:py-16 xl:py-24">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Revolutionize Your Grading with AI Precision
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    IntelliGrade is an AI-powered platform that helps educators streamline
                    grading, provide insightful feedback, and enhance learning outcomes.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" className="gap-1">
                    Request a Demo <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline">
                    Learn More
                  </Button>
                </div>
              </div>
              <img
                src="https://placehold.co/550/orange/white"
                width={550}
                height={550}
                alt="AI Grading Dashboard Preview"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-6 md:py-12 lg:py-16 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
                  Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Unlock the Power of AI in Education
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl">
                  Discover the comprehensive features designed to support educators and
                  improve the grading process.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <LayoutGrid className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Dynamic Rubric Generation</CardTitle>
                  <CardDescription>
                    Effortlessly create, customize, and manage grading rubrics with AI
                    suggestions or from scratch.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Cpu className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>AI-Powered Grading</CardTitle>
                  <CardDescription>
                    Leverage Large Language Models for fast, consistent, and insightful
                    grading across various assignment types.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Edit3 className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Educator-in-the-Loop</CardTitle>
                  <CardDescription>
                    Review AI-generated scores, provide nuanced feedback, and maintain
                    full control over final evaluations.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Layers className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Modular Plugin Architecture</CardTitle>
                  <CardDescription>
                    Extend capabilities with specialized plugins for code analysis,
                    plagiarism detection, and more.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-6 md:py-12 lg:py-16">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
                  How It Works
                </div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Simple 4-Step Grading Process
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl">
                  Experience streamlined grading with our intuitive AI-powered workflow
                  designed for educators.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-8 py-12 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold">Create Rubric</h3>
                <p className="text-muted-foreground">
                  Generate custom grading rubrics with AI assistance or build from scratch
                  based on your assignment requirements.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold">Upload Submissions</h3>
                <p className="text-muted-foreground">
                  Batch upload student assignments in various formats including text,
                  code, PDFs, and more for automated processing.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold">AI Analysis</h3>
                <p className="text-muted-foreground">
                  Our AI engine evaluates submissions against your rubric, providing
                  initial scores and detailed feedback automatically.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  4
                </div>
                <h3 className="text-xl font-bold">Review & Finalize</h3>
                <p className="text-muted-foreground">
                  Review AI suggestions, make adjustments, add personal feedback, and
                  export final grades to your preferred format.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-6 md:py-12 lg:py-16 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
                  Pricing
                </div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Flexible Plans for Every Need
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl">
                  Choose the plan that's right for you, your department, or your
                  institution.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Individual</CardTitle>
                  <div className="text-4xl font-bold">
                    Free
                    <span className="text-sm font-normal text-muted-foreground">
                      /pilot
                    </span>
                  </div>
                  <CardDescription>
                    Perfect for individual educators exploring AI grading.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>AI-Assisted Rubric Creation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Basic AI Grading (Text-based)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Manual Review & Override</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Get Started</Button>
                </CardFooter>
              </Card>
              <Card className="border-primary">
                <CardHeader>
                  <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground mb-2">
                    Popular
                  </div>
                  <CardTitle>Department</CardTitle>
                  <div className="text-4xl font-bold">Contact Us</div>
                  <CardDescription>
                    Ideal for academic departments and larger teams.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Everything in Individual</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Advanced AI Grading (Code, PDF)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Basic Plugin Integrations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Team Collaboration Tools</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Basic Reporting</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Contact Sales</Button>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Institution</CardTitle>
                  <div className="text-4xl font-bold">Custom</div>
                  <CardDescription>
                    Comprehensive solution for universities and organizations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Everything in Department</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Full Plugin Access & Customization</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Advanced Analytics & Reporting</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Dedicated Support & Training</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>LMS Integration Options</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Contact Sales</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contact" className="w-full py-6 md:py-12 lg:py-16">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Ready to Enhance Your Grading Process?
                </h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Join educators who are leveraging IntelliGrade to save time, improve
                  feedback, and foster student success.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button size="lg" className="gap-1">
                  Request a Demo <ChevronRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline">
                  Explore Features
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t py-6 md:py-0 px-4 md:px-6 mb-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <div className="flex items-center gap-2">
            <Cpu className="h-6 w-6 text-primary" /> {/* Changed Icon */}
            <span className="text-lg font-bold">IntelliGrade</span> {/* Changed Name */}
          </div>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} IntelliGrade. All rights reserved.{" "}
            {/* Changed Name */}
          </p>
        </div>
      </footer>
    </>
  );
}
