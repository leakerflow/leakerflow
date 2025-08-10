import Link from 'next/link';
import { Briefcase, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KortixProcessModal } from '@/components/sidebar/kortix-enterprise-modal';

export function CTACard() {
  return (
    <div className="rounded-xl bg-brand-gradient shadow-sm border border-transparent p-4 transition-all">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">
            Enterprise Demo
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">
          Request custom AI Agents implementation
          </span>
        </div>

        <div>
          <KortixProcessModal>
            <Button className="w-full">
              Learn more
            </Button>
          </KortixProcessModal>
        </div>

      </div>
    </div>
  );
}
