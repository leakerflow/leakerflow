'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Bot,
  Briefcase,
  Settings,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Users,
  Shield,
  Zap,
  Target,
  Brain,
  Globe,
  Heart,
  PenTool,
  Code,
  Camera,
  Calendar,
  DollarSign,
  Rocket,
} from 'lucide-react';

type PromptExample = {
  title: string;
  query: string;
  icon: React.ReactNode;
};

const allPrompts: PromptExample[] = [
  {
    title: 'Track latest GTA 6 leaks',
    query: '1. Collect GTA 6 leaks from {{sources}} (Twitter, Reddit, YouTube)\n2. Extract date, author, media links and credibility\n3. Group by theme (map, gameplay, characters, release)\n4. Create a summary and a timeline of major rumors',
    icon: <Globe className="text-blue-700 dark:text-blue-400" size={16} />,
  },
  {
    title: 'Summarize Rockstar Newswire updates',
    query: '1. Fetch the latest Rockstar Newswire posts about GTA 6\n2. Extract key info: features, dates, media, quotes\n3. Generate a concise brief + bullet highlights\n4. Suggest SEO title and meta description',
    icon: <PenTool className="text-indigo-700 dark:text-indigo-400" size={16} />,
  },
  {
    title: 'Analyze GTA 6 trailer frame-by-frame',
    query: '1. Break down {{trailer_url}} into scenes and key frames\n2. Identify locations, vehicles, NPCs and UI hints\n3. Compare with known GTA 5 assets and rumors\n4. Produce insights and speculation with confidence notes',
    icon: <Camera className="text-stone-700 dark:text-stone-400" size={16} />,
  },
  {
    title: 'Create GTA 6 mod roadmap',
    query: '1. Define a {{mod_type}} mod concept (goal, scope, platform)\n2. List required tools, dependencies and assets\n3. Plan milestones, tasks and estimated effort\n4. Prepare release checklist and changelog template',
    icon: <Code className="text-emerald-700 dark:text-emerald-400" size={16} />,
  },
  {
    title: 'YouTube script: GTA 6 news roundup',
    query: '1. Outline a 6–8 min script on {{topic}}\n2. Hook, context, 3–4 key updates, analysis, CTA\n3. Add timestamps and on-screen b-roll cues\n4. Generate SEO title, description and tags',
    icon: <Rocket className="text-green-600 dark:text-green-300" size={16} />,
  },
  {
    title: 'Compare GTA 6 map theories',
    query: '1. Gather top community map theories from {{subreddits}} and forums\n2. Compare evidence, sources and contradictions\n3. Visualize a table of claims vs credibility\n4. Summarize consensus and open questions',
    icon: <Brain className="text-fuchsia-700 dark:text-fuchsia-400" size={16} />,
  },
  {
    title: 'Social calendar for a GTA 6 channel',
    query: '1. Build a {{duration}} content plan for {{platforms}}\n2. Mix formats: news, leaks, memes, shorts, guides\n3. Schedule {{posts_per_week}} posts with captions and hashtags\n4. Add KPIs and weekly review checklist',
    icon: <Calendar className="text-rose-700 dark:text-rose-400" size={16} />,
  },
  {
    title: 'Extract GTA 6 rumors from Reddit',
    query: '1. Scan {{subreddits}} for GTA 6 rumor threads\n2. Capture claim, source, link, date and sentiment\n3. Cluster by feature area (map, AI, police, multiplayer)\n4. Output CSV and short summary',
    icon: <Users className="text-blue-600 dark:text-blue-300" size={16} />,
  },
  {
    title: 'SEO keywords for GTA 6 article',
    query: '1. Generate keyword set for {{article_topic}}\n2. Map primary + secondary keywords and intent\n3. Draft title H1 and meta description (<160 chars)\n4. Suggest internal links and anchor text',
    icon: <Target className="text-cyan-700 dark:text-cyan-400" size={16} />,
  },
  {
    title: 'Thumbnail ideas for GTA 6 video',
    query: '1. Propose 5 thumbnail concepts for {{video_topic}}\n2. Include text overlays (max 4 words) and color palette\n3. Suggest focal subject and composition\n4. Provide A/B test notes',
    icon: <Zap className="text-yellow-600 dark:text-yellow-300" size={16} />,
  },
  {
    title: 'Sentiment on GTA 6 hashtags',
    query: '1. Track {{hashtags}} over {{time_period}}\n2. Extract volume, reach and engagement proxies\n3. Analyze sentiment and top creators\n4. Summarize insights and timing recommendations',
    icon: <TrendingUp className="text-pink-700 dark:text-pink-400" size={16} />,
  },
  {
    title: 'Fact-check a GTA 6 claim',
    query: '1. Verify the claim: "{{claim}}"\n2. Cross-check sources (Newswire, official channels, dev interviews)\n3. Rate confidence and list evidence\n4. Produce a short verdict for social',
    icon: <Shield className="text-red-700 dark:text-red-400" size={16} />,
  },
];

// Function to get random prompts
const getRandomPrompts = (count: number = 3): PromptExample[] => {
  const shuffled = [...allPrompts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const Examples = ({
  onSelectPrompt,
  count = 3,
}: {
  onSelectPrompt?: (query: string) => void;
  count?: number;
}) => {
  const [displayedPrompts, setDisplayedPrompts] = useState<PromptExample[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize with random prompts on mount
  useEffect(() => {
    setDisplayedPrompts(getRandomPrompts(count));
  }, [count]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setDisplayedPrompts(getRandomPrompts(count));
    setTimeout(() => setIsRefreshing(false), 300);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="group relative">
        <div className="flex gap-2 justify-center py-2 flex-wrap">
          {displayedPrompts.map((prompt, index) => (
            <motion.div
              key={`${prompt.title}-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.3,
                delay: index * 0.03,
                ease: "easeOut"
              }}
            >
              <Button
                variant="outline"
                className="w-fit h-fit px-3 py-2 rounded-full border-neutral-200 dark:border-neutral-800 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-sm font-normal text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => onSelectPrompt && onSelectPrompt(prompt.query)}
              >
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0">
                    {React.cloneElement(prompt.icon as React.ReactElement, { size: 14 })}
                  </div>
                  <span className="whitespace-nowrap">{prompt.title}</span>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Refresh button that appears on hover */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="absolute -top-4 right-1 h-5 w-5 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <RefreshCw size={10} className="text-muted-foreground" />
          </motion.div>
        </Button>
      </div>
    </div>
  );
};
