'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Sparkles,
  Brain,
  GitBranch,
  Shield,
  Zap,
  Globe,
  Rocket,
  CheckCircle2,
  Star,
  Menu,
  X,
  Layers,
  Workflow,
  Cpu,
  Cloud,
} from 'lucide-react';
import { useState } from 'react';

const features = [
  { icon: Brain, title: 'AI Studio', description: 'Turn natural language into deployed applications with our 10-stage AI pipeline.' },
  { icon: GitBranch, title: 'Workflow Engine', description: 'Design and automate complex workflows with a visual drag-and-drop interface.' },
  { icon: Shield, title: 'Built-in Governance', description: 'Enterprise-grade security, compliance, and policy enforcement out of the box.' },
  { icon: Zap, title: 'Smart Generator', description: 'Generate production-ready code, content, and designs from high-level specifications.' },
  { icon: Globe, title: 'Multi-Platform Deploy', description: 'Deploy to any cloud provider with a single click — AWS, GCP, Azure, or Vercel.' },
  { icon: Rocket, title: 'Runtime Platform', description: 'Run and scale your applications with built-in monitoring, logging, and alerting.' },
];

const enterpriseFeatures = [
  { title: 'Single Sign-On', description: 'SAML, OAuth, and OpenID Connect support for enterprise identity management.' },
  { title: 'Audit Logging', description: 'Complete audit trail of all platform activities with search and export.' },
  { title: 'Role-Based Access', description: 'Fine-grained permissions with custom roles and team management.' },
  { title: 'Private Cloud', description: 'Deploy on your infrastructure with dedicated support and SLA guarantees.' },
];

const pricingPlans = [
  { name: 'Starter', price: '$0', period: '/month', features: ['3 projects', 'Basic AI Studio', 'Community support', '1 team member'], cta: 'Get Started', popular: false },
  { name: 'Pro', price: '$49', period: '/month', features: ['Unlimited projects', 'Full AI Studio', 'Priority support', 'Up to 10 team members', 'Custom integrations'], cta: 'Start Free Trial', popular: true },
  { name: 'Enterprise', price: '$199', period: '/month', features: ['Everything in Pro', 'Dedicated support', 'Unlimited team members', 'Private cloud option', 'Custom SLA', 'Audit logging'], cta: 'Contact Sales', popular: false },
];

