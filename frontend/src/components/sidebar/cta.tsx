import { Button } from '@/components/ui/button';
import { LeakerFlowProcessModal } from '@/components/sidebar/leakerflow-enterprise-modal';

export function CTACard() {
  return (
    <div className="rounded-lg bg-brand-gradient p-0.5 shadow-sm transition-all">
      <div className="rounded-[7px] bg-background p-4 h-full">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              Enterprise Demo
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">
              Request custom AI Agents implementation
            </span>
          </div>

          <div>
            <LeakerFlowProcessModal>
              <Button className="w-full">
                Learn more
              </Button>
            </LeakerFlowProcessModal>
          </div>

        </div>
      </div>
    </div>
  );
}
