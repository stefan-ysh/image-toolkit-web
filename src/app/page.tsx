"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import {
  Scan,
  Activity,
  Box,
  ArrowRight,
  Binary,
  Sparkles,
} from "lucide-react";
import { DitherShader } from "@/components/ui/dither-shader";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n-context";
import { motion, type Easing } from "framer-motion";

const easeOut: Easing = [0.6, 0.01, 0.05, 0.95]; // Custom ease curve

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: easeOut },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const scaleIn = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.5, ease: easeOut },
  },
};

export default function HomePage() {
  const { t } = useI18n();

  // Animated dither effect state
  const [gridSize, setGridSize] = useState(2);
  const [direction, setDirection] = useState(1); // 1 = up, -1 = down

  useEffect(() => {
    // Animate gridSize: 2→3→4→5→6→5→4→3→2→3... (pingpong)
    const gridInterval = setInterval(() => {
      setGridSize((prev) => {
        const next = prev + direction;
        if (next > 6) {
          setDirection(-1);
          return 5;
        }
        if (next < 1) {
          setDirection(1);
          return 1;
        }
        return next;
      });
    }, 100);

    return () => {
      clearInterval(gridInterval);
    };
  }, [direction]);

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      {/* Abstract Technical Grid Background */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #808080 1px, transparent 1px), linear-gradient(to bottom, #808080 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Animated Gradient Orbs */}
      <motion.div
        className="absolute top-20 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/10 blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-40 -right-32 w-80 h-80 rounded-full bg-gradient-to-br from-cyan-500/15 to-blue-500/10 blur-3xl"
        animate={{
          x: [0, -40, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-cyan-500/5 to-transparent blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-cyan-400/60"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}

      {/* Animated Lines */}
      <motion.div
        className="absolute top-32 right-20 w-px h-32 bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent"
        animate={{
          opacity: [0, 1, 0],
          scaleY: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-48 left-32 w-px h-24 bg-gradient-to-b from-transparent via-purple-500/30 to-transparent"
        animate={{
          opacity: [0, 1, 0],
          scaleY: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      <div className="container max-w-screen-xl mx-auto px-4 py-16 md:py-24 relative z-10">
        {/* Academic Header Section */}
        <motion.div
          className="max-w-4xl mx-auto text-center mb-16 md:mb-24"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-secondary text-secondary-foreground text-xs font-mono mb-6 tracking-wider uppercase"
          >
            <img src="/logo.png" alt="Logo" className="w-4 h-4 mr-1" />
            v2.0.0 | Research Edition
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 font-serif"
          >
            <motion.span
              className="bg-gradient-to-r from-foreground via-cyan-500 to-foreground bg-[length:200%_auto] bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ["0% center", "200% center"],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              {t("home.hero.title")}
            </motion.span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-xl md:text-2xl text-muted-foreground font-light max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            {t("home.hero.subtitle")}
          </motion.p>

          <motion.p
            variants={fadeInUp}
            className="text-base text-muted-foreground/80 max-w-3xl mx-auto mb-10 leading-7"
          >
            {t("home.hero.description")}
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link href="/image-to-points">
              <Button
                size="lg"
                className="h-12 px-8 rounded-none border-2 border-primary bg-primary text-primary-foreground hover:bg-primary/90 font-mono tracking-wide"
              >
                {t("home.start")} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link
              href="https://github.com/stefan-ysh/image-toolkit-web"
              target="_blank"
            >
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 rounded-none border-2 font-mono tracking-wide"
              >
                GitHub / Docs
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Dither Shader Showcase Section */}
        <motion.div
          className="w-full mx-auto mb-24"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="grid md:grid-cols-2 gap-0 border-2 border-border/60 overflow-hidden bg-card/30 backdrop-blur-sm">
            {/* Dither Shader Image */}
            <div className="relative h-64 md:h-80 lg:h-96 bg-background">
              <DitherShader
                src="/dither-showcase.png"
                gridSize={gridSize}
                ditherMode="bayer"
                colorMode="original"
                animated={true}
                animationSpeed={0.01}
                className="w-full h-full"
              />
              {/* <div className="absolute bottom-3 left-3 flex gap-2">
                <Badge variant="secondary" className="font-mono text-xs rounded-none bg-background/80 backdrop-blur-sm">
                  BAYER
                </Badge>
                <Badge variant="secondary" className="font-mono text-xs rounded-none bg-background/80 backdrop-blur-sm">
                  SIZE: {Math.round(gridSize)}
                </Badge>
              </div> */}
            </div>

            {/* Feature Description */}
            <div className="p-8 flex flex-col justify-center border-t md:border-t-0 md:border-l border-border/60 bg-muted/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-serif">{t("home.dither.title")}</h3>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {t("home.dither.desc")}
              </p>
              <ul className="space-y-3 text-sm font-mono">
                <li className="flex items-center gap-3 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                  {t("home.dither.modes")}
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                  {t("home.dither.colors")}
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                  {t("home.dither.animation")}
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Methodology / Analysis Steps */}
        <motion.div
          className="grid md:grid-cols-3 gap-8 mb-24 border-t border-b border-border py-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="space-y-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-secondary text-primary mb-4">
              <Scan className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-serif">
              {t("home.steps.upload")}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("home.features.grayscale.desc")}
            </p>
            <ul className="text-xs text-muted-foreground space-y-2 mt-4 font-mono">
              <li className="flex items-center gap-2">
                • RAW / PNG / JPG Support
              </li>
              <li className="flex items-center gap-2">
                • Linear Normalization
              </li>
              <li className="flex items-center gap-2">• Auto-Calibration</li>
            </ul>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="space-y-4 md:border-l border-border md:pl-8"
          >
            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-secondary text-primary mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-serif">
              {t("home.steps.analyze")}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("home.features.analysis.desc")}
            </p>
            <ul className="text-xs text-muted-foreground space-y-2 mt-4 font-mono">
              <li className="flex items-center gap-2">
                • Histogram Generation
              </li>
              <li className="flex items-center gap-2">
                • Statistical Distribution
              </li>
              <li className="flex items-center gap-2">• Pixel Profiling</li>
            </ul>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="space-y-4 md:border-l border-border md:pl-8"
          >
            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-secondary text-primary mb-4">
              <Box className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-serif">
              {t("home.steps.3d")}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("home.features.3d.desc")}
            </p>
            <ul className="text-xs text-muted-foreground space-y-2 mt-4 font-mono">
              <li className="flex items-center gap-2">
                • Point Cloud Generation
              </li>
              <li className="flex items-center gap-2">• Height Map Scaling</li>
              <li className="flex items-center gap-2">
                • Interactive Viewport
              </li>
            </ul>
          </motion.div>
        </motion.div>

        {/* Unified Workbench Entry */}
        <div className="w-full mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold font-serif mb-2">
              {t("common.title")}
            </h2>
            <p className="text-muted-foreground text-sm font-mono">
              SYSTEM_MODULE: WORKBENCH_CORE
            </p>
          </motion.div>

          <Link href="/image-to-points" className="block group">
            <motion.div
              initial="hidden"
              whileInView="visible"
              whileHover={{ scale: 1.02 }}
              viewport={{ once: true }}
              variants={scaleIn}
            >
              <Card className="border-2 border-border/60 hover:border-primary transition-colors duration-300 bg-card/50 backdrop-blur-sm">
                <div className="grid md:grid-cols-2">
                  <div className="p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-border/60">
                    <CardTitle className="text-2xl font-serif mb-4 group-hover:text-primary transition-colors">
                      {t("home.card.unified.title")}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed mb-6">
                      {t("home.card.unified.desc")}
                    </CardDescription>
                    <div className="flex flex-wrap gap-2 mt-auto">
                      {[
                        { label: t("home.tag.grayscale") },
                        { label: t("home.tag.region") },
                        { label: t("home.tag.histogram") },
                        { label: t("home.tag.3dView") },
                      ].map((tag) => (
                        <Badge
                          key={tag.label}
                          variant="outline"
                          className="font-mono text-xs rounded-none border-primary/20 text-foreground/80"
                        >
                          {tag.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="p-8 bg-muted/20 flex flex-col justify-between">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-background border border-border rounded-sm">
                        <h4 className="font-mono text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                          {t("home.stats.grayLevels")}
                        </h4>
                        <span className="text-2xl font-bold">256</span>
                      </div>
                      <div className="p-4 bg-background border border-border rounded-sm">
                        <h4 className="font-mono text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                          {t("home.stats.3dView")}
                        </h4>
                        <span className="text-2xl font-bold">WebGL</span>
                      </div>
                    </div>
                    <Button
                      className="w-full rounded-none group-hover:bg-cyan-500 group-hover:text-white transition-all font-bold tracking-wide"
                      variant="secondary"
                    >
                      Launch Platform <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </Link>
        </div>

        {/* Footer / Citation Style */}
        <motion.div
          className="mt-32 pt-8 border-t border-border text-center text-xs text-muted-foreground font-mono"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p>© 2024 Image Analysis Platform. Academic License.</p>
          <p className="mt-2">
            Developed for quantitative research and educational visualization.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
