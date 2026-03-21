import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AppTooltipProps {
  children: React.ReactNode;
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  className?: string;
}

export const AppTooltip = ({ 
  children, 
  content, 
  side = "top",
  sideOffset = 4,
  className 
}: AppTooltipProps) => {
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent 
        side={side} 
        sideOffset={sideOffset}
        className={className}
      >
        <p className="text-xs font-medium">{content}</p>
      </TooltipContent>
    </Tooltip>
  );
};