const testimonials = [
  { quote: 'Platform transformed how we build applications. What used to take weeks now takes hours.', author: 'Sarah Chen', role: 'CTO, TechFlow Inc.', rating: 5 },
  { quote: 'The AI Studio is revolutionary. We generated our entire MVP in a single afternoon.', author: 'Marcus Johnson', role: 'Founder, DataVista', rating: 5 },
  { quote: 'Enterprise-grade governance without the complexity. Exactly what we needed.', author: 'Emily Rodriguez', role: 'Head of Engineering, SecureCorp', rating: 5 },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">P</div>
            <span className="font-bold text-gray-900 dark:text-white">Platform</span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Features</Link>
            <Link href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Pricing</Link>
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Sign In</Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600 md:hidden dark:text-gray-400">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 px-4 py-4 md:hidden dark:border-gray-800">
            <div className="flex flex-col gap-3">
              <Link href="#features" className="text-sm text-gray-600 dark:text-gray-400">Features</Link>
              <Link href="#pricing" className="text-sm text-gray-600 dark:text-gray-400">Pricing</Link>
              <Link href="/login" className="text-sm text-gray-600 dark:text-gray-400">Sign In</Link>
              <Link href="/register"><Button size="sm" className="w-full">Get Started</Button></Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="relative mx-auto max-w-7xl text-center">
          <Badge variant="secondary" className="mb-6 animate-fade-in">
            <Sparkles className="mr-1 h-3 w-3" />
            AI-Powered Development Platform
          </Badge>
          <h1 className="animate-fade-in-up mx-auto max-w-4xl text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl dark:text-white">
            Build Applications with{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Natural Language
            </span>
          </h1>
          <p className="animate-fade-in-up mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            From idea to deployment in minutes. Our AI-powered platform understands your vision,
            generates production-ready code, and deploys it to the cloud — all from a single prompt.
          </p>
          <div className="animate-fade-in-up flex items-center justify-center gap-4 mt-8">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start Building Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg">Learn More</Button>
            </Link>
          </div>
          <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-4 flex-wrap">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-500" /> No credit card</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-500" /> Free tier included</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-500" /> Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">Platform Features</Badge>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">Everything you need to build and scale</h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600 dark:text-gray-400">
              A complete platform for modern application development, from initial idea to production deployment.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-blue-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-800"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI Product Studio Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge className="mb-4 bg-white/20 text-white hover:bg-white/30">AI Product Studio</Badge>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">From Prompt to Production</h2>
              <p className="mt-4 text-lg text-blue-100">
                Describe your application in natural language and watch as our AI orchestrates a 10-stage pipeline:
              </p>
              <div className="mt-8 space-y-4">
                {[
                  { step: 'Conversation', desc: 'AI understands your requirements and asks clarifying questions' },
                  { step: 'Architecture', desc: 'Generates optimal system design and component structure' },
                  { step: 'Generation', desc: 'Creates production-ready code with best practices' },
                  { step: 'Deployment', desc: 'Deploys to your chosen cloud platform automatically' },
                ].map((item, i) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium text-white">{item.step}</p>
                      <p className="text-sm text-blue-200">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/register">
                <Button size="lg" variant="secondary" className="mt-8 gap-2">
                  Try AI Studio <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="hidden lg:block">
              <div className="rounded-xl border border-white/20 bg-white/10 p-8 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-white/60 text-sm mb-6">
                  <Layers className="h-4 w-4" /> Build Pipeline
                </div>
                <div className="space-y-3">
                  {['Conversation', 'Questions', 'Context', 'Architecture', 'Knowledge', 'Composer', 'Generator', 'Evaluation', 'Deployment', 'Workspace'].map((stage, i) => (
                    <div key={stage} className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${i < 3 ? 'bg-green-400' : 'bg-white/30'}`} />
                      <span className={`text-sm ${i < 3 ? 'text-white' : 'text-white/50'}`}>{stage}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Features */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">Enterprise</Badge>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">Built for organizations</h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600 dark:text-gray-400">
              Enterprise-grade security, compliance, and support for teams of any size.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {enterpriseFeatures.map((feat) => (
              <div key={feat.title} className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white">{feat.title}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="bg-gray-50 px-4 py-20 sm:px-6 lg:px-8 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">Pricing</Badge>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">Simple, transparent pricing</h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600 dark:text-gray-400">
              Start free, scale as you grow. No hidden fees.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border bg-white p-8 dark:bg-gray-800 ${
                  plan.popular
                    ? 'border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {plan.popular && (
                  <Badge variant="default" className="mb-4">Most Popular</Badge>
                )}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                  <span className="text-gray-500 dark:text-gray-400">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button className="mt-8 w-full" variant={plan.popular ? 'default' : 'outline'}>
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Loved by developers</h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600 dark:text-gray-400">
              Hear from teams that have transformed their development workflow.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.author} className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <p className="font-medium text-gray-900 dark:text-white">{t.author}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to transform your development workflow?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-blue-100">
            Join thousands of teams using Platform to build, deploy, and scale applications faster than ever.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                Start Building Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 py-12 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">P</div>
                <span className="font-bold text-gray-900 dark:text-white">Platform</span>
              </div>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                AI-powered application development platform.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Product</h4>
              <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="#features">Features</Link></li>
                <li><Link href="#pricing">Pricing</Link></li>
                <li><Link href="/studio">AI Studio</Link></li>
                <li><Link href="/integrations">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Company</h4>
              <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><span className="cursor-default">About</span></li>
                <li><span className="cursor-default">Blog</span></li>
                <li><span className="cursor-default">Careers</span></li>
                <li><span className="cursor-default">Contact</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Legal</h4>
              <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><span className="cursor-default">Privacy</span></li>
                <li><span className="cursor-default">Terms</span></li>
                <li><span className="cursor-default">Security</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
