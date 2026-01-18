'use client';

import Link from 'next/link';
import { Image, Database, ArrowRight, Sparkles, Zap, BarChart3, Box } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';

// Animated floating particles
function FloatingParticles() {
  const [particles, setParticles] = useState<Array<{ left: string; top: string; delay: string; duration: string }>>([]);

  useEffect(() => {
    const newParticles = [...Array(20)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      duration: `${2 + Math.random() * 3}s`,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-primary/20 rounded-full animate-pulse"
          style={{
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}

// Interactive 3D cube animation
function AnimatedCube() {
  const [rotation, setRotation] = useState({ x: -20, y: 45 });

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => ({
        x: prev.x,
        y: (prev.y + 0.5) % 360,
      }));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="w-24 h-24 relative preserve-3d cursor-pointer hover:scale-110 transition-transform"
      style={{
        transformStyle: 'preserve-3d',
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
      }}
      onMouseEnter={() => setRotation(prev => ({ ...prev, x: -30 }))}
      onMouseLeave={() => setRotation(prev => ({ ...prev, x: -20 }))}
    >
      {/* Front */}
      <div
        className="absolute w-24 h-24 bg-gradient-to-br from-emerald-400/80 to-teal-500/80 border border-white/20 backdrop-blur-sm flex items-center justify-center"
        style={{ transform: 'translateZ(48px)' }}
      >
        <Image className="w-8 h-8 text-white" />
      </div>
      {/* Back */}
      <div
        className="absolute w-24 h-24 bg-gradient-to-br from-violet-400/80 to-purple-500/80 border border-white/20 backdrop-blur-sm flex items-center justify-center"
        style={{ transform: 'rotateY(180deg) translateZ(48px)' }}
      >
        <Database className="w-8 h-8 text-white" />
      </div>
      {/* Right */}
      <div
        className="absolute w-24 h-24 bg-gradient-to-br from-blue-400/80 to-cyan-500/80 border border-white/20 backdrop-blur-sm flex items-center justify-center"
        style={{ transform: 'rotateY(90deg) translateZ(48px)' }}
      >
        <BarChart3 className="w-8 h-8 text-white" />
      </div>
      {/* Left */}
      <div
        className="absolute w-24 h-24 bg-gradient-to-br from-pink-400/80 to-rose-500/80 border border-white/20 backdrop-blur-sm flex items-center justify-center"
        style={{ transform: 'rotateY(-90deg) translateZ(48px)' }}
      >
        <Box className="w-8 h-8 text-white" />
      </div>
      {/* Top */}
      <div
        className="absolute w-24 h-24 bg-gradient-to-br from-amber-400/80 to-orange-500/80 border border-white/20 backdrop-blur-sm flex items-center justify-center"
        style={{ transform: 'rotateX(90deg) translateZ(48px)' }}
      >
        <Zap className="w-8 h-8 text-white" />
      </div>
      {/* Bottom */}
      <div
        className="absolute w-24 h-24 bg-gradient-to-br from-indigo-400/80 to-blue-500/80 border border-white/20 backdrop-blur-sm flex items-center justify-center"
        style={{ transform: 'rotateX(-90deg) translateZ(48px)' }}
      >
        <Sparkles className="w-8 h-8 text-white" />
      </div>
    </div>
  );
}

// Stats counter animation
function AnimatedCounter({ end, label }: { end: number; label: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let current = 0;
    const step = end / 30;
    const interval = setInterval(() => {
      current += step;
      if (current >= end) {
        setCount(end);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, 50);
    return () => clearInterval(interval);
  }, [end]);

  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
        {count}+
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

// Feature cards with I18n
function FeatureCards({ t }: { t: (key: string) => string }) {
  const features = [
    {
      title: t('home.card.i2p.title'),
      description: t('home.card.i2p.desc'),
      icon: Image,
      href: '/image-to-points',
      gradient: 'from-emerald-500 to-teal-600',
      features: [t('home.tag.grayscale'), t('home.tag.region'), t('home.tag.histogram'), t('home.tag.export')],
    },
    {
      title: t('home.card.p2i.title'),
      description: t('home.card.p2i.desc'),
      icon: Database,
      href: '/points-to-image',
      gradient: 'from-violet-500 to-purple-600',
      features: [t('home.tag.import'), t('home.tag.generate'), t('home.tag.3dView'), t('home.tag.export')],
    },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto mb-12">
      {features.map((feature, idx) => {
        const Icon = feature.icon;
        return (
          <Link key={feature.href} href={feature.href} className="block group">
            <Card className="h-full border-2 transition-all duration-500 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 overflow-hidden relative">
              {/* Animated background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

              <CardHeader className="relative">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {feature.title}
                  <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </CardTitle>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex flex-wrap gap-2">
                  {feature.features.map((f, i) => (
                    <Badge
                      key={f}
                      variant="secondary"
                      className="text-xs transition-all duration-300"
                      style={{ transitionDelay: `${i * 50}ms` }}
                    >
                      {f}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

// ... (AnimateCube and AnimatedCounter components remain same)

import { useI18n } from '@/lib/i18n-context';

export default function HomePage() {
  const { t } = useI18n();

  return (
    <div className="relative min-h-screen">
      <FloatingParticles />

      <div className="container max-w-screen-xl mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 md:mb-16 relative">
          <Badge variant="secondary" className="mb-4 animate-pulse">
            <Sparkles className="w-3 h-3 mr-1" />
            {t('home.hero.subtitle')}
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
            {t('home.hero.title')}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {t('home.hero.description')}
          </p>

          {/* Interactive 3D Cube */}
          <div className="flex justify-center mb-8" style={{ perspective: '600px' }}>
            <AnimatedCube />
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/image-to-points">
              <Button size="lg" className="gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                <Zap className="w-4 h-4" />
                {t('home.start')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-12 md:mb-16 p-4 rounded-xl bg-muted/30 border border-border/50">
          <AnimatedCounter end={256} label={t('home.stats.grayLevels')} />
          <AnimatedCounter end={100} label={t('home.stats.exportFormats')} />
          <AnimatedCounter end={360} label={t('home.stats.3dView')} />
        </div>

        {/* Feature Cards */}
        <FeatureCards t={t} />

        {/* Workflow Section */}
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">{t('home.workflow.title')}</h2>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
            {[
              { icon: Image, label: t('home.workflow.upload'), color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { icon: BarChart3, label: t('home.workflow.analyze'), color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { icon: Box, label: t('home.workflow.3d'), color: 'text-violet-500', bg: 'bg-violet-500/10' },
            ].map((step, idx) => (
              <div key={step.label} className="flex items-center gap-4">
                <div className={`flex items-center gap-3 p-4 rounded-xl ${step.bg} border border-border hover:scale-105 transition-transform cursor-default`}>
                  <step.icon className={`w-6 h-6 ${step.color}`} />
                  <span className="font-medium">{step.label}</span>
                </div>
                {idx < 2 && (
                  <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90 md:rotate-0 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CSS for gradient animation */}
      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% center; }
          50% { background-position: 100% center; }
          100% { background-position: 0% center; }
        }
        .animate-gradient {
          animation: gradient 4s ease infinite;
        }
      `}</style>
    </div>
  );
}
